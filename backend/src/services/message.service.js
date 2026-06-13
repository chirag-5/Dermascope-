import Message from '../models/Message.js';
import User from '../models/User.js';
import Dermatologist from '../models/Dermatologist.js';
import { verifyBookingAccess } from './booking.service.js';

const formatDermatologistName = (name) => {
  if (!name?.trim()) {
    return 'Dermatologist';
  }

  const trimmed = name.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
};

const getSenderNameFromRequester = (requester) => {
  if (requester.role === 'user') {
    return requester.name;
  }

  return formatDermatologistName(requester.name);
};

const resolveSenderName = async (senderId, senderRole) => {
  const id = String(senderId);

  if (senderRole === 'user') {
    const user = await User.findById(id).select('name');
    return user?.name || 'Patient';
  }

  if (senderRole === 'dermatologist') {
    const dermatologist = await Dermatologist.findById(id).select('name');
    return formatDermatologistName(dermatologist?.name);
  }

  return 'Unknown';
};

const formatMessage = async (message, senderNameCache = new Map()) => {
  let senderName = message.senderName;

  if (!senderName) {
    const cacheKey = `${message.senderRole}:${String(message.senderId)}`;

    if (!senderNameCache.has(cacheKey)) {
      senderNameCache.set(cacheKey, await resolveSenderName(message.senderId, message.senderRole));
    }

    senderName = senderNameCache.get(cacheKey);
  }

  return {
    _id: message._id,
    bookingId: message.bookingId,
    senderId: message.senderId,
    senderRole: message.senderRole,
    senderName,
    text: message.text,
    createdAt: message.createdAt,
  };
};

export const getMessagesByBookingId = async (bookingId, requester) => {
  await verifyBookingAccess(bookingId, requester);

  const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
  const senderNameCache = new Map();

  return Promise.all(messages.map((message) => formatMessage(message, senderNameCache)));
};

export const createMessage = async (requester, { bookingId, text }) => {
  if (!bookingId || !text?.trim()) {
    const error = new Error('bookingId and text are required');
    error.statusCode = 400;
    throw error;
  }

  await verifyBookingAccess(bookingId, requester);

  const message = await Message.create({
    bookingId,
    senderId: requester.id,
    senderRole: requester.role,
    senderName: getSenderNameFromRequester(requester),
    text: text.trim(),
  });

  return formatMessage(message);
};
