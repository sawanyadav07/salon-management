import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const timeSlots = [];
for (let h = 9; h <= 20; h++) {
  timeSlots.push(`${String(h).padStart(2,'0')}:00`);
  timeSlots.push(`${String(h).padStart(2,'0')}:30`);
}

const statusOptions = ['scheduled','confirmed','in-progress','completed','cancelled'];
const paymentMethods = ['cash','card','upi','other'];

const statusBadge = (status) => {
  const map = {
    scheduled: 'badge-scheduled', confirmed: 'badge-confirmed',
    'in-progress': 'badge-inprogress', completed: 'badge-completed', cancelled: 'badge-cancelled'
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

const emptyForm = {
  customer: '', staff: '', services: [], date: '', timeSlot: '',
  status: 'scheduled', discount: 0, paymentStatus: 'pending', paymentMethod: '', notes: ''
};

const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    const params = new URLSearchParams();
    if (filterDate) params.append('date', filterDate);
    if (filterStatus) params.append('status', filterStatus);
    const res = await axios.get(`/api/appointments?${params}`);
    setAppointments(res.data);
  };

  useEffect(() => { fetchAppointments(); }, [filterDate, filterStatus]);

  useEffect(() => {
    axios.get('/api/customers').then(r => setCustomers(r.data));
    axios.get('/api/staff').then(r => setStaffList(r.data));
    axios.get('/api/services').then(r => setServicesList(r.data));
  }, []);

  const totalAmount = form.services.reduce((sum, sid) => {
    const svc = servicesList.find(s => s.id === sid || s.id === Number(sid));
    return sum + (Number(svc?.price) || 0);
  }, 0);
  const finalAmount = totalAmount - (Number(form.discount) || 0);

  const openAdd = () => {
    setForm({ ...emptyForm, date: filterDate });
    setEditId(null); setShowModal(true);
  };

  const openEdit = (appt) => {
    setForm({
      customer: appt.customer?.id || '',
      staff: appt.staff?.id || '',
      services: appt.services?.map(s => s.id) || [],
      date: appt.date ? appt.date.split('T')[0] : '',
      timeSlot: appt.timeSlot || '',
      status: appt.status || 'scheduled',
      discount: appt.discount || 0,
      paymentStatus: appt.paymentStatus || 'pending',
      paymentMethod: appt.paymentMethod || '',
      notes: appt.notes || ''
    });
    setEditId(appt.id); setShowModal(true);
  };

  const toggleService = (sid) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(sid) ? f.services.filter(s => s !== sid) : [...f.services, sid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.services.length === 0) { toast.error('Please select at least one service'); return; }
    setLoading(true);
    const payload = {
      ...form,
      customer: toNum(form.customer),
      staff: toNum(form.staff),
      services: form.services.map(toNum),
      paymentMethod: form.paymentMethod ? form.paymentMethod.toLowerCase() : null,
      totalAmount,
      finalAmount
    };
    try {
      if (editId) { await axios.put(`/api/appointments/${editId}`, payload); toast.success('Appointment updated!'); }
      else { await axios.post('/api/appointments', payload); toast.success('Appointment booked!'); }
      setShowModal(false); fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await axios.delete(`/api/appointments/${id}`); toast.success('Cancelled!'); fetchAppointments(); }
    catch { toast.error('Failed'); }
  };

  const quickStatus = async (id, status) => {
    try { await axios.put(`/api/appointments/${id}`, { status }); toast.success(`Marked as ${status}`); fetchAppointments(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{appointments.length} appointments {filterDate ? `on ${new Date(filterDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Book Appointment</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {statusOptions.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setFilterDate(''); setFilterStatus(''); }}>Clear</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th><th>Customer</th><th>Staff</th><th>Services</th>
                <th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#a0aec0', padding: '32px' }}>No appointments found</td></tr>
              ) : appointments.map(appt => (
                <tr key={appt.id}>
                  <td>
                    <strong>{appt.timeSlot}</strong>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>{new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                  </td>
                  <td>
                    <strong>{appt.customer?.name}</strong>
                    <div style={{ fontSize: '12px', color: '#718096' }}>{appt.customer?.phone}</div>
                  </td>
                  <td>{appt.staff?.name}</td>
                  <td style={{ maxWidth: '160px' }}>
                    <div style={{ fontSize: '13px' }}>{appt.services?.map(s => s.name).join(', ')}</div>
                  </td>
                  <td>
                    <strong>₹{appt.finalAmount}</strong>
                    {appt.discount > 0 && <div style={{ fontSize: '11px', color: '#718096' }}>-₹{appt.discount} off</div>}
                  </td>
                  <td>{statusBadge(appt.status)}</td>
                  <td>
                    <span className={`badge badge-${appt.paymentStatus}`}>{appt.paymentStatus}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(appt)}>Edit</button>
                      {appt.status === 'scheduled' && (
                        <button className="btn btn-success btn-sm" onClick={() => quickStatus(appt.id, 'confirmed')}>Confirm</button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button className="btn btn-sm" style={{ background: '#fefcbf', color: '#92400e' }} onClick={() => quickStatus(appt.id, 'in-progress')}>Start</button>
                      )}
                      {appt.status === 'in-progress' && (
                        <button className="btn btn-success btn-sm" onClick={() => quickStatus(appt.id, 'completed')}>Done</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(appt.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Appointment' : 'Book Appointment'}</span>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer *</label>
                  <select required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Staff Member *</label>
                  <select required value={form.staff} onChange={e => setForm({ ...form, staff: e.target.value })}>
                    <option value="">Select staff</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Time Slot *</label>
                  <select required value={form.timeSlot} onChange={e => setForm({ ...form, timeSlot: e.target.value })}>
                    <option value="">Select time</option>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Services */}
                <div className="form-group full">
                  <label>Services * (select one or more)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                    {servicesList.map(svc => (
                      <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: form.services.includes(svc.id) ? '#fef3c7' : 'transparent', fontSize: '13px' }}>
                        <input type="checkbox" checked={form.services.includes(svc.id)} onChange={() => toggleService(svc.id)} />
                        <span>{svc.name}</span>
                        <span style={{ marginLeft: 'auto', color: '#d97706', fontWeight: '600' }}>₹{svc.price}</span>
                      </label>
                    ))}
                  </div>
                  {form.services.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#4a5568' }}>
                      Subtotal: ₹{totalAmount} &nbsp;|&nbsp; Final: ₹{Math.max(0, finalAmount)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Discount (₹)</label>
                  <input type="number" min="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {statusOptions.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="">Select method</option>
                    {paymentMethods.map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="form-group full">
                  <label>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Appointment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
