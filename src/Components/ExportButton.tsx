import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { API_URL } from '../config';

type ExportFormat = 'csv' | 'json';

export function ExportButton() {
  const { getToken } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const token = await getToken();
      
      const response = await fetch(
        `${API_URL}/export/transactions/${format}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Errore durante l\'esportazione dei dati');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Esportazione...</span>
          </>
        ) : (
          <>
            <span>📊</span>
            <span>Esporta CSV</span>
          </>
        )}
      </button>
      
      <button
        onClick={() => handleExport('json')}
        disabled={isExporting}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Esportazione...</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span>Esporta JSON</span>
          </>
        )}
      </button>
    </div>
  );
}
