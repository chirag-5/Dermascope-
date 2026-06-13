import {
  createTicket,
  createTicketMessage,
  getTicketMessages,
  getTicketsForUser,
} from '../services/support.service.js';

const handleError = (res, error) =>
  res.status(error.statusCode || 500).json({ message: error.message });

export const listTickets = async (req, res) => {
  try {
    const tickets = await getTicketsForUser(req.user.id);
    return res.json(tickets);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createTicketHandler = async (req, res) => {
  try {
    const { subject, text } = req.body;
    const result = await createTicket(req.user, { subject, text });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await getTicketMessages(req.params.ticketId, req.user.id);
    return res.json(messages);
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await createTicketMessage(req.user, req.params.ticketId, text);
    return res.status(201).json(message);
  } catch (error) {
    return handleError(res, error);
  }
};
