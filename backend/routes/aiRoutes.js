import express from 'express';
import { classifyComplaint, predictPriority, analyzeImageProof, generateAIAnalytics } from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/classify - Auto-classify complaint & predict priority
router.post('/classify', (req, res) => {
  const { description = '' } = req.body;
  const classification = classifyComplaint(description);
  const priorityInfo = predictPriority(description, classification.category);

  res.status(200).json({
    success: true,
    ...classification,
    ...priorityInfo
  });
});

// POST /api/ai/analyze-image - AI vision proof inspection
router.post('/analyze-image', (req, res) => {
  const { image } = req.body;
  const result = analyzeImageProof(image);
  res.status(200).json({
    success: true,
    data: result
  });
});

// GET /api/ai/analytics - AI-driven predictive governance analytics
router.get('/analytics', (req, res) => {
  const analytics = generateAIAnalytics();
  res.status(200).json({
    success: true,
    data: analytics
  });
});

export default router;
