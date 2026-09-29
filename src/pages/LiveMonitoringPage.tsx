import { useState } from 'react';
import {
  Activity, Heart, Wind, Thermometer, Play, Pause, RotateCcw,
  Compass, Clock
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { LiveChart } from '../components/LiveChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { format } from 'date-fns';

export function LiveMonitoringPage() {
  const {
    readings,
    latestReading,
    trends,
    demoMode,
    setDemoMode,
    settings,
    updateSettings,
    clearReadings,
  } = useHealth();

  const [activeTab, setActiveTab] = useState<'all' | 'hr' | 'spo2' | 'temp'>('all');
  const [windowCount, setWindowCount] = useState<number>(30);

  // Speed handler
  const setSpeed = (speed: 'slow' | 'normal' | 'fast') => {
    updateSettings({
      demo: { ...settings.demo, speed }
    });
  };

  const getMotionBadge = (status?: string) => {
    switch (status) {
      case 'fall_detected':
        return <span className="bg-red-500 text-white font-bold px-2.5 py-1 rounded-full text-xs animate-bounce">FALL DETECTED</span>;
      case 'elevated':
        return <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-xs">Elevated / Active</span>;
      case 'inactive':
        return <span className="bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-xs">Resting / Inactive</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full text-xs">Normal / Baseline</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Activity size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">High-Frequency Live Monitoring</h1>
                <p className="text-xs text-slate-500">Continuous telemetry pipeline from wearable sensor node</p>
              </div>
            </div>
          </div>

          {/* Controller strip */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Play/Pause */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                demoMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {demoMode ? <Pause size={14} /> : <Play size={14} />}
              <span>{demoMode ? 'Pause Ingestion' : 'Resume Telemetry'}</span>
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSpeed('slow')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  settings.demo.speed === 'slow' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Slow (5s)
              </button>
              <button
                onClick={() => setSpeed('normal')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  settings.demo.speed === 'normal' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Normal (3s)
              </button>
              <button
                onClick={() => setSpeed('fast')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  settings.demo.speed === 'fast' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                }`}
              >
                Fast (1.5s)
              </button>
            </div>

            {/* Clear stream */}
            <button
              onClick={clearReadings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Clear sample buffer"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate Metric */}
        <div className="card p-5 bg-gradient-to-b from-white to-rose-50/20 border-rose-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pulse (MAX30102)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart size={16} className={demoMode ? 'animate-pulse' : ''} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold text-slate-900 font-mono">
              {latestReading?.heartRate ?? '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">BPM</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <span>Range: {settings.thresholds.heartRateMin}-{settings.thresholds.heartRateMax}</span>
            <span className="font-semibold text-slate-700 capitalize">
              Trend: {trends?.heartRate.direction ?? 'Normal'}
            </span>
          </div>
        </div>

        {/* SpO2 Metric */}
        <div className="card p-5 bg-gradient-to-b from-white to-sky-50/20 border-sky-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SpO₂ Oxygenation</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <Wind size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold text-slate-900 font-mono">
              {latestReading?.spo2 ?? '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <span>Min Safety: {settings.thresholds.spo2Min}%</span>
            <span className="font-semibold text-slate-700 capitalize">
              Trend: {trends?.spo2.direction ?? 'Normal'}
            </span>
          </div>
        </div>

        {/* Temperature Metric */}
        <div className="card p-5 bg-gradient-to-b from-white to-amber-50/20 border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Skin Temp (MLX90614)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Thermometer size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-extrabold text-slate-900 font-mono">
              {latestReading?.temperature ? latestReading.temperature.toFixed(1) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">°C</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            <span>Limit: {settings.thresholds.temperatureMax}°C</span>
            <span className="font-semibold text-slate-700 capitalize">
              Trend: {trends?.temperature.direction ?? 'Normal'}
            </span>
          </div>
        </div>

        {/* Motion & Accelerometer Status */}
        <div className="card p-5 bg-gradient-to-b from-white to-indigo-50/20 border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Motion (MPU6050)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Compass size={16} />
            </div>
          </div>
          <div className="mt-2">
            {getMotionBadge(latestReading?.motionStatus)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-mono">
            <span>X: {latestReading?.accelerometerX ? latestReading.accelerometerX.toFixed(2) : '0.02'}</span>
            <span>Y: {latestReading?.accelerometerY ? latestReading.accelerometerY.toFixed(2) : '0.01'}</span>
            <span>Z: {latestReading?.accelerometerZ ? latestReading.accelerometerZ.toFixed(2) : '0.99'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Telemetry Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-600'
              }`}
            >
              All Signals
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'hr' ? 'bg-white shadow text-rose-600' : 'text-slate-600'
              }`}
            >
              Heart Rate Only
            </button>
            <button
              onClick={() => setActiveTab('spo2')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'spo2' ? 'bg-white shadow text-sky-600' : 'text-slate-600'
              }`}
            >
              SpO₂ Only
            </button>
            <button
              onClick={() => setActiveTab('temp')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'temp' ? 'bg-white shadow text-amber-600' : 'text-slate-600'
              }`}
            >
              Temperature Only
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={14} />
            <span>Samples:</span>
            {[15, 30, 60].map(count => (
              <button
                key={count}
                onClick={() => setWindowCount(count)}
                className={`px-2.5 py-1 rounded-md font-medium border ${
                  windowCount === count
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {count} pts
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'hr') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Heart Rate Channel (Normal range: {settings.thresholds.heartRateMin}-{settings.thresholds.heartRateMax} BPM)
                </span>
                <span className="text-xs font-mono text-slate-400">Sampling: 0.33Hz</span>
              </div>
              <LiveChart
                readings={readings}
                parameter="heartRate"
                label="Heart Rate"
                unit="BPM"
                color="#f43f5e"
                referenceLines={[
                  { value: settings.thresholds.heartRateMin, color: '#f59e0b', label: 'Min' },
                  { value: settings.thresholds.heartRateMax, color: '#ef4444', label: 'Max' },
                ]}
                windowCount={windowCount}
              />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'spo2') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Blood Oxygen Channel (Safe baseline &gt;= {settings.thresholds.spo2Min}%)
                </span>
                <span className="text-xs font-mono text-slate-400">Resolution: 0.1%</span>
              </div>
              <LiveChart
                readings={readings}
                parameter="spo2"
                label="Oxygen Saturation"
                unit="%"
                color="#0ea5e9"
                referenceLines={[
                  { value: settings.thresholds.spo2Min, color: '#ef4444', label: 'Min Limit' },
                ]}
                windowCount={windowCount}
              />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'temp') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Body Temperature Channel (Norm: {settings.thresholds.temperatureMin}°C - {settings.thresholds.temperatureMax}°C)
                </span>
                <span className="text-xs font-mono text-slate-400">IR Thermopile</span>
              </div>
              <LiveChart
                readings={readings}
                parameter="temperature"
                label="Body Temperature"
                unit="°C"
                color="#f59e0b"
                referenceLines={[
                  { value: settings.thresholds.temperatureMin, color: '#0ea5e9', label: 'Min' },
                  { value: settings.thresholds.temperatureMax, color: '#ef4444', label: 'Max' },
                ]}
                windowCount={windowCount}
              />
            </div>
          )}
        </div>
      </div>

      {/* Raw Reading Stream Buffer (Last 10 rows) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Ingested Frames Buffer</h3>
            <p className="text-xs text-slate-500">Live serialized packet stream from edge hardware node</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Buffer Depth: {readings.length} packets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">HR (BPM)</th>
                <th className="py-2.5 px-3">SpO₂ (%)</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Motion State</th>
                <th className="py-2.5 px-3">Acc (X, Y, Z)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {readings.slice(-10).reverse().map((r, i) => (
                <tr key={r.id || i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 text-slate-500">
                    {format(new Date(r.timestamp), 'HH:mm:ss.SSS')}
                  </td>
                  <td className="py-2 px-3 font-semibold text-rose-600">
                    {r.heartRate ?? '--'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-sky-600">
                    {r.spo2 ?? '--'}%
                  </td>
                  <td className="py-2 px-3 font-semibold text-amber-600">
                    {r.temperature?.toFixed(1) ?? '--'}°C
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      r.motionStatus === 'fall_detected'
                        ? 'bg-red-100 text-red-700 font-bold'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {r.motionStatus}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {r.accelerometerX ? r.accelerometerX.toFixed(1) : '0.0'}, {r.accelerometerY ? r.accelerometerY.toFixed(1) : '0.0'}, {r.accelerometerZ ? r.accelerometerZ.toFixed(1) : '1.0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
