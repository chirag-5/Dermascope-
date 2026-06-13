import {
  createBooking as createBookingRecord,
  getBookingById as fetchBookingById,
  getDoctorBookings,
  getUserBookings,
  updateBookingStatus as updateBookingStatusRecord,
} from '../services/booking.service.js';

const handleError = (res, error) =>
  res.status(error.statusCode || 500).json({ message: error.message });

export const createBooking = async (req, res) => {
  try {
    const { dermatologistId, analysisId, scheduledAt } = req.body;
    const booking = await createBookingRecord(req.user.id, {
      dermatologistId,
      analysisId,
      scheduledAt,
    });
    return res.status(201).json(booking);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserBookingsList = async (req, res) => {
  try {
    const bookings = await getUserBookings(req.user.id);
    return res.json(bookings);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getDoctorBookingsList = async (req, res) => {
  try {
    const bookings = await getDoctorBookings(req.user.id);
    return res.json(bookings);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await fetchBookingById(req.params.id, req.user);
    return res.json(booking);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or completed' });
    }

    const booking = await updateBookingStatusRecord(req.params.id, req.user.id, status);
    return res.json(booking);
  } catch (error) {
    return handleError(res, error);
  }
};
