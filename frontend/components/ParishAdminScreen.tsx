import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ChevronLeft, Loader2, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import BottomNav from './BottomNav';
import { dashboardService, DashboardStats } from '../services/dashboardService';

export default function ParishAdminScreen({ onNavigate, user }: { onNavigate: any, user: any }) {
  const [selectedChurch, setSelectedChurch] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedChurch]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    // In a real app, we'd pass parishId to these calls.
    const filters: any = {};
    if (user?.parishId) {
      filters.parishId = user.parishId;
    }

    try {
      const [summaryStats, growthTrends] = await Promise.all([
        dashboardService.getSummaryStats(filters),
        dashboardService.getGrowthTrends(filters)
      ]);
      setStats(summaryStats);
      setTrends(growthTrends);
    } catch (err) {
      setError('Failed to load parish data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    alert('Generating parish report...');
  };

  const handleValidateSoulWinners = () => {
    onNavigate('user-management');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
        <p className="text-gray-600">Loading parish data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <button onClick={() => onNavigate('dashboard')} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Parish Admin</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Church Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Select Church</label>
          <select
            value={selectedChurch}
            onChange={(e: any) => setSelectedChurch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
          >
            <option value="">All Churches</option>
            {/* Sub-churches not yet supported in schema, showing placeholder */}
            <option value="main">Main Parish</option>
          </select>
        </div>

        {/* PRIMARY: Pending Soul Winners Card */}
        {stats?.pendingSoulWinnersCount !== undefined && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Action Required</p>
                  <p className="text-sm text-amber-900 font-medium">Soul Winners Pending Validation</p>
                </div>
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-900 mb-4">{stats.pendingSoulWinnersCount}</p>
            <button
              onClick={handleValidateSoulWinners}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              View & Validate Accounts
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Converts</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalConverts || 0}</p>
            <p className="text-xs text-green-600 mt-1">Overall</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Active Follow-ups</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeConverts || 0}</p>
            <p className="text-xs text-blue-600 mt-1">In Progress</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Retention Rate</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.retentionRate || '0%'}</p>
            <p className="text-xs text-green-600 mt-1">Growth</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.completedConverts || 0}</p>
            <p className="text-xs text-purple-600 mt-1">Stabilized</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Converts Growth Trend</h3>
          {trends.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No trend data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ fill: '#1e40af', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Generate Report Button */}
        <button
          onClick={handleGenerateReport}
          className="w-full bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Generate Parish Report
        </button>
      </div>

      <BottomNav active="reports" onNavigate={onNavigate} />
    </div>
  );
}