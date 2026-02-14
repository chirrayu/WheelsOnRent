import React, { useState } from 'react';
import './Customer_verify.css';

const CustomerVerify = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [rentalActive, setRentalActive] = useState(false);

  const handleScanQR = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      setCustomerInfo({
        name: 'John Doe',
        email: 'johndoe@example.com',
        dlNumber: 'DL-1234567890',
        phone: '+91-9876543210',
        verified: true
      });
    }, 2000);
  };

  const handleViewDL = () => {
    alert('Opening DL document for viewing...');
    // In a real app, this would open the DL document
  };

  const handleStartRental = () => {
    setRentalActive(true);
    alert('Rental started successfully!');
  };

  const handleStopRental = () => {
    setRentalActive(false);
    alert('Rental stopped. Please return the vehicle to the designated location.');
  };

  return (
    <div className="customer-verify">
      <h2>Customer Verification</h2>
      
      <div className="qr-scanner-container">
        <h3>Scan Customer QR Code</h3>
        <div className="qr-placeholder">
          {isScanning ? (
            <div>Scanning...</div>
          ) : (
            <div>QR Code Scanner</div>
          )}
        </div>
        
        {!isScanning ? (
          <button className="scan-button" onClick={handleScanQR}>
            Scan QR Code
          </button>
        ) : (
          <button className="scan-button stop" onClick={() => setIsScanning(false)}>
            Stop Scanning
          </button>
        )}
      </div>

      {customerInfo && (
        <div className="customer-info card">
          <h3>Customer Information</h3>
          <div className="info-item">
            <strong>Name:</strong> {customerInfo.name}
          </div>
          <div className="info-item">
            <strong>Email:</strong> {customerInfo.email}
          </div>
          <div className="info-item">
            <strong>DL Number:</strong> {customerInfo.dlNumber}
          </div>
          <div className="info-item">
            <strong>Phone:</strong> {customerInfo.phone}
          </div>
          <div className="info-item">
            <strong>Verification Status:</strong> 
            <span style={{color: customerInfo.verified ? 'green' : 'red'}}>
              {customerInfo.verified ? ' Verified' : ' Not Verified'}
            </span>
          </div>
          
          <div className="verify-actions">
            <button className="btn btn-primary" onClick={handleViewDL}>
              View DL
            </button>
            {!rentalActive ? (
              <button className="btn btn-primary" onClick={handleStartRental}>
                Start Rental
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleStopRental}>
                Stop Rental
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerVerify;