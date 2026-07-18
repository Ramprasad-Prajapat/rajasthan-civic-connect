import express from 'express';
import { 
  getCitizenDashboard, 
  getWorkerDashboard, 
  getOfficerDashboard, 
  getAdminDashboard 
} from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/citizen', authMiddleware, getCitizenDashboard);
router.get('/worker', authMiddleware, getWorkerDashboard);
router.get('/officer', authMiddleware, getOfficerDashboard);
router.get('/admin', authMiddleware, getAdminDashboard);

export default router;
