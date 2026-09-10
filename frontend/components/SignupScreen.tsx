import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Loader2, Clock } from 'lucide-react';
import { authService } from '../services/authService';
import { churchService, HierarchyZone } from '../services/churchService';

export default function SignupScreen({ onSignup, onNavigateLogin }: { onSignup: any, onNavigateLogin: any }) {
  const publicRoles = [
    { value: 'soul_winner', label: 'Soul Winner' },
    { value: 'parish_admin', label: 'Parish Admin' },
    { value: 'area_admin', label: 'Area Admin' },
    { value: 'zonal_admin', label: 'Zonal Admin' },
  ];

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupSuccess, setIsSignupSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    zone: '',
    area: '',
    parish: '',
    role: ''
  });

  const [hierarchyTree, setHierarchyTree] = useState<HierarchyZone[]>([]);
  const [isHierarchyLoading, setIsHierarchyLoading] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    setIsHierarchyLoading(true);
    try {
      const data = await churchService.getHierarchyTree();
      setHierarchyTree(data);
    } catch (err) {
      console.error('Failed to fetch hierarchy tree', err);
    } finally {
      setIsHierarchyLoading(false);
    }
  };

  const handleZoneChange = (zoneId: string) => {
    handleChange('zone', zoneId);
    handleChange('area', '');
    handleChange('parish', '');
  };

  const handleAreaChange = (areaId: string) => {
    handleChange('area', areaId);
    handleChange('parish', '');
  };

  const selectedZone = hierarchyTree.find(z => z._id === formData.zone);
  const availableAreas = selectedZone ? selectedZone.areas : [];
  const selectedArea = availableAreas.find(a => a._id === formData.area);
  const availableParishes = selectedArea ? selectedArea.parishes : [];

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      setIsLoading(true);
      setError(null);
      try {
        // Map UI labels to API fields
        const signupData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          zonalId: formData.zone,
          areaId: formData.area,
          parishId: formData.parish
        };
        const response = await authService.signup(signupData);
        
        if (response.token) {
          onSignup(response);
        } else {
          setIsSignupSuccess(true);
        }
      } catch (err: any) {
        if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          const errorMessages = err.response.data.errors
            .map((e: any) => e.msg)
            .filter((msg: string) => msg)
            .join('. ');
          setError(errorMessages || 'Signup failed. Please check your information.');
        } else {
          setError(err.response?.data?.message || 'Signup failed. Please check your information.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isSignupSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 px-6 py-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-700" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Registration Successful!</h2>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 text-left">
              <p className="text-blue-900 font-medium mb-2">Account Pending Validation</p>
              <p className="text-blue-800/80 text-sm leading-relaxed">
                Thank you for registering. Your account has been created successfully, but it needs to be validated by a Super Admin before you can log in.
              </p>
              <p className="text-blue-800/80 text-sm mt-4 leading-relaxed">
                You will be able to access the dashboard once your zone's administrator approves your request. 
              </p>
            </div>

            <button
              onClick={onNavigateLogin}
              className="w-full bg-blue-700 text-white py-4 rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-sm"
            >
              Back to Login
            </button>
            
            <p className="mt-6 text-sm text-gray-500">
              Need help? Contact your zonal administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100">
        <button onClick={onNavigateLogin} className="flex items-center text-gray-600">
          <ChevronLeft className="w-5 h-5" />
          <span className="ml-1">Back</span>
        </button>
      </div>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h2>
          <p className="text-sm text-gray-500 mb-8">Step {step} of 2</p>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-blue-700' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-blue-700' : 'bg-gray-200'}`} />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter your phone number"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                  required
                  disabled={isLoading || isHierarchyLoading}
                >
                  <option value="">Select Zone</option>
                  {hierarchyTree.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Area</label>
                <select
                  value={formData.area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                  required
                  disabled={isLoading || isHierarchyLoading || !formData.zone}
                >
                  <option value="">Select Area</option>
                  {availableAreas.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Parish</label>
                <select
                  value={formData.parish}
                  onChange={(e) => handleChange('parish', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                  required
                  disabled={isLoading || isHierarchyLoading || !formData.area}
                >
                  <option value="">Select Parish</option>
                  {availableParishes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Role</option>
                  {publicRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Super Admin accounts are provisioned separately and are not available through public signup.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full mt-8 bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              step === 1 ? 'Continue' : 'Complete Signup'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
