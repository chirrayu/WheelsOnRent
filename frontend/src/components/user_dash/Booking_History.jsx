import React, { useState } from 'react';
import './Booking_History.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([
    { id: 1, vehicle: 'Honda CB Shine', location: 'Downtown Hub', startDate: '2023-05-15', endDate: '2023-05-16', totalCost: 300, status: 'Completed' },
    { id: 2, vehicle: 'TVS Jupiter', location: 'Uptown Station', startDate: '2023-05-20', endDate: '2023-05-20', totalCost: 40, status: 'Completed' },
    { id: 3, vehicle: 'Yamaha FZ', location: 'Midtown Plaza', startDate: '2023-05-25', endDate: '2023-05-27', totalCost: 560, status: 'Active' },
    { id: 4, vehicle: 'Hero Splendor', location: 'Downtown Hub', startDate: '2023-06-01', endDate: '2023-06-02', totalCost: 280, status: 'Cancelled' },
  ]);

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'All' || booking.status === filterStatus;
    const matchesDate = !filterDate || booking.startDate.includes(filterDate);
    return matchesStatus && matchesDate;
  });

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase()}`;
  };

  return (
    <div className="booking-history">
      <h2>Booking History</h2>
      
      <div className="card history-filters">
        <div className="form-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      <div className="card history-table">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Vehicle</th>
              <th>Location</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Cost (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.vehicle}</td>
                <td>{booking.location}</td>
                <td>{booking.startDate}</td>
                <td>{booking.endDate}</td>
                <td>{booking.totalCost}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredBookings.length === 0 && (
          <p>No bookings found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;