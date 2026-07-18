import React from 'react';

export default function CivicProblems() {
  const problems = [
    { title: 'Complaint tracking missing', desc: 'No unique IDs assigned; citizens never know where their file is stuck.', icon: 'bi-eye-slash-fill' },
    { title: 'Manual complaint delay', desc: 'Snail-paced manual paperwork routes between offices with zero accountability.', icon: 'bi-clock-fill' },
    { title: 'No worker proof verification', desc: 'Issues are closed on paper without physical site resolution confirmation.', icon: 'bi-image-alt' },
    { title: 'Ward-wise data not available', desc: 'No spatial data exists to trace which ward or local body underperforms.', icon: 'bi-globe-central-south-asia' },
    { title: 'Citizen feedback missing', desc: 'Municipalities resolve complaints unilaterally without citizen satisfaction checks.', icon: 'bi-chat-left-heart' },
    { title: 'Duplicate complaints', desc: 'Hundreds of identical complaints for a single pothole congest active work logs.', icon: 'bi-files' },
    { title: 'SLA delay issue', desc: 'No deadlines exist, leading to complaints remaining unattended for months.', icon: 'bi-hourglass-bottom' },
    { title: 'Poor transparency', desc: 'No open public analytics or audits exist to track civic resolution rate.', icon: 'bi-shield-slash' }
  ];

  return (
    <section className="py-5 bg-light position-relative" id="civic-problems">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-danger-soft text-danger rc-badge mb-2">Municipal Bottlenecks</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Civic Problems We Solve</h2>
          <p className="text-muted mx-auto fs-6" style={{ maxWidth: '750px', lineHeight: '1.7' }}>
            Many civic complaints are delayed or not tracked properly because of manual systems, unclear responsibility, missing proof and lack of real-time monitoring. RajCivic Connect solves this through digital complaint registration, automatic routing, worker assignment, proof verification and escalation.
          </p>
        </div>

        {/* Problems Grid */}
        <div className="row g-4">
          {problems.map((prob, idx) => (
            <div className="col-sm-6 col-lg-3" key={idx}>
              <div className="card rc-card border border-danger border-opacity-10 p-4 shadow-sm h-100 d-flex flex-column justify-content-between text-start" style={{ background: 'linear-gradient(180deg, #ffffff 0%, rgba(254, 242, 242, 0.4) 100%)' }}>
                <div>
                  <div className="rc-icon-container bg-danger-soft text-danger mb-3 border border-danger border-opacity-20" style={{ width: '44px', height: '44px', borderRadius: '10px', fontSize: '1.2rem' }}>
                    <i className={`bi ${prob.icon}`}></i>
                  </div>
                  <h6 className="fw-bold text-secondary mb-2">{prob.title}</h6>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
                    {prob.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-top border-danger border-opacity-10 d-flex align-items-center justify-content-between text-danger small" style={{ fontSize: '0.65rem' }}>
                  <span>STATUS: SOLVED</span>
                  <i className="bi bi-shield-fill-check fs-6 text-success"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
