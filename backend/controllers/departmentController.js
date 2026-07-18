import { db } from '../config/firebaseAdmin.js';

/**
 * Returns list of all departments.
 */
export const getDepartments = async (req, res) => {
  try {
    const snap = await db.collection('departments').get();
    const list = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    
    if (list.length === 0) {
      // Fallback fallback seeds
      const defaults = [
        { id: 'sanitation', name: 'Sanitation Department', officer: 'Amit Kumar' },
        { id: 'electrical', name: 'Electrical Department', officer: 'Rajesh Sharma' },
        { id: 'water', name: 'Water Department', officer: 'Sunil Verma' },
        { id: 'sewerage', name: 'Sewerage Department', officer: 'Dinesh Gupta' },
        { id: 'pworks', name: 'Public Works Department', officer: 'Vikram Singh' }
      ];
      return res.status(200).json(defaults);
    }
    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

/**
 * Creates a department document.
 */
export const createDepartment = async (req, res) => {
  const { id, name, officer } = req.body;
  try {
    const docId = id || name.toLowerCase().replace(/\s+/g, '_');
    const dept = { id: docId, name, officer, createdAt: new Date().toISOString() };
    await db.collection('departments').doc(docId).set(dept);
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ error: "Failed to create department" });
  }
};

/**
 * Modifies an existing department configuration.
 */
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('departments').doc(id).update({
      ...req.body,
      updatedAt: new Date().toISOString()
    });
    res.status(200).json({ message: "Department updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update department" });
  }
};

/**
 * Removes a department configuration.
 */
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('departments').doc(id).delete();
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete department" });
  }
};
