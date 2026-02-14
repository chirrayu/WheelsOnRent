import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalNavbar from '../components/GlobalNavbar';
import UserSidebar from '../components/user_dash/UserSidebar';
import UserDashboard from '../components/user_dash/Dashboard';
import BookingHistory from '../components/user_dash/Booking_History';
import UserHelp from '../components/user_dash/Help';
import './UserPortal.css';

const UserPortal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Perform logout logic
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="user-portal">
      <GlobalNavbar userRole="User" onLogout={handleLogout} />
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`user-content ${sidebarOpen ? 'shifted' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/user-portal/dashboard" replace />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/history" element={<BookingHistory />} />
          <Route path="/help" element={<UserHelp />} />
        </Routes>
      </div>
    </div>
  );
};

export default UserPortal;