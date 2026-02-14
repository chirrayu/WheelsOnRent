import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import './MyTeamPanel.css';

const MyTeamPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'team' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }
    
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('http://localhost:5000/team/vendors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h3>Welcome, {user?.name || 'Team Member'}!</h3>
        <p>You are logged in as a team member.</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <span>👥</span>
          </div>
          <div className="stat-info">
            <h2>{vendors.length}</h2>
            <p>Total Vendors</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span>✅</span>
          </div>
          <div className="stat-info">
            <h2>{vendors.filter(v => v.is_active).length}</h2>
            <p>Active Vendors</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span>❌</span>
          </div>
          <div className="stat-info">
            <h2>{vendors.filter(v => !v.is_active).length}</h2>
            <p>Inactive Vendors</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="vendors-content">
      <div className="vendors-header">
        <h3>Manage Vendors</h3>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/team/add-vendor')}
        >
          + Add New Vendor
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading vendors...</div>
      ) : (
        <div className="vendors-list">
          {vendors.length > 0 ? (
            <div className="table-responsive">
              <table className="vendors-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td><span className="vendor-name">{vendor.name}</span></td>
                      <td>{vendor.email}</td>
                      <td>{vendor.username}</td>
                      <td>{vendor.phone || '-'}</td>
                      <td>
                        <span className={`status-badge ${vendor.is_active ? 'status-active' : 'status-inactive'}`}>
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(vendor.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-edit"
                            onClick={() => {
                              // Edit vendor logic
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-delete"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this vendor?')) {
                                try {
                                  const response = await fetch(`http://localhost:5000/team/vendor/${vendor._id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  });
                                  
                                  if (response.ok) {
                                    fetchVendors(); // Refresh the list
                                  }
                                } catch (error) {
                                  console.error('Error deleting vendor:', error);
                                }
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon">👥</span>
              <h4>No vendors found</h4>
              <p>Start by adding your first vendor to the system.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/team/add-vendor')}
              >
                + Add Vendor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="team-panel">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Team Panel</h2>
        </div>
        
        <div className="user-profile">
          <div className="user-avatar">
            <span>👤</span>
          </div>
          <div className="user-info">
            <h4>{user?.name || 'Team Member'}</h4>
            <span className="user-role">{user?.role || 'Team'}</span>
          </div>
        </div>
        
        <ul className="nav-menu">
          <li>
            <button 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'vendors' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendors')}
            >
              <span>👥</span>
              <span>Manage Vendors</span>
            </button>
          </li>
          <li>
            <button 
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <span>📈</span>
              <span>Reports</span>
            </button>
          </li>
          <li>
            <button 
              className="nav-link logout-btn"
              onClick={handleLogout}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <header className="page-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'vendors' && 'Manage Vendors'}
            {activeTab === 'reports' && 'Reports & Analytics'}
          </h1>
        </header>
        
        <div className="content-wrapper">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'vendors' && renderVendors()}
          {activeTab === 'reports' && (
            <div className="reports-content">
              <div className="empty-state">
                <span className="icon">📊</span>
                <h4>Reports Coming Soon</h4>
                <p>Detailed analytics and reports will be available in future updates.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyTeamPanel;