import { db } from '../config/firebaseAdmin.js';
import { updateComplaintStatusService } from '../services/complaintService.js';

/**
 * Creates feedback rating/comment and transitions the complaint to Closed status.
 */
export const createFeedback = async (req, res) => {
  const { complaintId, rating, comment } = req.body;
  const uid = req.user.uid || req.user.email;
  
  try {
    const feedbackId = `FB-${complaintId}-${Date.now()}`;
    const feedbackData = {
      feedbackId,
      complaintId,
      rating: Number(rating) || 5,
      comment: comment || '',
      citizenId: uid,
      createdAt: new Date().toISOString()
    };
    
    await db.collection('feedback').doc(feedbackId).set(feedbackData);
    
    const compRef = db.collection('complaints').doc(complaintId);
    await compRef.update({
      rating: Number(rating) || 5,
      feedback: comment || '',
      status: 'Closed',
      updatedAt: new Date().toISOString()
    });
    
    await updateComplaintStatusService(
      complaintId, 
      'Closed', 
      req.user.name || 'Citizen', 
      req.user.role, 
      `Citizen rated service ${rating}/5 stars. Complaint closed.`
    );
    
    res.status(201).json(feedbackData);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};

/**
 * Gets feedback submissions for a specific complaint ID.
 */
export const getFeedbackByComplaint = async (req, res) => {
  const { complaintId } = req.params;
  try {
    const snap = await db.collection('feedback').where('complaintId', '==', complaintId).get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
};
