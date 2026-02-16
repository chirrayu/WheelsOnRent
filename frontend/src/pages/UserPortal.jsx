import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import UserSidebar from '../components/user_dash/UserSidebar';
import UserDashboard from '../components/user_dash/Dashboard';
import UserBookingHistory from '../components/user_dash/Booking_History';
import UserHelp from '../components/user_dash/Help';
import './UserPortal.css';
import logo from '../assets/logo.png';

const UserPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'user' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    // Set active tab based on URL
    const path = location.pathname;
    if (path.includes('/user-portal/bookings')) {
      setActiveTab('bookings');
    } else if (path.includes('/user-portal/help')) {
      setActiveTab('help');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <UserDashboard />;
      case 'bookings':
        return <UserBookingHistory />;
      case 'help':
        return <UserHelp />;
      default:
        return <UserDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'bookings': return 'Booking History';
      case 'help': return 'Help & Support';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="user-portal">
      {/* Sidebar */}
      <UserSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className={`main-container ${isSidebarOpen && !isMobile ? 'sidebar-open' : ''}`}>
        {/* Header/Navbar */}
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <span className="hamburger-icon">☰</span>
              </button>

              <div className="brand-section">
                <img src={logo} alt="WheelsOnRent" className="brand-logo" />
                <span className="brand-name">WheelsOnRent</span>
                {!isMobile && (
                  <>
                    <span className="divider">|</span>
                    <h1 className="page-title">{getPageTitle()}</h1>
                  </>
                )}
              </div>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              {isMobile ? '🚪' : 'Logout'}
            </button>
          </div>

          {/* Mobile page title */}
          {isMobile && (
            <div className="mobile-page-title">
              {getPageTitle()}
            </div>
          )}
        </header>

        {/* Content area */}
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserPortal;