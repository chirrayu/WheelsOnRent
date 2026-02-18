import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import QRScanner from '../components/vendor/QRScanner';
import './VendorPanel.css';
import API_BASE_URL from '../apiConfig';

const VendorPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ totalVehicles: 0, activeBookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_type: '',
    model: '',
    make: '',
    license_plate: '',
    daily_rate: '',
    hourly_rate: '',
    condtion: '',
    location: '',
    fuel_type: 'Petrol',
    is_available: true
  });

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      navigate('/login');
      return;
    }

    // Update active tab based on URL
    const path = location.pathname;
    if (path.includes('/vendor-panel/vehicles')) {
      setActiveTab('vehicles');
    } else if (path.includes('/vendor-panel/bookings')) {
      setActiveTab('bookings');
    } else if (path.includes('/vendor-panel/pricing')) {
      setActiveTab('pricing');
    } else if (path.includes('/vendor-panel/qr-scan')) {
      setActiveTab('qr-scan');
    } else if (path.includes('/vendor-panel/help')) {
      setActiveTab('help');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchVehicles();
      fetchBookings();
    } else if (activeTab === 'vehicles') {
      fetchVehicles();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    }
  }, [activeTab]);

  const getToken = () => localStorage.getItem('token');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/vehicles`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.ok) {
        setVehicles(data.vehicles || []);
        setDashboardStats(prev => ({ ...prev, totalVehicles: data.count || 0 }));
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/bookings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings || []);
        const active = (data.bookings || []).filter(b => b.status === 'confirmed' || b.status === 'active').length;
        setDashboardStats(prev => ({ ...prev, activeBookings: active }));
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!vehicleForm.vehicle_type || !vehicleForm.model || !vehicleForm.make || !vehicleForm.license_plate || !vehicleForm.daily_rate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/vendor/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...vehicleForm,
          daily_rate: parseFloat(vehicleForm.daily_rate),
          hourly_rate: vehicleForm.hourly_rate ? parseFloat(vehicleForm.hourly_rate) : 0
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Vehicle added successfully!');
        setShowAddVehicle(false);
        setVehicleForm({ vehicle_type: '', model: '', make: '', license_plate: '', daily_rate: '', hourly_rate: '', condtion: '', location: '', fuel_type: 'Petrol', is_available: true });
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add vehicle');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'pricing', label: 'Price Update', icon: '💰' },
    { id: 'qr-scan', label: 'QR Scanner', icon: '📷' },
    { id: 'help', label: 'Help', icon: '❓' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ padding: '24px' }}>
            <h2>Vendor Dashboard</h2>
            {success && <div style={inlineStyles.successBanner}>{success}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={inlineStyles.statCard}>
                <div style={{ fontSize: '2rem', color: '#6366f1' }}>🚗</div>
                <div>
                  <h3 style={inlineStyles.statNumber}>{dashboardStats.totalVehicles}</h3>
                  <p style={inlineStyles.statLabel}>Total Vehicles</p>
                </div>
              </div>

              <div style={inlineStyles.statCard}>
                <div style={{ fontSize: '2rem', color: '#6366f1' }}>📅</div>
                <div>
                  <h3 style={inlineStyles.statNumber}>{dashboardStats.activeBookings}</h3>
                  <p style={inlineStyles.statLabel}>Active Bookings</p>
                </div>
              </div>

              <div style={inlineStyles.statCard}>
                <div style={{ fontSize: '2rem', color: '#6366f1' }}>💰</div>
                <div>
                  <h3 style={inlineStyles.statNumber}>₹{dashboardStats.revenue}</h3>
                  <p style={inlineStyles.statLabel}>Today's Revenue</p>
                </div>
              </div>
            </div>

            <div style={inlineStyles.whiteCard}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <button onClick={() => { setActiveTab('vehicles'); setShowAddVehicle(true); navigate('/vendor-panel/vehicles'); }} style={inlineStyles.quickActionBtn('#4f46e5')}>
                  Add New Vehicle
                </button>
                <button onClick={() => { setActiveTab('pricing'); navigate('/vendor-panel/pricing'); }} style={inlineStyles.quickActionBtn('#10b981')}>
                  Update Pricing
                </button>
                <button onClick={() => { setActiveTab('bookings'); navigate('/vendor-panel/bookings'); }} style={inlineStyles.quickActionBtn('#3b82f6')}>
                  Manage Bookings
                </button>
              </div>
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Vehicle Management</h2>
              <button onClick={() => setShowAddVehicle(!showAddVehicle)} style={inlineStyles.primaryBtn}>
                {showAddVehicle ? '✕ Close' : '+ Add Vehicle'}
              </button>
            </div>

            {error && <div style={inlineStyles.errorBanner}>{error}</div>}
            {success && <div style={inlineStyles.successBanner}>{success}</div>}

            {/* Add Vehicle Form */}
            {showAddVehicle && (
              <div style={{ ...inlineStyles.whiteCard, marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Add New Vehicle</h3>
                <form onSubmit={handleAddVehicle}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={inlineStyles.formLabel}>Vehicle Type *</label>
                      <select value={vehicleForm.vehicle_type} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })} style={inlineStyles.formInput} required>
                        <option value="">Select type</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Bike">Bike</option>
                      </select>
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Model *</label>
                      <input type="text" value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={inlineStyles.formInput} required />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Make *</label>
                      <input type="text" value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} style={inlineStyles.formInput} required />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>License Plate *</label>
                      <input type="text" value={vehicleForm.license_plate} onChange={e => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })} style={inlineStyles.formInput} required />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Daily Rate (₹) *</label>
                      <input type="number" value={vehicleForm.daily_rate} onChange={e => setVehicleForm({ ...vehicleForm, daily_rate: e.target.value })} style={inlineStyles.formInput} required />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Hourly Rate (₹)</label>
                      <input type="number" value={vehicleForm.hourly_rate} onChange={e => setVehicleForm({ ...vehicleForm, hourly_rate: e.target.value })} style={inlineStyles.formInput} />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Location *</label>
                      <input type="text" value={vehicleForm.location} onChange={e => setVehicleForm({ ...vehicleForm, location: e.target.value })} style={inlineStyles.formInput} required placeholder="e.g. Indiranagar, Bangalore" />
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Fuel Type</label>
                      <select value={vehicleForm.fuel_type} onChange={e => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })} style={inlineStyles.formInput}>
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                        <option value="Diesel">Diesel</option>
                      </select>
                    </div>
                    <div>
                      <label style={inlineStyles.formLabel}>Condition</label>
                      <select value={vehicleForm.condtion} onChange={e => setVehicleForm({ ...vehicleForm, condtion: e.target.value })} style={inlineStyles.formInput}>
                        <option value="">Select condition</option>
                        <option value="new">New</option>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={vehicleForm.is_available !== false}
                        onChange={e => setVehicleForm({ ...vehicleForm, is_available: e.target.checked })}
                      />
                      <span>Make available for booking immediately</span>
                    </label>
                  </div>
                  <button type="submit" disabled={loading} style={{ ...inlineStyles.primaryBtn, marginTop: '20px' }}>
                    {loading ? 'Adding...' : 'Add Vehicle'}
                  </button>
                </form>
              </div>
            )}

            {/* Vehicle List */}
            {loading && !showAddVehicle ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading vehicles...</div>
            ) : vehicles.length === 0 ? (
              <div style={inlineStyles.whiteCard}>
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚗</div>
                  <p>No vehicles added yet. Click "Add Vehicle" to get started.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} style={inlineStyles.whiteCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{vehicle.model}</h3>
                        <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.875rem' }}>{vehicle.vehicle_type?.toUpperCase()}</p>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: vehicle.is_available ? '#ecfdf5' : '#fef2f2',
                        color: vehicle.is_available ? '#10b981' : '#ef4444'
                      }}>
                        {vehicle.is_available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>🔖 {vehicle.license_plate}</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>💰 ₹{vehicle.daily_rate}/day {vehicle.hourly_rate ? `| ₹${vehicle.hourly_rate}/hr` : ''}</p>
                      {vehicle.condtion && <p style={{ margin: '0', fontSize: '0.875rem', color: '#64748b' }}>🔧 {vehicle.condtion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'bookings':
        return (
          <div style={{ padding: '24px' }}>
            <h2>Bookings Management</h2>
            {bookings.length === 0 ? (
              <div style={inlineStyles.whiteCard}>
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
                  <p>No bookings yet.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map(booking => (
                  <div key={booking._id} style={inlineStyles.whiteCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Booking #{booking._id?.slice(-6)}</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                          {booking.start_date} — {booking.end_date}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: booking.status === 'confirmed' ? '#dbeafe' : booking.status === 'cancelled' ? '#fef2f2' : '#ecfdf5',
                        color: booking.status === 'confirmed' ? '#3b82f6' : booking.status === 'cancelled' ? '#ef4444' : '#10b981'
                      }}>
                        {booking.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                      <div><span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>TYPE</span><br />{booking.booking_type || 'daily'}</div>
                      <div><span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>RATE</span><br />₹{booking.rate || 0}</div>
                      <div><span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>USER</span><br />{booking.user_id?.slice(-6) || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'pricing':
        return (
          <div style={{ padding: '24px' }}>
            <h2>Price Update</h2>
            {vehicles.length === 0 ? (
              <div style={inlineStyles.whiteCard}>
                <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Add vehicles first to update pricing.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vehicles.map(vehicle => (
                  <div key={vehicle._id} style={{ ...inlineStyles.whiteCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{vehicle.model}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{vehicle.license_plate}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1e293b' }}>₹{vehicle.daily_rate}/day</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{vehicle.hourly_rate ? `₹${vehicle.hourly_rate}/hr` : 'No hourly rate'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'qr-scan':
        return (
          <div style={{ padding: '24px' }}>
            <h2>QR Scanner</h2>
            <QRScanner />
          </div>
        );

      case 'help':
        return (
          <div style={{ padding: '24px' }}>
            <h2>Help & Support</h2>
            <div style={inlineStyles.whiteCard}>
              <h3>Frequently Asked Questions</h3>
              <div style={{ marginTop: '16px' }}>
                {[
                  { q: 'How do I add a vehicle?', a: 'Go to Vehicles tab and click "Add Vehicle".' },
                  { q: 'How do I update pricing?', a: 'Go to the Price Update tab to modify rates.' },
                  { q: 'How do I manage bookings?', a: 'Go to the Bookings tab to view and manage all bookings.' }
                ].map((faq, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{faq.q}</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ padding: '24px' }}>
            <h2>Vendor Dashboard</h2>
            <p>Welcome to your vendor panel!</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: '#6366f1',
        color: 'white',
        height: '100vh',
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '600' }}>Vendor Panel</h3>
        </div>

        <nav style={{ flex: 1, paddingTop: '20px' }}>
          <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
            {menuItems.map(item => (
              <li key={item.id} style={{ margin: '0' }}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    navigate(`/vendor-panel/${item.id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.8)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '280px'
      }}>
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0'
          }}>
            <h1 style={{
              margin: '0',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'vehicles' && 'Vehicle Management'}
              {activeTab === 'bookings' && 'Bookings'}
              {activeTab === 'pricing' && 'Price Update'}
              {activeTab === 'qr-scan' && 'QR Scanner'}
              {activeTab === 'help' && 'Help & Support'}
            </h1>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          padding: '24px'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Reusable inline styles
const inlineStyles = {
  statCard: {
    backgroundColor: 'white', borderRadius: '12px', padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #e2e8f0'
  },
  statNumber: { margin: '0 0 4px 0', fontSize: '2rem', color: '#1e293b', fontWeight: '700' },
  statLabel: { margin: '0', color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  whiteCard: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
  primaryBtn: { padding: '12px 24px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  quickActionBtn: (bg) => ({ padding: '16px', backgroundColor: bg, color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }),
  errorBanner: { padding: '12px', backgroundColor: '#fee', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' },
  successBanner: { padding: '12px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '16px' },
  formLabel: { display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: '500', color: '#374151' },
  formInput: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
};

export default VendorPanel;