import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalNavbar from '../components/GlobalNavbar';
import LocationManager from '../components/my_team_panel/Location_manager';
import './My_Team_Panel.css';

const MyTeamPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Perform logout logic
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="team-panel">
      <GlobalNavbar userRole="Team Member" onLogout={handleLogout} />
      
      <div className={`team-content ${sidebarOpen ? 'shifted' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/team-panel/location-manager" replace />} />
          <Route path="/location-manager" element={<LocationManager />} />
        </Routes>
      </div>
    </div>
  );
};

export default MyTeamPanel;