import express from 'express';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';

const router = express.Router();

router.get('/dashboard', protect, authorizeRoles('dermatologist'), (req, res) => {
  res.json({
    message: 'Welcome to the DermaScope Partner Portal',
    partner: req.user,
  });
});

export default router;
