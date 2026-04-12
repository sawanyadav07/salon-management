import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const statusBadge = (status) => {
  const map = {
    scheduled: 'badge-scheduled', confirmed: 'badge-confirmed',
    'in-progress': 'badge-inprogress', completed: 'badge-completed', cancelled: 'badge-cancelled'
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading dashboard...</div>;
  if (!stats) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card gold">
          <div className="label">Today's Revenue</div>
          <div className="value">₹{stats.revenueToday.toLocaleString('en-IN')}</div>
          <div className="sub">Month: ₹{stats.revenueMonth.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card blue">
          <div className="label">Today's Appointments</div>
          <div className="value">{stats.todayAppts}</div>
          <div className="sub">{stats.pendingAppts} pending</div>
        </div>
        <div className="stat-card green">
          <div className="label">Total Customers</div>
          <div className="value">{stats.totalCustomers}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card purple">
          <div className="label">Active Staff</div>
          <div className="value">{stats.activeStaff}</div>
          <div className="sub">Team members</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Appointments */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
            Recent Appointments
          </h3>
          {stats.recentAppointments.length === 0
            ? <p style={{ color: '#a0aec0', fontSize: '14px' }}>No appointments yet</p>
            : stats.recentAppointments.map(appt => (
              <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{appt.customer?.name}</div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    {appt.staff?.name} · {appt.timeSlot} · {new Date(appt.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                {statusBadge(appt.status)}
              </div>
            ))
          }
        </div>

        {/* Top Services */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1a202c' }}>
            Top Services This Month
          </h3>
          {stats.topServices.length === 0
            ? <p style={{ color: '#a0aec0', fontSize: '14px' }}>No data yet</p>
            : stats.topServices.map((svc, i) => (
              <div key={svc.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2b96f', color: '#1a202c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{svc.name}</div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>{svc.count} bookings</div>
                </div>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  );
}
