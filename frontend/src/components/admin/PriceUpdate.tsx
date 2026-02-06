import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Save, Bike, MapPin } from 'lucide-react';
import { getStoredData, setStoredData } from '../../utils/mockData';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface Pricing {
  id?: string;
  locationId: string;
  vehicleType: string;
  pricePerHour: number;
  pricePerDay: number;
}

export default function PriceUpdate() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, Partial<Pricing>>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const locationsData = getStoredData('locations', []);
    const pricingData = getStoredData('pricing', []);
    setLocations(locationsData);
    setPricing(pricingData);
  };

  const getPriceForLocation = (locationId: string, vehicleType: string) => {
    const price = pricing.find(
      (p) => p.locationId === locationId && p.vehicleType === vehicleType
    );
    return price || { pricePerHour: 0, pricePerDay: 0 };
  };

  const handlePriceChange = (locationId: string, vehicleType: string, field: 'pricePerHour' | 'pricePerDay', value: string) => {
    const key = `${locationId}-${vehicleType}`;
    const currentPrice = getPriceForLocation(locationId, vehicleType);

    setEditedPrices({
      ...editedPrices,
      [key]: {
        locationId,
        vehicleType,
        ...currentPrice,
        [field]: parseFloat(value) || 0
      }
    });
  };

  const savePrices = () => {
    const updatedPricing = [...pricing];

    Object.values(editedPrices).forEach((editedPrice) => {
      if (!editedPrice.locationId || !editedPrice.vehicleType) return;

      const index = updatedPricing.findIndex(
        (p) => p.locationId === editedPrice.locationId && p.vehicleType === editedPrice.vehicleType
      );

      if (index !== -1) {
        updatedPricing[index] = {
          ...updatedPricing[index],
          pricePerHour: editedPrice.pricePerHour ?? updatedPricing[index].pricePerHour,
          pricePerDay: editedPrice.pricePerDay ?? updatedPricing[index].pricePerDay
        };
      } else {
        updatedPricing.push({
          id: Date.now().toString(),
          locationId: editedPrice.locationId,
          vehicleType: editedPrice.vehicleType,
          pricePerHour: editedPrice.pricePerHour || 0,
          pricePerDay: editedPrice.pricePerDay || 0
        });
      }
    });

    setPricing(updatedPricing);
    setStoredData('pricing', updatedPricing);
    setEditedPrices({});
    toast.success('Prices updated successfully!');
  };

  const getCurrentPrice = (locationId: string, vehicleType: string, field: 'pricePerHour' | 'pricePerDay') => {
    const key = `${locationId}-${vehicleType}`;
    if (editedPrices[key]) {
      const val = editedPrices[key][field];
      if (val !== undefined) return val;
    }
    const price = getPriceForLocation(locationId, vehicleType);
    return (price as any)[field];
  };

  const hasChanges = Object.keys(editedPrices).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Price Update</h1>
          <p className="text-gray-600 mt-1">Manage pricing for bikes and scooters at each location</p>
        </div>
        {hasChanges && (
          <Button onClick={savePrices}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                {location.name}
              </CardTitle>
              <p className="text-sm text-gray-600">{location.address}</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Bike Pricing */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Bike className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium">Bike Pricing</h3>
                    <Badge variant="outline">Bike</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`bike-hour-${location.id}`}>Price per Hour ($)</Label>
                      <Input
                        id={`bike-hour-${location.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentPrice(location.id, 'bike', 'pricePerHour')}
                        onChange={(e) => handlePriceChange(location.id, 'bike', 'pricePerHour', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`bike-day-${location.id}`}>Price per Day ($)</Label>
                      <Input
                        id={`bike-day-${location.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentPrice(location.id, 'bike', 'pricePerDay')}
                        onChange={(e) => handlePriceChange(location.id, 'bike', 'pricePerDay', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Scooter Pricing */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Bike className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium">Scooter Pricing</h3>
                    <Badge variant="outline">Scooter</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`scooter-hour-${location.id}`}>Price per Hour ($)</Label>
                      <Input
                        id={`scooter-hour-${location.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentPrice(location.id, 'scooter', 'pricePerHour')}
                        onChange={(e) => handlePriceChange(location.id, 'scooter', 'pricePerHour', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`scooter-day-${location.id}`}>Price per Day ($)</Label>
                      <Input
                        id={`scooter-day-${location.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={getCurrentPrice(location.id, 'scooter', 'pricePerDay')}
                        onChange={(e) => handlePriceChange(location.id, 'scooter', 'pricePerDay', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
