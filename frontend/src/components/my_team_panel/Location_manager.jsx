import React, { useState } from 'react';
import './Location_manager.css';

const LocationManager = () => {
  const [locations, setLocations] = useState([
    { 
      id: 1, 
      name: 'Downtown Hub', 
      address: '123 Main St', 
      capacity: 10, 
      occupied: 7,
      status: 'available',
      manager: 'John Doe'
    },
    { 
      id: 2, 
      name: 'Uptown Station', 
      address: '456 Oak Ave', 
      capacity: 15, 
      occupied: 15,
      status: 'full',
      manager: 'Jane Smith'
    },
    { 
      id: 3, 
      name: 'Midtown Plaza', 
      address: '789 Pine Rd', 
      capacity: 8, 
      occupied: 3,
      status: 'available',
      manager: 'Robert Johnson'
    },
  ]);

  const handleAssignManager = (locationId, newManager) => {
    setLocations(locations.map(location => 
      location.id === locationId 
        ? {...location, manager: newManager || 'Unassigned'} 
        : location
    ));
  };

  const getStatusClass = (status) => {
    return status === 'available' ? 'available' : 'full';
  };

  return (
    <div className="location-manager">
      <div className="location-actions">
        <h2>Location Manager</h2>
      </div>

      <div className="location-grid">
        {locations.map(location => (
          <div key={location.id} className="location-card">
            <h3>{location.name}</h3>
            <div className="location-details">
              <p><strong>Address:</strong> {location.address}</p>
              <p><strong>Capacity:</strong> {location.occupied}/{location.capacity}</p>
              <p><strong>Status:</strong> 
                <span className={`location-status ${getStatusClass(location.status)}`}>
                  {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                </span>
              </p>
              <p><strong>Manager:</strong> {location.manager}</p>
            </div>
            <div className="form-group">
              <label>Assign Manager:</label>
              <input
                type="text"
                placeholder="Manager name"
                className="form-control"
                onBlur={(e) => handleAssignManager(location.id, e.target.value)}
              />
            </div>
            <button className="btn btn-secondary">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationManager;