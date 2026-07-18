import { db } from '../config/firebaseAdmin.js';
import { uploadBase64ToStorage } from '../services/uploadService.js';
import { addTimelineEvent } from '../services/complaintService.js';

/**
 * Lists all active municipal workers.
 */
export const getWorkers = async (req, res) => {
  try {
    const snap = await db.collection('users').where('role', '==', 'Worker').get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    
    if (list.length === 0) {
      const defaults = [
        { uid: 'worker1', name: 'Rajesh Kumar', phone: '+91 98290 12345', status: 'Active' },
        { uid: 'worker2', name: 'Sanjay Sharma', phone: '+91 98290 22345', status: 'Active' },
        { uid: 'worker3', name: 'Ramesh Verma', phone: '+91 98290 33456', status: 'Active' }
      ];
      return res.status(200).json(defaults);
    }
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workers" });
  }
};

/**
 * Creates a worker account profile.
 */
export const createWorker = async (req, res) => {
  const { uid, name, phone, email } = req.body;
  try {
    const workerData = {
      uid: uid || `WORKER-${Date.now()}`,
      name,
      fullName: name,
      phone,
      email: email || '',
      role: 'Worker',
      portal: 'worker',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    await db.collection('users').doc(workerData.uid).set(workerData);
    res.status(201).json(workerData);
  } catch (error) {
    res.status(500).json({ error: "Failed to create worker profile" });
  }
};

/**
 * Lists all assigned tickets/tasks for a given worker.
 */
export const getWorkerTasks = async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await db.collection('complaints').get();
    const tasks = [];
    snap.forEach(doc => {
      const data = doc.data();
      if (data.assignedWorkerId === id || (data.assignedWorker && data.assignedWorker.name === id)) {
        tasks.push(data);
      }
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

/**
 * Updates availability state of a worker.
 */
export const updateWorkerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.collection('users').doc(id).update({
      status,
      updatedAt: new Date().toISOString()
    });
    res.status(200).json({ message: "Worker status updated successfully", status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update worker status" });
  }
};

/**
 * Uploads resolution proof and marks task status as resolved.
 */
export const uploadProof = async (req, res) => {
  const { complaintId } = req.params;
  const { status, remarks, afterPhotos } = req.body;
  try {
    let afterURL = '';
    if (afterPhotos) {
      afterURL = await uploadBase64ToStorage(afterPhotos, `complaints/${complaintId}/after.jpg`);
    }
    
    const compRef = db.collection('complaints').doc(complaintId);
    const updates = {
      status: status || 'Resolved',
      remarks: remarks || '',
      updatedAt: new Date().toISOString()
    };
    
    if (afterURL) {
      updates.afterProof = afterURL;
      updates.afterPhotos = [afterURL];
    }
    
    if (updates.status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
    }
    
    await compRef.update(updates);
    
    await addTimelineEvent(complaintId, {
      status: updates.status,
      title: 'Work Completed',
      description: remarks || 'Grievance resolved and verified by worker.',
      updatedBy: req.user.name || 'Worker',
      updatedByRole: req.user.role,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ message: "Resolution proof uploaded successfully", afterURL });
  } catch (error) {
    console.error("Proof upload failed:", error);
    res.status(500).json({ error: "Failed to upload resolution proof" });
  }
};
