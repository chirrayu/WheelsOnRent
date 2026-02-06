import { NavLink } from 'react-router';
import { LayoutDashboard, History, HelpCircle } from 'lucide-react';

export default function UserSidebar() {
  const navItems = [
    { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/user/bookings', icon: History, label: 'Booking History' },
    { path: '/user/help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}