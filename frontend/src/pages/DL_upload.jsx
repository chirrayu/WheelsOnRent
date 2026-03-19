import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import DLUploadWidget from '../components/common/DLUploadWidget';
import './DL_upload.css';

const DLUpload = () => {
    const [dlStatus, setDlStatus] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDlStatus();
    }, []);

    const fetchDlStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/dl/status`, {
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

    const handleVerificationComplete = (success, data) => {
        if (success) {
            // Refresh status from server to get full details
            fetchDlStatus();
            
            // Redirect after a short delay to show success state
            setTimeout(() => {
                navigate('/user-portal/dashboard');
            }, 3000);
        } else {
            setError('Verification failed. Please try again with a clearer image.');
        }
    };

    return (
        <div className="dl-upload-page" style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '20px'
        }}>
            <div className="dl-upload-container" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#fff', 
                    marginBottom: '30px',
                    fontSize: '2rem',
                    fontWeight: '700'
                }}>
                    Identity Verification
                </h2>

                {dlStatus && dlStatus.has_uploaded ? (
                    <div className="status-display" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        padding: '30px',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#fff'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                            {dlStatus.status === 'verified' ? '✅' : dlStatus.status === 'rejected' ? '❌' : '⏳'}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                            {dlStatus.status === 'verified' ? 'verified' : dlStatus.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                        </h3>
                        <div style={{ color: '#aaa', marginBottom: '25px' }}>
                            <p><b>DL Number:</b> {dlStatus.dl_number}</p>
                            <p><b>Status:</b> {dlStatus.validation_message || 'Under manual review'}</p>
                        </div>
                        
                        {dlStatus.status !== 'verified' && (
                            <button 
                                onClick={() => setDlStatus(null)} 
                                className="btn btn-outline"
                                style={{ 
                                    padding: '10px 25px', 
                                    borderRadius: '10px', 
                                    border: '1px solid #4285f4',
                                    color: '#4285f4',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                Re-upload Documents
                            </button>
                        )}
                        
                        <button
                            onClick={() => navigate('/user-portal/dashboard')}
                            className="btn btn-primary"
                            style={{ 
                                marginTop: '15px', 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '10px',
                                background: '#4285f4',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <DLUploadWidget onVerificationComplete={handleVerificationComplete} />
                )}

                {error && (
                    <div className="alert alert-error" style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        borderRadius: '10px', 
                        backgroundColor: 'rgba(234, 67, 53, 0.1)',
                        color: '#ea4335',
                        textAlign: 'center',
                        border: '1px solid rgba(234, 67, 53, 0.2)'
                    }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DLUpload;
pload;