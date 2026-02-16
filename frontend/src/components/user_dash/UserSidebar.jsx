import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserSidebar.css';
import logo from '../../assets/logo.png';

const UserSidebar = ({ activeTab, setActiveTab, isOpen, isMobile, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'Booking History', icon: '📅' },
    { id: 'help', label: 'Help', icon: '❓' }
  ];

  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    navigate(`/user-portal/${tabId}`);
  };

  return (
    <aside className={`user-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src={logo} alt="WheelsOnRent Logo" className="sidebar-logo" />
          <h3>WheelsOnRent</h3>
        </div>
        {isMobile && (
          <button className="close-sidebar-btn" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        )}
      </div>

      <nav className="sidebar-navigation">
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.id} className="sidebar-menu-item">
              <button
                onClick={() => handleNavigation(item.id)}
                className={`sidebar-menu-button ${activeTab === item.id ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <div className="user-details">
            <p className="user-name">User Portal</p>
            <p className="user-role">Customer</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default UserSidebar;