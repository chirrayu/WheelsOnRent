import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../apiConfig';
import './Booking_History.css';

const Booking_History = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState({ open: false, qrCode: null, bookingId: '', loading: false });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings || []);
      } else {
        setError(data.error || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      });

      const data = await response.json();

      if (response.ok) {
        fetchBookings();
      } else {
        setError(data.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Cancel booking error:', err);
    }
  };

  const handleShowQR = async (bookingId) => {
    setQrModal({ open: true, qrCode: null, bookingId, loading: true });

    try {
      const response = await fetch(`${API_BASE_URL}/bookings/qr?booking_id=${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setQrModal({ open: true, qrCode: data.qr_code, bookingId, loading: false });
      } else {
        setQrModal({ open: true, qrCode: null, bookingId, loading: false });
        setError(data.error || 'Failed to load QR code');
      }
    } catch (err) {
      setQrModal({ open: true, qrCode: null, bookingId, loading: false });
      setError('Failed to load QR code');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#3b82f6';
      case 'active': return '#10b981';
      case 'Upcoming': return '#f59e0b';
      case 'completed': return '#6366f1';
      case 'cancelled': return '#ef4444';
      case 'pending_manual_verification': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'active': return '🚗';
      case 'Upcoming': return '⏳';
      case 'completed': return '🏁';
      case 'cancelled': return '❌';
      case 'pending_manual_verification': return '🔍';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Booking History</h2>
        <div style={styles.loading}>Loading bookings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Booking History</h2>

      {error && <div style={styles.error}>{error}</div>}

      {/* QR Code Modal */}
      {qrModal.open && (
        <div style={styles.modalOverlay} onClick={() => setQrModal({ open: false, qrCode: null, bookingId: '', loading: false })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Booking QR Code</h3>
              <button onClick={() => setQrModal({ open: false, qrCode: null, bookingId: '', loading: false })} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {qrModal.loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                  <p>Loading QR code...</p>
                </div>
              ) : qrModal.qrCode ? (
                <>
                  <img
                    src={`data:image/png;base64,${qrModal.qrCode}`}
                    alt="Booking QR Code"
                    style={styles.qrImage}
                  />
                  <p style={styles.qrHint}>Show this QR code to the vendor when you pick up the vehicle</p>
                  <p style={styles.qrBookingId}>Booking ID: #{qrModal.bookingId.slice(-8)}</p>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                  Failed to load QR code
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={styles.historyList}>
        {bookings.length === 0 ? (
          <div style={styles.noBookings}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
            <p>No booking history yet.</p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Browse available vehicles to make your first booking!
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} style={styles.bookingCard}>
              <div style={styles.bookingHeader}>
                <div>
                  <h3 style={styles.bookingTitle}>
                    {getStatusIcon(booking.status)} {booking.vehicle_model || 'Vehicle'} - {booking.vehicle_type || 'Unknown'}
                  </h3>
                  <p style={styles.bookingPlate}>
                    {booking.license_plate || 'N/A'}
                  </p>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(booking.status) + '20',
                  color: getStatusColor(booking.status)
                }}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                </span>
              </div>

              <div style={styles.bookingDetails}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>From</span>
                  <span>{booking.start_date || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>To</span>
                  <span>{booking.end_date || 'N/A'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Type</span>
                  <span>{booking.booking_type === 'hourly' ? 'Hourly' : 'Daily'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Rate</span>
                  <span>₹{booking.rate || 0}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={styles.actionRow}>
                {(booking.status === 'confirmed' || booking.status === 'active' || booking.status === 'Upcoming') && (
                  <button
                    onClick={() => handleShowQR(booking._id)}
                    style={styles.qrBtn}
                  >
                    📱 Show QR Code
                  </button>
                )}
                {(booking.status === 'confirmed' || booking.status === 'Upcoming') && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    style={styles.cancelBtn}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))
        )}
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
  title: {
    margin: '0 0 24px 0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontSize: '1rem'
  },
  error: {
    backgroundColor: '#fee',
    color: '#dc2626',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  noBookings: {
    textAlign: 'center',
    padding: '60px 40px',
    color: '#64748b',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  bookingTitle: {
    margin: '0 0 4px 0',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  bookingPlate: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.875rem'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  bookingDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    padding: '16px 0',
    borderTop: '1px solid #f1f5f9'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600'
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap'
  },
  qrBtn: {
    padding: '10px 20px',
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    border: '1px solid #c7d2fe',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  // QR Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px'
  },
  modalBody: {
    padding: '24px',
    textAlign: 'center'
  },
  qrImage: {
    width: '250px',
    height: '250px',
    margin: '0 auto 16px',
    display: 'block',
    borderRadius: '8px',
    border: '2px solid #e2e8f0'
  },
  qrHint: {
    color: '#64748b',
    fontSize: '0.875rem',
    margin: '0 0 8px 0'
  },
  qrBookingId: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    margin: 0,
    fontFamily: 'monospace'
  }
};

export default Booking_History;