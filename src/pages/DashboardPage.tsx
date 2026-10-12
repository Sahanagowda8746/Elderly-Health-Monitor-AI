import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Activity, Thermometer, Wind, AlertTriangle,
  CheckCircle, ArrowRight, Zap,
  TrendingUp, RefreshCw, Eye, Sparkles, Cpu, X,
  Shield, CheckCircle2, User, Phone, Info
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { VitalCard, BloodPressureCard } from '../components/VitalCard';
import { HealthRiskScoreCard } from '../components/HealthRiskScoreCard';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { LiveChart } from '../components/LiveChart';
import { predictRisk, sensorReadingToFeatures } from '../lib/mlInference';
import type { DemoScenario } from '../types';

const SCENARIOS: { id: DemoScenario; label: string; desc: string; badge: string; color: string }[] = [
  { id: 'normal', label: 'Normal / Stable', desc: 'Patient vitals baseline and calm', badge: 'Stable', color: 'bg-green-100 text-green-700' },
  { id: 'increasing_heart_rate', label: 'Elevating Pulse', desc: 'Heart rate escalating gradually (72 → 105)', badge: 'Tachycardia', color: 'bg-amber-100 text-amber-700' },
  { id: 'decreasing_spo2', label: 'Decreasing SpO₂', desc: 'Oxygen saturation drops (98% → 91%)', badge: 'Hypoxia', color: 'bg-blue-100 text-blue-700' },
  { id: 'increasing_temperature', label: 'Elevating Temperature', desc: 'Body temp rising (36.6°C → 38.2°C)', badge: 'Pyrexia', color: 'bg-orange-100 text-orange-700' },
  { id: 'combined_risk', label: 'Combined Deterioration', desc: 'Multi-parameter acute distress pattern', badge: 'High Risk', color: 'bg-red-100 text-red-700' },
  { id: 'fall_emergency', label: 'Fall Incident', desc: 'Motion anomaly with posture alarm', badge: 'Critical Fall', color: 'bg-purple-100 text-purple-700' },
];

export function DashboardPage() {
  const {
    latestReading,
    readings,
    trends,
    riskScore,
    insights,
    alerts,
    acknowledgeAlert,
    demoMode,
    sessionType,
    demoScenario,
    setDemoScenario,
    setDemoMode,
    settings,
    device,
  } = useHealth();

  const { profile, user } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const unacknowledgedAlerts = alerts.filter(a => a.status === 'unacknowledged');

  // Determine if this is a real user who opened temporary demo exploration
  const isRealUserExploringDemo = sessionType === 'real' && demoMode;
  const isRealUserAccount = sessionType === 'real';

  // Compute assistive Machine Learning Risk Prediction from the trained Random Forest model
  const mlPrediction = useMemo(() => {
    if (!latestReading) return null;
    const prevReading = readings.length > 1 ? readings[readings.length - 2] : null;
    const features = sensorReadingToFeatures(
      latestReading,
      prevReading,
      latestReading.motionStatus === 'inactive' ? 45 : 5,
      latestReading.motionStatus === 'fall_detected'
    );
    return predictRisk(features);
  }, [latestReading, readings]);

  return (
    <div className="space-y-6">
      {/* ── Real User Demo Exploration Return Banner ── */}
      {isRealUserExploringDemo && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Temporary Demo Simulation Active</p>
              <p className="text-xs text-amber-100">
                You are currently viewing simulated patient data inside your personal account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDemoMode(false)}
            className="px-4 py-2 bg-white text-amber-800 text-xs font-bold rounded-xl shadow-sm hover:bg-amber-50 transition-colors flex-shrink-0"
          >
            Exit Demo & Return to My Account
          </button>
        </div>
      )}

      {/* ── Demo Mode Prominent Banner (for pure demo session) ── */}
      {sessionType === 'demo' && (
        <div className="bg-gradient-to-r from-teal-900 via-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-500/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-white tracking-wide">
                    DEMO SIMULATION ENVIRONMENT
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/40 px-2 py-0.5 rounded-full">
                    Synthetic Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Simulating live physiological data for patient <strong className="text-white">Margaret Vance (76)</strong>. Select physiological test scenarios below to trigger multi-parameter risk scores, early warning trend indicators, and fall alerts.
                </p>
              </div>
            </div>

            {/* Quick Scenario Selector */}
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/15 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-200 px-2">
                <Zap size={14} className="text-amber-400" />
                <span>Scenario:</span>
              </div>
              <select
                value={demoScenario}
                onChange={(e) => setDemoScenario(e.target.value as DemoScenario)}
                className="text-xs font-semibold bg-slate-800 border border-slate-600 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm cursor-pointer"
              >
                {SCENARIOS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.badge})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setDemoMode(!demoMode)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                  demoMode
                    ? 'bg-teal-500 text-slate-900 hover:bg-teal-400'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {demoMode ? 'Streaming' : 'Paused'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Patient & Status Banner ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl flex-shrink-0 shadow-inner">
              {sessionType === 'demo'
                ? 'M'
                : (profile?.fullName ? profile.fullName.charAt(0) : 'U')}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  {sessionType === 'demo'
                    ? 'Margaret Vance'
                    : (profile?.patientName || profile?.fullName || 'Personal Patient Record')}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full border border-slate-200">
                  {sessionType === 'demo'
                    ? 'Age: 76 • Female'
                    : (profile?.gender
                        ? `${profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}${profile.dateOfBirth ? ` • Born ${profile.dateOfBirth}` : ''}`
                        : 'Personal Patient')}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  demoMode
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : device.connectionStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    demoMode ? 'bg-amber-500 animate-pulse' : device.connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`} />
                  {demoMode
                    ? 'Simulated Stream Active'
                    : device.connectionStatus === 'connected'
                      ? 'Telemetry Live'
                      : 'Device Standby (Not Connected)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Caregiver:{' '}
                <span className="text-slate-700 font-medium">
                  {sessionType === 'demo'
                    ? 'David Vance (Son)'
                    : (profile?.caregiverName || profile?.fullName || 'Designated Primary Contact')}
                </span>
                {' • Phone: '}
                <span className="text-slate-700 font-mono font-medium">
                  {sessionType === 'demo'
                    ? '+1 (555) 987-6543'
                    : (profile?.caregiverPhone || profile?.phone || 'Not configured')}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons for real account */}
          {isRealUserAccount && !demoMode && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/device-status"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Cpu size={14} />
                Hardware Setup
              </Link>
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-amber-500" />
                Explore Demo Mode
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Real Account Device Waiting Banner ── */}
      {isRealUserAccount && !demoMode && readings.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Welcome to Your HealthGuard Personal Portal
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                  Your profile and emergency contacts are registered. To view live continuous vital signs, pair your HealthGuard IoT monitor (ESP32 / Raspberry Pi) or test the system with our interactive simulator.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/device-status"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
              >
                Pair Monitoring Device
              </Link>
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-amber-500" />
                Preview Demo Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unacknowledged Critical/Warning Alert Banner if any ── */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-sm animate-pulse-slow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl text-red-600 flex-shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">
                  {unacknowledgedAlerts.length} Actionable Health Event{unacknowledgedAlerts.length > 1 ? 's' : ''} Require Immediate Attention
                </h3>
                <p className="text-xs text-red-700 mt-0.5">
                  {unacknowledgedAlerts[0].message}
                </p>
                {unacknowledgedAlerts[0].observedFactors && unacknowledgedAlerts[0].observedFactors.length > 0 && (
                  <p className="text-xs text-red-600/80 mt-1 italic">
                    Observed: {unacknowledgedAlerts[0].observedFactors.join(' • ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => acknowledgeAlert(unacknowledgedAlerts[0].id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Acknowledge Alert
              </button>
              <Link
                to="/emergency-alerts"
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg transition-colors"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Primary Vitals Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Real-Time Vitals Stream</h2>
          </div>
          <Link
            to="/monitoring"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
          >
            <span>Telemetry Charts</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <VitalCard
            title="Heart Rate"
            value={latestReading?.heartRate ?? null}
            unit="BPM"
            parameter="heartRate"
            trend={trends?.heartRate.direction}
            lastUpdated={latestReading?.timestamp}
            thresholds={settings.thresholds}
            icon={<Heart size={18} className="text-rose-500" />}
            unavailableMessage={!demoMode ? 'Device not connected' : 'Awaiting sensor stream'}
          />

          <VitalCard
            title="Blood Oxygen (SpO₂)"
            value={latestReading?.spo2 ?? null}
            unit="%"
            parameter="spo2"
            trend={trends?.spo2.direction}
            lastUpdated={latestReading?.timestamp}
            thresholds={settings.thresholds}
            icon={<Wind size={18} className="text-sky-500" />}
            unavailableMessage={!demoMode ? 'Device not connected' : 'Awaiting sensor stream'}
          />

          <VitalCard
            title="Body Temperature"
            value={latestReading?.temperature ?? null}
            unit="°C"
            parameter="temperature"
            trend={trends?.temperature.direction}
            lastUpdated={latestReading?.timestamp}
            thresholds={settings.thresholds}
            icon={<Thermometer size={18} className="text-amber-500" />}
            unavailableMessage={!demoMode ? 'Device not connected' : 'Awaiting sensor stream'}
          />

          <BloodPressureCard
            systolic={latestReading?.systolicBp ?? null}
            diastolic={latestReading?.diastolicBp ?? null}
            lastUpdated={latestReading?.timestamp}
            icon={<Activity size={18} className="text-indigo-500" />}
          />
        </div>
      </div>

      {/* ── Middle Section: Health Risk Score & Multi-Parameter Intelligence ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Score Widget (5 Cols) */}
        <div className="lg:col-span-5">
          {riskScore ? (
            <HealthRiskScoreCard score={riskScore} mlPrediction={mlPrediction} />
          ) : (
            <div className="card p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Activity size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {demoMode ? 'Computing Risk Score…' : 'Awaiting Sensor Readings'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                {demoMode
                  ? 'Calculating multi-parameter physiological stability index from live stream.'
                  : 'AI health risk scoring requires continuous vital telemetry from a connected device.'}
              </p>
            </div>
          )}
        </div>

        {/* Real-time Predictive Insights & AI Explanation (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Explainable Physiological Insights</h3>
                  <p className="text-xs text-slate-500">Multimodal correlation across continuous readings & trend slope</p>
                </div>
              </div>
              <Link to="/predictive-alerts" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                Deep Dive <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border text-xs bg-slate-50 border-slate-200 text-slate-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <TrendingUp size={13} className="text-indigo-600" />
                        {insight.title || `${insight.parameter} Observation`}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-300">
                        {insight.confidence} Confidence
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-2">
                      {insight.observation || insight.description}
                    </p>
                    {insight.actionableAdvice && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{insight.actionableAdvice}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : demoMode ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">All Vital Trends Within Safe Demonstration Range</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Continuous correlation model is running. Select a demo scenario above to simulate physiological changes and view real-time explainable insights.
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <Info size={24} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Sensor Telemetry Recorded Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Explainable trend insights and early warning alerts will appear automatically once continuous sensor data streams from your monitoring device.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mini Chart Preview ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Continuous Vital Stream (Heart Rate)</h3>
            <p className="text-xs text-slate-500">Live sliding window displaying immediate telemetry changes</p>
          </div>
        </div>

        {readings.length > 0 ? (
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
            windowCount={30}
          />
        ) : (
          <div className="py-12 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Activity size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Telemetry Points Received</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Live telemetry charts will begin plotting automatically as soon as your monitoring hardware establishes a data stream.
            </p>
          </div>
        )}
      </div>

      {/* ── Quick Access Grid: Reports, Emergency, Device, Location ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/reports"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Medical Reports</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Eye size={16} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800">Lab & Document OCR</p>
          <p className="text-xs text-slate-500 mt-1">Extract 30+ biomarkers & compare with live vitals</p>
        </Link>

        <Link
          to="/emergency-alerts"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-red-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emergency Hub</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800">Active Alert Center</p>
          <p className="text-xs text-slate-500 mt-1">{alerts.length} registered events • Caregiver escalations</p>
        </Link>

        <Link
          to="/emergency-location"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Geospatial</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle size={16} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800">GPS & Safe Boundary</p>
          <p className="text-xs text-slate-500 mt-1">Live coordinates & emergency dispatch location</p>
        </Link>

        <Link
          to="/device-status"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hardware</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Activity size={16} />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-800">IoT Device Telemetry</p>
          <p className="text-xs text-slate-500 mt-1">Battery, signal, accelerometer & sensor health</p>
        </Link>
      </div>

      {/* ── Mandatory Medical Disclaimer Banner ── */}
      <MedicalDisclaimer />

      {/* ── Explore Demo Modal (for real users) ── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Launch Interactive Demo Simulation?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will temporarily preview the system as elderly patient <strong>Margaret Vance (76)</strong> with live simulated sensor readings, alerts, and trend charts.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-5 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Shield size={14} className="text-emerald-600" />
                <span>Your Real Account is Completely Safe</span>
              </div>
              <p>• None of your personal details or settings will be modified.</p>
              <p>• You can return to your real account anytime with one click.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  setDemoMode(true);
                }}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Launch Demo Simulation
              </button>
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
