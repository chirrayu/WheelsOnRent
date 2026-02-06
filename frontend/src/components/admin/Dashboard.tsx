import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bike, Users, MapPin, Activity } from 'lucide-react';
import { getStoredData } from '../../utils/mockData';

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    inUse: 0,
    available: 0,
    maintenance: 0
  });

  useEffect(() => {
    const vehiclesData = getStoredData('vehicles', []);
    const locationsData = getStoredData('locations', []);
    
    setVehicles(vehiclesData);
    setLocations(locationsData);

    setStats({
      totalVehicles: vehiclesData.length,
      inUse: vehiclesData.filter((v: any) => v.status === 'in-use').length,
      available: vehiclesData.filter((v: any) => v.status === 'available').length,
      maintenance: vehiclesData.filter((v: any) => v.status === 'maintenance').length,
    });
  }, []);

  const getLocationName = (locationId: string) => {
    const location = locations.find((l: any) => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const inUseVehicles = vehicles.filter((v: any) => v.status === 'in-use');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of vehicle fleet and usage</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Vehicles
            </CardTitle>
            <Bike className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Use
            </CardTitle>
            <Activity className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-600">{stats.inUse}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available
            </CardTitle>
            <Bike className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-blue-600">{stats.available}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Maintenance
            </CardTitle>
            <MapPin className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-orange-600">{stats.maintenance}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles in Use Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles Currently in Use</CardTitle>
        </CardHeader>
        <CardContent>
          {inUseVehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No vehicles currently in use
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Vehicle ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Model
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Booked Until
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inUseVehicles.map((vehicle: any) => (
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
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {vehicle.currentUser}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {vehicle.bookedUntil}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          In Use
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
