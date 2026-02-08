import React, { useState } from 'react';
import './price_update.css';

const PriceUpdate = () => {
  const [prices, setPrices] = useState({
    bike: {
      hourly: 50,
      daily: 300,
      weekly: 1800
    },
    scooter: {
      hourly: 40,
      daily: 250,
      weekly: 1500
    }
  });

  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [locations] = useState(['All Locations', 'Downtown Hub', 'Uptown Station', 'Midtown Plaza']);

  const handlePriceChange = (type, period, value) => {
    setPrices({
      ...prices,
      [type]: {
        ...prices[type],
        [period]: parseFloat(value) || 0
      }
    });
  };

  const handleUpdatePrices = () => {
    alert(`Prices updated for ${selectedLocation}!`);
    // In a real app, you would send this data to your backend
  };

  return (
    <div className="price-update">
      <h2>Price Update</h2>
      
      <div className="card">
        <div className="form-group">
          <label>Select Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-control"
          >
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3>Bike Pricing (₹)</h3>
          <div className="pricing-form">
            <div className="form-group">
              <label>Hourly Rate:</label>
              <input
                type="number"
                value={prices.bike.hourly}
                onChange={(e) => handlePriceChange('bike', 'hourly', e.target.value)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Daily Rate:</label>
              <input
                type="number"
                value={prices.bike.daily}
                onChange={(e) => handlePriceChange('bike', 'daily', e.target.value)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Weekly Rate:</label>
              <input
                type="number"
                value={prices.bike.weekly}
                onChange={(e) => handlePriceChange('bike', 'weekly', e.target.value)}
                min="0"
              />
            </div>
            <button className="update-btn" onClick={handleUpdatePrices}>
              Update Bike Prices
            </button>
          </div>
        </div>

        <div className="pricing-card">
          <h3>Scooter Pricing (₹)</h3>
          <div className="pricing-form">
            <div className="form-group">
              <label>Hourly Rate:</label>
              <input
                type="number"
                value={prices.scooter.hourly}
                onChange={(e) => handlePriceChange('scooter', 'hourly', e.target.value)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Daily Rate:</label>
              <input
                type="number"
                value={prices.scooter.daily}
                onChange={(e) => handlePriceChange('scooter', 'daily', e.target.value)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Weekly Rate:</label>
              <input
                type="number"
                value={prices.scooter.weekly}
                onChange={(e) => handlePriceChange('scooter', 'weekly', e.target.value)}
                min="0"
              />
            </div>
            <button className="update-btn" onClick={handleUpdatePrices}>
              Update Scooter Prices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceUpdate;