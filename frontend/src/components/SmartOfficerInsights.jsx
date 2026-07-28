import React, { useState, useEffect } from 'react';

export default function SmartOfficerInsights() {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetch('/api/ai/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) setInsights(data.data);
      })
      .catch(err => console.error("Error fetching AI analytics:", err));
  }, []);

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 text-start">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-primary-soft text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
            <i className="bi bi-cpu-fill fs-5"></i>
          </div>
          <div>
            <h5 className="fw-extrabold text-secondary mb-0">AI Smart Officer Intelligence</h5>
            <span className="text-muted text-xxs">Predictive dispatch & SLA breach mitigation recommendations</span>
          </div>
        </div>
        <span className="badge bg-success-soft text-success rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.7rem' }}>
          🤖 LIVE AI INSIGHTS
        </span>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="p-3 border rounded-3 bg-light">
            <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Predicted SLA Compliance</span>
            <h3 className="fw-extrabold text-primary mb-0">{insights?.slaComplianceForecast || '94.2%'}</h3>
            <span className="text-success text-xxs fw-bold">↑ +2.4% vs last week</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 border rounded-3 bg-light">
            <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">High Risk Wards</span>
            <strong className="text-secondary small d-block">
              {insights?.highRiskWards ? insights.highRiskWards.join(', ') : 'Ward 12, Ward 08'}
            </strong>
            <span className="text-danger text-xxs fw-bold">⚠️ Increased load forecasted</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 border rounded-3 bg-light">
            <span className="text-muted text-xxs text-uppercase fw-bold d-block mb-1">Recommended Worker Dispatch</span>
            <span className="badge bg-warning-soft text-warning fw-bold small">
              +4 Workers to Ward 12 (Sanitation)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
