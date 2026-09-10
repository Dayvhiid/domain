import React, { useState } from 'react';
import { X, Shield, Building2, MapPin, Globe, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';

// Helper to normalize role names (handle both underscore and hyphen)
const normalizeRole = (role: string) => {
  if (!role) return '';
  return role.replace('-', '_').toLowerCase();
};

// Helper to check if user has one of the allowed roles
const hasRole = (userRole: string, allowedRoles: string[]) => {
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.some(role => normalizeRole(role) === normalizedUserRole);
};

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  user: any;
}

export default function SideMenu({ isOpen, onClose, onNavigate, user: propUser }: SideMenuProps) {
  const [adminExpanded, setAdminExpanded] = useState(false);

  // Get user role safely - prefer prop, fallback to localStorage with correct key
  let user = propUser;
  if (!user) {
    const userStr = localStorage.getItem('swa_user');
    user = userStr ? JSON.parse(userStr) : null;
  }

  // Debug log
  console.log('SideMenu Render - User Role:', user?.role);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Side Menu */}
      <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Admin Access Section */}
          {user?.role && hasRole(user.role, ['parish_admin', 'area_admin', 'zonal_admin', 'super_admin']) && (
            <div className="flex-1 px-6 py-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Admin Hub - Dynamic title based on role */}
                {user?.role && hasRole(user.role, ['parish_admin', 'area_admin', 'zonal_admin', 'super_admin']) && (
                  <button
                    onClick={() => {
                      onNavigate('user-management');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-5 py-4 bg-blue-700 text-white rounded-2xl hover:bg-blue-800 transition-all shadow-md mb-8 ring-1 ring-blue-600/50"
                    style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold leading-none">
                          {user.role === 'zonal_admin' ? 'Zonal Admin Hub' : 
                           user.role === 'area_admin' ? 'Area Admin Hub' :
                           user.role === 'parish_admin' ? 'Parish Admin Hub' : 'Super Admin Hub'}
                        </span>
                        <span className="text-[10px] text-blue-100 font-medium mt-1">Manage Users & Access</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 rotate-180 text-blue-200" />
                  </button>
                )}

                {/* Other Admin Access Dropdown */}
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-700" />
                    <span className="text-sm font-semibold text-blue-900">General Admin Access</span>
                  </div>
                  {adminExpanded ? (
                    <ChevronUp className="w-5 h-5 text-blue-700" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-700" />
                  )}
                </button>

                {/* Dropdown Content */}
                {adminExpanded && (
                  <div className="space-y-2 pl-2">
                    {hasRole(user.role, ['parish_admin', 'super_admin']) && (
                      <button
                        onClick={() => {
                          onNavigate('parish-admin');
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Building2 className="w-5 h-5" />
                        Parish Admin
                      </button>
                    )}
                    {hasRole(user.role, ['area_admin', 'super_admin']) && (
                      <button
                        onClick={() => {
                          onNavigate('area-admin');
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <MapPin className="w-5 h-5" />
                        Area Admin
                      </button>
                    )}
                    {hasRole(user.role, ['zonal_admin', 'super_admin']) && (
                      <button
                        onClick={() => {
                          onNavigate('zonal-admin');
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Globe className="w-5 h-5" />
                        Zonal Admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}