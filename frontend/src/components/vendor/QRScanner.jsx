import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import API_BASE_URL from '../../apiConfig';

const QRScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const scannerRef = useRef(null);
    const html5ScannerRef = useRef(null);

    // Manual entry fallback
    const [manualInput, setManualInput] = useState('');
    const [showManual, setShowManual] = useState(false);

    const startScanner = () => {
        setScanResult(null);
        setBookingDetails(null);
        setError('');
        setSuccess('');
        setScannerActive(true);

        // Small delay for DOM render
        setTimeout(() => {
            if (html5ScannerRef.current) {
                html5ScannerRef.current.clear();
            }

            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
                    rememberLastUsedCamera: true,
                },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
            html5ScannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (html5ScannerRef.current) {
            html5ScannerRef.current.clear().catch(err => console.log('Scanner clear error:', err));
            html5ScannerRef.current = null;
        }
        setScannerActive(false);
    };

    useEffect(() => {
        return () => {
            if (html5ScannerRef.current) {
                html5ScannerRef.current.clear().catch(() => { });
            }
        };
    }, []);

    const onScanSuccess = (decodedText) => {
        setScanResult(decodedText);
        stopScanner();
        verifyQR(decodedText);
    };

    const onScanFailure = (errorMessage) => {
        // Ignore scan failures (they happen every frame when no QR is visible)
    };

    const handleManualSubmit = () => {
        if (!manualInput.trim()) {
            setError('Please paste the QR data');
            return;
        }
        setScanResult(manualInput.trim());
        verifyQR(manualInput.trim());
        setShowManual(false);
    };

    const verifyQR = async (qrData) => {
        setLoading(true);
        setError('');
        setSuccess('');
        setBookingDetails(null);

        try {
            const response = await fetch(`${API_BASE_URL}/vendor/qr/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ qr_data: qrData })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                setBookingDetails(data.booking);
            } else {
                setError(data.error || 'Invalid QR code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('QR verify error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        const confirmMsg = newStatus === 'active'
            ? 'Start the ride? The user will pick up the vehicle.'
            : 'Complete the ride? The vehicle will be returned.';

        if (!window.confirm(confirmMsg)) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/vendor/ride/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ booking_id: bookingId, status: newStatus })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                // Update local state
                setBookingDetails(prev => ({ ...prev, status: newStatus }));
            } else {
                setError(data.error || 'Failed to update status');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setBookingDetails(null);
        setError('');
        setSuccess('');
        setManualInput('');
    };

    const getStatusStyle = (status) => {
        const map = {
            confirmed: { bg: '#dbeafe', color: '#2563eb', label: 'Confirmed' },
            active: { bg: '#dcfce7', color: '#16a34a', label: 'Active (In Ride)' },
            completed: { bg: '#ede9fe', color: '#7c3aed', label: 'Completed' },
            cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
        };
        return map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    };

    return (
        <div>
            {error && (
                <div style={s.errorBanner}>
                    <span>⚠️</span> {error}
                </div>
            )}
            {success && (
                <div style={s.successBanner}>
                    <span>✅</span> {success}
                </div>
            )}

            {/* No booking scanned yet — show scanner controls */}
            {!bookingDetails && !scanResult && (
                <div style={{ textAlign: 'center' }}>
                    <div style={s.card}>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📷</div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.25rem' }}>
                            QR Code Scanner
                        </h3>
                        <p style={{ color: '#64748b', margin: '0 0 24px 0', fontSize: '0.9rem' }}>
                            Scan the customer's QR code to verify their booking and manage the ride.
                        </p>

                        {!scannerActive ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                                <button onClick={startScanner} style={s.primaryBtn}>
                                    🎥 Open Camera Scanner
                                </button>
                                <button onClick={() => setShowManual(!showManual)} style={s.secondaryBtn}>
                                    ⌨️ Enter QR Data Manually
                                </button>
                            </div>
                        ) : (
                            <button onClick={stopScanner} style={s.dangerBtn}>
                                ⏹ Stop Scanner
                            </button>
                        )}
                    </div>

                    {/* Camera Scanner Area */}
                    {scannerActive && (
                        <div style={s.card}>
                            <div id="qr-reader" ref={scannerRef} style={{ width: '100%' }}></div>
                            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '12px' }}>
                                Point your camera at the customer's QR code
                            </p>
                        </div>
                    )}

                    {/* Manual Input */}
                    {showManual && (
                        <div style={s.card}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Manual QR Data Entry</h4>
                            <textarea
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                placeholder='Paste QR data JSON here...'
                                style={s.textarea}
                                rows={4}
                            />
                            <button onClick={handleManualSubmit} style={{ ...s.primaryBtn, marginTop: '12px' }} disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && !bookingDetails && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⏳</div>
                    <p>Verifying booking...</p>
                </div>
            )}

            {/* Booking Details */}
            {bookingDetails && (
                <div>
                    <div style={s.card}>
                        {/* Status Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>
                                ✅ Booking Verified
                            </h3>
                            <span style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                backgroundColor: getStatusStyle(bookingDetails.status).bg,
                                color: getStatusStyle(bookingDetails.status).color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {getStatusStyle(bookingDetails.status).label}
                            </span>
                        </div>

                        {/* Customer Info */}
                        <div style={s.detailSection}>
                            <h4 style={s.sectionLabel}>Customer Details</h4>
                            <div style={s.detailGrid}>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>👤 Name</span>
                                    <span style={s.detailValue}>{bookingDetails.user_name}</span>
                                </div>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>📞 Phone</span>
                                    <span style={s.detailValue}>{bookingDetails.user_phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div style={s.detailSection}>
                            <h4 style={s.sectionLabel}>Vehicle Details</h4>
                            <div style={s.detailGrid}>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>🚗 Vehicle</span>
                                    <span style={s.detailValue}>{bookingDetails.vehicle_model} ({bookingDetails.vehicle_type})</span>
                                </div>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>🔖 Plate</span>
                                    <span style={s.detailValue}>{bookingDetails.license_plate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Info */}
                        <div style={s.detailSection}>
                            <h4 style={s.sectionLabel}>Booking Details</h4>
                            <div style={s.detailGrid}>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>📅 From</span>
                                    <span style={s.detailValue}>{bookingDetails.start_date}</span>
                                </div>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>📅 To</span>
                                    <span style={s.detailValue}>{bookingDetails.end_date}</span>
                                </div>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>⏱ Type</span>
                                    <span style={s.detailValue}>{bookingDetails.booking_type === 'hourly' ? 'Hourly' : 'Daily'}</span>
                                </div>
                                <div style={s.detailItem}>
                                    <span style={s.detailKey}>💰 Rate</span>
                                    <span style={s.detailValue}>₹{bookingDetails.rate}</span>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: '16px 0 0 0', fontFamily: 'monospace' }}>
                            Booking ID: #{bookingDetails.booking_id.slice(-8)}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div style={s.card}>
                        <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Actions</h4>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {bookingDetails.status === 'confirmed' && (
                                <button
                                    onClick={() => handleUpdateStatus(bookingDetails.booking_id, 'active')}
                                    style={s.startBtn}
                                    disabled={loading}
                                >
                                    🚀 {loading ? 'Starting...' : 'Start Ride'}
                                </button>
                            )}
                            {bookingDetails.status === 'active' && (
                                <button
                                    onClick={() => handleUpdateStatus(bookingDetails.booking_id, 'completed')}
                                    style={s.completeBtn}
                                    disabled={loading}
                                >
                                    🏁 {loading ? 'Completing...' : 'Complete Ride'}
                                </button>
                            )}
                            {bookingDetails.status === 'completed' && (
                                <div style={{ padding: '16px', backgroundColor: '#ede9fe', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🎉</span>
                                    <p style={{ margin: '8px 0 0 0', color: '#7c3aed', fontWeight: '600' }}>Ride completed successfully!</p>
                                </div>
                            )}
                            {bookingDetails.status === 'cancelled' && (
                                <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>❌</span>
                                    <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontWeight: '600' }}>Booking cancelled</p>
                                </div>
                            )}
                            <button onClick={resetScanner} style={s.secondaryBtn}>
                                📷 Scan Another
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const s = {
    card: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
    },
    primaryBtn: {
        padding: '14px 28px',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '200px'
    },
    secondaryBtn: {
        padding: '12px 24px',
        backgroundColor: '#f1f5f9',
        color: '#475569',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '500',
        cursor: 'pointer'
    },
    dangerBtn: {
        padding: '14px 28px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer'
    },
    startBtn: {
        padding: '14px 28px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        flex: 1
    },
    completeBtn: {
        padding: '14px 28px',
        backgroundColor: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        flex: 1
    },
    errorBanner: {
        padding: '14px 20px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        borderRadius: '10px',
        marginBottom: '16px',
        border: '1px solid #fecaca',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    successBanner: {
        padding: '14px 20px',
        backgroundColor: '#ecfdf5',
        color: '#059669',
        borderRadius: '10px',
        marginBottom: '16px',
        border: '1px solid #a7f3d0',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        resize: 'vertical',
        boxSizing: 'border-box'
    },
    detailSection: {
        padding: '16px 0',
        borderBottom: '1px solid #f1f5f9'
    },
    sectionLabel: {
        margin: '0 0 12px 0',
        fontSize: '0.8rem',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: '700'
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
    },
    detailItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    detailKey: {
        fontSize: '0.8rem',
        color: '#64748b'
    },
    detailValue: {
        fontSize: '1rem',
        color: '#1e293b',
        fontWeight: '600'
    }
};

export default QRScanner;
