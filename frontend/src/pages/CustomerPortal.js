import React, { useEffect, useMemo, useState } from 'react';
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

export default function CustomerPortal() {
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState({});
  const [bookingForm, setBookingForm] = useState(emptyBooking);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
    setBookingForm((current) => ({
      ...current,
      services: current.services.includes(serviceId)
        ? current.services.filter((item) => item !== serviceId)
        : [...current.services, serviceId]
    }));
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

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    if (!bookingForm.staffId) {
      toast.error('Please select a staff member');
      return;
    }
    if (!bookingForm.services.length) {
      toast.error('Please select at least one service');
      return;
    }
    if (!bookingForm.timeSlot) {
      toast.error('Please choose a time slot');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/customer/appointments', {
        staffId: toNumber(bookingForm.staffId),
        services: bookingForm.services.map(toNumber),
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        notes: bookingForm.notes || null
      });
      toast.success('Appointment booked successfully');
      setBookingForm({
        ...emptyBooking,
        date: bookingForm.date
      });
      await Promise.all([fetchMyAppointments(), fetchAvailability(bookingForm.date)]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to book appointment'));
    } finally {
      setSubmitting(false);
    }
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

        <form onSubmit={handleBookAppointment} className="customer-booking-form">
          <div className="customer-booking-layout">
            <div className="customer-booking-fields">
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Staff</label>
                  <select
                    required
                    value={bookingForm.staffId}
                    onChange={(event) => setBookingForm({ ...bookingForm, staffId: event.target.value, timeSlot: '' })}
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
                    onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value, timeSlot: '' })}
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
                        onClick={() => setBookingForm({ ...bookingForm, timeSlot: slot })}
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
                  onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })}
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
