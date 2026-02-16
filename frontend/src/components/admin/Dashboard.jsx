import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Vendor Dashboard</h2>
      </div>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🚗</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>Total Vehicles</p>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📅</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>0</h3>
            <p style={styles.statLabel}>Active Bookings</p>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>₹0</h3>
            <p style={styles.statLabel}>Today's Revenue</p>
          </div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div style={styles.statInfo}>
            <h3 style={styles.statNumber}>0.0</h3>
            <p style={styles.statLabel}>Avg Rating</p>
          </div>
        </div>
      </div>
      
      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionButton}>
            Add New Vehicle
          </button>
          <button style={styles.actionButton}>
            Update Pricing
          </button>
          <button style={styles.actionButton}>
            View Reports
          </button>
          <button style={styles.actionButton}>
            Manage Bookings
          </button>
        </div>
      </div>
      
      <div style={styles.recentActivity}>
        <h3 style={styles.sectionTitle}>Recent Activity</h3>
        <div style={styles.activityList}>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>📅</div>
            <div style={styles.activityDetails}>
              <p style={styles.activityText}>New booking received</p>
              <span style={styles.activityTime}>2 hours ago</span>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>💰</div>
            <div style={styles.activityDetails}>
              <p style={styles.activityText}>Payment received</p>
              <span style={styles.activityTime}>5 hours ago</span>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>🚗</div>
            <div style={styles.activityDetails}>
              <p style={styles.activityText}>Vehicle returned</p>
              <span style={styles.activityTime}>1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    marginLeft: '280px'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: '0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
  quickActions: {
    marginBottom: '32px'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  actionButton: {
    padding: '16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  recentActivity: {},
  activityList: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  activityItemLast: {
    borderBottom: 'none'
  },
  activityIcon: {
    fontSize: '1.5rem',
    color: '#6366f1'
  },
  activityDetails: {
    flex: 1
  },
  activityText: {
    margin: '0 0 4px 0',
    color: '#1e293b',
    fontWeight: '500'
  },
  activityTime: {
    fontSize: '0.8rem',
    color: '#64748b'
  }
};

export default Dashboard;