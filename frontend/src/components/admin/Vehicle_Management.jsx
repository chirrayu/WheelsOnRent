import React, { useState } from 'react';
import './Vehicle_Management.css';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([
    {
      id: 'V001',
      type: 'Car',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: 'MH-12-AB-1234',
      dailyRate: 2500,
      status: 'available'
    },
    {
      id: 'V002',
      type: 'Bike',
      make: 'Honda',
      model: 'CBR',
      year: 2023,
      licensePlate: 'MH-12-CD-5678',
      dailyRate: 1200,
      status: 'rented'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    type: '',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    dailyRate: ''
  });

  const handleInputChange = (e) => {
    setNewVehicle({
      ...newVehicle,
      [e.target.name]: e.target.value
    });
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    const vehicleToAdd = {
      id: `V${String(vehicles.length + 1).padStart(3, '0')}`,
      ...newVehicle,
      year: parseInt(newVehicle.year),
      dailyRate: parseFloat(newVehicle.dailyRate),
      status: 'available'
    };
    
    setVehicles([...vehicles, vehicleToAdd]);
    setNewVehicle({
      type: '',
      make: '',
      model: '',
      year: '',
      licensePlate: '',
      dailyRate: ''
    });
    setShowAddForm(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available':
        return '#10b981';
      case 'rented':
        return '#f59e0b';
      case 'maintenance':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Vehicle Management</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          + Add Vehicle
        </button>
      </div>

      {showAddForm && (
        <div style={styles.addForm}>
          <h3 style={styles.formTitle}>Add New Vehicle</h3>
          <form onSubmit={handleAddVehicle}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type</label>
                <select
                  name="type"
                  value={newVehicle.type}
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Truck">Truck</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Make</label>
                <input
                  type="text"
                  name="make"
                  value={newVehicle.make}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Model</label>
                <input
                  type="text"
                  name="model"
                  value={newVehicle.model}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Year</label>
                <input
                  type="number"
                  name="year"
                  value={newVehicle.year}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={newVehicle.licensePlate}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Daily Rate (₹)</label>
                <input
                  type="number"
                  name="dailyRate"
                  value={newVehicle.dailyRate}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <div style={styles.formActions}>
              <button type="submit" style={styles.saveButton}>
                Save Vehicle
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Make/Model</th>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>License Plate</th>
              <th style={styles.th}>Daily Rate</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td style={styles.td}>{vehicle.id}</td>
                <td style={styles.td}>{vehicle.type}</td>
                <td style={styles.td}>{vehicle.make} {vehicle.model}</td>
                <td style={styles.td}>{vehicle.year}</td>
                <td style={styles.td}>{vehicle.licensePlate}</td>
                <td style={styles.td}>₹{vehicle.dailyRate}</td>
                <td style={styles.td}>
                  <span 
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${getStatusColor(vehicle.status)}20`,
                      color: getStatusColor(vehicle.status),
                      border: `1px solid ${getStatusColor(vehicle.status)}`
                    }}
                  >
                    {vehicle.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.editButton}>Edit</button>
                  <button style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    margin: '0',
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  addForm: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b'
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '16px'
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
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none'
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
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
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
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#f87171',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
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
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8rem',
    marginRight: '8px',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer'
  }
};

export default VehicleManagement;