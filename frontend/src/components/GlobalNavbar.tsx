import { Bike, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface GlobalNavbarProps {
  user: any;
  onLogout: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function GlobalNavbar({ user, onLogout, sidebarOpen, onToggleSidebar }: GlobalNavbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <Bike className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">WheelOnRoad</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <Avatar>
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
