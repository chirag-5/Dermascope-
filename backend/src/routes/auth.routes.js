import express from 'express';
import {
  registerUser,
  registerDermatologist,
  loginUser,
  loginDermatologist,
  loginWithGoogle,
  getMe,
} from '../controllers/auth.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register/user', registerUser);
router.post('/register/dermatologist', registerDermatologist);
router.post('/login/user', loginUser);
router.post('/login/dermatologist', loginDermatologist);
router.post('/google', loginWithGoogle);
router.get('/me', protect, getMe);

export default router;
