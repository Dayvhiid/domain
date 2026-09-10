import React from 'react';
import { Home, Users, BarChart3, User } from 'lucide-react';

export default function BottomNav({ active, onNavigate }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', screen: 'dashboard' },
    { id: 'converts', icon: Users, label: 'Converts', screen: 'converts-list' },
    { id: 'reports', icon: BarChart3, label: 'Reports', screen: 'reports' },
    { id: 'profile', icon: User, label: 'Profile', screen: 'profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.screen)}
              className="flex flex-col items-center gap-1 py-1"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? 'text-blue-700' : 'text-gray-400'
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-blue-700 font-medium' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
