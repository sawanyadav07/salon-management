import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const emptyForm = { name: '', category: 'hair', price: '', duration: '', description: '' };
const categories = ['hair', 'skin', 'nails', 'makeup', 'spa', 'other'];
const catColors = { hair: '#dbeafe', skin: '#d1fae5', nails: '#fce7f3', makeup: '#ede9fe', spa: '#fef3c7', other: '#f1f5f9' };
const catTextColors = { hair: '#1e40af', skin: '#065f46', nails: '#9d174d', makeup: '#5b21b6', spa: '#92400e', other: '#475569' };

export default function Services() {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    const res = await axios.get('/api/services/all');
    setServices(res.data);
  };
  useEffect(() => { fetchServices(); }, []);

  const filtered = activeCategory === 'all' ? services : services.filter(s => s.category === activeCategory);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (s) => {
    setForm({ name: s.name, category: s.category, price: s.price, duration: s.duration, description: s.description || '' });
    setEditId(s.id); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editId) { await axios.put(`/api/services/${editId}`, form); toast.success('Service updated!'); }
      else { await axios.post('/api/services', form); toast.success('Service added!'); }
      setShowModal(false); fetchServices();
    } catch (err) { toast.error(getApiErrorMessage(err, 'Unable to save service.')); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this service?')) return;
    try { await axios.delete(`/api/services/${id}`); toast.success('Deactivated!'); fetchServices(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">{services.length} services available</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Service</button>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'capitalize',
              background: activeCategory === cat ? '#1a202c' : 'white',
              color: activeCategory === cat ? 'white' : '#4a5568',
              borderColor: activeCategory === cat ? '#1a202c' : '#e2e8f0'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#a0aec0', padding: '40px' }}>No services found</div>
        ) : filtered.map(svc => (
          <div key={svc.id} className="card" style={{ opacity: svc.isActive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                background: catColors[svc.category], color: catTextColors[svc.category]
              }}>{svc.category}</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#d97706' }}>₹{svc.price}</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>{svc.name}</h3>
            <p style={{ fontSize: '13px', color: '#718096', marginBottom: '12px' }}>{svc.description || 'No description'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#718096' }}>⏱ {svc.duration} mins</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(svc)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(svc.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Service' : 'Add Service'}</span>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Service Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hair Coloring" />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" required min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="500" />
                </div>
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input type="number" required min="5" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="60" />
                </div>
                <div className="form-group full">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the service..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
