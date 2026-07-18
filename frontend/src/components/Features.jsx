import React from 'react';

export default function Features() {
  const featureList = [
    {
      title: 'Geo-tagged complaint',
      description: 'Complaint location is captured using map/location support.',
      icon: 'bi bi-geo-alt-fill',
      badgeClass: 'bg-primary-soft text-success',
      num: '01'
    },
    {
      title: 'Photo/video upload',
      description: 'Citizen can upload proof of civic issue.',
      icon: 'bi bi-camera-video-fill',
      badgeClass: 'bg-secondary-soft text-primary',
      num: '02'
    },
    {
      title: 'ULB/ward auto routing',
      description: 'Complaint routes to correct Nagar Nigam, Nagar Parishad, Nagar Palika and ward.',
      icon: 'bi bi-diagram-3-fill',
      badgeClass: 'bg-accent-soft text-warning',
      num: '03'
    },
    {
      title: 'Department auto assignment',
      description: 'Complaint category maps to related department automatically.',
      icon: 'bi bi-cpu-fill',
      badgeClass: 'bg-primary-soft text-success',
      num: '04'
    },
    {
      title: 'SLA timer',
      description: 'Every complaint has a fixed resolution deadline.',
      icon: 'bi bi-hourglass-split',
      badgeClass: 'bg-secondary-soft text-primary',
      num: '05'
    },
    {
      title: 'Worker assignment',
      description: 'Officer assigns field worker for ground-level action.',
      icon: 'bi bi-people-fill',
      badgeClass: 'bg-accent-soft text-warning',
      num: '06'
    },
    {
      title: 'Officer verification',
      description: 'Officer checks before/after proof before closing complaint.',
      icon: 'bi bi-clipboard-check-fill',
      badgeClass: 'bg-primary-soft text-success',
      num: '07'
    },
    {
      title: 'Citizen feedback',
      description: 'Citizen gives rating and satisfaction status.',
      icon: 'bi bi-chat-heart-fill',
      badgeClass: 'bg-secondary-soft text-primary',
      num: '08'
    },
    {
      title: 'Escalation system',
      description: 'Delayed complaints move to higher authority.',
      icon: 'bi bi-graph-up-arrow',
      badgeClass: 'bg-accent-soft text-warning',
      num: '09'
    }
  ];

  return (
    <section className="py-5 bg-white position-relative overflow-hidden" id="features">
      {/* Decorative background shapes */}
      <div className="position-absolute bg-primary-soft rounded-circle" style={{ width: '300px', height: '300px', top: '-10%', left: '-10%', opacity: 0.3, filter: 'blur(60px)' }}></div>
      <div className="position-absolute bg-secondary-soft rounded-circle" style={{ width: '250px', height: '250px', bottom: '-5%', right: '-5%', opacity: 0.3, filter: 'blur(50px)' }}></div>

      <div className="container py-4 position-relative">
        {/* Title */}
        <div className="text-center mb-5 animate-slide-up">
          <span className="badge bg-primary-soft text-success rc-badge mb-2">Core Platform Overview</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Why RajCivic Connect?</h2>
          <p className="text-muted mx-auto fs-5" style={{ maxWidth: '780px', lineHeight: '1.6' }}>
            RajCivic Connect helps citizens report civic issues online and helps urban local bodies manage complaints with real-time tracking, worker assignment, officer verification, SLA monitoring and escalation system.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="row g-4">
          {featureList.map((feat, idx) => (
            <div className="col-md-6 col-lg-4" key={idx}>
              <div className="card rc-card p-4 border border-light shadow-sm shimmer-card position-relative" style={{ overflow: 'hidden' }}>
                {/* Visual Number overlay in card background */}
                <div className="position-absolute text-muted opacity-10 font-weight-black" style={{ fontSize: '4.5rem', right: '15px', bottom: '-15px', zIndex: 0, fontWeight: 900, userSelect: 'none', pointerEvents: 'none' }}>
                  {feat.num}
                </div>

                <div className="d-flex align-items-start gap-3 position-relative z-1">
                  <div className={`rc-icon-container ${feat.badgeClass} flex-shrink-0 m-0 border shadow-sm`} style={{ borderRadius: '10px' }}>
                    <i className={feat.icon}></i>
                  </div>
                  <div className="text-start">
                    <h5 className="fw-bold mb-2 text-secondary">{feat.title}</h5>
                    <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
                      {feat.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
