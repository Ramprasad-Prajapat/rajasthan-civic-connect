// Auth controller for Firestore user profiles & authentication synchronization
import { db, mode } from '../config/firebaseAdmin.js';
import crypto from 'crypto';

// Helper to hash password using scrypt
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
};

// Verify password against stored hash and salt
const verifyPassword = (password, hash, salt) => {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return derived === hash;
};

// Sanitize user object before sending to client
const sanitizeUser = (user) => {
  const { password, passwordHash, passwordSalt, ...rest } = user;
  return rest;
};

/**
 * Synchronizes Firebase authenticated user details with Firestore 'users' collection.
 */
export const syncUser = async (req, res) => {
  const uid = req.user.uid || req.user.email;
  const {
    fullName,
    phone,
    role,
    portal,
    district,
    ulbType,
    ulbName,
    wardNumber,
    profilePhoto,
    provider
  } = req.body;

  try {
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    let userData = {
      uid,
      email: req.user.email || '',
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    if (fullName) userData.fullName = fullName;
    if (phone) userData.phone = phone;
    if (role) userData.role = role;
    if (portal) userData.portal = portal;
    if (district) userData.district = district;
    if (ulbType) userData.ulbType = ulbType;
    if (ulbName) userData.ulbName = ulbName;
    if (wardNumber) userData.wardNumber = wardNumber;
    if (profilePhoto) userData.profilePhoto = profilePhoto;
    if (provider) userData.provider = provider;

    if (!userSnap.exists) {
      userData.createdAt = new Date().toISOString();
      userData.status = 'Active';
      userData.role = role || 'Citizen';
      userData.portal = portal || 'citizen';
    }

    await userDocRef.set(userData, { merge: true });

    const finalSnap = await userDocRef.get();
    res.status(200).json(sanitizeUser(finalSnap.data()));
  } catch (error) {
    console.error('Error in sync-user controller:', error);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
};

/**
 * Returns current authenticated user details.
 */
export const getMe = async (req, res) => {
  try {
    const rawId = req.user.uid || req.user.email;
    const identifier = mode === 'admin' ? rawId.replace(/[.#$\\[\\]]/g, '_') : rawId;
    console.info(`[AUTH] Fetching profile for identifier="${identifier}" (raw="${rawId}") mode="${mode}"`);
    const userSnap = await db.collection('users').doc(identifier).get();
    if (userSnap && userSnap.exists) {
      return res.status(200).json(sanitizeUser(userSnap.data()));
    }
    // Fallback mock user for non-admin modes
    if (mode !== 'admin') {
      console.warn('[AUTH] Firestore profile missing – returning mock user');
      const { email, role, portal, name } = req.user;
      return res.status(200).json({ email, role, portal, name });
    }
    return res.status(404).json({ error: 'User profile not found in database' });
  } catch (error) {
    if (mode !== 'admin' && error.code === 'permission-denied') {
      console.warn('[AUTH] Permission denied – returning mock user');
      const { email, role, portal, name } = req.user;
      return res.status(200).json({ email, role, portal, name });
    }
    console.error('Error in getMe controller:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * Custom login controller using Firestore 'users' collection.
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verify password (support both legacy plaintext and hashed)
    let passwordValid = false;
    if (userData.passwordHash && userData.passwordSalt) {
      passwordValid = verifyPassword(password, userData.passwordHash, userData.passwordSalt);
    } else if (userData.password) {
      // Legacy plain text fallback (will be removed after migration)
      passwordValid = password === userData.password;
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await userDoc.ref.update({ lastLogin: new Date().toISOString() });

    const tokenPayload = Buffer.from(JSON.stringify({
      uid: userDoc.id,
      email: userData.email,
      role: userData.role || 'Citizen',
      portal: userData.portal || 'citizen'
    })).toString('base64');
    const token = `db.${tokenPayload}.sig`;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: sanitizeUser({ uid: userDoc.id, ...userData, lastLogin: new Date().toISOString() })
    });
  } catch (error) {
    console.error('Error in custom loginUser controller:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

/**
 * Custom registration controller for citizens in Firestore.
 */
export const registerUser = async (req, res) => {
  const { name, email, password, mobile, role, portal } = req.body;
  // Enforce strong password policy
  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (!passwordPolicy.test(password)) {
    return res.status(400).json({ error: 'Password does not meet strength requirements' });
  }
  // Simple validation for Indian mobile numbers
  const mobileRegex = /^[6-9]\d{9}$/;
  if (mobile && !mobileRegex.test(mobile.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    const uid = email.replace(/[.#$@\[\]{}]/g, '_');
    const { hash, salt } = hashPassword(password);
    const userData = {
      uid,
      email,
      fullName: name,
      name,
      displayName: name,
      phone: mobile || '',
      phoneNumber: mobile || '',
      role: role || 'Citizen',
      portal: portal || 'citizen',
      status: 'Active',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await usersRef.doc(uid).set(userData);
    res.status(201).json({ message: 'Registration successful', email });
  } catch (error) {
    console.error('Error in custom registerUser controller:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};



/**
 * Logout endpoint – client should discard token. For local mode no server‑side revocation.
 */
export const logoutUser = async (req, res) => {
  // In production you might add token revocation logic.
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Verifies forgot password details (empId, mobile, etc.) against Firestore.
 */
export const verifyForgotDetails = async (req, res) => {
  const { email, empId, adminMobile, adminAuthCode, portal } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'User profile not found with this email' });
    }

    const userData = snapshot.docs[0].data();

    if (portal === 'department') {
      if (userData.empId !== empId) {
        return res.status(400).json({ error: 'Invalid Employee ID' });
      }
      const clientMobile = req.body.deptMobile;
      const dbMobile = (userData.phone || userData.phoneNumber || '').replace(/\D/g, '');
      if (dbMobile !== clientMobile && userData.phone !== clientMobile && userData.phoneNumber !== clientMobile) {
        return res.status(400).json({ error: 'Invalid registered mobile number' });
      }
    } else if (portal === 'admin') {
      if (userData.adminId !== req.body.adminId) {
        return res.status(400).json({ error: 'Invalid Admin ID' });
      }
      if (userData.authCode !== adminAuthCode) {
        return res.status(400).json({ error: 'Invalid Authenticator Code' });
      }
      const clientMobile = adminMobile;
      const dbMobile = (userData.phone || userData.phoneNumber || '').replace(/\D/g, '');
      if (dbMobile !== clientMobile && userData.phone !== clientMobile && userData.phoneNumber !== clientMobile) {
        return res.status(400).json({ error: 'Invalid registered mobile number' });
      }
    }

    res.status(200).json({ message: 'Details verified successfully' });
  } catch (error) {
    console.error('Error in verifyForgotDetails:', error);
    res.status(500).json({ error: 'Failed to verify details' });
  }
};

/**
 * Resets user's password in Firestore.
 */
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = snapshot.docs[0];
    const { hash, salt } = hashPassword(newPassword);
    await userDoc.ref.update({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
