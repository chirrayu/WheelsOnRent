import React from 'react';
import './UserSidebar.css';
import { Link, useLocation } from 'react-router-dom';

const UserSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className={`user-admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>User Portal</h3>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link 
            to="/user-portal/dashboard" 
            className={isActive('/dashboard') ? 'active' : ''}
          >
            Available Locations
          </Link>
        </li>
        <li>
          <Link 
            to="/user-portal/history" 
            className={isActive('/history') ? 'active' : ''}
          >
            Booking History
          </Link>
        </li>
        <li>
          <Link 
            to="/user-portal/verify" 
            className={isActive('/verify') ? 'active' : ''}
          >
            Verify Customer
          </Link>
        </li>
        <li>
          <Link 
            to="/user-portal/help" 
            className={isActive('/help') ? 'active' : ''}
          >
            Help & Support
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default UserSidebar;