import React from 'react';
import smartCityBg from '../assets/rajasthan_smart_city.png';

export default function Hero({ setActivePage }) {
  const highlights = [
    { title: 'Geo-tagged complaint', icon: 'bi-geo-alt-fill', color: 'text-success', bg: 'bg-primary-soft' },
    { title: 'Photo/video proof', icon: 'bi-camera-video-fill', color: 'text-primary', bg: 'bg-secondary-soft' },
    { title: 'SLA-based resolution', icon: 'bi-hourglass-split', color: 'text-warning', bg: 'bg-accent-soft' },
    { title: 'Officer verification', icon: 'bi-patch-check-fill', color: 'text-info', bg: 'bg-secondary-soft' }
  ];

  const tickerItems = [
    { text: 'Save Water, Secure the Future.', icon: 'bi-droplet-fill', emoji: '💧', color: '#f97316' },
    { text: 'Plant More Trees, Protect Future Generations.', icon: 'bi-leaf-fill', emoji: '🌱', color: '#f8fafc' },
    { text: 'Clean India, Green India, Sustainable India.', icon: 'bi-recycle', emoji: '♻', color: '#22c55e' },
    { text: 'Educate Every Girl, Empower Every Nation.', icon: 'bi-mortarboard-fill', emoji: '👧', color: '#60a5fa' },
    { text: 'Responsible Citizens Build Better Cities.', icon: 'bi-building-fill', emoji: '🏙', color: '#f97316' }
  ];

  return (
    <div className="w-100 p-0 m-0">
      {/* 1. Live Operations Dispatch Marquee Ticker */}
      <div className="live-ticker-bar" style={{ marginTop: '90px' }}>
        <div className="container d-flex align-items-center">
          <span className="badge text-white rounded-pill px-3 py-2 me-4 fw-extrabold d-flex align-items-center gap-2 flex-shrink-0" style={{ fontSize: '0.78rem', background: 'linear-gradient(135deg, #f97316 0%, #1e3a8a 50%, #22c55e 100%)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            🇮🇳 GOI AWARENESS
          </span>
          <div className="position-relative overflow-hidden w-100 d-flex align-items-center" style={{ height: '48px' }}>
            <div className="live-ticker-track">
              {/* Double items for continuous infinite scrolling */}
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <span className="live-ticker-item" key={idx} style={{ color: item.color, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                  <span className="me-2 fs-5">{item.emoji}</span>
                  <i className={`bi ${item.icon} me-2`} style={{ opacity: 0.9 }}></i>
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hero Body */}
      <section 
        className="hero-gradient-bg min-vh-100 d-flex align-items-center" 
        id="home"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 20%, rgba(248, 250, 252, 0.82) 0%, rgba(239, 246, 255, 0.85) 50%, rgba(236, 253, 245, 0.78) 100%), url(${smartCityBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingTop: '60px',
          paddingBottom: '80px'
        }}
      >
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Left Column: Headings and CTAs */}
            <div className="col-lg-7 text-center text-lg-start animate-slide-up">
              
              {/* Tagline / Indicator */}
              <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1.5 rounded-pill bg-white shadow-sm border border-light">
                <span className="rounded-circle bg-success animate-ping" style={{ width: '8px', height: '8px' }}></span>
                <span className="fw-bold text-success rc-badge p-0" style={{ fontSize: '0.65rem' }}>
                  Smart Rajasthan Civic Platform Active
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="display-4 fw-extrabold mb-3">
                Smart Rajasthan Civic <span className="text-gradient-primary">Complaint Management</span> Platform
              </h1>

              {/* Subheading */}
              <p className="lead text-muted mb-4 fs-5" style={{ maxWidth: '640px', lineHeight: '1.7' }}>
                RajCivic Connect is a digital civic service platform for Nagar Nigam, Nagar Parishad, Nagar Palika, wards, departments, officers, workers and citizens to report, track, assign, verify and resolve public complaints.
              </p>

              {/* Highlights Badge list */}
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2.5 mb-4">
                {highlights.map((hl, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 bg-white px-3 py-2 rounded-pill shadow-sm border border-light" style={{ fontSize: '0.8rem' }}>
                    <div className={`rounded-circle p-1.5 ${hl.bg} ${hl.color} d-flex align-items-center justify-content-center`} style={{ width: '24px', height: '24px' }}>
                      <i className={`bi ${hl.icon}`} style={{ fontSize: '0.8rem' }}></i>
                    </div>
                    <span className="fw-semibold text-secondary">{hl.title}</span>
                  </div>
                ))}
              </div>

              {/* Hero CTA Buttons */}
              <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3 mt-4">
                <button 
                  onClick={() => setActivePage('Complaint')} 
                  className="btn rc-btn-primary px-4 py-3 shadow-lg"
                >
                  <i className="bi bi-megaphone-fill me-2"></i> Report Complaint
                </button>
                <button 
                  onClick={() => setActivePage('Track Complaint')} 
                  className="btn rc-btn-secondary px-4 py-3 shadow-lg"
                >
                  <i className="bi bi-search me-2"></i> Track Complaint
                </button>
                <button 
                  onClick={() => setActivePage('Login/Register')} 
                  className="btn rc-btn-outline px-4 py-3"
                >
                  <i className="bi bi-door-open me-2"></i> Login/Register
                </button>
              </div>
            </div>

            {/* Right Column: Premium Interactive Case Study Widget */}
            <div className="col-lg-5 animate-fade-in">
              <div className="position-relative">
                {/* Decorative background blurs */}
                <div className="position-absolute bg-primary-soft rounded-circle" style={{ width: '150px', height: '150px', top: '-30px', left: '-30px', filter: 'blur(40px)', zIndex: 0 }}></div>
                <div className="position-absolute bg-accent-soft rounded-circle" style={{ width: '130px', height: '130px', bottom: '-30px', right: '-30px', filter: 'blur(40px)', zIndex: 0 }}></div>
                
                {/* Visual Radar Pulse indicator next to the card */}
                <div className="position-absolute bg-white shadow-lg p-2 rounded-3 border d-flex align-items-center gap-2 floating-badge" style={{ top: '-15px', right: '15px', zIndex: 10 }}>
                  <div className="rounded-circle bg-success pulse-glow" style={{ width: '10px', height: '10px' }}></div>
                  <span className="fw-bold text-secondary small" style={{ fontSize: '0.65rem' }}>Live GPS Tracking Ping</span>
                </div>

                {/* Modern Case Card */}
                <div className="card rc-card border-0 p-4 shadow-lg position-relative shimmer-card" style={{ zIndex: 1, backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.95)' }}>
                  
                  {/* Visual Header */}
                  <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
                    <div>
                      <span className="badge bg-danger-soft text-danger rc-badge mb-1">
                        <i className="bi bi-exclamation-octagon-fill me-1 animate-pulse"></i> Priority: High
                      </span>
                      <h5 className="fw-extrabold text-secondary m-0" style={{ fontSize: '1.05rem' }}>Active Case File</h5>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold text-gradient-primary fs-5">RJCIVIC-JOD-NNJ-2026-0001</span>
                    </div>
                  </div>

                  {/* Case Grid details */}
                  <div className="row g-3 text-start small mb-4">
                    <div className="col-6">
                      <span className="text-muted d-block small">Complaint Category</span>
                      <strong className="text-secondary d-flex align-items-center gap-1">
                        <i className="bi bi-funnel text-primary"></i> Sewer Overflow
                      </strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Department Auto Routing</span>
                      <strong className="text-secondary d-flex align-items-center gap-1">
                        <i className="bi bi-building-fill text-primary"></i> Drainage Department
                      </strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Urban Local Body (ULB)</span>
                      <strong className="text-secondary d-flex align-items-center gap-1">
                        <i className="bi bi-geo-alt-fill text-success"></i> Jodhpur Nagar Nigam (NNJ)
                      </strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block small">Ward Assignation</span>
                      <strong className="text-secondary d-flex align-items-center gap-1">
                        <i className="bi bi-map-fill text-success"></i> Ward 12
                      </strong>
                    </div>
                  </div>

                  {/* Status Bar Section */}
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-secondary small">Current Workflow Status</span>
                      <span className="badge bg-warning text-dark py-1 px-2.5 rounded-pill small fw-bold">Worker Assigned</span>
                    </div>
                    
                    {/* Miniature Steps */}
                    <div className="position-relative mt-3">
                      <div className="progress" style={{ height: '3px' }}>
                        <div className="progress-bar bg-warning" role="progressbar" style={{ width: '60%' }} aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      
                      <div className="d-flex justify-content-between position-absolute w-100" style={{ top: '-6px' }}>
                        <span className="bg-success rounded-circle" style={{ width: '15px', height: '15px' }} title="Submitted"></span>
                        <span className="bg-success rounded-circle" style={{ width: '15px', height: '15px' }} title="Assigned"></span>
                        <span className="bg-warning rounded-circle" style={{ width: '15px', height: '15px' }} title="Worker Assigned"></span>
                        <span className="bg-secondary rounded-circle" style={{ width: '15px', height: '15px' }} title="Resolved"></span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between mt-3 text-muted" style={{ fontSize: '0.65rem' }}>
                      <span className="text-success fw-semibold">1. Submitted</span>
                      <span className="text-success fw-semibold">2. Assigned</span>
                      <span className="text-warning fw-bold">3. Worker On Site</span>
                      <span>4. Resolved</span>
                    </div>
                  </div>

                  {/* SLA details bar */}
                  <div className="d-flex align-items-center gap-3 bg-danger-soft bg-opacity-10 p-2.5 rounded-3 border border-danger border-opacity-20 text-start">
                    <div className="bg-danger text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                      <i className="bi bi-alarm-fill animate-shake"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-danger small">Resolution SLA Deadline</div>
                      <div className="text-secondary small fw-semibold">6 Hours Remaining (SLA Target: 24h)</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
