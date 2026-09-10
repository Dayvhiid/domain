import React, { useState, useEffect } from 'react';
import { ChevronLeft, Phone, Mail, Edit, Loader2, CheckCircle2, Circle, Clock } from 'lucide-react';
import BottomNav from './BottomNav';
import { convertService, Convert } from '../services/convertService';

const VISIT_TITLES = [
  'Welcome & Introduction',
  'Assurance of Salvation',
  'The New Birth',
  'The Word of God',
  'Prayer',
  'The Holy Spirit',
  'Water Baptism',
  'Church & Fellowship'
];

// Utility function to format ISO date strings to human-readable format
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

export default function ConvertDetailsScreen({ onNavigate, convertId }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [convert, setConvert] = useState<Convert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConvertDetails();
  }, [convertId]);

  const fetchConvertDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await convertService.getConvertDetails(convertId);
      setConvert(data);
    } catch (err) {
      setError('Failed to load convert details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitToggle = async (visitNum) => {
    setIsUpdating(true);
    try {
      await convertService.updateVisitStatus(convertId, visitNum);
      // Refresh data
      await fetchConvertDetails();
    } catch (err) {
      alert('Failed to update visit status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateMilestones = async (milestones) => {
    setIsUpdating(true);
    try {
      // The backend likely expects the milestone within a spiritualGrowth object
      // or just as a flat object. We'll send it as requested by the plan.
      await convertService.updateMilestones(convertId, milestones);

      // Refresh data - but let's update local state optimistically too
      setConvert(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          spiritualGrowth: {
            ...(prev.spiritualGrowth || {}),
            ...milestones
          }
        };
      });

      await fetchConvertDetails();
    } catch (err) {
      alert('Failed to update milestones.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
        <p className="text-gray-600">Loading convert details...</p>
      </div>
    );
  }

  if (error || !convert) {
    return (
      <div className="min-h-screen bg-white p-6">
        <button onClick={() => onNavigate('converts-list')} className="mb-6 flex items-center gap-2 text-gray-600">
          <ChevronLeft className="w-5 h-5" />
          Back to List
        </button>
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center">
          {error || 'Convert not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => onNavigate('converts-list')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Convert Details</h1>
      </div>

      {/* Profile Summary Card */}
      <div className="px-6 py-6 border-b border-gray-100 relative">
        {isUpdating && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-2xl">
            <Loader2 className="w-6 h-6 text-blue-700 animate-spin" />
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-semibold text-blue-700">
              {convert.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{convert.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Phone className="w-4 h-4" />
              <span>{convert.phone}</span>
            </div>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">
              {convert.stage || 'New'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-100 flex gap-1">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'personal'
            ? 'bg-blue-700 text-white'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          Personal Info
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'visits'
            ? 'bg-blue-700 text-white'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          Follow-up Visits
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'growth'
            ? 'bg-blue-700 text-white'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
        >
          Spiritual Growth
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
              <button
                onClick={() => onNavigate('edit-convert', convertId)}
                className="flex items-center gap-1 text-sm text-blue-700 hover:underline"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                <p className="text-sm text-gray-900">{convert.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{convert.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                <p className="text-sm text-gray-900">{convert.whatsapp || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-900">{convert.houseAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Date Born Again</p>
                <p className="text-sm text-gray-900">{formatDate(convert.dateBornAgain)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Age Group</p>
                <p className="text-sm text-gray-900 capitalize">{convert.ageGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Gender</p>
                <p className="text-sm text-gray-900 capitalize">{convert.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Marital Status</p>
                <p className="text-sm text-gray-900 capitalize">{convert.maritalStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Career/Occupation</p>
                <p className="text-sm text-gray-900">{convert.career || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visits' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Follow-up Visits Progress</h3>

            {VISIT_TITLES.map((title, index) => {
              const visitNum = index + 1;
              const isCompleted = (convert.visits && convert.visits.includes(visitNum)) ||
                (convert.followUpVisits && convert.followUpVisits.find((v: { visitNumber: number; isCompleted: boolean }) => v.visitNumber === visitNum)?.isCompleted);
              return (
                <div
                  key={visitNum}
                  onClick={() => !isUpdating && handleVisitToggle(visitNum)}
                  className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors ${isCompleted ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${isCompleted ? 'text-blue-900' : 'text-gray-900'}`}>
                      Visit {visitNum}: {title}
                    </h4>
                    {isCompleted && (
                      <p className="text-xs text-blue-600 mt-0.5">Completed</p>
                    )}
                  </div>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-700 shadow-sm" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Spiritual Growth Milestones</h3>

            {[
              { id: 'believerClass', label: 'Believer Class' },
              { id: 'waterBaptism', label: 'Water Baptism' },
              { id: 'workersTraining', label: 'Workers-in-Training' }
            ].map((milestone) => {
              const status = convert.spiritualGrowth?.[milestone.id as keyof NonNullable<Convert['spiritualGrowth']>] || 'NotStarted';
              return (
                <div key={milestone.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">{milestone.label}</h4>
                    {status === 'Completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-700" />
                    ) : status === 'InProgress' ? (
                      <Clock className="w-5 h-5 text-orange-500 animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <select
                    disabled={isUpdating}
                    value={status}
                    onChange={(e) => handleUpdateMilestones({ [milestone.id]: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white transition-colors ${status === 'Completed' ? 'border-blue-200 bg-blue-50/30' :
                      status === 'InProgress' ? 'border-orange-200 bg-orange-50/30' :
                        'border-gray-200'
                      }`}
                  >
                    <option value="NotStarted">Not Started</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="converts" onNavigate={onNavigate} />
    </div>
  );
}