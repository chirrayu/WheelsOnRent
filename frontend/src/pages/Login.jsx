import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import the auth context
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }
    
    // Determine role based on email for demo purposes
    let role = 'user'; // default role
    if (credentials.email === 'admin@wheelsonrent.com') {
      role = 'admin';
    } else if (credentials.email === 'team@wheelsonrent.com') {
      role = 'team';
    }
    
    // In a real app, you would authenticate with backend
    // For demo purposes, we'll just set the user in context
    login({ email: credentials.email, role });
    
    // Navigate based on role
    if (role === 'admin') {
      navigate('/admin-panel/dashboard');
    } else if (role === 'team') {
      navigate('/team-panel/location-manager');
    } else {
      navigate('/user-portal/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        
        <div className="signup-link">
          Don't have an account? <a href="/register">Sign up here</a>
        </div>
      </div>
    </div>
  );
};

export default Login;