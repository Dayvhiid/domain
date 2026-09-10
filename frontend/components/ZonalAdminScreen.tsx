import React, { useState, useEffect } from 'react';
import { Download, ChevronLeft, Loader2, AlertCircle, ChevronDown, ChevronUp, Users, UserCheck } from 'lucide-react';
import BottomNav from './BottomNav';
import { churchService } from '../services/churchService';

export default function ZonalAdminScreen({ onNavigate, user }: { onNavigate: any, user: any }) {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [details, setDetails] = useState<any>({ soulWinners: [], converts: [] });
  const [activeTab, setActiveTab] = useState<'soulWinners' | 'converts'>('soulWinners');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArea, setIsLoadingArea] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGlobalAreas();
  }, []);

  const fetchGlobalAreas = async () => {
    setIsLoading(true);
    try {
      const data = await churchService.getGlobalAreas();
      setAreas(data);
      if (data.length > 0) {
        handleSelectArea(data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch areas', err);
      setError('Failed to load areas list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectArea = async (areaId: string) => {
    setSelectedAreaId(areaId);
    setIsLoadingArea(true);
    setError(null);
    try {
      const [areaStats, areaDetails] = await Promise.all([
        churchService.getAreaStats(areaId),
        churchService.getAreaDetails(areaId)
      ]);
      setStats(areaStats);
      setDetails(areaDetails);
    } catch (err) {
      console.error('Failed to load area data', err);
      setError('Failed to load area details.');
    } finally {
      setIsLoadingArea(false);
    }
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => ({ ...prev, [areaId]: !prev[areaId] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center shadow-sm">
        <button onClick={() => onNavigate('dashboard')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Zonal Administration</h1>
      </div>

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto mt-6 px-6 gap-6">

        {/* Left Sidebar: Areas Accordion */}
        <div className="w-full md:w-1/3 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 px-1">Global Areas List</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-2 space-y-2 max-h-[70vh] overflow-y-auto">
            {areas.length === 0 ? (
              <p className="text-sm text-gray-500 p-4">No areas found.</p>
            ) : (
              areas.map((area: any) => {
                const isSelected = selectedAreaId === area._id;
                const isExpanded = expandedAreas[area._id];
                return (
                  <div key={area._id} className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectArea(area._id)}
                    >
                      <div>
                        <h3 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{area.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{area.parishes?.length || 0} Parishes</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleArea(area._id); }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-gray-50/50 border-t border-gray-100">
                        {area.parishes?.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {area.parishes.map((p: any) => (
                              <li
                                key={p._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate('reports', p._id);
                                }}
                                className="text-sm text-gray-600 flex items-center p-2 rounded-lg cursor-pointer hover:bg-white hover:text-blue-700 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mr-2" />
                                {p.name}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400 mt-2">No parishes in this area.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full md:w-2/3 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {isLoadingArea ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
            </div>
          ) : selectedAreaId ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-7 h-7 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Soul Winners</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalSoulWinners || 0}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-7 h-7 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Converts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalConverts || 0}</p>
                  </div>
                </div>
              </div>

              {/* Drill-down Tables */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                  <button
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'soulWinners' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/20' : 'text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('soulWinners')}
                  >
                    Soul Winners
                  </button>
                  <button
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-colors ${activeTab === 'converts' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/20' : 'text-gray-500 hover:bg-gray-50'}`}
                    onClick={() => setActiveTab('converts')}
                  >
                    Converts
                  </button>
                </div>

                <div className="p-0 overflow-x-auto">
                  {activeTab === 'soulWinners' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Name</th>
                          <th className="p-4 font-medium">Email</th>
                          <th className="p-4 font-medium">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {details.soulWinners.length === 0 ? (
                          <tr><td colSpan={3} className="p-6 text-center text-gray-500 text-sm">No soul winners found.</td></tr>
                        ) : (
                          details.soulWinners.map((sw: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-sm font-medium text-gray-900">{sw.name}</td>
                              <td className="p-4 text-sm text-gray-500">{sw.email}</td>
                              <td className="p-4 text-sm text-gray-500 capitalize">{sw.role?.replace('_', ' ')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activeTab === 'converts' && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Convert Name</th>
                          <th className="p-4 font-medium">Phone</th>
                          <th className="p-4 font-medium">Status</th>
                          <th className="p-4 font-medium">Stage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {details.converts.length === 0 ? (
                          <tr><td colSpan={4} className="p-6 text-center text-gray-500 text-sm">No converts found.</td></tr>
                        ) : (
                          details.converts.map((c: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-sm font-medium text-gray-900">{c.name || c.convertName}</td>
                              <td className="p-4 text-sm text-gray-500">{c.phone || 'N/A'}</td>
                              <td className="p-4">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {c.status || 'Unknown'}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-500">{c.stage || 'Initial'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <p className="text-gray-500">Select an area from the left to view details.</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="reports" onNavigate={onNavigate} />
    </div>
  );
}