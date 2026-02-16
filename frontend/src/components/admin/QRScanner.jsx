import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      if (scanning) {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
              // Handle success
              setResult(decodedText);
              setScanning(false);
            },
            (errorMessage) => {
              // parse error, ignore
            }
          );
        } catch (err) {
          setError('Camera access denied or error starting scanner. Please ensure camera permissions are granted.');
          console.error('Camera error:', err);
          setScanning(false);
        }
      }
    };

    if (scanning) {
      // Small timeout to ensure DOM element exists
      setTimeout(startScanner, 100);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch(err => {
          console.error("Failed to stop scanner", err);
        });
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const handleScan = () => {
    setResult('');
    setError('');
    setScanning(true);
  };

  const handleCancel = () => {
    setScanning(false);
    setResult('');
    setError('');
  };

  const handleProcessResult = () => {
    if (!result) return;

    // Check if result is a simple ID or prefixed
    // Sometimes QR codes might just be the ID

    if (result.startsWith('VEHICLE_ID:')) {
      navigate(`/vendor-panel/vehicle/${result.split(':')[1]}`);
    } else if (result.startsWith('BOOKING_ID:')) {
      navigate(`/vendor-panel/booking/${result.split(':')[1]}`);
    } else if (result.startsWith('CUSTOMER_ID:')) {
      navigate(`/vendor-panel/customer/${result.split(':')[1]}`);
    } else if (result.startsWith('LOCATION_ID:')) {
      navigate(`/vendor-panel/location/${result.split(':')[1]}`);
    } else {
      // Try to handle raw UUIDs if possible, or show error
      // For now, assume it's one of the above or valid elsewhere
      console.log("Scanned:", result);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>QR Scanner</h2>
        <button onClick={handleGoBack} style={styles.closeBtn}>×</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.scannerContainer}>
        {!scanning && !result && (
          <div style={styles.placeholder}>
            <div style={styles.qrIcon}>📱</div>
            <p style={styles.placeholderText}>Point your camera at a QR code to scan</p>
          </div>
        )}

        {scanning && (
          <div style={styles.cameraView}>
            <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>
            <div style={styles.scanOverlay}>
              <p style={styles.scanInstruction}>Position QR code in frame</p>
            </div>
          </div>
        )}

        {result && (
          <div style={styles.resultContainer}>
            <div style={styles.resultIcon}>✓</div>
            <h3 style={styles.resultTitle}>QR Code Scanned!</h3>
            <p style={styles.resultValue}>{result}</p>
          </div>
        )}
      </div>

      <div style={styles.controls}>
        {!scanning && !result && (
          <button onClick={handleScan} style={styles.scanBtn}>
            Start Scan
          </button>
        )}

        {scanning && (
          <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
            Scanning...
          </div>
        )}

        {result && (
          <div style={styles.resultActions}>
            <button onClick={handleProcessResult} style={styles.processBtn}>
              Process Result
            </button>
            <button onClick={handleScan} style={styles.rescanBtn}>
              Scan Again
            </button>
          </div>
        )}

        {(scanning || result) && (
          <button onClick={handleCancel} style={styles.cancelBtn}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
    position: 'relative'
  },
  title: {
    margin: '0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#333'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    margin: '10px 20px',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  scannerContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  placeholder: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  qrIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  placeholderText: {
    fontSize: '1rem',
    color: '#666',
    margin: '0'
  },
  cameraView: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
    height: '400px',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  canvas: {
    display: 'none'
  },
  scanOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '250px',
    height: '250px',
    pointerEvents: 'none',
    border: '2px solid rgba(76, 175, 80, 0.5)',
    boxShadow: '0 0 0 1000px rgba(0,0,0,0.5)',
    borderRadius: '8px'
  },
  scanFrame: {
    // Legacy style, safe to keep or remove if unused, but removing since I updated scanOverlay
    display: 'none'
  },
  scanInstruction: {
    position: 'absolute',
    bottom: '-40px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    margin: '0',
    fontSize: '0.9rem'
  },
  resultContainer: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px'
  },
  resultIcon: {
    fontSize: '3rem',
    color: '#4CAF50',
    marginBottom: '15px'
  },
  resultTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.2rem',
    color: '#333'
  },
  resultValue: {
    fontSize: '1rem',
    color: '#666',
    wordBreak: 'break-all',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    margin: '0'
  },
  controls: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e0e0e0'
  },
  scanBtn: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  resultActions: {
    display: 'flex',
    gap: '10px'
  },
  processBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  rescanBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default QRScanner;