import express from 'express';
import {
  createTicketHandler,
  getMessages,
  listTickets,
  sendMessage,
} from '../controllers/support.controller.js';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/tickets', protect, authorizeRoles('user'), listTickets);
router.post('/tickets', protect, authorizeRoles('user'), createTicketHandler);
router.get('/tickets/:ticketId/messages', protect, authorizeRoles('user'), getMessages);
router.post('/tickets/:ticketId/messages', protect, authorizeRoles('user'), sendMessage);

export default router;
