import express from 'express';
import { createFeedback, getFeedbackByComplaint } from '../controllers/feedbackController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createFeedback);
router.get('/:complaintId', authMiddleware, getFeedbackByComplaint);

export default router;
