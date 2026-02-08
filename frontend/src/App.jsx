import React, { useState, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import UserPortal from './pages/UserPortal';
import DLUpload from './pages/DL_upload';
import MyTeamPanel from './pages/My_Team_Panel';

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
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </AuthProvider>
  );
}

export default App;