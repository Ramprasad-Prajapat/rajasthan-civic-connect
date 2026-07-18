import express from 'express';
import { getNotifications, markNotificationAsRead, createNotification } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markNotificationAsRead);
router.post('/', authMiddleware, createNotification);

export default router;
