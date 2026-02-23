import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../apiConfig';
import './Vendors.css';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [vendorVehicles, setVendorVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Error Popup State
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [bookingData, setBookingData] = useState({
    vehicleId: '',
    vehicleType: '', // 'Scooter' or 'Bike'
    bookingType: 'daily',
    dlFile: null,
    agreedToTerms: false
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendor && showModal) {
      fetchVendorVehicles(selectedVendor._id);
    }
  }, [selectedVendor, showModal]);

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) setVendors(data.vendors || []);
      else setError(data.error || 'Failed to fetch vendors');
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorVehicles = async (vendorId) => {
    setLoadingVehicles(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/vendor/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log(`DEBUG: Fetched ${data.count} vehicles for vendor ${vendorId}`, data.vehicles);
      if (response.ok) setVendorVehicles(data.vehicles || []);
    } catch (err) {
      console.error("Error fetching vehicles", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleBookClick = (vendor) => {
    setSelectedVendor(vendor);
    setStep(1);
    setBookingData({
      vehicleId: '',
      vehicleType: '',
      bookingType: 'daily',
      dlFile: null,
      agreedToTerms: false
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVendor(null);
  };

  const handleCreateBooking = async () => {
    if (!bookingData.agreedToTerms) {
      alert("Please agree to the terms and conditions.");
      return;
    }

    // RANDOM ASSIGNMENT LOGIC
    // Filter vehicles by the selected type
    const availableVehicles = vendorVehicles.filter(v => {
      if (!v.vehicle_type) return false;
      const type = v.vehicle_type.toLowerCase();
      const target = bookingData.vehicleType.toLowerCase();
      if (target === 'scooter') {
        return type === 'scooter' || type === 'scooty';
      }
      return type === target;
    });

    if (availableVehicles.length === 0) {
      alert(`Sorry, no ${bookingData.vehicleType}s are currently available.`);
      return;
    }

    // Pick a random vehicle
    const randomIndex = Math.floor(Math.random() * availableVehicles.length);
    const assignedVehicle = availableVehicles[randomIndex];

    try {
      // Start date is now, end date is TBD (calculated on return)
      const now = new Date().toISOString();

      // Use FormData to send DL file along with booking details
      const formData = new FormData();
      formData.append('vehicle_id', assignedVehicle._id);
      formData.append('start_date', now);
      formData.append('end_date', '');
      formData.append('booking_type', bookingData.bookingType);
      if (bookingData.dlFile) {
        formData.append('dl_file', bookingData.dlFile);
      }

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        alert("Booking confirmed! Please visit the vendor to scan QR and start your ride.");
        handleCloseModal();
      } else {
        setErrorMessage(data.error || "Failed to create booking.");
        setShowErrorPopup(true);
      }
    } catch (err) {
      setErrorMessage("Network error occurred.");
      setShowErrorPopup(true);
    }
  };

  const renderModalContent = () => {
    switch (step) {
      case 1: // Vehicle Type Selection
        // Calculate availability and price ranges
        const isScooter = (type) => type && (type.toLowerCase() === 'scooter' || type.toLowerCase() === 'scooty');
        const isBike = (type) => type && type.toLowerCase() === 'bike';

        const scooters = vendorVehicles.filter(v => isScooter(v.vehicle_type));
        const bikes = vendorVehicles.filter(v => isBike(v.vehicle_type));

        const getPriceRange = (vehicles, type) => {
          if (vehicles.length === 0) return 'N/A';
          const rateKey = type === 'daily' ? 'daily_rate' : 'hourly_rate';
          const rates = vehicles.map(v => v[rateKey] || 0);
          const max = Math.max(...rates);
          return `₹${max}`;
        };

        return (
          <div style={styles.stepContainer}>
            <h3>Select Vehicle Type</h3>
            <p style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
              Select whether you want a Scooter or a Bike. You will be assigned a vehicle randomly upon booking.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '12px', fontSize: '1rem', color: '#1e293b' }}>Booking Rate Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{ ...styles.typeBtn, padding: '12px', backgroundColor: bookingData.bookingType === 'daily' ? '#6366f1' : '#f1f5f9', color: bookingData.bookingType === 'daily' ? 'white' : '#64748b' }}
                  onClick={() => setBookingData({ ...bookingData, bookingType: 'daily' })}
                >
                  Daily Rate
                </button>
                <button
                  style={{ ...styles.typeBtn, padding: '12px', backgroundColor: bookingData.bookingType === 'hourly' ? '#6366f1' : '#f1f5f9', color: bookingData.bookingType === 'hourly' ? 'white' : '#64748b' }}
                  onClick={() => setBookingData({ ...bookingData, bookingType: 'hourly' })}
                >
                  Hourly Rate
                </button>
              </div>
            </div>

            {loadingVehicles ? <p>Loading vendors...</p> : (
              <div style={styles.modalGrid} className="modal-scrollbar-refined">
                <div
                  className={bookingData.vehicleType === 'Scooter' ? 'vehicle-card-selected' : ''}
                  style={{
                    ...styles.vehicleOption,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    borderColor: bookingData.vehicleType === 'Scooter' ? '#6366f1' : '#e2e8f0',
                    backgroundColor: bookingData.vehicleType === 'Scooter' ? '#eef2ff' : 'white',
                    opacity: scooters.length === 0 ? 0.6 : 1,
                    cursor: scooters.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => scooters.length > 0 && setBookingData({ ...bookingData, vehicleType: 'Scooter' })}
                >
                  <div style={{ fontSize: '2.5rem' }}>🛵</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Scooter</h4>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Available: {scooters.length}</p>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: bookingData.bookingType === 'hourly' ? '600' : '400', color: bookingData.bookingType === 'hourly' ? '#6366f1' : '#94a3b8' }}>
                        {getPriceRange(scooters, 'hourly')} / hr
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: bookingData.bookingType === 'daily' ? '600' : '400', color: bookingData.bookingType === 'daily' ? '#6366f1' : '#94a3b8' }}>
                        {getPriceRange(scooters, 'daily')} / day
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={bookingData.vehicleType === 'Bike' ? 'vehicle-card-selected' : ''}
                  style={{
                    ...styles.vehicleOption,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    borderColor: bookingData.vehicleType === 'Bike' ? '#6366f1' : '#e2e8f0',
                    backgroundColor: bookingData.vehicleType === 'Bike' ? '#eef2ff' : 'white',
                    opacity: bikes.length === 0 ? 0.6 : 1,
                    cursor: bikes.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => bikes.length > 0 && setBookingData({ ...bookingData, vehicleType: 'Bike' })}
                >
                  <div style={{ fontSize: '2.5rem' }}>🏍️</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Bike</h4>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Available: {bikes.length}</p>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: bookingData.bookingType === 'hourly' ? '600' : '400', color: bookingData.bookingType === 'hourly' ? '#6366f1' : '#94a3b8' }}>
                        {getPriceRange(bikes, 'hourly')} / hr
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: bookingData.bookingType === 'daily' ? '600' : '400', color: bookingData.bookingType === 'daily' ? '#6366f1' : '#94a3b8' }}>
                        {getPriceRange(bikes, 'daily')} / day
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ ...styles.modalActions, justifyContent: 'flex-start' }}>
              <button disabled={!bookingData.vehicleType} onClick={() => setStep(2)} style={{ ...styles.nextBtn, width: '120px' }}>Next</button>
            </div>
          </div>
        );
      case 2: // DL Upload
        return (
          <div style={styles.stepContainer}>
            <h3>Upload Driving License</h3>
            <div style={styles.formGroup}>
              <label>Upload DL Image</label>
              <input type="file" onChange={e => setBookingData({ ...bookingData, dlFile: e.target.files[0] })} style={styles.input} />
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Please upload a clear image of your valid Driving License.</p>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setStep(1)} style={styles.backBtn}>Back</button>
              <button disabled={!bookingData.dlFile} onClick={() => setStep(3)} style={styles.nextBtn}>Next</button>
            </div>
          </div>
        );
      case 3: // NOC
        return (
          <div style={styles.stepContainer}>
            <h3>Terms & Conditions (NOC)</h3>
            <div style={styles.nocBox}>
              <p>I hereby declare that:</p>
              <ul>
                <li>I am having a valid Driving Licence.</li>
                <li>I am liable to pay for any damage, challan of the vehicle.</li>
                <li>No amount will be adjusted against remaining petrol in the vehicle.</li>
                <li>Changed helmet will not be accepted, in case of loss or damage of helmet, cost will be charged @ RS 1000/-</li>
                <li><strong>Billing will be calculated based on actual start and end time of the trip.</strong></li>
              </ul>
            </div>
            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="noc-agree"
                checked={bookingData.agreedToTerms}
                onChange={e => setBookingData({ ...bookingData, agreedToTerms: e.target.checked })}
              />
              <label htmlFor="noc-agree">I agree to the terms and conditions</label>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setStep(2)} style={styles.backBtn}>Back</button>
              <button disabled={!bookingData.agreedToTerms} onClick={handleCreateBooking} style={styles.confirmBtn}>Confirm Booking</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderErrorPopup = () => {
    if (!showErrorPopup) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={{ ...styles.modalContent, textAlign: 'center', borderTop: '4px solid #ef4444' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>Booking Restriction</h3>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.5', marginBottom: '24px' }}>
            {errorMessage}
          </p>
          <button
            onClick={() => setShowErrorPopup(false)}
            style={{ ...styles.confirmBtn, backgroundColor: '#64748b', width: '100%' }}
          >
            I Understand
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div style={styles.container}><div style={styles.loading}>Loading vendors...</div></div>;
  if (error) return <div style={styles.container}><div style={styles.error}>{error}</div></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Available Vendors</h2>
      {vendors.length === 0 ? (
        <div style={styles.noVendors}><p>No vendors available at the moment.</p></div>
      ) : (
        <div style={styles.vendorsGrid}>
          {vendors.map((vendor) => (
            <div key={vendor._id} style={styles.vendorCard}>
              <div style={styles.vendorInfo}>
                <h3 style={styles.vendorName}>{vendor.name}</h3>
                <p style={styles.vendorType}>Vendor</p>
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>📍 {vendor.location_id || 'Location not specified'}</p>
                </div>
              </div>
              <button onClick={() => handleBookClick(vendor)} style={styles.bookBtn}>Book Now</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={handleCloseModal} style={styles.closeModalBtn}>×</button>
            <div className="custom-modal-grid-container">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}

      {renderErrorPopup()}
    </div>
  );
};

const styles = {
  container: { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' },
  title: { margin: '0 0 24px 0', fontSize: '1.75rem', fontWeight: '600', color: '#1e293b' },
  loading: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '1rem' },
  error: { backgroundColor: '#fee', color: '#dc2626', padding: '16px', borderRadius: '8px', textAlign: 'center' },
  noVendors: { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '1rem' },
  vendorsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  vendorCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' },
  vendorInfo: { flex: 1 },
  vendorName: { margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' },
  vendorType: { margin: '0', color: '#64748b', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  bookBtn: { width: '100%', padding: '10px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },

  // Modal Styles
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' },
  modalContent: { backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '550px', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  closeModalBtn: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' },
  stepContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  modalGrid: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' },
  vehicleOption: { padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #ccc' },
  modalActions: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  nextBtn: { padding: '12px 24px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' },
  backBtn: { padding: '10px 20px', backgroundColor: '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  confirmBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  nocBox: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.9rem', lineHeight: '1.5' },
  checkboxContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  typeBtn: { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }
};

export default Vendors;