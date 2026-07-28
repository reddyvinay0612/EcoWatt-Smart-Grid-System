import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Database
} from 'lucide-react';

import { dataService } from '../services/api';

function Reports({ consumerId, consumers }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setUploadResult(null);
    setUploadError('');
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setIsUploading(true);
    setUploadResult(null);
    setUploadError('');

    try {
      const res = await dataService.ingestCSV(csvFile);
      setUploadResult(res);
      setCsvFile(null);
      // Clear file input manually
      document.getElementById('csv_file_input').value = '';
    } catch (err) {
      console.error(err);
      setUploadError(
        err.response?.data?.detail || 
        'Failed to parse CSV. Ensure columns match: consumer_id, timestamp, energy_kwh'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!consumerId) return;
    setIsExporting(true);
    try {
      // Fetch a larger history slice for audits (e.g. last 500 readings)
      const data = await dataService.getHistory(consumerId, 500);
      
      if (data.length === 0) {
        alert("No historical readings found to export.");
        return;
      }

      // Build CSV string
      const headers = [
        'Timestamp', 
        'Grid Draw (kWh)', 
        'Is Anomaly Flagged', 
        'Temperature (C)', 
        'Solar Irradiance (W/m2)', 
        'Wind Speed (m/s)', 
        'Solar Generation (kWh)', 
        'Wind Generation (kWh)', 
        'Total Renewables (kWh)'
      ];
      
      const csvRows = [headers.join(',')];
      
      data.forEach((row) => {
        const values = [
          `"${new Date(row.timestamp).toISOString()}"`,
          row.energy_kwh,
          row.is_anomaly,
          row.temperature,
          row.solar_irradiance,
          row.wind_speed,
          row.solar_kwh,
          row.wind_kwh,
          row.total_renewable_kwh
        ];
        csvRows.push(values.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const activeConsumer = consumers.find(c => c.id === consumerId);
      const filename = `ecowatt_audit_${activeConsumer?.name.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export historical log.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Data Audit & Reports</h2>
        <p className="text-slate-400 text-sm mt-1">Export energy compliance logs or ingest external smart meter CSV files</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center">
              <FileText className="h-5 w-5 text-accentBlue mr-2" />
              Generate Audit Compliance CSV
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Downloads a complete chronological record of smart meter load logs, coincident microclimatic parameters (temperature, solar, wind), on-site clean energy offsets, and net carbon totals for reporting.
            </p>
          </div>

          <div className="bg-[#0F1626] border border-darkBorder p-4 rounded-xl text-xs space-y-2 text-slate-300">
            <h4 className="font-semibold text-white">Report Specifications:</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Scope: Last 500 meter intervals (approx. 5 days)</li>
              <li>Fields: Load, Weather parameters, Renewable Offsets, CO₂</li>
              <li>Format: CSV spreadsheet (.csv)</li>
            </ul>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="w-full bg-accentBlue hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-accentBlue/15"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating Report...' : 'Download Compliance Spreadsheet'}</span>
          </button>
        </div>

        {/* Upload Panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-white text-base flex items-center">
              <Upload className="h-5 w-5 text-accentGreen mr-2" />
              Ingest External Smart Meter Data
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload commercial CSV smart-meter logs. The system parses timestamps, automatically runs weather simulations for newly ingested periods, and calculates carbon emissions.
            </p>
          </div>

          {/* Upload forms */}
          <form onSubmit={handleCSVUpload} className="space-y-4">
            <div className="flex flex-col items-center justify-center border border-dashed border-darkBorder bg-[#090d16] p-4 rounded-xl cursor-pointer hover:border-accentBlue/55 transition-all relative">
              <input
                id="csv_file_input"
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Database className="h-8 w-8 text-slate-500 mb-2" />
              <span className="text-xs font-semibold text-slate-300 text-center block">
                {csvFile ? csvFile.name : 'Select Smart Meter CSV File'}
              </span>
              <span className="text-[10px] text-slate-500 text-center block mt-1">Columns: consumer_id, timestamp, energy_kwh</span>
            </div>

            {uploadResult && (
              <div className="bg-accentGreen/10 border border-accentGreen/20 text-accentGreen px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Ingested: {uploadResult.records_ingested} records. Skipped: {uploadResult.duplicates_skipped} duplicates.</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-accentRed/10 border border-accentRed/20 text-accentRed px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !csvFile}
              className="w-full bg-accentGreen hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-accentGreen/15"
            >
              <span>{isUploading ? 'Ingesting Readings...' : 'Upload & Process Logs'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Reports;
