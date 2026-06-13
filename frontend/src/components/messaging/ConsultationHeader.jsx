import { Link } from 'react-router-dom';

const formatDoctorName = (name) => {
  if (!name?.trim()) {
    return 'Dermatologist';
  }

  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) {
    return 'Not scheduled';
  }

  return new Date(dateString).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const ConsultationHeader = ({
  booking,
  viewerRole = 'user',
  onStatusUpdate,
  statusUpdating = false,
}) => {
  if (!booking) {
    return null;
  }

  const isPartner = viewerRole === 'dermatologist';

  return (
    <header className="consultation-chat-header">
      <div className="consultation-chat-header-main">
        {isPartner ? (
          <>
            <h1>{booking.user?.name || 'Patient'}</h1>
            <p className="consultation-chat-sub">{booking.user?.email}</p>
          </>
        ) : (
          <>
            <h1>{formatDoctorName(booking.dermatologist?.name)}</h1>
            <p className="consultation-chat-sub">
              {booking.dermatologist?.clinicName || 'Independent practice'}
            </p>
          </>
        )}
      </div>

      <div className="consultation-chat-header-meta">
        <div className="consultation-chat-meta-item">
          <span className="consultation-chat-meta-label">Appointment</span>
          <span>{formatDateTime(booking.scheduledAt)}</span>
        </div>
        <div className="consultation-chat-meta-item">
          <span className="consultation-chat-meta-label">Consultation</span>
          <span className={`status-badge status-booking-${booking.status}`}>{booking.status}</span>
        </div>
        {booking.analysis && (
          <div className="consultation-chat-meta-item">
            <span className="consultation-chat-meta-label">Analysis</span>
            <span className={`status-badge status-${booking.analysis.status}`}>
              {booking.analysis.status}
            </span>
          </div>
        )}
      </div>

      {isPartner && onStatusUpdate && (
        <div className="consultation-chat-actions">
          {booking.status === 'pending' && (
            <>
              <button
                type="button"
                className="btn-partner btn-partner-inline"
                disabled={statusUpdating}
                onClick={() => onStatusUpdate('active')}
              >
                Accept
              </button>
              <button
                type="button"
                className="btn-partner-muted btn-decline"
                disabled={statusUpdating}
                onClick={() => onStatusUpdate('declined')}
              >
                Decline
              </button>
            </>
          )}
          {booking.status === 'active' && (
            <button
              type="button"
              className="btn-partner btn-partner-inline"
              disabled={statusUpdating}
              onClick={() => onStatusUpdate('completed')}
            >
              Mark as Complete
            </button>
          )}
          <Link
            className="consultation-chat-detail-link"
            to={`/partner/bookings/${booking._id}`}
          >
            View patient analysis
          </Link>
        </div>
      )}

      {!isPartner && (
        <div className="consultation-chat-actions">
          <Link className="consultation-chat-detail-link" to={`/booking/${booking._id}`}>
            View consultation details
          </Link>
        </div>
      )}
    </header>
  );
};

export default ConsultationHeader;
