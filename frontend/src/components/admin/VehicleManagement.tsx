import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Bike } from 'lucide-react';
import { getStoredData, setStoredData } from '../../utils/mockData';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    type: 'bike',
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

  const getLocationName = (locationId: string) => {
    const location = locations.find((l: any) => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const handleAddVehicle = () => {
    const newVehicle = {
      id: `V${String(vehicles.length + 1).padStart(3, '0')}`,
      ...formData
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    setStoredData('vehicles', updatedVehicles);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleUpdateVehicle = () => {
    const updatedVehicles = vehicles.map((v: any) =>
      v.id === editingVehicle.id ? { ...v, ...formData } : v
    );
    setVehicles(updatedVehicles);
    setStoredData('vehicles', updatedVehicles);
    setEditingVehicle(null);
    resetForm();
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      const updatedVehicles = vehicles.filter((v: any) => v.id !== vehicleId);
      setVehicles(updatedVehicles);
      setStoredData('vehicles', updatedVehicles);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'bike',
      model: '',
      locationId: '',
      status: 'available',
      condition: 'excellent',
      lastMaintenance: new Date().toISOString().split('T')[0]
    });
  };

  const openEditDialog = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      type: vehicle.type,
      model: vehicle.model,
      locationId: vehicle.locationId,
      status: vehicle.status,
      condition: vehicle.condition,
      lastMaintenance: vehicle.lastMaintenance
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'in-use':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-1">Manage your fleet of bikes and scooters</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingVehicle(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Add a new vehicle to your fleet
              </DialogDescription>
            </DialogHeader>
            <VehicleForm
              formData={formData}
              setFormData={setFormData}
              locations={locations}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVehicle}>Add Vehicle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update vehicle information
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            formData={formData}
            setFormData={setFormData}
            locations={locations}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVehicle(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVehicle}>Update Vehicle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Model</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Condition</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Maintenance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle: any) => (
                  <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{vehicle.id}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="capitalize">
                        {vehicle.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{vehicle.model}</td>
                    <td className="py-3 px-4">{getLocationName(vehicle.locationId)}</td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 capitalize">{vehicle.condition}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{vehicle.lastMaintenance}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(vehicle)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleForm({ formData, setFormData, locations }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Vehicle Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bike">Bike</SelectItem>
            <SelectItem value="scooter">Scooter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Input
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="Enter vehicle model"
        />
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location: any) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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

      <div className="space-y-2">
        <Label>Condition</Label>
        <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Last Maintenance</Label>
        <Input
          type="date"
          value={formData.lastMaintenance}
          onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
        />
      </div>
    </div>
  );
}
