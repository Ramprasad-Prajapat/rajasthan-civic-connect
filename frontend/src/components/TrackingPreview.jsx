import React, { useState } from 'react';

export default function TrackingPreview() {
  const [complaintId, setComplaintId] = useState('');
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 7 timeline stages for Jodhpur sewer leak issue
  const sampleSteps = [
    { name: 'Submitted', date: 'May 24, 2026', time: '10:30 AM', status: 'completed', icon: 'bi-check-circle-fill', text: 'Complaint registered by citizen and auto-routed to ULB.' },
    { name: 'Under Review', date: 'May 24, 2026', time: '11:15 AM', status: 'completed', icon: 'bi-search', text: 'Nodal Officer Sanjay Sharma reviewed geographic tags & photos.' },
    { name: 'Assigned', date: 'May 24, 2026', time: '02:15 PM', status: 'completed', icon: 'bi-person-badge-fill', text: 'Routed to Jodhpur Nagar Nigam (North) Sanitary Dept.' },
    { name: 'Work Started', date: 'May 25, 2026', time: '09:00 AM', status: 'completed', icon: 'bi-tools', text: 'Field worker Rajesh Kumar arrived at site and started excavations.' },
    { name: 'Officer Verification', date: 'May 26, 2026', time: '11:00 AM', status: 'active', icon: 'bi-shield-fill-check', text: 'Before/after work proofs uploaded. Awaiting officer confirmation.' },
    { name: 'Resolved', date: 'Pending', time: '', status: 'pending', icon: 'bi-award-fill', text: 'Resolution confirmation and citizen rating collection.' },
    { name: 'Citizen Feedback', date: 'Pending', time: '', status: 'pending', icon: 'bi-chat-heart-fill', text: 'Citizen rating validation and satisfaction record lock.' }
  ];

  const handleTrack = (e) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setErrorMsg('Please enter a valid Complaint ID');
      setSearched(false);
      return;
    }
    setErrorMsg('');
    setSearched(true);
  };

  return (
    <section className="py-5 bg-white" id="track-complaint">
      <div className="container py-4">
        {/* Section Header */}
        <div className="text-center mb-5">
          <span className="badge bg-accent-soft text-warning rc-badge mb-2">Track Service</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Track Your Complaint Status</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Apne registered complaint ki live ground level progress aur officers details real-time check karein.
          </p>
        </div>

        {/* Input box */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-6">
            <div className="card rc-card p-4 border-0 shadow-lg" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
              <form onSubmit={handleTrack}>
                <div className="mb-3">
                  <label htmlFor="complaintIdInput" className="form-label fw-semibold text-secondary mb-2">
                    Enter Complaint ID
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 rounded-start-pill ps-3 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control rc-form-control border-start-0 rounded-end-pill py-3"
                      id="complaintIdInput"
                      placeholder="RJCIVIC-JOD-NNJ-2026-0001"
                      value={complaintId}
                      onChange={(e) => setComplaintId(e.target.value)}
                    />
                  </div>
                  {errorMsg && <div className="text-danger small mt-2 ms-3 fw-medium">{errorMsg}</div>}
                  <div className="form-text text-muted mt-2 ms-3 small">
                    Example: <span className="fw-semibold text-secondary">RJCIVIC-JOD-NNJ-2026-0001</span> (Press Track Now to load sample)
                  </div>
                </div>

                <button type="submit" className="btn rc-btn-primary w-100 py-3 rounded-pill">
                  <i className="bi bi-compass-fill me-2"></i> Track Now
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        {searched && (
          <div className="row g-4 justify-content-center animate-slide-up">
            <div className="col-lg-12">
              <div className="card rc-card p-4 border-0 shadow-lg">

                {/* Meta Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3 g-2">
                  <div>
                    <h5 className="m-0 fw-bold text-secondary">
                      <i className="bi bi-file-earmark-text-fill text-success me-2"></i>
                      ID: <span className="text-gradient-primary">{complaintId.toUpperCase()}</span>
                    </h5>
                    <span className="text-muted small">Registered on: May 24, 2026 • 10:30 AM</span>
                  </div>
                  <div>
                    <span className="badge bg-warning text-dark rc-badge px-3 py-2">
                      <i className="bi bi-hourglass-split me-1 animate-spin"></i> Officer Review
                    </span>
                  </div>
                </div>

                {/* Grid Details */}
                <div className="row g-3 mb-5 text-start">
                  <div className="col-md-6 col-lg-3">
                    <span className="text-muted small d-block">ULB / Ward</span>
                    <strong className="text-secondary">Jodhpur Nagar Nigam (North) • Ward 12</strong>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <span className="text-muted small d-block">Category / Dept</span>
                    <strong className="text-secondary">Sewer Overflow / Drainage Dept</strong>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <span className="text-muted small d-block">SLA Deadline</span>
                    <strong className="text-danger"><i className="bi bi-clock-fill me-1"></i> May 27, 2026</strong>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <span className="text-muted small d-block">Assigned Worker</span>
                    <strong className="text-secondary">Rajesh Kumar (Field Service)</strong>
                  </div>
                </div>

                {/* Timeline display */}
                <h6 className="fw-bold text-secondary mb-4 text-center text-md-start">Live Progress Timeline (7 Stages)</h6>
                <div className="row g-4 row-cols-1 row-cols-md-7 position-relative text-center px-lg-3">

                  {/* Connected line for medium/large screens */}
                  <div className="position-absolute d-none d-md-block" style={{ top: '40px', left: '7%', right: '7%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 0 }}>
                    <div className="bg-success h-100" style={{ width: '66%' }}></div>
                  </div>

                  {sampleSteps.map((step, index) => {
                    let dotColor = 'bg-secondary text-white';
                    let labelColor = 'text-muted';
                    let borderColor = 'border-light';

                    if (step.status === 'completed') {
                      dotColor = 'bg-success text-white shadow-success-soft';
                      labelColor = 'text-success fw-semibold';
                      borderColor = 'border-success';
                    } else if (step.status === 'active') {
                      dotColor = 'bg-warning text-dark shadow-warning-soft';
                      labelColor = 'text-warning fw-bold';
                      borderColor = 'border-warning';
                    }

                    return (
                      <div className="col position-relative z-1 mb-4 mb-md-0" key={index}>
                        {/* Dot container */}
                        <div
                          className={`rounded-circle mx-auto d-flex align-items-center justify-content-center border-4 ${borderColor} ${dotColor}`}
                          style={{ width: '56px', height: '56px', fontSize: '1.25rem', transition: 'all 0.3s ease' }}
                        >
                          <i className={`bi ${step.icon}`}></i>
                        </div>
                        {/* Title */}
                        <div className={`mt-3 small ${labelColor}`} style={{ fontSize: '0.8rem' }}>{step.name}</div>
                        {/* Date/Time */}
                        {step.date !== 'Pending' && (
                          <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                            {step.date} <br className="d-none d-md-inline" /> {step.time}
                          </div>
                        )}
                        {/* Mobile Details */}
                        <div className="card p-2 shadow-sm border mt-2 mx-auto d-md-none bg-light text-start" style={{ fontSize: '0.75rem' }}>
                          {step.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Additional Details info card */}
                <div className="alert alert-info border-0 rounded-3 d-flex align-items-start gap-3 mt-5 text-start p-3 bg-light">
                  <div className="rc-icon-container bg-primary-soft text-success m-0 flex-shrink-0" style={{ width: '38px', height: '38px', borderRadius: '8px', fontSize: '1.1rem' }}>
                    <i className="bi bi-info-circle-fill"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-secondary mb-1">Current Milestone: Officer Verification</h6>
                    <p className="text-muted small mb-0">
                      Field sanitary worker Rajesh Kumar has cleared the sewer pipe block and uploaded before/after proof images. Department Officer Sanjay Sharma (Nodal Inspector Ward 12) is notified to verify the site clearance. You can rate the work once verified.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </section >
  );
}
