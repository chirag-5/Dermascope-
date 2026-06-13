import Booking from '../models/Booking.js';
import Analysis from '../models/Analysis.js';
import Dermatologist from '../models/Dermatologist.js';

const formatAnalysis = (analysis) => {
  if (!analysis) {
    return null;
  }

  return {
    originalImage: analysis.originalImage,
    annotatedImage: analysis.annotatedImage,
    detections: analysis.detections,
    status: analysis.status,
  };
};

const formatDermatologist = (dermatologist) => {
  if (!dermatologist) {
    return null;
  }

  return {
    _id: dermatologist._id,
    name: dermatologist.name,
    clinicName: dermatologist.clinicName,
  };
};

const formatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};

export const formatBooking = (booking) => {
  const analysisDoc = booking.analysisId;
  const dermatologistDoc = booking.dermatologistId;
  const userDoc = booking.userId;

  return {
    _id: booking._id,
    userId: userDoc?._id || booking.userId,
    dermatologistId: dermatologistDoc?._id || booking.dermatologistId,
    analysisId: analysisDoc?._id || booking.analysisId,
    status: booking.status,
    scheduledAt: booking.scheduledAt,
    analysisForwarded: booking.analysisForwarded,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    user: formatUser(userDoc),
    dermatologist: formatDermatologist(dermatologistDoc),
    analysis: formatAnalysis(analysisDoc),
  };
};

const populateBookingQuery = (query) =>
  query
    .populate('userId', 'name email')
    .populate('dermatologistId', 'name clinicName')
    .populate('analysisId', 'originalImage annotatedImage detections status');

const assertBookingAccess = (booking, requester) => {
  const userId = booking.userId?._id?.toString() || booking.userId?.toString();
  const dermatologistId =
    booking.dermatologistId?._id?.toString() || booking.dermatologistId?.toString();

  if (requester.role === 'user' && userId === requester.id.toString()) {
    return;
  }

  if (requester.role === 'dermatologist' && dermatologistId === requester.id.toString()) {
    return;
  }

  const error = new Error('Not authorized to view this booking');
  error.statusCode = 403;
  throw error;
};

export const verifyBookingAccess = async (bookingId, requester) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  assertBookingAccess(booking, requester);
  return booking;
};

export const createBooking = async (userId, { dermatologistId, analysisId, scheduledAt }) => {
  if (!dermatologistId || !analysisId || !scheduledAt) {
    const error = new Error('dermatologistId, analysisId, and scheduledAt are required');
    error.statusCode = 400;
    throw error;
  }

  const slotDate = new Date(scheduledAt);

  if (Number.isNaN(slotDate.getTime())) {
    const error = new Error('Invalid scheduledAt date');
    error.statusCode = 400;
    throw error;
  }

  const dermatologist = await Dermatologist.findById(dermatologistId);

  if (!dermatologist) {
    const error = new Error('Dermatologist not found');
    error.statusCode = 404;
    throw error;
  }

  if (dermatologist.availability === 'unavailable') {
    const error = new Error('This dermatologist is not available for booking');
    error.statusCode = 400;
    throw error;
  }

  const existingSlot = await Booking.findOne({
    dermatologistId,
    scheduledAt: slotDate,
    status: { $ne: 'completed' },
  });

  if (existingSlot) {
    const error = new Error('This time slot is no longer available');
    error.statusCode = 409;
    throw error;
  }

  const analysis = await Analysis.findById(analysisId);

  if (!analysis) {
    const error = new Error('Analysis not found');
    error.statusCode = 404;
    throw error;
  }

  if (analysis.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to use this analysis');
    error.statusCode = 403;
    throw error;
  }

  const booking = await Booking.create({
    userId,
    dermatologistId,
    analysisId,
    scheduledAt: slotDate,
    analysisForwarded: true,
  });

  const populated = await populateBookingQuery(Booking.findById(booking._id));
  return formatBooking(populated);
};

export const getBookingById = async (bookingId, requester) => {
  const booking = await populateBookingQuery(Booking.findById(bookingId));

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  assertBookingAccess(booking, requester);
  return formatBooking(booking);
};

export const getUserBookings = async (userId) => {
  const bookings = await populateBookingQuery(
    Booking.find({ userId }).sort({ createdAt: -1 })
  );

  return bookings.map(formatBooking);
};

export const getDoctorBookings = async (dermatologistId) => {
  const bookings = await populateBookingQuery(
    Booking.find({ dermatologistId }).sort({ createdAt: -1 })
  );

  return bookings.map(formatBooking);
};

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['active', 'completed', 'declined'],
  active: ['completed'],
  completed: [],
  declined: [],
};

export const updateBookingStatus = async (bookingId, dermatologistId, status) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.dermatologistId.toString() !== dermatologistId.toString()) {
    const error = new Error('Not authorized to update this booking');
    error.statusCode = 403;
    throw error;
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];

  if (!allowed.includes(status)) {
    const error = new Error(`Cannot change booking from ${booking.status} to ${status}`);
    error.statusCode = 400;
    throw error;
  }

  booking.status = status;
  await booking.save();

  const populated = await populateBookingQuery(Booking.findById(booking._id));
  return formatBooking(populated);
};
