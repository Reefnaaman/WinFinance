'use client'

import React, { useState } from 'react';

interface ExportFilters {
  relevance_status?: string;
  status?: string;
  assigned_agent_id?: string;
  source?: string;
}

interface CSVExportProps {
  currentFilters?: ExportFilters;
  agents?: Array<{ id: string; name: string }>;
}

export default function CSVExport({ currentFilters = {}, agents = [] }: CSVExportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState<ExportFilters>(currentFilters);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });

      // Call export API
      const response = await fetch(`/api/export-csv?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsModalOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('שגיאה בייצוא הקובץ');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilter = (key: keyof ExportFilters) => {
    setExportFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setExportFilters(currentFilters);
  };

  const activeFiltersCount = Object.values(exportFilters).filter(v => v).length;

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-all flex items-center gap-2"
      >
        <span>📤</span> ייצוא לCSV
        {activeFiltersCount > 0 && (
          <span className="bg-blue-700 text-xs px-2 py-0.5 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Export Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">ייצוא נתונים לCSV</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Export Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">מידע על הייצוא:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• הקובץ יכלול את כל העמודות הזמינות</li>
                  <li>• התאריכים יוצגו בפורמט ישראלי</li>
                  <li>• הקובץ יתמוך בטקסט עברי</li>
                  <li>• ניתן לפתוח באקסל או Google Sheets</li>
                </ul>
              </div>

              {/* Export Filters */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">מסנני ייצוא:</h3>

                {/* Relevance Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סטטוס רלוונטיות
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={exportFilters.relevance_status || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        relevance_status: e.target.value || undefined
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">הכל</option>
                      <option value="ממתין לבדיקה">ממתין לבדיקה</option>
                      <option value="רלוונטי">רלוונטי</option>
                      <option value="לא רלוונטי">לא רלוונטי</option>
                    </select>
                    {exportFilters.relevance_status && (
                      <button
                        onClick={() => clearFilter('relevance_status')}
                        className="text-gray-400 hover:text-red-500 text-xl"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Lead Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סטטוס ליד
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={exportFilters.status || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        status: e.target.value || undefined
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">הכל</option>
                      <option value="לא תואם">לא תואם</option>
                      <option value="לקוח לא רצה">לקוח לא רצה</option>
                      <option value="תואם">תואם</option>
                      <option value="עסקה נסגרה">עסקה נסגרה</option>
                    </select>
                    {exportFilters.status && (
                      <button
                        onClick={() => clearFilter('status')}
                        className="text-gray-400 hover:text-red-500 text-xl"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Agent Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    סוכן מטפל
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={exportFilters.assigned_agent_id || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        assigned_agent_id: e.target.value || undefined
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">הכל</option>
                      <option value="null">ללא סוכן</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    {exportFilters.assigned_agent_id && (
                      <button
                        onClick={() => clearFilter('assigned_agent_id')}
                        className="text-gray-400 hover:text-red-500 text-xl"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מקור הליד
                  </label>
                  <div className="flex gap-2 items-center">
                    <select
                      value={exportFilters.source || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        source: e.target.value || undefined
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">הכל</option>
                      <option value="Email">אימייל</option>
                      <option value="Google Sheet">Google Sheet</option>
                      <option value="Manual">ידני</option>
                      <option value="Other">אחר</option>
                    </select>
                    {exportFilters.source && (
                      <button
                        onClick={() => clearFilter('source')}
                        className="text-gray-400 hover:text-red-500 text-xl"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    מסננים פעילים ({activeFiltersCount}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exportFilters.relevance_status && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        רלוונטיות: {exportFilters.relevance_status}
                      </span>
                    )}
                    {exportFilters.status && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        סטטוס: {exportFilters.status}
                      </span>
                    )}
                    {exportFilters.assigned_agent_id && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        סוכן: {exportFilters.assigned_agent_id === 'null' ? 'ללא סוכן' :
                               agents.find(a => a.id === exportFilters.assigned_agent_id)?.name}
                      </span>
                    )}
                    {exportFilters.source && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        מקור: {exportFilters.source}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isExporting ? 'מייצא...' : 'ייצא לCSV'}
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}