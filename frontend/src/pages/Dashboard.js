import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const statusBadge = (status) => {
  const map = {
    scheduled: 'badge-scheduled',
    confirmed: 'badge-confirmed',
    'in-progress': 'badge-inprogress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled'
  };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    axios.get('/api/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Loading dashboard...</div>;
  }
  if (!stats) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card gold">
          <div className="label">Today's Revenue</div>
          <div className="value">{formatCurrency(stats.revenueToday)}</div>
          <div className="sub">Month: {formatCurrency(stats.revenueMonth)}</div>
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

      <div className="dashboard-panels">
        <div className="card dashboard-panel-card">
          <h3 className="dashboard-panel-title">Recent Appointments</h3>
          {stats.recentAppointments.length === 0 ? (
            <p className="dashboard-panel-empty">No appointments yet</p>
          ) : (
            stats.recentAppointments.map((appt) => (
              <div key={appt.id} className="dashboard-item-row">
                <div>
                  <div className="dashboard-item-primary">{appt.customer?.name}</div>
                  <div className="dashboard-item-secondary">
                    {appt.staff?.name} | {appt.timeSlot} | {new Date(appt.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                {statusBadge(appt.status)}
              </div>
            ))
          )}
        </div>

        <div className="card dashboard-panel-card">
          <h3 className="dashboard-panel-title">Top Services This Month</h3>
          {stats.topServices.length === 0 ? (
            <p className="dashboard-panel-empty">No data yet</p>
          ) : (
            stats.topServices.map((svc, index) => (
              <div key={svc.id || index} className="dashboard-item-row dashboard-item-rank-row">
                <span className="dashboard-rank-dot">{index + 1}</span>
                <div className="dashboard-rank-content">
                  <div className="dashboard-item-primary">{svc.name}</div>
                  <div className="dashboard-item-secondary">{svc.count} bookings</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
