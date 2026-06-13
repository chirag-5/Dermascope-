import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import UserShell from '../components/UserShell';
import MessengerLayout from '../components/messaging/MessengerLayout';
import ConversationListSidebar, {
  formatDate,
} from '../components/messaging/ConversationListSidebar';
import ConsultationHeader from '../components/messaging/ConsultationHeader';
import MessengerWindow from '../components/messaging/MessengerWindow';

const formatDoctorName = (name) => {
  if (!name?.trim()) {
    return 'Dermatologist';
  }

  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

const UserConsultations = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      setListLoading(true);
      setListError('');

      try {
        const { data } = await bookingService.getUserBookings();
        setBookings(data);
      } catch (err) {
        setListError(err.response?.data?.message || 'Failed to load consultations');
      } finally {
        setListLoading(false);
      }
    };

    fetchBookings();
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

  const sections = useMemo(() => {
    const active = bookings.filter((b) => b.status === 'pending' || b.status === 'active');
    const past = bookings.filter((b) => b.status === 'completed' || b.status === 'declined');

    const toItem = (item) => ({
      id: item._id,
      title: formatDoctorName(item.dermatologist?.name),
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
    <UserShell messaging>
      <div className="messaging-page-header">
        <h1>Consultations</h1>
        <button type="button" className="btn-user-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <MessengerLayout
        sidebarTitle="Your consultations"
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
            emptyMessage="No consultations yet. Book a dermatologist to start messaging."
          />
        }
      >
        {!bookingId ? (
          <div className="messenger-empty-state">
            <h2>Select a consultation</h2>
            <p>Choose a doctor from the list to view your conversation.</p>
            <Link to="/dermatologists" className="btn-user messenger-empty-cta">
              Find a dermatologist
            </Link>
          </div>
        ) : bookingLoading ? (
          <p className="messenger-placeholder">Loading consultation...</p>
        ) : bookingError ? (
          <div className="messenger-empty-state">
            <div className="error">{bookingError}</div>
            <button type="button" className="btn-user-muted" onClick={() => navigate('/consultations')}>
              Back to list
            </button>
          </div>
        ) : (
          <>
            <ConsultationHeader booking={booking} viewerRole="user" />
            <MessengerWindow
              type="consultation"
              conversationId={bookingId}
              viewerRole="user"
              placeholder="Message your doctor..."
            />
          </>
        )}
      </MessengerLayout>
    </UserShell>
  );
};

export default UserConsultations;
