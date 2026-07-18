import { db, rtdb } from '../config/firebaseAdmin.js';
import { generateComplaintId } from '../utils/generateComplaintId.js';
import { uploadBase64ToStorage } from '../services/uploadService.js';

/**
 * Creates emergency ticket and syncs to RTDB.
 */
export const createEmergency = async (req, res) => {
  try {
    const uid = req.user.uid || req.user.email;
    const { category, subtype, gps, landmark, description, photo } = req.body;
    
    const emergencyId = generateComplaintId('JAI', 'NNJ', true);
    const priority = 'Critical';
    const sla = '1 hour';
    
    let photoURL = '';
    if (photo) {
      photoURL = await uploadBase64ToStorage(photo, `emergencies/${emergencyId}/before.jpg`);
    }
    
    const emergencyData = {
      emergencyId,
      category: category || 'Other',
      subtype: subtype || '',
      gps: gps || '',
      landmark: landmark || '',
      description: description || '',
      priority,
      sla,
      department: 'Electrical Department', 
      status: 'Submitted',
      officerHandshake: 'Submitted',
      invalidReason: '',
      trustScore: 100,
      beforeProof: photoURL,
      reporter: {
        uid,
        name: req.user.name || 'Citizen',
        phone: req.user.phone || '',
        email: req.user.email || '',
        role: 'Verified Citizen'
      },
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('emergencies').doc(emergencyId).set(emergencyData);
    
    try {
      await rtdb.ref(`emergencies/${emergencyId}`).set(emergencyData);
    } catch (e) {
      // Catch RTDB socket failure gracefully
    }
    
    res.status(201).json(emergencyData);
  } catch (error) {
    console.error("Error creating emergency:", error);
    res.status(500).json({ error: "Failed to log emergency" });
  }
};

/**
 * Lists all active emergency tickets.
 */
export const getEmergencies = async (req, res) => {
  try {
    const snap = await db.collection('emergencies').get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch emergencies" });
  }
};

/**
 * Updates status of an emergency ticket.
 */
export const updateEmergencyStatus = async (req, res) => {
  const { id } = req.params;
  const { status, officerHandshake, invalidReason } = req.body;
  try {
    const updates = {
      status,
      officerHandshake: officerHandshake || status,
      invalidReason: invalidReason || '',
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('emergencies').doc(id).update(updates);
    
    try {
      await rtdb.ref(`emergencies/${id}`).update(updates);
    } catch (e) {
      // Catch RTDB socket limits
    }
    
    res.status(200).json({ message: "Emergency status updated", id });
  } catch (error) {
    res.status(500).json({ error: "Failed to update emergency status" });
  }
};
