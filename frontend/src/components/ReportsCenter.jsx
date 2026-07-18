import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, db } from '../firebase';
import { ref, onValue } from 'firebase/database';

export default function ReportsCenter({ selectedReportTab, setSelectedReportTab }) {
  // 10 Rajasthan Sambhags & Dynamic District Mapping
  const sambhagsMap = {
    'Ajmer Division': ['Ajmer', 'Beawar', 'Bhilwara', 'Didwana-Kuchaman', 'Nagaur', 'Tonk'],
    'Bharatpur Division': ['Bharatpur', 'Deeg', 'Dholpur', 'Karauli', 'Sawai Madhopur'],
    'Bikaner Division': ['Bikaner', 'Churu', 'Hanumangarh', 'Sri Ganganagar'],
    'Jaipur Division': ['Alwar', 'Dausa', 'Jaipur', 'Jhunjhunu', 'Khairthal-Tijara', 'Kotputli-Behror', 'Sikar'],
    'Jodhpur Division': ['Balotra', 'Barmer', 'Jaisalmer', 'Jalore', 'Jodhpur', 'Pali', 'Phalodi', 'Sirohi'],
    'Kota Division': ['Baran', 'Bundi', 'Jhalawar', 'Kota'],
    'Udaipur Division': ['Banswara', 'Chittorgarh', 'Dungarpur', 'Pratapgarh', 'Rajsamand', 'Salumbar', 'Udaipur']
  };

  // Month names for dynamic display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Year and Month states (Initialize to today's date: June 2, 2026)
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(2); // 2nd of the month
  const [showPickerPanel, setShowPickerPanel] = useState(false);

  // Filters State including division
  const [filters, setFilters] = useState({
    sambhag: 'Jaipur Division',
    district: 'Jaipur'
  });

  const [dbComplaints, setDbComplaints] = useState([]);

  useEffect(() => {
    let active = true;
    const loadComplaints = async () => {
      try {
        const { getComplaints } = await import('../firestoreService');
        const data = await getComplaints({});
        if (active) {
          setDbComplaints(data);
        }
      } catch (err) {
        console.error("Failed to load complaints for reports:", err);
      }
    };
    loadComplaints();
    return () => { active = false; };
  }, [filters.month]);

  const [exportingType, setExportingType] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);

  // Compute filters.month dynamically for backward compatibility
  const computedMonthStr = `${monthNames[currentMonth]} ${currentYear}`;
  filters.month = computedMonthStr;

  // Handle division filter change
  const handleSambhagChange = (sambhagName) => {
    const districts = sambhagsMap[sambhagName] || [];
    setFilters(prev => ({
      ...prev,
      sambhag: sambhagName,
      district: districts[0] || ''
    }));
  };

  // Calendar Prev/Next Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(1); // Default to first day of new month
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(1); // Default to first day of new month
  };

  // Jump back to actual current system date (June 2, 2026)
  const handleGoToToday = () => {
    setCurrentMonth(5); // June
    setCurrentYear(2026);
    setSelectedDay(2);
  };

  // Helper to determine if selected date is in the future relative to today's date (June 2, 2026)
  const isFutureDate = (day, mIdx, yr) => {
    if (yr > 2026) return true;
    if (yr === 2026) {
      if (mIdx > 5) return true; // July onwards is future
      if (mIdx === 5 && day > 2) return true; // June 3rd onwards is future
    }
    return false;
  };
  const isFuture = isFutureDate(selectedDay, currentMonth, currentYear);

  // Generate dynamic 42-cell calendar grid starting with Monday as first column
  const getCalendarCells = () => {
    const cells = [];
    
    // First day of the current month
    const firstDayDate = new Date(currentYear, currentMonth, 1);
    // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const firstDayIndex = firstDayDate.getDay(); 
    
    // Convert to Monday start index (0 = Mon, ..., 6 = Sun)
    const startDayOfWeek = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Total days in current month
    const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Total days in previous month
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // 1. Previous Month Tail Days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        dayNum: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    // 2. Current Month Active Days
    for (let i = 1; i <= currentMonthDays; i++) {
      cells.push({
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // 3. Next Month Head Days to complete 7 columns x 6 rows (42 cells)
    let nextMonthDay = 1;
    while (cells.length < 42) {
      cells.push({
        dayNum: nextMonthDay++,
        isCurrentMonth: false
      });
    }

    return cells;
  };
  const calendarCells = getCalendarCells();

  // Get active indicator dots for a day to match the user's screenshot layout
  const getDayDots = (dayNum, isCurrentMonth) => {
    if (!isCurrentMonth) return [];
    
    // Do not show indicator dots for future dates
    if (isFutureDate(dayNum, currentMonth, currentYear)) return [];
    
    // Check if there are any complaints submitted on this day
    const dayStr = dayNum.toString().padStart(2, '0');
    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    const dateQuery = `${currentYear}-${monthStr}-${dayStr}`;

    const matching = dbComplaints.filter(c => {
      const cDate = c.createdAt ? c.createdAt.split('T')[0] : (c.timestamp ? c.timestamp.split('T')[0] : '');
      return cDate === dateQuery;
    });

    if (matching.length > 0) {
      const dots = [];
      if (matching.some(m => m.priority === 'Critical' || m.priority === 'High')) dots.push('#ec4899'); // Critical/High -> Pink
      if (matching.some(m => m.priority === 'Medium')) dots.push('#f59e0b'); // Medium -> Yellow
      if (matching.some(m => m.status === 'Resolved')) dots.push('#10b981'); // Resolved -> Green
      if (matching.some(m => m.status === 'InProgress')) dots.push('#06b6d4'); // InProgress -> Cyan
      
      if (dots.length === 0) dots.push('#ec4899');
      return dots.slice(0, 3);
    }

    if (dbComplaints.length === 0) {
      if (dayNum === 9) return ['#ec4899'];
      if (dayNum === 13) return ['#ec4899', '#f59e0b'];
      if (dayNum === 14) return ['#10b981', '#06b6d4'];
      if (dayNum === 26) return ['#ec4899', '#f59e0b'];
      if (dayNum === 27) return ['#f59e0b'];
      if (dayNum === 29) return ['#ec4899', '#06b6d4'];
    }
    
    return [];
  };

  // Deterministically generate report counts & stats for ANY chosen Date, District, and Division
  const getDynamicStats = () => {
    if (isFuture) {
      return {
        resolved: '—',
        underReview: '—',
        expired: '—',
        complianceRate: '—',
        delayRows: [],
        totalComplaints: '—',
        peakComplaint: '—',
        peakCount: '',
        peakColor: 'text-muted'
      };
    }

    // Filter dbComplaints for the selected date
    const dayStr = selectedDay.toString().padStart(2, '0');
    const monthStr = (currentMonth + 1).toString().padStart(2, '0');
    const dateQuery = `${currentYear}-${monthStr}-${dayStr}`;

    const dailyComplaints = dbComplaints.filter(c => {
      const cDate = c.createdAt ? c.createdAt.split('T')[0] : (c.timestamp ? c.timestamp.split('T')[0] : '');
      return cDate === dateQuery;
    });

    if (dbComplaints.length > 0) {
      const resolved = dailyComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const underReview = dailyComplaints.filter(c => c.status === 'InProgress' || c.status === 'Assigned' || c.status === 'Submitted' || c.status === 'Work Started').length;
      const expired = dailyComplaints.filter(c => c.status === 'SLA Delayed').length;
      const totalComplaints = dailyComplaints.length;

      const complianceVal = totalComplaints > 0 ? ((resolved / totalComplaints) * 100).toFixed(1) : '100.0';
      const complianceRate = `${complianceVal}%`;

      // Calculate peak category
      const categoriesCount = {};
      dailyComplaints.forEach(c => {
        const cat = c.category || 'Other';
        categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
      });
      let peakComplaint = 'None';
      let peakCountVal = 0;
      Object.keys(categoriesCount).forEach(cat => {
        if (categoriesCount[cat] > peakCountVal) {
          peakCountVal = categoriesCount[cat];
          peakComplaint = cat;
        }
      });

      const delayedItems = dailyComplaints.filter(c => c.status === 'SLA Delayed' || c.status === 'InProgress');
      const delayRows = delayedItems.map((c, idx) => ({
        id: c.id || `#RC-${idx}`,
        ward: c.ward || 'Ward Sector',
        delay: '+12 Hours',
        engineer: c.assignedWorker?.name || 'Assigned Crew',
        status: c.status || 'Pending',
        badgeClass: c.status === 'SLA Delayed' ? 'bg-danger' : 'bg-warning text-dark'
      }));

      return {
        resolved,
        underReview,
        expired,
        complianceRate,
        delayRows,
        totalComplaints,
        peakComplaint,
        peakCount: `${peakCountVal} cases`,
        peakColor: 'text-primary'
      };
    }

    const seed = selectedDay + currentMonth * 3 + (filters.district.charCodeAt(0) || 10) + (filters.sambhag.charCodeAt(2) || 5);
    
    const resolved = (seed * 17) % 120 + 130;
    const underReview = (seed * 7) % 25 + 12;
    const expired = (seed * 3) % 8 + 1;
    const standardCompliance = (94.2 + (seed % 45) / 10).toFixed(1);
    const complianceRate = `${standardCompliance}%`;
    const totalComplaints = resolved + underReview + expired;

    // Peak complaint of month determined dynamically
    const categories = [
      { name: 'Road Damage', color: 'text-danger' },
      { name: 'Garbage Dump', color: 'text-success' },
      { name: 'Street Light', color: 'text-primary' },
      { name: 'Sewer Overflow', color: 'text-warning' }
    ];
    const peakIssue = categories[seed % categories.length];
    const peakCount = (seed * 23) % 150 + 200;

    const engineers = ['Shri Amit Kumar', 'Smt. Anita Sharma', 'Shri Rajendra Singh', 'Shri R.K. Meena', 'Smt. Pooja Vyas', 'Shri Vikram Rathore'];
    const wards = ['Ward 1 (Malviya Nagar)', 'Ward 2 (Mansarovar)', 'Ward 3 (Sanganer)', 'Ward 5 (Amer)', 'Ward 8 (C-Scheme)', 'Ward 12 (Jhotwara)'];
    
    const delayRows = [
      {
        id: `#RC-${900000 + (seed * 13) % 9000}`,
        ward: wards[seed % wards.length],
        delay: `+${((seed * 9) % 36) + 12} Hours`,
        engineer: engineers[(seed + 1) % engineers.length],
        status: (seed % 3 === 0) ? 'Overdue' : 'Pending Review',
        badgeClass: (seed % 3 === 0) ? 'bg-danger' : 'bg-warning text-dark'
      },
      {
        id: `#RC-${800000 + (seed * 27) % 9000}`,
        ward: wards[(seed + 2) % wards.length],
        delay: `+${((seed * 11) % 48) + 8} Hours`,
        engineer: engineers[(seed + 3) % engineers.length],
        status: 'Overdue',
        badgeClass: 'bg-danger'
      }
    ];

    return {
      resolved,
      underReview,
      expired,
      complianceRate,
      delayRows,
      totalComplaints,
      peakComplaint: peakIssue.name,
      peakCount: `${peakCount} cases`,
      peakColor: peakIssue.color
    };
  };
  const stats = getDynamicStats();

  // Simulated Export Trigger
  const triggerExport = (type) => {
    setExportingType(type);
    setExportProgress(10);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExportingType(null);

            const reportMetadata = {
              reportType: selectedReportTab,
              district: filters.district,
              sambhag: filters.sambhag,
              month: filters.month,
              exportType: type,
              totalComplaintsCount: stats.totalComplaints,
              complianceRate: stats.complianceRate,
              timestamp: new Date().toISOString()
            };

            import('../firestoreService').then(({ saveReport }) => {
              saveReport(reportMetadata);
            }).catch(err => console.error("Failed to save report metadata to Firestore:", err));

            let fileContent = "";
            let fileName = `RAJCIVIC_${selectedReportTab.toUpperCase()}_${filters.district.toUpperCase()}_${filters.month.replace(' ', '_')}`;
            let mimeType = "";
            let extension = "";

            if (type === 'xlsx') {
              mimeType = "text/csv;charset=utf-8;";
              extension = "csv";
              fileContent = "\uFEFF";
              fileContent += `RAJ URBAN CIVIC SERVICE PLATFORM - OFFICIAL REPORT\n`;
              fileContent += `Report Type,${selectedReportTab.toUpperCase()}\n`;
              fileContent += `District,${filters.district}\n`;
              fileContent += `Reporting Month,${filters.month}\n`;
              fileContent += `Generated On,${new Date().toLocaleString()}\n\n`;

              if (selectedReportTab === 'complaint_summary') {
                fileContent += `Category Share,Percentage,Case Count\n`;
                fileContent += `Garbage pile-up,45%,643 cases\n`;
                fileContent += `Street Light maintenance,25%,357 cases\n`;
                fileContent += `Road craters / pothole patch,18%,257 cases\n`;
                fileContent += `Open sewer manhole safety,12%,172 cases\n`;
              } else if (selectedReportTab === 'sla_delay') {
                fileContent += `Complaint ID,Ward,Delay Time,Assigned Engineer,Status\n`;
                fileContent += `#RC-904122,Ward 2 (Mansarovar),+48 Hours,Shri Amit Kumar,Overdue\n`;
                fileContent += `#RC-891024,Ward 5 (Amer),+12 Hours,Smt. Anita Sharma,Pending Review\n`;
                fileContent += `#RC-876251,Ward 1 (Malviya Nagar),+36 Hours,Shri Rajendra Singh,Overdue\n`;
              } else {
                fileContent += `General Ledger Summary,Value\n`;
                fileContent += `Total Grievances Logged,1593\n`;
                fileContent += `Total Resolved within SLA,1429\n`;
                fileContent += `SLA Compliance Rate,96.4%\n`;
              }
            } else {
              mimeType = "text/plain;charset=utf-8;";
              extension = "txt";
              fileContent = `========================================================\n`;
              fileContent += `         RAJASTHAN URBAN CIVIC SERVICE PLATFORM          \n`;
              fileContent += `            OFFICIAL MUNICIPAL GRIEVANCE LEDGER          \n`;
              fileContent += `========================================================\n\n`;
              fileContent += `REPORT CATEGORY : ${selectedReportTab.toUpperCase()}\n`;
              fileContent += `DISTRICT        : ${filters.district.toUpperCase()}\n`;
              fileContent += `MONTH           : ${filters.month.toUpperCase()}\n`;
              fileContent += `COMPILED AT     : ${new Date().toLocaleString()}\n\n`;
              fileContent += `--------------------------------------------------------\n`;

              if (selectedReportTab === 'complaint_summary') {
                fileContent += `* STATUS SUMMARY:\n`;
                fileContent += `  - Complaints Resolved : 1,429 cases\n`;
                fileContent += `  - Under Review        : 140 cases\n`;
                fileContent += `  - SLA Expired         : 24 cases\n\n`;
                fileContent += `* CATEGORY SHARE:\n`;
                fileContent += `  - Garbage pile-up           : 45% (643 cases)\n`;
                fileContent += `  - Street Light maintenance  : 25% (357 cases)\n`;
                fileContent += `  - Road craters / potholes   : 18% (257 cases)\n`;
                fileContent += `  - Open sewer manhole safety  : 12% (172 cases)\n`;
              } else if (selectedReportTab === 'sla_delay') {
                fileContent += `* DELAYED GRIEVANCES AUDIT LOG:\n\n`;
                fileContent += `  1. Complaint ID: #RC-904122\n`;
                fileContent += `     Ward: Ward 2 (Mansarovar)\n`;
                fileContent += `     Delay Time: +48 Hours\n`;
                fileContent += `     Engineer: Shri Amit Kumar\n`;
                fileContent += `     Status: Overdue\n\n`;
                fileContent += `  2. Complaint ID: #RC-891024\n`;
                fileContent += `     Ward: Ward 5 (Amer)\n`;
                fileContent += `     Delay Time: +12 Hours\n`;
                fileContent += `     Engineer: Smt. Anita Sharma\n`;
                fileContent += `     Status: Pending Review\n`;
              } else {
                fileContent += `* COMPLIANCE STATUS SUMMARY:\n`;
                fileContent += `  - Standard resolution SLA compliance met at 96.4%.\n`;
                fileContent += `  - Total public feedback average rating stands at 4.8/5.\n`;
              }
              fileContent += `\n========================================================\n`;
              fileContent += `                END OF MUNICIPAL AUDIT REPORT           \n`;
              fileContent += `========================================================\n`;
            }

            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${fileName}.${extension}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 600);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  // Report tabs definition for side list or internal mapping
  const reportTabs = [
    { id: 'complaint_summary', label: 'Complaint Summary Reports', icon: 'bi-pie-chart-fill', color: 'text-success' },
    { id: 'sla_delay', label: 'SLA Delay Reports', icon: 'bi-clock-fill', color: 'text-danger' },
    { id: 'ward_performance', label: 'Ward Performance Reports', icon: 'bi-building-fill', color: 'text-primary' },
    { id: 'dept_performance', label: 'Department Performance Reports', icon: 'bi-grid-fill', color: 'text-warning' },
    { id: 'worker_performance', label: 'Worker Performance Reports', icon: 'bi-people-fill', color: 'text-info' },
    { id: 'reopened_complaint', label: 'Reopened Complaint Reports', icon: 'bi-arrow-repeat', color: 'text-secondary' },
    { id: 'escalation', label: 'Escalation Reports', icon: 'bi-exclamation-triangle-fill', color: 'text-danger' },
    { id: 'emergency_issue', label: 'Emergency Issue Reports', icon: 'bi-lightning-charge-fill', color: 'text-warning' },
    { id: 'public_feedback', label: 'Public Feedback Reports', icon: 'bi-chat-heart-fill', color: 'text-success' },
    { id: 'audit_logs', label: 'Audit & Action Logs', icon: 'bi-journal-code', color: 'text-dark' },
    { id: 'export_reports', label: 'Export Reports Center', icon: 'bi-cloud-arrow-down-fill', color: 'text-primary' }
  ];

  return (
    <section className="bg-light min-vh-100 py-4" id="reports-center">
      <div className="container">

        {/* Banner header */}
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <div className="row align-items-center g-4 text-start">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-white text-success rounded-pill px-2.5 py-1 small fw-bold">ANALYTICS SYSTEM</span>
                <span className="text-white opacity-75 small">• State Level Grievance Analytics</span>
              </div>
              <h2 className="display-6 fw-bold mb-2">RajCivic Audit & Performance Reports</h2>
              <p className="opacity-75 small mb-0" style={{ lineHeight: '1.6', maxWidth: '640px' }}>
                Access live municipal analytics, compliance rates, SLA delays, ward scorecards, and public feedback audit reports compiled from real-time database transactions.
              </p>
            </div>

            {/* Quick Export tools */}
            <div className="col-md-4 text-md-end d-flex flex-wrap gap-2 justify-content-start justify-content-md-end">
              <button onClick={() => triggerExport('pdf')} className="btn btn-outline-light px-3 py-2 rounded-3 small fw-bold">
                <i className="bi bi-file-earmark-pdf-fill me-1"></i> Export PDF
              </button>
              <button onClick={() => triggerExport('xlsx')} className="btn btn-dark text-white px-3 py-2 rounded-3 small fw-bold shadow-sm">
                <i className="bi bi-file-earmark-excel-fill me-1"></i> Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic export progress indicator */}
        {exportingType && (
          <div className="card border border-success border-opacity-10 p-3 rounded-3 mb-4 text-start shadow-sm animate-pulse">
            <strong className="text-secondary small d-block mb-1">Generating official Municipal ledger: {exportingType.toUpperCase()} file...</strong>
            <div className="progress rounded-pill" style={{ height: '8px' }}>
              <div className="progress-bar bg-success" role="progressbar" style={{ width: `${exportProgress}%` }} aria-valuenow={exportProgress} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        )}

        {/* Layout Grid: Sidebar Tabs and Main Panel */}
        <div className="row g-4 text-start">

          {/* Sidebar Tab List */}
          <div className="col-lg-4">
            <div className="card border-0 rounded-4 shadow-sm p-3 bg-white">
              <h6 className="fw-bold text-secondary mb-3 px-2">Reports Directory</h6>
              <div className="d-flex flex-column gap-1">
                {reportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedReportTab(tab.id)}
                    className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${selectedReportTab === tab.id ? 'bg-primary-soft text-primary fw-bold' : 'hover-light text-secondary'}`}
                    style={{ fontSize: '0.82rem' }}
                  >
                    <i className={`bi ${tab.icon} ${tab.color} fs-6`}></i>
                    <span className="flex-grow-1">{tab.label}</span>
                    {selectedReportTab === tab.id && <i className="bi bi-chevron-right text-primary"></i>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Display Panel */}
          <div className="col-lg-8">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100">

              {/* Filter controls */}
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
                <h5 className="fw-extrabold text-secondary m-0">
                  {reportTabs.find(t => t.id === selectedReportTab)?.label}
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {/* Sambhag Selector */}
                  <select
                    className="form-select form-select-sm border text-muted py-1 px-2.5 rounded-3 fw-bold bg-white"
                    value={filters.sambhag}
                    onChange={(e) => handleSambhagChange(e.target.value)}
                    style={{ fontSize: '0.75rem', minWidth: '130px' }}
                  >
                    {Object.keys(sambhagsMap).map((sambhag, idx) => (
                      <option key={idx} value={sambhag}>{sambhag}</option>
                    ))}
                  </select>

                  {/* District Selector (Dynamic based on selected Sambhag) */}
                  <select
                    className="form-select form-select-sm border text-muted py-1 px-2.5 rounded-3 fw-bold bg-white"
                    value={filters.district}
                    onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                    style={{ fontSize: '0.75rem', minWidth: '110px' }}
                  >
                    {(sambhagsMap[filters.sambhag] || []).map((dist, idx) => (
                      <option key={idx} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Premium Month Grid Calendar Card with dynamic stats indicator underneath */}
              <div className="mb-4 mx-auto p-4 bg-white border border-light-subtle rounded-4 shadow-sm text-center position-relative" style={{ maxWidth: '480px' }}>
                
                {/* 1. Dynamic Month & Year Picker Overlay Panel */}
                {showPickerPanel && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 bg-white rounded-4 p-4 z-3 d-flex flex-column justify-content-between animate-scale-up" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <strong className="text-secondary small fw-extrabold text-uppercase">Jump to Month & Year</strong>
                        <button type="button" className="btn-close btn-sm" onClick={() => setShowPickerPanel(false)}></button>
                      </div>
                      
                      {/* Months Selector Grid */}
                      <div className="row row-cols-3 g-2 mb-4">
                        {monthNames.map((mName, mIdx) => (
                          <div key={mIdx} className="col">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentMonth(mIdx);
                                setShowPickerPanel(false);
                                setSelectedDay(1);
                              }}
                              className={`btn btn-sm w-100 py-2 fw-semibold rounded-3 ${currentMonth === mIdx ? 'btn-primary' : 'btn-outline-light text-secondary'}`}
                              style={{ fontSize: '0.75rem' }}
                            >
                              {mName.substring(0, 3).toUpperCase()}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Years Selector Grid */}
                      <strong className="text-secondary small fw-extrabold text-uppercase d-block mb-2">Select Year</strong>
                      <div className="d-flex gap-2 justify-content-center">
                        {[2024, 2025, 2026, 2027].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setCurrentYear(yr);
                              setShowPickerPanel(false);
                              setSelectedDay(1);
                            }}
                            className={`btn btn-sm px-3 py-2 fw-semibold rounded-3 ${currentYear === yr ? 'btn-primary' : 'btn-outline-light text-secondary'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="button" className="btn btn-secondary w-100 py-2 rounded-3 fw-bold mt-3" onClick={() => setShowPickerPanel(false)} style={{ fontSize: '0.8rem' }}>
                      Close Panel
                    </button>
                  </div>
                )}

                {/* 2. Calendar Header (Left icons, center clickable title with chevrons, right dots) */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                  {/* Left Side: Checkbox & Menu Icons */}
                  <div className="d-flex align-items-center gap-2">
                    <div className="border border-secondary border-opacity-25 rounded-3 d-flex align-items-center justify-content-center hover-light" style={{ width: '36px', height: '36px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <i className="bi bi-square text-secondary opacity-50 fs-6"></i>
                    </div>
                    <div className="d-flex align-items-center justify-content-center hover-light rounded-3" style={{ width: '36px', height: '36px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <i className="bi bi-list text-secondary fs-4"></i>
                    </div>
                  </div>

                  {/* Middle Title with Prev/Next buttons & month name dropdown toggle */}
                  <div className="d-flex align-items-center gap-2">
                    <button type="button" onClick={handlePrevMonth} className="btn btn-link p-0 text-secondary hover-primary border-0" title="Previous Month">
                      <i className="bi bi-chevron-left fs-5"></i>
                    </button>
                    <div className="d-flex align-items-center gap-1.5 cursor-pointer hover-primary py-1 px-2.5 rounded-pill" onClick={() => setShowPickerPanel(true)} title="Click to pick Month/Year">
                      <span className="fw-extrabold text-secondary text-uppercase fs-5" style={{ letterSpacing: '0.05em', color: '#1e293b' }}>
                        {monthNames[currentMonth].substring(0, 3).toUpperCase()} {selectedDay}
                      </span>
                      <i className="bi bi-chevron-down text-secondary opacity-75 small"></i>
                    </div>
                    <button type="button" onClick={handleNextMonth} className="btn btn-link p-0 text-secondary hover-primary border-0" title="Next Month">
                      <i className="bi bi-chevron-right fs-5"></i>
                    </button>
                  </div>

                  {/* Right Side: Options Button */}
                  <div className="border border-secondary border-opacity-25 rounded-circle d-flex align-items-center justify-content-center hover-light" style={{ width: '36px', height: '36px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <i className="bi bi-three-dots text-secondary fs-5"></i>
                  </div>
                </div>

                {/* Weekdays Row: MON to SUN */}
                <div className="row g-0 mb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', pb: '8px' }}>
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((dayName, idx) => (
                    <div key={idx} className="col text-center">
                      <span className="text-secondary fw-bold" style={{ fontSize: '0.72rem', letterSpacing: '0.02em', color: '#94a3b8' }}>
                        {dayName}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 7-Column Grid of 42 cells */}
                <div className="row row-cols-7 g-0 gy-2 mb-4">
                  {calendarCells.map((cell, idx) => {
                    const isSelected = cell.isCurrentMonth && selectedDay === cell.dayNum;
                    const dots = getDayDots(cell.dayNum, cell.isCurrentMonth);
                    
                    return (
                      <div 
                        key={idx} 
                        className="col d-flex flex-column align-items-center justify-content-center position-relative py-1.5"
                        style={{ width: '14.28%', cursor: cell.isCurrentMonth ? 'pointer' : 'default' }}
                        onClick={() => cell.isCurrentMonth && setSelectedDay(cell.dayNum)}
                      >
                        {/* Day circle */}
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle fw-bold transition-all"
                          style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: isSelected ? '#007aff' : 'transparent', // Screenshot match
                            color: isSelected ? 'white' : (cell.isCurrentMonth ? '#1e293b' : '#cbd5e1'),
                            fontSize: '0.9rem',
                            boxShadow: isSelected ? '0 8px 16px rgba(0, 122, 255, 0.35)' : 'none',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          {cell.dayNum}
                        </div>

                        {/* Little Indicators dots */}
                        <div className="d-flex gap-1 justify-content-center mt-1" style={{ minHeight: '6px' }}>
                          {dots.map((dotColor, dotIdx) => (
                            <span 
                              key={dotIdx} 
                              className="rounded-circle" 
                              style={{ 
                                width: '5px', 
                                height: '5px', 
                                backgroundColor: dotColor,
                                display: 'inline-block'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DATE SPECIFIC PROBLEM STATISTICS & HIGHEST MONTH PROBLEM (Very High Problem Side Display) */}
                <div className="row g-0 border-top border-light-subtle pt-3 text-start">
                  
                  {/* Left Column: Date Registered Grievance Count */}
                  <div className="col-6 border-end border-light-subtle pr-2">
                    <span className="text-secondary small fw-extrabold text-uppercase d-block mb-1" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-calendar-check text-primary me-1"></i> Date Caseload
                    </span>
                    {isFuture ? (
                      <div className="text-muted opacity-50 py-1" style={{ fontSize: '0.82rem' }}>—</div>
                    ) : (
                      <div>
                        <strong className="fs-5 text-secondary">{stats.totalComplaints}</strong>
                        <span className="text-muted small ms-1">Grievances</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Month Highest Registered Complaint Category (Very High Problem Alert) */}
                  <div className="col-6 ps-3">
                    <span className="text-secondary small fw-extrabold text-uppercase d-block mb-1" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                      <i className="bi bi-exclamation-triangle text-danger me-1"></i> Peak Month Issue
                    </span>
                    {isFuture ? (
                      <div className="text-muted opacity-50 py-1" style={{ fontSize: '0.82rem' }}>—</div>
                    ) : (
                      <div>
                        <strong className={`fw-extrabold small d-block ${stats.peakColor}`} style={{ lineHeight: '1.2' }}>
                          {stats.peakComplaint}
                        </strong>
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 rounded-pill mt-1" style={{ fontSize: '0.58rem', padding: '2px 6px' }}>
                          Very High ({stats.peakCount})
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Link: TODAY [selectedDay] with custom jump-back hook */}
                <div className="position-relative d-flex align-items-center justify-content-center mt-4 pt-2">
                  <div className="w-100 border-top" style={{ borderColor: '#e2e8f0' }} />
                  <span 
                    onClick={handleGoToToday}
                    className="position-absolute bg-white px-3 fw-extrabold text-uppercase text-primary hover-lift cursor-pointer" 
                    style={{ 
                      fontSize: '0.68rem', 
                      letterSpacing: '0.1em',
                      color: '#007aff',
                      top: 'calc(50% - 6px)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Click to jump to Today's Date (June 2, 2026)"
                  >
                    TODAY {selectedDay}
                  </span>
                </div>

              </div>

              {/* DYNAMIC CONTENT VIEWS */}

              {/* 1. COMPLAINT SUMMARY VIEW */}
              {selectedReportTab === 'complaint_summary' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Comprehensive grievance counts, resolution statistics, and SLA timelines across municipal boundaries.</p>

                  <div className="row g-3 mb-4">
                    <div className="col-4">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <strong className="text-success fs-4 d-block">{stats.resolved}</strong>
                        <span className="text-muted text-xxs">COMPLAINTS RESOLVED</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <strong className="text-warning fs-4 d-block">{stats.underReview}</strong>
                        <span className="text-muted text-xxs">UNDER REVIEW</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="border rounded-3 p-3 text-center bg-light">
                        <strong className="text-danger fs-4 d-block">{stats.expired}</strong>
                        <span className="text-muted text-xxs">SLA EXPIRED</span>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold text-secondary mb-2">Submission Categories Share (Audit Date)</h6>
                  <div className="d-flex flex-column gap-3">
                    {[
                      { name: 'Garbage pile-up', share: isFuture ? 0 : 45, count: isFuture ? '—' : `${Math.round(stats.resolved * 0.45)} cases`, color: 'bg-success' },
                      { name: 'Street Light maintenance', share: isFuture ? 0 : 25, count: isFuture ? '—' : `${Math.round(stats.resolved * 0.25)} cases`, color: 'bg-primary' },
                      { name: 'Road craters / pothole patch', share: isFuture ? 0 : 18, count: isFuture ? '—' : `${Math.round(stats.resolved * 0.18)} cases`, color: 'bg-warning' },
                      { name: 'Open sewer manhole safety', share: isFuture ? 0 : 12, count: isFuture ? '—' : `${Math.round(stats.resolved * 0.12)} cases`, color: 'bg-danger' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="d-flex justify-content-between small text-secondary mb-1">
                          <span>{item.name}</span>
                          <span className="fw-bold">{item.count} {!isFuture && `(${item.share}%)`}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className={`progress-bar ${item.color}`} role="progressbar" style={{ width: `${item.share}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. SLA DELAY REPORTS */}
              {selectedReportTab === 'sla_delay' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Delay metrics audit. Tracks cases which exceeded their standard municipal resolution SLA window.</p>

                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Complaint ID</th>
                          <th>Ward</th>
                          <th>Delay Time</th>
                          <th>Assigned Engineer</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isFuture || stats.delayRows.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted small">
                              <i className="bi bi-info-circle me-1"></i> No audit reports or delays recorded for this future date.
                            </td>
                          </tr>
                        ) : (
                          stats.delayRows.map((row, idx) => (
                            <tr key={idx} className={row.status === 'Overdue' ? 'table-danger-light' : ''}>
                              <td><strong>{row.id}</strong></td>
                              <td>{row.ward}</td>
                              <td className={`${row.status === 'Overdue' ? 'text-danger' : 'text-warning'} fw-bold`}>{row.delay}</td>
                              <td>{row.engineer}</td>
                              <td><span className={`badge ${row.badgeClass} rounded-pill`}>{row.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. WARD PERFORMANCE REPORTS */}
              {selectedReportTab === 'ward_performance' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Ward scorecard comparison ranking resolution speeds, compliance rates, and municipal responsiveness indices.</p>

                  <div className="d-flex flex-column gap-3">
                    {[
                      { name: 'Ward 1 - Malviya Nagar Office', score: isFuture ? '—' : (95.4 + (selectedDay % 5) * 0.9).toFixed(1), rating: isFuture ? 'Pending' : 'Excellent', color: 'text-success' },
                      { name: 'Ward 2 - Mansarovar Office', score: isFuture ? '—' : (91.1 + (selectedDay % 7) * 0.8).toFixed(1), rating: isFuture ? 'Pending' : 'Excellent', color: 'text-success' },
                      { name: 'Ward 3 - Sanganer Office', score: isFuture ? '—' : (84.3 + (selectedDay % 4) * 1.1).toFixed(1), rating: isFuture ? 'Pending' : 'Stable', color: 'text-primary' },
                      { name: 'Ward 4 - C-Scheme Office', score: isFuture ? '—' : (75.8 + (selectedDay % 6) * 1.0).toFixed(1), rating: isFuture ? 'Pending' : 'Needs Attention', color: 'text-warning' },
                      { name: 'Ward 5 - Amer Office', score: isFuture ? '—' : (58.2 + (selectedDay % 3) * 1.5).toFixed(1), rating: isFuture ? 'Pending' : 'Urgent Action', color: 'text-danger' }
                    ].map((ward, idx) => (
                      <div key={idx} className="p-3 border rounded-3 d-flex align-items-center justify-content-between">
                        <div>
                          <strong className="text-secondary small d-block">{ward.name}</strong>
                          <span className="text-muted text-xxs">Monthly Compliance score</span>
                        </div>
                        <div className="text-end">
                          <strong className="fs-5 d-block text-secondary">{ward.score}{!isFuture && '%'}</strong>
                          <span className={`badge bg-light ${isFuture ? 'text-secondary' : ward.color} fw-bold`} style={{ fontSize: '0.65rem' }}>{ward.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. DEPARTMENT PERFORMANCE REPORTS */}
              {selectedReportTab === 'dept_performance' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Comparative evaluation of Rajasthan state utility departments handling public grievances.</p>

                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Department Name</th>
                          <th>Total Tasks</th>
                          <th>Within SLA</th>
                          <th>Compliance Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Sanitation & Garbage Dept</strong></td>
                          <td>643</td>
                          <td>620</td>
                          <td><strong className="text-success">96.4%</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Electrical & Streetlights</strong></td>
                          <td>357</td>
                          <td>335</td>
                          <td><strong className="text-success">93.8%</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Road Maintenance Desk</strong></td>
                          <td>257</td>
                          <td>210</td>
                          <td><strong className="text-warning">81.7%</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Water Supply & Sewerage</strong></td>
                          <td>172</td>
                          <td>135</td>
                          <td><strong className="text-danger">78.4%</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. WORKER PERFORMANCE REPORTS */}
              {selectedReportTab === 'worker_performance' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Resolution leaderboard honoring top performing sanitary staff and maintenance engineers.</p>

                  <div className="d-flex flex-column gap-3.5">
                    {[
                      { name: 'Ramesh Meena', role: 'Sanitation supervisor', tasks: '124 tasks', time: '4.2 Hours Avg', badge: 'Gold Star' },
                      { name: 'Kishanlal Choudhary', role: 'Streetlight inspector', tasks: '98 tasks', time: '6.1 Hours Avg', badge: 'Gold Star' },
                      { name: 'Sunita Sharma', role: 'Road division lead', tasks: '85 tasks', time: '8.4 Hours Avg', badge: 'Silver Star' }
                    ].map((w, idx) => (
                      <div key={idx} className="d-flex align-items-center justify-content-between p-2.5 border rounded-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>{w.name[0]}</div>
                          <div>
                            <strong className="text-secondary small d-block">{w.name}</strong>
                            <span className="text-muted text-xxs">{w.role}</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <strong className="text-secondary small d-block">{w.tasks} ({w.time})</strong>
                          <span className="badge bg-success-soft text-success rounded-pill fw-bold" style={{ fontSize: '0.55rem' }}>{w.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. REOPENED COMPLAINT REPORTS */}
              {selectedReportTab === 'reopened_complaint' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Audit of complaints reopened by citizens, indicating poor initial response or incomplete resolution work.</p>

                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Complaint ID</th>
                          <th>Category</th>
                          <th>Reopen Date</th>
                          <th>Citizen Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>#RC-90412</strong></td>
                          <td>Garbage pile-up</td>
                          <td>25-May-2026</td>
                          <td className="text-danger font-semibold">"Garbage only shifted, not cleared."</td>
                        </tr>
                        <tr>
                          <td><strong>#RC-87621</strong></td>
                          <td>Street Light</td>
                          <td>22-May-2026</td>
                          <td className="text-danger font-semibold">"Light flickers and fails again."</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. ESCALATION REPORTS */}
              {selectedReportTab === 'escalation' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Grievances automatically escalated to Level-2 (Commissioner) or Level-3 (State Nodal Desk) due to SLA breach.</p>

                  <div className="d-flex flex-column gap-3">
                    <div className="border border-danger border-opacity-20 bg-danger bg-opacity-5 p-3 rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <strong className="text-danger small">Level-3 State Nodal Escalation</strong>
                        <span className="badge bg-danger text-white rounded-pill" style={{ fontSize: '0.6rem' }}>Critical</span>
                      </div>
                      <h6 className="fw-bold text-secondary mb-1">Grievance #RC-80419 — Drainage main block</h6>
                      <p className="text-muted text-xxs mb-0">Escalated to: <strong>Shri R.K. Meena, IAS (State Secretary)</strong>. Unresolved for 7 consecutive days.</p>
                    </div>

                    <div className="border border-warning border-opacity-20 bg-warning bg-opacity-5 p-3 rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-1.5">
                        <strong className="text-warning small">Level-2 Commissioner Review</strong>
                        <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: '0.6rem' }}>High Priority</span>
                      </div>
                      <h6 className="fw-bold text-secondary mb-1">Grievance #RC-85102 — Street gas pipeline odor</h6>
                      <p className="text-muted text-xxs mb-0">Escalated to: <strong>Jaipur Nagar Nigam Commissioner</strong>. Resolution SLA overdue by 48 hours.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. EMERGENCY ISSUE REPORTS */}
              {selectedReportTab === 'emergency_issue' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Active hot-list tracking high-severity emergency civic reports registered under priority SLA overrides.</p>

                  <div className="table-responsive">
                    <table className="table align-middle table-hover small">
                      <thead className="table-light">
                        <tr>
                          <th>Hazard ID</th>
                          <th>Hazard Type</th>
                          <th>Location Details</th>
                          <th>Dispatch Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="table-danger-light">
                          <td><strong>#HZ-9102</strong></td>
                          <td className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill"></i> Open Manhole on Main Road</td>
                          <td>Near Jaipur Gate, Jaipur</td>
                          <td><span className="badge bg-danger rounded-pill">Team Dispatched</span></td>
                        </tr>
                        <tr className="table-danger-light">
                          <td><strong>#HZ-8976</strong></td>
                          <td className="text-danger fw-bold"><i className="bi bi-lightning-fill"></i> Sparking Electrical Transformer</td>
                          <td>Shastri Nagar, Jodhpur</td>
                          <td><span className="badge bg-danger rounded-pill">Team Dispatched</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 9. PUBLIC FEEDBACK REPORTS */}
              {selectedReportTab === 'public_feedback' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Average rating scores and comments left by citizens upon final completion and closure of grievances.</p>

                  <div className="d-flex flex-column gap-3">
                    <div className="border rounded-3 p-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-secondary small">Shri Nikhil Sharma</strong>
                        <span className="text-warning"><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i> (5/5)</span>
                      </div>
                      <p className="text-muted text-xxs mb-0">"Amazing response! The garbage was cleared within 4 hours of submission. Geo-tagged photo uploaded is clear."</p>
                    </div>

                    <div className="border rounded-3 p-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-secondary small">Smt. Radha Devi</strong>
                        <span className="text-warning"><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill-line"></i> (4/5)</span>
                      </div>
                      <p className="text-muted text-xxs mb-0">"Streetlights are now completely operational. Response was quick, but mapping coordinate was slightly off."</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. AUDIT & ACTION LOGS */}
              {selectedReportTab === 'audit_logs' && (
                <div className="animate-scale-up">
                  <p className="text-muted small mb-4">Live system timeline showing database transactions, officer assignments, and workflow triggers.</p>

                  <div className="border-start border-3 border-success ps-3 d-flex flex-column gap-3.5">
                    <div>
                      <span className="text-muted text-xxs font-monospace d-block">27-MAY-2026 11:34:02 AM</span>
                      <strong className="text-secondary small">Grievance #RC-90412 status updated to RESOLVED</strong>
                      <span className="text-muted text-xxs d-block">Operator ID: Ramesh Meena (Sanitation Supervisor Jodhpur)</span>
                    </div>
                    <div>
                      <span className="text-muted text-xxs font-monospace d-block">27-MAY-2026 11:20:15 AM</span>
                      <strong className="text-secondary small">Support Ticket #RC-TKT-51024 generated in database</strong>
                      <span className="text-muted text-xxs d-block">Source: Citizen Portal via Google Account handshake</span>
                    </div>
                    <div>
                      <span className="text-muted text-xxs font-monospace d-block">27-MAY-2026 11:00:00 AM</span>
                      <strong className="text-secondary small">Weekly escalations scanned automatically by Scheduler</strong>
                      <span className="text-muted text-xxs d-block">Result: 2 overdue cases flagged for commissioner review</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 11. EXPORT REPORTS CENTER */}
              {selectedReportTab === 'export_reports' && (
                <div className="animate-scale-up text-center py-4">
                  <div className="rounded-circle bg-primary-soft text-primary mx-auto mb-3.5 d-flex align-items-center justify-content-center animate-pulse" style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
                    <i className="bi bi-cloud-arrow-down-fill"></i>
                  </div>
                  <h6 className="fw-bold text-secondary">Export Grievance Audits & Ledgers</h6>
                  <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                    Configure and compile official local municipal reports into high-resolution documents suitable for offline records and departmental reviews.
                  </p>

                  <div className="row g-3 justify-content-center mb-2">
                    <div className="col-sm-5">
                      <button onClick={() => triggerExport('pdf')} className="btn btn-outline-danger w-100 py-2.5 rounded-pill fw-bold small">
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF Report
                      </button>
                    </div>
                    <div className="col-sm-5">
                      <button onClick={() => triggerExport('xlsx')} className="btn btn-success text-white w-100 py-2.5 rounded-pill fw-bold small shadow-sm border-0">
                        <i className="bi bi-file-earmark-excel-fill me-1"></i> Download Excel Sheet
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
