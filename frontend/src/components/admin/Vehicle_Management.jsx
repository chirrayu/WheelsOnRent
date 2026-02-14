import React, { useState } from 'react';
import './Vehicle_Management.css';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([
    { id: 1, type: 'Bike', model: 'Honda CB Shine', location: 'Downtown Hub', status: 'Available', licensePlate: 'DL-01-AB-1234' },
    { id: 2, type: 'Scooter', model: 'TVS Jupiter', location: 'Uptown Station', status: 'Rented', licensePlate: 'DL-01-CD-5678' },
    { id: 3, type: 'Bike', model: 'Yamaha FZ', location: 'Midtown Plaza', status: 'Maintenance', licensePlate: 'DL-01-EF-9012' },
  ]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ 
    type: 'Bike', 
    model: '', 
    location: '', 
    licensePlate: '',
    status: 'Available' 
  });

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (newVehicle.model && newVehicle.location && newVehicle.licensePlate) {
      setVehicles([...vehicles, { 
        id: vehicles.length + 1, 
        ...newVehicle 
      }]);
      setNewVehicle({ 
        type: 'Bike', 
        model: '', 
        location: '', 
        licensePlate: '',
        status: 'Available' 
      });
      setShowAddForm(false);
    }
  };

  const handleDeleteVehicle = (id) => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === id ? {...vehicle, status: newStatus} : vehicle
    ));
  };

  return (
    <div className="vehicle-management">
      <div className="vehicle-actions">
        <h2>Vehicle Management</h2>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          Add New Vehicle
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddVehicle} className="add-vehicle-form card">
          <h3>Add New Vehicle</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Type:</label>
              <select
                className="form-control"
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({...newVehicle, type: e.target.value})}
              >
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
              </select>
            </div>
            <div className="form-group">
              <label>Model:</label>
              <input
                type="text"
                className="form-control"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location:</label>
              <input
                type="text"
                className="form-control"
                value={newVehicle.location}
                onChange={(e) => setNewVehicle({...newVehicle, location: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>License Plate:</label>
              <input
                type="text"
                className="form-control"
                value={newVehicle.licensePlate}
                onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Vehicle</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card vehicle-table">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Model</th>
              <th>Location</th>
              <th>License Plate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.type}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.location}</td>
                <td>{vehicle.licensePlate}</td>
                <td>
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                    className={`status-select ${vehicle.status.toLowerCase()}`}
                  >
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </td>
                <td>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
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

export default VehicleManagement;