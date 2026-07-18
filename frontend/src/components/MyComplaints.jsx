import React, { useState, useEffect } from 'react';
import { getMyComplaints, getComplaints, submitFeedback, reopenComplaint } from '../firestoreService';

export default function MyComplaints({ authenticatedUser, setActivePage }) {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchComplaints = async () => {
      try {
        let data = [];
        if (authenticatedUser) {
          if (authenticatedUser.role === 'Citizen' || !authenticatedUser.role) {
            // Use the dedicated /my endpoint for citizens
            data = await getMyComplaints();
          } else {
            // Officers/Workers/Admin use filtered getComplaints
            let filters = {};
            if (authenticatedUser.role === 'Worker') {
              filters.assignedWorker = authenticatedUser.fullName || authenticatedUser.name;
            } else if (authenticatedUser.role === 'Department Officer') {
              if (authenticatedUser.department) {
                filters.department = authenticatedUser.department;
              }
            }
            data = await getComplaints(filters);
          }
        }
        if (!active) return;
        
        const mapped = data.map(c => ({
          id: c.complaintId || c.id,
          category: c.category || 'Other',
          subcategory: c.subcategory || c.subCategory || '',
          title: c.title || '',
          description: c.description || '',
          status: c.status || 'Submitted',
          priority: c.priority || 'Medium',
          date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '—',
          dept: c.departmentName || c.department || 'General Administration',
          worker: c.assignedWorker ? c.assignedWorker.name : 'Queue Assignment Pending',
          workerStatus: c.status === 'Resolved' || c.status === 'Closed' ? 'Work completed. Proof submitted.' : 'Work in progress.',
          slaRemaining: c.status === 'Resolved' || c.status === 'Closed' ? 'Completed within SLA' : (c.slaHours ? `${c.slaHours} Hours` : '24 Hours'),
          beforePhoto: c.beforeProof || c.photo || '',
          afterPhoto: c.afterProof || '',
          remarks: c.remarks || c.officerRemarks || 'No officer comments logged.',
          timeline: c.timeline || [
            { stage: 'Submitted', date: c.createdAt ? new Date(c.createdAt).toLocaleString() : new Date().toLocaleString(), done: true }
          ],
          feedback: c.rating ? { rating: c.rating, comment: c.feedback || '' } : null
        }));
        
        setComplaints(mapped);
      } catch (err) {
        console.error("Failed to load user complaints:", err);
      }
    };
    fetchComplaints();
    return () => { active = false; };
  }, [authenticatedUser]);

  const saveComplaints = (newComplaints) => {
    setComplaints(newComplaints);
  };

  // UI Interactive States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('All'); // 'All' | 'Pending' | 'Assigned' | 'Resolved'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Drawer view selector: 'details' | 'track' | 'feedback' | 'reopen'
  const [actionView, setActionView] = useState('details');

  // Input states for Feedback & Reopen
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [reopenReason, setReopenReason] = useState('Unsatisfactory repair quality');
  const [reopenDesc, setReopenDesc] = useState('');
  const [successToast, setSuccessToast] = useState(null);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    try {
      await submitFeedback(selectedComplaint.id, rating, feedbackText, authenticatedUser?.uid || 'anonymous');
      
      const updated = complaints.map(c => {
        if (c.id === selectedComplaint.id) {
          return {
            ...c,
            status: 'Closed',
            feedback: { rating, comment: feedbackText, submittedAt: new Date().toISOString().split('T')[0] }
          };
        }
        return c;
      });

      saveComplaints(updated);
      triggerToast(`Feedback submitted successfully! Thank you for rating us.`);
      setFeedbackText('');
      setSelectedComplaint(null);
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  };

  // Handle reopening a complaint
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const fileInput = document.querySelector('input[type="file"]');
      const file = fileInput ? fileInput.files[0] : null;
      await reopenComplaint(selectedComplaint.id, reopenReason, reopenDesc, file);

      const updated = complaints.map(c => {
        if (c.id === selectedComplaint.id) {
          return {
            ...c,
            status: 'Reopened',
            remarks: `Reopened by Citizen: ${reopenReason}. Description: ${reopenDesc}`,
            afterPhoto: null,
            feedback: null
          };
        }
        return c;
      });

      saveComplaints(updated);
      triggerToast(`Complaint ${selectedComplaint.id} has been reopened and dispatched back to the Ward Nodal Officer.`);
      setReopenDesc('');
      setSelectedComplaint(null);
    } catch (err) {
      console.error("Reopen error:", err);
      alert("Failed to reopen complaint: " + err.message);
    }
  };

  // Filter logic based on Search and Tabs
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilterTab === 'All') return matchesSearch;
    return matchesSearch && c.status.toLowerCase() === activeFilterTab.toLowerCase();
  });

  return (
    <section className="py-5" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100vh' }}>
      
      {/* Dynamic Success Toast */}
      {successToast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="alert alert-success border-0 shadow-lg rounded-4 p-3 d-flex align-items-center gap-3 animate-slide-up" style={{ minWidth: '320px', borderLeft: '4px solid #10b981' }}>
            <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-check2-circle fs-5"></i>
            </div>
            <div>
              <strong className="text-secondary small d-block">Grievance Registry Sync</strong>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>{successToast}</span>
            </div>
          </div>
        </div>
      )}

      <div className="container py-4">
        
        {/* Header */}
        <div className="text-center mb-5 text-start">
          <span className="badge bg-success-soft text-success rounded-pill px-3 py-1.5 mb-2 fw-bold" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-clipboard-data-fill me-1"></i> ACTIVE CITIZEN LEDGER
          </span>
          <h2 className="fw-extrabold text-secondary m-0" style={{ fontSize: '2rem' }}>My Complaints & Tasks</h2>
          <p className="text-muted small mt-1.5" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Real-time track and manage your civic submissions. Submit feedback or request reopening on resolved tasks.
          </p>
        </div>

        {/* Search and Filters Hub */}
        <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            
            {/* Search Input */}
            <div className="position-relative w-100" style={{ maxWidth: '400px' }}>
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
              <input 
                type="text"
                placeholder="Search by Complaint ID, Category, Title..."
                className="form-control rounded-pill py-2.5 ps-5 pe-3 border small text-secondary"
                style={{ fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="d-flex bg-light p-1 rounded-pill border">
              {['All', 'Pending', 'Assigned', 'Resolved'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveFilterTab(tab)}
                  className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold border-0 ${activeFilterTab === tab ? 'bg-success text-white shadow-sm' : 'text-muted bg-transparent'}`}
                  style={{ fontSize: '0.76rem' }}
                >
                  {tab}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Complaints Table Grid */}
        <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle border-0 mb-0">
              <thead className="table-light">
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <th scope="col" className="text-secondary small fw-bold py-3.5 ps-4" style={{ fontSize: '0.74rem' }}>Complaint ID</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5" style={{ fontSize: '0.74rem' }}>Category & Title</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5" style={{ fontSize: '0.74rem' }}>Assigned Department</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5 text-center" style={{ fontSize: '0.74rem' }}>Priority Badge</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5 text-center" style={{ fontSize: '0.74rem' }}>Status Pill</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5" style={{ fontSize: '0.74rem' }}>Date Filed</th>
                  <th scope="col" className="text-secondary small fw-bold py-3.5 text-end pe-4" style={{ fontSize: '0.74rem' }}>Action Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map(comp => (
                    <tr key={comp.id} className="transition-all" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      
                      {/* ID */}
                      <td className="py-3.5 ps-4">
                        <strong className="text-secondary font-monospace" style={{ fontSize: '0.76rem' }}>{comp.id}</strong>
                      </td>

                      {/* Category & Title */}
                      <td className="py-3.5 text-start">
                        <div className="d-flex flex-column">
                          <span className="badge bg-light text-success border border-success border-opacity-10 py-1.5 px-2.5 rounded-pill fw-bold" style={{ fontSize: '0.62rem', width: 'fit-content', marginBottom: '4px' }}>
                            {comp.category}
                          </span>
                          <strong className="text-secondary small text-truncate" style={{ maxWidth: '240px' }} title={comp.title}>{comp.title}</strong>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 text-start text-muted small" style={{ fontSize: '0.74rem' }}>
                        {comp.dept}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 text-center">
                        <span className={`badge rounded-pill fw-bold px-2.5 py-1 ${comp.priority === 'High' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'}`} style={{ fontSize: '0.62rem' }}>
                          {comp.priority} Priority
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-center">
                        <span className={`badge rounded-pill fw-bold px-3 py-1.5 border ${
                          comp.status === 'Resolved' ? 'bg-success bg-opacity-10 text-success border-success border-opacity-20' :
                          comp.status === 'Assigned' ? 'bg-warning bg-opacity-10 text-warning border-warning border-opacity-20' :
                          'bg-secondary bg-opacity-10 text-muted border-secondary border-opacity-20'
                        }`} style={{ fontSize: '0.65rem' }}>
                          🟢 {comp.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 text-muted small" style={{ fontSize: '0.72rem' }}>
                        {comp.date}
                      </td>

                      {/* Operations */}
                      <td className="py-3.5 text-end pe-4">
                        <div className="d-flex justify-content-end gap-1.5">
                          
                          {/* View details */}
                          <button 
                            onClick={() => { setSelectedComplaint(comp); setActionView('details'); }}
                            className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1"
                            style={{ fontSize: '0.65rem', fontWeight: 600 }}
                            title="View Case Details"
                          >
                            Details
                          </button>

                          {/* Live Track */}
                          <button 
                            onClick={() => { setSelectedComplaint(comp); setActionView('track'); }}
                            className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1"
                            style={{ fontSize: '0.65rem', fontWeight: 600 }}
                            title="Track live timeline"
                          >
                            Track
                          </button>

                          {/* Give Feedback (Resolved cases only) */}
                          {comp.status === 'Resolved' && (
                            <button 
                              onClick={() => { setSelectedComplaint(comp); setActionView('feedback'); }}
                              className={`btn btn-xs rounded-pill px-2.5 py-1 ${comp.feedback ? 'btn-light text-muted' : 'btn-success text-white bg-success border-0 shadow-sm'}`}
                              style={{ fontSize: '0.65rem', fontWeight: 600 }}
                              disabled={!!comp.feedback}
                            >
                              {comp.feedback ? 'Rated' : 'Rate Work'}
                            </button>
                          )}

                          {/* Reopen Ticket (Resolved cases only) */}
                          {comp.status === 'Resolved' && (
                            <button 
                              onClick={() => { setSelectedComplaint(comp); setActionView('reopen'); }}
                              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1"
                              style={{ fontSize: '0.65rem', fontWeight: 600 }}
                            >
                              Reopen
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted small">
                      <i className="bi bi-folder2-open display-6 text-muted opacity-50 d-block mb-2"></i>
                      No grievances matched the active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* OVERLAY PANEL / SLIDE-IN MODAL */}
      {selectedComplaint && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center" style={{ zIndex: 1060 }}>
          <div className="card p-4 rounded-4 shadow-lg text-start border-0 animate-scale-up" style={{ width: '90%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', background: '#fff' }}>
            
            {/* Modal Header */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2.5 mb-3">
              <div>
                <span className="text-muted text-xxs font-monospace d-block" style={{ fontSize: '0.65rem' }}>OPERATION CONTROL CENTER</span>
                <strong className="text-secondary fs-6">Grievance Ticket {selectedComplaint.id}</strong>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="btn-close"></button>
            </div>

            {/* View Selector Tab Row */}
            <div className="d-flex bg-light p-1 rounded-3 mb-3 border gap-1">
              <button 
                onClick={() => setActionView('details')} 
                className={`btn btn-sm flex-fill rounded-2 border-0 ${actionView === 'details' ? 'bg-success text-white fw-bold shadow-sm' : 'text-muted bg-transparent'}`}
                style={{ fontSize: '0.7rem' }}
              >
                Case Details
              </button>
              <button 
                onClick={() => setActionView('track')} 
                className={`btn btn-sm flex-fill rounded-2 border-0 ${actionView === 'track' ? 'bg-success text-white fw-bold shadow-sm' : 'text-muted bg-transparent'}`}
                style={{ fontSize: '0.7rem' }}
              >
                Live Tracking
              </button>
              {selectedComplaint.status === 'Resolved' && (
                <>
                  <button 
                    onClick={() => setActionView('feedback')} 
                    className={`btn btn-sm flex-fill rounded-2 border-0 ${actionView === 'feedback' ? 'bg-success text-white fw-bold shadow-sm' : 'text-muted bg-transparent'}`}
                    style={{ fontSize: '0.7rem' }}
                    disabled={!!selectedComplaint.feedback}
                  >
                    Feedback
                  </button>
                  <button 
                    onClick={() => setActionView('reopen')} 
                    className={`btn btn-sm flex-fill rounded-2 border-0 ${actionView === 'reopen' ? 'bg-success text-white fw-bold shadow-sm' : 'text-muted bg-transparent'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    Reopen
                  </button>
                </>
              )}
            </div>

            {/* 1. CASE DETAILS VIEW */}
            {actionView === 'details' && (
              <div className="animate-fade-in text-secondary">
                <div className="mb-3">
                  <span className="text-muted d-block small" style={{ fontSize: '0.7rem' }}>Title:</span>
                  <strong className="text-secondary d-block" style={{ fontSize: '0.85rem' }}>{selectedComplaint.title}</strong>
                </div>
                <div className="mb-3">
                  <span className="text-muted d-block small" style={{ fontSize: '0.7rem' }}>Detailed Description:</span>
                  <p className="small text-muted mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>{selectedComplaint.description}</p>
                </div>
                
                {/* Photo Previews */}
                <div className="row g-2 mb-3">
                  {selectedComplaint.beforePhoto && (
                    <div className="col-6">
                      <span className="text-muted d-block small mb-1" style={{ fontSize: '0.66rem' }}>Before Redressal Proof:</span>
                      <img 
                        src={selectedComplaint.beforePhoto} 
                        alt="Before" 
                        className="img-thumbnail rounded-3 w-100" 
                        style={{ height: '110px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  {selectedComplaint.afterPhoto && (
                    <div className="col-6">
                      <span className="text-muted d-block small mb-1" style={{ fontSize: '0.66rem' }}>After Redressal Proof:</span>
                      <img 
                        src={selectedComplaint.afterPhoto} 
                        alt="After" 
                        className="img-thumbnail rounded-3 w-100" 
                        style={{ height: '110px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 border rounded-3 bg-light text-secondary small">
                  <div className="d-flex justify-content-between border-bottom pb-1.5 mb-1.5">
                    <span className="text-muted">Assigned Worker:</span>
                    <strong>{selectedComplaint.worker}</strong>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1.5 mb-1.5">
                    <span className="text-muted">Status Notes:</span>
                    <strong className="text-success">{selectedComplaint.workerStatus}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Officer Remarks:</span>
                    <span className="fw-semibold text-end text-truncate" style={{ maxWidth: '220px' }} title={selectedComplaint.remarks}>
                      {selectedComplaint.remarks}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TRACK COMPLAINT TIMELINE VIEW */}
            {actionView === 'track' && (
              <div className="animate-fade-in text-secondary">
                <div className="alert alert-success border-0 rounded-3 p-2.5 mb-3 d-flex align-items-center justify-content-between">
                  <span className="small text-success-dark">⚡ <strong>SLA Clock Timer:</strong></span>
                  <span className="badge bg-success text-white font-monospace">{selectedComplaint.slaRemaining}</span>
                </div>

                <h6 className="fw-bold text-secondary mb-3" style={{ fontSize: '0.78rem' }}>Live Resolution Timeline Logs:</h6>

                {/* Timeline Grid */}
                <div className="position-relative ps-4 text-start">
                  {/* Timeline vertical bar connector */}
                  <div className="position-absolute start-0 top-0 h-100 border-start border-2 border-opacity-20" style={{ left: '8px', zIndex: 1, borderColor: '#10b981' }}></div>
                  
                  {selectedComplaint.timeline.map((step, idx) => (
                    <div className="position-relative mb-3" key={idx} style={{ zIndex: 2 }}>
                      {/* Checkpoint icon */}
                      <span className={`position-absolute rounded-circle d-flex align-items-center justify-content-center border-2`} 
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          left: '-23px', 
                          top: '2px', 
                          backgroundColor: step.done ? '#10b981' : '#fff',
                          borderColor: step.done ? '#10b981' : '#cbd5e1'
                        }}
                      >
                        {step.done && <i className="bi bi-check-lg text-white" style={{ fontSize: '0.55rem' }}></i>}
                      </span>
                      
                      <div>
                        <strong className={`d-block small ${step.done ? 'text-secondary' : 'text-muted'}`} style={{ fontSize: '0.74rem' }}>{step.stage}</strong>
                        {step.date && <span className="text-muted d-block text-xxs font-monospace" style={{ fontSize: '0.62rem' }}>{step.date}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. GIVE FEEDBACK OPERATION */}
            {actionView === 'feedback' && (
              <div className="animate-fade-in">
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="mb-3 text-center">
                    <label className="form-label text-secondary small fw-bold d-block mb-2">Rate Redressal Speed & Quality</label>
                    <div className="d-flex justify-content-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i 
                          key={star}
                          onClick={() => setRating(star)}
                          className={`bi ${star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-3 cursor-pointer`}
                          style={{ cursor: 'pointer' }}
                        ></i>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-bold">Citizen Comments</label>
                    <textarea 
                      required
                      className="form-control border rounded-3 py-2 px-3 small text-secondary"
                      rows="3"
                      style={{ fontSize: '0.8rem' }}
                      placeholder="Share your experience (e.g. Clean repair, quick support, highly satisfied!)"
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-success text-white w-100 py-2 rounded-pill fw-bold shadow-sm bg-success border-0">
                    Lock Feedback Logs
                  </button>
                </form>
              </div>
            )}

            {/* 4. REOPEN GRIEVANCE DESK */}
            {actionView === 'reopen' && (
              <div className="animate-fade-in">
                <form onSubmit={handleReopenSubmit}>
                  
                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-bold">Select Reopen Parameter</label>
                    <select 
                      className="form-select border rounded-3 py-2 px-3 small text-secondary"
                      style={{ fontSize: '0.8rem' }}
                      value={reopenReason}
                      onChange={e => setReopenReason(e.target.value)}
                    >
                      <option value="Unsatisfactory repair quality">Unsatisfactory repair quality</option>
                      <option value="Fake completion photo uploaded">Fake completion photo uploaded</option>
                      <option value="Issue recurred within hours">Issue recurred within hours</option>
                      <option value="Zone left uncleaned post-repair">Zone left uncleaned post-repair</option>
                    </select>
                  </div>

                  <div className="mb-3 text-start">
                    <label className="form-label text-secondary small fw-bold">Elaborated Reopen Cause</label>
                    <textarea 
                      required
                      className="form-control border rounded-3 py-2 px-3 small text-secondary"
                      rows="3"
                      style={{ fontSize: '0.8rem' }}
                      placeholder="Explain in detail (e.g., The pipeline is leaking again. The worker left the debris blocking the main entrance.)"
                      value={reopenDesc}
                      onChange={e => setReopenDesc(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Reopen photo uploader mock */}
                  <div className="mb-3 bg-light p-3 rounded-3 border text-start">
                    <strong className="text-secondary small d-block mb-1.5"><i className="bi bi-camera-fill me-1"></i>Visual Evidence Photo (Before/After Audit)</strong>
                    <input type="file" className="form-control form-control-sm border bg-white" required />
                    <span className="text-muted d-block text-xxs mt-1" style={{ fontSize: '0.62rem' }}>Proof photo required to confirm active field reassignment.</span>
                  </div>

                  <button type="submit" className="btn btn-danger text-white w-100 py-2 rounded-pill fw-bold shadow-sm bg-danger border-0">
                    Reopen & Re-dispatch Ticket
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
}
