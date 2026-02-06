import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MapPin, Bike, Calendar, DollarSign, Clock } from 'lucide-react';
import { bookingsAPI, locationsAPI } from '../../utils/api';
import { User } from '../../utils/mockData';
import { toast } from 'sonner';

interface Booking {
  id: string;
  userId: string;
  locationId: string;
  status: string;
  vehicleType: string;
  vehicleModel: string;
  bookingDate: string;
  duration: string;
  totalCost: number;
  startTime: string;
  endTime: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface BookingHistoryProps {
  user: User;
}

export default function BookingHistory({ user }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const bookingsResponse = await bookingsAPI.getUserBookings(user.id);
      if (bookingsResponse.success && bookingsResponse.data) {
        setBookings(bookingsResponse.data.sort((a: any, b: any) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()));
      }

      const locationsResponse = await locationsAPI.getAll();
      if (locationsResponse.success && locationsResponse.data) {
        setLocations(locationsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load history', error);
      toast.error('Failed to load booking history');
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  const getLocationAddress = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    return location ? location.address : '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Booking History</h1>
        <p className="text-gray-600 mt-1">View all your past and active bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Bike className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No bookings yet</p>
              <p className="text-sm mt-1">Start exploring locations and book your first ride!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      {getLocationName(booking.locationId)}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {getLocationAddress(booking.locationId)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bike className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium capitalize">
                          {booking.vehicleType} - {booking.vehicleModel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Booking Date</p>
                        <p className="font-medium">{booking.bookingDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{booking.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="font-medium">${booking.totalCost}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Time</p>
                      <p className="font-medium">{booking.startTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Time</p>
                      <p className="font-medium">{booking.endTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
