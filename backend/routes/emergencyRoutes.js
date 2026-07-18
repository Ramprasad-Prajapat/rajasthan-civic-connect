import express from 'express';
import { createEmergency, getEmergencies, updateEmergencyStatus } from '../controllers/emergencyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createEmergency);
router.get('/', authMiddleware, getEmergencies);
router.put('/:id/status', authMiddleware, updateEmergencyStatus);

export default router;
