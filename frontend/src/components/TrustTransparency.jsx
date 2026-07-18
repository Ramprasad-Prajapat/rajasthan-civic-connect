import React, { useState, useEffect, useRef } from 'react';

export default function TrustTransparency() {
  const trustPoints = [
    { title: 'Complaint ID tracking', desc: 'Secure custom ID allocated instantly to citizen for 100% trace capacity.', icon: 'bi-hash', colorClass: 'bg-primary-soft text-success' },
    { title: 'Photo/video evidence', desc: 'Mandatory civic issue upload proof to eliminate mock/false complaints.', icon: 'bi-camera-fill', colorClass: 'bg-secondary-soft text-primary' },
    { title: 'Worker before/after proof', desc: 'Sanitary workers upload physical completion proof photos directly from site.', icon: 'bi-image-fill', colorClass: 'bg-accent-soft text-warning' },
    { title: 'Officer verification', desc: 'Nodal inspectors review photo proofs physically before resolution approval.', icon: 'bi-shield-check', colorClass: 'bg-danger-soft text-danger' },
    { title: 'Citizen feedback', desc: 'Citizen confirm closure rating loop with direct option to reopen delayed repairs.', icon: 'bi-chat-heart-fill', colorClass: 'bg-primary-soft text-success' },
    { title: 'SLA deadline tracking', desc: 'Hardcoded clock deadline to prevent citizen delay, keeping ULBs accountable.', icon: 'bi-alarm', colorClass: 'bg-secondary-soft text-primary' },
    { title: 'Escalation to authority', desc: 'Auto-routed transfer to higher municipal commissioners if SLA target expires.', icon: 'bi-arrow-up-right-circle-fill', colorClass: 'bg-accent-soft text-warning' },
    { title: 'Reports and analytics', desc: 'Open data dashboards tracing monthly performance index across Rajasthan.', icon: 'bi-graph-up-arrow', colorClass: 'bg-danger-soft text-danger' }
  ];

  const securityPoints = [
    { title: 'Role-based access control', desc: 'Strict workspace segregation preventing unauthorized actions or overrides.', icon: 'bi-person-lock' },
    { title: 'Secure login ready', desc: 'JWT-ready credentials authentication layer for all field workers and administrators.', icon: 'bi-key-fill' },
    { title: 'Complaint ID validation', desc: 'Regular validation scans checking unique case patterns for trace audits.', icon: 'bi-fingerprint' },
    { title: 'Verified officer actions', desc: 'Every verification approval requires encrypted officer metadata signature.', icon: 'bi-patch-check-fill' },
    { title: 'Proof-based resolution', desc: 'System restricts closure of works without coordinate-matched image logs.', icon: 'bi-file-earmark-check-fill' },
    { title: 'Citizen privacy protection', desc: 'Citizen details and phone hashes remain strictly hidden from field staff.', icon: 'bi-eye-slash-fill' },
    { title: 'Admin audit logs', desc: 'Every dispatch action, reassignment and SLA delay is tracked in an audit ledger.', icon: 'bi-journal-code' },
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
      }, 1850);
    }
    return () => {
      if (trustTimerRef.current) clearInterval(trustTimerRef.current);
    };
  }, [trustIndex, isTrustPaused, itemsPerView]);

  useEffect(() => {
    if (!isSecurityPaused) {
      securityTimerRef.current = setInterval(() => {
        handleSecurityNext();
      }, 1850);
    }
    return () => {
      if (securityTimerRef.current) clearInterval(securityTimerRef.current);
    };
  }, [securityIndex, isSecurityPaused, itemsPerView]);

  // Clone slides to ensure infinite visual loop
  const extendedTrustList = [...trustPoints, ...trustPoints.slice(0, itemsPerView)];
  const extendedSecurityList = [...securityPoints, ...securityPoints.slice(0, itemsPerView)];

  return (
    <div className="w-100">
      {/* Dynamic Hover Styles */}
      <style>{`
        .premium-hover-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 1px solid #f1f5f9 !important;
          cursor: pointer;
        }
        .premium-hover-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 15px 35px rgba(15, 76, 129, 0.12) !important;
          border-color: #10b981 !important;
        }
        .premium-hover-card:hover .rc-icon-container {
          transform: scale(1.15) !important;
          transition: transform 0.4s ease !important;
        }
      `}</style>

      {/* 1. Transparency Section */}
      <section className="py-5 bg-light" id="trust-transparency">
        <div className="container py-4">
          {/* Section Header */}
          <div className="text-center mb-5">
            <span className="badge bg-secondary-soft text-primary rc-badge mb-2">Platform Trust</span>
            <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Trust, Proof and Transparency</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              RajCivic Connect guarantees direct audit trails and clear accountability for citizens and officers.
            </p>
          </div>

          {/* Trust Auto-scrolling Carousel Container */}
          <div
            className="overflow-hidden py-3 position-relative"
            onMouseEnter={() => setIsTrustPaused(true)}
            onMouseLeave={() => setIsTrustPaused(false)}
          >
            <div
              className="d-flex"
              style={{
                transform: `translateX(-${trustIndex * (100 / itemsPerView)}%)`,
                transition: isTrustTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
            >
              {extendedTrustList.map((tp, index) => (
                <div
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / itemsPerView}%` }}
                  key={index}
                >
                  <div className="card premium-hover-card border-0 p-4 shadow-sm text-center h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className={`rc-icon-container ${tp.colorClass} mx-auto mb-3`}>
                        <i className={`bi ${tp.icon}`}></i>
                      </div>
                      <h6 className="fw-bold text-secondary mb-2">{tp.title}</h6>
                      <p className="text-muted small mb-0" style={{ lineHeight: '1.5', fontSize: '0.75rem' }}>
                        {tp.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Security Section */}
      <section className="py-5 bg-white" id="trust-security">
        <div className="container py-4">
          {/* Section Header */}
          <div className="text-center mb-5">
            <span className="badge bg-primary-soft text-success rc-badge mb-2">Safety Protocols</span>
            <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Trust, Security & Data Control</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Built upon industry-grade security practices protecting municipal archives and citizen credentials.
            </p>
          </div>

          {/* Security Auto-scrolling Carousel Container */}
          <div
            className="overflow-hidden py-3 position-relative"
            onMouseEnter={() => setIsSecurityPaused(true)}
            onMouseLeave={() => setIsSecurityPaused(false)}
          >
            <div
              className="d-flex"
              style={{
                transform: `translateX(-${securityIndex * (100 / itemsPerView)}%)`,
                transition: isSecurityTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
            >
              {extendedSecurityList.map((sp, index) => (
                <div
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / itemsPerView}%` }}
                  key={index}
                >
                  <div className="card premium-hover-card border border-light p-4 shadow-sm text-start h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="rc-icon-container bg-light text-success border mb-3" style={{ width: '40px', height: '40px', borderRadius: '10px', fontSize: '1.1rem' }}>
                        <i className={`bi ${sp.icon}`}></i>
                      </div>
                      <h6 className="fw-bold text-secondary mb-2">{sp.title}</h6>
                      <p className="text-muted small mb-0" style={{ lineHeight: '1.5', fontSize: '0.73rem' }}>
                        {sp.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
