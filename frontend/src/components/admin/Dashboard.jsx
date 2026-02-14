import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [vehiclesInUse, setVehiclesInUse] = useState([
    { id: 1, type: 'Bike', model: 'Honda CB Shine', location: 'Downtown', user: 'John Doe', startTime: '10:00 AM' },
    { id: 2, type: 'Scooter', model: 'TVS Jupiter', location: 'Uptown', user: 'Jane Smith', startTime: '11:30 AM' },
    { id: 3, type: 'Bike', model: 'Yamaha FZ', location: 'Midtown', user: 'Robert Johnson', startTime: '09:15 AM' },
  ]);

  return (
    <div className="dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Vehicles</h3>
          <p>25</p>
        </div>
        <div className="stat-card">
          <h3>Vehicles In Use</h3>
          <p>{vehiclesInUse.length}</p>
        </div>
        <div className="stat-card">
          <h3>Available Locations</h3>
          <p>8</p>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>150</p>
        </div>
      </div>

      <div className="card">
        <h3>Currently Rented Vehicles</h3>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Model</th>
              <th>Location</th>
              <th>User</th>
              <th>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {vehiclesInUse.map(vehicle => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.type}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.location}</td>
                <td>{vehicle.user}</td>
                <td>{vehicle.startTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;