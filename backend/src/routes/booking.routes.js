import express from 'express';
import {
  createBooking,
  getBookingById,
  getDoctorBookingsList,
  getUserBookingsList,
  updateBookingStatus,
} from '../controllers/booking.controller.js';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('user'), createBooking);
router.get('/user', protect, authorizeRoles('user'), getUserBookingsList);
router.get('/doctor', protect, authorizeRoles('dermatologist'), getDoctorBookingsList);
router.patch('/:id/status', protect, authorizeRoles('dermatologist'), updateBookingStatus);
router.get('/:id', protect, authorizeRoles('user', 'dermatologist'), getBookingById);

export default router;
