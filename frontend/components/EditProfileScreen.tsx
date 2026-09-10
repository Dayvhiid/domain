import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, User, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';

export default function EditProfileScreen({ onNavigate, user, onSaveProfile }) {
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePicture: user?.profilePicture || null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      const updateData = {
        name,
        email: formData.email,
        phone: formData.phone,
        profilePicture: formData.profilePicture
      };

      const response = await userService.updateProfile(updateData);

      if (onSaveProfile) {
        onSaveProfile(response);
      }

      alert('Profile updated successfully!');
      onNavigate('profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return 'JD';
  };

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => onNavigate('profile')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>
            <button
              onClick={handleImageClick}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-800 transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Click camera icon to change photo</p>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </div>

        {/* Role & Position */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Role & Position</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Current Role</p>
            <p className="text-sm font-medium text-gray-900">{formData.role}</p>
            <p className="text-xs text-gray-400 mt-2">Role is set during registration</p>
          </div>
        </div>

        {/* Church Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Church Details</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Zone</p>
              <p className="text-sm font-medium text-gray-900">{formData.zone}</p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-1">Area</p>
              <p className="text-sm font-medium text-gray-900">{formData.area}</p>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-500 mb-1">Parish</p>
              <p className="text-sm font-medium text-gray-900">{formData.parish}</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">Church details are set during registration</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}