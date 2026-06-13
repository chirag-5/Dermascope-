import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import PartnerShell from '../components/PartnerShell';
import MessengerLayout from '../components/messaging/MessengerLayout';
import ConversationListSidebar, {
  formatDate,
} from '../components/messaging/ConversationListSidebar';
import ConsultationHeader from '../components/messaging/ConsultationHeader';
import MessengerWindow from '../components/messaging/MessengerWindow';

const PartnerConsultations = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const refreshBookings = async () => {
    setListLoading(true);
    setListError('');

    try {
      const { data } = await bookingService.getDoctorBookings();
      setBookings(data);
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load consultations');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setBookingError('');
      return;
    }

    const fetchBooking = async () => {
      setBookingLoading(true);
      setBookingError('');

      try {
        const { data } = await bookingService.getById(bookingId);
        setBooking(data);
      } catch (err) {
        setBookingError(err.response?.data?.message || 'Failed to load consultation');
        setBooking(null);
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleStatusUpdate = async (status) => {
    if (!bookingId) {
      return;
    }

    setStatusUpdating(true);
    setBookingError('');

    try {
      const { data } = await bookingService.updateStatus(bookingId, status);
      setBooking(data);
      await refreshBookings();
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to update consultation status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const sections = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'pending' || b.status === 'active');
    const past = bookings.filter((b) => b.status === 'completed' || b.status === 'declined');

    const toItem = (item) => ({
      id: item._id,
      title: item.user?.name || 'Patient',
      subtitle: `${formatDate(item.scheduledAt || item.createdAt)} · ${item.status}`,
    });

    return [
      {
        title: 'Active consultations',
        emptyLabel: 'No active consultations',
        items: active.map(toItem),
      },
      {
        title: 'Past consultations',
        emptyLabel: 'No past consultations',
        items: past.map(toItem),
      },
    ];
  }, [bookings]);

  const showChat = Boolean(bookingId);

  return (
    <PartnerShell messaging>
      <div className="messaging-page-header">
        <h1>Consultations</h1>
        <button type="button" className="btn-partner-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <MessengerLayout
        sidebarTitle="Patient consultations"
        showChat={showChat}
        onBack={() => navigate('/consultations')}
        backLabel="All consultations"
        sidebar={
          <ConversationListSidebar
            loading={listLoading}
            error={listError}
            activeSections={sections}
            activeId={bookingId}
            basePath="/consultations"
            emptyMessage="No patient consultations yet."
          />
        }
      >
        {!bookingId ? (
          <div className="messenger-empty-state">
            <h2>Select a consultation</h2>
            <p>Choose a patient from the list to view your conversation.</p>
          </div>
        ) : bookingLoading ? (
          <p className="messenger-placeholder">Loading consultation...</p>
        ) : bookingError && !booking ? (
          <div className="messenger-empty-state">
            <div className="error">{bookingError}</div>
            <button
              type="button"
              className="btn-partner-muted"
              onClick={() => navigate('/consultations')}
            >
              Back to list
            </button>
          </div>
        ) : (
          <>
            <ConsultationHeader
              booking={booking}
              viewerRole="dermatologist"
              onStatusUpdate={handleStatusUpdate}
              statusUpdating={statusUpdating}
            />
            {bookingError && <div className="error messenger-error">{bookingError}</div>}
            <MessengerWindow
              type="consultation"
              conversationId={bookingId}
              viewerRole="dermatologist"
              placeholder="Message your patient..."
              sendButtonClass="btn-partner"
            />
          </>
        )}
      </MessengerLayout>
    </PartnerShell>
  );
};

export default PartnerConsultations;
