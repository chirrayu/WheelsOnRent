import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Vendors from './Vendors';
import API_BASE_URL from '../../apiConfig';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeBookings: 0, totalSpent: 0, dlVerified: false });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        const active = (data.bookings || []).filter(b => b.status === 'confirmed' || b.status === 'active').length;
        const total = (data.bookings || []).reduce((sum, b) => sum + (b.rate || 0), 0);
        setStats({ activeBookings: active, totalSpent: total });
      }

      // Fetch DL Status
      const dlResponse = await fetch(`${API_BASE_URL}/dl/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const dlData = await dlResponse.json();
      if (dlResponse.ok) {
        setStats(prev => ({ ...prev, dlVerified: dlData.status === 'verified' }));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Dashboard</h2>
        <p style={styles.subtitle}>Welcome back, {localStorage.getItem('user_name') || 'User'}!</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>{stats.activeBookings}</h3>
            <p style={styles.statLabel}>Active Bookings</p>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>₹{stats.totalSpent}</h3>
            <p style={styles.statLabel}>Total Spent</p>
          </div>
        </div>

        <div
          style={{ ...styles.statCard, cursor: 'pointer', border: stats.dlVerified ? '1px solid #10b981' : '1px solid #f59e0b' }}
          onClick={() => navigate('/dl-upload')}
        >
          <div style={{ ...styles.statIcon, color: stats.dlVerified ? '#10b981' : '#f59e0b' }}>
            {stats.dlVerified ? '✅' : '🆔'}
          </div>
          <div style={stats.statInfo}>
            <h3 style={{ ...styles.statNumber, fontSize: '1.25rem' }}>
              {stats.dlVerified ? 'Verified' : 'Verify DL'}
            </h3>
            <p style={styles.statLabel}>Driving License</p>
          </div>
        </div>


      </div>

      {/* Vendors Section */}
      <div style={styles.vendorsSection}>
        <Vendors />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  subtitle: {
    margin: '0',
    color: '#64748b',
    fontSize: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e2e8f0'
  },
  statIcon: {
    fontSize: '2rem',
    color: '#6366f1'
  },
  statInfo: {},
  statNumber: {
    margin: '0 0 4px 0',
    fontSize: '2rem',
    color: '#1e293b',
    fontWeight: '700'
  },
  statLabel: {
    margin: '0',
    color: '#64748b',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '500px'
  },
  searchBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  searchLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569'
  },
  searchInput: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    color: '#1e293b',
    backgroundColor: '#fff',
    outline: 'none'
  },
  searchButton: {
    padding: '12px',
    backgroundColor: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  vendorsSection: {
    marginTop: '32px'
  }
};

export default Dashboard;