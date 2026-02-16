import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorSidebar.css';

const VendorSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'pricing', label: 'Price Update', icon: '💰' },
    { id: 'qr-scan', label: 'QR Scanner', icon: '📷' },
    { id: 'help', label: 'Help', icon: '❓' }
  ];

  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    navigate(`/vendor-panel/${tabId}`);
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <h3>Vendor Panel</h3>
      </div>
      
      <nav style={styles.navigation}>
        <ul style={styles.menu}>
          {menuItems.map(item => (
            <li key={item.id} style={styles.menuItem}>
              <button
                onClick={() => handleNavigation(item.id)}
                style={{
                  ...styles.menuButton,
                  ...(activeTab === item.id ? styles.activeMenuButton : {})
                }}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                <span style={styles.menuLabel}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#6366f1',
    color: 'white',
    height: '100vh',
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000
  },
  logo: {
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center'
  },
  logoH3: {
    margin: '0',
    fontSize: '1.5rem',
    fontWeight: '600'
  },
  navigation: {
    flex: 1,
    paddingTop: '20px'
  },
  menu: {
    listStyle: 'none',
    padding: '0',
    margin: '0'
  },
  menuItem: {
    margin: '0'
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    textDecoration: 'none'
  },
  activeMenuButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white'
  },
  menuIcon: {
    fontSize: '1.2rem'
  },
  menuLabel: {
    flex: 1
  }
};

export default VendorSidebar;