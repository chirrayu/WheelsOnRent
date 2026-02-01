import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import GlobalNavbar from '../components/GlobalNavbar';
import UserSidebar from '../components/user/UserSidebar';
import Dashboard from '../components/user/Dashboard';
import BookingHistory from '../components/user/BookingHistory';
import Help from '../components/user/Help';
import { initializeMockData } from '../utils/mockData';

interface UserPortalProps {
  user: any;
  onLogout: () => void;
}

export default function UserPortal({ user, onLogout }: UserPortalProps) {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar user={user} onLogout={onLogout} />
      <div className="flex">
        <UserSidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/bookings" element={<BookingHistory user={user} />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
