import express from 'express';
import { getAnalysis, uploadAnalysis } from '../controllers/analysis.controller.js';
import protect from '../middleware/auth.middleware.js';
import authorizeRoles from '../middleware/role.middleware.js';
import { handleUploadError, upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post(
  '/upload',
  protect,
  authorizeRoles('user'),
  upload.single('image'),
  handleUploadError,
  uploadAnalysis
);

router.get('/:id', protect, authorizeRoles('user'), getAnalysis);

export default router;
