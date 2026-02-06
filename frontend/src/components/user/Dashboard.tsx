import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MapPin, Bike, Clock, DollarSign, Calendar } from 'lucide-react';
import { locationsAPI, vehiclesAPI, pricingAPI, bookingsAPI } from '../../utils/api';
import { User } from '../../utils/mockData';
import { toast } from 'sonner';

// ... (interfaces remain same) should be replaced with actual interfaces

interface Location {
  id: string;
  name: string;
  address: string;
  image: string;
  isActive: boolean;
}

interface Pricing {
  locationId: string;
  vehicleType: 'bike' | 'scooter';
  pricePerHour: number;
  pricePerDay: number;
}

interface Vehicle {
  id: string;
  locationId: string;
  type: 'bike' | 'scooter';
  model: string;
  status: 'available' | 'in-use' | 'maintenance';
  currentUser?: string;
  bookedUntil?: string;
}

interface BookingDetails {
  vehicleType: 'bike' | 'scooter';
  duration: 'hour' | 'day';
  hours: string;
}

export default function Dashboard({ user }: { user: User }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    vehicleType: 'bike',
    duration: 'hour',
    hours: '1'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const locResponse = await locationsAPI.getAll();
      if (locResponse.success && locResponse.data) {
        setLocations(locResponse.data.filter((l: any) => l.isActive));
      }

      const pricingResponse = await pricingAPI.getAll();
      if (pricingResponse.success && pricingResponse.data) {
        setPricing(pricingResponse.data);
      }

      const vehicleResponse = await vehiclesAPI.getAll();
      if (vehicleResponse.success && vehicleResponse.data) {
        setVehicles(vehicleResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowPricingDialog(true);
  };

  const getPricingForLocation = (locationId: string) => {
    const bikePricing = pricing.find((p) => p.locationId === locationId && p.vehicleType === 'bike');
    const scooterPricing = pricing.find((p) => p.locationId === locationId && p.vehicleType === 'scooter');
    return { bike: bikePricing, scooter: scooterPricing };
  };

  const getAvailableVehicles = (locationId: string, vehicleType: string) => {
    return vehicles.filter((v) =>
      v.locationId === locationId &&
      v.type === vehicleType &&
      v.status === 'available'
    ).length;
  };

  const handleBookNow = () => {
    setShowPricingDialog(false);
    setShowBookingDialog(true);
  };

  const calculateCost = () => {
    if (!selectedLocation) return 0;
    const locationPricing = getPricingForLocation(selectedLocation.id);
    const vehiclePricing = bookingDetails.vehicleType === 'bike' ? locationPricing.bike : locationPricing.scooter;

    if (!vehiclePricing) return 0;

    if (bookingDetails.duration === 'hour') {
      return vehiclePricing.pricePerHour * parseInt(bookingDetails.hours);
    } else {
      return vehiclePricing.pricePerDay;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedLocation) return;

    const availableVehicle = vehicles.find((v) =>
      v.locationId === selectedLocation.id &&
      v.type === bookingDetails.vehicleType &&
      v.status === 'available'
    );

    if (!availableVehicle) {
      toast.error('No vehicles available at this time');
      return;
    }

    const now = new Date();
    const endTime = new Date(now);
    if (bookingDetails.duration === 'hour') {
      endTime.setHours(endTime.getHours() + parseInt(bookingDetails.hours));
    } else {
      endTime.setDate(endTime.getDate() + 1);
    }

    try {
      const bookingData = {
        userId: user.id,
        vehicleId: availableVehicle.id,
        locationId: selectedLocation.id,
        vehicleType: bookingDetails.vehicleType,
        vehicleModel: availableVehicle.model,
        startTime: now.toISOString(), // Use ISO string for API consistency
        endTime: endTime.toISOString(),
        duration: bookingDetails.duration === 'hour' ? `${bookingDetails.hours} hours` : '1 day',
        totalCost: calculateCost(),
        status: 'active',
        bookingDate: now.toISOString().split('T')[0]
      };

      await bookingsAPI.create(bookingData);

      // Optimistic update or reload
      loadData();

      toast.success('Booking confirmed! Enjoy your ride!');
      setShowBookingDialog(false);
      setSelectedLocation(null);
      setBookingDetails({ vehicleType: 'bike', duration: 'hour', hours: '1' });

    } catch (error) {
      toast.error('Failed to confirm booking');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Available Locations</h1>
        <p className="text-gray-600 mt-1">Select a location to view pricing and book a vehicle</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => {
          // REMOVED unused locationPricing variable
          const bikesAvailable = getAvailableVehicles(location.id, 'bike');
          const scootersAvailable = getAvailableVehicles(location.id, 'scooter');

          return (
            <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src={location.image}
                alt={location.name}
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <span>{location.name}</span>
                  </div>
                </CardTitle>
                <p className="text-sm text-gray-600">{location.address}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Bike className="w-3 h-3 mr-1" />
                      {bikesAvailable} Bikes
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Bike className="w-3 h-3 mr-1" />
                      {scootersAvailable} Scooters
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleLocationSelect(location)}
                  disabled={bikesAvailable === 0 && scootersAvailable === 0}
                >
                  {bikesAvailable === 0 && scootersAvailable === 0 ? 'No Vehicles Available' : 'View Pricing & Book'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              {selectedLocation?.name}
            </DialogTitle>
            <DialogDescription>{selectedLocation?.address}</DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Bike Pricing */}
                {getPricingForLocation(selectedLocation.id).bike && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bike className="w-5 h-5 text-blue-600" />
                        Bike
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Per Hour</span>
                        </div>
                        <span className="font-semibold text-blue-600">
                          ${getPricingForLocation(selectedLocation.id).bike?.pricePerHour}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Per Day</span>
                        </div>
                        <span className="font-semibold text-blue-600">
                          ${getPricingForLocation(selectedLocation.id).bike?.pricePerDay}
                        </span>
                      </div>
                      <Badge variant="outline" className="w-full justify-center">
                        {getAvailableVehicles(selectedLocation.id, 'bike')} Available
                      </Badge>
                    </CardContent>
                  </Card>
                )}

                {/* Scooter Pricing */}
                {getPricingForLocation(selectedLocation.id).scooter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bike className="w-5 h-5 text-green-600" />
                        Scooter
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Per Hour</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          ${getPricingForLocation(selectedLocation.id).scooter?.pricePerHour}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Per Day</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          ${getPricingForLocation(selectedLocation.id).scooter?.pricePerDay}
                        </span>
                      </div>
                      <Badge variant="outline" className="w-full justify-center">
                        {getAvailableVehicles(selectedLocation.id, 'scooter')} Available
                      </Badge>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
              Close
            </Button>
            <Button onClick={handleBookNow}>
              Book Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book a Vehicle</DialogTitle>
            <DialogDescription>
              Complete your booking at {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <RadioGroup value={bookingDetails.vehicleType} onValueChange={(value) => setBookingDetails({ ...bookingDetails, vehicleType: value as 'bike' | 'scooter' })}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bike" id="bike" />
                  <Label htmlFor="bike" className="cursor-pointer">
                    Bike - ${getPricingForLocation(selectedLocation?.id || '').bike?.pricePerHour}/hr,
                    ${getPricingForLocation(selectedLocation?.id || '').bike?.pricePerDay}/day
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scooter" id="scooter" />
                  <Label htmlFor="scooter" className="cursor-pointer">
                    Scooter - ${getPricingForLocation(selectedLocation?.id || '').scooter?.pricePerHour}/hr,
                    ${getPricingForLocation(selectedLocation?.id || '').scooter?.pricePerDay}/day
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={bookingDetails.duration} onValueChange={(value) => setBookingDetails({ ...bookingDetails, duration: value as 'hour' | 'day' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hourly</SelectItem>
                  <SelectItem value="day">Full Day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bookingDetails.duration === 'hour' && (
              <div className="space-y-2">
                <Label>Number of Hours</Label>
                <Select value={bookingDetails.hours} onValueChange={(value) => setBookingDetails({ ...bookingDetails, hours: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h} {h === 1 ? 'hour' : 'hours'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Total Cost:
                </span>
                <span className="text-indigo-600">${calculateCost()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBooking}>
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
