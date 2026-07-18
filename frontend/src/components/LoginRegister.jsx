import React, { useState } from 'react';
import Logo from './Logo';
import { isFirebaseConfigured, auth, googleProvider } from '../firebase';
import { saveUserProfile, getUserProfile, loginUser, registerUser, verifyForgotDetails, resetPassword } from '../firestoreService';

const TEMP_CREDENTIALS = {
  citizen: { email: 'citizen@rajcivic.com', password: 'citizen123' },
  department: { email: 'department@rajcivic.com', password: 'dept123' },
  admin: { email: 'admin@rajcivic.com', password: 'admin123', authCode: '123456', mobile: '9009009009' },
};

const GoogleSvg = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.88h12.67c-.55 2.87-2.17 5.3-4.61 6.93l7.19 5.57c4.21-3.87 6.25-9.56 6.25-16.69z" />
    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.19-5.57c-1.99 1.33-4.51 2.13-7.7 2.13-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export default function LoginRegister({ authenticatedUser, setAuthenticatedUser, setActivePage }) {
  const [activePortal, setActivePortal] = useState('citizen');
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // ── Forgot Password Temporary Flow States ──
  const [forgotStep, setForgotStep] = useState(1); // 1: Verify Identity, 2: OTP Entry, 3: Reset Password
  const [deptEmail, setDeptEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [deptMobile, setDeptMobile] = useState('');
  const [deptOtp, setDeptOtp] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminMobile, setAdminMobile] = useState('9009009009');
  const [adminAuthCode, setAdminAuthCode] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'None', color: 'text-muted', percent: 0, barClass: 'bg-light' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;

    if (score < 40) return { score, text: 'Weak ⚠️', color: 'text-danger', percent: score, barClass: 'bg-danger' };
    if (score < 75) return { score, text: 'Medium ⚡', color: 'text-warning', percent: score, barClass: 'bg-warning' };
    if (score < 90) return { score, text: 'Strong 💪', color: 'text-primary', percent: score, barClass: 'bg-primary' };
    return { score, text: 'Excellent 🛡️', color: 'text-success', percent: score, barClass: 'bg-success' };
  };

  const triggerAlert = (type, text) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4500);
  };

  const switchView = (view) => {
    setAuthView(view); setAlertMsg(null);
    setEmail(''); setPassword(''); setName(''); setMobile('');
    setConfirmPassword(''); setOtpSent(false); setOtp('');
    setOtpVerified(false); setTermsAgreed(false);
    setAdminCode(''); setShowGooglePopup(false);

    setForgotStep(1);
    setDeptEmail(''); setEmpId(''); setDeptMobile(''); setDeptOtp('');
    setAdminEmail(''); setAdminId(''); setAdminMobile('9009009009'); setAdminAuthCode('');
    setNewPassword(''); setConfirmNewPassword('');
    setForgotLoading(false);

    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setShowForgotNewPassword(false);
    setShowForgotConfirmPassword(false);
  };

  const switchPortal = (portal) => {
    setActivePortal(portal); switchView('login');
  };

  const handleGoogleSignIn = async (mockAccount = null) => {
    setShowGooglePopup(false);
    setLoading(true);

    if (isFirebaseConfigured && auth && googleProvider && !mockAccount) {
      try {
        const { signInWithPopup } = await import("firebase/auth");
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Sync profile to Firestore
        const profileData = {
          fullName: user.displayName || 'Google Citizen User',
          email: user.email,
          phone: user.phoneNumber || '',
          role: 'Citizen',
          authProvider: 'google.com',
          status: 'Active'
        };
        await saveUserProfile(user.uid, profileData);

        const mockUser = {
          name: user.displayName || 'Google Citizen User',
          email: user.email,
          rtdbNode: `/citizens/${user.email.replace(/[.#$[\]]/g, '_')}`,
          provider: 'google.com',
          portal: 'citizen',
          role: 'Citizen',
          uid: user.uid,
          ...profileData
        };
        setAuthenticatedUser(mockUser);
        triggerAlert('success', `Signed in with Google as ${user.displayName}! Redirecting...`);
        setLoading(false);
        setTimeout(() => { if (setActivePage) setActivePage('Profile'); }, 1200);
      } catch (error) {
        console.error("Google Sign-In Error:", error);
        triggerAlert('danger', `Google Sign-in failed: ${error.message || error}`);
        setLoading(false);
      }
    } else {
      // Fallback mock sign-in if Firebase is unconfigured or a mock account is selected
      const targetAcc = mockAccount || { name: 'Google Citizen User', email: 'citizen.google@gmail.com' };
      setTimeout(async () => {
        const mockUid = `MOCK_G_${targetAcc.email.replace(/[.#$[\]]/g, '_')}`;
        const profileData = {
          fullName: targetAcc.name,
          email: targetAcc.email,
          phone: '',
          role: 'Citizen',
          authProvider: 'google.com',
          status: 'Active'
        };
        await saveUserProfile(mockUid, profileData);

        const mockUser = {
          name: targetAcc.name,
          email: targetAcc.email,
          rtdbNode: `/citizens/${targetAcc.email.replace(/[.#$[\]]/g, '_')}`,
          provider: 'google.com',
          portal: 'citizen',
          role: 'Citizen',
          uid: mockUid,
          ...profileData
        };
        setAuthenticatedUser(mockUser);
        triggerAlert('success', `Signed in with Google as ${targetAcc.name}! Redirecting to Citizen Portal...`);
        setLoading(false);
        setTimeout(() => { if (setActivePage) setActivePage('Profile'); }, 1200);
      }, 900);
    }
  };

  const handleGoogleClick = () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      handleGoogleSignIn();
    } else {
      setShowGooglePopup(true);
    }
  };

  // ── Send temporary OTP ──
  const handleSendOtp = () => {
    if (!mobile || mobile.length < 10) {
      triggerAlert('danger', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    triggerAlert('success', `OTP sent to +91-${mobile} (Temporary OTP: 1234)`);
  };

  // ── Verify temporary OTP ──
  const handleVerifyOtp = () => {
    if (otp === '1234') {
      setOtpVerified(true);
      triggerAlert('success', 'Mobile number verified successfully!');
    } else {
      triggerAlert('danger', 'Invalid OTP. Temporary OTP is: 1234');
    }
  };

  // ── Main form submit ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ─── CITIZEN REGISTRATION ───
    if (activePortal === 'citizen' && authView === 'register') {
      if (password !== confirmPassword) {
        triggerAlert('danger', 'Passwords do not match.');
        setLoading(false); return;
      }
      if (!termsAgreed) {
        triggerAlert('danger', 'Please agree to the Terms & Conditions.');
        setLoading(false); return;
      }
      if (!otpVerified) {
        triggerAlert('danger', 'Please verify your mobile number with OTP first.');
        setLoading(false); return;
      }

      try {
        if (isFirebaseConfigured && auth) {
          try {
            const { createUserWithEmailAndPassword } = await import("firebase/auth");
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            const profileData = {
              fullName: name,
              email: email,
              phone: mobile,
              role: 'Citizen',
              authProvider: 'password',
              status: 'Active'
            };
            await saveUserProfile(user.uid, profileData);
            await auth.signOut();
          } catch (fbErr) {
            console.warn("Firebase Auth registration failed or not supported, proceeding with DB registration...", fbErr);
          }
        }

        // Call the backend registration API
        await registerUser(name, email, password, mobile, 'Citizen', 'citizen');

        triggerAlert('success', `Registration successful! Please login with your password.`);
        switchView('login');
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
      } catch (error) {
        console.error("Registration Error:", error);
        triggerAlert('danger', `Registration failed: ${error.message}`);
        setLoading(false);
      }
    }

    // ─── LOGIN FLOWS (Citizen, Department, Admin) ───
    else {
      let role = 'Citizen';
      let portalName = activePortal;
      let defaultName = 'Citizen User';
      let department = '';
      let cred = TEMP_CREDENTIALS[activePortal];

      if (activePortal === 'department') {
        role = 'Department Officer';
        defaultName = 'Department Officer';
        department = 'Urban Development';
      } else if (activePortal === 'admin') {
        role = 'Super Admin';
        defaultName = 'Platform Super Administrator';
        department = 'DLC HQ';
      }

      // First try our custom database-driven login
      try {
        if (activePortal === 'admin' && adminCode !== cred.authCode && adminCode !== '123456') {
          triggerAlert('danger', `Invalid authenticator code.`);
          setLoading(false); return;
        }

        const dbUser = await loginUser(email, password, activePortal);

        const mockUser = {
          name: dbUser.fullName || dbUser.name || defaultName,
          email: dbUser.email,
          rtdbNode: `/${portalName}s/${email.replace(/[.#$[\]]/g, '_')}`,
          provider: 'password', portal: portalName,
          role: dbUser.role || role,
          department: dbUser.department || department,
          uid: dbUser.uid || dbUser.email,
          ...dbUser
        };
        setAuthenticatedUser(mockUser);
        triggerAlert('success', `Welcome back! Redirecting...`);
        setLoading(false);
        setTimeout(() => { if (setActivePage) setActivePage('Profile'); }, 1200);
        return;
      } catch (dbErr) {
        console.warn("Database login failed, trying Firebase client auth...", dbErr);

        // Fallback to real Firebase Auth
        if (isFirebaseConfigured && auth) {
          try {
            const { signInWithEmailAndPassword } = await import("firebase/auth");
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;

            const profile = await getUserProfile(user.uid);
            const mockUser = {
              name: profile?.fullName || user.displayName || defaultName,
              email: user.email,
              rtdbNode: `/${portalName}s/${email.replace(/[.#$[\]]/g, '_')}`,
              provider: 'password', portal: portalName,
              role: profile?.role || role,
              department: profile?.department || department,
              uid: user.uid,
              ...profile
            };
            setAuthenticatedUser(mockUser);
            triggerAlert('success', `Welcome back! Redirecting...`);
            setLoading(false);
            setTimeout(() => { if (setActivePage) setActivePage('Profile'); }, 1200);
            return;
          } catch (fbErr) {
            console.error("Firebase Sign In Error:", fbErr);
          }
        }

        triggerAlert('danger', dbErr.message || 'Invalid email or password.');
        setLoading(false);
      }
    }
  };

  // Sign out
  const handleSignOut = () => {
    if (setAuthenticatedUser) setAuthenticatedUser(null);
    triggerAlert('success', 'Logged out successfully.');
  };

  // ─── Citizen Forgot Password Submit ───
  const handleCitizenForgotSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      triggerAlert('danger', 'Please enter your registered email.');
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      triggerAlert('success', 'Password reset link has been sent to your email.');
      setAuthView('login');
    }, 1500);
  };

  // ─── Department Verify Identity ───
  const handleDeptVerifyDetails = async (e) => {
    e.preventDefault();
    if (!deptEmail || !empId || !deptMobile) {
      triggerAlert('danger', 'Please fill in all details.');
      return;
    }
    setForgotLoading(true);
    try {
      await verifyForgotDetails({
        email: deptEmail,
        empId,
        deptMobile,
        portal: 'department'
      });
      setForgotLoading(false);
      setForgotStep(2);
      triggerAlert('success', `Details verified! A temporary OTP has been sent to +91-${deptMobile} (OTP: 123456)`);
    } catch (error) {
      setForgotLoading(false);
      triggerAlert('danger', error.message || 'Failed to verify details');
    }
  };

  // ─── Department OTP Validation ───
  const handleDeptVerifyOtp = (e) => {
    e.preventDefault();
    if (deptOtp !== '123456') {
      triggerAlert('danger', 'Invalid OTP code. For demo, use 123456');
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotStep(3);
      triggerAlert('success', 'OTP verified successfully! You can now set your new password.');
    }, 1500);
  };

  // ─── Department Password Update ───
  const handleDeptResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      triggerAlert('danger', 'New passwords do not match.');
      return;
    }
    const strength = getPasswordStrength(newPassword);
    if (strength.score < 40) {
      triggerAlert('danger', 'Please choose a stronger password.');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(deptEmail, newPassword);
      setForgotLoading(false);
      triggerAlert('success', 'Password reset successful! You can now log in.');
      setAuthView('login');
      setForgotStep(1);
      // Reset forms
      setDeptEmail(''); setEmpId(''); setDeptMobile(''); setDeptOtp('');
      setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
      setForgotLoading(false);
      triggerAlert('danger', error.message || 'Failed to reset password');
    }
  };

  // ─── Admin Verify Details & 2FA ───
  const handleAdminVerifyDetails = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminId || !adminMobile || !adminAuthCode) {
      triggerAlert('danger', 'Please fill in all details.');
      return;
    }
    setForgotLoading(true);
    try {
      await verifyForgotDetails({
        email: adminEmail,
        adminId,
        adminMobile,
        adminAuthCode,
        portal: 'admin'
      });
      setForgotLoading(false);
      setForgotStep(3);
      triggerAlert('success', '2FA authenticator code verified! Please set your new root password.');
    } catch (error) {
      setForgotLoading(false);
      triggerAlert('danger', error.message || 'Failed to verify Admin details');
    }
  };

  // ─── Admin Password Update ───
  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      triggerAlert('danger', 'New passwords do not match.');
      return;
    }
    const strength = getPasswordStrength(newPassword);
    if (strength.score < 40) {
      triggerAlert('danger', 'Please choose a stronger password.');
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(adminEmail, newPassword);
      setForgotLoading(false);
      triggerAlert('success', 'Admin password reset verified successfully.');
      setAuthView('login');
      setForgotStep(1);
      // Reset forms
      setAdminEmail(''); setAdminId(''); setAdminMobile(''); setAdminAuthCode('');
      setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
      setForgotLoading(false);
      triggerAlert('danger', error.message || 'Failed to reset password');
    }
  };

  const CredHint = ({ portal }) => {
    const c = TEMP_CREDENTIALS[portal];
    return (
      <div className="p-2 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px dashed rgba(16,185,129,0.35)' }}>
        <i className="bi bi-info-circle-fill text-success" style={{ fontSize: '0.85rem' }}></i>
        <span className="text-muted" style={{ fontSize: '0.68rem' }}>
          Temp → <strong>{c.email}</strong> / <strong>{c.password}</strong>
          {c.authCode && <> / Code: <strong>{c.authCode}</strong></>}
        </span>
      </div>
    );
  };

  const GoogleButton = () => (
    <div className="text-center mt-3">
      <div className="d-flex align-items-center my-2 text-muted" style={{ fontSize: '0.66rem' }}>
        <hr className="flex-grow-1 m-0" /><span className="mx-2 fw-bold">OR</span><hr className="flex-grow-1 m-0" />
      </div>
      <button type="button" onClick={handleGoogleClick}
        className="rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center"
        style={{ width: '48px', height: '48px', background: '#fff', border: '2px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
        title="Sign in with Google"
        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(66,133,244,0.3)'}
        onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
      ><GoogleSvg /></button>
      <p className="text-muted mt-1" style={{ fontSize: '0.64rem' }}>Sign in with Google</p>
    </div>
  );

  return (
    <section className="min-vh-100 d-flex align-items-center bg-light py-5" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #eff6ff 100%)' }}>
      <div className="container py-4 text-start animate-fade-in">

        {/* Alert */}
        {alertMsg && (
          <div className={`alert alert-${alertMsg.type} border-0 rounded-4 shadow-sm p-3 mb-4 d-flex align-items-center gap-2`} role="alert">
            <i className={`bi ${alertMsg.type === 'success' ? 'bi-check-circle-fill fs-5' : 'bi-exclamation-triangle-fill fs-5'}`}></i>
            <span style={{ fontSize: '0.8rem' }} className="fw-semibold">{alertMsg.text}</span>
          </div>
        )}

        <div className="row g-4 justify-content-center align-items-stretch">

          {/* ── LEFT PANEL ── */}
          <div className="col-lg-5 col-md-6 order-2 order-lg-1 d-flex">
            <div className="card border-0 rounded-4 shadow-lg p-4 p-lg-5 text-white h-100 w-100" style={{ background: 'linear-gradient(135deg, #0f4c81 0%, #1e3a5f 60%, #0d9488 100%)' }}>
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Logo width={54} height={54} />
                  <span className="badge bg-success rounded-pill font-monospace py-1 px-3" style={{ fontSize: '0.62rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                    🔒 SECURE PORTAL ACTIVE
                  </span>
                </div>
                <h3 className="fw-bold mb-2 text-white">Rajasthan Local Self Government</h3>
                <p className="text-white-50 small mb-0" style={{ lineHeight: '1.6' }}>
                  RajCivic Connect acts as a secure control gateway routing civic, sanitary, and infrastructural anomalies directly to Nagar Palikas, Parishads, and Municipal workers.
                </p>
              </div>

              <div className="d-flex flex-column gap-3 mb-4">
                {[
                  { icon: 'bi-person-check', text: 'Citizen Grievance Submission Desk' },
                  { icon: 'bi-shield-check', text: 'Department Officer Access Portal' },
                  { icon: 'bi-graph-up-arrow', text: 'Command Room Administrative Access' },
                ].map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px', background: 'rgba(16, 185, 129, 0.2)' }}>
                      <i className={`bi ${item.icon} text-success`} style={{ fontSize: '0.85rem' }}></i>
                    </div>
                    <span className="small text-white-50">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4 border-top border-secondary border-opacity-10 text-start">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-headset text-success"></i>
                  <span className="text-white-50" style={{ fontSize: '0.78rem' }}>Toll-Free Support: <strong>1800-180-6127</strong></span>
                </div>
                <span className="text-white-50 font-monospace" style={{ fontSize: '0.64rem' }}>Powered by DLC, G-3 Raj Mahal Residency, Jaipur, Rajasthan</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: FORMS ── */}
          <div className="col-lg-6 col-md-6 order-1 order-lg-2 d-flex">
            <div className="card border-0 p-4 shadow-lg bg-white h-100 w-100 rounded-4">

              {/* Portal tabs (hide when on register view or logged in) */}
              {!authenticatedUser && authView !== 'register' && (
                <div className="d-flex p-1 bg-light rounded-3 mb-4 border" style={{ gap: '2px' }}>
                  <button onClick={() => switchPortal('citizen')} className={`btn flex-fill py-2 rounded-3 fw-bold border-0 ${activePortal === 'citizen' ? 'bg-success text-white shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.74rem' }}>
                    🧑 Citizen
                  </button>
                  <button onClick={() => switchPortal('department')} className={`btn flex-fill py-2 rounded-3 fw-bold border-0 ${activePortal === 'department' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.74rem' }}>
                    🏢 Department
                  </button>
                  <button onClick={() => switchPortal('admin')} className={`btn flex-fill py-2 rounded-3 fw-bold border-0 ${activePortal === 'admin' ? 'bg-danger text-white shadow-sm' : 'text-muted bg-transparent'}`} style={{ fontSize: '0.74rem' }}>
                    🔑 Admin
                  </button>
                </div>
              )}

              {/* ── LOGGED IN VIEW ── */}
              {authenticatedUser ? (
                <div className="text-start py-4 animate-fade-in">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold font-monospace shadow" style={{ width: '54px', height: '54px', background: 'linear-gradient(135deg, #0f4c81 0%, #10b981 100%)', fontSize: '1.4rem' }}>
                      {authenticatedUser.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h5 className="fw-bold text-secondary m-0">{authenticatedUser.name}</h5>
                      <span className="text-muted small d-block">{authenticatedUser.email}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-light rounded-3 border mb-4">
                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2 small">
                      <span className="text-muted">Portal Access:</span>
                      <strong className="text-success">{authenticatedUser.portal?.toUpperCase()}</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-2 mb-2 small">
                      <span className="text-muted">System Role:</span>
                      <strong className="text-primary">{authenticatedUser.role}</strong>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">DB Node:</span>
                      <strong className="text-secondary font-monospace" style={{ fontSize: '0.66rem' }}>{authenticatedUser.rtdbNode}</strong>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button onClick={() => { if (setActivePage) setActivePage('Dashboards'); }} className="btn btn-sm btn-success text-white rounded-pill px-4 py-2 fw-bold">
                      Go to Dashboard
                    </button>
                    <button onClick={handleSignOut} className="btn btn-sm btn-outline-danger rounded-pill px-4 py-2 fw-bold">
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in text-start">

                  {/* ════════ 1. CITIZEN LOGIN ════════ */}
                  {activePortal === 'citizen' && authView === 'login' && (
                    <form onSubmit={handleFormSubmit} autoComplete="off">
                      <h5 className="fw-bold text-secondary mb-1">Citizen Portal Sign In</h5>
                      <p className="text-muted small mb-3">Enter your citizen credentials to access the grievance portal.</p>
                      <CredHint portal="citizen" />
                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">Email Address</label>
                        <input type="email" required autoComplete="off" placeholder={TEMP_CREDENTIALS.citizen.email} className="form-control rounded-3 py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Password</label>
                        <div className="position-relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            placeholder={TEMP_CREDENTIALS.citizen.password}
                            className="form-control rounded-3 py-2 px-3 border"
                            style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                          >
                            <i className={`bi ${showLoginPassword ? 'bi-eye-slash-fill text-success' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-end mb-3">
                        <span onClick={() => switchView('forgot')} className="text-primary fw-semibold" style={{ cursor: 'pointer', fontSize: '0.72rem' }}>Forgot Password?</span>
                      </div>
                      <button type="submit" className="btn btn-success w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white">
                        {loading ? 'Authenticating...' : 'Sign In as Citizen'}
                      </button>
                      <GoogleButton />
                      <div className="text-center border-top pt-3 text-muted small">
                        New to the platform?{' '}
                        <span onClick={() => switchView('register')} className="text-success fw-bold" style={{ cursor: 'pointer' }}>Create Citizen Account</span>
                      </div>
                    </form>
                  )}

                  {/* ════════ FORGOT PASSWORD SYSTEM (ALL PORTALS) ════════ */}
                  {authView === 'forgot' && (
                    <div className="animate-scale-up">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <h5 className="fw-bold text-secondary m-0">
                          {activePortal === 'citizen' && 'Citizen '}
                          {activePortal === 'department' && 'Officer '}
                          {activePortal === 'admin' && 'Admin '}
                          Reset Password
                        </h5>
                        <button type="button" onClick={() => switchView('login')} className="btn btn-sm btn-outline-secondary rounded-pill px-3" style={{ fontSize: '0.66rem' }}>
                          ➔ Back to Sign In
                        </button>
                      </div>

                      {/* Temporary Frontend-Only Flow Warning Alert */}
                      <div className="alert alert-warning border-0 rounded-4 shadow-sm p-3 mb-4" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                        <div className="d-flex gap-2">
                          <i className="bi bi-shield-fill-exclamation text-warning fs-5"></i>
                          <div>
                            <strong className="text-warning-dark small d-block mb-1">⚠️ Temporary Sandbox</strong>
                            <span className="text-muted d-block" style={{ fontSize: '0.62rem', lineHeight: '1.4' }}>
                              This is a secure frontend-only password simulation. No permanent database changes will occur yet.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1. CITIZEN FORGOT FLOW */}
                      {activePortal === 'citizen' && (
                        <form onSubmit={handleCitizenForgotSubmit}>
                          <p className="text-muted small mb-3">Enter your registered email address to receive a secure recovery link.</p>
                          <div className="mb-3">
                            <label className="form-label text-secondary small fw-semibold">Registered Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. citizen@rajcivic.com"
                              className="form-control rounded-3 py-2 px-3 border"
                              style={{ fontSize: '0.8rem' }}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>

                          <button type="submit" disabled={forgotLoading} className="btn btn-warning w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                            {forgotLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Dispatching Reset Link...
                              </>
                            ) : (
                              'Send Password Reset Link'
                            )}
                          </button>
                        </form>
                      )}

                      {/* 2. DEPARTMENT OFFICER FORGOT FLOW */}
                      {activePortal === 'department' && (
                        <div>
                          {/* Step 1: Officer Details Verification */}
                          {forgotStep === 1 && (
                            <form onSubmit={handleDeptVerifyDetails}>
                              <p className="text-muted small mb-3">Provide official department identification to dispatch an authorized validation OTP.</p>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">Official Email Address</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. department@rajcivic.com"
                                  className="form-control rounded-3 py-2 px-3 border"
                                  style={{ fontSize: '0.8rem' }}
                                  value={deptEmail}
                                  onChange={(e) => setDeptEmail(e.target.value)}
                                />
                              </div>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">Employee Unique ID</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. EMP-2026-X8"
                                  className="form-control rounded-3 py-2 px-3 border font-monospace"
                                  style={{ fontSize: '0.8rem' }}
                                  value={empId}
                                  onChange={(e) => setEmpId(e.target.value)}
                                />
                              </div>

                              <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">Registered Mobile Number</label>
                                <input
                                  type="tel"
                                  required
                                  maxLength={10}
                                  placeholder="e.g. 9876543210"
                                  className="form-control rounded-3 py-2 px-3 border"
                                  style={{ fontSize: '0.8rem' }}
                                  value={deptMobile}
                                  onChange={(e) => setDeptMobile(e.target.value.replace(/\D/g, ''))}
                                />
                              </div>

                              <button type="submit" disabled={forgotLoading} className="btn btn-primary w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                                {forgotLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Verifying Officer Identity...
                                  </>
                                ) : (
                                  'Verify Details & Request OTP'
                                )}
                              </button>
                            </form>
                          )}

                          {/* Step 2: Department OTP Verification */}
                          {forgotStep === 2 && (
                            <form onSubmit={handleDeptVerifyOtp}>
                              <p className="text-muted small mb-3">Enter the 6-digit OTP code dispatched to <strong>+91-{deptMobile}</strong>.</p>

                              <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">6-Digit Verification OTP</label>
                                <input
                                  type="text"
                                  required
                                  maxLength={6}
                                  placeholder="Temp OTP: 123456"
                                  className="form-control rounded-3 py-2 px-3 border text-center font-monospace fw-bold"
                                  style={{ fontSize: '1.1rem', letterSpacing: '6px' }}
                                  value={deptOtp}
                                  onChange={(e) => setDeptOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                <div className="form-text text-muted text-center mt-1" style={{ fontSize: '0.62rem' }}>
                                  Use the sandbox OTP bypass code: <strong>123456</strong>
                                </div>
                              </div>

                              <button type="submit" disabled={forgotLoading} className="btn btn-success w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                                {forgotLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Validating OTP Code...
                                  </>
                                ) : (
                                  'Confirm OTP & Proceed'
                                )}
                              </button>
                            </form>
                          )}

                          {/* Step 3: New Password Creation */}
                          {forgotStep === 3 && (
                            <form onSubmit={handleDeptResetPassword}>
                              <p className="text-muted small mb-3">Establish a secure, high-entropy password for future officer sessions.</p>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">New Password</label>
                                <div className="position-relative">
                                  <input
                                    type={showForgotNewPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="form-control rounded-3 py-2 px-3 border"
                                    style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                                    style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                                  >
                                    <i className={`bi ${showForgotNewPassword ? 'bi-eye-slash-fill text-primary' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                                  </button>
                                </div>
                                {/* Dynamic Password Strength Indicator */}
                                <div className="mt-2">
                                  <div className="d-flex justify-content-between text-xxs mb-1">
                                    <span className="text-muted">Password Strength:</span>
                                    <strong className={getPasswordStrength(newPassword).color}>
                                      {getPasswordStrength(newPassword).text}
                                    </strong>
                                  </div>
                                  <div className="progress" style={{ height: '4px' }}>
                                    <div
                                      className={`progress-bar ${getPasswordStrength(newPassword).barClass}`}
                                      style={{ width: `${getPasswordStrength(newPassword).percent}%`, transition: 'all 0.3s' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">Confirm New Password</label>
                                <div className="position-relative">
                                  <input
                                    type={showForgotConfirmPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="form-control rounded-3 py-2 px-3 border"
                                    style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                                    style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                                  >
                                    <i className={`bi ${showForgotConfirmPassword ? 'bi-eye-slash-fill text-primary' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                                  </button>
                                </div>
                                {newPassword && confirmNewPassword && (
                                  <div className="mt-1" style={{ fontSize: '0.66rem' }}>
                                    {newPassword === confirmNewPassword ? (
                                      <span className="text-success">✓ Passwords match successfully</span>
                                    ) : (
                                      <span className="text-danger">✗ Passwords do not match yet</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button type="submit" disabled={forgotLoading} className="btn btn-primary w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                                {forgotLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Updating Officer Password...
                                  </>
                                ) : (
                                  'Confirm Password Update'
                                )}
                              </button>
                            </form>
                          )}
                        </div>
                      )}

                      {/* 3. ADMIN FORGOT FLOW */}
                      {activePortal === 'admin' && (
                        <div>
                          {/* Step 1: Admin Identity & Authenticator Code */}
                          {forgotStep === 1 && (
                            <form onSubmit={handleAdminVerifyDetails}>
                              <p className="text-muted small mb-3">Provide system administrator tokens and your active 6-digit 2FA token.</p>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">Super Admin Email</label>
                                <input
                                  type="email"
                                  required
                                  placeholder="e.g. admin@rajcivic.com"
                                  className="form-control rounded-3 py-2 px-3 border"
                                  style={{ fontSize: '0.8rem' }}
                                  value={adminEmail}
                                  onChange={(e) => setAdminEmail(e.target.value)}
                                />
                              </div>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">Admin Unique ID</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. ADM-ROOT-01"
                                  className="form-control rounded-3 py-2 px-3 border font-monospace"
                                  style={{ fontSize: '0.8rem' }}
                                  value={adminId}
                                  onChange={(e) => setAdminId(e.target.value)}
                                />
                              </div>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">Registered Admin Mobile</label>
                                <input
                                  type="tel"
                                  required
                                  maxLength={10}
                                  placeholder="Temp Mobile: 9009009009"
                                  className="form-control rounded-3 py-2 px-3 border"
                                  style={{ fontSize: '0.8rem' }}
                                  value={adminMobile}
                                  onChange={(e) => setAdminMobile(e.target.value.replace(/\D/g, ''))}
                                />
                              </div>

                              <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold d-flex align-items-center gap-1 text-danger">
                                  <i className="bi bi-shield-lock-fill"></i> 6-Digit 2FA Authenticator Code
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={6}
                                  placeholder="Temp Code: 123456"
                                  className="form-control rounded-3 py-2 px-3 border text-center font-monospace fw-bold"
                                  style={{ fontSize: '1.1rem', letterSpacing: '6px' }}
                                  value={adminAuthCode}
                                  onChange={(e) => setAdminAuthCode(e.target.value.replace(/\D/g, ''))}
                                />
                                <div className="form-text text-muted text-center mt-1" style={{ fontSize: '0.62rem' }}>
                                  Use Sandbox 2FA Bypass Code: <strong>123456</strong>
                                </div>
                              </div>

                              <button type="submit" disabled={forgotLoading} className="btn btn-danger w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                                {forgotLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Verifying Administrator Tokens...
                                  </>
                                ) : (
                                  'Verify & Authenticate'
                                )}
                              </button>
                            </form>
                          )}

                          {/* Step 3: Admin New Password Setting */}
                          {forgotStep === 3 && (
                            <form onSubmit={handleAdminResetPassword}>
                              <p className="text-muted small mb-3">Re-key the system-root access password with high-complexity parameters.</p>

                              <div className="mb-2">
                                <label className="form-label text-secondary small fw-semibold">New Root Password</label>
                                <div className="position-relative">
                                  <input
                                    type={showForgotNewPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="form-control rounded-3 py-2 px-3 border"
                                    style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                                    style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                                  >
                                    <i className={`bi ${showForgotNewPassword ? 'bi-eye-slash-fill text-danger' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                                  </button>
                                </div>
                                {/* Dynamic Password Strength Indicator */}
                                <div className="mt-2">
                                  <div className="d-flex justify-content-between text-xxs mb-1">
                                    <span className="text-muted">Password Strength:</span>
                                    <strong className={getPasswordStrength(newPassword).color}>
                                      {getPasswordStrength(newPassword).text}
                                    </strong>
                                  </div>
                                  <div className="progress" style={{ height: '4px' }}>
                                    <div
                                      className={`progress-bar ${getPasswordStrength(newPassword).barClass}`}
                                      style={{ width: `${getPasswordStrength(newPassword).percent}%`, transition: 'all 0.3s' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <label className="form-label text-secondary small fw-semibold">Confirm New Root Password</label>
                                <div className="position-relative">
                                  <input
                                    type={showForgotConfirmPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="form-control rounded-3 py-2 px-3 border"
                                    style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                                    style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                                  >
                                    <i className={`bi ${showForgotConfirmPassword ? 'bi-eye-slash-fill text-danger' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                                  </button>
                                </div>
                                {newPassword && confirmNewPassword && (
                                  <div className="mt-1" style={{ fontSize: '0.66rem' }}>
                                    {newPassword === confirmNewPassword ? (
                                      <span className="text-success">✓ Root passwords match</span>
                                    ) : (
                                      <span className="text-danger">✗ Root passwords do not match</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button type="submit" disabled={forgotLoading} className="btn btn-danger w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white d-flex align-items-center justify-content-center gap-2">
                                {forgotLoading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Re-keying Admin Credentials...
                                  </>
                                ) : (
                                  'Apply Root Password Reset'
                                )}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ════════ 2. CITIZEN REGISTER ════════ */}
                  {activePortal === 'citizen' && authView === 'register' && (
                    <form onSubmit={handleFormSubmit} className="animate-scale-up">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <h5 className="fw-bold text-secondary m-0">Citizen Registration</h5>
                        <button type="button" onClick={() => switchView('login')} className="btn btn-sm btn-outline-secondary rounded-pill px-3" style={{ fontSize: '0.66rem' }}>
                          ➔ Back to Sign In
                        </button>
                      </div>
                      <p className="text-muted small mb-3">Create your citizen account to track public issues.</p>

                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Full Name</label>
                        <input type="text" required placeholder="e.g. Ramprasad Sharma" className="form-control rounded-3 py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={name} onChange={(e) => setName(e.target.value)} />
                      </div>

                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Email Address</label>
                        <input type="email" required placeholder="name@example.com" className="form-control rounded-3 py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>

                      {/* ── Mobile + OTP ── */}
                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Mobile Number</label>
                        <div className="input-group">
                          <span className="input-group-text border bg-light" style={{ fontSize: '0.78rem' }}>+91</span>
                          <input type="tel" required placeholder="9876543210" maxLength={10} className="form-control rounded-end py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} disabled={otpVerified} />
                        </div>
                      </div>

                      {!otpVerified && (
                        <div className="mb-3">
                          {!otpSent ? (
                            <button type="button" onClick={handleSendOtp} className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold" style={{ fontSize: '0.72rem' }}>
                              📩 Send OTP
                            </button>
                          ) : (
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <input type="text" placeholder="Temp OTP: 1234" maxLength={4} className="form-control form-control-sm rounded-3 border" style={{ fontSize: '0.8rem', width: '140px' }} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                              <button type="button" onClick={handleVerifyOtp} className="btn btn-sm btn-success rounded-pill px-3 fw-semibold text-white" style={{ fontSize: '0.72rem' }}>
                                Verify OTP
                              </button>
                              <button type="button" onClick={handleSendOtp} className="btn btn-sm btn-outline-secondary rounded-pill px-2" style={{ fontSize: '0.66rem' }}>
                                Resend
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {otpVerified && (
                        <div className="d-flex align-items-center gap-1 mb-3">
                          <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '0.9rem' }}></i>
                          <span className="text-success fw-semibold" style={{ fontSize: '0.72rem' }}>Mobile Verified ✓</span>
                        </div>
                      )}

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label text-secondary small fw-semibold">Password</label>
                          <div className="position-relative">
                            <input
                              type={showRegPassword ? "text" : "password"}
                              required
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="form-control rounded-3 py-2 px-3 border"
                              style={{ fontSize: '0.8rem', paddingRight: '40px' }}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-2.5 text-muted animate-all"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                            >
                              <i className={`bi ${showRegPassword ? 'bi-eye-slash-fill text-success' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                            </button>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="form-label text-secondary small fw-semibold">Confirm Password</label>
                          <div className="position-relative">
                            <input
                              type={showRegConfirmPassword ? "text" : "password"}
                              required
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="form-control rounded-3 py-2 px-3 border"
                              style={{ fontSize: '0.8rem', paddingRight: '40px' }}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-2.5 text-muted animate-all"
                              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                            >
                              <i className={`bi ${showRegConfirmPassword ? 'bi-eye-slash-fill text-success' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="form-check mb-3 text-start">
                        <input type="checkbox" className="form-check-input" id="citizenTerms" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} />
                        <label className="form-check-label text-muted small" htmlFor="citizenTerms" style={{ fontSize: '0.74rem' }}>
                          I agree to the local government policy terms and GIS tracking disclosures.
                        </label>
                      </div>

                      <button type="submit" className="btn btn-success w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white">
                        {loading ? 'Creating account...' : 'Create Citizen Account'}
                      </button>
                    </form>
                  )}

                  {/* ════════ 3. DEPARTMENT LOGIN (email + password only) ════════ */}
                  {activePortal === 'department' && authView === 'login' && (
                    <form onSubmit={handleFormSubmit} autoComplete="off">
                      <h5 className="fw-bold text-secondary mb-1">Department Sign In</h5>
                      <p className="text-muted small mb-3">Login to the official department officer workspace.</p>
                      <CredHint portal="department" />

                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">Email Address</label>
                        <input type="email" required autoComplete="off" placeholder={TEMP_CREDENTIALS.department.email} className="form-control rounded-3 py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Password</label>
                        <div className="position-relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            placeholder={TEMP_CREDENTIALS.department.password}
                            className="form-control rounded-3 py-2 px-3 border"
                            style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                          >
                            <i className={`bi ${showLoginPassword ? 'bi-eye-slash-fill text-primary' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-end mb-3">
                        <span onClick={() => switchView('forgot')} className="text-primary fw-semibold" style={{ cursor: 'pointer', fontSize: '0.72rem' }}>Forgot Password?</span>
                      </div>

                      <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white">
                        {loading ? 'Verifying...' : 'Sign In'}
                      </button>
                      <GoogleButton />
                    </form>
                  )}

                  {/* ════════ 4. ADMIN LOGIN ════════ */}
                  {activePortal === 'admin' && authView === 'login' && (
                    <form onSubmit={handleFormSubmit} autoComplete="off">
                      <h5 className="fw-bold text-secondary mb-1">Admin Sign In</h5>
                      <p className="text-muted small mb-3">Access for Nagar Nigam Command System Administrators.</p>
                      <CredHint portal="admin" />
                      <div className="mb-3">
                        <label className="form-label text-secondary small fw-semibold">Admin Email</label>
                        <input type="email" required autoComplete="off" placeholder={TEMP_CREDENTIALS.admin.email} className="form-control rounded-3 py-2 px-3 border" style={{ fontSize: '0.8rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label text-secondary small fw-semibold">Password</label>
                        <div className="position-relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            placeholder={TEMP_CREDENTIALS.admin.password}
                            className="form-control rounded-3 py-2 px-3 border"
                            style={{ fontSize: '0.8rem', paddingRight: '45px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent px-3 text-muted animate-all"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            style={{ zIndex: 10, outline: 'none', boxShadow: 'none' }}
                          >
                            <i className={`bi ${showLoginPassword ? 'bi-eye-slash-fill text-danger' : 'bi-eye-fill text-muted'}`} style={{ fontSize: '1.15rem', cursor: 'pointer', transition: 'all 0.2s' }}></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-end mb-3">
                        <span onClick={() => switchView('forgot')} className="text-primary fw-semibold" style={{ cursor: 'pointer', fontSize: '0.72rem' }}>Forgot Password?</span>
                      </div>
                      <div className="mb-4">
                        <label className="form-label text-secondary small fw-semibold d-flex align-items-center gap-1">
                          <i className="bi bi-shield-lock text-danger" style={{ fontSize: '0.85rem' }}></i> 6-Digit Authenticator Code
                        </label>
                        <input type="text" required maxLength={6} placeholder={TEMP_CREDENTIALS.admin.authCode} className="form-control rounded-3 py-2 px-3 border font-monospace text-center fw-bold" style={{ fontSize: '1rem', letterSpacing: '6px' }} value={adminCode} onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ''))} />
                        <div className="form-text text-muted" style={{ fontSize: '0.62rem' }}>Enter the 6-digit code from your authenticator app (Temp: 123456)</div>
                      </div>
                      <button type="submit" className="btn btn-danger w-100 py-2 rounded-pill shadow-sm fw-bold border-0 text-white">
                        {loading ? 'Verifying...' : 'Access Admin Panel'}
                      </button>
                      <GoogleButton />
                    </form>
                  )}

                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Google Account Selector Popup */}
      {showGooglePopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-4 rounded-4 shadow-lg border-0" style={{ width: '380px', background: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <GoogleSvg />
                <strong className="text-secondary" style={{ fontSize: '0.82rem' }}>Sign in with Google</strong>
              </div>
              <button onClick={() => setShowGooglePopup(false)} className="btn btn-close btn-sm"></button>
            </div>
            <p className="text-muted small mb-3">Choose a Google account to continue:</p>
            {[
              { name: 'Ramprasad Sharma', email: 'ramprasad.sharma@gmail.com' },
              { name: 'Priya Singh', email: 'priya.singh@gmail.com' },
            ].map((acc, idx) => (
              <div key={idx} onClick={() => handleGoogleSignIn(acc)} className="d-flex align-items-center gap-3 p-3 rounded-3 border mb-2" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0fdf4'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #4285F4, #34A853)', fontSize: '0.9rem' }}>{acc.name[0]}</div>
                <div>
                  <strong className="d-block text-secondary" style={{ fontSize: '0.78rem' }}>{acc.name}</strong>
                  <span className="text-muted" style={{ fontSize: '0.66rem' }}>{acc.email}</span>
                </div>
              </div>
            ))}
            <p className="text-muted text-center mt-2" style={{ fontSize: '0.6rem' }}>Google login always opens Citizen Portal</p>
          </div>
        </div>
      )}
    </section>
  );
}
