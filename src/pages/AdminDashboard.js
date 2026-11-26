import { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import Icon from './Icon';

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/admin/overview')
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  if (!overview && !error) {
    return <p className="history-loading" role="status">Loading admin overview…</p>;
  }
  if (!overview) {
    return <p className="api-error" role="alert">The admin overview could not be loaded: {error}</p>;
  }

  const metrics = [
    { label: 'Registered members', value: overview.users, icon: 'user', detail: 'All accounts' },
    { label: 'Completed workouts', value: overview.workouts, icon: 'chart', detail: 'Across all members' },
    { label: 'Exercise catalog', value: overview.exercises, icon: 'library', detail: 'Available exercises' },
    { label: 'Workouts this week', value: overview.workoutsLast7Days, icon: 'flame', detail: 'Last 7 days' },
  ];

  return (
    <section className="screen-stack admin-screen" aria-label="Admin overview">
      <section className="admin-welcome">
        <div>
          <p className="eyebrow">PLATFORM OVERVIEW</p>
          <h2>Welcome to your admin dashboard.</h2>
          <p>Monitor membership, workout activity, and the exercise catalog in one place.</p>
        </div>
        <span className="admin-badge"><Icon name="chart" /> ADMIN</span>
      </section>

      <div className="progress-metric-grid admin-metric-grid">
        {metrics.map((metric) => (
          <article className="progress-metric-card" key={metric.label}>
            <span className="progress-metric-icon"><Icon name={metric.icon} /></span>
            <strong>{metric.value.toLocaleString()}</strong>
            <b>{metric.label}</b>
            <small>{metric.detail}</small>
          </article>
        ))}
      </div>

      <section className="panel admin-info-panel">
        <p className="eyebrow">ADMIN ACCESS</p>
        <h3>Secure by configuration</h3>
        <p>
          Admin access is granted to the email addresses configured in the server’s
          {' '}<code>ADMIN_EMAILS</code> environment variable. Separate multiple addresses with commas.
        </p>
      </section>
    </section>
  );
}

export default AdminDashboard;
