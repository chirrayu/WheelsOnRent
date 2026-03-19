import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import './DLUploadWidget.css';

/**
 * DLUploadWidget Component
 * Handles Real-time Indian DL Upload and Verification with OCR feedback.
 */
const DLUploadWidget = ({ onVerificationComplete }) => {
    const [status, setStatus] = useState('idle'); // idle | uploading | verifying | success | error
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset state
        setStatus('uploading');
        setProgress(0);
        setErrorMsg('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            // 1. Upload Phase (with progress tracking)
            const response = await axios.post(`${API_BASE_URL}/dl/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                    if (percentCompleted === 100) {
                        setStatus('verifying'); // Switch to OCR analysis state
                    }
                }
            });

            // 2. OCR and Validation Success
            const data = response.data;
            if (data.status === 'verified') {
                setStatus('success');
                setExtractedData(data.extracted_data);
                if (onVerificationComplete) onVerificationComplete(true, data.extracted_data);
            } else {
                // If status is 'pending' or 'flagged', consider it a partial success/manual review
                // NEW: Specifically check if it's an 'Invalid Document' vs just 'Flagged for review'
                const isInvalid = data.validation_message && data.validation_message.includes("Invalid document");
                
                if (isInvalid) {
                    setStatus('error');
                    setErrorMsg(data.validation_message);
                    window.alert("❌ INVALID DOCUMENT\n\n" + data.validation_message);
                    if (onVerificationComplete) onVerificationComplete(false, null);
                } else {
                    setStatus('success');
                    setExtractedData({
                        ...data.extracted_data,
                        isFlagged: true,
                        msg: data.validation_message
                    });
                    if (onVerificationComplete) onVerificationComplete(true, data.extracted_data);
                }
            }

        } catch (err) {
            console.error('DL Upload Error:', err);
            setStatus('error');
            setErrorMsg(err.response?.data?.error || 'Verification failed. Please try again with a clearer image.');
            if (onVerificationComplete) onVerificationComplete(false, null);
        }
    };

    return (
        <div className="dl-upload-container">
            <div className="dl-header">
                <h3>Driver's License Verification</h3>
                <p>Upload a clear photo or a <strong>DigiLocker PDF</strong> for instant verification.</p>
                <div className="digilocker-tip">
                    <span className="tip-icon">💡</span>
                    <span>Tip: DigiLocker PDFs are verified with 100% accuracy.</span>
                </div>
            </div>

            {status === 'idle' && (
                <div className="upload-zone" onClick={() => document.getElementById('dl-file-input').click()}>
                    <span className="upload-icon">📄</span>
                    <p>Click to browse or drag and drop</p>
                    <p style={{fontSize: '0.8rem', color: '#888', marginTop: '-10px'}}>Supported: JPG, PNG, PDF</p>
                    <button className="upload-button">Select Document</button>
                    <input 
                        id="dl-file-input"
                        type="file" 
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {/* ... other states ... */}

            {status === 'success' && (
                <div className="status-screen">
                    {extractedData?.isFlagged ? (
                        <div className="warning-icon" style={{ fontSize: '3rem', color: '#fbbc05', marginBottom: '10px' }}>⚠️</div>
                    ) : (
                        <div className="success-icon">✅</div>
                    )}
                    
                    <p className="status-text" style={{ color: extractedData?.isFlagged ? '#fbbc05' : '#34a853' }}>
                        {extractedData?.isFlagged ? 'Under Manual Review' : 'Processing Complete'}
                    </p>
                    
                    {extractedData && (
                        <div className="extracted-details" style={{ 
                            borderLeftColor: extractedData.isFlagged ? '#fbbc05' : '#34a853',
                            background: extractedData.isFlagged ? 'rgba(251, 188, 5, 0.05)' : 'rgba(52, 168, 83, 0.1)'
                        }}>
                            {!extractedData.isFlagged ? (
                                <div className="detail-row">
                                    <span className="detail-label">DL Number</span>
                                    <span className="detail-value">{extractedData.dl_number}</span>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: '#ccc', margin: '0 0 10px 0' }}>
                                        {extractedData.msg || "The system couldn't automatically verify your image."}
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
                                        <strong>Try uploading a DigiLocker PDF</strong> for instant approval.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <button className="retry-btn" onClick={() => setStatus('idle')}>Upload Different</button>
                    {extractedData?.isFlagged && (
                         <p style={{fontSize: '0.8rem', color: '#888', marginTop: '15px'}}>
                            You can still proceed; we will verify this before your trip starts.
                         </p>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className="status-screen">
                    <div className="error-icon">❌</div>
                    <p className="status-text" style={{ color: '#ea4335' }}>Verification Error</p>
                    <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '5px' }}>{errorMsg}</p>
                    <div style={{ margin: '15px 0', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#888' }}>
                            Images can be hard to read. Try using a <strong>DigiLocker PDF</strong> for better results.
                        </p>
                    </div>
                    <button className="retry-btn" onClick={() => setStatus('idle')}>Try Again</button>
                </div>
            )}
        </div>
    );
};

export default DLUploadWidget;
