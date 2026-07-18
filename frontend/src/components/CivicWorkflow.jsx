import React from 'react';

export default function CivicWorkflow({ showOnlyLifecycle, showOnlySlaAndEscalation }) {
  const lifecycleSteps = [
    { label: 'Citizen Complaint', desc: 'Selects category, logs location and uploads proof.', icon: 'bi-megaphone' },
    { label: 'ULB & Ward Auto Routing', desc: 'System parses district, ULB and ward coordinates.', icon: 'bi-router' },
    { label: 'Officer Review', desc: 'Nodal head verifies details and category limits.', icon: 'bi-shield-check' },
    { label: 'Worker Assignment', desc: 'Field team allocated dynamically via SMS alert.', icon: 'bi-person-badge' },
    { label: 'Field Work & Proof', desc: 'Completion photos uploaded directly from ground.', icon: 'bi-camera-fill' },
    { label: 'Officer Verification', desc: 'Before/after proofs inspected for task approval.', icon: 'bi-clipboard-check' },
    { label: 'Feedback / Reopen', desc: 'Citizen rates work or reopens case if unsatisfying.', icon: 'bi-arrow-counterclockwise' }
  ];

  const slaCards = [
    { title: 'Sewer Overflow', priority: 'High Priority', time: '6 Hours SLA', bg: 'border-danger bg-danger-soft text-danger', icon: 'bi-exclamation-triangle-fill' },
    { title: 'Dead Animal Pickup', priority: 'High Priority', time: '6 Hours SLA', bg: 'border-danger bg-danger-soft text-danger', icon: 'bi-shield-fill-exclamation' },
    { title: 'Water Leakage', priority: 'High Priority', time: '12 Hours SLA', bg: 'border-warning bg-accent-soft text-warning', icon: 'bi-droplet-fill' },
    { title: 'Garbage Complaint', priority: 'Medium Priority', time: '24 Hours SLA', bg: 'border-primary bg-primary-soft text-success', icon: 'bi-trash-fill' },
    { title: 'Street Light', priority: 'Medium Priority', time: '48 Hours SLA', bg: 'border-primary bg-primary-soft text-success', icon: 'bi-lightbulb-fill' },
    { title: 'Road / Pothole', priority: 'Medium Priority', time: '72 Hours SLA', bg: 'border-primary bg-secondary-soft text-primary', icon: 'bi-hammer' }
  ];

  const escalationTiers = [
    { rank: 'Tier 1', title: 'Ward Officer', authority: 'Ward Inspector', action: 'Initial Worker Allocation' },
    { rank: 'Tier 2', title: 'Department Officer', authority: 'Nodal Engineer', action: 'Escalated if SLA >50% expired' },
    { rank: 'Tier 3', title: 'ULB Admin', authority: 'Municipal Commissioner', action: 'Escalated if SLA >100% expired' },
    { rank: 'Tier 4', title: 'District Admin', authority: 'District Collector Desk', action: 'System Audits and Delays Flags' },
    { rank: 'Tier 5', title: 'State Admin', authority: 'Urban Development Ministry', action: 'State Performance Grading' }
  ];

  return (
    <section className={`bg-white position-relative ${showOnlyLifecycle ? 'py-3' : 'py-5'}`} id="civic-workflow">
      <div className={`container ${showOnlyLifecycle ? 'py-2' : 'py-4'}`}>
        
        {/* Tier 1: Complaint Lifecycle Flow */}
        {!showOnlySlaAndEscalation && (
          <div className="mb-5">
          <div className="text-center mb-5">
            <span className="badge bg-primary-soft text-success rc-badge mb-2">Business Logic</span>
            <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Complaint Lifecycle</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              RajCivic Connect applies a strict, automated governance flow to lock in citizen-to-officer responsibility.
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

        {/* Tier 2: SLA & Priority System & Automatic Escalation */}
        {!showOnlyLifecycle && (
          <div className="row g-5">
          {/* SLA Section */}
          <div className="col-lg-6">
            <div className="text-start mb-4">
              <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Service Deadlines</span>
              <h3 className="fw-bold text-secondary">SLA & Priority System</h3>
              <p className="text-muted small">
                Every complaint category has a hard-coded resolution deadline. Delayed files automatically trigger administrative escalations.
              </p>
            </div>

            <div className="row g-3 text-start">
              {slaCards.map((sla, idx) => (
                <div className="col-sm-6" key={idx}>
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

          {/* Escalation Workflow */}
          <div className="col-lg-6">
            <div className="text-start mb-4">
              <span className="badge bg-danger-soft text-danger rc-badge mb-2">Auto Escalations</span>
              <h3 className="fw-bold text-secondary">Automatic Escalation Workflow</h3>
              <p className="text-muted small">
                If a complaint is delayed, unresolved or reopened by the citizen, it automatically escalates up the bureaucratic levels.
              </p>
            </div>

            <div className="d-flex flex-column gap-3 text-start">
              {escalationTiers.map((tier, idx) => (
                <div 
                  className="card p-2.5 border-0 shadow-sm d-flex flex-row align-items-center justify-content-between gap-3 bg-light hover-lift"
                  key={idx}
                  style={{ borderLeft: idx === 0 ? '4px solid #10b981' : idx === 4 ? '4px solid #ef4444' : 'none' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary-soft text-primary rc-badge py-1 small">{tier.rank}</span>
                    <div>
                      <strong className="text-secondary small d-block">{tier.title}</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.65rem' }}>{tier.authority}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-success small fw-semibold d-block" style={{ fontSize: '0.7rem' }}>{tier.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </section>
  );
}
