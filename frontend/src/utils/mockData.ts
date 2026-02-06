export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'team';
  password?: string; // Optional for when we strip it out
  image?: string;
}

// TODO: Replace with API calls to backend
// All data fetching should be done through API endpoints