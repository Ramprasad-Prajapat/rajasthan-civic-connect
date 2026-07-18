import React from 'react';

export default function RolePortals() {
  const portals = [
    {
      title: 'Citizen Portal',
      actions: ['Report municipal issues online', 'Track real-time status with custom ID', 'Give rating feedback and satisfaction checks', 'Reopen complaints if resolution is poor'],
      icon: 'bi-people-fill',
      colorClass: 'text-success bg-primary-soft',
      btnText: 'Enter Citizen Desk'
    },
    {
      title: 'Worker Portal',
      actions: ['View live assigned tasks and maps', 'Upload physical before/after site proof', 'Submit geo-tagged repair status logs', 'Send automatic SMS completion triggers'],
      icon: 'bi-tools',
      colorClass: 'text-info bg-secondary-soft',
      btnText: 'Enter Worker Desk'
    },
    {
      title: 'Officer Portal',
      actions: ['Review and assign field workers', 'Inspect physical before/after site proofs', 'Monitor category SLA clocks and triggers', 'Approve resolutions and manage alerts'],
      icon: 'bi-shield-check',
      colorClass: 'text-warning bg-accent-soft',
      btnText: 'Enter Officer Desk'
    },
    {
      title: 'Admin Portal',
      actions: ['Add/configure municipal local bodies', 'View unified district/state performance logs', 'Monitor overall civic service indexes', 'Regulate escalation thresholds and audits'],
      icon: 'bi-shield-lock-fill',
      colorClass: 'text-danger bg-danger-soft',
      btnText: 'Enter Admin Dashboard'
    }
  ];

  return (
    <section className="py-5 bg-light position-relative" id="role-portals">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Role Gateway</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Choose Your Portal</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Enter your targeted role-based workspace to file cases, manage crew lists, or inspect regional SLA rates.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="row g-4">
          {portals.map((pt, idx) => (
            <div className="col-md-6 col-lg-3" key={idx}>
              <div className="card rc-card border-0 p-4 shadow-sm h-100 d-flex flex-column justify-content-between text-start">
                <div>
                  <div className={`rc-icon-container ${pt.colorClass} mb-3`} style={{ width: '44px', height: '44px', borderRadius: '10px', fontSize: '1.25rem' }}>
                    <i className={`bi ${pt.icon}`}></i>
                  </div>
                  <h5 className="fw-bold text-secondary mb-3">{pt.title}</h5>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                    {pt.actions.map((act, actIdx) => (
                      <li className="d-flex align-items-start gap-2 text-muted small" style={{ fontSize: '0.72rem', lineHeight: '1.4' }} key={actIdx}>
                        <i className="bi bi-patch-check-fill text-success mt-0.5" style={{ fontSize: '0.8rem' }}></i>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button className="btn rc-btn-outline w-100 py-2 small" style={{ fontSize: '0.75rem' }}>
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
