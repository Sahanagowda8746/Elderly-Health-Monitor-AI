import {
  Bell, Cpu, CheckCircle2, Sparkles, Info
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import type { DemoScenario } from '../types';

export function PredictiveAlertsPage() {
  const {
    predictiveAlerts,
    insights,
    trends,
    latestReading,
    demoScenario,
    setDemoScenario,
  } = useHealth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Predictive Health-Risk Engine</h1>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
                  Explainable AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proactive trend extrapolation detecting vital deterioration before critical threshold breach
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">Test Simulation:</span>
            <select
              value={demoScenario}
              onChange={(e) => setDemoScenario(e.target.value as DemoScenario)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
            >
              <option value="normal">Normal / Baseline</option>
              <option value="increasing_heart_rate">Rising Heart Rate (Tachycardia)</option>
              <option value="decreasing_spo2">Dropping SpO₂ (Hypoxia Risk)</option>
              <option value="increasing_temperature">Rising Temperature (Fever)</option>
              <option value="combined_risk">Combined Deterioration Pattern</option>
              <option value="fall_emergency">Fall Emergency Pattern</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Trend Trajectories */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Heart Rate Trajectory</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trends?.heartRate.direction === 'rising' ? 'bg-orange-100 text-orange-700' :
              trends?.heartRate.direction === 'falling' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {trends?.heartRate.direction ?? 'Stable'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {latestReading?.heartRate ?? '--'} <span className="text-xs font-normal text-slate-500">BPM</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Rate of change: <span className="font-mono font-medium">{trends?.heartRate.rateOfChange ? `${trends.heartRate.rateOfChange.toFixed(2)} bpm/min` : 'Stable'}</span>
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">SpO₂ Oxygen Trajectory</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trends?.spo2.direction === 'falling' ? 'bg-red-100 text-red-700' :
              trends?.spo2.direction === 'rising' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {trends?.spo2.direction ?? 'Stable'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {latestReading?.spo2 ?? '--'} <span className="text-xs font-normal text-slate-500">%</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Rate of change: <span className="font-mono font-medium">{trends?.spo2.rateOfChange ? `${trends.spo2.rateOfChange.toFixed(2)} %/min` : 'Stable'}</span>
          </p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase">Temperature Trajectory</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trends?.temperature.direction === 'rising' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {trends?.temperature.direction ?? 'Stable'}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {latestReading?.temperature ? latestReading.temperature.toFixed(1) : '--'} <span className="text-xs font-normal text-slate-500">°C</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Rate of change: <span className="font-mono font-medium">{trends?.temperature.rateOfChange ? `${trends.temperature.rateOfChange.toFixed(2)} °C/min` : 'Stable'}</span>
          </p>
        </div>
      </div>

      {/* Active Predictive Warnings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Active Predictive Alerts</h2>
          </div>
          <span className="text-xs text-slate-400">Triggered before threshold breach</span>
        </div>

        {predictiveAlerts.length > 0 ? (
          <div className="space-y-4">
            {predictiveAlerts.map((alert, idx) => (
              <div
                key={alert.id || idx}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        {alert.parameter}
                      </span>
                      <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {(alert.urgency || alert.severity).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {alert.title || alert.message || alert.description}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    Risk Score: {alert.riskScore}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Contributing Dynamics:</span>
                    <p className="text-slate-600">{alert.description}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Caregiver Recommendation:</span>
                    <p className="text-slate-600">{alert.recommendation || alert.recommendedAction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Pre-Emptive Alerts Generated</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Linear regression slopes on all vital streams indicate stable trends within safe bounds.
            </p>
          </div>
        )}
      </div>

      {/* Multi-Parameter Explainable Health Insights */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Explainable Physiological Insights</h2>
          </div>
          <span className="text-xs text-slate-400">Layer 2 Health Intelligence Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div
              key={insight.id || idx}
              className="p-4 rounded-xl border transition-all bg-slate-50 border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-800">{insight.title || `${insight.parameter} Observation`}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white border border-current text-slate-600">
                  {insight.confidence} Confidence
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {insight.observation || insight.description}
              </p>
              {insight.actionableAdvice && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Suggested Action: </span>
                  {insight.actionableAdvice}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm Transparency Card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          Predictive Score Computation Architecture
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          The HealthGuard AI risk score (0–100) integrates four distinct physiological evaluation layers:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">1. Vital Deviation (0–65 pts)</p>
            <p className="text-slate-500">Continuous scoring based on standard deviations from safe baseline ranges.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">2. Trend Persistence (×1.0–1.5)</p>
            <p className="text-slate-500">Multiplies risk when negative slopes persist across 5 or more continuous cycles.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">3. Multimodal Bonus (+10–20 pts)</p>
            <p className="text-slate-500">Applied when 2 or more vitals deviate simultaneously (e.g. high pulse + low oxygen).</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <p className="font-bold text-slate-800 mb-1">4. Motion Anomaly (+25 pts)</p>
            <p className="text-slate-500">Triggered on high-g acceleration spikes followed by prolonged zero-motion states.</p>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
