import { Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import GlobalNavbar from '../components/GlobalNavbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Dashboard from '../components/admin/Dashboard';
import VehicleManagement from '../components/admin/VehicleManagement';
import PriceUpdate from '../components/admin/PriceUpdate';
import BookingsManagement from '../components/admin/BookingsManagement';
import Help from '../components/admin/Help';
import { initializeMockData } from '../utils/mockData';

interface AdminPanelProps {
  user: any;
  onLogout: () => void;
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar user={user} onLogout={onLogout} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vehicles" element={<VehicleManagement />} />
            <Route path="/pricing" element={<PriceUpdate />} />
            <Route path="/bookings" element={<BookingsManagement />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}