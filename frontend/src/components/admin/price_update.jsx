import React, { useState } from 'react';
import './price_update.css';

const PriceUpdate = () => {
  const [vehicles, setVehicles] = useState([
    {
      id: 'V001',
      type: 'Car',
      make: 'Toyota',
      model: 'Camry',
      currentRate: 2500,
      newRate: 2500
    },
    {
      id: 'V002',
      type: 'Bike',
      make: 'Honda',
      model: 'CBR',
      currentRate: 1200,
      newRate: 1200
    },
    {
      id: 'V003',
      type: 'SUV',
      make: 'Ford',
      model: 'EcoSport',
      currentRate: 3500,
      newRate: 3500
    }
  ]);

  const [bulkUpdate, setBulkUpdate] = useState({
    percentage: 0,
    type: 'all'
  });

  const handleRateChange = (id, newRate) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === id ? { ...vehicle, newRate: parseFloat(newRate) || 0 } : vehicle
    ));
  };

  const handleBulkUpdateChange = (e) => {
    setBulkUpdate({
      ...bulkUpdate,
      [e.target.name]: e.target.value
    });
  };

  const applyBulkUpdate = () => {
    const percentage = parseFloat(bulkUpdate.percentage);
    if (isNaN(percentage)) return;

    setVehicles(vehicles.map(vehicle => {
      if (bulkUpdate.type === 'all' || vehicle.type.toLowerCase() === bulkUpdate.type.toLowerCase()) {
        const newRate = vehicle.currentRate * (1 + percentage / 100);
        return { ...vehicle, newRate: Math.round(newRate) };
      }
      return vehicle;
    }));
  };

  const saveChanges = () => {
    // In a real application, you would send the updated rates to your backend
    alert('Price updates saved successfully!');
    
    // Update current rates to new rates
    setVehicles(vehicles.map(vehicle => ({
      ...vehicle,
      currentRate: vehicle.newRate
    })));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Price Update</h2>
      </div>

      <div style={styles.bulkUpdateSection}>
        <h3 style={styles.sectionTitle}>Bulk Update</h3>
        <div style={styles.bulkUpdateForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Update Type</label>
            <select
              name="type"
              value={bulkUpdate.type}
              onChange={handleBulkUpdateChange}
              style={styles.select}
            >
              <option value="all">All Vehicles</option>
              <option value="car">Cars</option>
              <option value="bike">Bikes</option>
              <option value="truck">Trucks</option>
              <option value="suv">SUVs</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Percentage Change (%)</label>
            <input
              type="number"
              name="percentage"
              value={bulkUpdate.percentage}
              onChange={handleBulkUpdateChange}
              style={styles.input}
              placeholder="Enter percentage (e.g., 10 for +10%, -5 for -5%)"
            />
          </div>
          
          <button 
            onClick={applyBulkUpdate}
            style={styles.applyButton}
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div style={styles.individualUpdateSection}>
        <h3 style={styles.sectionTitle}>Individual Updates</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>Current Rate</th>
                <th style={styles.th}>New Rate</th>
                <th style={styles.th}>Change</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td style={styles.td}>{vehicle.id}</td>
                  <td style={styles.td}>{vehicle.make} {vehicle.model} ({vehicle.type})</td>
                  <td style={styles.td}>₹{vehicle.currentRate}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      value={vehicle.newRate}
                      onChange={(e) => handleRateChange(vehicle.id, e.target.value)}
                      style={styles.rateInput}
                    />
                  </td>
                  <td style={styles.td}>
                    {vehicle.newRate > vehicle.currentRate ? (
                      <span style={{ color: '#10b981' }}>+₹{vehicle.newRate - vehicle.currentRate}</span>
                    ) : vehicle.newRate < vehicle.currentRate ? (
                      <span style={{ color: '#ef4444' }}>-₹{vehicle.currentRate - vehicle.newRate}</span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>No change</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.actions}>
        <button 
          onClick={saveChanges}
          style={styles.saveButton}
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    marginLeft: '280px'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: '0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  bulkUpdateSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  bulkUpdateForm: {
    display: 'flex',
    gap: '20px',
    alignItems: 'end'
  },
  formGroup: {
    flex: 1
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#334155',
    fontSize: '0.9rem'
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: 'white'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none'
  },
  applyButton: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  individualUpdateSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    fontWeight: '600',
    color: '#334155',
    borderBottom: '2px solid #e2e8f0'
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  rateInput: {
    width: '100px',
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default PriceUpdate;