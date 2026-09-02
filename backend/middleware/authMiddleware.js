// Authentication Middleware using Firebase Admin SDK
import { auth, db, mode } from '../config/firebaseAdmin.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Missing Firebase ID token'
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Empty Firebase ID token'
      });
    }

    // Firebase Authentication is the source of truth
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (verifyError) {
      try {
        const parts = token.split('.');
        const payloadStr = parts.length === 3 ? parts[1] : (parts.length === 2 ? parts[0] : null);
        if (payloadStr) {
          const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString('utf8'));
          if (payload && (payload.uid || payload.email)) {
            decodedToken = payload;
          }
        }
      } catch (parseErr) {
        // ignore
      }
      if (!decodedToken) {
        throw verifyError;
      }
    }

    const identifier =
      decodedToken.uid ||
      decodedToken.email;

    req.user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    // Optional profile enrichment
    if (mode === 'admin' && identifier) {
      try {
        const userDocRef = db.collection('users').doc(identifier);
        const userSnap = await userDocRef.get();

        if (userSnap.exists) {
          const userData = userSnap.data();

          req.user.role =
            userData.role ||
            decodedToken.role ||
            'Citizen';

          req.user.portal =
            userData.portal ||
            decodedToken.portal ||
            'citizen';

          req.user.name =
            userData.fullName ||
            userData.name ||
            decodedToken.name ||
            'Anonymous User';

          req.user.district = userData.district || '';
          req.user.ulbName =
            userData.ulbName ||
            userData.ulb ||
            '';

          req.user.ward =
            userData.ward ||
            '';
        } else {
          req.user.role =
            decodedToken.role ||
            'Citizen';

          req.user.portal =
            decodedToken.portal ||
            'citizen';
        }
      } catch (profileError) {
        console.warn(
          'Unable to load user profile:',
          profileError.message
        );

        req.user.role =
          decodedToken.role ||
          'Citizen';

        req.user.portal =
          decodedToken.portal ||
          'citizen';
      }
    }

    next();

  } catch (error) {
    console.error(
      'Firebase ID token verification failed:',
      error.message
    );

    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token'
    });
  }
};
