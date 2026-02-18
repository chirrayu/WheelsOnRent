import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

const AddVendor = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '', confirmPassword: '', phone: '', location_id: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Enhanced Validation
    const { name, email, username, password, confirmPassword, phone, location_id } = formData;

    if (!name.trim() || !email.trim() || !username.trim() || !password) {
      return setError('All required fields must be filled');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      // Use API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/team/add-vendor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
          phone: phone.trim(),
          location_id: location_id.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Vendor added successfully!');
        setFormData({ name: '', email: '', username: '', password: '', confirmPassword: '', phone: '', location_id: '' });
      } else {
        setError(data.error || `Failed to add vendor. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check if the backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Add New Vendor</h2>

        {error && <div style={styles.errorBanner}>{error}</div>}
        {success && <div style={styles.successBanner}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Vendor Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mobile Number *</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Address / Location ID *</label>
            <input type="text" name="location_id" value={formData.location_id} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.buttonGroup}>
            <button type="button" onClick={() => navigate('/team-panel')} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={loading ? styles.disabledBtn : styles.submitBtn}>
              {loading ? 'Adding...' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles object to keep the component clean
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0', padding: '20px' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '500px' },
  title: { textAlign: 'center', marginBottom: '20px' },
  errorBanner: { padding: '10px', backgroundColor: '#fee', color: '#c33', borderRadius: '4px', marginBottom: '15px' },
  successBanner: { padding: '10px', backgroundColor: '#efe', color: '#3c3', borderRadius: '4px', marginBottom: '15px' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  disabledBtn: { flex: 1, padding: '12px', backgroundColor: '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }
};

export default AddVendor;