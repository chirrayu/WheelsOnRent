import React, { useState } from 'react';
import './location_management.css';

const LocationManagement = () => {
  const [locations, setLocations] = useState([
    { id: 1, name: 'Downtown Hub', address: '123 Main St', capacity: 10, status: 'Active' },
    { id: 2, name: 'Uptown Station', address: '456 Oak Ave', capacity: 15, status: 'Active' },
    { id: 3, name: 'Midtown Plaza', address: '789 Pine Rd', capacity: 8, status: 'Maintenance' },
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', capacity: 10 });

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (newLocation.name && newLocation.address) {
      setLocations([...locations, { 
        id: locations.length + 1, 
        ...newLocation, 
        status: 'Active' 
      }]);
      setNewLocation({ name: '', address: '', capacity: 10 });
      setShowAddForm(false);
    }
  };

  const handleDeleteLocation = (id) => {
    setLocations(locations.filter(location => location.id !== id));
  };

  return (
    <div className="location-management">
      <div className="header-actions">
        <h2>Location Management</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          Add New Location
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddLocation} className="add-location-form card">
          <h3>Add New Location</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              className="form-control"
              value={newLocation.name}
              onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              className="form-control"
              value={newLocation.address}
              onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Capacity:</label>
            <input
              type="number"
              className="form-control"
              value={newLocation.capacity}
              onChange={(e) => setNewLocation({...newLocation, capacity: parseInt(e.target.value)})}
              min="1"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Location</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(location => (
              <tr key={location.id}>
                <td>{location.id}</td>
                <td>{location.name}</td>
                <td>{location.address}</td>
                <td>{location.capacity}</td>
                <td>
                  <span className={`status ${location.status.toLowerCase()}`}>
                    {location.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleDeleteLocation(location.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocationManagement;