'use client'

import React, { useState } from 'react';

interface ImportResult {
  success: boolean;
  imported?: number;
  total?: number;
  duplicates?: number;
  errors?: string[];
  error?: string;
  details?: string;
}

interface CSVImportProps {
  onImportComplete: () => void;
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('אנא בחר קובץ CSV');
    }
  };

  const handleDebug = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-csv-debug', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult({
        success: false,
        error: 'Debug Information',
        details: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'שגיאה בניפוי הקובץ'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDetectHeaders = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/detect-csv-headers', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      // Format the results nicely
      const colorAnalysis = data.colorAnalysis?.hasColorCoding ? `

🎨 ניתוח צבעים:
${Object.entries(data.colorAnalysis.colorCounts).map(([color, count]: [string, any]) =>
  `• ${color}: ${count} שורות`
).join('\n')}
📊 סה"כ שורות צבועות: ${data.colorAnalysis.totalColoredRows}
      ` : '';

      const formattedInfo = `
📊 ניתוח כותרות CSV:

🔍 סה"כ שורות: ${data.totalLines}
📝 שורת כותרות: ${data.headerLine}

📋 עמודות שזוהו:
${data.columns.map((col: any) =>
  `${col.index}: "${col.header}" → ${col.type} (דוגמה: "${col.sample}"))`
).join('\n')}

🎯 מיפוי מומלץ:
• טלפון: עמודה ${data.recommendations.phoneColumn}
• סטטוס: עמודה ${data.recommendations.statusColumn}
• שם לקוח: עמודה ${data.recommendations.customerColumn}
• סוכן מטפל: עמודה ${data.recommendations.agentColumn}
• תאריך פגישה: עמודה ${data.recommendations.meetingColumn}
• קוד צבע: עמודה ${data.recommendations.colorColumn}
${colorAnalysis}
✅ שדות נדרשים זמינים: ${data.hasRequired ? 'כן' : 'לא'}
      `.trim();

      setResult({
        success: data.hasRequired,
        error: data.hasRequired ? 'ניתוח כותרות הושלם' : 'חסרים שדות נדרשים',
        details: formattedInfo
      });
    } catch (error) {
      setResult({
        success: false,
        error: 'שגיאה בניתוח כותרות'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          onImportComplete();
          setIsModalOpen(false);
          setFile(null);
          setResult(null);
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'שגיאה בהעלאת הקובץ'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <>
      {/* Import Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium transition-all flex items-center gap-2"
      >
        <span>📥</span> ייבוא CSV
      </button>

      {/* Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">ייבוא נתונים מ-CSV</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">הנחיות לייבוא:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• העמודות הנדרשות: נייד, סטטוס, תאריך פגישה, שם לקוח, סוכן מטפל</li>
                  <li>• פורמט תאריך: DD.MM.YY או DD.MM.YYYY</li>
                  <li>• שמות הסוכנים: עדי בראל, יקיר, דור, עידן, פלג</li>
                  <li>• לשמירת צבעים: הוסף עמודת "צבע" עם הערכים: ירוק, אדום, צהוב, כחול</li>
                  <li>• הקובץ חייב להיות בפורמט CSV</li>
                </ul>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  בחר קובץ CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected File Info */}
              {file && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    קובץ נבחר: <span className="font-medium">{file.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    גודל: {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              {/* Import Result */}
              {result && (
                <div className={`p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.success ? (
                    <div>
                      <p className="text-green-600 font-medium mb-2">✅ הייבוא הושלם בהצלחה!</p>
                      <p className="text-sm text-green-700">
                        יובאו {result.imported} לידים חדשים מתוך {result.total}
                        {result.duplicates && result.duplicates > 0 && (
                          <span className="text-amber-700"> ({result.duplicates} כבר קיימים)</span>
                        )}
                      </p>
                      {result.errors && result.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-green-600 cursor-pointer">
                            {result.errors.length} שגיאות קלות
                          </summary>
                          <div className="mt-1 text-xs text-green-600 max-h-20 overflow-y-auto">
                            {result.errors.map((error, i) => (
                              <div key={i}>{error}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-600 font-medium mb-2">❌ שגיאה בייבוא</p>
                      <p className="text-sm text-red-700">{result.error}</p>
                      {result.details && (
                        <p className="text-xs text-red-600 mt-1">{result.details}</p>
                      )}
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600 max-h-20 overflow-y-auto">
                          {result.errors.map((error, i) => (
                            <div key={i}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleDetectHeaders}
                  disabled={!file || loading}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm"
                >
                  זהה כותרות
                </button>
                <button
                  onClick={handleDebug}
                  disabled={!file || loading}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm"
                >
                  בדוק נתונים
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'מייבא...' : 'ייבא נתונים'}
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