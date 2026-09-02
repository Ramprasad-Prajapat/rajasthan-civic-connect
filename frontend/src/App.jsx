import React, { useState, useRef, Suspense, lazy } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuickAccess from './components/QuickAccess';
import CivicProblems from './components/CivicProblems';
import Features from './components/Features';
import Categories from './components/Categories';
import TrackingPreview from './components/TrackingPreview';
import HowItWorks from './components/HowItWorks';
import RolePortals from './components/RolePortals';
import TrustTransparency from './components/TrustTransparency';
import Footer from './components/Footer';
import { SkeletonPage } from './components/SkeletonLoaders';
import './App.css';

// Phase 2 Optimization: Dynamic Code-Splitting via React.lazy
const CivicWorkflow = lazy(() => import('./components/CivicWorkflow'));
const RajasthanStructure = lazy(() => import('./components/RajasthanStructure'));
const DashboardPreview = lazy(() => import('./components/DashboardPreview'));
const ProfilePreview = lazy(() => import('./components/ProfilePreview'));
const MyComplaints = lazy(() => import('./components/MyComplaints'));
const ComplaintCenter = lazy(() => import('./components/ComplaintCenter'));
const Helpdesk = lazy(() => import('./components/Helpdesk'));
const ReportsCenter = lazy(() => import('./components/ReportsCenter'));
const EmergencyHelp = lazy(() => import('./components/EmergencyHelp'));
const LoginRegister = lazy(() => import('./components/LoginRegister'));
const CivicChatbot = lazy(() => import('./components/CivicChatbot'));

function App() {
  const [activePage, setActivePage] = useState(() => {
    return sessionStorage.getItem('rajcivic_active_page') || 'Home';
  });

  React.useEffect(() => {
    sessionStorage.setItem('rajcivic_active_page', activePage);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePage]);
  const [selectedReportTab, setSelectedReportTab] = useState('complaint_summary');

  // Auth view mode for Login/Register component ('login' | 'register')
  const [authViewMode, setAuthViewMode] = useState('login');

  // Lifted user authentication state MUST be initialized to null (NOT from localStorage)
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const returnToRef = useRef(null);

  // Synchronize authenticatedUser state with Firebase Authentication as source of truth
  React.useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userUid = firebaseUser.uid || firebaseUser.email.replace(/[.#$[\]]/g, '_');
        try {
          const { getUserProfile } = await import('./firestoreService');
          const profile = await getUserProfile(userUid);
          const mergedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile?.fullName || firebaseUser.displayName || 'Citizen User',
            displayName: firebaseUser.displayName || profile?.fullName || 'Citizen User',
            photoURL: firebaseUser.photoURL || profile?.photoURL || null,
            portal: profile?.portal || 'citizen',
            role: profile?.role || 'Citizen',
            rtdbNode: `/${profile?.portal || 'citizen'}s/${firebaseUser.email.replace(/[.#$[\]]/g, '_')}`,
            ...profile
          };
          setAuthenticatedUser(mergedUser);
          localStorage.setItem('rajcivic_user', JSON.stringify(mergedUser));
        } catch (err) {
          const fallbackUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Citizen User',
            displayName: firebaseUser.displayName || 'Citizen User',
            photoURL: firebaseUser.photoURL || null,
            portal: 'citizen',
            role: 'Citizen',
            rtdbNode: `/citizens/${firebaseUser.email.replace(/[.#$[\]]/g, '_')}`
          };
          setAuthenticatedUser(fallbackUser);
          localStorage.setItem('rajcivic_user', JSON.stringify(fallbackUser));
        }
      } else {
        setAuthenticatedUser(null);
        localStorage.removeItem('rajcivic_user');
        localStorage.removeItem('firebaseIdToken');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetAuthenticatedUser = (user) => {
    setAuthenticatedUser(user);
    if (user) {
      localStorage.setItem('rajcivic_user', JSON.stringify(user));
      if (returnToRef.current) {
        const dest = returnToRef.current;
        returnToRef.current = null;
        setTimeout(() => setActivePage(dest), 100);
      }
    } else {
      localStorage.removeItem('rajcivic_user');
      localStorage.removeItem('firebaseIdToken');
    }
  };

  const handleSignOut = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Sign out error:", err);
    }
    handleSetAuthenticatedUser(null);
    setActivePage('Home');
  };

  // Sync user profile state with Firestore if logged in
  React.useEffect(() => {
    import('./firestoreService').then(({ seedFirestoreOnStartup }) => {
      seedFirestoreOnStartup();
    }).catch(err => console.error("Firestore auto-seeding check failed:", err));
  }, []);

  React.useEffect(() => {
    if (authenticatedUser && (authenticatedUser.uid || authenticatedUser.email)) {
      const userUid = authenticatedUser.uid || authenticatedUser.email.replace(/[.#$[\]]/g, '_');
      import('./firestoreService').then(({ getUserProfile }) => {
        getUserProfile(userUid).then(profile => {
          if (profile) {
            const merged = { ...authenticatedUser, ...profile };
            if (JSON.stringify(merged) !== JSON.stringify(authenticatedUser)) {
              setAuthenticatedUser(merged);
              localStorage.setItem('rajcivic_user', JSON.stringify(merged));
            }
          }
        });
      });
    }
  }, [authenticatedUser?.uid, authenticatedUser?.email]);

  // Enforce route protection: if guest tries to access private pages, redirect to Login/Register
  React.useEffect(() => {
    if (!authenticatedUser) {
      const protectedPages = ['Dashboards', 'Profile', 'Complaints', 'Notifications', 'Settings', 'Users'];
      if (protectedPages.includes(activePage)) {
        returnToRef.current = activePage;
        setActivePage('Login/Register');
      }
    }
  }, [activePage, authenticatedUser]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* 1. Sticky Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        setSelectedReportTab={setSelectedReportTab}
        authenticatedUser={authenticatedUser}
        handleSignOut={handleSignOut}
        setAuthViewMode={setAuthViewMode}
      />

      {/* Main Content Area with Suspense Code Splitting */}
      <main className="flex-grow-1">
        <Suspense fallback={<SkeletonPage />}>
          {activePage === 'Home' && (
            <div className="animate-fade-in">
              <Hero setActivePage={setActivePage} />
              <QuickAccess setActivePage={setActivePage} />
              <CivicProblems />
              <Features />
              <Categories setActivePage={setActivePage} />
              <RajasthanStructure />
              <TrustTransparency />
            </div>
          )}

          {activePage === 'Complaint' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <HowItWorks />
              <ComplaintCenter setActivePage={setActivePage} authenticatedUser={authenticatedUser} />
              <CivicWorkflow showOnlySlaAndEscalation={true} />
            </div>
          )}

          {activePage === 'Track Complaint' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <ComplaintCenter setActivePage={setActivePage} showOnlyTrack={true} authenticatedUser={authenticatedUser} />
              <CivicWorkflow showOnlyLifecycle={true} />
            </div>
          )}

          {activePage === 'Dashboards' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <DashboardPreview
                authenticatedUser={authenticatedUser}
                setAuthenticatedUser={handleSetAuthenticatedUser}
                setActivePage={setActivePage}
                handleSignOut={handleSignOut}
              />
            </div>
          )}

          {activePage === 'Profile' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <ProfilePreview
                authenticatedUser={authenticatedUser}
                setAuthenticatedUser={handleSetAuthenticatedUser}
                setActivePage={setActivePage}
              />
            </div>
          )}

          {activePage === 'Complaints' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <MyComplaints
                authenticatedUser={authenticatedUser}
                setActivePage={setActivePage}
              />
            </div>
          )}

          {activePage === 'Notifications' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <div className="container py-5">
                <div className="card border-0 rounded-4 shadow-sm p-4 text-start bg-white" style={{ minHeight: '300px' }}>
                  <span className="badge bg-primary-soft text-primary rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                    🔔 LIVE STATUS ALERTS
                  </span>
                  <h3 className="fw-extrabold text-secondary mb-3">My Notifications</h3>
                  <div className="d-flex flex-column gap-3">
                    {[
                      { id: 1, title: 'Complaint RJCIVIC-JOD-9921 Assigned to Rajesh Kumar', desc: 'Your grievance regarding sewer overflow near Gandhi Park Shastri Nagar has been approved and assigned to a field worker.', date: 'Today, 11:15 AM', type: 'info', icon: 'bi-info-circle-fill' },
                      { id: 2, title: 'Complaint RJCIVIC-JOD-9812 Marked Resolved!', desc: 'Pipeline leakage in Sardarpura Sector block D has been fully resolved. Click "Rate Work" in Complaints page to confirm.', date: 'Yesterday, 01:45 PM', type: 'success', icon: 'bi-check-circle-fill' }
                    ].map(n => (
                      <div key={n.id} className="p-3 border rounded-3 bg-light d-flex align-items-start gap-3">
                        <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${n.type === 'success' ? 'bg-success text-white' : 'bg-primary text-white'}`} style={{ width: '32px', height: '32px' }}>
                          <i className={`bi ${n.icon}`}></i>
                        </div>
                        <div>
                          <strong className="text-secondary d-block small" style={{ fontSize: '0.8rem' }}>{n.title}</strong>
                          <span className="text-muted d-block small mt-0.5" style={{ fontSize: '0.74rem' }}>{n.desc}</span>
                          <span className="text-muted d-block font-monospace text-xxs mt-1" style={{ fontSize: '0.62rem' }}>{n.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Settings' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <div className="container py-5">
                <div className="card border-0 rounded-4 shadow-sm p-4 text-start bg-white" style={{ minHeight: '300px' }}>
                  <span className="badge bg-danger-soft text-danger rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                    ⚙️ PLATFORM UTILITIES
                  </span>
                  <h3 className="fw-extrabold text-secondary mb-3">System Settings</h3>
                  <p className="text-muted small">Admin level governance policies, cache flush utilities, SLA response weights and citizen verification thresholds are configured here.</p>
                  <div className="p-3 border rounded-3 bg-light mb-3">
                    <strong className="text-secondary d-block small mb-1">Mute Automatic Escalations</strong>
                    <span className="text-muted d-block small mb-2" style={{ fontSize: '0.72rem' }}>Temporarily pauses the 12-hour automated Level 4 commissioner notification queue.</span>
                    <div className="form-check form-switch">
                      <input type="checkbox" className="form-check-input" id="escalationSwitch" />
                      <label className="form-check-label small text-secondary" htmlFor="escalationSwitch">Pause Escalation Queue</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Users' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <div className="container py-5">
                <div className="card border-0 rounded-4 shadow-sm p-4 text-start bg-white" style={{ minHeight: '300px' }}>
                  <span className="badge bg-primary-soft text-primary rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ width: 'fit-content', fontSize: '0.7rem' }}>
                    👥 IDENTITY CONTROLLER
                  </span>
                  <h3 className="fw-extrabold text-secondary mb-3">User & Officer Directory</h3>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle border border-light rounded-3 overflow-hidden">
                      <thead className="table-light">
                        <tr>
                          <th className="small fw-bold text-secondary" style={{ fontSize: '0.72rem' }}>Name</th>
                          <th className="small fw-bold text-secondary" style={{ fontSize: '0.72rem' }}>Email</th>
                          <th className="small fw-bold text-secondary" style={{ fontSize: '0.72rem' }}>Designation / Role</th>
                          <th className="small fw-bold text-secondary text-end" style={{ fontSize: '0.72rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Smt. Ananya Sen', email: 'officer@rajcivic.com', role: 'Nodal Officer', status: 'Active' },
                          { name: 'Shri Mohan Lal', email: 'worker@rajcivic.com', role: 'Field Force Duty', status: 'Active' }
                        ].map((u, i) => (
                          <tr key={i}>
                            <td className="small fw-bold text-secondary" style={{ fontSize: '0.74rem' }}>{u.name}</td>
                            <td className="small text-muted" style={{ fontSize: '0.74rem' }}>{u.email}</td>
                            <td className="small text-secondary" style={{ fontSize: '0.74rem' }}>{u.role}</td>
                            <td className="text-end"><span className="badge bg-success-soft text-success rounded-pill px-2.5 py-1" style={{ fontSize: '0.6rem' }}>{u.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'Helpdesk' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <Helpdesk setActivePage={setActivePage} />
            </div>
          )}

          {activePage === 'Emergency' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <EmergencyHelp />
            </div>
          )}

          {activePage === 'Reports' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <ReportsCenter selectedReportTab={selectedReportTab} setSelectedReportTab={setSelectedReportTab} />
            </div>
          )}

          {activePage === 'Login/Register' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <LoginRegister
                authenticatedUser={authenticatedUser}
                setAuthenticatedUser={handleSetAuthenticatedUser}
                setActivePage={setActivePage}
                authViewMode={authViewMode}
                setAuthViewMode={setAuthViewMode}
                handleSignOut={handleSignOut}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* Multi-column GovTech Footer */}
      <Footer setActivePage={setActivePage} />

      {/* Floating AI Civic Chatbot */}
      <Suspense fallback={null}>
        <CivicChatbot setActivePage={setActivePage} />
      </Suspense>
    </div>
  );
}

export default App;
