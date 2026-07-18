import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Citizen Reports Complaint',
      description: 'Citizen selects category, adds description, uploads photo/video and location.',
      icon: 'bi bi-megaphone-fill',
      colorClass: 'bg-primary-soft text-success'
    },
    {
      num: '02',
      title: 'System Routes Complaint',
      description: 'System maps complaint to correct district, ULB, ward and department.',
      icon: 'bi bi-node-plus-fill',
      colorClass: 'bg-secondary-soft text-primary'
    },
    {
      num: '03',
      title: 'Officer Assigns Worker',
      description: 'Ward or department officer reviews complaint and assigns field worker.',
      icon: 'bi bi-person-workspace',
      colorClass: 'bg-accent-soft text-warning'
    },
    {
      num: '04',
      title: 'Worker Resolves Issue',
      description: 'Worker visits location, starts work and uploads before/after proof.',
      icon: 'bi bi-tools',
      colorClass: 'bg-danger-soft text-danger'
    },
    {
      num: '05',
      title: 'Officer Verifies & Citizen Feedback',
      description: 'Officer verifies work proof. Citizen confirms resolution or reopens complaint.',
      icon: 'bi bi-shield-fill-check',
      colorClass: 'bg-primary-soft text-success'
    }
  ];

  return (
    <section className="py-5 bg-light" id="how-it-works">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary-soft text-success rc-badge mb-2">Process flow</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">How It Works</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            RajCivic Connect transparency aur quick service deliver karne ke liye systematic 5-step workflow follow karta hai.
          </p>
        </div>

        {/* Timeline wrapper */}
        <div className="works-timeline">
          {/* Custom timeline bar across the top for large screen sizes */}
          <div className="position-absolute d-none d-lg-block" style={{ top: '80px', left: '10%', right: '10%', height: '3px', background: 'linear-gradient(to right, var(--rc-secondary) 0%, var(--rc-primary) 100%)', opacity: 0.3 }}></div>

          <div className="row g-4 row-cols-1 row-cols-md-3 row-cols-lg-5 justify-content-center">
            {steps.map((step, index) => (
              <div className="col text-center timeline-step" key={index}>
                {/* Timeline ball */}
                <div className="timeline-number mb-4">
                  {step.num}
                </div>

                {/* Card representation */}
                <div className="card rc-card border-0 p-4 shadow-sm h-100 d-flex flex-column justify-content-between" style={{ minHeight: '270px' }}>
                  <div>
                    <div className={`rc-icon-container ${step.colorClass} mx-auto mb-3`}>
                      <i className={step.icon}></i>
                    </div>
                    <h6 className="fw-bold mb-2 text-secondary">{step.title}</h6>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: '1.5', fontSize: '0.75rem' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
