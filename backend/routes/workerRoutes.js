import express from 'express';
import { getWorkers, createWorker, getWorkerTasks, updateWorkerStatus, uploadProof } from '../controllers/workerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getWorkers);
router.post('/', authMiddleware, createWorker);
router.get('/:id/tasks', authMiddleware, getWorkerTasks);
router.put('/:id/status', authMiddleware, updateWorkerStatus);

// Resolution proof upload endpoint
router.put('/complaints/:complaintId/upload-proof', authMiddleware, uploadProof);

export default router;
