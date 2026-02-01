// Mock users
export const mockUsers = [
  {
    id: '1',
    email: 'admin@wheelonroad.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    phone: '+1234567890',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'user123',
    name: 'John Doe',
    role: 'user',
    phone: '+1234567891',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    email: 'team@wheelonroad.com',
    password: 'team123',
    name: 'Team Manager',
    role: 'team',
    phone: '+1234567892',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  }
];

// Mock locations
export const mockLocations = [
  {
    id: '1',
    name: 'Downtown Station',
    address: '123 Main Street, City Center',
    lat: 40.7128,
    lng: -74.0060,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
    isActive: true
  },
  {
    id: '2',
    name: 'Airport Hub',
    address: '456 Airport Road, Terminal 2',
    lat: 40.6413,
    lng: -73.7781,
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
    isActive: true
  },
  {
    id: '3',
    name: 'Beach Side Station',
    address: '789 Ocean Avenue, Beach Front',
    lat: 40.5795,
    lng: -73.8264,
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
    isActive: true
  },
  {
    id: '4',
    name: 'University Campus',
    address: '321 College Drive, Campus Center',
    lat: 40.8075,
    lng: -73.9626,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop',
    isActive: true
  }
];

// Mock pricing data
export const mockPricing = [
  {
    id: '1',
    locationId: '1',
    vehicleType: 'bike',
    pricePerHour: 5,
    pricePerDay: 30
  },
  {
    id: '2',
    locationId: '1',
    vehicleType: 'scooter',
    pricePerHour: 8,
    pricePerDay: 50
  },
  {
    id: '3',
    locationId: '2',
    vehicleType: 'bike',
    pricePerHour: 6,
    pricePerDay: 35
  },
  {
    id: '4',
    locationId: '2',
    vehicleType: 'scooter',
    pricePerHour: 10,
    pricePerDay: 60
  },
  {
    id: '5',
    locationId: '3',
    vehicleType: 'bike',
    pricePerHour: 5,
    pricePerDay: 28
  },
  {
    id: '6',
    locationId: '3',
    vehicleType: 'scooter',
    pricePerHour: 9,
    pricePerDay: 55
  },
  {
    id: '7',
    locationId: '4',
    vehicleType: 'bike',
    pricePerHour: 4,
    pricePerDay: 25
  },
  {
    id: '8',
    locationId: '4',
    vehicleType: 'scooter',
    pricePerHour: 7,
    pricePerDay: 45
  }
];

// Mock vehicles
export const mockVehicles = [
  {
    id: 'V001',
    type: 'bike',
    model: 'Mountain Pro X1',
    locationId: '1',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2026-01-15'
  },
  {
    id: 'V002',
    type: 'bike',
    model: 'City Cruiser 200',
    locationId: '1',
    status: 'in-use',
    condition: 'good',
    lastMaintenance: '2026-01-10',
    currentUser: 'John Doe',
    bookedUntil: '2026-02-01 18:00'
  },
  {
    id: 'V003',
    type: 'scooter',
    model: 'Urban Glide S3',
    locationId: '1',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2026-01-20'
  },
  {
    id: 'V004',
    type: 'scooter',
    model: 'Speed Master Pro',
    locationId: '1',
    status: 'in-use',
    condition: 'good',
    lastMaintenance: '2026-01-12',
    currentUser: 'Sarah Smith',
    bookedUntil: '2026-02-01 20:00'
  },
  {
    id: 'V005',
    type: 'bike',
    model: 'Trail Blazer X2',
    locationId: '2',
    status: 'available',
    condition: 'good',
    lastMaintenance: '2026-01-18'
  },
  {
    id: 'V006',
    type: 'bike',
    model: 'City Cruiser 200',
    locationId: '2',
    status: 'maintenance',
    condition: 'fair',
    lastMaintenance: '2026-01-25'
  },
  {
    id: 'V007',
    type: 'scooter',
    model: 'Eco Rider E1',
    locationId: '2',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2026-01-22'
  },
  {
    id: 'V008',
    type: 'scooter',
    model: 'Urban Glide S3',
    locationId: '2',
    status: 'available',
    condition: 'good',
    lastMaintenance: '2026-01-19'
  },
  {
    id: 'V009',
    type: 'bike',
    model: 'Mountain Pro X1',
    locationId: '3',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2026-01-21'
  },
  {
    id: 'V010',
    type: 'scooter',
    model: 'Speed Master Pro',
    locationId: '3',
    status: 'in-use',
    condition: 'excellent',
    lastMaintenance: '2026-01-23',
    currentUser: 'Mike Johnson',
    bookedUntil: '2026-02-02 12:00'
  },
  {
    id: 'V011',
    type: 'bike',
    model: 'City Cruiser 200',
    locationId: '4',
    status: 'available',
    condition: 'good',
    lastMaintenance: '2026-01-17'
  },
  {
    id: 'V012',
    type: 'scooter',
    model: 'Eco Rider E1',
    locationId: '4',
    status: 'available',
    condition: 'excellent',
    lastMaintenance: '2026-01-24'
  }
];

// Mock bookings
export const mockBookings = [
  {
    id: 'B001',
    userId: '2',
    vehicleId: 'V002',
    locationId: '1',
    vehicleType: 'bike',
    vehicleModel: 'City Cruiser 200',
    startTime: '2026-02-01 10:00',
    endTime: '2026-02-01 18:00',
    duration: '8 hours',
    totalCost: 40,
    status: 'active',
    bookingDate: '2026-02-01'
  },
  {
    id: 'B002',
    userId: '2',
    vehicleId: 'V005',
    locationId: '2',
    vehicleType: 'bike',
    vehicleModel: 'Trail Blazer X2',
    startTime: '2026-01-28 09:00',
    endTime: '2026-01-28 17:00',
    duration: '8 hours',
    totalCost: 48,
    status: 'completed',
    bookingDate: '2026-01-28'
  },
  {
    id: 'B003',
    userId: '2',
    vehicleId: 'V003',
    locationId: '1',
    vehicleType: 'scooter',
    vehicleModel: 'Urban Glide S3',
    startTime: '2026-01-25 14:00',
    endTime: '2026-01-25 18:00',
    duration: '4 hours',
    totalCost: 32,
    status: 'completed',
    bookingDate: '2026-01-25'
  },
  {
    id: 'B004',
    userId: '2',
    vehicleId: 'V009',
    locationId: '3',
    vehicleType: 'bike',
    vehicleModel: 'Mountain Pro X1',
    startTime: '2026-01-20 08:00',
    endTime: '2026-01-21 08:00',
    duration: '1 day',
    totalCost: 28,
    status: 'completed',
    bookingDate: '2026-01-20'
  }
];

// Helper functions to manage mock data in localStorage
export const getStoredData = (key: string, defaultData: any) => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultData;
};

export const setStoredData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize mock data
export const initializeMockData = () => {
  if (!localStorage.getItem('locations')) {
    setStoredData('locations', mockLocations);
  }
  if (!localStorage.getItem('pricing')) {
    setStoredData('pricing', mockPricing);
  }
  if (!localStorage.getItem('vehicles')) {
    setStoredData('vehicles', mockVehicles);
  }
  if (!localStorage.getItem('bookings')) {
    setStoredData('bookings', mockBookings);
  }
  if (!localStorage.getItem('users')) {
    setStoredData('users', mockUsers);
  }
};
