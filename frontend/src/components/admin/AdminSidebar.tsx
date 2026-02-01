import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, DollarSign, HelpCircle } from 'lucide-react';

export default function AdminSidebar() {
  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/vehicles', icon: Car, label: 'Vehicle Management' },
    { path: '/admin/pricing', icon: DollarSign, label: 'Price Update' },
    { path: '/admin/help', icon: HelpCircle, label: 'Help' },
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
