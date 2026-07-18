import express from 'express';
import { getReportsSummary, getReportsComplaints, exportPDFReport, exportExcelReport } from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', authMiddleware, getReportsSummary);
router.get('/complaints', authMiddleware, getReportsComplaints);
router.get('/export/pdf', authMiddleware, exportPDFReport);
router.get('/export/excel', authMiddleware, exportExcelReport);

export default router;
