import { db } from '../config/firebaseAdmin.js';
import { generateComplaintId } from '../utils/generateComplaintId.js';
import { calculateSla } from '../utils/slaCalculator.js';
import { mapCategoryToDepartment } from '../utils/departmentMapper.js';
import { createComplaintService, addTimelineEvent } from '../services/complaintService.js';
import { createNotificationService } from '../services/notificationService.js';
import { uploadBase64ToStorage } from '../services/uploadService.js';

/**
 * Creates a new grievance ticket, auto-maps SLA/departments, uploads images, and saves record.
 */
export const createComplaint = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const { 
      category, subCategory, title, description,
      district, ulbType, ulbName, wardNumber, areaColony, address,
      latitude, longitude, accuracy, locationSource,
      photo, beforePhotos, voiceNote, documents, isEmergency
    } = req.body;
    
    const departmentName = mapCategoryToDepartment(category);
    const complaintId = generateComplaintId(district, ulbName, isEmergency);
    const priority = isEmergency ? 'Critical' : (req.body.priority || 'Normal');
    const { slaHours, slaDeadline } = calculateSla(priority, isEmergency);
    
    let photoURL = '';
    if (photo) {
      photoURL = await uploadBase64ToStorage(photo, `complaints/${complaintId}/before.jpg`);
    } else if (beforePhotos) {
      photoURL = await uploadBase64ToStorage(beforePhotos, `complaints/${complaintId}/before.jpg`);
    }

    const complaintData = {
      complaintId,
      id: complaintId, // Alias for compatibility
      citizenId: uid,
      citizenName: req.user.name || 'Citizen',
      citizenEmail: req.user.email || '',
      citizenPhone: req.user.phone || '',
      
      category: category || 'Other',
      subCategory: subCategory || '',
      title: title || 'Civic Issue',
      description: description || '',
      
      district: district || '',
      ulbType: ulbType || '',
      ulbName: ulbName || '',
      wardNumber: wardNumber || '',
      areaColony: areaColony || '',
      address: address || '',
      
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy || null,
      locationSource: locationSource || 'CURRENT_LOCATION',
      
      departmentId: departmentName.replace(/\s+/g, '_'),
      departmentName,
      
      priority,
      slaHours,
      slaDeadline,
      status: 'Submitted',
      
      photo: photoURL,
      beforePhotos: photoURL ? [photoURL] : [],
      afterPhotos: [],
      voiceNote: voiceNote || '',
      documents: documents || [],
      
      isEmergency: !!isEmergency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await createComplaintService(complaintData);
    
    await createNotificationService(uid, 'Grievance Lodged', `Aapki shikayat ticket ${complaintId} register ho gayi hai.`);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ error: "Failed to lodge complaint" });
  }
};

/**
 * Returns a list of complaints filtered by caller role visibility rules.
 */
export const getComplaints = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const role = req.user.role.toUpperCase();
    
    let query = db.collection('complaints');
    let snap;
    
    if (role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      snap = await query.get();
    } else if (role === 'DEPARTMENT OFFICER' || role === 'OFFICER') {
      if (req.user.ulbName) {
        query = query.where('ulbName', '==', req.user.ulbName);
      }
      snap = await query.get();
    } else if (role === 'WORKER') {
      snap = await query.get();
      const complaints = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.assignedWorker && (data.assignedWorker.name === req.user.name || data.assignedWorkerId === uid)) {
          complaints.push(data);
        }
      });
      return res.status(200).json(complaints);
    } else {
      query = query.where('citizenId', '==', uid);
      snap = await query.get();
    }
    
    const complaints = [];
    snap.forEach(doc => {
      complaints.push(doc.data());
    });
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Failed to load complaints" });
  }
};

/**
 * Returns only the complaints belonging to the logged-in citizen.
 */
export const getMyComplaints = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const query = db.collection('complaints').where('citizenId', '==', uid);
    const snap = await query.get();
    
    const complaints = [];
    snap.forEach(doc => {
      complaints.push(doc.data());
    });
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching my complaints:", error);
    res.status(500).json({ error: "Failed to load your complaints" });
  }
};

/**
 * Retrieves details and timeline history for a specific complaint ID.
 */
export const getComplaintById = async (req, res) => {
  const { complaintId } = req.params;
  try {
    const docSnap = await db.collection('complaints').doc(complaintId).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    const complaintData = docSnap.data();
    
    const timelineSnap = await db.collection('complaints').doc(complaintId).collection('timeline').get();
    const timeline = [];
    timelineSnap.forEach(t => {
      timeline.push(t.data());
    });
    
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    complaintData.timeline = timeline;
    
    res.status(200).json(complaintData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaint details" });
  }
};

/**
 * Updates status code (e.g. InProgress, Resolved, Closed) and registers timeline details.
 */
export const updateComplaintStatus = async (req, res) => {
  const { complaintId } = req.params;
  const { status, remarks, afterPhotos } = req.body;
  
  try {
    let afterURL = '';
    if (afterPhotos) {
      afterURL = await uploadBase64ToStorage(afterPhotos, `complaints/${complaintId}/after.jpg`);
    }
    
    const compRef = db.collection('complaints').doc(complaintId);
    const docSnap = await compRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    const currentData = docSnap.data();
    const updates = {
      status,
      remarks: remarks || currentData.remarks || '',
      updatedAt: new Date().toISOString()
    };
    
    if (afterURL) {
      updates.afterProof = afterURL;
      updates.afterPhotos = [afterURL];
    }
    
    if (status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
    } else if (status === 'Closed') {
      updates.closedAt = new Date().toISOString();
    }
    
    await compRef.update(updates);
    
    await addTimelineEvent(complaintId, {
      status,
      title: `Status: ${status}`,
      description: remarks || `Complaint status updated to ${status}.`,
      updatedBy: req.user.name || 'Officer',
      updatedByRole: req.user.role,
      timestamp: new Date().toISOString()
    });
    
    await createNotificationService(
      currentData.citizenId, 
      `Shikayat: ${status}`, 
      `Aapki shikayat ${complaintId} ab ${status} state me hai.`
    );
    
    res.status(200).json({ message: "Status updated successfully", status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

/**
 * Assigns field executive/worker parameters.
 */
export const assignWorker = async (req, res) => {
  const { complaintId } = req.params;
  const { workerName, workerPhone, workerId } = req.body;
  
  try {
    const compRef = db.collection('complaints').doc(complaintId);
    const docSnap = await compRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    const currentData = docSnap.data();
    await compRef.update({
      status: 'Assigned',
      assignedWorker: {
        name: workerName,
        phone: workerPhone || ''
      },
      assignedWorkerId: workerId || '',
      updatedAt: new Date().toISOString()
    });
    
    await addTimelineEvent(complaintId, {
      status: 'Assigned',
      title: 'Worker Assigned',
      description: `Task assigned to field worker ${workerName}.`,
      updatedBy: req.user.name || 'Officer',
      updatedByRole: req.user.role,
      timestamp: new Date().toISOString()
    });
    
    await createNotificationService(
      currentData.citizenId,
      'Worker Assigned',
      `Shikayat ${complaintId} ke liye worker ${workerName} ko assign kiya gaya hai.`
    );
    
    res.status(200).json({ message: "Worker assigned successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign worker" });
  }
};

/**
 * Reopens resolved complaints based on citizen request.
 */
export const reopenComplaint = async (req, res) => {
  const { complaintId } = req.params;
  const { reopenReason, photo } = req.body;
  
  try {
    const compRef = db.collection('complaints').doc(complaintId);
    const docSnap = await compRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    let photoURL = '';
    if (photo) {
      photoURL = await uploadBase64ToStorage(photo, `complaints/${complaintId}/reopen.jpg`);
    }
    
    const updates = {
      status: 'Reopened',
      reopenReason: reopenReason || '',
      updatedAt: new Date().toISOString()
    };
    if (photoURL) {
      updates.photo = photoURL;
      updates.beforePhotos = [photoURL];
    }
    
    await compRef.update(updates);
    
    await addTimelineEvent(complaintId, {
      status: 'Reopened',
      title: 'Grievance Reopened',
      description: reopenReason || 'Citizen requested a rework on this resolved grievance.',
      updatedBy: req.user.name || 'Citizen',
      updatedByRole: req.user.role,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ message: "Grievance successfully reopened." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reopen complaint" });
  }
};

/**
 * Deletes complaint document.
 */
export const deleteComplaint = async (req, res) => {
  const { complaintId } = req.params;
  try {
    await db.collection('complaints').doc(complaintId).delete();
    res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete complaint" });
  }
};

/**
 * Saves or updates a complaint draft for the logged-in user.
 */
export const saveComplaintDraft = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const draftData = req.body;
    
    // Optional: upload photo if present as base64
    let photoURL = draftData.photo || null;
    if (photoURL && typeof photoURL === 'string' && photoURL.startsWith('data:image')) {
      photoURL = await uploadBase64ToStorage(photoURL, `drafts/${uid}/photo.jpg`);
      draftData.photo = photoURL;
      draftData.photoPreview = photoURL;
    }
    
    draftData.updatedAt = new Date().toISOString();
    draftData.userId = uid;
    
    await db.collection('complaintDrafts').doc(uid).set(draftData, { merge: true });
    
    res.status(200).json({ message: "Draft saved successfully", draft: draftData });
  } catch (error) {
    console.error("Error saving complaint draft:", error);
    res.status(500).json({ error: "Failed to save draft" });
  }
};

/**
 * Retrieves the complaint draft for the logged-in user.
 */
export const getComplaintDraft = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const doc = await db.collection('complaintDrafts').doc(uid).get();
    
    if (!doc.exists) {
      return res.status(200).json({ draft: null });
    }
    
    res.status(200).json({ draft: doc.data() });
  } catch (error) {
    console.error("Error fetching complaint draft:", error);
    res.status(500).json({ error: "Failed to fetch draft" });
  }
};

/**
 * Deletes the complaint draft for the logged-in user.
 */
export const deleteComplaintDraft = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    await db.collection('complaintDrafts').doc(uid).delete();
    res.status(200).json({ message: "Draft deleted successfully" });
  } catch (error) {
    console.error("Error deleting complaint draft:", error);
    res.status(500).json({ error: "Failed to delete draft" });
  }
};
