import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GlobalNavbar from '../components/GlobalNavbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Dashboard from '../components/admin/Dashboard';
import VehicleManagement from '../components/admin/Vehicle_Management';
import LocationManagement from '../components/admin/location_management';
import PriceUpdate from '../components/admin/price_update';
import Help from '../components/admin/Help';
import './AdminPanel.css';
import CustomerVerify from '../components/user_dash/Customer_verify';

const AdminPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    // Perform logout logic
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="admin-panel">
      <GlobalNavbar userRole="Admin" onLogout={handleLogout} />
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className={`admin-content ${sidebarOpen ? 'shifted' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin-panel/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify" element={<CustomerVerify />} />
          <Route path="/vehicles" element={<VehicleManagement />} />
          <Route path="/locations" element={<LocationManagement />} />
          <Route path="/pricing" element={<PriceUpdate />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;