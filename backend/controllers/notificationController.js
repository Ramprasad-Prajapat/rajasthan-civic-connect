import { db } from '../config/firebaseAdmin.js';
import { createNotificationService } from '../services/notificationService.js';

/**
 * Returns notifications for the active user.
 */
export const getNotifications = async (req, res) => {
  const uid = req.user.uid || req.user.email;
  try {
    const snap = await db.collection('notifications')
      .where('userId', '==', uid)
      .get();
      
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/**
 * Marks notification document status as read.
 */
export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('notifications').doc(id).update({
      read: true,
      isRead: true
    });
    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
};

/**
 * Manually logs/sends a notification to a specific user.
 */
export const createNotification = async (req, res) => {
  const { userId, title, message, type } = req.body;
  try {
    const notif = await createNotificationService(userId, title, message, type);
    res.status(201).json(notif);
  } catch (error) {
    res.status(500).json({ error: "Failed to create notification" });
  }
};
