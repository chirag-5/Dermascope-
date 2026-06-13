import { useCallback, useEffect, useRef, useState } from 'react';
import { supportService } from '../services/supportService';

const POLL_INTERVAL_MS = 5000;

const formatTimestamp = (dateString) =>
  new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const SupportChat = ({ compact = false }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const { data } = await supportService.getMessages();
      setMessages(data);
      setError('');
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to load support messages');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

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
    if (!trimmed) return;

    setSending(true);
    setError('');

    try {
      await supportService.send(trimmed);
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
          <h2>Help &amp; Support</h2>
          <p className="subtitle">Having an issue? Message our support team.</p>
        </>
      )}

      {error && <div className="error">{error}</div>}

      <div className="chat-messages chat-messages-panel">
        {loading && messages.length === 0 && (
          <p className="subtitle">Loading support chat...</p>
        )}

        {!loading && messages.length === 0 && (
          <p className="subtitle">
            Describe your issue — booking, analysis, or account help.
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat-message chat-message-${message.senderRole === 'support' ? 'dermatologist' : 'user'}`}
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
          placeholder="Describe your issue..."
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

export default SupportChat;
