import { auth, db } from '../config/firebaseAdmin.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (token.startsWith('MOCK_TOKEN_')) {
    try {
      const encoded = token.substring('MOCK_TOKEN_'.length);
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const [email, role, portal] = decoded.split('|');
      
      req.user = {
        uid: email,
        email: email,
        role: role || 'Citizen',
        portal: portal || 'citizen'
      };

      const userDocRef = db.collection('users').doc(email.replace(/[.#$[\]]/g, '_'));
      const userSnap = await userDocRef.get();
      
      if (userSnap.exists) {
        const userData = userSnap.data();
        req.user.role = userData.role || role || 'Citizen';
        req.user.portal = userData.portal || portal || 'citizen';
        req.user.name = userData.fullName || userData.name || 'Anonymous User';
        req.user.district = userData.district || '';
        req.user.ulbName = userData.ulbName || userData.ulb || '';
        req.user.ward = userData.ward || '';
      } else {
        req.user.role = role || 'Citizen';
        req.user.portal = portal || 'citizen';
      }

      return next();
    } catch (err) {
      console.error('Mock token decoding failed:', err);
      return res.status(401).json({ error: 'Unauthorized: Invalid mock token' });
    }
  }

  try {
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (firebaseAuthErr) {
      // Firebase Auth may not be available in local mode
      console.warn('Firebase token verification not available (local mode?):', firebaseAuthErr.message);
      
      // Fallback: decode JWT payload without verification if in local mode
      if (process.env.FIREBASE_CLIENT_EMAIL === '' || !process.env.FIREBASE_CLIENT_EMAIL) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = Buffer.from(parts[1], 'base64').toString('utf8');
            decodedToken = JSON.parse(payload);
            decodedToken.uid = decodedToken.uid || decodedToken.sub || decodedToken.user_id;
            console.log("🔓 Decoded Firebase token without verification (local mode fallback):", decodedToken.email || decodedToken.uid);
          } else {
            throw new Error('Invalid JWT format');
          }
        } catch (decodeErr) {
          console.error('Failed to decode token without verification:', decodeErr);
          return res.status(401).json({ error: 'Unauthorized: Token verification failed.' });
        }
      } else {
        return res.status(401).json({ error: 'Unauthorized: Token verification not available. Please login again.' });
      }
    }
    // Use email or uid as the identifier
    const identifier = decodedToken.uid || decodedToken.email;
    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    // Fetch user details and role from users collection
    const userDocRef = db.collection('users').doc(identifier);
    const userSnap = await userDocRef.get();
    
    if (userSnap.exists) {
      const userData = userSnap.data();
      req.user.role = userData.role || 'Citizen';
      req.user.portal = userData.portal || 'citizen';
      req.user.name = userData.fullName || userData.name || decodedToken.name || 'Anonymous User';
      req.user.district = userData.district || '';
      req.user.ulbName = userData.ulbName || userData.ulb || '';
      req.user.ward = userData.ward || '';
    } else {
      // Fallback defaults
      req.user.role = 'Citizen';
      req.user.portal = 'citizen';
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
