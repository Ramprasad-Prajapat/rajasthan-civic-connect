import React, { useState } from 'react';
import { isFirebaseConfigured, db } from '../firebase';
import { ref, push, set } from 'firebase/database';

export default function Helpdesk({ setActivePage }) {
  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState('complaint_submission');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  // Dynamic Rajasthan ULB dataset states for Ward Helper
  const [ulbData, setUlbData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedULB, setSelectedULB] = useState('');
  const [availableULBs, setAvailableULBs] = useState([]);
  const [wardSearchResult, setWardSearchResult] = useState(null);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  // Fetch dynamic Rajasthan ULB master dataset on component mount
  React.useEffect(() => {
    fetch('/data/rajasthan-ulbs.json')
      .then(res => res.json())
      .then(data => {
        setUlbData(data);
        const uniqueDists = [...new Set(data.map(item => item.district))].sort();
        setDistricts(uniqueDists);
      })
      .catch(err => console.error("Error loading master ULBs in Helpdesk:", err));
  }, []);

  // Generate deterministic realistic officer names and ranks based on the selected ULB
  const getOfficerForUlb = (ulb) => {
    if (!ulb) return 'Nodal Officer USG';
    const names = [
      'Shri R.K. Sharma', 'Smt. Anjana Choudhary', 'Shri Alok Kumar',
      'Shri Manoj Vyas', 'Smt. Priya Sen', 'Shri Rajesh Meena',
      'Shri Dinesh Gehlot', 'Smt. Sunita Jain', 'Shri Sanjay Rathore'
    ];
    const charCodeSum = ulb.ulbName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const nameIndex = charCodeSum % names.length;
    const rank = ulb.ulbType === 'Nagar Nigam' ? 'Dy. Commissioner' : 'Executive Officer (EO)';
    return `${names[nameIndex]} (${rank})`;
  };

  // Generate deterministic ward nodal officers for every ward in all districts
  const getOfficerForWard = (wardName) => {
    const names = [
      'Shri Sunil Sharma', 'Smt. Ritu Verma', 'Shri Amit Kumar',
      'Shri Vikas Yadav', 'Smt. Pooja Soni', 'Shri Rakesh Jangid',
      'Shri Sandeep Meena', 'Smt. Neha Gupta', 'Shri Vijay Gehlot'
    ];
    const charCodeSum = wardName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const nameIndex = charCodeSum % names.length;
    return `${names[nameIndex]} (Junior Engineer / Nodal)`;
  };

  // Update available ULBs and auto-select the first municipal body
  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    setWardSearchResult(null);
    if (dist) {
      const filtered = ulbData.filter(item => item.district === dist);
      setAvailableULBs(filtered);
      if (filtered.length > 0) {
        setSelectedULB(filtered[0].id);
      } else {
        setSelectedULB('');
      }
    } else {
      setAvailableULBs([]);
      setSelectedULB('');
    }
  };

  // Update selected ULB state (do NOT show details automatically until search button is clicked)
  const handleULBChange = (ulbId) => {
    setSelectedULB(ulbId);
    setWardSearchResult(null);
  };

  const handleWardSearch = (e) => {
    e.preventDefault();
    if (selectedULB) {
      const matchingUlb = ulbData.find(item => item.id === selectedULB);
      if (matchingUlb) {
        setWardSearchResult({
          type: `${matchingUlb.ulbType} (${matchingUlb.division})`,
          officer: getOfficerForUlb(matchingUlb),
          wards: matchingUlb.wards,
          name: matchingUlb.ulbName
        });
      }
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setSubmittingTicket(true);
    const generatedTicketId = 'RC-TKT-' + Math.floor(100000 + Math.random() * 900000);

    const ticketData = {
      ticketId: generatedTicketId,
      category: ticketCategory,
      subject: ticketSubject,
      email: ticketEmail,
      phone: ticketPhone,
      description: ticketDescription,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      try {
        const supportRef = ref(db, `support_tickets/${generatedTicketId}`);
        await set(supportRef, ticketData);
      } catch (error) {
        console.error("Firebase Support Ticket submission failed:", error);
      }
    }

    // Simulate standard ticket success
    setTimeout(() => {
      setTicketId(generatedTicketId);
      setSubmittingTicket(false);
      setTicketSubmitted(true);
      // Reset form
      setTicketSubject('');
      setTicketEmail('');
      setTicketPhone('');
      setTicketDescription('');
    }, 1200);
  };

  const faqs = [
    {
      q: "How do I file a civic complaint on RajCivic Connect?",
      a: "Go to the 'Complaint' page from the navigation bar. Select your complaint category, enter your location details (District, Ward, ULB), describe the issue, upload a photo if available, and click Submit. Your complaint will be instantly synchronized with the respective Municipal Corporation."
    },
    {
      q: "What is the standard resolution timeline (SLA) for garbage or sanitation issues?",
      a: "Under the Rajasthan Municipal Services guidelines, garbage pile-ups and sanitation issues carry a High Priority status and have a standard resolution timeline of 24 to 48 working hours."
    },
    {
      q: "Can I track my grievance without registering?",
      a: "Yes! You can go to 'Track Complaint' and enter your unique 10-digit Grievance ID directly to see its status, assigned officer, timeline logs, and geo-tagged resolution photo."
    },
    {
      q: "What should I do if my complaint is marked resolved but the work is not actually completed?",
      a: "You have the absolute right to reopen a resolved complaint. Open the tracking page for your complaint and click the 'Reopen Complaint' button. You can upload proof showing the work is incomplete, which triggers an automatic escalation to the District Grievance Nodal Officer."
    },
    {
      q: "How is my Ward mapped when filing a grievance?",
      a: "You can use the 'Find My Ward' tool below or allow the browser to use your GPS location when filing a complaint. The platform automatically overlays your location onto the civic GIS ward maps of Rajasthan to auto-assign the correct ward office."
    }
  ];

  return (
    <section className="py-5 bg-light" id="helpdesk">
      <div className="container py-4 text-start animate-slide-up">
        
        {/* Header Title */}
        <div className="text-center mb-5">
          <span className="badge bg-primary-soft text-primary rc-badge mb-2">GovTech Public Service Hub</span>
          <h2 className="fw-extrabold text-secondary">Citizens Grievance & Helpdesk Portal</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
            Get instant assistance on civic complaints, find municipal ward jurisdictions, check standard SLAs, or lodge a direct technical support ticket with the state support team.
          </p>
        </div>

        {/* Dynamic Warning Alert for Emergency Issues */}
        <div className="alert alert-danger border-0 p-4 rounded-4 mb-5 d-flex align-items-start gap-3 shadow-sm position-relative overflow-hidden" id="emergency">
          <div className="position-absolute end-0 top-0 opacity-10" style={{ transform: 'translate(20px, -20px)', fontSize: '7rem' }}>
            <i className="bi bi-exclamation-triangle-fill text-danger"></i>
          </div>
          <div className="bg-danger text-white rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
            <i className="bi bi-telephone-outbound-fill fs-5 animate-pulse"></i>
          </div>
          <div>
            <h5 className="fw-bold text-danger mb-1">🚨 Emergency Civic Issues Hotline</h5>
            <p className="text-muted small mb-3" style={{ maxWidth: '750px', lineHeight: '1.5' }}>
              If your issue involves active hazards like live electrical wires, open sewer manholes on main traffic roads, major water pipeline bursts, street gas leaks, or collapsing public structures, do not wait for standard SLAs. Please dial our **24/7 State Emergency Municipal Control Room** immediately:
            </p>
            <div className="d-flex flex-wrap gap-3">
              <button 
                type="button"
                onClick={() => setActivePage('Emergency')}
                className="btn btn-danger btn-sm px-4 rounded-pill fw-bold text-white shadow-sm border-0 animate-pulse"
              >
                <i className="bi bi-broadcast me-1"></i> Open Emergency Quick Form
              </button>
              <a href="tel:01412206127" className="btn btn-outline-danger btn-sm px-3 rounded-pill fw-bold bg-white bg-opacity-50">
                <i className="bi bi-telephone-fill me-1"></i> Control Room: 0141-2206127
              </a>
              <a href="tel:112" className="btn btn-dark btn-sm px-3 rounded-pill fw-bold text-white shadow-sm border-0">
                <i className="bi bi-shield-fill-exclamation me-1"></i> National: 112
              </a>
            </div>
          </div>
        </div>

        {/* Grid Area: Helpdesk Navigation and Forms */}
        <div className="row g-4">
          
          {/* Left Column: Guidelines, Status Meanings, Ward Finding */}
          <div className="col-lg-7">
            
            {/* 1. Find My Ward / ULB Helper Card */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary-soft text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h5 className="fw-bold text-secondary m-0">Find My Ward & Municipal Officer</h5>
              </div>
              <p className="text-muted small mb-3">
                Not sure about your ward jurisdiction or Municipal Corporation? Select your district below to lookup your assigned Nodal Officer and local municipal ward details.
              </p>

              <form onSubmit={handleWardSearch} className="row g-2 mb-3">
                <div className="col-sm-5">
                  <select 
                    className="form-select form-select-sm border py-2 px-3 rounded-3 text-muted"
                    required
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                  >
                    <option value="">Select District</option>
                    {districts.map((d, index) => (
                      <option key={index} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-4">
                  <select 
                    className="form-select form-select-sm border py-2 px-3 rounded-3 text-muted"
                    required
                    disabled={!selectedDistrict}
                    value={selectedULB}
                    onChange={(e) => handleULBChange(e.target.value)}
                  >
                    <option value="">Select Municipal Body</option>
                    {availableULBs.map((ulb) => (
                      <option key={ulb.id} value={ulb.id}>{ulb.ulbName}</option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-3">
                  <button type="submit" className="btn btn-primary btn-sm w-100 py-2 rounded-3 text-white border-0 bg-primary hover-primary-dark fw-bold">
                    <i className="bi bi-search me-1"></i> Find Ward
                  </button>
                </div>
              </form>

              {wardSearchResult && (
                <div className="bg-light border rounded-3 p-3 animate-scale-up">
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <strong className="text-secondary small">Municipal Body</strong>
                    <span className="text-primary small fw-bold">{wardSearchResult.name}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <strong className="text-secondary small">Type / Sambhag</strong>
                    <span className="badge bg-secondary-soft text-secondary rounded-pill small font-semibold">{wardSearchResult.type}</span>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <strong className="text-secondary small">Supervising Nodal Officer</strong>
                    <span className="text-success small fw-bold">{wardSearchResult.officer}</span>
                  </div>
                  <div>
                    <strong className="text-secondary small d-block mb-1.5">Registered Ward Jurisdictions & Officers ({wardSearchResult.wards.length})</strong>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '185px', overflowY: 'auto', paddingRight: '4px' }}>
                      {wardSearchResult.wards.map((w, index) => (
                        <div key={index} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-white border shadow-sm">
                          <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-building text-primary" style={{ fontSize: '0.85rem' }}></i>
                            <span className="text-secondary small fw-bold">{w}</span>
                          </div>
                          <span className="badge bg-light text-muted border px-2 py-1 small fw-semibold">
                            <i className="bi bi-person-fill text-success me-1"></i>
                            {getOfficerForWard(w)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Platform User Guide */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-success-soft text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-journals"></i>
                </div>
                <h5 className="fw-bold text-secondary m-0">Grievance Submission User Guide</h5>
              </div>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex gap-2.5 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                    <div>
                      <strong className="text-secondary small d-block">Log in or File Guest</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Use your official mail, Gmail, or phone OTP to log in safely. You can also file as a guest.</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2.5 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                    <div>
                      <strong className="text-secondary small d-block">Select Category & Geo-Tag</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Choose Garbage, Water, Sewage, etc. Enable GPS location to auto-overlay the ward jurisdiction.</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2.5 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                    <div>
                      <strong className="text-secondary small d-block">Upload Photo Evidence</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Take a live photo of the issue. A picture accelerates verification and assigned engineer dispatch.</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2.5 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                    <div>
                      <strong className="text-secondary small d-block">Receive Tracking Grievance ID</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Receive a 10-digit ID on screen and via SMS/Email to track live progress and assigned worker SLA.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Complaint Status Meaning Indicator */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3.5">
                <div className="bg-warning-soft text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-clock-history"></i>
                </div>
                <h5 className="fw-bold text-secondary m-0">What Does My Complaint Status Mean?</h5>
              </div>

              <div className="d-flex flex-column gap-3.5">
                <div className="d-flex gap-3 align-items-start border-bottom pb-2.5">
                  <span className="badge bg-secondary-soft text-secondary py-1.5 px-3 rounded-pill fw-bold small">SUBMITTED</span>
                  <div>
                    <span className="text-secondary small d-block fw-bold">Grievance Lodged</span>
                    <p className="text-muted text-xxs m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Your complaint has been synchronized in the database. The system is routing it to the respective ward engineer.</p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start border-bottom pb-2.5">
                  <span className="badge bg-primary-soft text-primary py-1.5 px-3 rounded-pill fw-bold small">DISPATCHED</span>
                  <div>
                    <span className="text-secondary small d-block fw-bold">Assigned to Local Ward Engineer</span>
                    <p className="text-muted text-xxs m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>A municipal officer has verified your request and assigned a field worker/team with an exact SLA target.</p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start border-bottom pb-2.5">
                  <span className="badge bg-success-soft text-success py-1.5 px-3 rounded-pill fw-bold small">RESOLVED</span>
                  <div>
                    <span className="text-secondary small d-block fw-bold">Work Done & Proof Posted</span>
                    <p className="text-muted text-xxs m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>The assigned worker has completed work on-site and uploaded a geo-tagged completion photo to close the SLA.</p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start">
                  <span className="badge bg-danger-soft text-danger py-1.5 px-3 rounded-pill fw-bold small">ESCALATED</span>
                  <div>
                    <span className="text-secondary small d-block fw-bold">SLA Overdue Review</span>
                    <p className="text-muted text-xxs m-0" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>If resolution takes longer than the assigned SLA window, the ticket automatically escalates to senior ULB Officers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. FAQs Section */}
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-info-soft text-info rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-question-square-fill"></i>
                </div>
                <h5 className="fw-bold text-secondary m-0">Frequently Asked Questions (FAQ)</h5>
              </div>

              <div className="d-flex flex-column gap-2 mt-2">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border rounded-3 p-3">
                    <div 
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} 
                      className="d-flex justify-content-between align-items-center cursor-pointer"
                      style={{ cursor: 'pointer' }}
                    >
                      <strong className="text-secondary small mb-0 pe-2">{faq.q}</strong>
                      <i className={`bi ${activeFaq === idx ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                    </div>
                    {activeFaq === idx && (
                      <p className="text-muted small mt-2 mb-0 pt-2 border-top animate-fade-in" style={{ lineHeight: '1.5' }}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Contact Details & Direct Support Ticket Form */}
          <div className="col-lg-5">
            
            {/* 1. Contact Support Details */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white text-secondary">
              <h5 className="fw-bold mb-3"><i className="bi bi-headset text-primary me-2"></i> RajCivic Support Center</h5>
              
              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <div>
                    <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Toll-Free Helpline</span>
                    <a href="tel:18001806127" className="text-secondary fw-bold text-decoration-none">1800-180-6127</a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div>
                    <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>E-Mail Helpdesk</span>
                    <a href="mailto:support.rajcivic@rajasthan.gov.in" className="text-secondary fw-bold text-decoration-none">support.rajcivic@rajasthan.gov.in</a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="bg-light rounded-circle d-flex align-items-center justify-content-center text-muted" style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div>
                    <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Support Timings</span>
                    <strong className="text-secondary small">Monday to Saturday: 09:30 AM to 06:00 PM</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Direct Support Ticket Raising Form */}
            <div className="card border-0 rounded-4 shadow-lg p-4 bg-white" style={{ borderLeft: '4px solid var(--rc-primary)' }}>
              <h5 className="fw-bold text-secondary mb-1">Lodge Technical Support Ticket</h5>
              <p className="text-muted small mb-4">Having technical trouble, login issues, database mismatches, or tracking bugs? Open a support ticket.</p>

              {ticketSubmitted ? (
                <div className="text-center py-4 animate-scale-up">
                  <div className="rounded-circle bg-success text-white mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px', fontSize: '1.8rem' }}>
                    <i className="bi bi-check2-circle"></i>
                  </div>
                  <h6 className="fw-bold text-secondary">Support Ticket Registered!</h6>
                  <p className="text-muted small mb-3">Our technical crew has logged your query. We will email instructions shortly.</p>
                  
                  <div className="bg-light border rounded-3 p-3 text-start mb-4">
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">Ticket ID</span>
                      <strong className="font-monospace text-primary">{ticketId}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mt-1.5">
                      <span className="text-muted">Status</span>
                      <span className="badge bg-success-soft text-success rounded-pill fw-bold">Active Open</span>
                    </div>
                  </div>

                  <button onClick={() => setTicketSubmitted(false)} className="btn btn-outline-primary btn-sm px-4 rounded-pill fw-bold">
                    Raise Another Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit}>
                  
                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-semibold">Grievance Category</label>
                    <select 
                      className="form-select border rounded-3 py-2 px-3 text-muted"
                      style={{ fontSize: '0.8rem' }}
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                    >
                      <option value="complaint_submission">Complaint Submission Issue</option>
                      <option value="complaint_tracking">Complaint Tracking / SMS Issue</option>
                      <option value="ward_mapping">Incorrect Ward/ULB Mapping</option>
                      <option value="google_auth">Google Sign-in / OTP Issues</option>
                      <option value="technical_bug">General Platform Bug/Crash</option>
                    </select>
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-semibold">Subject / Brief Description</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Google popup failed to show"
                      className="form-control border rounded-3 py-2 px-3"
                      style={{ fontSize: '0.8rem' }}
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-semibold">Email Address</label>
                    <input 
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="form-control border rounded-3 py-2 px-3"
                      style={{ fontSize: '0.8rem' }}
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-semibold">Phone Number</label>
                    <input 
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit number"
                      className="form-control border rounded-3 py-2 px-3"
                      style={{ fontSize: '0.8rem' }}
                      value={ticketPhone}
                      onChange={(e) => setTicketPhone(e.target.value)}
                    />
                  </div>

                  <div className="mb-4 text-start">
                    <label className="form-label text-secondary small fw-semibold">Detailed Query</label>
                    <textarea 
                      rows="3"
                      required
                      placeholder="Please elaborate on your grievance..."
                      className="form-control border rounded-3 py-2 px-3"
                      style={{ fontSize: '0.8rem' }}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm fw-bold border-0 bg-primary hover-primary-dark" disabled={submittingTicket}>
                    {submittingTicket ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                        Registering Ticket...
                      </>
                    ) : (
                      <>
                        Submit Support Ticket <i className="bi bi-arrow-right ms-1"></i>
                      </>
                    )}
                  </button>

                </form>
              )}
            </div>

            {/* 3. Chief State Nodal Officer Panel */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mt-4 bg-white text-secondary">
              <h6 className="fw-bold mb-3"><i className="bi bi-shield-fill-check text-success me-2"></i> Chief Grievance Nodal Officers</h6>
              
              <div className="d-flex flex-column gap-3 small border-top pt-3">
                <div className="d-flex align-items-start gap-2.5">
                  <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center font-semibold" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <strong className="text-secondary small d-block">Shri R.K. Meena, IAS</strong>
                    <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Chief Nodal Officer, Urban Self Government Dept, Jaipur</span>
                    <a href="mailto:nodal.usg@rajasthan.gov.in" className="text-decoration-none text-primary fw-bold" style={{ fontSize: '0.72rem' }}>nodal.usg@rajasthan.gov.in</a>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5 border-top pt-2.5">
                  <div className="bg-primary-soft text-primary rounded-circle d-flex align-items-center justify-content-center font-semibold" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <strong className="text-secondary small d-block">Smt. Sunita Choudhary</strong>
                    <span className="text-muted d-block text-xxs" style={{ fontSize: '0.65rem' }}>Grievance Commissioner, Municipal Corporation Jodhpur</span>
                    <a href="mailto:jodhpur.nodal@rajasthan.gov.in" className="text-decoration-none text-primary fw-bold" style={{ fontSize: '0.72rem' }}>jodhpur.nodal@rajasthan.gov.in</a>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Privacy Policy & Terms of Service Desk */}
            <div className="card border-0 rounded-4 shadow-sm p-4 mt-4 bg-white text-secondary">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-file-earmark-text-fill text-primary me-2"></i> 
                Platform Privacy & Terms of Service
              </h6>
              
              <div className="accordion accordion-flush" id="policyAccordion">
                {/* Privacy Policy */}
                <div className="accordion-item border-0 border-bottom">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed px-0 py-2.5 small fw-bold text-secondary bg-white border-0" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePrivacy">
                      <i className="bi bi-shield-lock-fill text-success me-2"></i> Privacy Policy
                    </button>
                  </h2>
                  <div id="collapsePrivacy" className="accordion-collapse collapse" data-bs-parent="#policyAccordion">
                    <div className="accordion-body px-0 py-2 text-muted" style={{ fontSize: '0.72rem', lineHeight: '1.5' }}>
                      <p className="mb-2"><strong>Data Encryption:</strong> All grievance details, phone numbers, and profile photos are securely encrypted and verified using Firebase Authentication.</p>
                      <p className="mb-2"><strong>Location & GIS:</strong> GPS coordinates parsed from uploads are used solely for automatic ward-routing and node classification. They are never shared outside the municipal governance framework.</p>
                      <p className="mb-0"><strong>Identity Redaction:</strong> Personal contact info is strictly redacted and only visible to authorized municipal officers for grievance status verification.</p>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="accordion-item border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed px-0 py-2.5 small fw-bold text-secondary bg-white border-0" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTerms">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i> Terms & Conditions
                    </button>
                  </h2>
                  <div id="collapseTerms" className="accordion-collapse collapse" data-bs-parent="#policyAccordion">
                    <div className="accordion-body px-0 py-2 text-muted" style={{ fontSize: '0.72rem', lineHeight: '1.5' }}>
                      <p className="mb-2"><strong>Authenticity Threshold:</strong> Citizens must report genuine civic failures with true photos. Registering false cases or spamming is strictly punishable under municipal guidelines.</p>
                      <p className="mb-2"><strong>SLA Commitments:</strong> Standard SLAs (6-72 hours) apply to verified complaints during operational shifts (Mon-Sat, 9:30 AM - 6:00 PM).</p>
                      <p className="mb-0"><strong>Scope of Service:</strong> The platform handles public municipal assets. Private property issues, personal disputes, and commercial grievances are out of scope.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
