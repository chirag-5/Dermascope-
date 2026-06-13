import express from 'express';
import { createMessage, getMessages } from '../controllers/message.controller.js';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('user', 'dermatologist'), createMessage);
router.get('/:bookingId', protect, authorizeRoles('user', 'dermatologist'), getMessages);

export default router;
