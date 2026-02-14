import React from 'react';
import './AdminSidebar.css';
import { Link, useLocation } from 'react-router-dom';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      <ul className="sidebar-menu">
        <li>
          <Link 
            to="/admin-panel/dashboard" 
            className={isActive('/dashboard') ? 'active' : ''}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/admin-panel/vehicles" 
            className={isActive('/vehicles') ? 'active' : ''}
          >
            Vehicle Management
          </Link>
        </li>
        <li>
          <Link 
            to="/admin-panel/locations" 
            className={isActive('/locations') ? 'active' : ''}
          >
            Location Management
          </Link>
        </li>
        <li>
          <Link 
            to="/admin-panel/pricing" 
            className={isActive('/pricing') ? 'active' : ''}
          >
            Price Update
          </Link>
        </li>
        <li>
          <Link 
            to="/admin-panel/help" 
            className={isActive('/help') ? 'active' : ''}
          >
            Help & Support
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;