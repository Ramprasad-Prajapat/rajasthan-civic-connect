import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';

export default function Navbar({ activePage, setActivePage, setSelectedReportTab, authenticatedUser, handleSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    'Home',
    'Complaint',
    'Track Complaint',
    'Reports',
    'Helpdesk Support'
  ];

  const getRoleBadge = () => {
    if (!authenticatedUser) return { label: 'Guest', style: { backgroundColor: '#f1f5f9', color: '#64748b', borderColor: '#cbd5e1' } };
    const portal = authenticatedUser.portal;
    const roleLower = authenticatedUser.role?.toLowerCase() || '';
    
    if (portal === 'admin' || roleLower.includes('super') || roleLower.includes('system')) {
      return { label: 'Admin', style: { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' } };
    } else if (portal === 'department') {
      if (roleLower.includes('worker') || roleLower.includes('field')) {
        return { label: 'Worker', style: { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#93c5fd' } };
      } else {
        return { label: 'Officer', style: { backgroundColor: '#fffbeb', color: '#d97706', borderColor: '#fcd34d' } };
      }
    }
    return { label: 'Citizen', style: { backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' } };
  };

  const getDropdownOptions = () => {
    if (!authenticatedUser) return [];
    const portal = authenticatedUser.portal;
    const roleLower = authenticatedUser.role?.toLowerCase() || '';
    
    if (portal === 'admin' || roleLower.includes('super') || roleLower.includes('system')) {
      return [
        { label: 'My Profile', icon: 'bi-person-circle', page: 'Profile' },
        { label: 'Admin Dashboard', icon: 'bi-grid-1x2-fill', page: 'Dashboards' },
        { label: 'Analytics', icon: 'bi-bar-chart-fill', page: 'Reports' },
        { label: 'User Management', icon: 'bi-people-fill', page: 'Users' },
        { label: 'Reports', icon: 'bi-file-earmark-spreadsheet-fill', page: 'Reports' },
        { label: 'Settings', icon: 'bi-gear-fill', page: 'Settings' }
      ];
    } else if (portal === 'department') {
      if (roleLower.includes('worker') || roleLower.includes('field')) {
        return [
          { label: 'My Profile', icon: 'bi-person-circle', page: 'Profile' },
          { label: 'Worker Dashboard', icon: 'bi-grid-1x2-fill', page: 'Dashboards' },
          { label: 'Assigned Tasks', icon: 'bi-card-checklist', page: 'Complaints' },
          { label: 'Notifications', icon: 'bi-bell-fill', page: 'Notifications' }
        ];
      } else {
        return [
          { label: 'My Profile', icon: 'bi-person-circle', page: 'Profile' },
          { label: 'Department Dashboard', icon: 'bi-grid-1x2-fill', page: 'Dashboards' },
          { label: 'Assigned Complaints', icon: 'bi-clipboard-check-fill', page: 'Complaints' },
          { label: 'Reports', icon: 'bi-file-earmark-bar-graph-fill', page: 'Reports' },
          { label: 'Notifications', icon: 'bi-bell-fill', page: 'Notifications' }
        ];
      }
    } else {
      return [
        { label: 'My Profile', icon: 'bi-person-circle', page: 'Profile' },
        { label: 'Dashboard', icon: 'bi-grid-1x2-fill', page: 'Dashboards' },
        { label: 'My Complaints', icon: 'bi-file-earmark-text-fill', page: 'Complaints' },
        { label: 'Notifications', icon: 'bi-bell-fill', page: 'Notifications' }
      ];
    }
  };

  const reportDropdownItems = [
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
    { id: 'export_reports', label: 'Export Reports', icon: 'bi-cloud-arrow-down-fill', color: 'text-primary' }
  ];

  return (
    <header className="fixed-top animate-fade-in shadow-sm">


      {/* Sticky Main Navbar */}
      <nav className="navbar navbar-expand-lg rc-navbar py-3">
        <div className="container">
          {/* Logo */}
          <a
            className="navbar-brand d-flex align-items-center"
            href="#home"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              setActivePage('Home');
            }}
          >
            <Logo width={48} height={48} showText={true} />
          </a>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-controls="navbarNav"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Menu Items */}
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 mt-3 mt-lg-0 gap-1 text-center align-items-center">
              {menuItems.map((item) => {
                if (item === 'Reports') {
                  return (
                    <li
                      className="nav-item position-relative"
                      key={item}
                      onMouseEnter={() => setReportsDropdownOpen(true)}
                      onMouseLeave={() => setReportsDropdownOpen(false)}
                    >
                      <a
                        className={`nav-link rc-nav-link d-flex align-items-center gap-1 dropdown-toggle ${activePage === 'Reports' ? 'active fw-semibold' : ''}`}
                        href="#reports"
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.preventDefault();
                          setReportsDropdownOpen(!reportsDropdownOpen);
                        }}
                      >
                        Reports
                      </a>

                      {/* Interactive Dropdown Box */}
                      {reportsDropdownOpen && (
                        <div
                          className="position-absolute bg-white rounded-3 shadow-lg p-2 border animate-fade-in text-start d-flex flex-column gap-1"
                          style={{
                            width: '260px',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 1040,
                            maxHeight: '400px',
                            overflowY: 'auto',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span className="text-muted text-uppercase fw-extrabold d-block mb-1.5 px-2.5 pt-1.5" style={{ fontSize: '0.62rem', letterSpacing: '0.05em' }}>
                            Municipal Ledgers
                          </span>
                          {reportDropdownItems.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                setSelectedReportTab(subItem.id);
                                setActivePage('Reports');
                                setReportsDropdownOpen(false);
                                setMobileMenuOpen(false);
                              }}
                              className="btn btn-sm text-start hover-light px-2.5 py-2 rounded-2 d-flex align-items-center gap-2 border-0 bg-transparent text-secondary"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <i className={`bi ${subItem.icon} ${subItem.color} fs-6`}></i>
                              <span>{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                const isActive = (item === 'Helpdesk Support' && activePage === 'Helpdesk') || (activePage === item);
                const targetPage = item === 'Helpdesk Support' ? 'Helpdesk' : item;

                return (
                  <li className="nav-item" key={item}>
                    <a
                      className={`nav-link rc-nav-link ${isActive ? 'active fw-semibold' : ''}`}
                      href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault();
                        setActivePage(targetPage);
                        setMobileMenuOpen(false);
                      }}
                    >
                      {item}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* CTA Buttons */}
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-3 mt-lg-0">
              {authenticatedUser ? (
                <div 
                  ref={dropdownRef}
                  className="position-relative d-inline-block"
                >
                  <button
                    className="btn p-0 rounded-circle border-0 d-flex align-items-center justify-content-center transition-all"
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      overflow: 'hidden', 
                      outline: 'none',
                      boxShadow: profileDropdownOpen ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                    }}
                    aria-label="User menu"
                  >
                    {authenticatedUser.photoURL ? (
                      <img 
                        src={authenticatedUser.photoURL} 
                        alt={authenticatedUser.displayName || authenticatedUser.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div 
                        className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" 
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                          fontSize: '1.15rem',
                          borderRadius: '50%'
                        }}
                      >
                        {(authenticatedUser.displayName || authenticatedUser.name || 'U')[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* Dynamic Premium Dropdown */}
                  {profileDropdownOpen && (
                    <div 
                      className="position-absolute bg-white rounded-4 shadow-lg p-3 border animate-fade-in text-center d-flex flex-column gap-2 animate-scale-up" 
                      style={{ 
                        width: '280px', 
                        top: 'calc(100% + 8px)', 
                        right: '0', 
                        zIndex: 1045, 
                        boxShadow: '0 15px 35px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: '16px'
                      }}
                    >
                      {/* Profile Section Directly Inside Dropdown */}
                      <div className="d-flex flex-column align-items-center border-bottom pb-3 mb-2">
                        {authenticatedUser.photoURL ? (
                          <img 
                            src={authenticatedUser.photoURL} 
                            alt={authenticatedUser.displayName || authenticatedUser.name} 
                            className="rounded-circle shadow-sm mb-2"
                            style={{ width: '64px', height: '64px', objectFit: 'cover', border: '3px solid #10b981' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm mb-2" 
                            style={{ 
                              width: '64px', 
                              height: '64px', 
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                              fontSize: '1.6rem' 
                            }}
                          >
                            {(authenticatedUser.displayName || authenticatedUser.name || 'U')[0]?.toUpperCase()}
                          </div>
                        )}
                        
                        <strong className="text-secondary d-block fs-6 mb-0.5 text-truncate" style={{ maxWidth: '240px' }}>
                          {authenticatedUser.displayName || authenticatedUser.name}
                        </strong>
                        <span className="text-muted d-block small text-truncate mb-2.5" style={{ fontSize: '0.74rem', maxWidth: '240px' }}>
                          {authenticatedUser.email}
                        </span>

                        {/* Custom Badge styling based on getRoleBadge */}
                        <span 
                          className="badge rounded-pill fw-bold px-3 py-1.5 border" 
                          style={{ 
                            fontSize: '0.68rem',
                            letterSpacing: '0.03em',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                            backgroundColor: getRoleBadge().style.backgroundColor,
                            color: getRoleBadge().style.color,
                            borderColor: getRoleBadge().style.borderColor
                          }}
                        >
                          {getRoleBadge().label}
                        </span>
                      </div>

                      {/* Dropdown Options based on Role */}
                      <div className="d-flex flex-column gap-1.5 text-start">
                        {getDropdownOptions().map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActivePage(opt.page);
                              setProfileDropdownOpen(false);
                              setMobileMenuOpen(false);
                            }}
                            className="btn btn-sm text-start hover-light px-3 py-2.5 rounded-3 d-flex align-items-center gap-2.5 border-0 bg-transparent text-secondary transition-all"
                            style={{ fontSize: '0.8rem', fontWeight: 550 }}
                          >
                            <i className={`bi ${opt.icon} text-success fs-6`}></i>
                            <span>{opt.label}</span>
                          </button>
                        ))}

                        <hr className="my-1.5 opacity-10" />

                        <button
                          onClick={() => {
                            if (handleSignOut) handleSignOut();
                            setProfileDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className="btn btn-sm text-start hover-light px-3 py-2.5 rounded-3 d-flex align-items-center gap-2.5 border-0 bg-transparent text-danger transition-all"
                          style={{ fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <i className="bi bi-box-arrow-right text-danger fs-6"></i>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className={`btn btn-sm rc-nav-btn rounded-pill px-3 py-2 ${activePage === 'Login/Register' ? 'active' : ''}`}
                  onClick={() => {
                    setActivePage('Login/Register');
                    setMobileMenuOpen(false);
                  }}
                >
                  <i className="bi bi-person-plus-fill me-1"></i> Login/Register
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
