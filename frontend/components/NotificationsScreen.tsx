import React from 'react';
import { ChevronLeft, Bell, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    title: 'Convert Approved',
    message: 'Sarah Johnson has been approved by Parish Admin',
    time: '2 hours ago',
    color: 'green'
  },
  {
    id: 2,
    type: 'reminder',
    icon: Calendar,
    title: 'Follow-up Reminder',
    message: 'Visit 4 scheduled with Michael Adebayo tomorrow',
    time: '5 hours ago',
    color: 'blue'
  },
  {
    id: 3,
    type: 'alert',
    icon: AlertCircle,
    title: 'Pending Action',
    message: '3 converts waiting for approval in Grace Parish',
    time: '1 day ago',
    color: 'orange'
  },
  {
    id: 4,
    type: 'info',
    icon: Users,
    title: 'New Convert Added',
    message: 'Grace Okonkwo added by Jane Smith',
    time: '2 days ago',
    color: 'purple'
  },
  {
    id: 5,
    type: 'success',
    icon: CheckCircle,
    title: 'Milestone Reached',
    message: 'David Williams completed Visit 8 of 8',
    time: '3 days ago',
    color: 'green'
  }
];

export default function NotificationsScreen({ onNavigate }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => onNavigate('dashboard')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-700',
            blue: 'bg-blue-100 text-blue-700',
            orange: 'bg-orange-100 text-orange-700',
            purple: 'bg-purple-100 text-purple-700'
          };

          return (
            <div key={notification.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[notification.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-sm text-gray-500 text-center">
            You're all caught up! We'll notify you when there's something new.
          </p>
        </div>
      )}
    </div>
  );
}
