import { db, admin } from '../config/firebaseAdmin.js';

/**
 * Persists an alert to the notifications collection and attempts FCM push delivery.
 */
export const createNotificationService = async (userId, title, message, type = 'general') => {
  const notificationId = `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const notificationData = {
    notificationId,
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  try {
    await db.collection('notifications').doc(notificationId).set(notificationData);
  } catch (e) {
    console.error("Failed to write database notification log:", e);
  }
  
  // Attempt optional FCM push notification dispatch
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().fcmToken) {
      const payload = {
        notification: {
          title,
          body: message
        },
        token: userDoc.data().fcmToken
      };
      await admin.messaging().send(payload);
    }
  } catch (error) {
    // Log skipped/failed FCM payload delivery silently
    console.log(`FCM delivery skipped for ${userId} (token absent/invalid): ${error.message}`);
  }
  
  return notificationData;
};
