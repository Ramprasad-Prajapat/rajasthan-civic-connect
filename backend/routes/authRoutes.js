import express from 'express';
import { syncUser, getMe, loginUser, registerUser, verifyForgotDetails, resetPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sync-user', authMiddleware, syncUser);
router.get('/me', authMiddleware, getMe);
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/forgot-password-verify', verifyForgotDetails);
router.post('/reset-password', resetPassword);

export default router;
