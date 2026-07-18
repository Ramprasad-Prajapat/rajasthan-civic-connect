import React from 'react';
import Logo from './Logo';

export default function Footer({ setActivePage }) {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };

      const formatted = new Intl.DateTimeFormat('en-IN', options).format(new Date());
      setTimeStr(formatted + ' (IST)');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const goToPage = (e, page) => {
    e.preventDefault();
    setActivePage(page);
  };

  return (
    <footer className="rc-main-footer">
      <div className="container">

        <div className="rc-footer-grid">

          {/* Brand Section */}
          <div className="rc-footer-brand">
            <a
              href="#home"
              className="rc-footer-logo"
              onClick={(e) => goToPage(e, 'Home')}
            >
              <Logo width={50} height={50} showText={true} textClass="fs-4 text-white" />
            </a>

            <p className="rc-footer-desc">
              RajCivic Connect is a Rajasthan-level civic complaint management platform
              designed for Nagar Nigam, Nagar Parishad, Nagar Palika, officers,
              workers and citizens.
            </p>

            <div className="rc-footer-social">
              <a href="#social"><i className="bi bi-facebook"></i></a>
              <a href="#social"><i className="bi bi-twitter-x"></i></a>
              <a href="#social"><i className="bi bi-instagram"></i></a>
              <a href="#social"><i className="bi bi-youtube"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rc-footer-box">
            <h4>Quick Links</h4>

            <ul>
              <li><a href="#home" onClick={(e) => goToPage(e, 'Home')}>Home</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Complaint</a></li>
              <li><a href="#track" onClick={(e) => goToPage(e, 'Track Complaint')}>Track Complaint</a></li>
              <li><a href="#helpdesk" onClick={(e) => goToPage(e, 'Helpdesk')}>Helpdesk</a></li>
              <li><a href="#login" onClick={(e) => goToPage(e, 'Login/Register')}>Login/Register</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="rc-footer-box">
            <h4>Categories</h4>

            <ul>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Garbage</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Street Light</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Road / Pothole</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Water Leakage</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Drainage / Sewer</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Public Toilet</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Animal Issue</a></li>
              <li><a href="#complaint" onClick={(e) => goToPage(e, 'Complaint')}>Public Property</a></li>
            </ul>
          </div>

          {/* Citizen Support */}
          <div className="rc-footer-box">
            <h4>Citizen Support</h4>

            <div className="rc-support-list">

              <div className="rc-support-item">
                <i className="bi bi-telephone-fill"></i>
                <div>
                  <h5>Helpdesk Contact</h5>
                  <p>1800-180-6127 (Toll-Free)</p>
                </div>
              </div>

              <div className="rc-support-item">
                <i className="bi bi-envelope-fill"></i>
                <div>
                  <h5>Email Support</h5>
                  <p>support.rajcivic@rajasthan.gov.in</p>
                </div>
              </div>

              <div className="rc-support-item">
                <i className="bi bi-building-fill"></i>
                <div>
                  <h5>Nodal Office</h5>
                  <p>
                    Department of Local Self Government, G-3, Raj Mahal Residency,
                    Jaipur, Rajasthan
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="rc-footer-bottom">
          <div className="rc-footer-copy">
            © {new Date().getFullYear()} RajCivic Connect (Government of Rajasthan). All Rights Reserved.

            <div className="rc-live-time">
              <i className="bi bi-clock-fill"></i>
              LIVE SYSTEM TIME:
              <span>{timeStr}</span>
            </div>
          </div>

          <div className="rc-footer-legal">
            <a href="#helpdesk" onClick={(e) => goToPage(e, 'Helpdesk')}>Contact</a>
            <span>•</span>
            <a href="#helpdesk" onClick={(e) => goToPage(e, 'Helpdesk')}>Privacy Policy</a>
            <span>•</span>
            <a href="#helpdesk" onClick={(e) => goToPage(e, 'Helpdesk')}>Terms and Conditions</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
