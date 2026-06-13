import express from 'express';
import {
  getDermatologists,
  getRecommended,
  getTimeSlots,
} from '../controllers/dermatologist.controller.js';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/recommended', protect, authorizeRoles('user'), getRecommended);
router.get('/:id/slots', protect, authorizeRoles('user'), getTimeSlots);
router.get('/', protect, authorizeRoles('user'), getDermatologists);

export default router;
