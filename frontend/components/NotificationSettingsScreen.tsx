import React, { useState, useEffect } from 'react';
import { ChevronLeft, Bell, CheckCircle, AlertCircle, Calendar, Users, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';

export default function NotificationSettingsScreen({ onNavigate }) {
  const [settings, setSettings] = useState({
    followUpReminders: true,
    pendingActions: true,
    newConverts: false,
    weeklyReports: true
  });
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [notifs, profile] = await Promise.all([
        userService.getNotifications(),
        // We can get settings from profile or a specific settings endpoint if it exists
        // For now, let's assume they are on the user object returned by profile
        // Since I don't see a getSettings endpoint, I'll mock the settings fetch or assume defaults
      ]);
      setNotifications(notifs);
    } catch (err) {
      setError('Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSetting = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setIsUpdating(true);
    try {
      await userService.updateNotificationSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      alert('Failed to update settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => onNavigate('profile')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Notification Settings</h1>
      </div>

      <div className="px-6 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Notification Preferences */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
            {isUpdating && <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />}
          </div>
          <div className="space-y-3">
            {[
              { id: 'followUpReminders', label: 'Follow-up Reminders', desc: 'Reminders for scheduled visits' },
              { id: 'pendingActions', label: 'Pending Actions', desc: 'Alerts for items needing attention' },
              { id: 'newConverts', label: 'New Converts', desc: 'Updates when new converts are added' },
              { id: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of weekly activities' },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl opacity-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
                <button
                  disabled={isUpdating}
                  onClick={() => toggleSetting(item.id)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[item.id] ? 'bg-blue-700' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.id] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Notifications</h2>
          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const colors = {
                  reminder: 'bg-blue-100 text-blue-700',
                  alert: 'bg-orange-100 text-orange-700',
                  info: 'bg-purple-100 text-purple-700',
                  success: 'bg-green-100 text-green-700'
                };
                const icons = {
                  reminder: Calendar,
                  alert: AlertCircle,
                  info: Users,
                  success: CheckCircle
                };
                const Icon = icons[notification.type] || Bell;
                const colorClass = colors[notification.type] || 'bg-gray-100 text-gray-700';

                return (
                  <div key={notification.id} className="p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
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
                          {notification.time || new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}