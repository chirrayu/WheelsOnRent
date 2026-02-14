import React, { useState } from 'react';
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
  const navigate = useNavigate();

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
      simulateUpload(fileType);
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
      [fileType]: 0
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dlNumber || !formData.idNumber || !files.dlFile || !files.idFile) {
      setError('Please fill all fields and upload both documents');
      return;
    }
    
    // In a real app, you would upload files to backend
    console.log('Form ', formData);
    console.log('Files:', files);
    
    setSuccess('Documents uploaded successfully! A QR code has been sent to your email for verification.');
    
    // Redirect after success message
    setTimeout(() => {
      navigate('/user-portal/dashboard');
    }, 3000);
  };

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
              required
            />
          </div>
          
          <div className="form-group">
            <label>Upload Driving License Document:</label>
            <div className="file-input-wrapper">
              <label className="file-input-label">
                {files.dlFile ? files.dlFile.name : 'Choose Driving License File'}
                <span>Supports JPG, PNG, PDF (Max 5MB)</span>
                <input
                  type="file"
                  className="file-input"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('dl', e)}
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
                    onClick={() => removeFile('dl')}
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
                <span>Supports JPG, PNG, PDF (Max 5MB)</span>
                <input
                  type="file"
                  className="file-input"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange('id', e)}
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
                    onClick={() => removeFile('id')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button type="submit" className="btn btn-primary">Submit Documents</button>
        </form>
      </div>
    </div>
  );
};

export default DLUpload;