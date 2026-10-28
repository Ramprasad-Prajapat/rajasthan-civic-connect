import React, { useState, useRef, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuickAccess from './components/QuickAccess';
import CivicProblems from './components/CivicProblems';
import Features from './components/Features';
import Categories from './components/Categories';
import RolePortals from './components/RolePortals';
import TrustTransparency from './components/TrustTransparency';
import Footer from './components/Footer';
import { SkeletonPage } from './components/SkeletonLoaders';
import './App.css';

// Lazy-loaded components
const CivicWorkflow = lazy(() => import('./components/CivicWorkflow'));
const DashboardPreview = lazy(() => import('./components/DashboardPreview'));
const ProfilePreview = lazy(() => import('./components/ProfilePreview'));
const MyComplaints = lazy(() => import('./components/MyComplaints'));
const ComplaintCenter = lazy(() => import('./components/ComplaintCenter'));
const LoginRegister = lazy(() => import('./components/LoginRegister'));

function App() {
  const [activePage, setActivePage] = useState(() => {
    return sessionStorage.getItem('rajcivic_active_page') || 'Home';
  });

  React.useEffect(() => {
    sessionStorage.setItem('rajcivic_active_page', activePage);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePage]);

  // Auth view mode for Login/Register component ('login' | 'register')
  const [authViewMode, setAuthViewMode] = useState('login');

  // User authentication state initialized from persistent localStorage
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rajcivic_user');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (saved && token) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return null;
  });

  const returnToRef = useRef(null);

  // Synchronize authenticatedUser state with local storage on startup
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('rajcivic_user');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (saved && token && !authenticatedUser) {
        setAuthenticatedUser(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
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
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
    }
  };

  const handleSignOut = () => {
    handleSetAuthenticatedUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rajcivic_user');
    sessionStorage.removeItem('rajcivic_active_page');
    setActivePage('Home');
  };

  // Sync user profile with backend
  React.useEffect(() => {
    if (authenticatedUser && (authenticatedUser.id || authenticatedUser.uid || authenticatedUser.email)) {
      import('./apiService').then(({ getMyProfile }) => {
        getMyProfile().then(profile => {
          if (profile) {
            const merged = { ...authenticatedUser, ...profile };
            if (JSON.stringify(merged) !== JSON.stringify(authenticatedUser)) {
              setAuthenticatedUser(merged);
              localStorage.setItem('rajcivic_user', JSON.stringify(merged));
            }
          }
        }).catch(() => {});
      });
    }
  }, [authenticatedUser?.email]);

  // Route protection
  React.useEffect(() => {
    if (!authenticatedUser) {
      const protectedPages = ['Dashboards', 'Profile', 'Complaints', 'Notifications'];
      if (protectedPages.includes(activePage)) {
        returnToRef.current = activePage;
        setActivePage('Login/Register');
      }
    }
  }, [activePage, authenticatedUser]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Sticky Main Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        authenticatedUser={authenticatedUser}
        handleSignOut={handleSignOut}
        setAuthViewMode={setAuthViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Suspense fallback={<SkeletonPage />}>
          {activePage === 'Home' && (
            <div className="animate-fade-in">
              <Hero setActivePage={setActivePage} />
              <QuickAccess setActivePage={setActivePage} />
              <CivicProblems />
              <Features />
              <Categories setActivePage={setActivePage} />
              <RolePortals setActivePage={setActivePage} />
              <TrustTransparency />
            </div>
          )}

          {activePage === 'Complaint' && (
            <div className="animate-fade-in" style={{ paddingTop: '100px' }}>
              <ComplaintCenter setActivePage={setActivePage} authenticatedUser={authenticatedUser} />
              <CivicWorkflow showOnlySlaAndEscalation={false} />
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
                    LIVE STATUS ALERTS
                  </span>
                  <h3 className="fw-bold text-secondary mb-3">My Notifications</h3>
                  <div className="d-flex flex-column gap-3">
                    {[
                      { id: 1, title: 'Complaint RJCIVIC Registered', desc: 'Your grievance has been successfully submitted and routed to the assigned department.', date: 'Today', type: 'info', icon: 'bi-info-circle-fill' },
                      { id: 2, title: 'Status Update', desc: 'Department officer updated the grievance status.', date: 'Yesterday', type: 'success', icon: 'bi-check-circle-fill' }
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

      {/* GovTech Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default App;
