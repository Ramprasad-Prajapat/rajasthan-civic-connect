import React, { useState, useEffect, useRef } from 'react';

export default function TrustTransparency() {
  const trustPoints = [
    { title: 'Complaint ID tracking', desc: 'Secure custom ID allocated instantly to citizen for 100% trace capacity.', icon: 'bi-hash', colorClass: 'bg-primary-soft text-success' },
    { title: 'Photo evidence', desc: 'Mandatory civic issue upload proof to eliminate mock or false complaints.', icon: 'bi-camera-fill', colorClass: 'bg-secondary-soft text-primary' },
    { title: 'Photo proof verification', desc: 'Physical site resolution proof photos uploaded directly from site.', icon: 'bi-image-fill', colorClass: 'bg-accent-soft text-warning' },
    { title: 'Officer verification', desc: 'Department officers review photo proofs and details before resolution approval.', icon: 'bi-shield-check', colorClass: 'bg-danger-soft text-danger' },
    { title: 'Citizen feedback', desc: 'Citizens provide satisfaction rating loop with direct option to confirm resolution.', icon: 'bi-chat-heart-fill', colorClass: 'bg-primary-soft text-success' },
    { title: 'SLA deadline tracking', desc: 'Defined resolution deadlines to keep municipal departments accountable.', icon: 'bi-alarm', colorClass: 'bg-secondary-soft text-primary' },
    { title: 'Department Accountability', desc: 'Direct departmental ownership and oversight for all civic issues.', icon: 'bi-arrow-up-right-circle-fill', colorClass: 'bg-accent-soft text-warning' },
    { title: 'Transparent Monitoring', desc: 'Clear complaint tracking and status updates across Rajasthan.', icon: 'bi-graph-up-arrow', colorClass: 'bg-danger-soft text-danger' }
  ];

  const securityPoints = [
    { title: 'Role-based access control', desc: 'Strict workspace segregation preventing unauthorized actions or overrides.', icon: 'bi-person-lock' },
    { title: 'Secure login ready', desc: 'JWT-ready credentials authentication layer for all officers and administrators.', icon: 'bi-key-fill' },
    { title: 'Complaint ID validation', desc: 'Regular validation scans checking unique case patterns for record verification.', icon: 'bi-fingerprint' },
    { title: 'Verified officer actions', desc: 'Every verification approval requires officer authentication.', icon: 'bi-patch-check-fill' },
    { title: 'Proof-based resolution', desc: 'System restricts closure of works without verified completion details.', icon: 'bi-file-earmark-check-fill' },
    { title: 'Citizen privacy protection', desc: 'Citizen details and contact numbers remain strictly protected.', icon: 'bi-eye-slash-fill' },
    { title: 'Complaint Timeline Ledger', desc: 'Every status update and reassignment is recorded in the complaint timeline.', icon: 'bi-journal-code' },
    { title: 'Data backups ready', desc: 'Live SQL-ready transactional safety checkpoints preserving citizen records.', icon: 'bi-cloud-arrow-up-fill' }
  ];

  const [itemsPerView, setItemsPerView] = useState(4);

  // States for Platform Trust Carousel
  const [trustIndex, setTrustIndex] = useState(0);
  const [isTrustTransitioning, setIsTrustTransitioning] = useState(true);
  const [isTrustPaused, setIsTrustPaused] = useState(false);
  const trustTimerRef = useRef(null);

  // States for Safety Protocols Carousel
  const [securityIndex, setSecurityIndex] = useState(0);
  const [isSecurityTransitioning, setIsSecurityTransitioning] = useState(true);
  const [isSecurityPaused, setIsSecurityPaused] = useState(false);
  const securityTimerRef = useRef(null);

  // Responsive layout detector
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 576) {
        setItemsPerView(1);
      } else if (window.innerWidth < 992) {
        setItemsPerView(2);
      } else {
        setItemsPerView(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Slide advancement mechanics
  const handleTrustNext = () => {
    if (trustIndex >= trustPoints.length) {
      setIsTrustTransitioning(false);
      setTrustIndex(0);
      setTimeout(() => {
        setIsTrustTransitioning(true);
        setTrustIndex(1);
      }, 50);
    } else {
      setTrustIndex(prev => prev + 1);
    }
  };

  const handleSecurityNext = () => {
    if (securityIndex >= securityPoints.length) {
      setIsSecurityTransitioning(false);
      setSecurityIndex(0);
      setTimeout(() => {
        setIsSecurityTransitioning(true);
        setSecurityIndex(1);
      }, 50);
    } else {
      setSecurityIndex(prev => prev + 1);
    }
  };

  // Timer intervals with hover pausing checks
  useEffect(() => {
    if (!isTrustPaused) {
      trustTimerRef.current = setInterval(() => {
        handleTrustNext();
      }, 2500);
    }
    return () => {
      if (trustTimerRef.current) clearInterval(trustTimerRef.current);
    };
  }, [trustIndex, isTrustPaused, itemsPerView]);

  useEffect(() => {
    if (!isSecurityPaused) {
      securityTimerRef.current = setInterval(() => {
        handleSecurityNext();
      }, 2500);
    }
    return () => {
      if (securityTimerRef.current) clearInterval(securityTimerRef.current);
    };
  }, [securityIndex, isSecurityPaused, itemsPerView]);

  const extendedTrustPoints = [...trustPoints, ...trustPoints.slice(0, itemsPerView)];
  const extendedSecurityPoints = [...securityPoints, ...securityPoints.slice(0, itemsPerView)];

  return (
    <section className="py-5 bg-white position-relative" id="trust-transparency">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary-soft text-success rc-badge mb-2">GovTech Principles</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Trust &amp; Transparency</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Open governance and accountable tracking to deliver reliable citizen services.
          </p>
        </div>

        {/* 1. Platform Trust Carousel */}
        <div className="mb-5 position-relative">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-secondary mb-0">Platform Integrity Indicators</h5>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setTrustIndex(prev => (prev > 0 ? prev - 1 : trustPoints.length - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={handleTrustNext}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <div 
            className="overflow-hidden py-2"
            onMouseEnter={() => setIsTrustPaused(true)}
            onMouseLeave={() => setIsTrustPaused(false)}
          >
            <div 
              className="d-flex"
              style={{
                transform: `translateX(-${trustIndex * (100 / itemsPerView)}%)`,
                transition: isTrustTransitioning ? 'transform 0.5s ease-in-out' : 'none'
              }}
            >
              {extendedTrustPoints.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ flex: `0 0 ${100 / itemsPerView}%`, maxWidth: `${100 / itemsPerView}%` }}
                  className="px-2"
                >
                  <div className="card rc-card border-0 p-3 shadow-sm h-100 text-start bg-light">
                    <div className={`rc-icon-container ${item.colorClass} mb-2`} style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <strong className="text-secondary small d-block mb-1">{item.title}</strong>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Security Protocols Carousel */}
        <div className="position-relative">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-secondary mb-0">Safety &amp; Compliance Standards</h5>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={() => setSecurityIndex(prev => (prev > 0 ? prev - 1 : securityPoints.length - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={handleSecurityNext}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          <div 
            className="overflow-hidden py-2"
            onMouseEnter={() => setIsSecurityPaused(true)}
            onMouseLeave={() => setIsSecurityPaused(false)}
          >
            <div 
              className="d-flex"
              style={{
                transform: `translateX(-${securityIndex * (100 / itemsPerView)}%)`,
                transition: isSecurityTransitioning ? 'transform 0.5s ease-in-out' : 'none'
              }}
            >
              {extendedSecurityPoints.map((item, idx) => (
                <div 
                  key={idx} 
                  style={{ flex: `0 0 ${100 / itemsPerView}%`, maxWidth: `${100 / itemsPerView}%` }}
                  className="px-2"
                >
                  <div className="card rc-card border-0 p-3 shadow-sm h-100 text-start bg-light">
                    <div className="rc-icon-container bg-white text-primary mb-2 shadow-sm border" style={{ width: '38px', height: '38px', borderRadius: '10px' }}>
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <strong className="text-secondary small d-block mb-1">{item.title}</strong>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
