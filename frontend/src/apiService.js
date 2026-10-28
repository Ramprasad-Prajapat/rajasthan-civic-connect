/**
 * API Service for RajCivic Connect.
 * Communicates with the Spring Boot REST backend on port 8080.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Converts a File object or Blob to a base64 data URL string.
 */
export async function fileToBase64(file) {
  if (!file || !(file instanceof Blob)) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Returns Authorization headers with current bearer token.
 */
export function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return { 'Content-Type': 'application/json' };
}

/**
 * Helper to handle HTTP errors consistently.
 */
async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rajcivic_user');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return await response.json();
}

/* ==========================================================================
   AUTHENTICATION & PROFILE ENDPOINTS
   ========================================================================== */

/**
 * Authenticates user via email and password.
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await handleResponse(response);
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('authToken', data.token);
  }
  return data.user;
}

/**
 * Registers a new citizen account.
 */
export async function registerUser(name, email, password, mobile) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, mobile, role: 'Citizen', portal: 'citizen' })
  });
  const data = await handleResponse(response);
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('authToken', data.token);
  }
  return data.user;
}

/**
 * Fetches the currently authenticated user's profile.
 */
export async function getMyProfile() {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export const getUserProfile = getMyProfile;

/**
 * Updates profile name and phone number.
 */
export async function updateMyProfile(profileData) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({
      name: profileData.name,
      phone: profileData.phone || profileData.mobile
    })
  });
  return await handleResponse(response);
}

/**
 * Updates password verifying current password first.
 */
export async function changePassword(currentPassword, newPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return await handleResponse(response);
}

/* ==========================================================================
   COMPLAINT ENDPOINTS
   ========================================================================== */

/**
 * Lodges a new complaint ticket with optional photo.
 */
export async function createComplaint(complaintData, photoFile) {
  let photoBase64 = null;
  if (photoFile && photoFile instanceof Blob) {
    photoBase64 = await fileToBase64(photoFile);
  } else if (complaintData.photo && typeof complaintData.photo === 'string' && complaintData.photo.startsWith('data:')) {
    photoBase64 = complaintData.photo;
  }

  const payload = {
    ...complaintData,
    photo: photoBase64,
    beforePhotos: photoBase64 ? [photoBase64] : []
  };

  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  return await handleResponse(response);
}

/**
 * Retrieves complaints filed by current citizen.
 */
export async function getMyComplaints() {
  const response = await fetch(`${API_BASE_URL}/complaints/my`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

/**
 * Retrieves complaints based on caller role and filters.
 */
export async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.district && filters.district !== 'all') params.append('district', filters.district);
  if (filters.departmentId && filters.departmentId !== 'all') params.append('departmentId', filters.departmentId);

  const url = `${API_BASE_URL}/complaints${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

/**
 * Retrieves full details and timeline of a single complaint.
 */
export async function getComplaint(idOrCode) {
  const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(idOrCode)}`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

/**
 * Updates status and remarks for a complaint ticket.
 */
export async function updateComplaintStatus(idOrCode, status, remarks = '') {
  const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(idOrCode)}/status`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ status, remarks })
  });
  return await handleResponse(response);
}

/**
 * Reopens a complaint with citizen remarks.
 */
export async function reopenComplaint(complaintId, reason, description) {
  const remark = reason ? `${reason}: ${description || ''}` : (description || 'Grievance reopened by citizen');
  return updateComplaintStatus(complaintId, 'InProgress', remark);
}

/**
 * Reassigns complaint to a different department (Admin only).
 */
export async function reassignComplaintDepartment(idOrCode, departmentId) {
  const response = await fetch(`${API_BASE_URL}/complaints/${encodeURIComponent(idOrCode)}/department`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ departmentId })
  });
  return await handleResponse(response);
}

/* ==========================================================================
   DRAFT ENDPOINTS
   ========================================================================== */

export async function getComplaintDraft() {
  const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
    headers: getAuthHeader()
  });
  if (response.status === 404) return null;
  const data = await handleResponse(response);
  return data.draft || null;
}

export async function saveComplaintDraft(draftData) {
  const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ draft: draftData })
  });
  return await handleResponse(response);
}

export async function deleteComplaintDraft() {
  const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

/* ==========================================================================
   NOTIFICATIONS & FEEDBACK
   ========================================================================== */

export async function getNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function markNotificationRead(id) {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function submitFeedback(complaintId, rating, comment) {
  const response = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ complaintId, rating, comment })
  });
  return await handleResponse(response);
}

/* ==========================================================================
   DEPARTMENTS MANAGEMENT (ADMIN)
   ========================================================================== */

export async function getDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function createDepartment(deptData) {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(deptData)
  });
  return await handleResponse(response);
}

export async function updateDepartment(id, deptData) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(deptData)
  });
  return await handleResponse(response);
}

export async function toggleDepartmentActive(id, active) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}/active`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify({ active })
  });
  return await handleResponse(response);
}

export async function deleteDepartment(id) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

/* ==========================================================================
   ADMIN GOVERNANCE ENDPOINTS
   ========================================================================== */

export async function getAdminOfficers() {
  const response = await fetch(`${API_BASE_URL}/admin/officers`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function createAdminOfficer(officerData) {
  const response = await fetch(`${API_BASE_URL}/admin/officers`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(officerData)
  });
  return await handleResponse(response);
}

export async function updateAdminOfficer(id, data) {
  const response = await fetch(`${API_BASE_URL}/admin/officers/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });
  return await handleResponse(response);
}

export async function getAdminUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function getAdminStats() {
  const response = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function getDepartmentStats() {
  const response = await fetch(`${API_BASE_URL}/department/stats`, {
    headers: getAuthHeader()
  });
  return await handleResponse(response);
}

export async function uploadFile(path, file) {
  if (!file) return null;
  return fileToBase64(file);
}

export async function seedOnStartup() {
  return true;
}
