import {
  createMessage as createMessageRecord,
  getMessagesByBookingId,
} from '../services/message.service.js';

const handleError = (res, error) =>
  res.status(error.statusCode || 500).json({ message: error.message });

export const getMessages = async (req, res) => {
  try {
    const messages = await getMessagesByBookingId(req.params.bookingId, req.user);
    return res.json(messages);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createMessage = async (req, res) => {
  try {
    const { bookingId, text } = req.body;
    const message = await createMessageRecord(req.user, { bookingId, text });
    return res.status(201).json(message);
  } catch (error) {
    return handleError(res, error);
  }
};
