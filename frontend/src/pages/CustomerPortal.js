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

const toNumber = (value) => Number(value);

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

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!bookingForm.services.length) {
      toast.error('Please select at least one service');
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
      <section className="card">
        <div className="page-header customer-page-header">
          <div>
            <h2 className="page-title">Book Appointment</h2>
            <p className="page-subtitle">Select services, staff and preferred slot</p>
          </div>
        </div>

        <form onSubmit={handleBookAppointment}>
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
            <div className="form-group full">
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
                    <strong>INR {Number(service.price).toLocaleString('en-IN')}</strong>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Time Slot</label>
              <select
                required
                value={bookingForm.timeSlot}
                onChange={(event) => setBookingForm({ ...bookingForm, timeSlot: event.target.value })}
              >
                <option value="">Choose time slot</option>
                {timeSlots.map((slot) => {
                  const disabled = bookedSlotsForSelectedStaff.includes(slot);
                  return (
                    <option key={slot} value={slot} disabled={disabled}>
                      {slot}{disabled ? ' (booked)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Estimated Total</label>
              <input value={`INR ${totalAmount.toLocaleString('en-IN')}`} readOnly />
            </div>
            <div className="form-group full">
              <label>Notes (optional)</label>
              <textarea
                value={bookingForm.notes}
                onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })}
                placeholder="Any preference or instructions"
              />
            </div>
          </div>

          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="page-title">My Schedule</h2>
        <p className="page-subtitle">Track your upcoming and past appointments</p>
        <div className="table-wrap" style={{ marginTop: '14px' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Staff</th>
                <th>Services</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>No appointments booked yet.</td>
                </tr>
              ) : (
                appointments.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                    <td>{item.timeSlot}</td>
                    <td>{item.staff?.name || '-'}</td>
                    <td>{item.services?.map((service) => service.name).join(', ') || '-'}</td>
                    <td>
                      <span className={`badge ${statusClassMap[item.status] || ''}`}>{item.status}</span>
                    </td>
                    <td>
                      <span className={`badge ${paymentClassMap[item.paymentStatus] || 'badge-pending'}`}>{item.paymentStatus}</span>
                    </td>
                    <td>
                      {(item.status === 'scheduled' || item.status === 'confirmed') ? (
                        <button className="btn btn-danger btn-sm" onClick={() => cancelAppointment(item.id)}>
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <span>INR {Number(item.price).toLocaleString('en-IN')}</span>
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
