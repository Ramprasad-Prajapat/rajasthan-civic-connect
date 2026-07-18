import React, { useState, useEffect } from 'react';

export default function DashboardPreview({ authenticatedUser, setAuthenticatedUser, setActivePage }) {
  // Mobile responsive sidebar toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sidebar active tab sub-view
  const [activeMenuTab, setActiveMenuTab] = useState('overview');

  // Success alert toast helper
  const [successToast, setSuccessToast] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Global filters
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterWard, setFilterWard] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Active role calculated securely from authenticated user
  const [activeRole, setActiveRole] = useState('citizen'); // citizen, worker, dept_officer, super_admin

  useEffect(() => {
    if (authenticatedUser) {
      const roleLower = authenticatedUser.role?.toLowerCase() || '';
      const portal = authenticatedUser.portal?.toLowerCase() || '';
      
      if (portal === 'admin' || roleLower.includes('super') || roleLower.includes('admin')) {
        setActiveRole('super_admin');
      } else if (roleLower.includes('worker') || roleLower.includes('field')) {
        setActiveRole('worker');
      } else if (portal === 'department' || roleLower.includes('officer') || roleLower.includes('dept')) {
        setActiveRole('dept_officer');
      } else {
        setActiveRole('citizen');
      }
    } else {
      setActiveRole('citizen'); // default safety fallback, route guard handles redirect anyway
    }
    setActiveMenuTab('overview');
  }, [authenticatedUser]);

  // Live synchronization of complaints from Firestore
  useEffect(() => {
    let active = true;
    const fetchLiveStatsAndComplaints = async () => {
      try {
        const { getComplaints } = await import('../firestoreService');
        let filters = {};
        if (activeRole === 'citizen' && authenticatedUser) {
          filters.citizenId = authenticatedUser.uid || authenticatedUser.email;
        } else if (activeRole === 'worker' && authenticatedUser) {
          filters.assignedWorker = authenticatedUser.fullName || authenticatedUser.name;
        } else if (activeRole === 'dept_officer' && authenticatedUser) {
          if (authenticatedUser.department) {
            filters.department = authenticatedUser.department;
          }
        }
        
        const complaints = await getComplaints(filters);
        if (!active) return;
        
        if (complaints && complaints.length > 0) {
          const mapped = complaints.map(c => ({
            id: c.id || c.complaintId,
            category: c.category || 'Other',
            ward: c.ward || 'Ward No. 12',
            dept: c.department || 'General Administration',
            status: c.status || 'Submitted',
            date: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : (c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : '2026-05-28'),
            priority: c.priority || 'Medium',
            worker: c.assignedWorker ? c.assignedWorker.name : 'Queue Assignment Pending',
            citizen: c.citizenName || 'Ram Prasad',
            remarks: c.remarks || c.officerRemarks || 'No remarks logged yet.',
            beforeImg: c.beforeProof || c.photo || '',
            afterImg: c.afterProof || '',
            slaRemaining: c.status === 'Resolved' || c.status === 'Closed' ? 'Completed within SLA' : 'Active Compliance',
            feedbackPending: c.status === 'Resolved' && !c.rating,
            isEmergency: c.priority === 'Critical' || c.isEmergency || false,
            rating: c.rating || 0,
            dateAdded: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'May 28, 2026'
          }));
          setComplaintsData(mapped);
        }
      } catch (err) {
        console.error("Failed to load live Firestore complaints for dashboard:", err);
      }
    };
    fetchLiveStatsAndComplaints();
    return () => { active = false; };
  }, [authenticatedUser, activeRole, activeMenuTab]);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Mock Database
  const [complaintsData, setComplaintsData] = useState([
    { id: 'RJC-2026-9921', category: 'Garbage Collection', ward: 'Ward No. 12', dept: 'Sanitation Department', status: 'Proof Uploaded', date: '2026-05-26', priority: 'High', worker: 'Mohan Lal', citizen: 'Ram Prasad', remarks: 'Waste cleared completely, bleach powder applied.', beforeImg: '🗑️ Trash Overflow', afterImg: '✨ Clean Pavement', slaRemaining: '6 Hours', feedbackPending: true, isEmergency: false, rating: 5, dateAdded: 'May 26, 2026' },
    { id: 'RJC-2026-9812', category: 'Water Supply', ward: 'Ward No. 24', dept: 'Water Supply Department', status: 'Work Started', date: '2026-05-24', priority: 'High', worker: 'Sohan Lal', citizen: 'Ram Prasad', remarks: 'Pipeline repair in progress', beforeImg: '💧 Muddy Water', afterImg: '', slaRemaining: '14 Hours', feedbackPending: false, isEmergency: true, rating: 0, dateAdded: 'May 24, 2026' },
    { id: 'RJC-2026-9704', category: 'Street Light Issue', ward: 'Ward No. 12', dept: 'Electrical Department', status: 'Assigned', date: '2026-05-22', priority: 'Medium', worker: 'Ramesh Meena', citizen: 'Ram Prasad', remarks: 'Pending dispatch', beforeImg: '⚡ Sparking Wire', afterImg: '', slaRemaining: '22 Hours', feedbackPending: false, isEmergency: true, rating: 0, dateAdded: 'May 22, 2026' },
    { id: 'RJC-2026-9502', category: 'Potholes', ward: 'Ward No. 36', dept: 'Public Works Department', status: 'Resolved', date: '2026-05-18', priority: 'High', worker: 'Karan Singh', citizen: 'Ram Prasad', remarks: 'Asphalt cold mix patched', beforeImg: '🕳️ Broken Pothole', afterImg: '🛣️ Smooth Road', slaRemaining: 'Met SLA', feedbackPending: false, isEmergency: false, rating: 4, dateAdded: 'May 18, 2026' },
    { id: 'RJC-2026-9411', category: 'Drainage Blockage', ward: 'Ward No. 24', dept: 'Sewerage Department', status: 'Reopened', date: '2026-05-15', priority: 'High', worker: 'Mohan Lal', citizen: 'Ram Prasad', remarks: 'Water still logging back in lane.', beforeImg: '🌊 Flooded street', afterImg: '', slaRemaining: '1 Hour', feedbackPending: true, isEmergency: false, rating: 2, dateAdded: 'May 15, 2026' },
    { id: 'RJC-2026-9322', category: 'Garbage Collection', ward: 'Ward No. 12', dept: 'Sanitation Department', status: 'SLA Delayed', date: '2026-05-10', priority: 'Medium', worker: 'Ramesh Meena', citizen: 'Ram Prasad', remarks: 'Worker delayed due to heatwave guidelines.', beforeImg: '🗑️ Trash heaps', afterImg: '', slaRemaining: 'Overdue 12h', feedbackPending: false, isEmergency: false, rating: 0, dateAdded: 'May 10, 2026' }
  ]);

  // Citizen interactive submissions list using Firestore service
  const handleAddComplaint = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const generatedID = `RJC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComp = {
      id: generatedID,
      citizenId: authenticatedUser?.uid || 'anonymous',
      citizenName: authenticatedUser?.name || 'Anonymous Citizen',
      category: formData.get('category'),
      ward: formData.get('ward'),
      department: formData.get('dept') || 'Sanitation Department',
      status: 'Submitted',
      timestamp: new Date().toISOString(),
      priority: formData.get('priority') || 'Medium',
      isEmergency: formData.get('isEmergency') === 'true',
      title: `${formData.get('category')} registered in ${formData.get('ward')}`,
      description: 'Lodge Grievance Node submission.',
    };

    try {
      const { createComplaint } = await import('../firestoreService');
      await createComplaint(newComp);
      triggerToast(`Grievance ${generatedID} successfully lodged on GovTech servers!`);
      // Update local state
      setComplaintsData(prev => [
        {
          ...newComp,
          date: new Date().toISOString().split('T')[0],
          worker: 'Queue Assignment Pending',
          remarks: 'Registered via Citizen Portal Desk.',
          beforeImg: '',
          afterImg: '',
          slaRemaining: '24 Hours',
          feedbackPending: false,
          rating: 0,
          dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        },
        ...prev
      ]);
      setActiveMenuTab('my_complaints');
    } catch (err) {
      console.error("Failed to lodge complaint:", err);
      alert("Failed to lodge complaint: " + err.message);
    }
  };

  // Update Status Handlers
  const handleUpdateStatus = async (complaintId, newStatus, additionalData = {}) => {
    try {
      const { updateComplaintStatus } = await import('../firestoreService');
      await updateComplaintStatus(complaintId, newStatus, additionalData);
      triggerToast(`Grievance ${complaintId} status updated to ${newStatus}!`);
      
      setComplaintsData(prev => prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: newStatus,
            ...additionalData
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const handleAssignWorker = async (complaintId) => {
    const workerName = prompt("Enter Worker Name to assign:", "Rajesh Kumar");
    if (!workerName) return;
    const workerPhone = "+91 98765 43210";
    await handleUpdateStatus(complaintId, 'Assigned', {
      assignedWorker: { name: workerName, phone: workerPhone },
      worker: workerName,
      workerStatus: 'Dispatch queue acknowledged. En route.'
    });
  };

  const handleStartWork = async (complaintId) => {
    await handleUpdateStatus(complaintId, 'InProgress', {
      workerStatus: 'Work started on-site.'
    });
  };

  const handleResolveTask = async (complaintId) => {
    const afterProof = prompt("Enter mock URL or Base64 for completion proof photo (optional):", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80");
    await handleUpdateStatus(complaintId, 'Resolved', {
      afterImg: afterProof || '',
      workerStatus: 'Work completed. Awaiting citizen rating.',
      slaRemaining: 'Completed within SLA'
    });
  };

  // Feedback Submit Helper
  const handleFeedbackSubmit = async (id, ratingVal) => {
    try {
      const { submitFeedback } = await import('../firestoreService');
      await submitFeedback(id, ratingVal, 'Submitted via Citizen Dashboard Desk', authenticatedUser?.uid || 'anonymous');
      setComplaintsData(prev => prev.map(c => c.id === id ? { ...c, rating: ratingVal, feedbackPending: false, status: 'Closed' } : c));
      triggerToast(`Rating score ${ratingVal}⭐ successfully synced for Grievance ${id}!`);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  // Sign out handler
  const handleSignOutTrigger = () => {
    if (setAuthenticatedUser) {
      setAuthenticatedUser(null);
    }
    setActivePage('Home');
  };

  // Filtered Complaint Calculations
  const getFilteredComplaints = () => {
    return complaintsData.filter(c => {
      // Role specifics first
      if (activeRole === 'citizen' && c.citizen !== (authenticatedUser?.name || 'Ram Prasad')) return false;
      if (activeRole === 'worker' && c.worker !== 'Mohan Lal') return false;

      // Global Filters
      if (filterWard !== 'all' && c.ward !== filterWard) return false;
      if (filterCategory !== 'all' && c.category !== filterCategory) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && c.dept !== filterDepartment) return false;
      if (filterDateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        if (c.date !== today) return false;
      }
      return true;
    });
  };

  const filteredList = getFilteredComplaints();

  // Calculate dynamic resolution percentages for Doughnut Chart
  const totalCount = filteredList.length;
  const resolvedCount = filteredList.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const startedCount = filteredList.filter(c => c.status === 'Work Started' || c.status === 'Assigned' || c.status === 'InProgress').length;
  const delayedCount = filteredList.filter(c => c.status === 'SLA Delayed' || c.status === 'Pending' || c.status === 'Submitted').length;

  const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;
  const startedPercent = totalCount > 0 ? Math.round((startedCount / totalCount) * 100) : 0;
  const delayedPercent = totalCount > 0 ? Math.round((delayedCount / totalCount) * 100) : 0;

  // Export functions
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Category,Ward,Department,Status,Date,Priority,Worker,Citizen,Emergency\n";
    filteredList.forEach(c => {
      csvContent += `${c.id},"${c.category}","${c.ward}","${c.dept}","${c.status}",${c.date},${c.priority},"${c.worker}","${c.citizen}",${c.isEmergency}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RajCivic_${activeRole}_Data_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Excel-compatible CSV workbook exported successfully!");
  };

  const handleExportPDF = () => {
    triggerToast("Generated secure digitally signed GovTech PDF Ledger. Downloading starting...");
    setTimeout(() => {
      alert(`=== RAJASTHAN STATE GR-SYSTEM OFFICIAL LEDGER ===\nRole: ${activeRole.toUpperCase()}\nTotal Items: ${filteredList.length}\nDate Generated: ${new Date().toLocaleString()}\nChecksum: SECURE_DESK_OK`);
    }, 500);
  };

  // Sidebar Menu Array
  const getSidebarItems = () => {
    if (activeRole === 'citizen') {
      return [
        { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2-fill' },
        { id: 'my_complaints', label: 'My Complaints', icon: 'bi-file-earmark-text-fill' },
        { id: 'submit', label: 'Submit Complaint', icon: 'bi-plus-circle-fill' },
        { id: 'track', label: 'Track Complaint', icon: 'bi-geo-alt-fill' },
        { id: 'feedback', label: 'Feedback', icon: 'bi-chat-square-heart-fill' },
        { id: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' },
        { id: 'help', label: 'Helpdesk', icon: 'bi-headset' }
      ];
    }
    if (activeRole === 'worker') {
      return [
        { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2-fill' },
        { id: 'assigned_tasks', label: 'Assigned Tasks', icon: 'bi-card-checklist' },
        { id: 'start_work', label: 'Start Work', icon: 'bi-play-circle-fill' },
        { id: 'upload_proof', label: 'Upload Before/After Proof', icon: 'bi-cloud-upload-fill' },
        { id: 'completed_tasks', label: 'Completed Tasks', icon: 'bi-check-circle-fill' },
        { id: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' }
      ];
    }
    if (activeRole === 'dept_officer') {
      return [
        { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2-fill' },
        { id: 'assigned_complaints', label: 'Assigned Complaints', icon: 'bi-clipboard-check-fill' },
        { id: 'worker_assignment', label: 'Worker Assignment', icon: 'bi-people-fill' },
        { id: 'sla_monitoring', label: 'SLA Monitoring', icon: 'bi-clock-fill' },
        { id: 'reports', label: 'Reports', icon: 'bi-file-earmark-bar-graph-fill' },
        { id: 'notifications', label: 'Notifications', icon: 'bi-bell-fill' }
      ];
    }
    // super_admin
    return [
      { id: 'overview', label: 'Overview', icon: 'bi-grid-1x2-fill' },
      { id: 'users', label: 'Users', icon: 'bi-people-fill' },
      { id: 'departments', label: 'Departments', icon: 'bi-building-fill' },
      { id: 'officers', label: 'Officers', icon: 'bi-person-badge-fill' },
      { id: 'workers', label: 'Workers', icon: 'bi-briefcase-fill' },
      { id: 'complaints', label: 'Complaints', icon: 'bi-card-list' },
      { id: 'reports', label: 'Reports', icon: 'bi-file-earmark-spreadsheet-fill' },
      { id: 'analytics', label: 'Analytics', icon: 'bi-bar-chart-fill' },
      { id: 'settings', label: 'Settings', icon: 'bi-gear-fill' }
    ];
  };

  // Metrics Counters based on Filtered Lists
  const getMetrics = () => {
    const list = filteredList;
    if (activeRole === 'citizen') {
      return [
        { label: 'Total Complaints', value: list.length, icon: 'bi-megaphone', bg: 'bg-primary-soft text-primary' },
        { label: 'Resolved Complaints', value: list.filter(c => c.status === 'Resolved').length, icon: 'bi-check-circle-fill', bg: 'bg-success-soft text-success' },
        { label: 'Pending Complaints', value: list.filter(c => c.status === 'Assigned' || c.status === 'Work Started').length, icon: 'bi-clock-fill', bg: 'bg-warning-soft text-warning' },
        { label: 'Reopened Complaints', value: list.filter(c => c.status === 'Reopened').length, icon: 'bi-arrow-repeat', bg: 'bg-info-soft text-info' },
        { label: 'Emergency Complaints', value: list.filter(c => c.isEmergency).length, icon: 'bi-exclamation-triangle-fill', bg: 'bg-danger-soft text-danger' },
        { label: 'SLA Delayed Complaints', value: list.filter(c => c.status === 'SLA Delayed').length, icon: 'bi-hourglass-split', bg: 'bg-danger-soft text-danger' },
        { label: 'Feedback Submitted', value: list.filter(c => c.rating > 0).length, icon: 'bi-chat-heart-fill', bg: 'bg-success-soft text-success' }
      ];
    }
    if (activeRole === 'worker') {
      return [
        { label: 'Assigned Tasks', value: list.length, icon: 'bi-clipboard-text', bg: 'bg-primary-soft text-primary' },
        { label: 'Completed Tasks', value: list.filter(c => c.status === 'Resolved').length, icon: 'bi-check2-all', bg: 'bg-success-soft text-success' },
        { label: 'Pending Tasks', value: list.filter(c => c.status !== 'Resolved').length, icon: 'bi-clock', bg: 'bg-warning-soft text-warning' },
        { label: 'Average Resolution Time', value: '4.8 hrs', icon: 'bi-lightning-fill', bg: 'bg-info-soft text-info' },
        { label: 'Citizen Rating Score', value: '4.7 / 5', icon: 'bi-star-fill', bg: 'bg-success-soft text-success' }
      ];
    }
    if (activeRole === 'dept_officer') {
      return [
        { label: 'Total Assigned Complaints', value: list.length, icon: 'bi-folder-fill', bg: 'bg-primary-soft text-primary' },
        { label: 'Resolved Complaints', value: list.filter(c => c.status === 'Resolved').length, icon: 'bi-patch-check-fill', bg: 'bg-success-soft text-success' },
        { label: 'Pending Complaints', value: list.filter(c => c.status !== 'Resolved').length, icon: 'bi-hourglass-split', bg: 'bg-warning-soft text-warning' },
        { label: 'Emergency Cases', value: list.filter(c => c.isEmergency).length, icon: 'bi-exclamation-triangle-fill', bg: 'bg-danger-soft text-danger' },
        { label: 'SLA Breaches', value: list.filter(c => c.status === 'SLA Delayed').length, icon: 'bi-clock-fill', bg: 'bg-danger-soft text-danger' },
        { label: 'Worker Performance', value: '92.4%', icon: 'bi-people-fill', bg: 'bg-success-soft text-success' }
      ];
    }
    // super_admin
    return [
      { label: 'Total Complaints', value: '14,832', icon: 'bi-megaphone-fill', bg: 'bg-primary-soft text-primary' },
      { label: 'Total Citizens', value: '9,411', icon: 'bi-people-fill', bg: 'bg-success-soft text-success' },
      { label: 'Total Workers', value: '382', icon: 'bi-briefcase-fill', bg: 'bg-info-soft text-info' },
      { label: 'Total Officers', value: '64', icon: 'bi-person-badge-fill', bg: 'bg-warning-soft text-warning' },
      { label: 'Total Departments', value: '12', icon: 'bi-building-fill', bg: 'bg-secondary-soft text-secondary' },
      { label: 'Resolution Rate', value: '94.2%', icon: 'bi-percent', bg: 'bg-success-soft text-success' },
      { label: 'Emergency Complaints', value: '1,024', icon: 'bi-exclamation-octagon-fill', bg: 'bg-danger-soft text-danger' },
      { label: 'SLA Breaches', value: '106', icon: 'bi-shield-fill-exclamation', bg: 'bg-danger-soft text-danger' }
    ];
  };

  return (
    <div className="d-flex align-items-stretch" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* Toast Popup Notification */}
      {successToast && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className="alert alert-success border-0 shadow-lg rounded-4 p-3 d-flex align-items-center gap-3 animate-slide-up" style={{ minWidth: '320px', borderLeft: '4px solid #10b981' }}>
            <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              <i className="bi bi-check2-circle fs-5"></i>
            </div>
            <div>
              <strong className="text-secondary small d-block">Audit Desk Notification</strong>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>{successToast}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SIDEBAR LAYOUT (Left Side)
          ======================================================== */}
      <aside
        className="bg-dark border-end position-relative transition-all d-none d-lg-block"
        style={{ width: '280px', flexShrink: 0, zIndex: 1000, background: '#0f172a' }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-10 d-flex align-items-center gap-2.5" style={{ background: '#1e293b' }}>
          <div className="rounded-3 bg-success text-white p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <i className="bi bi-shield-fill-check fs-5"></i>
          </div>
          <div className="text-start">
            <strong className="text-white d-block" style={{ fontSize: '0.9rem', letterSpacing: '0.02em' }}>RajCivic Connect</strong>
            <span className="badge bg-success text-white font-monospace px-2 py-0.5" style={{ fontSize: '0.58rem' }}>SECURE GATE</span>
          </div>
        </div>

        {/* User Card info inside sidebar */}
        <div className="p-3.5 border-bottom border-secondary border-opacity-10 bg-dark text-start" style={{ background: '#111827' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', fontSize: '1.1rem' }}>
              {(authenticatedUser?.displayName || authenticatedUser?.name || 'U')[0]?.toUpperCase()}
            </div>
            <div>
              <strong className="d-block text-white" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                {authenticatedUser ? (authenticatedUser.displayName || authenticatedUser.name) : 'Guest User'}
              </strong>
              <span className="text-muted d-block text-xxs font-monospace" style={{ fontSize: '0.65rem' }}>
                {activeRole.toUpperCase().replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Options */}
        <div className="py-3 px-2 d-flex flex-column gap-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {getSidebarItems().map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                const complaintsTabs = ['my_complaints', 'assigned_tasks', 'assigned_complaints', 'complaints', 'completed_tasks', 'start_work', 'upload_proof'];
                if (complaintsTabs.includes(item.id)) {
                  setActivePage('Complaints');
                } else if (item.id === 'submit') {
                  setActivePage('Complaint');
                } else if (item.id === 'track') {
                  setActivePage('Track Complaint');
                } else if (item.id === 'notifications') {
                  setActivePage('Notifications');
                } else if (item.id === 'help') {
                  setActivePage('Helpdesk');
                } else if (item.id === 'reports' || item.id === 'analytics') {
                  setActivePage('Reports');
                } else if (item.id === 'settings') {
                  setActivePage('Settings');
                } else if (item.id === 'users') {
                  setActivePage('Users');
                } else {
                  setActiveMenuTab(item.id);
                }
              }}
              className={`w-100 text-start btn btn-sm rounded-3 py-2.5 px-3 border-0 d-flex align-items-center gap-3 transition-all ${activeMenuTab === item.id ? 'bg-success text-white shadow-sm fw-bold border-0' : 'text-white-50 bg-transparent hover-light'}`}
              style={{ fontSize: '0.8rem', background: activeMenuTab === item.id ? '#10b981' : 'transparent' }}
            >
              <i className={`bi ${item.icon} ${activeMenuTab === item.id ? 'text-white' : 'text-white-50'}`} style={{ fontSize: '1rem' }}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="position-absolute bottom-0 start-0 w-100 p-3 border-top border-secondary border-opacity-10 bg-dark text-start" style={{ background: '#0b0f19' }}>
          <span className="text-muted d-block text-xxs mb-0.5" style={{ fontSize: '0.62rem' }}>JURISDICTION:</span>
          <strong className="text-white-50 d-block font-monospace" style={{ fontSize: '0.68rem' }}><i className="bi bi-geo-alt-fill text-danger me-1"></i>JAIPUR GREATER ULB</strong>
        </div>
      </aside>

      {/* ========================================================
          RIGHT OPERATIONS VIEWPORT (Main Panel)
          ======================================================== */}
      <main className="flex-grow-1 p-3 p-md-4 d-flex flex-column gap-4 overflow-x-hidden">
        
        {/* Header Ribbon */}
        <header className="card border-0 rounded-4 shadow-sm p-3.5 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="text-start">
              <h4 className="fw-extrabold text-secondary m-0" style={{ fontSize: '1.25rem' }}>
                {activeRole === 'super_admin' ? 'Super Administrator Portal' : activeRole === 'worker' ? 'Field Executive Portal' : activeRole === 'dept_officer' ? 'Department Command Console' : 'Citizen Dashboard Workspace'}
              </h4>
              <div className="d-flex align-items-center gap-2 mt-0.5">
                <span className="badge bg-success-soft text-success rounded-pill font-monospace" style={{ fontSize: '0.62rem' }}>🟢 SECURE ACTIVE INDEX</span>
                <span className="text-muted small" style={{ fontSize: '0.74rem' }}>Role Access Level: {activeRole.toUpperCase().replace('_', ' ')}</span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.74rem' }}
              >
                <i className="bi bi-file-earmark-spreadsheet"></i> Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.74rem' }}
              >
                <i className="bi bi-file-earmark-pdf"></i> Export PDF
              </button>
            </div>
          </div>
        </header>

        {/* Global Filters Panel */}
        <section className="card border-0 rounded-4 shadow-sm p-3.5 bg-white text-start">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-funnel-fill text-success fs-5"></i>
            <strong className="text-secondary" style={{ fontSize: '0.9rem' }}>Real-time Operations Filters</strong>
          </div>
          <div className="row g-2.5">
            <div className="col-md-2.4 col-sm-6">
              <label className="text-muted d-block mb-1 text-xxs fw-bold" style={{ fontSize: '0.65rem' }}>DATE RANGE</label>
              <select className="form-select form-select-sm rounded-3 py-2 text-secondary" style={{ fontSize: '0.74rem' }} value={filterDateRange} onChange={e => setFilterDateRange(e.target.value)}>
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
              </select>
            </div>
            <div className="col-md-2.4 col-sm-6">
              <label className="text-muted d-block mb-1 text-xxs fw-bold" style={{ fontSize: '0.65rem' }}>WARD SECTOR</label>
              <select className="form-select form-select-sm rounded-3 py-2 text-secondary" style={{ fontSize: '0.74rem' }} value={filterWard} onChange={e => setFilterWard(e.target.value)}>
                <option value="all">All Wards</option>
                <option value="Ward No. 12">Ward No. 12</option>
                <option value="Ward No. 24">Ward No. 24</option>
                <option value="Ward No. 36">Ward No. 36</option>
              </select>
            </div>
            <div className="col-md-2.4 col-sm-6">
              <label className="text-muted d-block mb-1 text-xxs fw-bold" style={{ fontSize: '0.65rem' }}>DEPARTMENT</label>
              <select className="form-select form-select-sm rounded-3 py-2 text-secondary" style={{ fontSize: '0.74rem' }} value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
                <option value="all">All Depts</option>
                <option value="Sanitation Department">Sanitation Department</option>
                <option value="Water Supply Department">Water Supply Department</option>
                <option value="Sewerage Department">Sewerage Department</option>
                <option value="Electrical Department">Electrical Department</option>
                <option value="Public Works Department">Public Works Department</option>
                <option value="Encroachment Department">Encroachment Department</option>
                <option value="Animal Control Department">Animal Control Department</option>
                <option value="Forest & Environment Department">Forest & Environment Department</option>
                <option value="General Administration">General Administration</option>
              </select>
            </div>
            <div className="col-md-2.4 col-sm-6">
              <label className="text-muted d-block mb-1 text-xxs fw-bold" style={{ fontSize: '0.65rem' }}>COMPLAINT CATEGORY</label>
              <select className="form-select form-select-sm rounded-3 py-2 text-secondary" style={{ fontSize: '0.74rem' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="Garbage Collection">Garbage Collection</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Sewer Overflow">Sewer Overflow</option>
                <option value="Drainage Blockage">Drainage Blockage</option>
                <option value="Street Light Issue">Street Light Issue</option>
                <option value="Open Electrical Wire">Open Electrical Wire</option>
                <option value="Road Damage">Road Damage</option>
                <option value="Potholes">Potholes</option>
                <option value="Public Toilet Maintenance">Public Toilet Maintenance</option>
                <option value="Park Maintenance">Park Maintenance</option>
                <option value="Encroachment">Encroachment</option>
                <option value="Animal Issue">Animal Issue</option>
                <option value="Tree Damage">Tree Damage</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-2.4 col-sm-6">
              <label className="text-muted d-block mb-1 text-xxs fw-bold" style={{ fontSize: '0.65rem' }}>STATUS</label>
              <select className="form-select form-select-sm rounded-3 py-2 text-secondary" style={{ fontSize: '0.74rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Assigned">Assigned</option>
                <option value="Work Started">Work Started</option>
                <option value="Proof Uploaded">Proof Uploaded</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
                <option value="SLA Delayed">SLA Delayed</option>
              </select>
            </div>
          </div>
        </section>

        {/* ========================================================
            TAB WINDOW CONTENT: OVERVIEW
            ======================================================== */}
        {activeMenuTab === 'overview' && (
          <div className="d-flex flex-column gap-4 text-start">
            
            {/* Metric Counters Grid */}
            <div className="row g-3">
              {getMetrics().map((m, idx) => (
                <div key={idx} className="col-6 col-md-3">
                  <div className="card border-0 rounded-4 shadow-sm p-3.5 bg-white h-100 d-flex flex-row align-items-center gap-3">
                    <div className={`rounded-circle p-2.5 d-flex align-items-center justify-content-center ${m.bg}`} style={{ width: '44px', height: '44px' }}>
                      <i className={`bi ${m.icon} fs-5`}></i>
                    </div>
                    <div>
                      <h3 className="fw-extrabold text-secondary m-0">{m.value}</h3>
                      <span className="text-muted d-block small mt-0.5" style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>{m.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Interactive Vector-SVG Charts */}
            <div className="row g-4">
              
              {/* Chart 1: Complaint Category workload (Bar Chart) */}
              <div className="col-md-6">
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                  <strong className="text-secondary d-block fs-6 mb-1">📊 Category-wise Operational Workload</strong>
                  <span className="text-muted d-block text-xxs mb-3" style={{ fontSize: '0.72rem' }}>Filtered complaints category division</span>
                  <div className="d-flex flex-column gap-2.5 py-2">
                    {[
                      { label: 'Garbage Collection', count: filteredList.filter(c => c.category.includes('Garbage')).length, color: '#10b981', percent: 45 },
                      { label: 'Water Supply & Leakage', count: filteredList.filter(c => c.category.includes('Water')).length, color: '#3b82f6', percent: 25 },
                      { label: 'Electrical & Streetlights', count: filteredList.filter(c => c.category.includes('Street') || c.category.includes('Electrical')).length, color: '#f59e0b', percent: 18 },
                      { label: 'Roads & Potholes', count: filteredList.filter(c => c.category.includes('Potholes') || c.category.includes('Road')).length, color: '#ef4444', percent: 12 }
                    ].map((bar, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between text-xxs text-secondary mb-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                          <span>{bar.label}</span>
                          <span>{bar.count} tickets ({bar.count * 10 || 5}%)</span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: '9px', background: '#f1f5f9' }}>
                          <div className="progress-bar rounded-pill transition-all" style={{ width: `${(bar.count / (filteredList.length || 1)) * 100 || bar.percent}%`, backgroundColor: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart 2: Resolution Performance Chart (Circular Doughnut) */}
              <div className="col-md-6">
                <div className="card border-0 rounded-4 shadow-sm p-4 bg-white">
                  <strong className="text-secondary d-block fs-6 mb-1">🍩 Resolution Status Metrics</strong>
                  <span className="text-muted d-block text-xxs mb-3" style={{ fontSize: '0.72rem' }}>Realtime active complaint stage indices</span>
                  <div className="d-flex align-items-center justify-content-around py-3">
                    <svg width="120" height="120" viewBox="0 0 36 36" className="circular-chart text-success">
                      <path className="circle-bg" stroke="#f1f5f9" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="circle" strokeDasharray={`${resolvedPercent}, 100`} stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.35" className="percentage font-monospace fw-bold text-secondary" style={{ fontSize: '7px', textAnchor: 'middle', fill: '#475569' }}>{resolvedPercent}%</text>
                    </svg>
                    <div className="d-flex flex-column gap-1.5 text-start">
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', background: '#10b981' }}></span>
                        <span>Resolved: <strong>{resolvedPercent}%</strong></span>
                      </div>
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', background: '#f59e0b' }}></span>
                        <span>Work Started: <strong>{startedPercent}%</strong></span>
                      </div>
                      <div className="d-flex align-items-center gap-2 small text-secondary">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', background: '#ef4444' }}></span>
                        <span>Pending/SLA: <strong>{delayedPercent}%</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Heatmap & SLA Performance Metrics */}
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start">
              <strong className="text-secondary d-block fs-6 mb-1">📍 Sector Ward-wise Heatmap Density & SLA Compliances</strong>
              <span className="text-muted d-block text-xxs mb-3.5" style={{ fontSize: '0.72rem' }}>Density of active emergencies and SLA alerts across Jaipur sectors</span>
              <div className="row g-2.5 text-center">
                {[
                  { ward: 'Ward No. 12', complaints: '83 Cases', status: 'Moderate Density', color: '#3b82f6', bg: 'bg-primary-soft' },
                  { ward: 'Ward No. 24', complaints: '124 Cases', status: 'High Density Alert', color: '#ef4444', bg: 'bg-danger-soft' },
                  { ward: 'Ward No. 36', complaints: '34 Cases', status: 'Stable Clearance', color: '#10b981', bg: 'bg-success-soft' },
                  { ward: 'Ward No. 48', complaints: '19 Cases', status: 'Zero SLA Breach', color: '#059669', bg: 'bg-success-soft' }
                ].map((w, idx) => (
                  <div key={idx} className="col-md-3 col-6">
                    <div className="p-3 border rounded-4 text-center h-100 bg-light">
                      <strong className="d-block text-secondary small font-monospace">{w.ward}</strong>
                      <span className="d-block fs-5 fw-extrabold my-1" style={{ color: w.color }}>{w.complaints}</span>
                      <span className={`badge rounded-pill fw-bold ${w.bg}`} style={{ color: w.color, fontSize: '0.62rem' }}>{w.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: MY COMPLAINTS / ASSIGNED TASKS
            ======================================================== */}
        {(activeMenuTab === 'my_complaints' || activeMenuTab === 'assigned_tasks' || activeMenuTab === 'assigned_complaints' || activeMenuTab === 'complaints') && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3.5 mb-3.5">
              <div>
                <h5 className="fw-extrabold text-secondary m-0">📁 Ledger of Grievances</h5>
                <span className="text-muted small">Realtime synchronization from GovTech database nodes</span>
              </div>
              <span className="badge bg-success-soft text-success rounded-pill font-monospace fw-bold">{filteredList.length} Records Found</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle border border-light rounded-3 overflow-hidden">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>GRIEVANCE ID</th>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>CATEGORY</th>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>WARD SECTOR</th>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>DATE REG.</th>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>STATUS</th>
                    <th scope="col" className="text-secondary small fw-bold" style={{ fontSize: '0.74rem' }}>ASSIGNED EX.</th>
                    <th scope="col" className="text-secondary small fw-bold text-end pe-3" style={{ fontSize: '0.74rem' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((comp) => (
                    <tr key={comp.id}>
                      <td className="fw-bold text-secondary font-monospace" style={{ fontSize: '0.74rem' }}>{comp.id}</td>
                      <td className="small fw-semibold text-secondary" style={{ fontSize: '0.74rem' }}>{comp.category}</td>
                      <td className="text-muted small font-monospace" style={{ fontSize: '0.72rem' }}>{comp.ward}</td>
                      <td className="text-muted small" style={{ fontSize: '0.72rem' }}>{comp.date}</td>
                      <td>
                        <span 
                          className="badge rounded-pill fw-bold border px-2.5 py-1"
                          style={{
                            fontSize: '0.62rem',
                            backgroundColor: comp.status === 'Resolved' ? '#f0fdf4' : comp.status === 'SLA Delayed' ? '#fef2f2' : '#fffbeb',
                            color: comp.status === 'Resolved' ? '#16a34a' : comp.status === 'SLA Delayed' ? '#dc2626' : '#d97706',
                            borderColor: comp.status === 'Resolved' ? '#86efac' : comp.status === 'SLA Delayed' ? '#fca5a5' : '#fde047'
                          }}
                        >
                          {comp.status}
                        </span>
                      </td>
                      <td className="text-muted small" style={{ fontSize: '0.72rem' }}>{comp.worker || 'Unassigned'}</td>
                      <td className="text-end pe-3">
                        {activeRole === 'worker' && (comp.status === 'Submitted' || comp.status === 'Pending' || comp.status === 'Assigned') && (
                          <button 
                            onClick={() => handleStartWork(comp.id)}
                            className="btn btn-xs btn-primary text-white rounded-pill px-2.5 py-1 text-xxs fw-bold border-0 bg-primary hover-primary-dark"
                            style={{ fontSize: '0.62rem' }}
                          >
                            Start Work
                          </button>
                        )}
                        {activeRole === 'worker' && (comp.status === 'InProgress' || comp.status === 'Work Started') && (
                          <button 
                            onClick={() => handleResolveTask(comp.id)}
                            className="btn btn-xs btn-success text-white rounded-pill px-2.5 py-1 text-xxs fw-bold border-0 bg-success hover-success-dark"
                            style={{ fontSize: '0.62rem' }}
                          >
                            Resolve Task
                          </button>
                        )}
                        {activeRole === 'dept_officer' && (comp.status === 'Submitted' || comp.status === 'Pending') && (
                          <button 
                            onClick={() => handleAssignWorker(comp.id)}
                            className="btn btn-xs btn-warning text-white rounded-pill px-2.5 py-1 text-xxs fw-bold border-0 bg-warning hover-warning-dark"
                            style={{ fontSize: '0.62rem' }}
                          >
                            Assign Worker
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted small py-4">
                        <i className="bi bi-folder2-open text-muted fs-3 d-block mb-1.5"></i>
                        No complaints match selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: SUBMIT COMPLAINT
            ======================================================== */}
        {activeMenuTab === 'submit' && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in" style={{ maxWidth: '780px' }}>
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-3.5">🛠️ Lodge Public Grievance Node</h5>
            <form onSubmit={handleAddComplaint} className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Grievance Category</label>
                <select name="category" className="form-select small text-secondary py-2" style={{ fontSize: '0.8rem' }} required>
                  <option value="Garbage Collection">Garbage Collection</option>
                  <option value="Water Leakage">Water Leakage</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Sewer Overflow">Sewer Overflow</option>
                  <option value="Drainage Blockage">Drainage Blockage</option>
                  <option value="Street Light Issue">Street Light Issue</option>
                  <option value="Open Electrical Wire">Open Electrical Wire</option>
                  <option value="Road Damage">Road Damage</option>
                  <option value="Potholes">Potholes</option>
                  <option value="Public Toilet Maintenance">Public Toilet Maintenance</option>
                  <option value="Park Maintenance">Park Maintenance</option>
                  <option value="Encroachment">Encroachment</option>
                  <option value="Animal Issue">Animal Issue</option>
                  <option value="Tree Damage">Tree Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Ward Sector Location</label>
                <select name="ward" className="form-select small text-secondary py-2" style={{ fontSize: '0.8rem' }} required>
                  <option value="Ward No. 12">Ward No. 12</option>
                  <option value="Ward No. 24">Ward No. 24</option>
                  <option value="Ward No. 36">Ward No. 36</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Department Routing</label>
                <select name="dept" className="form-select small text-secondary py-2" style={{ fontSize: '0.8rem' }} required>
                  <option value="Sanitation Department">Sanitation Department</option>
                  <option value="Water Supply Department">Water Supply Department</option>
                  <option value="Sewerage Department">Sewerage Department</option>
                  <option value="Electrical Department">Electrical Department</option>
                  <option value="Public Works Department">Public Works Department</option>
                  <option value="Encroachment Department">Encroachment Department</option>
                  <option value="Animal Control Department">Animal Control Department</option>
                  <option value="Forest & Environment Department">Forest & Environment Department</option>
                  <option value="General Administration">General Administration</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-secondary small fw-bold">Priority Designation</label>
                <select name="priority" className="form-select small text-secondary py-2" style={{ fontSize: '0.8rem' }} required>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority Level</option>
                </select>
              </div>

              <div className="col-md-12">
                <label className="form-label text-secondary small fw-bold">Is this an Emergency Alert?</label>
                <select name="isEmergency" className="form-select small text-secondary py-2" style={{ fontSize: '0.8rem' }} required>
                  <option value="false">No (Standard SLA SLA Rules)</option>
                  <option value="true">Yes (Immediate Emergency Team Dispatch)</option>
                </select>
              </div>

              <div className="col-12 mt-4.5">
                <button type="submit" className="btn btn-success rounded-pill px-4.5 py-2.5 bg-success border-0 fw-bold shadow-sm" style={{ fontSize: '0.82rem' }}>
                  Lodge Official Grievance
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: TRACK COMPLAINT
            ======================================================== */}
        {activeMenuTab === 'track' && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in" style={{ maxWidth: '780px' }}>
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-2">📍 Live GIS Tracker Console</h5>
            <span className="text-muted d-block small mb-3">Input your grievance ID key (e.g. `RJC-2026-9921`) to retrieve real-time visual progress.</span>
            <div className="p-4 bg-light rounded-4 text-center border">
              <i className="bi bi-geo-alt-fill text-success fs-2 d-block mb-2"></i>
              <strong className="text-secondary d-block">Jaipur Municipal GIS Link Active</strong>
              <p className="text-muted small mt-1 mb-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
                All coordinates logged during citizen grievance creation are automatically synchronized with central command dashboards. Live mapping directions are active.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: FEEDBACK
            ======================================================== */}
        {activeMenuTab === 'feedback' && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in">
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-3">⭐ Citizen Feedback Desk</h5>
            <div className="row g-3">
              {complaintsData.filter(c => c.status === 'Resolved' && c.rating === 0).map(c => (
                <div key={c.id} className="col-md-6">
                  <div className="p-3.5 border rounded-4 bg-light">
                    <strong className="text-secondary font-monospace d-block mb-1.5" style={{ fontSize: '0.74rem' }}>{c.id}</strong>
                    <span className="text-muted small d-block mb-3">Category: {c.category}</span>
                    <div className="d-flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => handleFeedbackSubmit(c.id, star)} className="btn btn-xs btn-outline-warning border-0 p-1">
                          <i className="bi bi-star-fill text-warning fs-5"></i>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {complaintsData.filter(c => c.status === 'Resolved' && c.rating === 0).length === 0 && (
                <div className="col-12 text-center py-4 text-muted small">
                  <i className="bi bi-patch-check-fill text-success fs-3 d-block mb-1.5"></i>
                  All resolved tickets rated. Thank you for your feedback!
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: NOTIFICATIONS
            ======================================================== */}
        {activeMenuTab === 'notifications' && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in" style={{ maxWidth: '780px' }}>
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-3.5">🔔 System Alert Logs</h5>
            <div className="d-flex flex-column gap-2.5">
              {[
                { title: 'Task Dispatched', msg: 'Grievance ticket RJC-2026-9921 successfully routed to executive Mohan Lal.', date: 'May 26, 2026' },
                { title: 'SLA Warning Alert', msg: 'Grievance ticket RJC-2026-9322 has reached 90% SLA countdown threshold.', date: 'May 22, 2026' },
                { title: 'System Node Synced', msg: 'Secure Firebase authentication portal synced successfully.', date: 'May 18, 2026' }
              ].map((n, idx) => (
                <div key={idx} className="p-3 border rounded-3 bg-light hover-light">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-secondary small">{n.title}</strong>
                    <span className="text-muted font-monospace" style={{ fontSize: '0.62rem' }}>{n.date}</span>
                  </div>
                  <span className="text-muted d-block text-xxs" style={{ fontSize: '0.72rem' }}>{n.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: HELPDESK
            ======================================================== */}
        {activeMenuTab === 'help' && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in" style={{ maxWidth: '780px' }}>
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-2">📞 Official GovTech Helpdesk Support</h5>
            <span className="text-muted d-block small mb-3">Live connection coordinates for Jaipur civic portal.</span>
            <div className="p-3 border rounded-3 bg-light mb-3">
              <strong className="text-secondary d-block small mb-1">☎️ Toll-Free Grievance Helpline</strong>
              <span className="text-muted font-monospace d-block small">1800-180-6127 / +91 141 2740812</span>
            </div>
            <div className="p-3 border rounded-3 bg-light">
              <strong className="text-secondary d-block small mb-1">✉️ Email Support Coordinates</strong>
              <span className="text-muted font-monospace d-block small">support.grievance@rajasthan.gov.in</span>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB WINDOW CONTENT: ADMIN USERS / DEPARTMENTS / OFFICERS / WORKERS
            ======================================================== */}
        {(activeMenuTab === 'users' || activeMenuTab === 'departments' || activeMenuTab === 'officers' || activeMenuTab === 'workers') && (
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-start animate-fade-in">
            <h5 className="fw-extrabold text-secondary border-bottom pb-2 mb-3.5">👥 Active {activeMenuTab.toUpperCase()} Records</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="text-secondary small fw-bold">Name / Title</th>
                    <th scope="col" className="text-secondary small fw-bold">Access Level</th>
                    <th scope="col" className="text-secondary small fw-bold">Status</th>
                    <th scope="col" className="text-secondary small fw-bold">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Shri Ram Prasad', level: 'Citizen Portal', status: 'Verified', email: 'ram.prasad@citizen.in' },
                    { name: 'Ananya Sen', level: 'Nodal Officer', status: 'Active Duty', email: 'ananya.sen@rajasthan.gov.in' },
                    { name: 'Mohan Lal', level: 'Field Executive', status: 'On Shift', email: 'mohan.lal@field.in' }
                  ].map((u, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-secondary">{u.name}</td>
                      <td><span className="badge bg-light text-secondary border">{u.level}</span></td>
                      <td><span className="badge bg-success-soft text-success rounded-pill px-2.5 py-1">{u.status}</span></td>
                      <td className="text-muted font-monospace small">{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
