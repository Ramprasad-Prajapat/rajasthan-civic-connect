import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';

export default function Navbar({
  activePage,
  setActivePage,
  authenticatedUser,
  handleSignOut,
  setAuthViewMode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const mobileProfileDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      const isMobileClick = mobileProfileDropdownRef.current && mobileProfileDropdownRef.current.contains(event.target);
      const isDesktopClick = profileDropdownRef.current && profileDropdownRef.current.contains(event.target);
      if (!isMobileClick && !isDesktopClick) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = (authenticatedUser?.role || '').toLowerCase();
  const portal = (authenticatedUser?.portal || '').toLowerCase();
  const isAdmin = portal === 'admin' || role.includes('admin');
  const isOfficer = portal === 'department' || role.includes('officer');
  const isCitizen = !isAdmin && !isOfficer && !!authenticatedUser;

  const getRoleBadge = () => {
    if (!authenticatedUser) return { label: 'Guest', style: { backgroundColor: '#f1f5f9', color: '#64748b' } };
    if (isAdmin) return { label: 'Admin', style: { backgroundColor: '#fef2f2', color: '#dc2626' } };
    if (isOfficer) return { label: 'Officer', style: { backgroundColor: '#fffbeb', color: '#d97706' } };
    return { label: 'Citizen', style: { backgroundColor: '#f0fdf4', color: '#16a34a' } };
  };

  const navItems = () => {
    if (isAdmin) {
      return [
        { name: 'Dashboards', label: 'Admin Dashboard', icon: 'bi-grid-1x2-fill' },
        { name: 'Profile', label: 'Profile', icon: 'bi-person-circle' }
      ];
    }
    if (isOfficer) {
      return [
        { name: 'Dashboards', label: 'Department Dashboard', icon: 'bi-grid-1x2-fill' },
        { name: 'Profile', label: 'Profile', icon: 'bi-person-circle' }
      ];
    }
    // Citizen or Guest
    return [
      { name: 'Home', label: 'Home', icon: 'bi-house-door-fill' },
      { name: 'Complaint', label: 'Report Grievance', icon: 'bi-megaphone-fill' },
      { name: 'Track Complaint', label: 'Track Ticket', icon: 'bi-geo-alt-fill' },
      ...(isCitizen ? [{ name: 'Complaints', label: 'My Complaints', icon: 'bi-journal-text' }] : [])
    ];
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="fixed-top animate-fade-in shadow-sm">
      <nav className="navbar navbar-expand-lg rc-navbar py-2 py-lg-3 bg-white">
        <div className="container px-2 px-sm-3">
          {/* Logo */}
          <a
            className="navbar-brand d-flex align-items-center me-auto me-lg-4"
            href="#home"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault();
              setActivePage(isAdmin || isOfficer ? 'Dashboards' : 'Home');
              setMobileMenuOpen(false);
              setProfileDropdownOpen(false);
            }}
          >
            <Logo width={40} height={40} showText={true} />
          </a>

          {/* Role Badge (Desktop) */}
          <span
            className="badge rounded-pill px-3 py-1.5 fw-bold d-none d-lg-inline-block me-3 border"
            style={{ fontSize: '0.72rem', ...roleBadge.style }}
          >
            {roleBadge.label}
          </span>

          {/* Desktop Nav Items */}
          <div className="collapse navbar-collapse d-none d-lg-flex" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">
              {navItems().map(item => (
                <li className="nav-item" key={item.name}>
                  <button
                    className={`nav-link rc-nav-link btn btn-link border-0 text-decoration-none px-3 py-2 small fw-semibold ${activePage === item.name ? 'active text-primary fw-bold' : 'text-secondary'}`}
                    onClick={() => setActivePage(item.name)}
                  >
                    <i className={`bi ${item.icon} me-1.5`}></i>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop Auth Section */}
            <div className="d-flex align-items-center gap-2">
              {authenticatedUser ? (
                <div className="position-relative" ref={profileDropdownRef}>
                  <button
                    className="btn btn-light rounded-pill px-3 py-1.5 border d-flex align-items-center gap-2"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  >
                    <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                      {(authenticatedUser.name?.[0] || authenticatedUser.email?.[0] || 'U').toUpperCase()}
                    </span>
                    <span className="small fw-semibold text-secondary">
                      {authenticatedUser.name || authenticatedUser.fullName || authenticatedUser.email}
                    </span>
                    <i className="bi bi-chevron-down small text-muted"></i>
                  </button>

                  {profileDropdownOpen && (
                    <div className="dropdown-menu dropdown-menu-end show position-absolute rounded-4 shadow border-0 p-2 mt-2" style={{ minWidth: '200px' }}>
                      <div className="px-3 py-2 border-bottom">
                        <span className="d-block small fw-bold text-secondary">{authenticatedUser.name || authenticatedUser.fullName}</span>
                        <span className="d-block text-muted text-xxs text-truncate" style={{ fontSize: '0.72rem' }}>{authenticatedUser.email}</span>
                      </div>
                      <button
                        className="dropdown-item py-2 small rounded-3 mt-1"
                        onClick={() => { setActivePage('Profile'); setProfileDropdownOpen(false); }}
                      >
                        <i className="bi bi-person me-2"></i> My Profile
                      </button>
                      <button
                        className="dropdown-item py-2 small rounded-3"
                        onClick={() => { setActivePage('Dashboards'); setProfileDropdownOpen(false); }}
                      >
                        <i className="bi bi-grid me-2"></i> Dashboard
                      </button>
                      <div className="dropdown-divider my-1"></div>
                      <button
                        className="dropdown-item py-2 small rounded-3 text-danger"
                        onClick={() => { handleSignOut(); setProfileDropdownOpen(false); }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i> Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                    onClick={() => {
                      if (setAuthViewMode) setAuthViewMode('login');
                      setActivePage('Login/Register');
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    className="btn btn-primary btn-sm rounded-pill px-3 fw-semibold shadow-sm"
                    onClick={() => {
                      if (setAuthViewMode) setAuthViewMode('register');
                      setActivePage('Login/Register');
                    }}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="navbar-toggler border-0 d-lg-none"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="d-lg-none border-top px-3 py-3 bg-white w-100 animate-slide-up">
            <div className="mb-2 pb-2 border-bottom d-flex align-items-center justify-content-between">
              <span className="badge rounded-pill px-2.5 py-1" style={roleBadge.style}>
                {roleBadge.label}
              </span>
              {authenticatedUser && (
                <span className="small text-muted text-truncate">{authenticatedUser.email}</span>
              )}
            </div>

            <ul className="navbar-nav gap-2 mb-3">
              {navItems().map(item => (
                <li className="nav-item" key={item.name}>
                  <button
                    className={`nav-link btn btn-link text-start w-100 py-2 small fw-semibold text-decoration-none ${activePage === item.name ? 'text-primary fw-bold' : 'text-secondary'}`}
                    onClick={() => {
                      setActivePage(item.name);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <i className={`bi ${item.icon} me-2`}></i>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            {authenticatedUser ? (
              <div className="d-flex flex-column gap-2 border-top pt-2">
                <button
                  className="btn btn-outline-secondary btn-sm rounded-pill w-100"
                  onClick={() => { setActivePage('Profile'); setMobileMenuOpen(false); }}
                >
                  <i className="bi bi-person me-1"></i> My Profile
                </button>
                <button
                  className="btn btn-outline-danger btn-sm rounded-pill w-100"
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Log Out
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2 border-top pt-2">
                <button
                  className="btn btn-outline-primary btn-sm rounded-pill w-50"
                  onClick={() => {
                    if (setAuthViewMode) setAuthViewMode('login');
                    setActivePage('Login/Register');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-primary btn-sm rounded-pill w-50"
                  onClick={() => {
                    if (setAuthViewMode) setAuthViewMode('register');
                    setActivePage('Login/Register');
                    setMobileMenuOpen(false);
                  }}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
