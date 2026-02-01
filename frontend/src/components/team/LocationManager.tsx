import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, MapPin, Bike } from 'lucide-react';
import { getStoredData, setStoredData } from '../../utils/mockData';
import { toast } from 'sonner@2.0.3';

export default function LocationManager() {
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const locationsData = getStoredData('locations', []);
    const vehiclesData = getStoredData('vehicles', []);
    setLocations(locationsData);
    setVehicles(vehiclesData);
  };

  const getVehicleCount = (locationId: string) => {
    return vehicles.filter((v: any) => v.locationId === locationId).length;
  };

  const getAvailableCount = (locationId: string) => {
    return vehicles.filter((v: any) => v.locationId === locationId && v.status === 'available').length;
  };

  const handleAddLocation = () => {
    const newLocation = {
      id: Date.now().toString(),
      ...formData,
      lat: parseFloat(formData.lat) || 0,
      lng: parseFloat(formData.lng) || 0
    };

    const updatedLocations = [...locations, newLocation];
    setLocations(updatedLocations);
    setStoredData('locations', updatedLocations);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success('Location added successfully!');
  };

  const handleUpdateLocation = () => {
    const updatedLocations = locations.map((l: any) =>
      l.id === editingLocation.id
        ? {
            ...l,
            ...formData,
            lat: parseFloat(formData.lat) || l.lat,
            lng: parseFloat(formData.lng) || l.lng
          }
        : l
    );
    setLocations(updatedLocations);
    setStoredData('locations', updatedLocations);
    setEditingLocation(null);
    resetForm();
    toast.success('Location updated successfully!');
  };

  const toggleLocationStatus = (locationId: string) => {
    const updatedLocations = locations.map((l: any) =>
      l.id === locationId ? { ...l, isActive: !l.isActive } : l
    );
    setLocations(updatedLocations);
    setStoredData('locations', updatedLocations);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      lat: '',
      lng: '',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      isActive: true
    });
  };

  const openEditDialog = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      image: location.image,
      isActive: location.isActive
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Location Manager</h1>
          <p className="text-gray-600 mt-1">Manage rental locations and their availability</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingLocation(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Add a new rental location to the system
              </DialogDescription>
            </DialogHeader>
            <LocationForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation}>Add Location</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location information
            </DialogDescription>
          </DialogHeader>
          <LocationForm formData={formData} setFormData={setFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLocation(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation}>Update Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location: any) => (
          <Card key={location.id} className="overflow-hidden">
            <img 
              src={location.image} 
              alt={location.name}
              className="w-full h-48 object-cover"
            />
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  {location.name}
                </CardTitle>
                <Badge className={location.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{location.address}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-semibold text-blue-600">{getVehicleCount(location.id)}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Vehicles</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-600">{getAvailableCount(location.id)}</p>
                  <p className="text-xs text-gray-600 mt-1">Available</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={location.isActive}
                    onCheckedChange={() => toggleLocationStatus(location.id)}
                  />
                  <Label className="text-sm">
                    {location.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(location)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LocationForm({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Location Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Downtown Station"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="e.g., 123 Main Street, City Center"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input
            type="number"
            step="any"
            value={formData.lat}
            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
            placeholder="40.7128"
          />
        </div>

        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input
            type="number"
            step="any"
            value={formData.lng}
            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
            placeholder="-74.0060"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label>Active Location</Label>
      </div>
    </div>
  );
}
