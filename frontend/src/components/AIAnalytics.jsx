import React from 'react';

export default function AIAnalytics() {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-start mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fw-extrabold text-secondary mb-1">AI Predictive Governance Analytics</h5>
          <span className="text-muted text-xxs">Forecasted civic grievance trends & resource allocation weights</span>
        </div>
        <span className="badge bg-primary-soft text-primary rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
          📊 MODEL ACCURACY: 96.8%
        </span>
      </div>

      <div className="row g-3">
        {[
          { label: 'Garbage Collection', pct: '38%', color: 'bg-primary' },
          { label: 'Streetlight & Electrical', pct: '26%', color: 'bg-warning' },
          { label: 'Water Supply', pct: '20%', color: 'bg-info' },
          { label: 'Drainage & Sewage', pct: '16%', color: 'bg-danger' }
        ].map((item, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-md-3">
            <div className="p-3 border rounded-3 bg-light">
              <span className="text-muted text-xxs d-block fw-bold mb-1">{item.label}</span>
              <div className="d-flex align-items-center justify-content-between">
                <strong className="text-secondary fs-5 fw-extrabold">{item.pct}</strong>
                <div className={`rounded-circle ${item.color}`} style={{ width: '12px', height: '12px' }}></div>
              </div>
              <div className="progress mt-2" style={{ height: '6px' }}>
                <div className={`progress-bar ${item.color}`} style={{ width: item.pct }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
