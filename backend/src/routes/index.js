import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import partnerRoutes from './partner.routes.js';
import analysisRoutes from './analysis.routes.js';
import dermatologistRoutes from './dermatologist.routes.js';
import bookingRoutes from './booking.routes.js';
import messageRoutes from './message.routes.js';
import supportRoutes from './support.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/partner', partnerRoutes);
router.use('/analysis', analysisRoutes);
router.use('/dermatologists', dermatologistRoutes);
router.use('/bookings', bookingRoutes);
router.use('/messages', messageRoutes);
router.use('/support', supportRoutes);

export default router;
