import React from 'react';

export default function CivicWorkflow({ showOnlyLifecycle, showOnlySlaAndEscalation }) {
  const lifecycleSteps = [
    { label: 'Citizen Complaint', desc: 'Selects category, logs location and uploads proof.', icon: 'bi-megaphone' },
    { label: 'Department Auto Routing', desc: 'System parses district and category to assign department.', icon: 'bi-router' },
    { label: 'Officer Review', desc: 'Department officer reviews details and priority.', icon: 'bi-shield-check' },
    { label: 'On-site Resolution', desc: 'Ground verification and remedial actions executed.', icon: 'bi-tools' },
    { label: 'Officer Verification', desc: 'Site proofs and completion verified by officer.', icon: 'bi-clipboard-check' },
    { label: 'Citizen Feedback', desc: 'Citizen rates work or provides feedback on resolution.', icon: 'bi-chat-heart-fill' }
  ];

  const slaCards = [
    { title: 'Sewer Overflow', priority: 'High Priority', time: '6 Hours SLA', bg: 'border-danger bg-danger-soft text-danger', icon: 'bi-exclamation-triangle-fill' },
    { title: 'Dead Animal Pickup', priority: 'High Priority', time: '6 Hours SLA', bg: 'border-danger bg-danger-soft text-danger', icon: 'bi-shield-fill-exclamation' },
    { title: 'Water Leakage', priority: 'High Priority', time: '12 Hours SLA', bg: 'border-warning bg-accent-soft text-warning', icon: 'bi-droplet-fill' },
    { title: 'Garbage Complaint', priority: 'Medium Priority', time: '24 Hours SLA', bg: 'border-primary bg-primary-soft text-success', icon: 'bi-trash-fill' },
    { title: 'Street Light', priority: 'Medium Priority', time: '48 Hours SLA', bg: 'border-primary bg-primary-soft text-success', icon: 'bi-lightbulb-fill' },
    { title: 'Road / Pothole', priority: 'Medium Priority', time: '72 Hours SLA', bg: 'border-primary bg-secondary-soft text-primary', icon: 'bi-hammer' }
  ];

  return (
    <section className={`bg-white position-relative ${showOnlyLifecycle ? 'py-3' : 'py-5'}`} id="civic-workflow">
      <div className={`container ${showOnlyLifecycle ? 'py-2' : 'py-4'}`}>
        
        {/* Tier 1: Complaint Lifecycle Flow */}
        {!showOnlySlaAndEscalation && (
          <div className="mb-5">
            <div className="text-center mb-5">
              <span className="badge bg-primary-soft text-success rc-badge mb-2">Governance Workflow</span>
              <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Complaint Lifecycle</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                RajCivic Connect applies a transparent, structured workflow to ensure accountability from filing to resolution.
              </p>
            </div>

            <div className="row g-4 align-items-stretch position-relative">
              {lifecycleSteps.map((step, idx) => (
                <div className="col-md-6 col-lg" key={idx}>
                  <div className="card rc-card border-0 p-3 shadow-sm text-center h-100 d-flex flex-column justify-content-between position-relative">
                    <div>
                      <div className="rc-icon-container bg-light text-secondary mx-auto mb-2 border shadow-sm" style={{ width: '40px', height: '40px', fontSize: '1rem', borderRadius: '10px' }}>
                        <i className={`bi ${step.icon}`}></i>
                      </div>
                      <span className="fw-bold text-secondary d-block small mb-1">{step.label}</span>
                      <p className="text-muted small mb-0" style={{ fontSize: '0.65rem', lineHeight: '1.4' }}>
                        {step.desc}
                      </p>
                    </div>
                    {idx < lifecycleSteps.length - 1 && (
                      <div className="d-none d-lg-block position-absolute" style={{ top: '35px', right: '-15px', zIndex: 10 }}>
                        <i className="bi bi-chevron-right text-success fs-5"></i>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showOnlyLifecycle && !showOnlySlaAndEscalation && (
          <hr className="my-5 opacity-10" />
        )}

        {/* Tier 2: SLA & Priority System */}
        {!showOnlyLifecycle && (
          <div>
            <div className="text-center mb-4">
              <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Service Deadlines</span>
              <h3 className="fw-bold text-secondary">SLA & Priority Targets</h3>
              <p className="text-muted small mx-auto" style={{ maxWidth: '600px' }}>
                Every complaint category has a defined resolution timeline to ensure prompt citizen service.
              </p>
            </div>

            <div className="row g-3 text-start">
              {slaCards.map((sla, idx) => (
                <div className="col-sm-6 col-lg-4" key={idx}>
                  <div className={`card p-3 border-start border-4 rounded-3 shadow-sm h-100 hover-lift ${sla.bg}`}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className={`bi ${sla.icon} fs-5`}></i>
                      <strong className="small text-secondary">{sla.title}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-auto" style={{ fontSize: '0.7rem' }}>
                      <span className="fw-semibold uppercase">{sla.priority}</span>
                      <span className="fw-bold text-dark">{sla.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
