import React from 'react';

export default function RolePortals({ setActivePage }) {
  const portals = [
    {
      title: 'Citizen Portal',
      actions: ['Report municipal issues online', 'Track real-time status with ticket code', 'Give rating feedback on resolved grievances', 'Upload photos and save drafts'],
      icon: 'bi-people-fill',
      colorClass: 'text-success bg-primary-soft',
      btnText: 'Enter Citizen Desk',
      target: 'Complaint'
    },
    {
      title: 'Officer Portal',
      actions: ['Department-scoped dashboard', 'View and filter own department complaints', 'Review photos and details', 'Update status with official remarks'],
      icon: 'bi-shield-check',
      colorClass: 'text-warning bg-accent-soft',
      btnText: 'Enter Officer Desk',
      target: 'Login/Register'
    },
    {
      title: 'Admin Portal',
      actions: ['Unified municipal dashboard metrics', 'Manage departments and active statuses', 'Create and manage department officers', 'Reassign grievance departments'],
      icon: 'bi-shield-lock-fill',
      colorClass: 'text-danger bg-danger-soft',
      btnText: 'Enter Admin Dashboard',
      target: 'Login/Register'
    }
  ];

  return (
    <section className="py-5 bg-light position-relative" id="role-portals">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Role Gateway</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Role-Based Access</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Choose your role to access dedicated tools and dashboards for civic management.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="row g-4 justify-content-center">
          {portals.map((pt, idx) => (
            <div className="col-md-6 col-lg-4" key={idx}>
              <div className="card rc-card border-0 p-4 shadow-sm h-100 d-flex flex-column justify-content-between text-start">
                <div>
                  <div className={`rc-icon-container ${pt.colorClass} mb-3`} style={{ width: '44px', height: '44px', borderRadius: '10px', fontSize: '1.25rem' }}>
                    <i className={`bi ${pt.icon}`}></i>
                  </div>
                  <h5 className="fw-bold text-secondary mb-3">{pt.title}</h5>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                    {pt.actions.map((act, actIdx) => (
                      <li className="d-flex align-items-start gap-2 text-muted small" style={{ fontSize: '0.75rem', lineHeight: '1.4' }} key={actIdx}>
                        <i className="bi bi-patch-check-fill text-success mt-0.5" style={{ fontSize: '0.8rem' }}></i>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button
                  className="btn rc-btn-outline w-100 py-2 small"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setActivePage && setActivePage(pt.target)}
                >
                  {pt.btnText} <i className="bi bi-box-arrow-in-right ms-1"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
