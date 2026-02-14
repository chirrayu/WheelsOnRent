import React, { useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Registration from './pages/Registration';
import AdminPanel from './pages/AdminPanel';
import UserPortal from './pages/UserPortal';
import DLUpload from './pages/DL_upload';
import MyTeamPanel from './pages/MyTeamPanel';
import PasswordReset from './pages/PasswordReset';
import AddVendor from './pages/AddVendor';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/dl-upload" element={
          <ProtectedRoute>
            <DLUpload />
          </ProtectedRoute>
        } />
        <Route path="/admin-panel/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />
        <Route path="/user-portal/*" element={
          <ProtectedRoute allowedRoles={['user', 'admin']}>
            <UserPortal />
          </ProtectedRoute>
        } />
        <Route path="/team-panel/*" element={
          <ProtectedRoute allowedRoles={['team', 'admin']}>
            <MyTeamPanel />
          </ProtectedRoute>
        } />
        <Route path="/team/add-vendor" element={
          <ProtectedRoute allowedRoles={['team', 'admin']}>
            <AddVendor />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;