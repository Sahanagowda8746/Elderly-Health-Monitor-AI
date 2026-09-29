import React, { useState } from 'react';
import {
  Settings, Sliders, Bell, Eye, Save, RotateCcw, Check
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { DEFAULT_THRESHOLDS } from '../lib/healthEngine';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export function SettingsPage() {
  const { settings, updateSettings, updateThresholds } = useHealth();

  const [thresholds, setLocalThresholds] = useState(settings.thresholds);
  const [notifications, setLocalNotifications] = useState(settings.notifications);
  const [demo, setLocalDemo] = useState(settings.demo);
  const [display, setLocalDisplay] = useState(settings.display);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(thresholds);
    updateSettings({
      notifications,
      demo,
      display,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS);
    updateThresholds(DEFAULT_THRESHOLDS);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">System Preferences & Thresholds</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Physiological safety limits, notification dispatch rules, and simulation parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset Clinical Defaults</span>
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Check size={14} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Physiological Safety Thresholds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Sliders size={16} className="text-blue-600" />
            Physiological Safety Demonstration Limits
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Altering these values directly controls the trigger sensitivity for the predictive risk scoring engine.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Heart Rate Minimum (BPM)
              </label>
              <input
                type="number"
                value={thresholds.heartRateMin}
                onChange={(e) => setLocalThresholds(t => ({ ...t, heartRateMin: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Clinical baseline bradycardia: &lt;60 BPM</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Heart Rate Maximum (BPM)
              </label>
              <input
                type="number"
                value={thresholds.heartRateMax}
                onChange={(e) => setLocalThresholds(t => ({ ...t, heartRateMax: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Clinical baseline tachycardia: &gt;100 BPM</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                SpO₂ Oxygen Saturation Minimum (%)
              </label>
              <input
                type="number"
                value={thresholds.spo2Min}
                onChange={(e) => setLocalThresholds(t => ({ ...t, spo2Min: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Normal elderly range: 95% - 100%</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Body Temperature Minimum (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={thresholds.temperatureMin}
                onChange={(e) => setLocalThresholds(t => ({ ...t, temperatureMin: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Hypothermia limit: &lt;35.5°C</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Body Temperature Maximum (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={thresholds.temperatureMax}
                onChange={(e) => setLocalThresholds(t => ({ ...t, temperatureMax: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Pyrexia / Fever threshold: &gt;37.8°C</span>
            </div>
          </div>
        </div>

        {/* Notifications & Dispatch Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Bell size={16} className="text-amber-500" />
            Caregiver Notification & Alarm Channels
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Configure how and when the system alerts caregivers during health anomalies.
          </p>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Critical Events (Falls & Acute Vitals)</span>
                <span className="text-slate-400">Audible buzzer and immediate push notification</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.criticalAlerts}
                onChange={(e) => setLocalNotifications(n => ({ ...n, criticalAlerts: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Predictive Trend Warnings</span>
                <span className="text-slate-400">Pre-threshold notification when regression slope deteriorates</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.warningAlerts}
                onChange={(e) => setLocalNotifications(n => ({ ...n, warningAlerts: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">Medical Report Ready</span>
                <span className="text-slate-400">Notify when OCR extraction and biomarker delta comparison complete</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.reportReady}
                onChange={(e) => setLocalNotifications(n => ({ ...n, reportReady: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 block">IoT Hardware Telemetry & Low Battery</span>
                <span className="text-slate-400">Alert if wearable falls below 15% charge or loses connectivity</span>
              </div>
              <input
                type="checkbox"
                checked={notifications.deviceStatus}
                onChange={(e) => setLocalNotifications(n => ({ ...n, deviceStatus: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Display & Simulation Tuning */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Eye size={16} className="text-purple-600" />
            Display Preferences & Simulation Engine
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Telemetry Chart Sliding Window (Minutes)
              </label>
              <select
                value={display.chartWindowMinutes}
                onChange={(e) => setLocalDisplay(d => ({ ...d, chartWindowMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value={10}>10 Minutes (High Zoom)</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={60}>60 Minutes (Broad Overview)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Telemetry Simulation Ingestion Cadence
              </label>
              <select
                value={demo.speed}
                onChange={(e) => setLocalDemo(dm => ({ ...dm, speed: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="slow">Slow (Every 5 seconds)</option>
                <option value="normal">Normal (Every 3 seconds)</option>
                <option value="fast">Fast (Every 1.5 seconds)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Save size={14} />
            <span>Save Preferences & Thresholds</span>
          </button>
        </div>
      </form>

      <MedicalDisclaimer />
    </div>
  );
}
