import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Eye, CheckCircle, XCircle, User, MapPin, Bike, Calendar, DollarSign } from 'lucide-react';
import { getStoredData, setStoredData } from '../../utils/mockData';
import { toast } from 'sonner@2.0.3';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const bookingsData = getStoredData('bookings', []);
    const locationsData = getStoredData('locations', []);
    const usersData = getStoredData('users', []);
    
    // Filter bookings that have driver's license
    const bookingsWithDL = bookingsData.filter((b: any) => b.driverLicense);
    setBookings(bookingsWithDL);
    setLocations(locationsData);
    setUsers(usersData);
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((l: any) => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const getUserInfo = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user || { name: 'Unknown User', email: '', phone: '' };
  };

  const handleVerifyLicense = (bookingId: string, verified: boolean) => {
    const updatedBookings = bookings.map((b: any) =>
      b.id === bookingId
        ? {
            ...b,
            driverLicense: {
              ...b.driverLicense,
              verified,
              verifiedAt: new Date().toISOString()
            }
          }
        : b
    );
    
    setBookings(updatedBookings);
    
    // Update in storage
    const allBookings = getStoredData('bookings', []);
    const updatedAllBookings = allBookings.map((b: any) =>
      b.id === bookingId
        ? {
            ...b,
            driverLicense: {
              ...b.driverLicense,
              verified,
              verifiedAt: new Date().toISOString()
            }
          }
        : b
    );
    setStoredData('bookings', updatedAllBookings);
    
    toast.success(verified ? 'Driver\'s license verified!' : 'Driver\'s license rejected');
    setSelectedLicense(null);
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

  const getVerificationBadge = (driverLicense: any) => {
    if (driverLicense.verified === true) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    } else if (driverLicense.verified === false) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          Pending Verification
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Bookings & Verification</h1>
        <p className="text-gray-600 mt-1">Manage bookings and verify driver's licenses</p>
      </div>

      <div className="grid gap-6">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                No bookings with driver's licenses yet
              </div>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking: any) => {
            const userInfo = getUserInfo(booking.userId);
            return (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        {getVerificationBadge(booking.driverLicense)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{userInfo.name}</span>
                        <span>•</span>
                        <span>{userInfo.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingBooking(booking)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{getLocationName(booking.locationId)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bike className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium capitalize">
                          {booking.vehicleType} - {booking.vehicleModel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cost</p>
                        <p className="font-medium">${booking.totalCost}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver's License Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Driver's License Verification
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLicense(booking)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View DL
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Uploaded</span>
                        <span className="font-medium">
                          {new Date(booking.driverLicense.uploadedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Status</span>
                        {getVerificationBadge(booking.driverLicense)}
                      </div>
                    </div>

                    {booking.driverLicense.verified === undefined && (
                      <div className="mt-4 flex gap-3">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerifyLicense(booking.id, true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify License
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleVerifyLicense(booking.id, false)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject License
                        </Button>
                      </div>
                    )}

                    {booking.driverLicense.verified === true && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <div>
                            <p className="font-medium">License Verified</p>
                            <p className="text-sm">
                              Verified on {new Date(booking.driverLicense.verifiedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {booking.driverLicense.verified === false && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <div>
                            <p className="font-medium">License Rejected</p>
                            <p className="text-sm">
                              Rejected on {new Date(booking.driverLicense.verifiedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Driver's License View Dialog */}
      <Dialog open={!!selectedLicense} onOpenChange={() => setSelectedLicense(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Driver's License</DialogTitle>
            <DialogDescription>
              Review the uploaded driver's license
            </DialogDescription>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={selectedLicense.driverLicense.image}
                  alt="Driver's License"
                  className="w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">File Name</p>
                  <p className="font-medium">{selectedLicense.driverLicense.fileName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Uploaded</p>
                  <p className="font-medium">
                    {new Date(selectedLicense.driverLicense.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">User</p>
                  <p className="font-medium">{getUserInfo(selectedLicense.userId).name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  {getVerificationBadge(selectedLicense.driverLicense)}
                </div>
              </div>
              {selectedLicense.driverLicense.verified === undefined && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerifyLicense(selectedLicense.id, true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify License
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleVerifyLicense(selectedLicense.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject License
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={!!viewingBooking} onOpenChange={() => setViewingBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for booking #{viewingBooking?.id}
            </DialogDescription>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Booking ID</span>
                  <span className="font-medium">{viewingBooking.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Customer</span>
                  <span className="font-medium">{getUserInfo(viewingBooking.userId).name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-medium">{viewingBooking.duration}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Start Time</span>
                  <span className="font-medium">{viewingBooking.startTime}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">End Time</span>
                  <span className="font-medium">{viewingBooking.endTime}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
