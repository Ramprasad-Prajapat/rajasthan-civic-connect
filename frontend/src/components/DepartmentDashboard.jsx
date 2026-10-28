import React, { useState, useEffect } from 'react';
import { getDepartmentStats, getComplaints, getComplaint, updateComplaintStatus } from '../apiService';

export default function DepartmentDashboard({ authenticatedUser, handleSignOut }) {
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    inProgress: 0,
    resolved: 0,
    overdue: 0,
    departmentName: ''
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('InProgress');
  const [statusRemark, setStatusRemark] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const officerName = authenticatedUser?.name || authenticatedUser?.fullName || 'Department Officer';
  const departmentName = stats.departmentName || authenticatedUser?.departmentName || 'Assigned Department';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, complaintsList] = await Promise.all([
        getDepartmentStats().catch(() => null),
        getComplaints(statusFilter !== 'all' ? { status: statusFilter } : {})
      ]);

      if (statsData) {
        setStats({
          total: statsData.totalComplaints ?? statsData.total ?? 0,
          submitted: statsData.submittedComplaints ?? statsData.submitted ?? 0,
          inProgress: statsData.inProgressComplaints ?? statsData.inProgress ?? 0,
          resolved: statsData.resolvedComplaints ?? statsData.resolved ?? 0,
          overdue: statsData.overdueComplaints ?? statsData.overdue ?? 0,
          departmentName: statsData.departmentName || ''
        });
      }

      setComplaints(Array.isArray(complaintsList) ? complaintsList : []);
    } catch (err) {
      setError(err.message || 'Failed to load department dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const openComplaintModal = async (idOrCode) => {
    setModalLoading(true);
    setActionMessage(null);
    try {
      const data = await getComplaint(idOrCode);
      setSelectedComplaint(data);
      setNewStatus(data.status === 'Submitted' ? 'InProgress' : data.status === 'InProgress' ? 'Resolved' : 'Closed');
      setStatusRemark('');
    } catch (err) {
      alert(err.message || 'Failed to load grievance details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdateLoading(true);
    setActionMessage(null);
    try {
      const updated = await updateComplaintStatus(
        selectedComplaint.complaintCode || selectedComplaint.complaintId || selectedComplaint.id,
        newStatus,
        statusRemark
      );
      setSelectedComplaint(updated);
      setActionMessage({ type: 'success', text: `Status updated to ${newStatus} successfully!` });
      loadData();
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.message || 'Failed to update status' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const code = (c.complaintCode || c.complaintId || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    const district = (c.district || '').toLowerCase();
    return code.includes(query) || title.includes(query) || district.includes(query);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return <span className="badge bg-primary text-white">Submitted</span>;
      case 'InProgress':
        return <span className="badge bg-warning text-dark">In Progress</span>;
      case 'Resolved':
        return <span className="badge bg-success text-white">Resolved</span>;
      case 'Closed':
        return <span className="badge bg-secondary text-white">Closed</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('critical') || p.includes('urgent')) {
      return <span className="badge bg-danger">Critical</span>;
    }
    if (p.includes('high')) {
      return <span className="badge bg-danger-subtle text-danger border border-danger">High</span>;
    }
    return <span className="badge bg-light text-secondary border">Normal</span>;
  };

  return (
    <div className="container py-4">
      {/* Department Header */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)', color: 'white' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-white bg-opacity-25 rounded-pill px-3 py-1 mb-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
              OFFICER DESK
            </span>
            <h2 className="fw-bold mb-1">{departmentName}</h2>
            <p className="mb-0 text-white text-opacity-75 small">
              Logged in as: <strong>{officerName}</strong> &bull; {authenticatedUser?.email}
            </p>
          </div>
          <button onClick={loadData} className="btn btn-light btn-sm rounded-pill px-3 py-2 fw-semibold align-self-start align-self-md-center shadow-sm">
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-4 shadow-sm mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      {/* 5 Count Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100">
            <span className="text-muted small fw-semibold">Total Complaints</span>
            <h3 className="fw-bold text-dark mt-2 mb-0">{stats.total}</h3>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100 border-start border-primary border-4">
            <span className="text-primary small fw-semibold">Submitted</span>
            <h3 className="fw-bold text-primary mt-2 mb-0">{stats.submitted}</h3>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100 border-start border-warning border-4">
            <span className="text-warning small fw-semibold">In Progress</span>
            <h3 className="fw-bold text-warning mt-2 mb-0">{stats.inProgress}</h3>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100 border-start border-success border-4">
            <span className="text-success small fw-semibold">Resolved</span>
            <h3 className="fw-bold text-success mt-2 mb-0">{stats.resolved}</h3>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100 border-start border-danger border-4">
            <span className="text-danger small fw-semibold">Overdue</span>
            <h3 className="fw-bold text-danger mt-2 mb-0">{stats.overdue}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          {/* Status Tabs */}
          <div className="btn-group btn-group-sm flex-wrap" role="group">
            {[
              { id: 'all', label: 'All' },
              { id: 'Submitted', label: 'Submitted' },
              { id: 'InProgress', label: 'In Progress' },
              { id: 'Resolved', label: 'Resolved' },
              { id: 'Closed', label: 'Closed' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="input-group input-group-sm" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 bg-light"
              placeholder="Search by ticket code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ fontSize: '0.8rem' }}>
                <th className="ps-4">Ticket Code</th>
                <th>Title</th>
                <th>Category</th>
                <th>District</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading department complaints...
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2 text-secondary opacity-50"></i>
                    No grievances found matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map(c => {
                  const code = c.complaintCode || c.complaintId || `ID-${c.id}`;
                  const isOverdue = c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'Resolved' && c.status !== 'Closed';
                  return (
                    <tr key={c.id || code}>
                      <td className="ps-4 fw-bold font-monospace text-primary small">
                        {code}
                      </td>
                      <td className="fw-semibold text-secondary small" style={{ maxWidth: '240px' }}>
                        <div className="text-truncate">{c.title || 'Untitled Issue'}</div>
                      </td>
                      <td className="small text-muted">{c.category || 'General'}</td>
                      <td className="small text-muted">{c.district || '-'}</td>
                      <td>{getPriorityBadge(c.priority)}</td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td className="small">
                        {c.slaDeadline ? (
                          <span className={isOverdue ? 'text-danger fw-bold' : 'text-muted'}>
                            {new Date(c.slaDeadline).toLocaleDateString()} {isOverdue && '⚠️'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => openComplaintModal(code)}
                        >
                          View &bull; Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Detail & Status Update Modal */}
      {selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-primary-soft text-primary rounded-pill px-2.5 py-1 small mb-1">
                    {selectedComplaint.complaintCode || selectedComplaint.complaintId}
                  </span>
                  <h5 className="modal-title fw-bold text-secondary">
                    {selectedComplaint.title}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedComplaint(null)}
                ></button>
              </div>

              <div className="modal-body pt-3">
                {actionMessage && (
                  <div className={`alert alert-${actionMessage.type} rounded-3 py-2 px-3 small mb-3`}>
                    {actionMessage.text}
                  </div>
                )}

                {/* Info Grid */}
                <div className="row g-3 bg-light rounded-3 p-3 mb-3 small text-start">
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Department</span>
                    <strong>{selectedComplaint.departmentName || departmentName}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Status &bull; Priority</span>
                    <span className="me-2">{getStatusBadge(selectedComplaint.status)}</span>
                    {getPriorityBadge(selectedComplaint.priority)}
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Location</span>
                    <span>
                      {[selectedComplaint.wardNumber, selectedComplaint.ulbName, selectedComplaint.district].filter(Boolean).join(', ') || 'Rajasthan'}
                    </span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Citizen Contact</span>
                    <span>
                      {selectedComplaint.citizenName || 'Citizen'} ({selectedComplaint.citizenPhone || selectedComplaint.citizenEmail || 'Masked'})
                    </span>
                  </div>
                  <div className="col-12">
                    <span className="text-muted d-block">Description</span>
                    <p className="mb-0 text-secondary">{selectedComplaint.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Photos if available */}
                {(selectedComplaint.photo || (selectedComplaint.beforePhotos && selectedComplaint.beforePhotos.length > 0)) && (
                  <div className="mb-3 text-start">
                    <span className="text-muted small fw-semibold d-block mb-1">Grievance Photos:</span>
                    <div className="d-flex gap-2 flex-wrap">
                      {selectedComplaint.photo && (
                        <img
                          src={selectedComplaint.photo}
                          alt="Evidence"
                          className="rounded-3 border"
                          style={{ width: '120px', height: '90px', objectFit: 'cover' }}
                        />
                      )}
                      {selectedComplaint.beforePhotos?.map((p, idx) => (
                        <img
                          key={idx}
                          src={p}
                          alt={`Before-${idx}`}
                          className="rounded-3 border"
                          style={{ width: '120px', height: '90px', objectFit: 'cover' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="mb-4 text-start">
                  <span className="text-muted small fw-semibold d-block mb-2">Lifecycle Timeline:</span>
                  <div className="border rounded-3 p-3 bg-white">
                    {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 ? (
                      selectedComplaint.timeline.map((event, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-2 border-bottom py-2 last-border-0">
                          <span className="badge bg-secondary-subtle text-dark" style={{ minWidth: '80px' }}>
                            {event.status || event.title}
                          </span>
                          <div className="flex-grow-1 small">
                            <div className="fw-semibold text-secondary">{event.remarks || event.description || event.title}</div>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                              By {event.actorName || event.actorRole || 'System'} &bull; {event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted small">No timeline events recorded yet.</span>
                    )}
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="card border-0 bg-light rounded-3 p-3 text-start">
                  <h6 className="fw-bold text-secondary mb-2">Update Complaint Status</h6>
                  <form onSubmit={handleStatusUpdate}>
                    <div className="row g-2 align-items-center">
                      <div className="col-sm-4">
                        <label className="form-label small text-muted mb-1">Next Status</label>
                        <select
                          className="form-select form-select-sm"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          <option value="InProgress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div className="col-sm-8">
                        <label className="form-label small text-muted mb-1">Official Remarks</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Action taken details..."
                          value={statusRemark}
                          onChange={(e) => setStatusRemark(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 text-end mt-2">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm rounded-pill px-4"
                          disabled={updateLoading}
                        >
                          {updateLoading ? 'Saving...' : 'Submit Status Update'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm rounded-pill px-3"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
