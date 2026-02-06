import { Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import GlobalNavbar from '../components/GlobalNavbar';
import TeamSidebar from '../components/team/TeamSidebar';
import LocationManager from '../components/team/LocationManager';
import { initializeMockData } from '../utils/mockData';

interface MyTeamPanelProps {
  user: any;
  onLogout: () => void;
}

export default function MyTeamPanel({ user, onLogout }: MyTeamPanelProps) {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalNavbar user={user} onLogout={onLogout} />
      <div className="flex">
        <TeamSidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/team/locations" replace />} />
            <Route path="/locations" element={<LocationManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}