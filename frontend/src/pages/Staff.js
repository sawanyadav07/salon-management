import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const emptyForm = {
  name: '', phone: '', email: '', role: '', salary: '',
  specialties: '', workingDays: [], workingHours: { start: '09:00', end: '18:00' }
};

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStaff = async () => {
    const res = await axios.get('/api/staff/all');
    setStaff(res.data);
  };
  useEffect(() => { fetchStaff(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, phone: s.phone, email: s.email || '', role: s.role, salary: s.salary || '',
      specialties: (s.specialties || []).join(', '),
      workingDays: s.workingDays || [],
      workingHours: s.workingHours || { start: '09:00', end: '18:00' }
    });
    setEditId(s._id); setShowModal(true);
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f, workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter(d => d !== day)
        : [...f.workingDays, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const payload = { ...form, specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean) };
    try {
      if (editId) { await axios.put(`/api/staff/${editId}`, payload); toast.success('Staff updated!'); }
      else { await axios.post('/api/staff', payload); toast.success('Staff added!'); }
      setShowModal(false); fetchStaff();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (member) => {
    try {
      await axios.put(`/api/staff/${member._id}`, { isActive: !member.isActive });
      toast.success(`Staff ${member.isActive ? 'deactivated' : 'activated'}!`);
      fetchStaff();
    } catch { toast.error('Failed'); }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['#dbeafe', '#d1fae5', '#ede9fe', '#fce7f3', '#fef3c7'];
  const avatarText = ['#1e40af', '#065f46', '#5b21b6', '#9d174d', '#92400e'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">{staff.filter(s => s.isActive).length} active members</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Staff</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {staff.length === 0 ? (
          <p style={{ color: '#a0aec0' }}>No staff added yet.</p>
        ) : staff.map((member, i) => {
          const ci = i % avatarColors.length;
          return (
            <div key={member._id} className="card" style={{ opacity: member.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%',
                  background: avatarColors[ci], color: avatarText[ci],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '16px', flexShrink: 0
                }}>{getInitials(member.name)}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{member.name}</div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>{member.role}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '6px' }}>📞 {member.phone}</div>
              {member.email && <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '6px' }}>✉️ {member.email}</div>}
              {member.specialties?.length > 0 && (
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '10px' }}>
                  ✨ {member.specialties.join(', ')}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '14px' }}>
                {member.workingDays?.slice(0, 3).map(d => d.slice(0, 3)).join(', ')}
                {member.workingDays?.length > 3 ? ` +${member.workingDays.length - 3} more` : ''}
                {' '} | {member.workingHours?.start}–{member.workingHours?.end}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(member)}>Edit</button>
                <button
                  className={`btn btn-sm ${member.isActive ? 'btn-danger' : 'btn-success'}`}
                  onClick={() => handleToggleActive(member)}
                >{member.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Staff' : 'Add Staff Member'}</span>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Riya Kapoor" />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Role / Designation *</label>
                  <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Hair Stylist" />
                </div>
                <div className="form-group">
                  <label>Monthly Salary (₹)</label>
                  <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="15000" />
                </div>
                <div className="form-group">
                  <label>Specialties (comma separated)</label>
                  <input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} placeholder="Balayage, Keratin" />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={form.workingHours.start} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" value={form.workingHours.end} onChange={e => setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })} />
                </div>
                <div className="form-group full">
                  <label>Working Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {days.map(day => (
                      <button
                        type="button" key={day}
                        onClick={() => toggleDay(day)}
                        style={{
                          padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                          border: '1px solid', fontWeight: '500',
                          background: form.workingDays.includes(day) ? '#1a202c' : 'white',
                          color: form.workingDays.includes(day) ? 'white' : '#4a5568',
                          borderColor: form.workingDays.includes(day) ? '#1a202c' : '#e2e8f0'
                        }}
                      >{day.slice(0, 3)}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
