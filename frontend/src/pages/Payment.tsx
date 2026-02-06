import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Upload, MapPin, Bike, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getStoredData, setStoredData } from '../utils/mockData';

export default function Payment({ user }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!bookingData) {
    navigate('/user/dashboard');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setLicenseFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!licenseFile) {
      toast.error('Please upload your driver\'s license');
      return;
    }

    setIsProcessing(true);

    // Simulate upload and processing
    setTimeout(() => {
      // Store the booking with DL info
      const bookings = getStoredData('bookings', []);
      const newBooking = {
        ...bookingData,
        driverLicense: {
          image: licensePreview,
          uploadedAt: new Date().toISOString(),
          verified: false,
          fileName: licenseFile.name
        }
      };
      
      bookings.push(newBooking);
      setStoredData('bookings', bookings);

      // Update vehicle status
      const vehicles = getStoredData('vehicles', []);
      const updatedVehicles = vehicles.map((v: any) => 
        v.id === bookingData.vehicleId 
          ? { 
              ...v, 
              status: 'in-use', 
              currentUser: user.name,
              currentUserId: user.id,
              bookedUntil: bookingData.endTime 
            }
          : v
      );
      setStoredData('vehicles', updatedVehicles);

      setIsProcessing(false);
      toast.success('Payment processed! Your booking is confirmed.');
      navigate('/user/bookings');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-900">Complete Your Booking</h1>
          <Button variant="outline" onClick={() => navigate('/user/dashboard')}>
            Cancel
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{bookingData.locationName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Bike className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium capitalize">
                    {bookingData.vehicleType} - {bookingData.vehicleModel}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{bookingData.duration}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {bookingData.startTime} - {bookingData.endTime}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2 font-semibold">
                    <DollarSign className="w-5 h-5" />
                    Total Amount
                  </span>
                  <span className="font-semibold text-indigo-600">
                    ${bookingData.totalCost}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver's License Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Driver's License Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Verification Required</p>
                    <p className="mt-1">Please upload a clear photo of your driver's license. Our system will verify it before confirming your booking.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">Upload Driver's License</Label>
                <Input
                  id="license"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">
                  Maximum file size: 5MB. Accepted formats: JPG, PNG, JPEG
                </p>
              </div>

              {licensePreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={licensePreview}
                      alt="Driver's License Preview"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    License uploaded successfully
                  </div>
                </div>
              )}

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Your data is protected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 mb-1">Total Payment</p>
                <p className="text-3xl font-semibold">${bookingData.totalCost}</p>
              </div>
              <Button
                size="lg"
                onClick={handleConfirmPayment}
                disabled={!licenseFile || isProcessing}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
