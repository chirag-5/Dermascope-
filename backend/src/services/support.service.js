import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';

const SUPPORT_AUTO_REPLY =
  'Thanks for reaching out! Our support team has received your message and will respond within 24 hours. For urgent medical concerns, please contact a healthcare provider directly.';

const formatTicket = (ticket) => ({
  _id: ticket._id,
  userId: ticket.userId,
  subject: ticket.subject,
  status: ticket.status,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

const formatSupportMessage = (message) => ({
  _id: message._id,
  ticketId: message.ticketId,
  senderId: message.senderId,
  senderRole: message.senderRole,
  senderName: message.senderName,
  text: message.text,
  createdAt: message.createdAt,
});

const verifyTicketAccess = async (ticketId, userId) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    const error = new Error('Support ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (ticket.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access this ticket');
    error.statusCode = 403;
    throw error;
  }

  return ticket;
};

export const getTicketsForUser = async (userId) => {
  const tickets = await SupportTicket.find({ userId }).sort({ updatedAt: -1 });
  return tickets.map(formatTicket);
};

export const createTicket = async (user, { subject, text }) => {
  if (!text?.trim()) {
    const error = new Error('Message text is required');
    error.statusCode = 400;
    throw error;
  }

  const ticket = await SupportTicket.create({
    userId: user.id,
    subject: subject?.trim() || 'General inquiry',
    status: 'open',
  });

  const userMessage = await SupportMessage.create({
    ticketId: ticket._id,
    senderRole: 'user',
    senderId: user.id,
    senderName: user.name,
    text: text.trim(),
  });

  await SupportMessage.create({
    ticketId: ticket._id,
    senderRole: 'support',
    senderName: 'DermaScope Support',
    text: SUPPORT_AUTO_REPLY,
  });

  return {
    ticket: formatTicket(ticket),
    messages: [formatSupportMessage(userMessage)],
  };
};

export const getTicketMessages = async (ticketId, userId) => {
  await verifyTicketAccess(ticketId, userId);

  const messages = await SupportMessage.find({ ticketId }).sort({ createdAt: 1 });
  return messages.map(formatSupportMessage);
};

export const createTicketMessage = async (user, ticketId, text) => {
  if (!text?.trim()) {
    const error = new Error('Message text is required');
    error.statusCode = 400;
    throw error;
  }

  const ticket = await verifyTicketAccess(ticketId, user.id);

  const userMessage = await SupportMessage.create({
    ticketId: ticket._id,
    senderRole: 'user',
    senderId: user.id,
    senderName: user.name,
    text: text.trim(),
  });

  await SupportMessage.create({
    ticketId: ticket._id,
    senderRole: 'support',
    senderName: 'DermaScope Support',
    text: SUPPORT_AUTO_REPLY,
  });

  ticket.updatedAt = new Date();
  await ticket.save();

  return formatSupportMessage(userMessage);
};
