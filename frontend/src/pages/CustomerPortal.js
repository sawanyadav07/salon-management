import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const timeSlots = [];
for (let hour = 9; hour <= 20; hour += 1) {
  timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
  timeSlots.push(`${String(hour).padStart(2, '0')}:30`);
}

const today = new Date().toISOString().split('T')[0];

const emptyBooking = {
  staffId: '',
  services: [],
  date: today,
  timeSlot: '',
  notes: ''
};

const statusClassMap = {
  scheduled: 'badge-scheduled',
  confirmed: 'badge-confirmed',
  'in-progress': 'badge-inprogress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled'
};

const paymentClassMap = {
  pending: 'badge-pending',
  paid: 'badge-paid',
  partial: 'badge-confirmed'
};

const activeAppointmentStatuses = ['scheduled', 'confirmed', 'in-progress'];

const toNumber = (value) => Number(value);
const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;
const toStatusLabel = (value) => {
  if (!value) return 'Unknown';
  return String(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getAppointmentDateTime = (appointment) => {
  const dateValue = new Date(appointment.date);
  if (Number.isNaN(dateValue.getTime())) return null;
  const [hour = '0', minute = '0'] = String(appointment.timeSlot || '00:00').split(':');
  dateValue.setHours(Number(hour), Number(minute), 0, 0);
  return dateValue;
};

const normalizeVoiceText = (value = '') => String(value)
  .toLowerCase()
  .replace(/a\.m\.|a\.m|am/g, ' am ')
  .replace(/p\.m\.|p\.m|pm/g, ' pm ')
  .replace(/(\d)(am|pm)\b/g, '$1 $2')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseVoiceDate = (transcript) => {
  const text = normalizeVoiceText(transcript);
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (/\btoday\b/.test(text)) return toLocalDate(date);
  if (/\btomorrow\b/.test(text)) {
    date.setDate(date.getDate() + 1);
    return toLocalDate(date);
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const weekday = weekdays.find((item) => new RegExp(`\\b${item}\\b`).test(text));
  if (weekday) {
    const targetDay = weekdays.indexOf(weekday);
    let distance = (targetDay - date.getDay() + 7) % 7;
    if (/\bnext\b/.test(text) || distance === 0) distance += 7;
    date.setDate(date.getDate() + distance);
    return toLocalDate(date);
  }

  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const namedDate = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/)
    || text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (namedDate) {
    const day = Number(namedDate[1].match(/^\d/) ? namedDate[1] : namedDate[2]);
    const monthName = namedDate[1].match(/^\d/) ? namedDate[2] : namedDate[1];
    const parsed = new Date(date.getFullYear(), months.indexOf(monthName), day);
    if (parsed >= date) return toLocalDate(parsed);
    parsed.setFullYear(parsed.getFullYear() + 1);
    return toLocalDate(parsed);
  }

  return '';
};

const parseVoiceTime = (transcript) => {
  const numberWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
    seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
  };
  const text = normalizeVoiceText(transcript)
    .replace(/\bnoon\b|\bmidday\b/g, '12 pm')
    .replace(/\bmorning\b/g, 'am')
    .replace(/\bafternoon\b|\bevening\b|\bnight\b/g, 'pm')
    .replace(/\bo clock\b/g, '');
  const numericMatch = text.match(/\b(\d{1,2})(?:\s+(00|30))?\s*(am|pm)\b/);
  const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+(thirty))?\s*(am|pm)\b/);
  const match = numericMatch || wordMatch;
  if (!match) return '';

  const hour = numericMatch ? Number(match[1]) : numberWords[match[1]];
  const minute = match[2] === 'thirty' || match[2] === '30' ? 30 : 0;
  const period = match[3];
  if (!hour || hour > 12) return '';
  const hour24 = period === 'pm' ? (hour % 12) + 12 : hour % 12;
  const slot = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return timeSlots.includes(slot) ? slot : '';
};

const findVoiceMatches = (items, transcript, multiple = false) => {
  const text = normalizeVoiceText(transcript);
  const matches = items.filter((item) => {
    const name = normalizeVoiceText(item.name);
    const compactName = name.replace(/\s/g, '');
    const compactText = text.replace(/\s/g, '');
    return name.length > 2 && (text.includes(name) || compactText.includes(compactName));
  });
  return multiple ? matches : matches[0];
};

export default function CustomerPortal() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState({});
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(() => (
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
      ? 'Press Start Voice Booking, then allow microphone access.'
      : 'Voice booking is available in Chrome or Edge. Please open this page in one of those browsers.'
  ));
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported] = useState(() => (
    typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  ));
  const bookingFormRef = useRef(emptyBooking);
  const servicesRef = useRef([]);
  const staffRef = useRef([]);
  const availabilityRef = useRef({});
  const recognitionRef = useRef(null);
  const voiceSessionRef = useRef(false);
  const awaitingVoiceConfirmationRef = useRef(false);
  const bookingInProgressRef = useRef(false);

  useEffect(() => { bookingFormRef.current = bookingForm; }, [bookingForm]);
  useEffect(() => { servicesRef.current = services; }, [services]);
  useEffect(() => { staffRef.current = staff; }, [staff]);
  useEffect(() => { availabilityRef.current = availability; }, [availability]);

  useEffect(() => () => {
    voiceSessionRef.current = false;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const updateBookingForm = (nextForm) => {
    bookingFormRef.current = nextForm;
    setBookingForm(nextForm);
  };

  const fetchCatalog = async () => {
    const [servicesRes, staffRes] = await Promise.all([
      axios.get('/api/customer/services'),
      axios.get('/api/customer/staff')
    ]);
    setServices(servicesRes.data);
    setStaff(staffRes.data);
  };

  const fetchMyAppointments = async () => {
    const response = await axios.get('/api/customer/appointments');
    setAppointments(response.data);
  };

  const fetchAvailability = async (date) => {
    const response = await axios.get(`/api/customer/availability?date=${date}`);
    setAvailability(response.data.bookedByStaff || {});
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await Promise.all([
          fetchCatalog(),
          fetchMyAppointments(),
          fetchAvailability(bookingForm.date)
        ]);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Unable to load customer portal'));
      } finally {
        setLoadingData(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!bookingForm.date) return;
    fetchAvailability(bookingForm.date).catch((err) => {
      toast.error(getApiErrorMessage(err, 'Unable to load slot availability'));
    });
  }, [bookingForm.date]);

  const toggleService = (serviceId) => {
    setBookingForm((current) => {
      const nextForm = {
      ...current,
      services: current.services.includes(serviceId)
        ? current.services.filter((item) => item !== serviceId)
        : [...current.services, serviceId]
      };
      bookingFormRef.current = nextForm;
      return nextForm;
    });
  };

  const selectedServiceRows = useMemo(
    () => services.filter((item) => bookingForm.services.includes(item.id)),
    [services, bookingForm.services]
  );

  const totalAmount = useMemo(
    () => selectedServiceRows.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedServiceRows]
  );

  const bookedSlotsForSelectedStaff = useMemo(() => {
    if (!bookingForm.staffId) return [];
    return availability[String(bookingForm.staffId)] || [];
  }, [availability, bookingForm.staffId]);

  const selectedStaff = useMemo(
    () => staff.find((member) => String(member.id) === String(bookingForm.staffId)),
    [staff, bookingForm.staffId]
  );

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((item) => activeAppointmentStatuses.includes(item.status))
      .filter((item) => {
        const appointmentDate = getAppointmentDateTime(item);
        return appointmentDate ? appointmentDate >= now : false;
      })
      .sort((a, b) => {
        const aTime = getAppointmentDateTime(a)?.getTime() || 0;
        const bTime = getAppointmentDateTime(b)?.getTime() || 0;
        return aTime - bTime;
      });
  }, [appointments]);

  const completedAppointments = useMemo(
    () => appointments.filter((item) => item.status === 'completed'),
    [appointments]
  );

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aTime = getAppointmentDateTime(a)?.getTime() || 0;
      const bTime = getAppointmentDateTime(b)?.getTime() || 0;
      return bTime - aTime;
    });
  }, [appointments]);

  const groupedAppointments = useMemo(() => {
    const upcoming = sortedAppointments.filter((item) => activeAppointmentStatuses.includes(item.status));
    const completed = sortedAppointments.filter((item) => item.status === 'completed');
    const cancelled = sortedAppointments.filter((item) => item.status === 'cancelled');
    const other = sortedAppointments.filter(
      (item) => !activeAppointmentStatuses.includes(item.status) && item.status !== 'completed' && item.status !== 'cancelled'
    );

    return [
      {
        key: 'upcoming',
        title: 'Upcoming / In Progress',
        description: 'These appointments are still active.',
        items: upcoming
      },
      {
        key: 'completed',
        title: 'Completed',
        description: 'Visits that are already finished.',
        items: completed
      },
      {
        key: 'cancelled',
        title: 'Cancelled',
        description: 'Appointments that were cancelled.',
        items: cancelled
      },
      {
        key: 'other',
        title: 'Other',
        description: 'Any remaining appointment states.',
        items: other
      }
    ].filter((group) => group.items.length > 0);
  }, [sortedAppointments]);

  const nextAppointment = upcomingAppointments[0] || null;

  const getBookingValidationMessage = (form) => {
    if (!form.services.length) return 'Please say the service you want.';
    if (!form.staffId) return 'Please say the staff member name, or say any staff.';
    if (!form.date) return 'Please say a date, for example tomorrow or Monday.';
    if (!form.timeSlot) return 'Please say a time between 9 AM and 8:30 PM.';
    return '';
  };

  const getVoiceBookingSummary = (form) => {
    const selectedServices = servicesRef.current
      .filter((item) => form.services.includes(item.id))
      .map((item) => item.name);
    const selectedStaffMember = staffRef.current.find((item) => String(item.id) === String(form.staffId));
    const dateLabel = form.date
      ? new Date(`${form.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
      : 'no date';
    return `${selectedServices.join(', ')} with ${selectedStaffMember?.name || 'no staff'} on ${dateLabel} at ${form.timeSlot || 'no time'}`;
  };

  const submitBooking = async () => {
    const form = bookingFormRef.current;
    const validationMessage = getBookingValidationMessage(form);
    if (validationMessage) {
      toast.error(validationMessage);
      return { success: false, message: validationMessage };
    }
    if (bookingInProgressRef.current) return { success: false, message: 'Your booking is already being submitted.' };

    bookingInProgressRef.current = true;
    setSubmitting(true);
    try {
      await axios.post('/api/customer/appointments', {
        staffId: toNumber(form.staffId),
        services: form.services.map(toNumber),
        date: form.date,
        timeSlot: form.timeSlot,
        notes: form.notes || null
      });
      toast.success('Appointment booked successfully');
      updateBookingForm({
        ...emptyBooking,
        date: form.date
      });
      await Promise.all([fetchMyAppointments(), fetchAvailability(form.date)]);
      return { success: true, message: 'Your appointment has been booked successfully.' };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to book appointment');
      toast.error(message);
      return { success: false, message };
    } finally {
      bookingInProgressRef.current = false;
      setSubmitting(false);
    }
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    await submitBooking();
  };

  const stopVoiceBooking = (message = 'Voice booking stopped.') => {
    voiceSessionRef.current = false;
    awaitingVoiceConfirmationRef.current = false;
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setVoiceActive(false);
    setVoiceListening(false);
    setVoiceStatus(message);
  };

  const beginVoiceListening = () => {
    if (!voiceSessionRef.current || !voiceSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        if (voiceSessionRef.current) {
          setVoiceListening(true);
          setVoiceStatus('Listening… say your complete booking in one sentence.');
        }
      };
      recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        setVoiceTranscript(transcript);
        processVoiceCommand(transcript);
      };
      recognition.onerror = (event) => {
        if (!voiceSessionRef.current || event.error === 'aborted') return;
        setVoiceListening(false);
        if (event.error === 'no-speech') {
          stopVoiceBooking('I did not hear anything. Press Start Voice Booking and say the complete booking in one sentence.');
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopVoiceBooking('Microphone permission was not granted. Please allow microphone access and try again.');
          toast.error('Microphone permission is required for voice booking.');
          return;
        }
        stopVoiceBooking('Voice recognition is unavailable right now. You can still use the booking form.');
      };
      recognition.onend = () => setVoiceListening(false);
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      if (error.name !== 'InvalidStateError') {
        stopVoiceBooking('Unable to start microphone. Please try again.');
      }
    }
  };

  const askForNextVoiceDetail = (form) => {
    if (!form.services.length) return 'Please say the service you want, for example haircut or hair spa.';
    if (!form.staffId) return 'Please say the staff member name, or say any staff.';
    if (!form.date) return 'Please say a date, for example tomorrow or next Monday.';
    if (!form.timeSlot) return 'Please say a time, for example 3 PM or 3:30 PM.';
    return `Your booking is ready: ${getVoiceBookingSummary(form)}. Say confirm booking to book it, or say change service, staff, date, or time.`;
  };

  const submitVoiceBooking = async () => {
    recognitionRef.current?.abort();
    setVoiceListening(false);
    setVoiceStatus('Booking your appointment…');
    const result = await submitBooking();
    voiceSessionRef.current = false;
    awaitingVoiceConfirmationRef.current = false;
    setVoiceActive(false);
    if (result.success) {
      setVoiceStatus(result.message);
      return;
    }
    setVoiceStatus(`${result.message}. Your form details are saved; update them and try again.`);
  };

  const processVoiceCommand = (transcript) => {
    const text = normalizeVoiceText(transcript);
    if (!text || !voiceSessionRef.current) return;

    if (/\b(stop|cancel voice|exit voice)\b/.test(text)) {
      stopVoiceBooking('Voice booking stopped. No appointment was booked.');
      return;
    }
    if (/\b(help|what can i say|voice help)\b/.test(text)) {
      stopVoiceBooking('Say everything in one sentence: “Haircut with Riya tomorrow at 3 PM.” Add “confirm booking” at the end to book by voice.');
      return;
    }
    if (/\b(list|show)\b.*\b(service|services)\b/.test(text)) {
      const names = servicesRef.current.map((item) => item.name).join(', ');
      stopVoiceBooking(`Available services: ${names}. Start voice booking again and say your complete booking.`);
      return;
    }
    if (/\b(list|show|available)\b.*\b(staff|team|professional)\b/.test(text)) {
      const names = staffRef.current.map((item) => item.name).join(', ');
      stopVoiceBooking(`Available staff: ${names}. Start voice booking again and say your complete booking.`);
      return;
    }

    const current = bookingFormRef.current;
    const nextForm = { ...current };
    const updates = [];
    const matchedServices = findVoiceMatches(servicesRef.current, text, true);
    const matchedStaff = findVoiceMatches(staffRef.current, text);
    const voicedDate = parseVoiceDate(text);
    const voicedTime = parseVoiceTime(text);
    const notesMatch = text.match(/\b(?:note|notes|instruction|instructions)\s+(.+)/);
    const wantsVoiceConfirmation = /\b(confirm booking|confirm appointment|book now)\b/.test(text);
    const containsBookingDetails = matchedServices.length || matchedStaff || voicedDate || voicedTime || notesMatch;

    if (wantsVoiceConfirmation && !containsBookingDetails) {
      const missingDetail = getBookingValidationMessage(current);
      if (missingDetail) {
        stopVoiceBooking(`I cannot confirm yet. ${missingDetail}`);
        return;
      }
      submitVoiceBooking();
      return;
    }

    if (matchedServices.length) {
      nextForm.services = matchedServices.map((item) => item.id);
      updates.push(`service ${matchedServices.map((item) => item.name).join(', ')}`);
    }
    if (matchedStaff) {
      nextForm.staffId = matchedStaff.id;
      nextForm.timeSlot = '';
      updates.push(`staff ${matchedStaff.name}`);
    } else if (/\b(any staff|anyone|no preference)\b/.test(text) && staffRef.current.length) {
      nextForm.staffId = staffRef.current[0].id;
      nextForm.timeSlot = '';
      updates.push(`staff ${staffRef.current[0].name}`);
    }
    if (voicedDate) {
      nextForm.date = voicedDate;
      nextForm.timeSlot = '';
      updates.push(`date ${new Date(`${voicedDate}T00:00:00`).toLocaleDateString('en-IN')}`);
    }
    if (voicedTime) {
      const bookedForStaff = availabilityRef.current[String(nextForm.staffId)] || [];
      if (nextForm.staffId && nextForm.date === current.date && bookedForStaff.includes(voicedTime)) {
        stopVoiceBooking(`Sorry, ${voicedTime} is already booked for that staff member. Start voice booking again and say another time.`);
        return;
      }
      nextForm.timeSlot = voicedTime;
      updates.push(`time ${voicedTime}`);
    }
    if (notesMatch) {
      nextForm.notes = notesMatch[1];
      updates.push('your notes');
    }

    if (updates.length) {
      updateBookingForm(nextForm);
      const missingDetail = getBookingValidationMessage(nextForm);
      awaitingVoiceConfirmationRef.current = !missingDetail;
      voiceSessionRef.current = false;
      setVoiceListening(false);
      setVoiceActive(false);

      if (wantsVoiceConfirmation && !missingDetail) {
        submitVoiceBooking();
        return;
      }

      setVoiceStatus(missingDetail
        ? `I filled ${updates.join(', ')}. ${missingDetail}`
        : `Form filled: ${getVoiceBookingSummary(nextForm)}. Say “confirm booking” in a new voice command, or use Book Appointment.`);
      return;
    }

    voiceSessionRef.current = false;
    setVoiceListening(false);
    setVoiceActive(false);
    setVoiceStatus(`I could not match your booking details. ${askForNextVoiceDetail(current)}`);
  };

  const startVoiceBooking = () => {
    if (!voiceSupported) {
      toast.error('Voice booking works in Chrome or Edge. Please use one of those browsers.');
      return;
    }
    if (voiceSessionRef.current) {
      stopVoiceBooking();
      return;
    }
    // Keep already-filled values so a second spoken "confirm booking" command can submit them.
    if (!bookingFormRef.current.date) {
      updateBookingForm({ ...emptyBooking, date: today });
    }
    voiceSessionRef.current = true;
    awaitingVoiceConfirmationRef.current = false;
    setVoiceActive(true);
    setVoiceTranscript('');
    setVoiceStatus('Starting microphone… say your complete booking in one sentence.');
    beginVoiceListening();
  };

  const cancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm('Do you want to cancel this appointment?');
    if (!confirmed) return;

    try {
      await axios.put(`/api/customer/appointments/${appointmentId}/cancel`, {});
      toast.success('Appointment cancelled');
      await Promise.all([fetchMyAppointments(), fetchAvailability(bookingForm.date)]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to cancel appointment'));
    }
  };

  if (loadingData) {
    return <div className="loader">Loading customer portal...</div>;
  }

  return (
    <div className="customer-portal">
      <section className="customer-overview-grid">
        <article className="customer-overview-hero">
          <p className="customer-overview-label">Your Beauty Dashboard</p>
          <h2>Everything for your next appointment in one calm space.</h2>
          <p>
            Select your services, pick your preferred professional, and track upcoming bookings without calling the salon.
          </p>
          {nextAppointment ? (
            <div className="customer-overview-next">
              <span>Next Visit</span>
              <strong>
                {new Date(nextAppointment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' '}at {nextAppointment.timeSlot}
              </strong>
            </div>
          ) : (
            <div className="customer-overview-next">
              <span>Next Visit</span>
              <strong>No upcoming appointment yet</strong>
            </div>
          )}
        </article>

        <article className="customer-overview-stat">
          <span>Upcoming</span>
          <strong>{upcomingAppointments.length}</strong>
          <p>Planned visits in your calendar</p>
        </article>

        <article className="customer-overview-stat">
          <span>Completed</span>
          <strong>{completedAppointments.length}</strong>
          <p>Appointments finished successfully</p>
        </article>
      </section>

      <section className="card customer-booking-card">
        <div className="page-header customer-page-header">
          <div>
            <h2 className="page-title">Book Appointment</h2>
            <p className="page-subtitle">Choose services, specialist, and your preferred slot</p>
          </div>
        </div>

        <section className={`voice-booking-panel${voiceActive ? ' active' : ''}`} aria-label="Voice appointment booking">
          <div className="voice-booking-icon" aria-hidden="true">🎙</div>
          <div className="voice-booking-content">
            <div className="voice-booking-heading">
              <div>
                <span className="voice-booking-kicker">Hands-free booking</span>
                <h3>Book your appointment by voice</h3>
              </div>
              {voiceActive && <span className="voice-live-badge"><i /> Live</span>}
            </div>
            <p className="voice-booking-status" role="status">{voiceStatus}</p>
            {voiceTranscript && <p className="voice-transcript"><strong>You said:</strong> “{voiceTranscript}”</p>}
            <p className="voice-booking-example">Try: “Haircut with Riya tomorrow at 3 PM”, then say “confirm booking”.</p>
            <p className="voice-booking-privacy">Your browser asks for microphone permission. Speech recognition is handled by your browser; SalonPro does not send the audio to its AI assistant.</p>
          </div>
          <button
            type="button"
            className={`voice-booking-btn${voiceListening ? ' listening' : ''}`}
            onClick={startVoiceBooking}
            disabled={!voiceSupported || submitting}
          >
            <span aria-hidden="true">{voiceActive ? '■' : '●'}</span>
            {voiceActive ? (voiceListening ? 'Listening…' : 'Stop Voice Booking') : 'Start Voice Booking'}
          </button>
        </section>

        <form onSubmit={handleBookAppointment} className="customer-booking-form">
          <div className="customer-booking-layout">
            <div className="customer-booking-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Staff</label>
                  <select
                    required
                    value={bookingForm.staffId}
                    onChange={(event) => updateBookingForm({ ...bookingForm, staffId: event.target.value, timeSlot: '' })}
                  >
                    <option value="">Choose staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Date</label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={bookingForm.date}
                    onChange={(event) => updateBookingForm({ ...bookingForm, date: event.target.value, timeSlot: '' })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Choose Services</label>
                <div className="customer-service-picker">
                  {services.map((service) => (
                    <label key={service.id} className={`customer-service-option${bookingForm.services.includes(service.id) ? ' selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={bookingForm.services.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      <span>{service.name}</span>
                      <em>{service.duration} mins</em>
                      <strong>{formatCurrency(service.price)}</strong>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Time Slot</label>
                <p className="customer-field-hint">Booked slots are disabled automatically for selected staff.</p>
                <div className="customer-time-grid">
                  {timeSlots.map((slot) => {
                    const isBooked = bookedSlotsForSelectedStaff.includes(slot);
                    const isActive = bookingForm.timeSlot === slot;
                    const disableSlot = isBooked || !bookingForm.staffId;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`customer-time-btn${isActive ? ' active' : ''}`}
                        disabled={disableSlot}
                        onClick={() => updateBookingForm({ ...bookingForm, timeSlot: slot })}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(event) => updateBookingForm({ ...bookingForm, notes: event.target.value })}
                  placeholder="Any preference or instructions"
                />
              </div>
            </div>

            <aside className="customer-booking-summary">
              <h3>Booking Summary</h3>
              <div className="customer-summary-row">
                <span>Staff</span>
                <strong>{selectedStaff ? selectedStaff.name : 'Not selected'}</strong>
              </div>
              <div className="customer-summary-row">
                <span>Date</span>
                <strong>{bookingForm.date ? new Date(bookingForm.date).toLocaleDateString('en-IN') : 'Not selected'}</strong>
              </div>
              <div className="customer-summary-row">
                <span>Time</span>
                <strong>{bookingForm.timeSlot || 'Not selected'}</strong>
              </div>
              <div className="customer-summary-services">
                <p>Selected Services</p>
                {selectedServiceRows.length ? (
                  selectedServiceRows.map((item) => (
                    <div key={item.id} className="customer-summary-service-item">
                      <span>{item.name}</span>
                      <strong>{formatCurrency(item.price)}</strong>
                    </div>
                  ))
                ) : (
                  <p className="customer-empty-message">No service selected</p>
                )}
              </div>
              <div className="customer-summary-total">
                <span>Estimated Total</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
              <button className="btn btn-primary customer-book-btn" disabled={submitting}>
                {submitting ? 'Booking...' : 'Book Appointment'}
              </button>
            </aside>
          </div>
        </form>
      </section>

      <section className="card customer-schedule-card">
        <h2 className="page-title">My Schedule</h2>
        <p className="page-subtitle">Track your upcoming and past appointments</p>
        <div className="customer-status-guide">
          <span className="customer-status-guide-title">Quick guide:</span>
          <span className="badge badge-scheduled">Scheduled</span>
          <span className="badge badge-confirmed">Confirmed</span>
          <span className="badge badge-cancelled">Cancelled</span>
          <span className="badge badge-pending">Payment Pending</span>
          <span className="badge badge-paid">Payment Paid</span>
        </div>
        <div className="customer-appointment-list">
          {appointments.length === 0 ? (
            <div className="customer-empty-state">
              <h3>No appointments booked yet</h3>
              <p>Use the booking form above to schedule your first visit.</p>
            </div>
          ) : (
            groupedAppointments.map((group) => (
              <section key={group.key} className="customer-schedule-group">
                <header className="customer-schedule-group-header">
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </header>
                {group.items.map((item) => (
                  <article key={item.id} className="customer-appointment-item">
                    <div className="customer-appointment-main">
                      <h3>{new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
                      <p>{item.timeSlot} with {item.staff?.name || 'Assigned Staff'}</p>
                      <small>{item.services?.map((service) => service.name).join(', ') || 'No service info'}</small>
                    </div>
                    <div className="customer-appointment-tags">
                      <div className="customer-status-row">
                        <span className="customer-status-label">Appointment</span>
                        <span className={`badge ${statusClassMap[item.status] || ''}`}>{toStatusLabel(item.status)}</span>
                      </div>
                      <div className="customer-status-row">
                        <span className="customer-status-label">Payment</span>
                        <span className={`badge ${paymentClassMap[item.paymentStatus] || 'badge-pending'}`}>
                          {toStatusLabel(item.paymentStatus || 'pending')}
                        </span>
                      </div>
                    </div>
                    <div>
                      {(item.status === 'scheduled' || item.status === 'confirmed') ? (
                        <button className="btn btn-danger btn-sm" onClick={() => cancelAppointment(item.id)}>
                          Cancel
                        </button>
                      ) : (
                        <span className="customer-disabled-action">N/A</span>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            ))
          )}
        </div>
      </section>

      <section className="customer-grid">
        <div className="card">
          <h2 className="page-title">Services</h2>
          <p className="page-subtitle">Available salon services</p>
          <div className="customer-list">
            {services.map((item) => (
              <div key={item.id} className="customer-list-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} | {item.duration} mins</p>
                </div>
                <span>{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="page-title">Staff</h2>
          <p className="page-subtitle">Choose your preferred professional</p>
          <div className="customer-list">
            {staff.map((member) => (
              <div key={member.id} className="customer-list-item">
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.role}</p>
                </div>
                <span>{(member.workingDays || []).slice(0, 3).join(', ') || 'All days'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
