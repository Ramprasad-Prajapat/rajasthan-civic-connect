import React, { useState, useEffect } from 'react';

export default function RajasthanStructure() {
  const [coverageData, setCoverageData] = useState(null);
  const [selectedSambhag, setSelectedSambhag] = useState('Jaipur Division');
  const [selectedDistrict, setSelectedDistrict] = useState('Jaipur');
  const [activeUlbTab, setActiveUlbTab] = useState('Nagar Nigam');
  const [expandedUlb, setExpandedUlb] = useState(null);

  // Load dynamic ULB data
  useEffect(() => {
    fetch('/data/rajasthan-ulbs.json')
      .then(res => res.json())
      .then(data => {
        setCoverageData(data);
        
        // Extract unique Sambhags
        const sambhags = [...new Set(data.map(item => item.division))].sort();
        if (sambhags.length > 0) {
          const defaultSambhag = sambhags.includes('Jaipur Division') ? 'Jaipur Division' : sambhags[0];
          setSelectedSambhag(defaultSambhag);
          
          // Get districts for default Sambhag
          const districts = [...new Set(data.filter(item => item.division === defaultSambhag).map(item => item.district))].sort();
          if (districts.length > 0) {
            setSelectedDistrict(districts.includes('Jaipur') ? 'Jaipur' : districts[0]);
          }
        }
      })
      .catch(err => console.error("Error loading coverage data in RajasthanStructure:", err));
  }, []);

  // Handle Sambhag change and select its first district
  const handleSambhagChange = (sambhag) => {
    setSelectedSambhag(sambhag);
    setExpandedUlb(null);
    if (coverageData) {
      const districts = [...new Set(coverageData.filter(item => item.division === sambhag).map(item => item.district))].sort();
      if (districts.length > 0) {
        setSelectedDistrict(districts[0]);
      }
    }
  };

  // Compute stats dynamically
  const getStats = () => {
    if (!coverageData) {
      return { districts: 33, nigams: 11, parishads: 35, palikas: 25, wards: 250 };
    }

    const uniqueDistricts = [...new Set(coverageData.map(item => item.district))].length;
    const nigamsCount = coverageData.filter(item => item.ulbType === 'Nagar Nigam').length;
    const parishadsCount = coverageData.filter(item => item.ulbType === 'Nagar Parishad').length;
    const palikasCount = coverageData.filter(item => item.ulbType === 'Nagar Palika').length;
    let wardsCount = 0;
    coverageData.forEach(item => {
      wardsCount += (item.wards || []).length;
    });

    return {
      districts: uniqueDistricts,
      nigams: nigamsCount,
      parishads: parishadsCount,
      palikas: palikasCount,
      wards: wardsCount
    };
  };

  const stats = getStats();

  const futureFeatures = [
    { title: 'Geo Location Detection', desc: 'Automatic hardware coordinates lock on file attachment upload.', icon: 'bi-geo-alt-fill', color: 'text-primary bg-primary-soft' },
    { title: 'Smart Routing', desc: 'AI-assisted department routing based on text intent analytics.', icon: 'bi-signpost-split-fill', color: 'text-success bg-success-soft' },
    { title: 'GIS Mapping & Visual Wards', desc: 'Realtime Leaflet & MapLibre overlay showing civic jurisdiction boundaries.', icon: 'bi-map-fill', color: 'text-warning bg-accent-soft' },
    { title: 'AI Complaint Classification', desc: 'Neural network scanning citizen photos for garbage density detection.', icon: 'bi-cpu-fill', color: 'text-danger bg-danger-soft' }
  ];

  const districtsList = coverageData 
    ? [...new Set(coverageData.filter(item => item.division === selectedSambhag).map(item => item.district))].sort()
    : ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner'];

  const activeDistrictItems = coverageData
    ? coverageData.filter(item => item.division === selectedSambhag && item.district === selectedDistrict)
    : [];

  return (
    <section className="py-5 bg-white border-top" id="rajasthan-level-structure">
      <div className="container py-4">
        
        {/* SECTION HEADER */}
        <div className="text-center mb-5">
          <span className="badge bg-accent-soft text-warning rc-badge mb-2">Civic Coverage & Directory</span>
          <h2 className="display-6 fw-bold mb-3 text-gradient-primary">Rajasthan Civic Coverage System</h2>
          <p className="text-muted mx-auto fs-5" style={{ maxWidth: '750px', lineHeight: '1.6' }}>
            Empowering smart civic administration across Rajasthan's urban local boundaries with direct digital accountability.
          </p>
        </div>

        {/* 1. DYNAMIC STATS PANEL */}
        <div className="row g-3 mb-5">
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-light text-center h-100 transition-all hover-translate-y">
              <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-geo-fill text-primary fs-3"></i>
              </div>
              <h3 className="fw-extrabold text-secondary mb-1">{stats.districts}</h3>
              <span className="text-muted small fw-bold uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Districts Covered</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-light text-center h-100 transition-all hover-translate-y">
              <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-building-fill text-success fs-3"></i>
              </div>
              <h3 className="fw-extrabold text-secondary mb-1">{stats.nigams}</h3>
              <span className="text-muted small fw-bold uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Nagar Nigams</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-light text-center h-100 transition-all hover-translate-y">
              <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-houses-fill text-warning fs-3"></i>
              </div>
              <h3 className="fw-extrabold text-secondary mb-1">{stats.parishads} / {stats.palikas}</h3>
              <span className="text-muted small fw-bold uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Parishads & Palikas</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-light text-center h-100 transition-all hover-translate-y">
              <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-compass-fill text-danger fs-3"></i>
              </div>
              <h3 className="fw-extrabold text-secondary mb-1">{stats.wards}</h3>
              <span className="text-muted small fw-bold uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>Wards Covered</span>
            </div>
          </div>
        </div>

        <div className="row g-4 align-items-stretch mb-5">
          {/* 2. INTERACTIVE DISTRICT SEARCH & DIRECTORY */}
          <div className="col-lg-7">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-light h-100 text-start">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-extrabold text-secondary m-0">
                    <i className="bi bi-search text-success me-2"></i>
                    Civic Directory Search
                  </h5>
                  <span className="text-muted small">Explore administrative jurisdictions of Rajasthan</span>
                </div>
                
                {/* District Selector */}
                <select 
                  className="form-select border-0 shadow-sm rounded-pill px-3 py-2 fw-bold text-secondary bg-white"
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setExpandedUlb(null);
                  }}
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  {districtsList.map((dist, idx) => (
                    <option key={idx} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Sambhag (Division) Selector */}
              <div className="mb-4">
                <span className="text-muted small fw-bold d-block mb-2 text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                  Select Administrative Division (Sambhag)
                </span>
                <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {coverageData && [...new Set(coverageData.map(item => item.division))].sort().map((sambhag, idx) => {
                    const isSelected = selectedSambhag === sambhag;
                    return (
                      <button
                        key={idx}
                        className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all border shadow-xs ${
                          isSelected 
                            ? 'btn-success text-white border-success' 
                            : 'btn-outline-secondary bg-white text-secondary border-light-subtle'
                        }`}
                        onClick={() => handleSambhagChange(sambhag)}
                        style={{ fontSize: '0.72rem' }}
                      >
                        <i className="bi bi-grid-1x2-fill me-1" style={{ fontSize: '0.68rem' }}></i>
                        {sambhag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ULB Type Tabs inside Selected District */}
              <ul className="nav nav-pills nav-fill bg-white p-1 rounded-pill shadow-sm mb-4">
                {['Nagar Nigam', 'Nagar Parishad', 'Nagar Palika'].map((tab, idx) => {
                  const isActive = activeUlbTab === tab;
                  const count = activeDistrictItems.filter(item => item.ulbType === tab).length;
                  return (
                    <li className="nav-item" key={idx}>
                      <button 
                        className={`nav-link rounded-pill py-2.5 small fw-extrabold transition-all border-0 ${isActive ? 'bg-success text-white' : 'text-muted bg-transparent'}`}
                        onClick={() => {
                          setActiveUlbTab(tab);
                          setExpandedUlb(null);
                        }}
                      >
                        {tab} <span className={`badge ${isActive ? 'bg-white text-success' : 'bg-light text-muted'} ms-1`}>{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* ULB List Container */}
              <div className="bg-white rounded-4 p-3 border shadow-xs" style={{ minHeight: '260px' }}>
                {activeDistrictItems.filter(item => item.ulbType === activeUlbTab).length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {activeDistrictItems.filter(item => item.ulbType === activeUlbTab).map((ulbItem, uIdx) => {
                      const isExpanded = expandedUlb === ulbItem.ulbName;
                      const wardsList = ulbItem.wards || [];
                      return (
                        <div className="border rounded-3 p-3 transition-all animate-fade-in" key={uIdx} style={{ backgroundColor: isExpanded ? '#f8fafc' : 'white' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="d-flex align-items-center flex-wrap gap-2">
                                <strong className="text-secondary">{ulbItem.ulbName}</strong>
                                <span className="badge bg-success-soft text-success border border-success border-opacity-10 rounded-pill px-2 py-0.5" style={{ fontSize: '0.62rem' }}>
                                  <i className="bi bi-grid-1x2-fill me-1" style={{ fontSize: '0.58rem' }}></i>
                                  {ulbItem.division}
                                </span>
                              </div>
                              <span className="text-muted text-xxs d-block mt-1" style={{ fontSize: '0.68rem' }}>
                                <i className="bi bi-shield-fill-check text-success me-1"></i>
                                Unified SLA Protocol Active
                              </span>
                            </div>
                            <button 
                              className={`btn ${isExpanded ? 'btn-success' : 'btn-outline-success'} btn-sm rounded-pill fw-bold`}
                              onClick={() => setExpandedUlb(isExpanded ? null : ulbItem.ulbName)}
                            >
                              {isExpanded ? 'Hide Wards' : `View ${wardsList.length} Wards`}
                            </button>
                          </div>

                          {/* Expanded Ward Badges Grid */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-top animate-fade-in text-start">
                              <span className="text-secondary small fw-bold d-block mb-2">Active Ward Boundaries:</span>
                              <div className="d-flex flex-wrap gap-2">
                                {wardsList.map((wName, wIdx) => (
                                  <span className="badge bg-light text-secondary border px-2.5 py-1.5 rounded-pill" style={{ fontSize: '0.68rem' }} key={wIdx}>
                                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                    {wName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
                    <i className="bi bi-building display-6 text-muted mb-2"></i>
                    <p className="m-0 small">No {activeUlbTab} registered in {selectedDistrict} district.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. FUTURE READY TECH ROADMAP */}
          <div className="col-lg-5">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-dark text-white h-100 text-start position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
              <div className="position-absolute w-100 h-100 top-0 start-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
              
              <div className="position-relative z-1 mb-4">
                <span className="badge bg-success text-white px-3 py-1.5 mb-2 uppercase fw-bold shadow-sm" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                  Future-Ready Integrations
                </span>
                <h5 className="fw-extrabold text-white m-0">Smart Municipal Roadmap</h5>
                <p className="text-muted small mt-1">Next-generation GovTech framework expansions in development pipeline</p>
              </div>

              <div className="d-flex flex-column gap-3 position-relative z-1">
                {futureFeatures.map((feat, idx) => (
                  <div className="d-flex align-items-start gap-3 p-3 bg-white bg-opacity-5 rounded-3 border border-white border-opacity-10 transition-all hover-light" key={idx}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center p-2.5 ${feat.color}`} style={{ width: '42px', height: '42px', minWidth: '42px' }}>
                      <i className={`bi ${feat.icon} fs-5`}></i>
                    </div>
                    <div>
                      <strong className="text-white d-block small" style={{ fontSize: '0.8rem' }}>{feat.title}</strong>
                      <span className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>{feat.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. ULB PROBLEM MAPPING GUIDE */}
        <div className="card border-0 rounded-4 shadow-sm p-4 bg-light text-start mt-4 animate-slide-up">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-info-circle-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-extrabold text-secondary m-0">Urban Local Body (ULB) Service & Problem Mapping</h5>
              <span className="text-muted small">Understand which municipal body is responsible for your specific type of civic issue</span>
            </div>
          </div>

          <div className="row g-3">
            {[
              {
                title: 'Nagar Nigam (Municipal Corporation)',
                scope: 'Metropolitan Areas (Population > 5 Lakhs)',
                bg: 'bg-primary-soft border-primary-subtle text-primary',
                icon: 'bi-building-fill',
                problems: [
                  'Major main-line trunk sewer choke-up & sewage treatment plants',
                  'Heavy garbage processing, sorting plants & multi-ward secondary dump clearing',
                  'City-wide main avenues, multi-lane concrete roads, bridges & bypass restoration',
                  'Main avenue LED high-mast towers, public junctions & high-voltage grid lines',
                  'Commercial encroachment blockades & heavy vehicle stray cattle relocation'
                ]
              },
              {
                title: 'Nagar Parishad (Municipal Council)',
                scope: 'Medium Cities (Population 1 Lakh - 5 Lakhs)',
                bg: 'bg-success-soft border-success-subtle text-success',
                icon: 'bi-houses-fill',
                problems: [
                  'Sector arterial sewers, connecting drains & localized manhole covers',
                  'Sector commercial markets daily trash collection & community bin operations',
                  'Sector link roads, colony divider painting & pedestrian footpath blocks',
                  'Colony park maintenance, grass trimming, benches & recreational play swings',
                  'Sector standard streetlight poles, residential dark zones & junction switches'
                ]
              },
              {
                title: 'Nagar Palika (Municipal Board)',
                scope: 'Smaller Towns (Population < 1 Lakh)',
                bg: 'bg-accent-soft border-warning-subtle text-warning',
                icon: 'bi-house-fill',
                problems: [
                  'Local neighborhood open gutters, open-air drains & lane sewage flow',
                  'Town residential garbage dumps, domestic manual street sweeping & composting',
                  'Local residential path brick paving, inner village road repairs & culverts',
                  'Neighborhood small public parks, safety boundary fencing & basic cleaning',
                  'Local residential lane bulbs, basic solar lamps & minor grid dark spots'
                ]
              }
            ].map((guide, idx) => (
              <div className="col-md-4" key={idx}>
                <div className="card h-100 border border-light-subtle rounded-3 p-3 bg-white shadow-xs">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center p-2 ${guide.bg}`} style={{ width: '40px', height: '40px' }}>
                      <i className={`bi ${guide.icon} fs-5`}></i>
                    </div>
                    <div>
                      <strong className="text-secondary small d-block" style={{ fontSize: '0.85rem', lineHeight: '1.2' }}>{guide.title}</strong>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>{guide.scope}</span>
                    </div>
                  </div>
                  <span className="text-muted small fw-bold d-block mb-2 text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>Issues Handled & Resolved:</span>
                  <ul className="list-unstyled d-flex flex-column gap-2 m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>
                    {guide.problems.map((prob, pIdx) => (
                      <li className="d-flex align-items-start gap-1.5 text-muted" key={pIdx}>
                        <i className="bi bi-check2-circle text-success mt-0.5" style={{ minWidth: '12px' }}></i>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
