import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import PartnerShell from '../components/PartnerShell';

const formatSlot = (dateString) => {
  if (!dateString) {
    return 'Time not specified';
  }

  return new Date(dateString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PartnerDashboard = () => {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await bookingService.getDoctorBookings();
      setBookings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const pendingRequests = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending'),
    [bookings]
  );

  const activeConsultations = useMemo(
    () => bookings.filter((booking) => booking.status === 'active'),
    [bookings]
  );

  const handleStatusUpdate = async (bookingId, status) => {
    setUpdatingId(bookingId);
    setError('');

    try {
      await bookingService.updateStatus(bookingId, status);
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PartnerShell wide>
      <div className="page-header">
        <h1>Dashboard</h1>
        <button type="button" className="btn-partner-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <p className="partner-welcome">Welcome, Dr. {user?.name}</p>

      {loading && <p className="subtitle">Loading consultations...</p>}
      {error && <div className="error">{error}</div>}

      {!loading && (
        <section className="dashboard-requests-section">
          <div className="dashboard-requests-header">
            <h2>New consultation requests</h2>
            {pendingRequests.length > 0 ? (
              <span className="dashboard-requests-badge">{pendingRequests.length} new</span>
            ) : (
              <span className="dashboard-requests-badge dashboard-requests-badge-empty">
                None
              </span>
            )}
          </div>

          {pendingRequests.length === 0 ? (
            <p className="subtitle dashboard-requests-empty">
              No pending requests right now. New patient bookings will appear here.
            </p>
          ) : (
            <div className="dashboard-requests-list">
              {pendingRequests.map((booking) => (
                <article key={booking._id} className="dashboard-request-card">
                  <div className="dashboard-request-main">
                    <p className="dashboard-request-label">Consultation request</p>
                    <h3>{booking.user?.name || 'Patient'}</h3>
                    <p className="dashboard-request-meta">
                      Requested slot: {formatSlot(booking.scheduledAt)}
                    </p>
                    {booking.user?.email && (
                      <p className="dashboard-request-email">{booking.user.email}</p>
                    )}
                  </div>

                  <div className="dashboard-request-actions">
                    <button
                      type="button"
                      className="btn-partner btn-partner-inline"
                      disabled={updatingId === booking._id}
                      onClick={() => handleStatusUpdate(booking._id, 'active')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn-partner-muted btn-decline"
                      disabled={updatingId === booking._id}
                      onClick={() => handleStatusUpdate(booking._id, 'declined')}
                    >
                      Decline
                    </button>
                    <Link
                      to={`/bookings/${booking._id}`}
                      className="dashboard-request-review-link"
                    >
                      Review analysis
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!loading && activeConsultations.length > 0 && (
        <section className="dashboard-active-section">
          <h2>In-progress consultations ({activeConsultations.length})</h2>
          <div className="booking-list">
            {activeConsultations.map((booking) => (
              <Link
                key={booking._id}
                to={`/consultations/${booking._id}`}
                className="booking-list-card partner-booking-card"
              >
                <div className="booking-list-card-header">
                  <h2>{booking.user?.name || 'Patient'}</h2>
                  <span className="status-badge status-booking-active">active</span>
                </div>
                <p className="booking-list-meta">
                  <span>{formatSlot(booking.scheduledAt)}</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="partner-dashboard-hint">
        <h2>How it works</h2>
        <ul>
          <li>
            <strong>New requests</strong> — patients waiting for you to accept or decline
          </li>
          <li>
            <strong>Active</strong> — accepted consultations you can message
          </li>
          <li>
            <strong>Past</strong> — completed or declined consultations in Messages
          </li>
        </ul>
        <p className="link-row">
          <Link to="/consultations">Open all messages</Link>
        </p>
      </div>
    </PartnerShell>
  );
};

export default PartnerDashboard;
