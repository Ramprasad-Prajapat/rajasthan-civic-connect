import express from 'express';
import { 
  createComplaint, 
  getComplaints,
  getMyComplaints,
  getComplaintById, 
  updateComplaintStatus, 
  assignWorker, 
  reopenComplaint, 
  deleteComplaint,
  saveComplaintDraft,
  getComplaintDraft,
  deleteComplaintDraft
} from '../controllers/complaintController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createComplaint);
router.get('/', authMiddleware, getComplaints);
router.get('/my', authMiddleware, getMyComplaints);
router.post('/draft', authMiddleware, saveComplaintDraft);
router.get('/draft', authMiddleware, getComplaintDraft);
router.delete('/draft', authMiddleware, deleteComplaintDraft);
router.get('/:complaintId', authMiddleware, getComplaintById);
router.put('/:complaintId/status', authMiddleware, updateComplaintStatus);
router.put('/:complaintId/assign-worker', authMiddleware, assignWorker);
router.put('/:complaintId/reopen', authMiddleware, reopenComplaint);
router.delete('/:complaintId', authMiddleware, deleteComplaint);

export default router;
