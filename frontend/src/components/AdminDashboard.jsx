import React, { useState, useEffect } from 'react';
import {
  getAdminStats,
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  reassignComplaintDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentActive,
  deleteDepartment,
  getAdminOfficers,
  createAdminOfficer,
  updateAdminOfficer,
  getAdminUsers
} from '../apiService';

export default function AdminDashboard({ authenticatedUser, handleSignOut }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, complaints, departments, officers, users

  // State collections
  const [stats, setStats] = useState({
    totalComplaints: 0,
    submittedComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    closedComplaints: 0,
    overdueComplaints: 0,
    totalDepartments: 0,
    totalOfficers: 0,
    totalCitizens: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Complaints tab filters
  const [filterDeptId, setFilterDeptId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchComplaint, setSearchComplaint] = useState('');

  // Selected complaint modal & Reassign modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [reassignDeptId, setReassignDeptId] = useState('');
  const [newStatus, setNewStatus] = useState('InProgress');
  const [statusRemark, setStatusRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Department modal state (create / edit)
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', contact: '' });

  // Officer modal state (create / edit)
  const [officerModalOpen, setOfficerModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [officerForm, setOfficerForm] = useState({
    name: '',
    email: '',
    phone: '',
    initialPassword: '',
    departmentId: ''
  });

  const showAlert = (type, text) => {
    setAlertBanner({ type, text });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  // Load overview stats
  const loadStats = async () => {
    try {
      const data = await getAdminStats();
      if (data) setStats(data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  // Load all departments
  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      if (Array.isArray(data)) setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  // Load complaints
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterDeptId !== 'all') filters.departmentId = filterDeptId;
      const data = await getComplaints(filters);
      if (Array.isArray(data)) setComplaints(data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load officers
  const loadOfficers = async () => {
    setLoading(true);
    try {
      const data = await getAdminOfficers();
      if (Array.isArray(data)) setOfficers(data);
    } catch (err) {
      console.error("Failed to load officers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
    } else if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'departments') {
      loadDepartments();
    } else if (activeTab === 'officers') {
      loadOfficers();
      loadDepartments();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, filterStatus, filterDeptId]);

  /* ========================================================================
     COMPLAINTS ACTIONS
     ======================================================================== */
  const openComplaintModal = async (idOrCode) => {
    try {
      const data = await getComplaint(idOrCode);
      setSelectedComplaint(data);
      setNewStatus(data.status === 'Submitted' ? 'InProgress' : data.status === 'InProgress' ? 'Resolved' : 'Closed');
      setStatusRemark('');
      setReassignDeptId(data.departmentId || '');
    } catch (err) {
      showAlert('danger', err.message || 'Failed to open complaint details');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const code = selectedComplaint.complaintCode || selectedComplaint.complaintId || selectedComplaint.id;
      const updated = await updateComplaintStatus(code, newStatus, statusRemark);
      setSelectedComplaint(updated);
      showAlert('success', `Status updated to ${newStatus}`);
      loadComplaints();
      loadStats();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignDepartment = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !reassignDeptId) return;
    setActionLoading(true);
    try {
      const code = selectedComplaint.complaintCode || selectedComplaint.complaintId || selectedComplaint.id;
      const updated = await reassignComplaintDepartment(code, Number(reassignDeptId));
      setSelectedComplaint(updated);
      showAlert('success', 'Department reassigned successfully!');
      loadComplaints();
      loadStats();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to reassign department');
    } finally {
      setActionLoading(false);
    }
  };

  /* ========================================================================
     DEPARTMENT CRUD
     ======================================================================== */
  const openNewDeptModal = () => {
    setEditingDept(null);
    setDeptForm({ name: '', code: '', description: '', contact: '' });
    setDeptModalOpen(true);
  };

  const openEditDeptModal = (dept) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      contact: dept.contact || ''
    });
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, deptForm);
        showAlert('success', 'Department updated successfully');
      } else {
        await createDepartment(deptForm);
        showAlert('success', 'Department created successfully');
      }
      setDeptModalOpen(false);
      loadDepartments();
      loadStats();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to save department');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDeptActive = async (dept) => {
    try {
      await toggleDepartmentActive(dept.id, !dept.active);
      showAlert('success', `Department ${dept.active ? 'deactivated' : 'activated'}`);
      loadDepartments();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to toggle department status');
    }
  };

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete ${dept.name}?`)) return;
    try {
      await deleteDepartment(dept.id);
      showAlert('success', 'Department deleted successfully');
      loadDepartments();
      loadStats();
    } catch (err) {
      showAlert('danger', err.message || 'Cannot delete department. Deactivate instead.');
    }
  };

  /* ========================================================================
     OFFICER CRUD
     ======================================================================== */
  const openNewOfficerModal = () => {
    setEditingOfficer(null);
    setOfficerForm({
      name: '',
      email: '',
      phone: '',
      initialPassword: '',
      departmentId: departments[0]?.id ? String(departments[0].id) : ''
    });
    setOfficerModalOpen(true);
  };

  const openEditOfficerModal = (officer) => {
    setEditingOfficer(officer);
    setOfficerForm({
      name: officer.name || '',
      email: officer.email || '',
      phone: officer.phone || '',
      initialPassword: '',
      departmentId: officer.departmentId ? String(officer.departmentId) : ''
    });
    setOfficerModalOpen(true);
  };

  const handleSaveOfficer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingOfficer) {
        await updateAdminOfficer(editingOfficer.id, {
          name: officerForm.name,
          phone: officerForm.phone,
          departmentId: officerForm.departmentId ? Number(officerForm.departmentId) : null,
          active: editingOfficer.active !== false
        });
        showAlert('success', 'Officer updated successfully');
      } else {
        await createAdminOfficer({
          name: officerForm.name,
          email: officerForm.email,
          phone: officerForm.phone,
          initialPassword: officerForm.initialPassword,
          departmentId: Number(officerForm.departmentId)
        });
        showAlert('success', 'Officer account created successfully');
      }
      setOfficerModalOpen(false);
      loadOfficers();
      loadStats();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to save officer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleOfficerActive = async (officer) => {
    try {
      await updateAdminOfficer(officer.id, {
        departmentId: officer.departmentId,
        active: !officer.active
      });
      showAlert('success', `Officer ${officer.active ? 'deactivated' : 'activated'}`);
      loadOfficers();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to toggle officer status');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    if (!searchComplaint.trim()) return true;
    const q = searchComplaint.toLowerCase();
    const code = (c.complaintCode || c.complaintId || '').toLowerCase();
    const title = (c.title || '').toLowerCase();
    return code.includes(q) || title.includes(q);
  });

  return (
    <div className="container py-4">
      {/* Admin Banner */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-danger rounded-pill px-3 py-1 mb-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
              ADMINISTRATION DESK
            </span>
            <h2 className="fw-bold mb-1">State Administration &amp; Governance</h2>
            <p className="mb-0 text-white text-opacity-75 small">
              Supervising municipal grievances, departmental directories, and officer assignments across Rajasthan.
            </p>
          </div>
          <button
            onClick={() => { loadStats(); loadDepartments(); }}
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2 fw-semibold align-self-start align-self-md-center"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Sync Metrics
          </button>
        </div>
      </div>

      {alertBanner && (
        <div className={`alert alert-${alertBanner.type} rounded-4 shadow-sm mb-4 d-flex align-items-center gap-2`}>
          <i className="bi bi-info-circle-fill fs-5"></i>
          <div>{alertBanner.text}</div>
        </div>
      )}

      {/* Admin Navigation Menu (Exactly 5 items) */}
      <div className="card border-0 rounded-4 shadow-sm p-2 mb-4 bg-white">
        <ul className="nav nav-pills nav-fill gap-1">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: 'bi-speedometer2' },
            { id: 'complaints', label: 'All Complaints', icon: 'bi-clipboard-data-fill' },
            { id: 'departments', label: 'Departments', icon: 'bi-building-fill' },
            { id: 'officers', label: 'Department Officers', icon: 'bi-person-badge-fill' },
            { id: 'users', label: 'Users Directory', icon: 'bi-people-fill' }
          ].map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link rounded-pill py-2.5 small fw-semibold d-flex align-items-center justify-content-center gap-2 ${activeTab === tab.id ? 'active bg-primary' : 'text-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ====================================================================
          TAB 1: OVERVIEW METRICS
          ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 border-start border-primary border-4">
                <span className="text-muted small fw-semibold d-block">Total Complaints</span>
                <h2 className="fw-bold text-dark mt-2 mb-0">{stats.totalComplaints}</h2>
                <span className="text-muted text-xxs mt-2 d-block" style={{ fontSize: '0.7rem' }}>All active &amp; historical</span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 border-start border-warning border-4">
                <span className="text-warning small fw-semibold d-block">Pending &bull; In Progress</span>
                <h2 className="fw-bold text-warning mt-2 mb-0">{stats.submittedComplaints + stats.inProgressComplaints}</h2>
                <span className="text-muted text-xxs mt-2 d-block" style={{ fontSize: '0.7rem' }}>
                  {stats.submittedComplaints} Submitted &bull; {stats.inProgressComplaints} In Progress
                </span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 border-start border-success border-4">
                <span className="text-success small fw-semibold d-block">Resolved &bull; Closed</span>
                <h2 className="fw-bold text-success mt-2 mb-0">{stats.resolvedComplaints + stats.closedComplaints}</h2>
                <span className="text-muted text-xxs mt-2 d-block" style={{ fontSize: '0.7rem' }}>
                  {stats.resolvedComplaints} Resolved &bull; {stats.closedComplaints} Closed
                </span>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 border-start border-danger border-4">
                <span className="text-danger small fw-semibold d-block">Overdue SLA</span>
                <h2 className="fw-bold text-danger mt-2 mb-0">{stats.overdueComplaints}</h2>
                <span className="text-muted text-xxs mt-2 d-block" style={{ fontSize: '0.7rem' }}>Exceeded deadline</span>
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100">
                <div className="bg-primary-soft text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-building fs-4"></i>
                </div>
                <h3 className="fw-bold text-secondary mb-1">{stats.totalDepartments}</h3>
                <span className="text-muted small">Registered Departments</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100">
                <div className="bg-warning-soft text-warning rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-person-badge fs-4"></i>
                </div>
                <h3 className="fw-bold text-secondary mb-1">{stats.totalOfficers}</h3>
                <span className="text-muted small">Department Officers</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100">
                <div className="bg-success-soft text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                  <i className="bi bi-people fs-4"></i>
                </div>
                <h3 className="fw-bold text-secondary mb-1">{stats.totalCitizens}</h3>
                <span className="text-muted small">Registered Citizens</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: ALL COMPLAINTS & REASSIGNMENT
          ==================================================================== */}
      {activeTab === 'complaints' && (
        <div className="animate-fade-in">
          {/* Filters Bar */}
          <div className="card border-0 rounded-4 shadow-sm p-3 mb-4 bg-white">
            <div className="row g-2 align-items-center">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control form-control-sm bg-light"
                  placeholder="Search code or title..."
                  value={searchComplaint}
                  onChange={(e) => setSearchComplaint(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select form-select-sm bg-light"
                  value={filterDeptId}
                  onChange={(e) => setFilterDeptId(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select form-select-sm bg-light"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.8rem' }}>
                    <th className="ps-4">Ticket</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>District</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading complaints...
                      </td>
                    </tr>
                  ) : filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No complaints found.
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map(c => {
                      const code = c.complaintCode || c.complaintId || `ID-${c.id}`;
                      const isOverdue = c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'Resolved' && c.status !== 'Closed';
                      return (
                        <tr key={c.id || code}>
                          <td className="ps-4 fw-bold font-monospace text-primary small">{code}</td>
                          <td className="fw-semibold text-secondary small" style={{ maxWidth: '220px' }}>
                            <div className="text-truncate">{c.title}</div>
                          </td>
                          <td className="small text-muted">{c.departmentName || '-'}</td>
                          <td className="small text-muted">{c.district || '-'}</td>
                          <td>
                            <span className={`badge ${c.status === 'Resolved' ? 'bg-success' : c.status === 'InProgress' ? 'bg-warning text-dark' : 'bg-primary'} text-white`}>
                              {c.status}
                            </span>
                          </td>
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
                              Manage
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
        </div>
      )}

      {/* ====================================================================
          TAB 3: DEPARTMENTS MANAGEMENT
          ==================================================================== */}
      {activeTab === 'departments' && (
        <div className="animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-secondary mb-0">Municipal Departments ({departments.length})</h5>
            <button
              onClick={openNewDeptModal}
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-semibold"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Department
            </button>
          </div>

          <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.8rem' }}>
                    <th className="ps-4">Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td className="ps-4 fw-bold text-secondary small">{d.name}</td>
                      <td className="small font-monospace text-muted">{d.code || '-'}</td>
                      <td className="small text-muted" style={{ maxWidth: '280px' }}>
                        <div className="text-truncate">{d.description || '-'}</div>
                      </td>
                      <td className="small text-muted">{d.contact || '-'}</td>
                      <td>
                        <span className={`badge ${d.active ? 'bg-success' : 'bg-secondary'}`}>
                          {d.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => openEditDeptModal(d)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn ${d.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleDeptActive(d)}
                            title={d.active ? 'Deactivate' : 'Activate'}
                          >
                            {d.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteDept(d)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: OFFICERS MANAGEMENT
          ==================================================================== */}
      {activeTab === 'officers' && (
        <div className="animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-secondary mb-0">Department Officers ({officers.length})</h5>
            <button
              onClick={openNewOfficerModal}
              className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-semibold"
            >
              <i className="bi bi-person-plus-fill me-1"></i> Add Officer
            </button>
          </div>

          <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.8rem' }}>
                    <th className="ps-4">Officer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map(o => (
                    <tr key={o.id}>
                      <td className="ps-4 fw-bold text-secondary small">{o.name || o.fullName}</td>
                      <td className="small text-muted">{o.email}</td>
                      <td className="small text-muted">{o.phone || '-'}</td>
                      <td className="small">
                        <span className="badge bg-primary-soft text-primary">
                          {o.departmentName || (o.departmentId ? `Dept #${o.departmentId}` : 'Unassigned')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${o.active !== false ? 'bg-success' : 'bg-secondary'}`}>
                          {o.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => openEditOfficerModal(o)}
                            title="Edit Department"
                          >
                            <i className="bi bi-pencil me-1"></i> Edit
                          </button>
                          <button
                            className={`btn ${o.active !== false ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleOfficerActive(o)}
                          >
                            {o.active !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: USERS DIRECTORY (READ-ONLY)
          ==================================================================== */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-secondary mb-0">Users Directory ({users.length})</h5>
            <span className="badge bg-light text-muted border px-3 py-1.5 small">Read-Only Directory</span>
          </div>

          <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: '0.8rem' }}>
                    <th className="ps-4">Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="ps-4 fw-bold text-secondary small">{u.name || u.fullName}</td>
                      <td className="small text-muted">{u.email}</td>
                      <td className="small text-muted">{u.phone || '-'}</td>
                      <td>
                        <span className={`badge ${u.role === 'Admin' ? 'bg-danger' : u.role?.includes('Officer') ? 'bg-warning text-dark' : 'bg-success'} text-white`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active !== false ? 'bg-success' : 'bg-secondary'}`}>
                          {u.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="small text-muted text-end pe-4">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: COMPLAINT DETAIL, STATUS UPDATE & DEPARTMENT REASSIGN
          ==================================================================== */}
      {selectedComplaint && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <div>
                  <span className="badge bg-primary-soft text-primary rounded-pill px-2.5 py-1 small mb-1">
                    {selectedComplaint.complaintCode || selectedComplaint.complaintId}
                  </span>
                  <h5 className="modal-title fw-bold text-secondary">{selectedComplaint.title}</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedComplaint(null)}></button>
              </div>

              <div className="modal-body pt-3 text-start">
                {/* Details Grid */}
                <div className="row g-3 bg-light rounded-3 p-3 mb-3 small">
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Department</span>
                    <strong>{selectedComplaint.departmentName || 'Unassigned'}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Status &bull; Priority</span>
                    <span className="badge bg-primary me-2">{selectedComplaint.status}</span>
                    <span className="badge bg-light text-dark border">{selectedComplaint.priority}</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">Citizen</span>
                    <span>{selectedComplaint.citizenName} ({selectedComplaint.citizenPhone || selectedComplaint.citizenEmail})</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block">District / ULB</span>
                    <span>{selectedComplaint.district} - {selectedComplaint.ulbName}</span>
                  </div>
                  <div className="col-12">
                    <span className="text-muted d-block">Description</span>
                    <p className="mb-0 text-secondary">{selectedComplaint.description || '-'}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4">
                  <span className="text-muted small fw-semibold d-block mb-2">Complaint Timeline:</span>
                  <div className="border rounded-3 p-3 bg-white" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                    {selectedComplaint.timeline?.map((ev, i) => (
                      <div key={i} className="border-bottom py-1.5 small">
                        <strong>{ev.title || ev.status}: </strong>
                        <span>{ev.remarks || ev.description}</span>
                        <span className="text-muted text-xxs d-block" style={{ fontSize: '0.68rem' }}>
                          By {ev.actorName || ev.actorRole} &bull; {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 1. Update Status Box */}
                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                  <h6 className="fw-bold text-secondary mb-2">Update Complaint Status</h6>
                  <form onSubmit={handleUpdateStatus}>
                    <div className="row g-2">
                      <div className="col-sm-4">
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
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Status update remarks..."
                          value={statusRemark}
                          onChange={(e) => setStatusRemark(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-12 text-end mt-2">
                        <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3" disabled={actionLoading}>
                          Save Status Update
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 2. Reassign Department Box */}
                <div className="card border-0 bg-light rounded-3 p-3">
                  <h6 className="fw-bold text-secondary mb-2">Reassign Department</h6>
                  <form onSubmit={handleReassignDepartment}>
                    <div className="row g-2 align-items-center">
                      <div className="col-sm-8">
                        <select
                          className="form-select form-select-sm"
                          value={reassignDeptId}
                          onChange={(e) => setReassignDeptId(e.target.value)}
                          required
                        >
                          <option value="">Select target department...</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-sm-4 text-end">
                        <button type="submit" className="btn btn-warning btn-sm rounded-pill px-3 w-100" disabled={actionLoading}>
                          Reassign
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setSelectedComplaint(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE / EDIT DEPARTMENT
          ==================================================================== */}
      {deptModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-secondary">
                  {editingDept ? 'Edit Department' : 'Create New Department'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setDeptModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSaveDept}>
                <div className="modal-body text-start">
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Department Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. WATER, SANITATION"
                      value={deptForm.code}
                      onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Description</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Contact Email / Phone</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={deptForm.contact}
                      onChange={(e) => setDeptForm({ ...deptForm, contact: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setDeptModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm rounded-pill px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE / EDIT OFFICER
          ==================================================================== */}
      {officerModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-secondary">
                  {editingOfficer ? 'Edit Officer' : 'Create Officer Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setOfficerModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSaveOfficer}>
                <div className="modal-body text-start">
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Officer Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={officerForm.name}
                      onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  {!editingOfficer && (
                    <div className="mb-2">
                      <label className="form-label small fw-bold text-secondary mb-1">Email *</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        value={officerForm.email}
                        onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Phone</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={officerForm.phone}
                      onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })}
                    />
                  </div>
                  {!editingOfficer && (
                    <div className="mb-2">
                      <label className="form-label small fw-bold text-secondary mb-1">Initial Password *</label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        placeholder="Initial password for officer"
                        value={officerForm.initialPassword}
                        onChange={(e) => setOfficerForm({ ...officerForm, initialPassword: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <label className="form-label small fw-bold text-secondary mb-1">Assigned Department *</label>
                    <select
                      className="form-select form-select-sm"
                      value={officerForm.departmentId}
                      onChange={(e) => setOfficerForm({ ...officerForm, departmentId: e.target.value })}
                      required
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setOfficerModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm rounded-pill px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Officer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
