import React, { useState } from 'react';
import { updateUserProfile } from '../firestoreService';

export default function ProfilePreview({ authenticatedUser, setAuthenticatedUser, setActivePage }) {
  // Account settings edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(authenticatedUser?.name || authenticatedUser?.displayName || 'Ram Prasad');
  const [mobileNumber, setMobileNumber] = useState(authenticatedUser?.phoneNumber || '+91 98290 88721');
  const [activeWard, setActiveWard] = useState(authenticatedUser?.ward || 'Ward No. 12');
  const [activeULB, setActiveULB] = useState(authenticatedUser?.ulb || 'Jaipur Greater Municipal Corporation');
  const [photoFile, setPhotoFile] = useState(null);

  const [successToast, setSuccessToast] = useState(null);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!authenticatedUser) return;
    
    try {
      const uid = authenticatedUser.uid || authenticatedUser.email;
      const profileData = {
        name: fullName,
        fullName: fullName,
        displayName: fullName,
        phone: mobileNumber,
        phoneNumber: mobileNumber,
        ward: activeWard,
        ulb: activeULB
      };

      const updatedURL = await updateUserProfile(uid, profileData, photoFile);
      
      if (setAuthenticatedUser) {
        setAuthenticatedUser({
          ...authenticatedUser,
          ...profileData,
          photoURL: updatedURL || authenticatedUser.photoURL
        });
      }
      setIsEditing(false);
      triggerToast("Your profile records have been securely updated in Firestore!");
    } catch (err) {
      console.error("Failed to update profile in Firestore:", err);
      alert("Failed to save changes: " + err.message);
    }
  };

  const handleCancelEdit = () => {
    setFullName(authenticatedUser?.name || authenticatedUser?.displayName || 'Ram Prasad');
    setMobileNumber(authenticatedUser?.phoneNumber || '+91 98290 88721');
    setActiveWard(authenticatedUser?.ward || 'Ward No. 12');
    setActiveULB(authenticatedUser?.ulb || 'Jaipur Greater Municipal Corporation');
    setIsEditing(false);
  };

  return (
    <section className="py-5" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh' }}>
      
      {/* Toast Alert */}
      {successToast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="alert alert-success border-0 shadow-lg rounded-4 p-3 d-flex align-items-center gap-3 animate-slide-up" style={{ minWidth: '320px', borderLeft: '4px solid #10b981' }}>
            <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-check2-circle fs-5"></i>
            </div>
            <div>
              <strong className="text-secondary small d-block">Secure Profile Hub</strong>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>{successToast}</span>
            </div>
          </div>
        </div>
      )}

      <div className="container py-4">
        
        {/* Header */}
        <div className="text-center mb-5 text-start">
          <span className="badge bg-success-soft text-success rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-shield-lock-fill me-1"></i> SECURE IDENTITY SYSTEM
          </span>
          <h2 className="fw-extrabold text-secondary m-0" style={{ fontSize: '2rem' }}>My Official Profile</h2>
          <p className="text-muted small mt-1.5" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Manage your verified contact details, localized sector ward, and government authorization parameters.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-start">
              
              {/* Profile Image & Avatar */}
              <div className="d-flex flex-column flex-sm-row align-items-center gap-4 border-bottom pb-4 mb-4">
                {authenticatedUser?.photoURL ? (
                  <img 
                    src={authenticatedUser.photoURL} 
                    alt={fullName} 
                    className="rounded-circle shadow-sm"
                    style={{ width: '96px', height: '96px', objectFit: 'cover', border: '4px solid #10b981' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" 
                    style={{ 
                      width: '96px', 
                      height: '96px', 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                      fontSize: '2.5rem' 
                    }}
                  >
                    {fullName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="text-center text-sm-start">
                  <h4 className="fw-extrabold text-secondary mb-1">{fullName}</h4>
                  <p className="text-muted small mb-2">{authenticatedUser?.email || 'authenticated.user@rajasthan.in'}</p>
                  
                  {isEditing && (
                    <div className="mb-2">
                      <label className="form-label text-secondary small fw-bold d-block mb-1" style={{ fontSize: '0.74rem' }}>Upload Avatar Proof</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="form-control form-control-sm" 
                        style={{ maxWidth: '250px', fontSize: '0.76rem' }}
                        onChange={e => setPhotoFile(e.target.files[0])}
                      />
                    </div>
                  )}

                  <span className="badge bg-success-soft text-success rounded-pill fw-bold border border-success border-opacity-10 px-3 py-1.5" style={{ fontSize: '0.68rem' }}>
                    🟢 Verified Account Status: Active
                  </span>
                </div>
              </div>

              {/* Form / Details View */}
              <form onSubmit={handleProfileSave}>
                <div className="row g-4">
                  
                  {/* Name field */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3 small text-secondary border"
                      style={{ fontSize: '0.82rem' }}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  {/* Email field (Immutable) */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Email Address</label>
                    <input 
                      type="email" 
                      className="form-control rounded-3 py-2 px-3 small text-secondary bg-light border"
                      style={{ fontSize: '0.82rem' }}
                      value={authenticatedUser?.email || 'authenticated.user@rajasthan.in'}
                      disabled
                    />
                  </div>

                  {/* Mobile field */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Mobile Number</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3 small text-secondary border"
                      style={{ fontSize: '0.82rem' }}
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  {/* Role field (Immutable) */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Authorized Role Badge</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3 small text-secondary bg-light border font-monospace"
                      style={{ fontSize: '0.82rem', textTransform: 'uppercase' }}
                      value={authenticatedUser?.role || 'CITIZEN'}
                      disabled
                    />
                  </div>

                  {/* Ward field */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Jurisdiction Ward Sector</label>
                    <select 
                      className="form-select rounded-3 py-2 px-3 small text-secondary border"
                      style={{ fontSize: '0.82rem' }}
                      value={activeWard}
                      onChange={e => setActiveWard(e.target.value)}
                      disabled={!isEditing}
                    >
                      <option value="Ward No. 12">Ward No. 12</option>
                      <option value="Ward No. 24">Ward No. 24</option>
                      <option value="Ward No. 36">Ward No. 36</option>
                    </select>
                  </div>

                  {/* ULB field */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Urban Local Body (ULB)</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3 py-2 px-3 small text-secondary border"
                      style={{ fontSize: '0.82rem' }}
                      value={activeULB}
                      onChange={e => setActiveULB(e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  {/* Account Status field (Immutable) */}
                  <div className="col-md-12">
                    <label className="form-label text-secondary small fw-bold">Platform Status Logs</label>
                    <div className="p-3 border rounded-3 bg-light text-muted small" style={{ fontSize: '0.74rem' }}>
                      <span className="d-block mb-1">🛡️ <strong>Encryption:</strong> TLS 1.3 Active</span>
                      <span className="d-block">🔑 <strong>Session Expiry:</strong> Synced with secure Firebase Authentication nodes.</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="col-12 mt-4 text-end">
                    {!isEditing ? (
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(true)}
                        className="btn btn-success rounded-pill px-4 py-2 bg-success border-0 fw-bold shadow-sm"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <i className="bi bi-pencil-fill me-1.5"></i> Edit Profile Option
                      </button>
                    ) : (
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          type="submit" 
                          className="btn btn-success rounded-pill px-4 py-2 bg-success border-0 fw-bold shadow-sm"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button" 
                          onClick={handleCancelEdit}
                          className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </form>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
