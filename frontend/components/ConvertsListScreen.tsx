import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Plus, Loader2 } from 'lucide-react';
import BottomNav from './BottomNav';
import { convertService, Convert } from '../services/convertService';
import { User } from '../services/authService';

export default function ConvertsListScreen({ onNavigate, user }: { onNavigate: any; user?: User | null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [converts, setConverts] = useState<Convert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchConverts = async () => {
      setIsLoading(true);
      try {
        // Determine filters based on user role
        const filters: any = {};
        if (user && user.role) {
          // If parish admin, only fetch converts for their parish
          if (user.role === 'parish_admin' && user.parishId) {
            filters.parishId = user.parishId;
          }
          // If area admin, only fetch converts for their area
          else if (user.role === 'area_admin' && user.areaId) {
            filters.areaId = user.areaId;
          }
        }

        const data = await convertService.listConverts(page, searchQuery, filters);
        console.log('Converts API response:', data);

        // Robust extraction of the list from various possible response structures
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && typeof data === 'object') {
          list = data.converts || data.data || data.results || data.items || [];

          // If it's still not an array but data itself is the list wrapped in an object field
          if (!Array.isArray(list) && data.result) {
            list = data.result;
          }
        }

        setConverts(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Error fetching converts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchConverts();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, page]);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">All Converts</h1>
          <button
            onClick={() => onNavigate('add-convert')}
            className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
            placeholder="Search converts..."
          />
        </div>
      </div>

      {/* Converts List */}
      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
          </div>
        ) : converts.length > 0 ? (
          converts.map((convert) => (
            <button
              key={convert.id || convert._id}
              onClick={() => onNavigate('convert-details', convert.id || convert._id)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{convert.name}</h3>
                    {convert.status && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${convert.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : convert.status === 'inactive'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {convert.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{convert.phone}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {/* <span>{convert.stage || 'Initial'}</span> */}
                    {/* <span>•</span> */}
                    {/* <span>{convert.lastUpdate || 'Just now'}</span> */}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>

              {/* Progress Dots */}
              <div className="mt-4 flex items-center gap-1.5">
                {/* {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const isCompleted = convert.followUpVisits?.find(v => v.visitNumber === num)?.isCompleted ?? false;
                  return (
                    <div
                      key={num}
                      className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`}
                      title={`Visit ${num}: ${isCompleted ? 'Completed' : 'Not yet visited'}`}
                    />
                  );
                })} */}
                <span className="ml-2 text-[10px] text-gray-400 font-medium">
                  {(convert.followUpVisits?.filter(v => v.isCompleted).length ?? 0)} / 8
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No converts found.
          </div>
        )}
      </div>

      <BottomNav active="converts" onNavigate={onNavigate} />
    </div>
  );
}