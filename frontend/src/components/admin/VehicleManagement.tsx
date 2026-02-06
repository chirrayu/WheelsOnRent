import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStoredData, setStoredData } from '@/utils/mockData';

interface Vehicle {
  id: string;
  type: string;
  model: string;
  locationId: string;
  status: string;
  condition: string;
  lastMaintenance: string;
}

interface Location {
  id: string;
  name: string;
}

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    type: '',
    model: '',
    locationId: '',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const vehiclesData = getStoredData('vehicles', []);
    const locationsData = getStoredData('locations', []);
    setVehicles(vehiclesData);
    setLocations(locationsData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVehicle = () => {
    if (!formData.type || !formData.model || !formData.locationId) {
      alert("Please fill all required fields");
      return;
    }

    const newVehicle: Vehicle = {
      id: `V${String(vehicles.length + 1).padStart(3, '0')}`,
      ...formData
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    setStoredData('vehicles', updatedVehicles);
    
    // Reset form
    setFormData({
      type: '',
      model: '',
      locationId: '',
      status: 'available',
      condition: 'excellent',
      lastMaintenance: new Date().toISOString().split('T')[0]
    });
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input 
                id="model" 
                name="model" 
                value={formData.model} 
                onChange={handleInputChange} 
                placeholder="Enter model" 
              />
            </div>
            <div>
              <Label htmlFor="locationId">Location *</Label>
              <Select onValueChange={(value) => handleSelectChange('locationId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value) => handleSelectChange('status', value)} defaultValue="available">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select onValueChange={(value) => handleSelectChange('condition', value)} defaultValue="excellent">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lastMaintenance">Last Maintenance</Label>
              <Input 
                id="lastMaintenance" 
                name="lastMaintenance" 
                type="date" 
                value={formData.lastMaintenance} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <Button onClick={handleAddVehicle}>Add Vehicle</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Condition</th>
                  <th className="text-left p-2">Last Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id} className="border-b">
                    <td className="p-2">{vehicle.id}</td>
                    <td className="p-2">{vehicle.type}</td>
                    <td className="p-2">{vehicle.model}</td>
                    <td className="p-2">{getLocationName(vehicle.locationId)}</td>
                    <td className="p-2">{vehicle.status}</td>
                    <td className="p-2">{vehicle.condition}</td>
                    <td className="p-2">{vehicle.lastMaintenance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleManagement;