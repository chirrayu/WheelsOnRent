import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DL_upload.css';

const DLUpload = () => {
  const [formData, setFormData] = useState({
    dlNumber: '',
    idNumber: ''
  });

  const [files, setFiles] = useState({
    dlFile: null,
    idFile: null
  });

  const [uploadProgress, setUploadProgress] = useState({
    dl: 0,
    id: 0
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [dlStatus, setDlStatus] = useState(null);
  const navigate = useNavigate();

  // Check existing DL status on mount
  useEffect(() => {
    fetchDlStatus();
  }, []);

  const fetchDlStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/dl/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setDlStatus(data);
      }
    } catch (err) {
      console.error('Error fetching DL status:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (fileType, e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type === 'application/pdf') {
        setError('Please upload an image or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setFiles({
        ...files,
        [fileType]: file
      });

      // Simulate upload progress
      simulateUpload(fileType === 'dlFile' ? 'dl' : 'id');
    }
  };

  const simulateUpload = (fileType) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(prev => ({
        ...prev,
        [fileType]: progress
      }));

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeFile = (fileType) => {
    setFiles({
      ...files,
      [fileType]: null
    });
    setUploadProgress({
      ...uploadProgress,
      [fileType === 'dlFile' ? 'dl' : 'id']: 0
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.dlNumber || !files.dlFile) {
      setError('Please enter your DL number and upload the DL document');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Upload DL document
      const dlFormData = new FormData();
      dlFormData.append('image', files.dlFile);
      dlFormData.append('dl_number', formData.dlNumber);

      const response = await fetch('http://localhost:5000/dl/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: dlFormData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Documents uploaded successfully! Verification is pending.');
        setDlStatus({ has_uploaded: true, status: 'pending', dl_number: formData.dlNumber });

        // Redirect after success message
        setTimeout(() => {
          navigate('/user-portal/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show status if already uploaded
  if (dlStatus && dlStatus.has_uploaded) {
    return (
      <div className="dl-upload-page">
        <div className="dl-upload-container">
          <h2>Document Status</h2>
          <div style={{
            padding: '24px',
            backgroundColor: dlStatus.status === 'verified' ? '#ecfdf5' : '#fffbeb',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
              {dlStatus.status === 'verified' ? '✅' : dlStatus.status === 'rejected' ? '❌' : '⏳'}
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
              {dlStatus.status === 'verified' ? 'Verified' : dlStatus.status === 'rejected' ? 'Rejected' : 'Pending Verification'}
            </h3>
            <p style={{ color: '#64748b', margin: '0 0 8px 0' }}>DL Number: {dlStatus.dl_number}</p>
            <p style={{ color: '#64748b', margin: 0 }}>Uploaded: {dlStatus.uploaded_at ? new Date(dlStatus.uploaded_at).toLocaleDateString() : 'N/A'}</p>
          </div>
          <button
            onClick={() => navigate('/user-portal/dashboard')}
            className="btn btn-primary"
            style={{ marginTop: '20px', width: '100%', padding: '12px', cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dl-upload-page">
      <div className="dl-upload-container">
        <h2>Document Upload</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="dl-upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dlNumber">Driving License Number:</label>
            <input
              type="text"
              id="dlNumber"
              name="dlNumber"
              className="form-control"
              value={formData.dlNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idNumber">ID Card Number:</label>
            <input
              type="text"
              id="idNumber"
              name="idNumber"
              className="form-control"
              value={formData.idNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Upload Driving License Document:</label>
            <div className="file-input-wrapper">
              <label className="file-input-label">
                {files.dlFile ? files.dlFile.name : 'Choose Driving License File'}
                <span>Supports JPG, PNG (Max 5MB)</span>
                <input
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={(e) => handleFileChange('dlFile', e)}
                />
              </label>
            </div>
            {uploadProgress.dl > 0 && (
              <div className="progress-bar">
                Upload Progress: {uploadProgress.dl}%
              </div>
            )}
            {files.dlFile && (
              <div className="uploaded-files">
                <div className="uploaded-file">
                  <span>{files.dlFile.name}</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={() => removeFile('dlFile')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Upload ID Card Document:</label>
            <div className="file-input-wrapper">
              <label className="file-input-label">
                {files.idFile ? files.idFile.name : 'Choose ID Card File'}
                <span>Supports JPG, PNG (Max 5MB)</span>
                <input
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={(e) => handleFileChange('idFile', e)}
                />
              </label>
            </div>
            {uploadProgress.id > 0 && (
              <div className="progress-bar">
                Upload Progress: {uploadProgress.id}%
              </div>
            )}
            {files.idFile && (
              <div className="uploaded-files">
                <div className="uploaded-file">
                  <span>{files.idFile.name}</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={() => removeFile('idFile')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Submit Documents'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DLUpload;