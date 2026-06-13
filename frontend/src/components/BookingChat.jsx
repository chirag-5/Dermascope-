import { useCallback, useEffect, useRef, useState } from 'react';
import { messageService } from '../services/messageService';

const POLL_INTERVAL_MS = 5000;

const formatTimestamp = (dateString) =>
  new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const BookingChat = ({ bookingId, compact = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const { data } = await messageService.getByBookingId(bookingId);
      setMessages(data);
      setError('');
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const intervalId = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await messageService.send({ bookingId, text: trimmed });
      setText('');
      await fetchMessages(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`chat-section ${compact ? 'chat-section-compact' : ''}`}>
      {!compact && (
        <>
          <h2>Consultation Chat</h2>
          <p className="subtitle">Message your dermatologist about this consultation.</p>
        </>
      )}

      {error && <div className="error">{error}</div>}

      <div className={`chat-messages ${compact ? 'chat-messages-panel' : ''}`}>
        {loading && messages.length === 0 && (
          <p className="subtitle">Loading conversation...</p>
        )}

        {!loading && messages.length === 0 && (
          <p className="subtitle">No messages yet. Start the conversation.</p>
        )}

        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat-message chat-message-${message.senderRole}`}
          >
            <span className="chat-sender">{message.senderName}</span>
            <p className="chat-text">{message.text}</p>
            <span className="chat-time">{formatTimestamp(message.createdAt)}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Message your doctor..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-user" disabled={sending || !text.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default BookingChat;
