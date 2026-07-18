import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, auth as firebaseAuth } from '../firebase';
import { createEmergency, updateEmergencyStatus } from '../firestoreService';

export default function EmergencyHelp() {
  // Authentication check for auto-filling reporter details
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          const mPhone = '98290' + Math.floor(10000 + Math.random() * 90000);
          const mName = user.displayName || user.email.split('@')[0];
          setCurrentUser({
            uid: user.uid,
            name: mName,
            email: user.email,
            phone: mPhone, // Mock phone for demonstration
            role: user.email.endsWith('.gov.in') ? 'Official Grievance Desk' : 'Verified Citizen'
          });
          setReporterName(mName);
          setReporterPhone(mPhone);
        } else {
          setCurrentUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Form Fields
  const [selectedCategory, setSelectedCategory] = useState(''); // 'road' | 'electricity' | 'drainage' | 'water' | 'health' | 'animal' | 'safety'
  const [selectedSubtype, setSelectedSubtype] = useState('');
  const [useGps, setUseGps] = useState(true);
  const [gpsCoords, setGpsCoords] = useState('Latitude: 26.9124° N, Longitude: 75.7873° E (Jaipur Central Office)');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [landmark, setLandmark] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [description, setDescription] = useState('');
  const [confirmEmergency, setConfirmEmergency] = useState(false);

  // File Upload States
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // OTP Verification States for Guest
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSendOtp = () => {
    if (!reporterPhone || reporterPhone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number first.");
      return;
    }
    setOtpSent(true);
    alert(`Mock OTP sent to ${reporterPhone}. Enter any 4 digits to verify.`);
  };

  const handleVerifyOtp = () => {
    if (otpCode.length === 4) {
      setOtpVerified(true);
      alert("OTP Verified Successfully!");
    } else {
      alert("Please enter a valid 4-digit OTP.");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoUploaded(true);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUploaded(true);
    }
  };

  // Simulation Workflow states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null); // Active emergency object
  const [slaCountdown, setSlaCountdown] = useState(3600); // 1 hour default in seconds
  const [simulationLogs, setSimulationLogs] = useState([]);
  
  // Officer Action simulation
  const [officerStatus, setOfficerStatus] = useState('Assigned'); // 'Assigned' | 'Accepted' | 'Invalid' | 'Escalated'
  const [invalidReason, setInvalidReason] = useState('');
  const [showInvalidForm, setShowInvalidForm] = useState(false);

  // Trust score
  const citizenTrustScore = currentUser ? 98 : 74;

  const emergencySubtypes = {
    road: [
      'Big hole on road',
      'Deep pothole causing accident risk',
      'Road cave-in / road sinking',
      'Open drain on road',
      'Tree fallen on road',
      'Missing manhole cover on road'
    ],
    electricity: [
      'Transformer sparking',
      'Electric pole sparking',
      'Open electric wire',
      'Hanging live wire',
      'Electric current in pole',
      'Fire near transformer',
      'Open electric box',
      'Water near electric pole'
    ],
    drainage: [
      'Sewer overflow',
      'Open manhole',
      'Manhole cover missing',
      'Drain water entering public area',
      'Deep open drain without cover',
      'Bad sewage overflow'
    ],
    water: [
      'Major water pipeline burst',
      'Heavy water leakage on road',
      'Dirty water supply',
      'Water leakage near electric pole',
      'Road damage due to water leakage'
    ],
    health: [
      'Dead animal on road',
      'Waste near school/hospital',
      'Garbage burning smoke',
      'Dangerous chemical smell',
      'Public toilet overflowing',
      'Large garbage pile causing disease risk'
    ],
    animal: [
      'Aggressive stray dog group',
      'Stray cattle blocking road',
      'Injured animal',
      'Animal stuck in drain',
      'Dead animal pickup'
    ],
    safety: [
      'Broken public wall',
      'Damaged pole',
      'Dangerous construction debris',
      'Broken park equipment',
      'Hanging sign board'
    ]
  };

  // Auto GPS Mock Trigger
  const handleGpsToggle = (e) => {
    const active = e.target.checked;
    setUseGps(active);
    if (active) {
      setGpsCoords('Latitude: 26.9124° N, Longitude: 75.7873° E (Jaipur Central Office)');
    } else {
      setGpsCoords('');
    }
  };

  // Determine Priority, SLA timer and Mapped Department based on chosen subtype
  const getEmergencyPriority = (subtype) => {
    if (!subtype) return { priority: 'High', sla: '4 hours', timeSec: 14400, dept: 'Public Works' };
    
    const lowSub = subtype.toLowerCase();
    
    // Critical / 1 Hour / Electrical Department
    if (lowSub.includes('transformer sparking') || lowSub.includes('open electric wire') || lowSub.includes('hanging live wire') || lowSub.includes('fire near transformer') || lowSub.includes('electric current')) {
      return { priority: 'Critical', sla: '1 hour', timeSec: 3600, dept: 'Electrical Department' };
    }
    
    // High / 2 Hours / Drainage / Sewer
    if (lowSub.includes('open manhole') || lowSub.includes('manhole cover missing')) {
      return { priority: 'High', sla: '2 hours', timeSec: 7200, dept: 'Drainage & Sewer Department' };
    }
    
    // High / 4 Hours / Road Maintenance
    if (lowSub.includes('hole') || lowSub.includes('pothole') || lowSub.includes('cave-in') || lowSub.includes('debris')) {
      return { priority: 'High', sla: '4 hours', timeSec: 14400, dept: 'Road Maintenance Department' };
    }

    // High / 4 Hours / Water Supply
    if (lowSub.includes('pipeline burst') || lowSub.includes('leakage')) {
      return { priority: 'High', sla: '4 hours', timeSec: 14400, dept: 'Water Supply Department' };
    }

    // High / 6 Hours / Sanitation
    if (lowSub.includes('sewer overflow') || lowSub.includes('sewage')) {
      return { priority: 'High', sla: '6 hours', timeSec: 21600, dept: 'Drainage & Sewer Department' };
    }

    // High / 6 Hours / Sanitation
    if (lowSub.includes('dead animal') || lowSub.includes('garbage') || lowSub.includes('toilet') || lowSub.includes('waste')) {
      return { priority: 'High', sla: '6 hours', timeSec: 21600, dept: 'Sanitation Department' };
    }

    // High / 4 Hours / Public Works / Garden
    if (lowSub.includes('tree fallen')) {
      return { priority: 'High', sla: '4 hours', timeSec: 14400, dept: 'Public Works & Garden Department' };
    }

    // High / 6 Hours / Animal Control
    if (lowSub.includes('dog') || lowSub.includes('stray') || lowSub.includes('cattle') || lowSub.includes('animal')) {
      return { priority: 'High', sla: '6 hours', timeSec: 21600, dept: 'Animal Control Department' };
    }

    return { priority: 'High', sla: '4 hours', timeSec: 14400, dept: 'Public Works Department' };
  };

  // SLA timer countdown hook
  useEffect(() => {
    let interval = null;
    if (activeAlert && slaCountdown > 0 && officerStatus === 'Assigned') {
      interval = setInterval(() => {
        setSlaCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAlert, slaCountdown, officerStatus]);

  // Submit Emergency handler
  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    if (!confirmEmergency) {
      alert("You must verify and check the emergency confirmation box.");
      return;
    }
    if (!otpVerified) {
      alert("Please verify your mobile number using OTP before submitting the emergency.");
      return;
    }

    setIsSubmitting(true);
    const districtKey = 'JOD';
    const ulbKey = 'NNJ';
    const generatedId = `EMG-${districtKey}-${ulbKey}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const metrics = getEmergencyPriority(selectedSubtype);

    const emergencyData = {
      emergencyId: generatedId,
      category: selectedCategory,
      subtype: selectedSubtype,
      gps: gpsCoords,
      landmark: landmark,
      description: description,
      priority: metrics.priority,
      sla: metrics.sla,
      department: metrics.dept,
      status: 'Assigned',
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      trustScore: citizenTrustScore,
      reporter: currentUser ? {
        uid: currentUser.uid,
        name: currentUser.name,
        phone: currentUser.phone,
        email: currentUser.email,
        role: currentUser.role
      } : {
        name: reporterName || 'Guest Citizen',
        phone: reporterPhone,
        email: reporterEmail || 'N/A',
        role: 'Unverified Guest'
      }
    };

    // Firebase database writer
    try {
      await createEmergency(emergencyData, photoFile);
    } catch (err) {
      console.error("Firestore Emergency sync failed:", err);
    }

    setTimeout(() => {
      setActiveAlert(emergencyData);
      setSlaCountdown(metrics.timeSec);
      setOfficerStatus('Assigned');
      setShowInvalidForm(false);
      setSimulationLogs([
        `[${emergencyData.timestamp}] 🚨 Emergency alert generated: Mapped ${generatedId}`,
        `[${emergencyData.timestamp}] 📡 Auto-GPS mapping successful: Assigned Ward 3 District Centroid.`,
        `[${emergencyData.timestamp}] 🏢 Auto-routed directly to the [${metrics.dept}]`,
        `[${emergencyData.timestamp}] ⏱️ Strict SLA Timer initialized at ${metrics.sla} (${metrics.priority} Priority).`,
        `[${emergencyData.timestamp}] 📳 SMS grievance receipt broadcasted to reporter's device.`
      ]);
      setIsSubmitting(false);
    }, 1500);
  };

  // Simulate Officer Actions
  const triggerOfficerAction = async (action) => {
    const time = new Date().toLocaleTimeString();
    if (!activeAlert) return;
    
    try {
      if (action === 'accept') {
        setOfficerStatus('Accepted');
        await updateEmergencyStatus(activeAlert.emergencyId, 'Accepted');
        setSimulationLogs((prev) => [
          ...prev,
          `[${time}] ✅ Case accepted by Municipal Grievance Officer.`,
          `[${time}] 👷 Assigned nearest Rapid Action sanitary/electric field crew (Team 4).`,
          `[${time}] 🚚 Field vehicle dispatched to coordinates with dispatch timestamp.`
        ]);
      } else if (action === 'escalate') {
        setOfficerStatus('Escalated');
        await updateEmergencyStatus(activeAlert.emergencyId, 'Escalated');
        setSimulationLogs((prev) => [
          ...prev,
          `[${time}] ⚠️ SLA Warning triggered. Escalated case directly to Department Head.`,
          `[${time}] 📧 Automated warning email logged to State Grievance Commissioner.`
        ]);
      } else if (action === 'invalid') {
        if (!invalidReason) {
          alert("Please select a reason to mark the emergency as invalid.");
          return;
        }
        setOfficerStatus('Invalid');
        setShowInvalidForm(false);
        await updateEmergencyStatus(activeAlert.emergencyId, 'Invalid', invalidReason);
        setSimulationLogs((prev) => [
          ...prev,
          `[${time}] ❌ Alert flagged as INVALID by checking desk.`,
          `[${time}] 🔍 Audit Reason: "${invalidReason}"`,
          `[${time}] 📉 Reporter trust rating penalty applied (-15 Trust Points).`
        ]);
      }
    } catch (err) {
      console.error("Failed to update emergency status:", err);
    }
  };

  // Convert seconds to human-readable timer
  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-5 bg-light" id="emergency-desk">
      <div className="container py-4 text-start animate-slide-up">
        
        {/* Title */}
        <div className="text-center mb-5">
          <span className="badge bg-danger text-white rc-badge mb-2 animate-pulse">24/7 Rapid Response Desk</span>
          <h2 className="fw-extrabold text-secondary">Emergency Grievance Gateway</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
            Report dangerous public safety hazards or critical utility damages. Emergency tickets skip standard queues and trigger immediate municipal crew dispatch.
          </p>
        </div>

        {/* Outer Grid: Form on the left, Simulation and logs on the right */}
        <div className="row g-4 justify-content-center">
          
          {/* LEFT: Fast Emergency Quick Form */}
          <div className="col-lg-6">
            <div className="card border-0 p-4 shadow-lg bg-white rounded-4" style={{ borderTop: '6px solid var(--bs-danger)' }}>
              
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-danger text-white rounded-circle p-2.5 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                  <i className="bi bi-shield-fill-exclamation fs-4 animate-pulse"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-danger mb-0.5">Rapid Grievance Form</h5>
                  <span className="text-muted text-xxs" style={{ fontSize: '0.7rem' }}>Skip queues. Provide minimum parameters to route the issue.</span>
                </div>
              </div>

              <form onSubmit={handleEmergencySubmit}>
                
                {/* 1. Category selector */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">Emergency Class</label>
                  <div className="row g-2">
                    {[
                      { id: 'electricity', label: 'Electricity Sparking/Wires', icon: 'bi-lightning-fill', color: 'text-warning border-warning bg-warning bg-opacity-5' },
                      { id: 'drainage', label: 'Sewage/Manholes', icon: 'bi-droplet-fill', color: 'text-primary border-primary bg-primary bg-opacity-5' },
                      { id: 'road', label: 'Road Cave-in/Crater', icon: 'bi-truck', color: 'text-secondary border-secondary bg-light' },
                      { id: 'water', label: 'Water Main Burst', icon: 'bi-water', color: 'text-info border-info bg-info bg-opacity-5' },
                      { id: 'health', label: 'Public Health Risks', icon: 'bi-virus', color: 'text-success border-success bg-success bg-opacity-5' },
                      { id: 'animal', label: 'Animal Attack/Injury', icon: 'bi-bug-fill', color: 'text-danger border-danger bg-danger bg-opacity-5' }
                    ].map((cat) => (
                      <div className="col-6" key={cat.id}>
                        <button
                          type="button"
                          onClick={() => { setSelectedCategory(cat.id); setSelectedSubtype(''); }}
                          className={`btn btn-sm w-100 py-2.5 rounded-3 text-start d-flex align-items-center gap-2 border ${selectedCategory === cat.id ? cat.color + ' border-2 fw-bold shadow-sm' : 'border-light hover-light text-muted bg-white'}`}
                        >
                          <i className={`bi ${cat.icon}`}></i>
                          <span style={{ fontSize: '0.72rem' }}>{cat.label}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Subtype Select Dropdown */}
                {selectedCategory && (
                  <div className="mb-3 animate-scale-up text-start">
                    <label className="form-label text-secondary small fw-semibold">Specific Safety Incident</label>
                    <select
                      className="form-select border rounded-3 py-2 px-3 text-muted"
                      style={{ fontSize: '0.8rem' }}
                      required
                      value={selectedSubtype}
                      onChange={(e) => setSelectedSubtype(e.target.value)}
                    >
                      <option value="">Choose the specific emergency description...</option>
                      {emergencySubtypes[selectedCategory].map((sub, idx) => (
                        <option value={sub} key={idx}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. GPS Location details */}
                <div className="mb-3 text-start">
                  <div className="d-flex justify-content-between align-items-center mb-1.5">
                    <label className="form-label text-secondary small fw-semibold mb-0">GPS Location Coordinates</label>
                    <div className="form-check form-switch mb-0">
                      <input 
                        className="form-check-input text-danger cursor-pointer" 
                        type="checkbox" 
                        id="gpsCheck" 
                        checked={useGps} 
                        onChange={handleGpsToggle}
                      />
                      <label className="form-check-label text-muted small cursor-pointer" htmlFor="gpsCheck">Auto GPS</label>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-group-text bg-light text-danger"><i className="bi bi-geo-alt-fill"></i></span>
                    <input
                      type="text"
                      required
                      readOnly={useGps}
                      placeholder={useGps ? "Acquiring coordinates..." : "Type location manually..."}
                      className="form-control border-start-0 text-muted"
                      style={{ fontSize: '0.8rem' }}
                      value={gpsCoords}
                      onChange={(e) => setGpsCoords(e.target.value)}
                    />
                  </div>
                </div>

                {/* 4. Landmark optional input */}
                <div className="mb-3 text-start">
                  <label className="form-label text-secondary small fw-semibold">Nearby Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite Jaipur Central Gate"
                    className="form-control border rounded-3 py-2 px-3"
                    style={{ fontSize: '0.8rem' }}
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>

                {/* 5. Photo & Video Upload */}
                <div className="row g-2 mb-3 text-start">
                  <div className="col-6">
                    <label className="form-label text-secondary small fw-semibold">Photo Proof (Required)</label>
                    <div 
                      onClick={() => document.getElementById('emergencyPhotoInput').click()} 
                      className={`border border-dashed rounded-3 p-3 text-center cursor-pointer hover-light d-flex flex-column align-items-center justify-content-center ${photoUploaded ? 'border-success bg-success bg-opacity-5' : ''}`}
                      style={{ cursor: 'pointer', minHeight: '80px' }}
                    >
                      <input type="file" id="emergencyPhotoInput" accept="image/*" className="d-none" onChange={handlePhotoUpload} />
                      <i className={`bi ${photoUploaded ? 'bi-patch-check-fill text-success fs-4' : 'bi-camera-fill text-muted fs-4'}`}></i>
                      <span className="text-muted d-block mt-1" style={{ fontSize: '0.62rem' }}>
                        {photoUploaded ? 'Photo Uploaded (Verified)' : 'Click to Upload Photo'}
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small fw-semibold">Video Proof (Optional)</label>
                    <div 
                      onClick={() => document.getElementById('emergencyVideoInput').click()} 
                      className={`border border-dashed rounded-3 p-3 text-center cursor-pointer hover-light d-flex flex-column align-items-center justify-content-center ${videoUploaded ? 'border-primary bg-primary bg-opacity-5' : ''}`}
                      style={{ cursor: 'pointer', minHeight: '80px' }}
                    >
                      <input type="file" id="emergencyVideoInput" accept="video/*" className="d-none" onChange={handleVideoUpload} />
                      <i className={`bi ${videoUploaded ? 'bi-patch-check-fill text-primary fs-4' : 'bi-play-btn-fill text-muted fs-4'}`}></i>
                      <span className="text-muted d-block mt-1" style={{ fontSize: '0.62rem' }}>
                        {videoUploaded ? 'Video Uploaded (Verified)' : 'Click to Upload Video'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Reporter Info */}
                <div className="row g-2 mb-3 text-start animate-scale-up border p-3 rounded-3 bg-white shadow-sm position-relative">
                  <span className="position-absolute top-0 start-0 translate-middle-y badge bg-danger ms-3">Authentication Required</span>
                  
                  <div className="col-6 mt-3">
                      <label className="form-label text-secondary small fw-semibold">Mobile Number</label>
                      <div className="input-group">
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          placeholder="Enter 10 digit phone"
                          className="form-control border rounded-start-3 py-2 px-3"
                          style={{ fontSize: '0.8rem' }}
                          value={reporterPhone}
                          onChange={(e) => setReporterPhone(e.target.value)}
                          disabled={otpVerified}
                        />
                        <button 
                          type="button" 
                          className={`btn ${otpVerified ? 'btn-success' : 'btn-outline-danger'} border fw-bold`} 
                          onClick={handleSendOtp} 
                          disabled={otpVerified || reporterPhone.length !== 10}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {otpVerified ? <i className="bi bi-check-circle-fill"></i> : (otpSent ? 'Resend' : 'Get OTP')}
                        </button>
                      </div>
                    </div>
                    <div className="col-6 mt-3">
                      <label className="form-label text-secondary small fw-semibold">Reporter Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Sharma"
                        className="form-control border rounded-3 py-2 px-3"
                        style={{ fontSize: '0.8rem' }}
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        disabled={otpVerified}
                        required
                      />
                    </div>

                    {/* OTP Entry UI */}
                    {otpSent && !otpVerified && (
                      <div className="col-12 mt-2 animate-slide-up">
                        <div className="d-flex align-items-end gap-2 bg-light p-2 rounded-3 border border-danger border-opacity-25">
                          <div className="flex-grow-1">
                            <label className="form-label text-danger small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Enter 4-Digit Security Code</label>
                            <input
                              type="text"
                              maxLength="4"
                              placeholder="* * * *"
                              className="form-control border-danger border-opacity-50 text-center fw-bold text-dark"
                              style={{ letterSpacing: '0.5em', fontSize: '1rem' }}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            />
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-danger text-white fw-bold px-3 py-2" 
                            onClick={handleVerifyOtp}
                            disabled={otpCode.length !== 4}
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                {/* 7. Short description */}
                <div className="mb-3 text-start">
                  <label className="form-label text-secondary small fw-semibold">Brief Incident Description (Optional)</label>
                  <textarea
                    rows="2"
                    placeholder="Provide optional details (e.g. Sparking since last 2 hours...)"
                    className="form-control border rounded-3 py-2 px-3"
                    style={{ fontSize: '0.8rem' }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* 8. Confirm Box */}
                <div className="mb-4 text-start">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input text-danger" 
                      id="confirmCheck" 
                      checked={confirmEmergency}
                      onChange={(e) => setConfirmEmergency(e.target.checked)}
                    />
                    <label className="form-check-label text-muted small" htmlFor="confirmCheck" style={{ cursor: 'pointer', fontSize: '0.72rem', lineHeight: '1.4' }}>
                      <strong className="text-danger">I confirm this is a real civic emergency.</strong> I understand that registering false emergencies or fake alerts carrying public safety risks triggers penal security code actions under Rajasthan Municipal Anti-Spam provisions.
                    </label>
                  </div>
                </div>

                <button type="submit" className="btn btn-danger w-100 py-2.5 rounded-pill shadow fw-bold border-0 bg-danger hover-danger-dark" disabled={isSubmitting || !photoUploaded}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1.5" role="status"></span>
                      Broadcasting Incident Coordinate...
                    </>
                  ) : (
                    <>
                      Lodge Emergency Alert <i className="bi bi-broadcast ms-1"></i>
                    </>
                  )}
                </button>
                
                {!photoUploaded && (
                  <span className="text-danger d-block text-center mt-2" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-info-circle-fill"></i> You must upload a photo proof to submit the emergency alert.
                  </span>
                )}

              </form>

            </div>
          </div>

          {/* RIGHT: Real-time Dispatcher and Logs Board */}
          <div className="col-lg-6">
            
            {activeAlert ? (
              <div className="animate-scale-up d-flex flex-column gap-3.5 h-100">
                
                {/* 1. DISPATCHED CASE METRIC SHEET */}
                <div className="card border-0 p-4 shadow-sm bg-white rounded-4" style={{ borderLeft: '5px solid #10b981' }}>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <span className="badge bg-success-soft text-success rc-badge">LIVE CASE ACTIVE</span>
                    <strong className="font-monospace text-primary" style={{ fontSize: '0.8rem' }}>{activeAlert.emergencyId}</strong>
                  </div>

                  <h5 className="fw-extrabold text-secondary mb-1">{activeAlert.subtype}</h5>
                  <p className="text-muted text-xxs mb-3"><i className="bi bi-geo-alt-fill text-danger"></i> {activeAlert.gps}</p>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="bg-light p-2.5 rounded-3 border text-start">
                        <span className="text-muted text-xxs d-block" style={{ fontSize: '0.62rem' }}>Priority Classification</span>
                        <strong className="text-danger small"><i className="bi bi-exclamation-triangle-fill"></i> {activeAlert.priority} Priority</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="bg-light p-2.5 rounded-3 border text-start">
                        <span className="text-muted text-xxs d-block" style={{ fontSize: '0.62rem' }}>Auto-Routed Unit</span>
                        <strong className="text-primary small">{activeAlert.department}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. SLA Stop-watch countdown */}
                  <div className="border rounded-3 p-3 text-center bg-dark text-white shadow-sm mb-3">
                    <span className="text-muted text-uppercase fw-extrabold d-block mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                      SLA COUNTDOWN TIMER TO COMPLIANCE
                    </span>
                    <span className="font-monospace fw-bold display-6 d-block" style={{ color: '#10b981', letterSpacing: '0.05em' }}>
                      {officerStatus === 'Assigned' ? formatTimer(slaCountdown) : officerStatus === 'Accepted' ? 'CREW ON-SITE' : officerStatus === 'Invalid' ? 'TICKET SUSPENDED' : 'ESCALATED'}
                    </span>
                    <span className="text-muted text-xxs" style={{ fontSize: '0.62rem' }}>
                      Must resolve within **{activeAlert.sla}** deadline.
                    </span>
                  </div>

                  {/* Anti-spam metrics panel */}
                  <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded-3 small">
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}><i className="bi bi-shield-check text-success"></i> Reporter trust rating</span>
                    <strong className="text-success" style={{ fontSize: '0.68rem' }}>{activeAlert.trustScore} Points (Optimal)</strong>
                  </div>
                </div>

                {/* 3. OFFICER EMERGENCY ACTION SWITCHES */}
                <div className="card border-0 p-4 shadow-sm bg-white rounded-4 text-start">
                  <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-shield-lock-fill text-primary"></i> Municipal Grievance Officer Actions (Test Board)</h6>
                  
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button 
                      onClick={() => triggerOfficerAction('accept')} 
                      disabled={officerStatus !== 'Assigned'}
                      className="btn btn-sm btn-success rounded-pill px-3 py-2 fw-bold text-white border-0 bg-success hover-success-dark small"
                    >
                      <i className="bi bi-check-circle-fill me-1"></i> Accept & Dispatch Crew
                    </button>
                    <button 
                      onClick={() => triggerOfficerAction('escalate')} 
                      disabled={officerStatus !== 'Assigned' && officerStatus !== 'Accepted'}
                      className="btn btn-sm btn-warning rounded-pill px-3 py-2 fw-bold text-dark border-0 bg-warning hover-warning-dark small"
                    >
                      <i className="bi bi-exclamation-octagon-fill me-1"></i> Trigger Escalation
                    </button>
                    <button 
                      onClick={() => setShowInvalidForm(!showInvalidForm)} 
                      disabled={officerStatus !== 'Assigned'}
                      className="btn btn-sm btn-outline-danger rounded-pill px-3 py-2 fw-bold small"
                    >
                      <i className="bi bi-x-circle-fill me-1"></i> Mark Invalid / Fake
                    </button>
                  </div>

                  {/* Invalid form overlay */}
                  {showInvalidForm && (
                    <div className="bg-light p-3 rounded-3 border mb-3 animate-scale-up">
                      <label className="form-label text-secondary small fw-semibold mb-1">Select Rejection/Fake Reason</label>
                      <select 
                        className="form-select form-select-sm border text-muted py-1.5 px-2.5 rounded-3 mb-2"
                        value={invalidReason}
                        onChange={(e) => setInvalidReason(e.target.value)}
                        style={{ fontSize: '0.78rem' }}
                      >
                        <option value="">Choose reason...</option>
                        <option value="Fake photo / duplicated template">Fake photo / duplicated template</option>
                        <option value="Non-emergency issue routed improperly">Non-emergency issue routed improperly</option>
                        <option value="Duplicate case coordinates logged">Duplicate case coordinates logged</option>
                      </select>
                      <button 
                        onClick={() => triggerOfficerAction('invalid')}
                        className="btn btn-danger btn-sm px-3 rounded-pill fw-bold text-white border-0 bg-danger"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}

                  <div className="d-flex justify-content-between small text-muted border-top pt-3">
                    <span>Officer Handshake status:</span>
                    <strong className={`badge ${officerStatus === 'Assigned' ? 'bg-primary-soft text-primary' : officerStatus === 'Accepted' ? 'bg-success-soft text-success' : officerStatus === 'Invalid' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'} rounded-pill`}>
                      {officerStatus.toUpperCase()}
                    </strong>
                  </div>
                </div>

                {/* 4. REAL-TIME LOGSTREAM TRACE BOARD */}
                <div className="card border-0 p-4 shadow-sm bg-white rounded-4 text-start flex-grow-1">
                  <h6 className="fw-bold text-secondary mb-2.5"><i className="bi bi-clock-history"></i> Rapid Action Audit Logs</h6>
                  <div className="bg-dark text-success p-3 rounded-3 font-monospace" style={{ minHeight: '120px', fontSize: '0.68rem', borderLeft: '4px solid #ef4444', overflowY: 'auto' }}>
                    {simulationLogs.map((log, idx) => (
                      <div className="mb-1.5" key={idx}>
                        <span className="text-muted">➜</span> {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* MOCK PRE-SUBMIT WORKFLOW visualizer */
              <div className="card border-0 p-4 shadow-sm bg-white rounded-4 h-100 text-start">
                <h5 className="fw-bold text-secondary mb-3"><i className="bi bi-activity text-danger me-2 animate-pulse"></i> Automated Dispatch System</h5>
                <p className="text-muted small mb-4">
                  Once submitted, the platform maps and processes emergency incidents instantly via our auto-dispatcher:
                </p>

                <div className="border-start border-3 border-danger ps-3 d-flex flex-column gap-4.5">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>1</div>
                    <div>
                      <strong className="text-secondary small d-block">Automatic Priority Mapping</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Sparking transformers or hanging live wires trigger **Critical Priority (1-hour resolution time)**. Open manholes trigger **High Priority (2-hour resolution time)**.</span>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>2</div>
                    <div>
                      <strong className="text-secondary small d-block">Intelligent Department Routing</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>No manual sorting. Incidents auto-route instantly to Electrical, Drainage, Water, Sanitation, or Animal control databases.</span>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.75rem', flexShrink: 0 }}>3</div>
                    <div>
                      <strong className="text-secondary small d-block">Anti-Spam / trust Validation</strong>
                      <span className="text-muted text-xxs" style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>Combats duplicate entries at the same location. Trust ratings are computed based on photo metadata and reporting verification history.</span>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-3 mt-auto text-center">
                  <span className="text-muted text-xxs" style={{ fontSize: '0.65rem' }}>Rajasthan GovTech Infrastructure Framework v2.6.4</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
