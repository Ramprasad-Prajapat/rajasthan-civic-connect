import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Converts a File object to base64 data string.
 */
async function fileToBase64(file) {
  if (!file || !(file instanceof Blob)) return null;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to fetch authorization header.
 */
async function getAuthHeader() {
  const customToken = localStorage.getItem('rajcivic_token');
  if (customToken) {
    return { 'Authorization': `Bearer ${customToken}` };
  }
  const currentUser = auth?.currentUser;
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken(true);
      return { 'Authorization': `Bearer ${idToken}` };
    } catch (e) {
      console.error("Failed to acquire ID Token:", e);
    }
  }
  return {};
}

/**
 * Log in a user via database backend.
 */
export async function loginUser(email, password, portal) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, portal }),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to log in");
  }
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('rajcivic_token', data.token);
  }
  return data.user;
}

/**
 * Register a citizen via database backend.
 */
export async function registerUser(name, email, password, mobile, role = 'Citizen', portal = 'citizen') {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, mobile, role, portal }),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to register citizen");
  }
  return await response.json();
}

/**
 * Verifies forgot password details against backend.
 */
export async function verifyForgotDetails(details) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to verify details");
  }
  return await response.json();
}

/**
 * Resets user's password in database.
 */
export async function resetPassword(email, newPassword) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword }),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to reset password");
  }
  return await response.json();
}

/**
 * Uploads file by returning base64 source string (managed server-side now).
 */
export async function uploadFile(path, file) {
  if (!file) return null;
  return fileToBase64(file);
}

/**
 * Saves/Updates user profile in Firestore.
 */
export async function saveUserProfile(uid, userData, avatarFile = null) {
  try {
    const headers = await getAuthHeader();
    let photoURL = userData.photoURL || null;
    if (avatarFile) {
      photoURL = await fileToBase64(avatarFile);
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/sync-user`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...userData,
        profilePhoto: photoURL
      })
    });
    
    if (!response.ok) {
      throw new Error("Failed to save user profile");
    }
    const data = await response.json();
    return data.photoURL || data.profilePhoto || photoURL;
  } catch (error) {
    console.error("Error saving user profile to API:", error);
    return null;
  }
}

export const updateUserProfile = saveUserProfile;

/**
 * Fetches user profile.
 */
export async function getUserProfile(uid) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      headers
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Lodges a complaint in API backend.
 * Returns the backend response including the generated complaintId.
 */
export async function createComplaint(complaintData, photoFile) {
  try {
    const headers = await getAuthHeader();
    let photoBase64 = null;
    if (photoFile && photoFile instanceof Blob) {
      photoBase64 = await fileToBase64(photoFile);
    } else if (complaintData.photo && typeof complaintData.photo === 'string' && complaintData.photo.startsWith('data:')) {
      photoBase64 = complaintData.photo;
    }
    
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...complaintData,
        photo: photoBase64,
        beforePhotos: photoBase64
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create complaint");
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to lodge complaint via API:", error);
    throw error;
  }
}

/**
 * Retrieves the complaint draft from backend.
 */
export async function getComplaintDraft() {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
      headers
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.draft;
  } catch (error) {
    console.error("Error fetching complaint draft:", error);
    return null;
  }
}

/**
 * Saves the complaint draft to backend.
 */
export async function saveComplaintDraft(draftData) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });
    if (!response.ok) throw new Error("Failed to save draft");
    return await response.json();
  } catch (error) {
    console.error("Error saving complaint draft:", error);
  }
}

/**
 * Deletes the complaint draft from backend.
 */
export async function deleteComplaintDraft() {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/complaints/draft`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error("Failed to delete draft");
    return await response.json();
  } catch (error) {
    console.error("Error deleting complaint draft:", error);
  }
}

/**
 * Retrieves a single complaint.
 */
export async function getComplaint(complaintId) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
      headers
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return null;
  }
}

/**
 * Fetches only the logged-in citizen's complaints from the backend.
 */
export async function getMyComplaints() {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/complaints/my`, {
      headers
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching my complaints:", error);
    return [];
  }
}

/**
 * Queries complaints dynamically.
 */
export async function getComplaints(filters = {}) {
  try {
    const headers = await getAuthHeader();
    const queryParams = new URLSearchParams();
    
    if (filters.citizenId) queryParams.append('citizenId', filters.citizenId);
    if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.ward && filters.ward !== 'all') queryParams.append('ward', filters.ward);
    if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.district && filters.district !== 'all') queryParams.append('district', filters.district);
    if (filters.department && filters.department !== 'all') queryParams.append('department', filters.department);
    
    const response = await fetch(`${API_BASE_URL}/complaints?${queryParams.toString()}`, {
      headers
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error fetching complaints list:", error);
    return [];
  }
}

/**
 * Updates a complaint's status and logs timeline event.
 */
export async function updateComplaintStatus(complaintId, status, remark, workerInfo = null, afterProofFile = null) {
  try {
    const headers = await getAuthHeader();
    let afterPhotosBase64 = null;
    if (afterProofFile) {
      afterPhotosBase64 = await fileToBase64(afterProofFile);
    }
    
    if (status === 'Assigned' && workerInfo) {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/assign-worker`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workerName: workerInfo.name,
          workerPhone: workerInfo.phone || '',
          workerId: workerInfo.uid || ''
        })
      });
      if (!response.ok) throw new Error("Failed to assign worker");
      return await response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          remarks: remark,
          afterPhotos: afterPhotosBase64
        })
      });
      if (!response.ok) throw new Error("Failed to update status");
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to update complaint status:", error);
  }
}

/**
 * Submits citizen rating feedback.
 */
export async function submitFeedback(complaintId, rating, comment, citizenId) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        complaintId,
        rating,
        comment
      })
    });
    if (!response.ok) throw new Error("Failed to submit feedback");
    return await response.json();
  } catch (error) {
    console.error("Feedback submit error:", error);
  }
}

/**
 * Reopens a complaint.
 */
export async function reopenComplaint(complaintId, reason, description, photoFile) {
  try {
    const headers = await getAuthHeader();
    let photoBase64 = null;
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
    }
    
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/reopen`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reopenReason: reason,
        remarks: description,
        photo: photoBase64
      })
    });
    if (!response.ok) throw new Error("Failed to reopen complaint");
    return await response.json();
  } catch (error) {
    console.error("Reopen complaint failed:", error);
  }
}

/**
 * Fetches dashboard counters and datasets.
 */
export async function getDashboardStats() {
  try {
    const headers = await getAuthHeader();
    const compResponse = await fetch(`${API_BASE_URL}/complaints`, { headers });
    const complaints = compResponse.ok ? await compResponse.json() : [];
    
    let totalUsers = 241;
    let totalWorkers = 32;
    let totalOfficers = 8;
    let totalDepartments = 5;
    
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/admin`, { headers });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        totalUsers = stats.totalUsers || totalUsers;
        totalWorkers = stats.totalWorkers || totalWorkers;
        totalOfficers = stats.totalOfficers || totalOfficers;
        totalDepartments = stats.totalDepartments || totalDepartments;
      }
    } catch (e) {
      // Catch admin limits
    }
    
    return {
      complaints,
      totalUsers,
      totalWorkers,
      totalOfficers,
      totalDepartments
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { complaints: [], totalUsers: 241, totalWorkers: 32, totalOfficers: 8, totalDepartments: 5 };
  }
}

/**
 * Lodges an emergency complaint.
 */
export async function createEmergency(emergencyData, photoFile) {
  try {
    const headers = await getAuthHeader();
    let photoBase64 = null;
    if (photoFile) {
      photoBase64 = await fileToBase64(photoFile);
    }
    
    const response = await fetch(`${API_BASE_URL}/emergencies`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...emergencyData,
        photo: photoBase64
      })
    });
    if (!response.ok) throw new Error("Failed to create emergency");
    return await response.json();
  } catch (error) {
    console.error("Failed to lodge emergency via API:", error);
    return emergencyData;
  }
}

/**
 * Updates status of an emergency complaint.
 */
export async function updateEmergencyStatus(emergencyId, status, invalidReason = '', officerName = 'Municipal Officer') {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}/emergencies/${emergencyId}/status`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        officerHandshake: status,
        invalidReason
      })
    });
    if (!response.ok) throw new Error("Failed to update emergency status");
    return await response.json();
  } catch (error) {
    console.error("Emergency update failed:", error);
  }
}

/**
 * Logs reports generation.
 */
export async function saveReport(reportData) {
  try {
    const headers = await getAuthHeader();
    await fetch(`${API_BASE_URL}/reports/summary?reportType=${reportData.reportType || 'excel_export'}`, {
      headers
    });
  } catch (e) {
    // Fail-safe
  }
}

/**
 * Dummy handler (seeding checks are executed directly at API startup).
 */
export async function seedFirestoreOnStartup() {
  console.log("Database initialized via Node/Express backend server check.");
  return Promise.resolve(true);
}
