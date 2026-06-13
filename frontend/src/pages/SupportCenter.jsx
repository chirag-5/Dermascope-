import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supportService } from '../services/supportService';
import UserShell from '../components/UserShell';
import MessengerLayout from '../components/messaging/MessengerLayout';
import ConversationListSidebar, {
  formatDate,
} from '../components/messaging/ConversationListSidebar';
import MessengerWindow from '../components/messaging/MessengerWindow';

const SupportCenter = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [createError, setCreateError] = useState('');

  const fetchTickets = async () => {
    setListLoading(true);
    setListError('');

    try {
      const { data } = await supportService.getTickets();
      setTickets(data);
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!ticketId) {
      setActiveTicket(null);
      return;
    }

    const ticket = tickets.find((item) => item._id === ticketId);
    setActiveTicket(ticket || { _id: ticketId, subject: 'Support ticket', status: 'open' });
  }, [ticketId, tickets]);

  const sections = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'open');
    const closed = tickets.filter((ticket) => ticket.status === 'closed');

    const toItem = (item) => ({
      id: item._id,
      title: item.subject,
      subtitle: `${formatDate(item.updatedAt || item.createdAt)} · ${item.status}`,
    });

    return [
      {
        title: 'Open tickets',
        emptyLabel: 'No open tickets',
        items: open.map(toItem),
      },
      {
        title: 'Closed tickets',
        emptyLabel: 'No closed tickets',
        items: closed.map(toItem),
      },
    ];
  }, [tickets]);

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const { data } = await supportService.createTicket({
        subject: newSubject.trim() || 'General inquiry',
        text: newMessage.trim(),
      });

      await fetchTickets();
      setShowNewTicket(false);
      setNewSubject('');
      setNewMessage('');
      navigate(`/support/${data.ticket._id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const showChat = Boolean(ticketId);

  return (
    <UserShell messaging>
      <div className="messaging-page-header">
        <h1>Help Center</h1>
        <button type="button" className="btn-user-muted" onClick={logout}>
          Logout
        </button>
      </div>

      <MessengerLayout
        sidebarTitle="Support tickets"
        showChat={showChat}
        onBack={() => navigate('/support')}
        backLabel="All tickets"
        sidebar={
          <>
            <button
              type="button"
              className="btn-user messenger-new-ticket-btn"
              onClick={() => setShowNewTicket((value) => !value)}
            >
              {showNewTicket ? 'Cancel' : 'New ticket'}
            </button>

            {showNewTicket && (
              <form className="messenger-new-ticket-form" onSubmit={handleCreateTicket}>
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  disabled={creating}
                />
                <textarea
                  placeholder="Describe your issue..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  disabled={creating}
                />
                {createError && <div className="error">{createError}</div>}
                <button type="submit" className="btn-user" disabled={creating || !newMessage.trim()}>
                  {creating ? 'Creating...' : 'Submit ticket'}
                </button>
              </form>
            )}

            <ConversationListSidebar
              loading={listLoading}
              error={listError}
              activeSections={sections}
              activeId={ticketId}
              basePath="/support"
              emptyMessage="No support tickets yet. Create one to get help."
            />
          </>
        }
      >
        {!ticketId ? (
          <div className="messenger-empty-state">
            <h2>How can we help?</h2>
            <p>Select a ticket or create a new one to chat with DermaScope Support.</p>
            <button type="button" className="btn-user messenger-empty-cta" onClick={() => setShowNewTicket(true)}>
              New support ticket
            </button>
          </div>
        ) : (
          <>
            <header className="support-chat-header">
              <h2>{activeTicket?.subject || 'Support ticket'}</h2>
              <span className={`status-badge status-support-${activeTicket?.status || 'open'}`}>
                {activeTicket?.status || 'open'}
              </span>
            </header>
            <MessengerWindow
              type="support"
              conversationId={ticketId}
              viewerRole="user"
              placeholder="Message support..."
            />
          </>
        )}
      </MessengerLayout>
    </UserShell>
  );
};

export default SupportCenter;
