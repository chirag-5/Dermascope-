import express from 'express';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorizeRoles('user'), (req, res) => {
  res.json({
    message: 'Welcome to the DermaScope user dashboard',
    user: req.user,
  });
});

export default router;
