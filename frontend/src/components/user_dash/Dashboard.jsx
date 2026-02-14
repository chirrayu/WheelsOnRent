import React, { useState } from 'react';
import './Dashboard.css';

const UserDashboard = () => {
  const [locations, setLocations] = useState([
    { 
      id: 1, 
      name: 'Downtown Hub', 
      address: '123 Main St', 
      availableBikes: 5, 
      availableScooters: 3,
      pricing: { bike: { hourly: 50, daily: 300 }, scooter: { hourly: 40, daily: 250 } }
    },
    { 
      id: 2, 
      name: 'Uptown Station', 
      address: '456 Oak Ave', 
      availableBikes: 2, 
      availableScooters: 7,
      pricing: { bike: { hourly: 55, daily: 320 }, scooter: { hourly: 45, daily: 270 } }
    },
    { 
      id: 3, 
      name: 'Midtown Plaza', 
      address: '789 Pine Rd', 
      availableBikes: 8, 
      availableScooters: 4,
      pricing: { bike: { hourly: 48, daily: 280 }, scooter: { hourly: 38, daily: 230 } }
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookVehicle = (locationId, vehicleType) => {
    alert(`Booking initiated for ${vehicleType} at ${locations.find(loc => loc.id === locationId).name}`);
    // In a real app, this would navigate to the booking page
  };

  return (
    <div className="user-dashboard">
      <h2>Available Locations</h2>
      
      <div className="card search-bar">
        <input
          type="text"
          className="form-control"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="location-grid">
        {filteredLocations.map(location => (
          <div key={location.id} className="location-card">
            <h3>{location.name}</h3>
            <p><strong>Address:</strong> {location.address}</p>
            <p><strong>Available Bikes:</strong> {location.availableBikes}</p>
            <p><strong>Available Scooters:</strong> {location.availableScooters}</p>
            
            <div className="pricing-info">
              <h4>Pricing (₹)</h4>
              <div className="pricing-item">
                <span>Bike - Hourly:</span>
                <span>{location.pricing.bike.hourly}/-</span>
              </div>
              <div className="pricing-item">
                <span>Bike - Daily:</span>
                <span>{location.pricing.bike.daily}/-</span>
              </div>
              <div className="pricing-item">
                <span>Scooter - Hourly:</span>
                <span>{location.pricing.scooter.hourly}/-</span>
              </div>
              <div className="pricing-item">
                <span>Scooter - Daily:</span>
                <span>{location.pricing.scooter.daily}/-</span>
              </div>
            </div>
            
            <button 
              className="book-button"
              onClick={() => handleBookVehicle(location.id, 'bike')}
              disabled={location.availableBikes === 0}
            >
              Book Bike
            </button>
            <button 
              className="book-button"
              onClick={() => handleBookVehicle(location.id, 'scooter')}
              disabled={location.availableScooters === 0}
            >
              Book Scooter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;