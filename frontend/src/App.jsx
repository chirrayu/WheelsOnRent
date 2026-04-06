import { useState, createContext, useContext, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Registration = lazy(() => import('./pages/Registration'));
const UserPortal = lazy(() => import('./pages/UserPortal'));
const MyTeamPanel = lazy(() => import('./pages/MyTeamPanel'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));
const AddVendor = lazy(() => import('./pages/AddVendor'));
const VendorPanel = lazy(() => import('./pages/VendorPanel'));
const Landing = lazy(() => import('./pages/Landing'));

// Loading Screen Component
const LoadingScreen = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#f5f3ff',
    color: '#6b21a8',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid rgba(107,33,168,0.1)', 
        borderTop: '4px solid #6b21a8', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
      }}></div>
      <p style={{ fontWeight: 600 }}>Loading WheelsOnRent...</p>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  </div>
);

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check if user data exists in localStorage on initial load
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const originalFetch = window.fetch;
    
    // Global fetch interceptor for 401 Unauthorized errors
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          // Token expired or invalid, force logout
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Dispatch a custom event to notify components if needed, or window.location
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login';
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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

// Vendor Protected Route Component
const VendorProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'vendor') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          {/* Removed AdminPanel route */}
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
          {/* Updated vendor panel routes to handle base route */}
          <Route path="/vendor-panel" element={
            <VendorProtectedRoute>
              <VendorPanel />
            </VendorProtectedRoute>
          } />
          <Route path="/vendor-panel/*" element={
            <VendorProtectedRoute>
              <VendorPanel />
            </VendorProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;