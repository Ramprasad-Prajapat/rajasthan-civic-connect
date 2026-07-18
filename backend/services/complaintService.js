import { db } from '../config/firebaseAdmin.js';

/**
 * Creates a complaint document and logs its first timeline event.
 */
export const createComplaintService = async (complaintData) => {
  const compRef = db.collection('complaints').doc(complaintData.complaintId);
  await compRef.set({
    ...complaintData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  await addTimelineEvent(complaintData.complaintId, {
    status: 'Submitted',
    title: 'Grievance Lodged',
    description: 'Complaint successfully registered on RajCivic Connect nodes.',
    updatedBy: complaintData.citizenName || 'Citizen',
    updatedByRole: 'Citizen',
    timestamp: new Date().toISOString()
  });
  
  return complaintData;
};

/**
 * Logs a status transition inside the complaint's timeline subcollection.
 */
export const addTimelineEvent = async (complaintId, event) => {
  const timelineRef = db
    .collection('complaints')
    .doc(complaintId)
    .collection('timeline')
    .doc(`${event.status}_${Date.now()}`);
  
  await timelineRef.set(event);
};

/**
 * Updates a complaint's state, saves updates, and audits the transition.
 */
export const updateComplaintStatusService = async (complaintId, status, updatedBy, role, description = '') => {
  const compRef = db.collection('complaints').doc(complaintId);
  const updates = {
    status,
    updatedAt: new Date().toISOString()
  };
  
  if (status === 'Resolved') {
    updates.resolvedAt = new Date().toISOString();
  } else if (status === 'Closed') {
    updates.closedAt = new Date().toISOString();
  }
  
  await compRef.update(updates);
  
  await addTimelineEvent(complaintId, {
    status,
    title: `Status: ${status}`,
    description: description || `Complaint status updated to ${status}.`,
    updatedBy,
    updatedByRole: role,
    timestamp: new Date().toISOString()
  });
};
