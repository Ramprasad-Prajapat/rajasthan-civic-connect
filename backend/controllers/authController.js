import { db } from '../config/firebaseAdmin.js';

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
    res.status(200).json(finalSnap.data());
  } catch (error) {
    console.error("Error in sync-user controller:", error);
    res.status(500).json({ error: "Failed to sync user data" });
  }
};

/**
 * Returns current authenticated user details.
 */
export const getMe = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found in database" });
    }
    res.status(200).json(userSnap.data());
  } catch (error) {
    console.error("Error in getMe controller:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

/**
 * Custom login controller using Firestore 'users' collection.
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = `${userData.email}|${userData.role || 'Citizen'}|${userData.portal || 'citizen'}`;
    const token = `MOCK_TOKEN_${Buffer.from(payload).toString('base64')}`;

    await userDoc.ref.update({ lastLogin: new Date().toISOString() });

    res.status(200).json({
      token,
      user: {
        uid: userDoc.id,
        ...userData,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error in custom loginUser controller:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

/**
 * Custom registration controller for citizens in Firestore.
 */
export const registerUser = async (req, res) => {
  const { name, email, password, mobile, role, portal } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const uid = email.replace(/[.#$[\]]/g, '_');
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
      password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await usersRef.doc(uid).set(userData);

    res.status(201).json({ message: "Registration successful", email });
  } catch (error) {
    console.error("Error in custom registerUser controller:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

/**
 * Verifies forgot password details (empId, mobile, etc.) against Firestore.
 */
export const verifyForgotDetails = async (req, res) => {
  const { email, empId, adminMobile, adminAuthCode, portal } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "User profile not found with this email" });
    }

    const userData = snapshot.docs[0].data();

    if (portal === 'department') {
      if (userData.empId !== empId) {
        return res.status(400).json({ error: "Invalid Employee ID" });
      }
      const clientMobile = req.body.deptMobile;
      const dbMobile = (userData.phone || userData.phoneNumber || '').replace(/\D/g, '');
      if (dbMobile !== clientMobile && userData.phone !== clientMobile && userData.phoneNumber !== clientMobile) {
        return res.status(400).json({ error: "Invalid registered mobile number" });
      }
    } else if (portal === 'admin') {
      if (userData.adminId !== req.body.adminId) {
        return res.status(400).json({ error: "Invalid Admin ID" });
      }
      if (userData.authCode !== adminAuthCode) {
        return res.status(400).json({ error: "Invalid Authenticator Code" });
      }
      const clientMobile = adminMobile;
      const dbMobile = (userData.phone || userData.phoneNumber || '').replace(/\D/g, '');
      if (dbMobile !== clientMobile && userData.phone !== clientMobile && userData.phoneNumber !== clientMobile) {
        return res.status(400).json({ error: "Invalid registered mobile number" });
      }
    }

    res.status(200).json({ message: "Details verified successfully" });
  } catch (error) {
    console.error("Error in verifyForgotDetails:", error);
    res.status(500).json({ error: "Failed to verify details" });
  }
};

/**
 * Resets user's password in Firestore.
 */
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required" });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      password: newPassword,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
