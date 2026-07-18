import { db } from '../config/firebaseAdmin.js';

/**
 * Returns a list of all user accounts. Restricted to administrators.
 */
export const getUsers = async (req, res) => {
  try {
    const userRole = (req.user.role || '').toUpperCase();
    if (userRole !== 'SUPER ADMIN' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: "Access restricted to Administrators" });
    }
    const snap = await db.collection('users').get();
    const users = [];
    snap.forEach(doc => {
      users.push(doc.data());
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsers controller:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Retrieves profile detail for a specific user ID.
 */
export const getUserById = async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid || req.user.email;
  const userRole = (req.user.role || '').toUpperCase();
  
  if (userRole !== 'SUPER ADMIN' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && uid !== id) {
    return res.status(403).json({ error: "Access forbidden: cannot view another user profile" });
  }
  
  try {
    const snap = await db.collection('users').doc(id).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(snap.data());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

/**
 * Updates profile properties of a user document.
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const uid = req.user.uid || req.user.email;
  const userRole = (req.user.role || '').toUpperCase();
  
  if (userRole !== 'SUPER ADMIN' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && uid !== id) {
    return res.status(403).json({ error: "Access forbidden: cannot edit another user profile" });
  }
  
  try {
    const userDocRef = db.collection('users').doc(id);
    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    delete updates.uid;
    delete updates.email;
    
    await userDocRef.update(updates);
    const snap = await userDocRef.get();
    res.status(200).json(snap.data());
  } catch (error) {
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

/**
 * Removes a user account from Firestore. Restricted to administrators.
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user.role || '').toUpperCase();
  if (userRole !== 'SUPER ADMIN' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: "Access restricted to Administrators" });
  }
  try {
    await db.collection('users').doc(id).delete();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};
