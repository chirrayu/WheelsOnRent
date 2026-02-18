import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App'; // Import the auth context
import API_BASE_URL from '../apiConfig';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from context

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleForgotPasswordChange = (e) => {
    setForgotPasswordEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Extract user info and token from response
        const { token, user } = data;

        // Save token to localStorage (or sessionStorage)
        localStorage.setItem('token', token);

        // Log in the user in the context
        login({
          email: user.email,
          role: user.role,
          name: user.name,
          id: user.id
        });

        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/admin-panel/dashboard');
        } else if (user.role === 'team') {
          navigate('/team-panel/location-manager');
        } else if (user.role === 'vendor') {
          navigate('/vendor-panel'); // Updated to redirect to vendor panel root
        } else {
          navigate('/user-portal/dashboard');
        }
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Password reset link has been sent to your email');
        setForgotPasswordEmail('');
      } else {
        setError(data.error || 'Failed to send password reset link. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError('');
    setSuccess('');
  };

  if (showForgotPassword) {
    return (
      <div className="login-page">
        <div className="login-container">
          <h2>Reset Password</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
            <div className="form-group">
              <label htmlFor="forgot-email">Email:</label>
              <input
                type="email"
                id="forgot-email"
                name="forgot-email"
                className="form-control"
                value={forgotPasswordEmail}
                onChange={handleForgotPasswordChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="back-to-login">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBackToLogin}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="signup-link">
          Don't have an account? <a href="/register">Sign up here</a>
        </div>

        <div className="forgot-password-link">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="link-button"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;