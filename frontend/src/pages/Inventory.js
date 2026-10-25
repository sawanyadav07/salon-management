import React, { useEffect, useState } from 'react';
import axios from '../config/api';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { useNotifications } from '../context/NotificationContext';

const blank = { name: '', category: 'General', quantity: 0, lowStockThreshold: 5, unit: 'units', notes: '' };
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function Inventory() {
  const { lowStockVoiceEnabled, setLowStockVoiceEnabled } = useNotifications();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalUnits: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const { data } = await axios.get('/api/inventory'); setItems(data.items); setSummary(data.summary); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Unable to load inventory.')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(blank); setEditId(null); setShowForm(true); };
  const openEdit = (item) => { setForm({ name: item.name, category: item.category, quantity: item.quantity, lowStockThreshold: item.lowStockThreshold, unit: item.unit, notes: item.notes || '' }); setEditId(item.id); setShowForm(true); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = { ...form, quantity: number(form.quantity), lowStockThreshold: number(form.lowStockThreshold) };
    try {
      if (editId) await axios.put(`/api/inventory/${editId}`, payload);
      else await axios.post('/api/inventory', payload);
      toast.success(editId ? 'Inventory updated.' : 'Item added to inventory.'); setShowForm(false); await load();
    } catch (error) { toast.error(getApiErrorMessage(error, 'Unable to save inventory item.')); }
    finally { setSaving(false); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Remove ${item.name} from inventory?`)) return;
    try { await axios.delete(`/api/inventory/${item.id}`); toast.success('Inventory item removed.'); await load(); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Unable to remove item.')); }
  };

  return <div>
    <div className="page-header">
      <div><h1 className="page-title">Inventory</h1><p className="page-subtitle">Track stock levels and catch low items early.</p></div>
      <button className="btn btn-primary" onClick={openAdd}>+ Add item</button>
    </div>
    <div className="inventory-voice-setting">
      <div><strong>Spoken low-stock alerts</strong><span>Voice alerts play when stock first falls to its threshold.</span></div>
      <label><input type="checkbox" checked={lowStockVoiceEnabled} onChange={(event) => setLowStockVoiceEnabled(event.target.checked)} /> Voice alerts {lowStockVoiceEnabled ? 'on' : 'off'}</label>
    </div>
    <div className="stat-cards">
      <div className="stat-card blue"><div className="label">Items tracked</div><div className="value">{summary.totalItems}</div></div>
      <div className="stat-card green"><div className="label">Total units</div><div className="value">{summary.totalUnits}</div></div>
      <div className="stat-card gold"><div className="label">Low stock</div><div className="value">{summary.lowStockCount}</div><div className="sub">At or below threshold</div></div>
      <div className="stat-card purple"><div className="label">Out of stock</div><div className="value">{summary.outOfStockCount}</div></div>
    </div>
    <div className="card inventory-card">
      {loading ? <p>Loading inventory…</p> : items.length === 0 ? <div className="inventory-empty"><h3>No inventory recorded yet</h3><p>Add the products and supplies your salon uses to start getting live stock insights.</p><button className="btn btn-primary" onClick={openAdd}>Add first item</button></div> :
        <div className="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Available</th><th>Low-stock threshold</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {items.map((item) => { const low = item.quantity <= item.lowStockThreshold; return <tr key={item.id}>
            <td><strong>{item.name}</strong>{item.notes && <div className="inventory-notes">{item.notes}</div>}</td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td>{item.lowStockThreshold} {item.unit}</td>
            <td><span className={`inventory-badge ${low ? (item.quantity === 0 ? 'out' : 'low') : 'ok'}`}>{item.quantity === 0 ? 'Out of stock' : low ? 'Low stock' : 'In stock'}</span></td>
            <td><div className="inventory-actions"><button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => remove(item)}>Remove</button></div></td>
          </tr>; })}
        </tbody></table></div>}
    </div>
    {showForm && <div className="modal-overlay" onClick={() => setShowForm(false)}><div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-header"><span className="modal-title">{editId ? 'Update inventory item' : 'Add inventory item'}</span><button className="close-btn" onClick={() => setShowForm(false)}>×</button></div>
      <form onSubmit={save}><div className="form-grid">
        <div className="form-group full"><label>Item name *</label><input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Hair colour, shampoo" /></div>
        <div className="form-group"><label>Category *</label><input required maxLength="80" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
        <div className="form-group"><label>Unit *</label><input required maxLength="30" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="bottles, tubes, boxes" /></div>
        <div className="form-group"><label>Quantity available *</label><input required type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></div>
        <div className="form-group"><label>Alert me at *</label><input required type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></div>
        <div className="form-group full"><label>Notes</label><input maxLength="500" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional details" /></div>
      </div><div className="inventory-form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save item'}</button></div></form>
    </div></div>}
  </div>;
}
