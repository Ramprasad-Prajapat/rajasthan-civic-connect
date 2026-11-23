import React, { useState } from 'react';
import { updateMyProfile, changePassword } from '../apiService';
import { onlyDigits, normalizeMobile, isValidMobile, getMobileError, handleMobileKeyDown } from '../validators';

export default function ProfilePreview({ authenticatedUser, setAuthenticatedUser, setActivePage }) {
  const [fullName, setFullName] = useState(authenticatedUser?.name || authenticatedUser?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(authenticatedUser?.phone || '');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneError = getMobileError(phoneNumber, false, phoneTouched);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Alerts
  const [alert, setAlert] = useState(null);

  React.useEffect(() => {
    if (authenticatedUser) {
      setFullName(authenticatedUser.name || authenticatedUser.fullName || '');
      setPhoneNumber(onlyDigits(authenticatedUser.phone || authenticatedUser.mobile || ''));
    }
  }, [authenticatedUser]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCancelEdit = () => {
    setFullName(authenticatedUser?.name || authenticatedUser?.fullName || '');
    setPhoneNumber(onlyDigits(authenticatedUser?.phone || authenticatedUser?.mobile || ''));
    setPhoneTouched(false);
    setIsEditingProfile(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (phoneNumber && !isValidMobile(phoneNumber, false)) {
      showAlert('danger', getMobileError(phoneNumber, false, true) || 'Mobile number must be exactly 10 digits');
      return;
    }
    setProfileLoading(true);
    try {
      const normalizedPhone = phoneNumber ? normalizeMobile(phoneNumber) : '';
      const updated = await updateMyProfile({ name: fullName.trim(), phone: normalizedPhone });
      const updatedUser = {
        ...authenticatedUser,
        name: updated.name || fullName.trim(),
        fullName: updated.name || fullName.trim(),
        phone: updated.phone || normalizedPhone
      };
      if (setAuthenticatedUser) {
        setAuthenticatedUser(updatedUser);
      }
      localStorage.setItem('rajcivic_user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      showAlert('success', 'Profile updated successfully!');
    } catch (err) {
      showAlert('danger', err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showAlert('danger', 'New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showAlert('success', 'Password changed successfully!');
    } catch (err) {
      showAlert('danger', err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-7">
          {/* Header */}
          <div className="text-center mb-4 text-start">
            <span className="badge bg-success-soft text-success rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ fontSize: '0.7rem' }}>
              <i className="bi bi-person-badge me-1"></i> USER ACCOUNT
            </span>
            <h2 className="fw-bold text-secondary mb-1">My Profile</h2>
            <p className="text-muted small">
              Manage your personal details and account credentials.
            </p>
          </div>

          {alert && (
            <div className={`alert alert-${alert.type} rounded-4 shadow-sm mb-4 d-flex align-items-center gap-2`}>
              <i className="bi bi-info-circle-fill fs-5"></i>
              <div>{alert.text}</div>
            </div>
          )}

          {/* Card 1: Profile Information */}
          <div className="card rc-card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-start mb-4">
            <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-4">
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontSize: '1.8rem'
                }}
              >
                {(fullName[0] || authenticatedUser?.email[0] || 'U').toUpperCase()}
              </div>
              <div>
                <h4 className="fw-bold text-secondary mb-0">{fullName || 'User'}</h4>
                <span className="text-muted small d-block">{authenticatedUser?.email}</span>
                <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 small mt-1">
                  {authenticatedUser?.role || 'Citizen'}
                </span>
                {authenticatedUser?.departmentName && (
                  <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 small ms-1 mt-1">
                    {authenticatedUser.departmentName}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleProfileSave}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditingProfile}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Email (Permanent)</label>
                  <input
                    type="email"
                    className="form-control form-control-sm bg-light text-muted"
                    value={authenticatedUser?.email || ''}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Phone Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={Math.max(10, (phoneNumber || '').length)}
                    autoComplete="tel-national"
                    className={`form-control form-control-sm bg-light ${isEditingProfile && phoneError ? 'border border-danger' : ''}`}
                    value={phoneNumber}
                    onKeyDown={handleMobileKeyDown}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData ? e.clipboardData.getData('text') : '';
                      const normalized = normalizeMobile(pasted);
                      setPhoneNumber(normalized);
                      setPhoneTouched(true);
                    }}
                    onChange={(e) => {
                      setPhoneTouched(true);
                      setPhoneNumber(normalizeMobile(e.target.value));
                    }}
                    onBlur={() => setPhoneTouched(true)}
                    disabled={!isEditingProfile}
                    placeholder="10-digit phone"
                  />
                  {isEditingProfile && phoneError && (
                    <div className="text-danger small mt-1 fw-semibold animate-fade-in" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-exclamation-circle me-1"></i>{phoneError}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-secondary mb-1">Account Role</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light text-muted"
                    value={authenticatedUser?.role || 'Citizen'}
                    disabled
                  />
                </div>

                <div className="col-12 text-end mt-3">
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill px-4"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <i className="bi bi-pencil me-1"></i> Edit Details
                    </button>
                  ) : (
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm rounded-pill px-4"
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Card 2: Change Password Form */}
          <div className="card rc-card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white text-start">
            <h5 className="fw-bold text-secondary mb-1">Change Password</h5>
            <p className="text-muted small mb-4">
              Enter your current password and choose a new secure password.
            </p>

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">Current Password *</label>
                <input
                  type="password"
                  className="form-control form-control-sm bg-light"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">New Password *</label>
                <input
                  type="password"
                  className="form-control form-control-sm bg-light"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-bold text-secondary mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-control form-control-sm bg-light"
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="text-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-pill px-4"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
