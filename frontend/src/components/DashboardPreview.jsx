import React from 'react';
import DepartmentDashboard from './DepartmentDashboard';
import AdminDashboard from './AdminDashboard';
import MyComplaints from './MyComplaints';

export default function DashboardPreview({ authenticatedUser, handleSignOut, setActivePage }) {
  if (!authenticatedUser) {
    return (
      <div className="container py-5 text-center">
        <p className="text-muted">Please log in to access your dashboard.</p>
        <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => setActivePage('Login/Register')}>
          Log In
        </button>
      </div>
    );
  }

  const role = (authenticatedUser.role || '').toLowerCase();
  const portal = (authenticatedUser.portal || '').toLowerCase();

  if (portal === 'admin' || role.includes('admin')) {
    return <AdminDashboard authenticatedUser={authenticatedUser} handleSignOut={handleSignOut} />;
  }

  if (portal === 'department' || role.includes('officer')) {
    return <DepartmentDashboard authenticatedUser={authenticatedUser} handleSignOut={handleSignOut} />;
  }

  return <MyComplaints authenticatedUser={authenticatedUser} setActivePage={setActivePage} />;
}
