import React from 'react';

export default function QuickAccess({ setActivePage }) {
  const actions = [
    { title: 'Report New Complaint', desc: 'Select a municipal category and lodge a geo-tagged issue with photos.', target: 'Complaint', icon: 'bi-megaphone-fill', color: 'text-success', borderClass: 'hover-success' },
    { title: 'Track Existing Complaint', desc: 'Check the real-time status of your complaint using its unique ID.', target: 'Track Complaint', icon: 'bi-compass-fill', color: 'text-primary', borderClass: 'hover-primary' },
    { title: 'Login ', desc: 'Review active cases, approve resolved tasks and monitor metrics.', target: 'Login/Register', icon: 'bi-shield-lock-fill', color: 'text-danger', borderClass: 'hover-danger' }
  ];

  return (
    <section className="py-5 bg-white" id="quick-access">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary-soft text-success rc-badge mb-2">Instant Action</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Quick Access Hub</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Aapki targeted needs ke anusar portal gateway ya tools ko directly select karein.
          </p>
        </div>

        {/* Action cards grid */}
        <div className="row g-4">
          {actions.map((act, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div
                className="card rc-card border-0 p-4 shadow-sm text-start cursor-pointer h-100 d-flex flex-column justify-content-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setActivePage(act.target)}
              >
                <div>
                  <div className={`rc-icon-container bg-light ${act.color} mb-3`}>
                    <i className={`bi ${act.icon}`}></i>
                  </div>
                  <h5 className="fw-bold text-secondary mb-2">{act.title}</h5>
                  <p className="text-muted small mb-4" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                    {act.desc}
                  </p>
                </div>

                <span className="text-success fw-bold small d-flex align-items-center gap-1">
                  Access Portal <i className="bi bi-arrow-right-short fs-5"></i>
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
