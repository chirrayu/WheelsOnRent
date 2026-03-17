import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import QRScanner from '../components/vendor/QRScanner';
import './VendorPanel.css';
import API_BASE_URL from '../apiConfig';

const VendorPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Bill/Receipt State
  const [billInfo, setBillInfo] = useState(null);

  // Add vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
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

    const path = location.pathname;
    if (path.includes('/vendor-panel/vehicles')) {
      setActiveTab('vehicles');
    } else if (path.includes('/vendor-panel/bookings')) {
      setActiveTab('bookings');
    } else if (path.includes('/vendor-panel/qr-scan')) {
      setActiveTab('qr-scan');
    } else if (path.includes('/vendor-panel/help')) {
      setActiveTab('help');
    } else {
      setActiveTab('dashboard');
    }
    setIsSidebarOpen(false); // Auto-close on navigation
  }, [location.pathname, user, navigate]);

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
      const url = editingVehicle
        ? `${API_BASE_URL}/vendor/vehicle/${editingVehicle._id}`
        : `${API_BASE_URL}/vendor/vehicles`;
      const method = editingVehicle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        setSuccess(editingVehicle ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
        setShowAddVehicle(false);
        setEditingVehicle(null);
        setVehicleForm({ vehicle_type: '', model: '', make: '', license_plate: '', daily_rate: '', hourly_rate: '', condtion: '', location: '', fuel_type: 'Petrol', is_available: true });
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Operation failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const confirmMessages = {
      active: 'Approve this booking and start the ride?',
      completed: 'Complete the ride? The final bill will be generated.',
      cancelled: 'Reject this booking?'
    };

    if (!window.confirm(confirmMessages[newStatus] || 'Update status?')) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/vendor/ride/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ booking_id: bookingId, status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        if (newStatus === 'completed') {
          setBillInfo({
            amount: data.final_amount,
            duration: data.total_duration,
            bookingId: bookingId
          });
        }
        fetchBookings();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update status');
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
    { id: 'qr-scan', label: 'Scanner', icon: '📷' },
    { id: 'help', label: 'Help', icon: '❓' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        const activeBookingsList = bookings.filter(b => b.status === 'confirmed' || b.status === 'active');
        return (
          <div className="dash-content-inner">
            <div className="stats-grid">
              <div className="stat-card-premium">
                <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#3b82f6' }}>🚗</div>
                <div className="stat-info">
                  <h3>{dashboardStats.totalVehicles}</h3>
                  <p>Total Fleet</p>
                </div>
              </div>
              <div className="stat-card-premium">
                <div className="stat-icon-wrapper" style={{ background: '#ecfdf5', color: '#10b981' }}>⏳</div>
                <div className="stat-info">
                  <h3>{activeBookingsList.length}</h3>
                  <p>Active Rides</p>
                </div>
              </div>
              <div className="stat-card-premium">
                <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#f59e0b' }}>💰</div>
                <div className="stat-info">
                  <h3>₹{dashboardStats.revenue}</h3>
                  <p>Today's Revenue</p>
                </div>
              </div>
            </div>

            <div className="white-card-v2" style={{ ...inlineStyles.whiteCard, borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Ongoing Sessions</h3>
                <button onClick={() => navigate('/vendor-panel/bookings')} className="btn-premium" style={{ border: '1px solid #e2e8f0', background: 'white', color: '#6366f1', padding: '8px 16px', fontSize: '0.85rem' }}>
                  View All
                </button>
              </div>
              {activeBookingsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '3rem', opacity: 0.1, marginBottom: '16px' }}>📭</div>
                  <p style={{ color: '#64748b' }}>No active bookings at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeBookingsList.slice(0, 5).map(booking => (
                    <div key={booking._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.5)' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          {booking.vehicle_type === 'Bike' ? '🏍️' : '🛵'}
                        </div>
                        <div>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>{booking.vehicle_model}</span>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{booking.user_name} • #{booking._id?.slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                      <span className={`status-badge-v2 ${booking.status === 'active' ? 'badge-available' : 'badge-booked'}`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'vehicles':
        const startEditing = (vehicle) => {
          setEditingVehicle(vehicle);
          setVehicleForm({
            vehicle_type: vehicle.vehicle_type || '',
            model: vehicle.model || '',
            make: vehicle.make || '',
            license_plate: vehicle.license_plate || '',
            daily_rate: vehicle.daily_rate || '',
            hourly_rate: vehicle.hourly_rate || '',
            condtion: vehicle.condtion || '',
            location: vehicle.location || '',
            fuel_type: vehicle.fuel_type || 'Petrol',
            is_available: vehicle.is_available !== false
          });
          setShowAddVehicle(true);
        };
        return (
          <div className="dash-content-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', margin: 0 }}>My Vehicles</h2>
              <button onClick={() => setShowAddVehicle(!showAddVehicle)} className={`btn-premium ${showAddVehicle ? 'btn-danger' : 'btn-primary'}`}>
                {showAddVehicle ? '✕ Close' : '+ Add Vehicle'}
              </button>
            </div>

            {showAddVehicle && (
              <div style={{ ...inlineStyles.whiteCard, marginBottom: '32px', borderRadius: '24px', border: '1px solid #6366f1' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: '700' }}>{editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}</h3>
                <form onSubmit={handleAddVehicle}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Type</label>
                      <select value={vehicleForm.vehicle_type} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} required>
                        <option value="">Select</option>
                        <option value="Scooter">Scooter 🛵</option>
                        <option value="Bike">Bike 🏍️</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Model</label>
                      <input type="text" value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Make (Brand)</label>
                      <input type="text" value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} placeholder="e.g. Honda, Suzuki" required />
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Fuel Type</label>
                      <select value={vehicleForm.fuel_type} onChange={e => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }}>
                        <option value="Petrol">Petrol</option>
                        <option value="Electric">Electric</option>
                        <option value="Diesel">Diesel</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Condition</label>
                      <input type="text" value={vehicleForm.condtion} onChange={e => setVehicleForm({ ...vehicleForm, condtion: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} placeholder="e.g. Excellent, Good" />
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>License</label>
                      <input type="text" value={vehicleForm.license_plate} onChange={e => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Daily Rate (₹)</label>
                      <input type="number" value={vehicleForm.daily_rate} onChange={e => setVehicleForm({ ...vehicleForm, daily_rate: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} required />
                    </div>
                    <div className="form-group">
                      <label style={inlineStyles.formLabel}>Hourly Rate (₹)</label>
                      <input type="number" value={vehicleForm.hourly_rate} onChange={e => setVehicleForm({ ...vehicleForm, hourly_rate: e.target.value })} style={{ ...inlineStyles.formInput, borderRadius: '12px' }} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-premium btn-primary" style={{ marginTop: '24px' }}>
                    {loading ? '...' : (editingVehicle ? 'Update' : 'Save')}
                  </button>
                </form>
              </div>
            )}

            <div className="vehicle-grid">
              {vehicles.map(v => (
                <div key={v._id} className="vehicle-card-v2">
                  <span className={`status-badge-v2 ${v.is_available ? 'badge-available' : 'badge-booked'}`}>
                    {v.is_available ? 'Ready' : 'In Use'}
                  </span>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '2rem' }}>{v.vehicle_type === 'Bike' ? '🏍️' : '🛵'}</div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '700' }}>{v.model}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{v.license_plate}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#10b981' }}>₹{v.daily_rate}/day</span>
                      <span style={{ fontWeight: '600', color: '#6366f1', fontSize: '0.9rem' }}>₹{v.hourly_rate}/hr</span>
                    </div>
                    <button onClick={() => startEditing(v)} style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'right', marginTop: '4px' }}>Edit Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="dash-content-inner">
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '32px' }}>Orders</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {bookings.map(b => (
                <div key={b._id} className="white-card-v2" style={{ ...inlineStyles.whiteCard, borderRadius: '20px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                      {b.vehicle_type === 'Bike' ? '🏍️' : '🛵'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{b.vehicle_model}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{b.user_name} • {b.user_phone}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(b.start_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end', minWidth: '150px' }}>
                    <span className={`status-badge-v2 ${b.status === 'active' ? 'badge-available' : 'badge-booked'}`}>
                      {b.status}
                    </span>
                    {b.dl_image && (
                      <button 
                        onClick={() => window.open(b.dl_image.startsWith('http') ? b.dl_image : `${API_BASE_URL}${b.dl_image}`, '_blank')}
                        className="btn-premium" 
                        style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                        🪪 View DL
                      </button>
                    )}
                    {b.status === 'confirmed' && <button onClick={() => handleUpdateBookingStatus(b._id, 'active')} disabled={loading} className="btn-premium btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{loading ? '...' : 'Start'}</button>}
                    {b.status === 'active' && <button onClick={() => handleUpdateBookingStatus(b._id, 'completed')} disabled={loading} className="btn-premium btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{loading ? '...' : 'Stop'}</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'qr-scan':
        return (
          <div className="dash-content-inner">
            <div style={{ ...inlineStyles.whiteCard, borderRadius: '24px', textAlign: 'center', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📷</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>QR Scanner</h2>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Scan the user's booking QR code to start or stop a ride automatically.</p>
              <div style={{ borderRadius: '24px', overflow: 'hidden', border: '8px solid #f1f5f9' }}>
                <QRScanner />
              </div>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="dash-content-inner">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              <div style={{ ...inlineStyles.whiteCard, borderRadius: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '700' }}>Support Guide</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { q: 'How to start a ride?', a: 'Go to Bookings or Scan QR. Click "Start Ride" after verifying user documents.' },
                    { q: 'Manual termination?', a: 'If QR fails, use the "Stop" button in the active bookings list.' },
                    { q: 'Security deposit?', a: 'Collect 1 Original Govt ID (Aadhar/Voter) and verify DL.' }
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '700', color: '#1e293b' }}>{item.q}</p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...inlineStyles.whiteCard, borderRadius: '24px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: '700' }}>Contact Support</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '24px' }}>Need urgent assistance with a booking or technical issue?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>📞</span>
                    <span>+91 999 000 111</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>✉️</span>
                    <span>support@wheelsonrent.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderBillModal = () => {
    if (!billInfo) return null;
    return (
      <div className="modal-overlay" style={{ zIndex: 2000 }}>

        <div style={{ ...inlineStyles.whiteCard, width: '90%', maxWidth: '400px', padding: '0', overflow: 'hidden', borderRadius: '32px' }}>
          <div style={{ backgroundColor: '#6366f1', color: 'white', padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🧾</div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Ride Completed!</h3>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8 }}>Booking ID: {billInfo.bookingId.slice(-8).toUpperCase()}</p>
          </div>
          <div style={{ padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '16px' }}>
              <span style={{ color: '#64748b' }}>Ride Duration</span>
              <span style={{ fontWeight: '700', color: '#1e293b' }}>{billInfo.duration}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <span style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: '600' }}>Total Amount</span>
              <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#10b981' }}>₹{billInfo.amount}</span>
            </div>
            <button onClick={() => setBillInfo(null)} className="btn-premium btn-primary" style={{ width: '100%', padding: '16px' }}>
              Paid & Confirm
            </button>
          </div>
        </div>
      </div >
    );
  };

  return (
    <div className={`vendor-panel ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
        ></div>
      )}

      <aside className={`vendor-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>WHEELS ON RENT</h2>
        </div>
        <nav className="nav-menu">
          {menuItems.map(item => (
            <div key={item.id} className="nav-item">
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(`/vendor-panel/${item.id}`);
                }}
                className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-premium btn-danger" style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="vendor-main">
        <header className="vendor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="mobile-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>
            <h1>
              {activeTab === 'dashboard' && 'Success, ' + (user?.name || 'Vendor')}
              {activeTab === 'vehicles' && 'Vehicle Garage'}
              {activeTab === 'bookings' && 'Rental Orders'}
              {activeTab === 'qr-scan' && 'Scan & Go'}
              {activeTab === 'help' && 'Vendor Help'}
            </h1>
          </div>
          <div className="header-actions">
            <span style={{ color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
              ● Online
            </span>
          </div>
        </header>

        <section className="dash-content">
          {error && <div style={{ ...inlineStyles.errorBanner, margin: '0 0 24px 0' }}>{error}</div>}
          {success && <div style={{ ...inlineStyles.successBanner, margin: '0 0 24px 0' }}>{success}</div>}
          {renderContent()}
        </section>

        {renderBillModal()}
      </main>
    </div>
  );
};

const inlineStyles = {
  whiteCard: { backgroundColor: 'white', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)' },
  formLabel: { display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formInput: { width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', fontSize: '1rem', transition: 'all 0.3s ease' },
  errorBanner: { padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '16px', border: '1px solid #fee2e2', fontWeight: '500' },
  successBanner: { padding: '16px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '16px', border: '1px solid #dcfce7', fontWeight: '500' }
};

export default VendorPanel;