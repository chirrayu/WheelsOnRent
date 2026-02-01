import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import UserPortal from './pages/UserPortal';
import MyTeamPanel from './pages/MyTeamPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              currentUser ? (
                <Navigate to={
                  currentUser.role === 'admin' ? '/admin' :
                  currentUser.role === 'team' ? '/team' :
                  '/user'
                } replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              currentUser ? (
                <Navigate to={
                  currentUser.role === 'admin' ? '/admin' :
                  currentUser.role === 'team' ? '/team' :
                  '/user'
                } replace />
              ) : (
                <Register onRegister={handleLogin} />
              )
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              currentUser?.role === 'admin' ? (
                <AdminPanel user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/user/*" 
            element={
              currentUser?.role === 'user' ? (
                <UserPortal user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/team/*" 
            element={
              currentUser?.role === 'team' ? (
                <MyTeamPanel user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={
              currentUser ? (
                <Navigate to={
                  currentUser.role === 'admin' ? '/admin' :
                  currentUser.role === 'team' ? '/team' :
                  '/user'
                } replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </Router>
      <Toaster />
    </>
  );
}