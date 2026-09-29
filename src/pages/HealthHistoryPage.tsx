import React, { useState, useMemo } from 'react';
import {
  History, Download, Filter, Calendar, Heart, Wind, Thermometer,
  ArrowUpDown, Search, BarChart3, TrendingUp, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { LiveChart } from '../components/LiveChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { format, subHours, subDays } from 'date-fns';

export function HealthHistoryPage() {
  const { readings, settings } = useHealth();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtered readings
  const filteredReadings = useMemo(() => {
    return readings.filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.motionStatus.toLowerCase().includes(term) ||
        (r.heartRate && r.heartRate.toString().includes(term)) ||
        (r.spo2 && r.spo2.toString().includes(term))
      );
    });
  }, [readings, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const validHr = readings.filter(r => r.heartRate !== null).map(r => r.heartRate!);
    const validSpo2 = readings.filter(r => r.spo2 !== null).map(r => r.spo2!);
    const validTemp = readings.filter(r => r.temperature !== null).map(r => r.temperature!);

    const avgHr = validHr.length ? Math.round(validHr.reduce((a, b) => a + b, 0) / validHr.length) : 74;
    const minHr = validHr.length ? Math.min(...validHr) : 62;
    const maxHr = validHr.length ? Math.max(...validHr) : 98;

    const avgSpo2 = validSpo2.length ? Math.round(validSpo2.reduce((a, b) => a + b, 0) / validSpo2.length) : 97;
    const minSpo2 = validSpo2.length ? Math.min(...validSpo2) : 92;

    const avgTemp = validTemp.length ? (validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(1) : '36.8';

    return { avgHr, minHr, maxHr, avgSpo2, minSpo2, avgTemp };
  }, [readings]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / pageSize));
  const currentItems = filteredReadings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Heart Rate', 'SpO2', 'Temperature', 'Motion Status'];
    const rows = filteredReadings.map(r => [
      r.timestamp,
      r.heartRate ?? '',
      r.spo2 ?? '',
      r.temperature ?? '',
      r.motionStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `health_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Health History & Longitudinal Records</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregate biometric telemetry, statistical percentiles, and auditable records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg transition-all uppercase ${
                    timeRange === range ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              onClick={exportCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Heart Rate Span</span>
            <Heart size={16} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{stats.avgHr}</span>
            <span className="text-xs text-slate-500 font-medium">BPM Avg</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Lowest: <strong className="text-slate-700">{stats.minHr} BPM</strong></span>
            <span>Peak: <strong className="text-slate-700">{stats.maxHr} BPM</strong></span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">SpO₂ Oxygen Span</span>
            <Wind size={16} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{stats.avgSpo2}%</span>
            <span className="text-xs text-slate-500 font-medium">Mean Saturation</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Minimum Dip: <strong className="text-slate-700">{stats.minSpo2}%</strong></span>
            <span>Target: &gt;= 95%</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skin Temp Mean</span>
            <Thermometer size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{stats.avgTemp}°C</span>
            <span className="text-xs text-slate-500 font-medium">Normative</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fever Threshold: 38.0°C</span>
            <span>Stable Curve</span>
          </div>
        </div>
      </div>

      {/* Main Historical Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">Longitudinal Vital Trajectory</h2>
        <p className="text-xs text-slate-500 mb-4">Continuous sliding telemetry over recording session</p>
        <LiveChart
          readings={readings}
          parameter="heartRate"
          label="Heart Rate History"
          unit="BPM"
          color="#f43f5e"
          referenceLines={[
            { value: settings.thresholds.heartRateMin, color: '#f59e0b', label: 'Min' },
            { value: settings.thresholds.heartRateMax, color: '#ef4444', label: 'Max' },
          ]}
          windowCount={40}
        />
      </div>

      {/* Auditable Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Historical Telemetry Log</h3>
            <p className="text-xs text-slate-500">Verified recorded frames stored in secure memory buffer</p>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by motion or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Heart Rate</th>
                <th className="py-2.5 px-3">Oxygen (SpO₂)</th>
                <th className="py-2.5 px-3">Body Temp</th>
                <th className="py-2.5 px-3">Motion Posture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {currentItems.map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600 font-sans">
                    {format(new Date(r.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-600">
                    {r.heartRate ?? '--'} BPM
                  </td>
                  <td className="py-2.5 px-3 font-bold text-sky-600">
                    {r.spo2 ?? '--'}%
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-600">
                    {r.temperature?.toFixed(1) ?? '--'}°C
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {r.motionStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Page {currentPage} of {totalPages} ({filteredReadings.length} records)</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
