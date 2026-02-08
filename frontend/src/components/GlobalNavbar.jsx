import React, { useState } from 'react';
import './GlobalNavbar.css';

const GlobalNavbar = ({ userRole, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <nav className="global-navbar">
      <div className="navbar-brand">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          â˜°
        </button>
        <h2>Vehicle Booking System</h2>
      </div>
      
      <div className="navbar-user">
        <img 
          src="https://via.placeholder.com/40" 
          alt="User" 
          className="user-image"
        />
        <span>{userRole}</span>
        <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default GlobalNavbar;