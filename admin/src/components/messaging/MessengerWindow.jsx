import { useCallback, useEffect, useRef, useState } from 'react';
import { messageService } from '../../services/messageService';
import { supportService } from '../../services/supportService';

const POLL_INTERVAL_MS = 5000;

const formatTime = (dateString) =>
  new Date(dateString).toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

const MessengerWindow = ({
  type = 'consultation',
  conversationId,
  viewerRole,
  placeholder = 'Type a message...',
  sendButtonClass = 'btn-user',
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!conversationId) {
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        if (type === 'consultation') {
          const { data } = await messageService.getByBookingId(conversationId);
          setMessages(data);
        } else {
          const { data } = await supportService.getTicketMessages(conversationId);
          setMessages(data);
        }

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
    },
    [conversationId, type]
  );

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

  const getMessageAlign = (message) => {
    if (type === 'support') {
      return message.senderRole === 'user' ? 'user' : 'other';
    }

    if (viewerRole === 'user') {
      return message.senderRole === 'user' ? 'user' : 'other';
    }

    return message.senderRole === 'dermatologist' ? 'user' : 'other';
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || !conversationId) {
      return;
    }

    setSending(true);
    setError('');

    try {
      if (type === 'consultation') {
        await messageService.send({ bookingId: conversationId, text: trimmed });
      } else {
        await supportService.sendTicketMessage(conversationId, trimmed);
      }

      setText('');
      await fetchMessages(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messenger-window">
      {error && <div className="error messenger-error">{error}</div>}

      <div className="messenger-messages">
        {loading && messages.length === 0 && (
          <p className="messenger-placeholder">Loading conversation...</p>
        )}

        {!loading && messages.length === 0 && (
          <p className="messenger-placeholder">No messages yet. Start the conversation.</p>
        )}

        {messages.map((message) => {
          const align = getMessageAlign(message);

          return (
            <div key={message._id} className={`messenger-row messenger-row-${align}`}>
              <div className={`messenger-bubble messenger-bubble-${align}`}>
                <div className="messenger-bubble-meta">
                  <span className="messenger-sender">{message.senderName}</span>
                  <span className="messenger-time">{formatTime(message.createdAt)}</span>
                </div>
                <p className="messenger-text">{message.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="messenger-form" onSubmit={handleSend}>
        <input
          type="text"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className={sendButtonClass} disabled={sending || !text.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessengerWindow;
