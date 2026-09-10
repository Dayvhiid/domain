import React, { useState, useEffect } from 'react';
import { ChevronLeft, Download, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { convertService, Convert } from '../services/convertService';
import { User } from '../services/authService';

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

interface DetailedReportScreenProps {
  onNavigate: (screen: string) => void;
  filters?: {
    zone?: string;
    area?: string;
    parish?: string;
  };
}

interface ReportRow {
  id: string;
  soulWinner: string;
  convertName: string;
  dateBornAgain: string;
  dateRegistered: string;
  currentStatus: string;
  lastUpdate: string;
}

export default function DetailedReportScreen({ onNavigate, filters }: DetailedReportScreenProps) {
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: any = {};
      if (filters?.zone) apiFilters.zoneId = filters.zone;
      if (filters?.area) apiFilters.areaId = filters.area;
      if (filters?.parish) apiFilters.parishId = filters.parish;

      // Fetch all converts (you can add pagination later if needed)
      const response = await convertService.listConverts(1, '', apiFilters);
      const converts = response.converts || [];

      // Transform the data to match the report format
      const transformedData: ReportRow[] = converts.map((convert: any) => {
        // Get the soul winner info from user data if available
        const soulWinnerName = convert.soulWinnerId?.name || convert.soulWinnerName || 'N/A';

        // Get the most recent visit date as last update
        const lastVisitDate = convert.followUpVisits?.length > 0
          ? convert.followUpVisits
            .filter((v: any) => v.isCompleted && v.visitDate)
            .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())[0]?.visitDate
          : convert.createdAt;

        return {
          id: convert._id || convert.id,
          soulWinner: soulWinnerName,
          convertName: convert.name,
          dateBornAgain: convert.dateBornAgain,
          dateRegistered: convert.createdAt || convert.dateBornAgain,
          currentStatus: convert.status || 'Active',
          lastUpdate: lastVisitDate || convert.createdAt
        };
      });

      setReportData(transformedData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownload = () => {
    try {
      // Format data for Excel
      const dataToExport = reportData.map(row => ({
        'Soul Winner': row.soulWinner,
        'Convert Name': row.convertName,
        'Date Born Again': formatDate(row.dateBornAgain),
        'Date Registered': formatDate(row.dateRegistered),
        'Status': row.currentStatus,
        'Last Update': formatDate(row.lastUpdate)
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Report");

      // Generate file
      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `Convert data -- ${dateStr}.xlsx`);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => onNavigate('reports')} className="mr-3">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Detailed Report</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-700 animate-spin mb-4" />
            <p className="text-gray-600">Loading report data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-sm mb-4">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="inline-block min-w-full">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Soul Winner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Convert Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Date Born Again
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Date Registered
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                          Last Update
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((row, index) => (
                        <tr
                          key={row.id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {row.soulWinner}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                            {row.convertName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(row.dateBornAgain)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(row.dateRegistered)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${row.currentStatus === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : row.currentStatus === 'Pending'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {row.currentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(row.lastUpdate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full mt-6 bg-blue-700 text-white py-3 rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Excel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
