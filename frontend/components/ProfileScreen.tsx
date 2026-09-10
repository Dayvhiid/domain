import React from 'react';
import { User, Mail, Phone, ChevronRight, Lock, Bell, LogOut } from 'lucide-react';
import BottomNav from './BottomNav';

export default function ProfileScreen({ onNavigate, onLogout, user }) {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Profile & Settings</h1>
      </div>

      {/* User Info Card */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.split(' ').map(n => n[0]).join('') || 'JD'
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{user?.name || 'John Doe'}</h2>
            <p className="text-sm text-gray-500">{user?.role || 'Soul Winner'}</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email || 'john.doe@email.com'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="px-6 py-6 space-y-2">
        <button
          onClick={() => onNavigate('edit-profile')}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-700" />
            </div>
            <span className="text-sm font-medium text-gray-900">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => onNavigate('change-password')}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-700" />
            </div>
            <span className="text-sm font-medium text-gray-900">Change Password</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Notification Settings - Hidden for now */}
        {/* <button
          onClick={() => onNavigate('notification-settings')}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-700" />
            </div>
            <span className="text-sm font-medium text-gray-900">Notification Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button> */}
      </div>

      {/* Additional Info - Hidden for now */}
      {/* <div className="px-6 py-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Church Details</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p>Zone: {user?.zone || 'North Zone'}</p>
            <p>Area: {user?.area || 'Central Area'}</p>
            <p>Parish: {user?.parish || 'Grace Parish'}</p>
          </div>
        </div>
      </div> */}

      {/* Logout Button */}
      <div className="px-6 py-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>

      <BottomNav active="profile" onNavigate={onNavigate} />
    </div>
  );
}