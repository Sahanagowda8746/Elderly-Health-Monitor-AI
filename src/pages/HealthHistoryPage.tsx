import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  History, Download, Filter, Calendar, Heart, Wind, Thermometer,
  Search, BarChart3, TrendingUp, ChevronLeft, ChevronRight,
  Activity, Plus, RefreshCw, AlertCircle, FileText, CheckCircle2,
  Sparkles, Layers, Clock, Database, X, Shield, AlertTriangle
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LiveChart } from '../components/LiveChart';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { format, subHours, subDays, subMonths } from 'date-fns';
import type { SensorReading, HealthAlert, MotionStatus } from '../types';

interface PatientReportItem {
  id: string;
  reportName: string;
  reportType: string;
  reportDate: string | null;
  extractionStatus: string;
  dataQuality: string;
  parameterCount: number;
  isDemo: boolean;
  createdAt: string;
  parameters?: {
    id: string;
    parameterName: string;
    value: string;
    unit: string | null;
    referenceRange: string | null;
    status: string;
  }[];
}

const DEMO_LAB_REPORTS: PatientReportItem[] = [
  {
    id: 'demo-rep-1',
    reportName: 'Comprehensive Metabolic & CBC Panel',
    reportType: 'cbc',
    reportDate: '2026-09-18',
    extractionStatus: 'complete',
    dataQuality: 'high',
    parameterCount: 12,
    isDemo: true,
    createdAt: '2026-09-18T10:30:00Z',
    parameters: [
      { id: 'p1', parameterName: 'Hemoglobin', value: '12.2', unit: 'g/dL', referenceRange: '12.0 - 15.5', status: 'normal' },
      { id: 'p2', parameterName: 'WBC Count', value: '8.9', unit: 'thousand/µL', referenceRange: '4.5 - 11.0', status: 'normal' },
      { id: 'p3', parameterName: 'Fasting Glucose', value: '118', unit: 'mg/dL', referenceRange: '70 - 99', status: 'abnormal' },
      { id: 'p4', parameterName: 'HbA1c', value: '6.3', unit: '%', referenceRange: '< 5.7', status: 'borderline' },
      { id: 'p5', parameterName: 'Total Cholesterol', value: '218', unit: 'mg/dL', referenceRange: '< 200', status: 'abnormal' },
      { id: 'p6', parameterName: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.6 - 1.2', status: 'normal' },
      { id: 'p7', parameterName: 'Potassium', value: '4.4', unit: 'mEq/L', referenceRange: '3.5 - 5.0', status: 'normal' },
    ],
  },
  {
    id: 'demo-rep-2',
    reportName: 'Baseline Annual Health Screen',
    reportType: 'general_health',
    reportDate: '2026-06-12',
    extractionStatus: 'complete',
    dataQuality: 'high',
    parameterCount: 10,
    isDemo: true,
    createdAt: '2026-06-12T09:15:00Z',
    parameters: [
      { id: 'p8', parameterName: 'Hemoglobin', value: '13.8', unit: 'g/dL', referenceRange: '12.0 - 15.5', status: 'normal' },
      { id: 'p9', parameterName: 'Fasting Glucose', value: '104', unit: 'mg/dL', referenceRange: '70 - 99', status: 'borderline' },
      { id: 'p10', parameterName: 'HbA1c', value: '5.8', unit: '%', referenceRange: '< 5.7', status: 'normal' },
      { id: 'p11', parameterName: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '< 200', status: 'normal' },
    ],
  },
];

export function HealthHistoryPage() {
  const { readings: contextReadings, settings, demoMode, sessionType, saveSensorReading } = useHealth();
  const { user, profile } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'telemetry' | 'alerts' | 'reports'>('telemetry');

  // Time range filter
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChartParam, setSelectedChartParam] = useState<'heartRate' | 'spo2' | 'temperature'>('heartRate');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Real user Supabase state
  const [dbReadings, setDbReadings] = useState<SensorReading[]>([]);
  const [dbAlerts, setDbAlerts] = useState<HealthAlert[]>([]);
  const [dbReports, setDbReports] = useState<PatientReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Manual reading modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    heartRate: '75',
    spo2: '97',
    temperature: '36.8',
    systolicBp: '120',
    diastolicBp: '80',
    motionStatus: 'normal' as MotionStatus,
  });
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMigrationHelper, setShowMigrationHelper] = useState(false);

  const isRealUser = sessionType === 'real' && !demoMode;

  // ── Fetch Real User Data from Supabase ──────────────────────────────────────
  const fetchRealHistory = useCallback(async () => {
    if (!isRealUser || !user || !isSupabaseConfigured()) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      // 1. Calculate time filter
      let timeFilter: string | null = null;
      const now = new Date();
      if (timeRange === '24h') {
        timeFilter = subHours(now, 24).toISOString();
      } else if (timeRange === '7d') {
        timeFilter = subDays(now, 7).toISOString();
      } else if (timeRange === '30d') {
        timeFilter = subDays(now, 30).toISOString();
      }

      // 2. Query sensor_readings for authenticated user
      let readingsQuery = supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(300);

      if (timeFilter) {
        readingsQuery = readingsQuery.gte('timestamp', timeFilter);
      }

      const { data: rawReadings, error: readErr } = await readingsQuery;
      if (readErr) throw readErr;

      const mappedReadings: SensorReading[] = (rawReadings || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        deviceId: r.device_id || '',
        timestamp: r.timestamp,
        heartRate: r.heart_rate,
        spo2: r.spo2,
        temperature: r.temperature,
        systolicBp: r.systolic_bp,
        diastolicBp: r.diastolic_bp,
        motionStatus: r.motion_status || 'normal',
        accelerometerX: r.accelerometer_x,
        accelerometerY: r.accelerometer_y,
        accelerometerZ: r.accelerometer_z,
        latitude: r.latitude,
        longitude: r.longitude,
        source: r.source || 'sensor',
      }));
      setDbReadings(mappedReadings);

      // 3. Query health_alerts for authenticated user
      let alertsQuery = supabase
        .from('health_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (timeFilter) {
        alertsQuery = alertsQuery.gte('created_at', timeFilter);
      }

      const { data: rawAlerts, error: alertErr } = await alertsQuery;
      if (!alertErr && rawAlerts) {
        setDbAlerts(rawAlerts.map((a: any) => ({
          id: a.id,
          userId: a.user_id,
          alertType: a.alert_type,
          severity: a.severity,
          parameter: a.parameter,
          value: a.value,
          message: a.message,
          riskScore: a.risk_score || 0,
          status: a.status,
          source: a.source || 'sensor',
          latitude: a.latitude,
          longitude: a.longitude,
          createdAt: a.created_at,
          acknowledgedAt: a.acknowledged_at,
          resolvedAt: a.resolved_at,
          explanation: a.explanation,
          observedFactors: Array.isArray(a.observed_factors) ? a.observed_factors : [],
        })));
      }

      // 4. Query patient_reports and report_parameters
      const { data: rawReports, error: repErr } = await supabase
        .from('patient_reports')
        .select(`
          id, report_name, report_type, report_date, extraction_status,
          data_quality, parameter_count, is_demo, created_at,
          report_parameters (
            id, parameter_name, value, unit, reference_range, status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!repErr && rawReports) {
        setDbReports(rawReports.map((r: any) => ({
          id: r.id,
          reportName: r.report_name,
          reportType: r.report_type,
          reportDate: r.report_date,
          extractionStatus: r.extraction_status,
          dataQuality: r.data_quality,
          parameterCount: r.parameter_count || (r.report_parameters?.length ?? 0),
          isDemo: r.is_demo ?? false,
          createdAt: r.created_at,
          parameters: (r.report_parameters || []).map((p: any) => ({
            id: p.id,
            parameterName: p.parameter_name,
            value: p.value,
            unit: p.unit,
            referenceRange: p.reference_range,
            status: p.status,
          })),
        })));
      }
    } catch (err: any) {
      console.error('Error fetching health history:', err);
      setFetchError(err.message || 'Failed to load historical records from database.');
    } finally {
      setIsLoading(false);
    }
  }, [isRealUser, user, timeRange]);

  useEffect(() => {
    if (isRealUser) {
      fetchRealHistory();
    }
  }, [isRealUser, fetchRealHistory]);

  // Active dataset for telemetry
  const activeReadings = useMemo(() => {
    if (isRealUser) {
      return dbReadings;
    }
    // In demo mode: filter context readings by timeRange
    const now = new Date();
    return contextReadings.filter(r => {
      if (timeRange === 'all') return true;
      const t = new Date(r.timestamp);
      if (timeRange === '24h') return t >= subHours(now, 24);
      if (timeRange === '7d') return t >= subDays(now, 7);
      if (timeRange === '30d') return t >= subDays(now, 30);
      return true;
    });
  }, [isRealUser, dbReadings, contextReadings, timeRange]);

  // Filtered readings by search term
  const filteredReadings = useMemo(() => {
    if (!searchTerm) return activeReadings;
    const term = searchTerm.toLowerCase();
    return activeReadings.filter(r => (
      r.motionStatus.toLowerCase().includes(term) ||
      (r.source && r.source.toLowerCase().includes(term)) ||
      (r.heartRate && r.heartRate.toString().includes(term)) ||
      (r.spo2 && r.spo2.toString().includes(term)) ||
      (r.temperature && r.temperature.toString().includes(term))
    ));
  }, [activeReadings, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const validHr = filteredReadings.filter(r => r.heartRate !== null).map(r => r.heartRate!);
    const validSpo2 = filteredReadings.filter(r => r.spo2 !== null).map(r => r.spo2!);
    const validTemp = filteredReadings.filter(r => r.temperature !== null).map(r => r.temperature!);
    const validSys = filteredReadings.filter(r => r.systolicBp !== null).map(r => r.systolicBp!);
    const validDia = filteredReadings.filter(r => r.diastolicBp !== null).map(r => r.diastolicBp!);

    const avgHr = validHr.length ? Math.round(validHr.reduce((a, b) => a + b, 0) / validHr.length) : null;
    const minHr = validHr.length ? Math.min(...validHr) : null;
    const maxHr = validHr.length ? Math.max(...validHr) : null;

    const avgSpo2 = validSpo2.length ? Math.round(validSpo2.reduce((a, b) => a + b, 0) / validSpo2.length) : null;
    const minSpo2 = validSpo2.length ? Math.min(...validSpo2) : null;

    const avgTemp = validTemp.length ? (validTemp.reduce((a, b) => a + b, 0) / validTemp.length).toFixed(1) : null;

    const avgSys = validSys.length ? Math.round(validSys.reduce((a, b) => a + b, 0) / validSys.length) : null;
    const avgDia = validDia.length ? Math.round(validDia.reduce((a, b) => a + b, 0) / validDia.length) : null;

    return { avgHr, minHr, maxHr, avgSpo2, minSpo2, avgTemp, avgSys, avgDia, totalRecords: filteredReadings.length };
  }, [filteredReadings]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / pageSize));
  const currentItems = filteredReadings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // CSV Export
  const exportCSV = () => {
    const headers = [
      'Record ID', 'Timestamp', 'Heart Rate (BPM)', 'SpO2 (%)',
      'Body Temp (C)', 'Systolic BP (mmHg)', 'Diastolic BP (mmHg)',
      'Motion Posture', 'Data Source'
    ];
    const rows = filteredReadings.map(r => [
      r.id,
      r.timestamp,
      r.heartRate ?? '',
      r.spo2 ?? '',
      r.temperature ?? '',
      r.systolicBp ?? '',
      r.diastolicBp ?? '',
      r.motionStatus,
      isRealUser ? (r.source || 'sensor') : 'synthetic_demo',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `health_history_${isRealUser ? 'user_records' : 'demo'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit manual vitals entry
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    setSaveMessage(null);

    const hr = manualForm.heartRate ? parseFloat(manualForm.heartRate) : null;
    const spo2 = manualForm.spo2 ? parseFloat(manualForm.spo2) : null;
    const temp = manualForm.temperature ? parseFloat(manualForm.temperature) : null;
    const sys = manualForm.systolicBp ? parseFloat(manualForm.systolicBp) : null;
    const dia = manualForm.diastolicBp ? parseFloat(manualForm.diastolicBp) : null;

    const res = await saveSensorReading({
      heartRate: hr,
      spo2: spo2,
      temperature: temp,
      systolicBp: sys,
      diastolicBp: dia,
      motionStatus: manualForm.motionStatus,
      source: 'manual',
    });

    setIsSavingManual(false);

    if (res.success) {
      if (res.reading) {
        setDbReadings(prev => [res.reading!, ...prev]);
        setFetchError(null);
      }
      setSaveMessage({ type: 'success', text: 'Vitals entry saved successfully!' });
      setTimeout(() => {
        setShowAddModal(false);
        setSaveMessage(null);
        if (isRealUser) fetchRealHistory();
      }, 800);
    } else {
      const isSchemaError = res.error && (res.error.includes('sensor_readings') || res.error.includes('schema cache'));
      setSaveMessage({
        type: 'error',
        text: isSchemaError
          ? "Database setup required: Table 'public.sensor_readings' not found in your Supabase project. Run the migration in your Supabase SQL Editor."
          : (res.error || 'Failed to record vitals')
      });
    }
  };

  const activeReports = isRealUser ? dbReports : DEMO_LAB_REPORTS;

  return (
    <div className="space-y-6">
      {/* ── Environment Status Banners ── */}
      {demoMode ? (
        <div className="bg-gradient-to-r from-teal-900 via-blue-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wide">
                    DEMO SIMULATION ENVIRONMENT
                  </span>
                  <span className="text-[10px] bg-teal-400/20 text-teal-300 border border-teal-400/40 px-2 py-0.5 rounded-full font-bold">
                    Synthetic Demonstration Telemetry
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Showing demonstration records and sample laboratory panels for <strong>Margaret Vance (76)</strong>. Simulated records are completely isolated and never mixed into real patient accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Database size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    Personal Health History & Auditable Logs
                  </h1>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Shield size={10} />
                    Verified RLS Account Scoped
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient:{' '}
                  <strong className="text-slate-800">
                    {profile?.patientName || profile?.fullName || user?.email || 'Authenticated User'}
                  </strong>
                  {' • '}
                  Only records explicitly saved for this account ID are queried from Supabase.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus size={14} />
                <span>Log Vitals Check-in</span>
              </button>
              <button
                onClick={fetchRealHistory}
                disabled={isLoading}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                title="Refresh from Database"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'telemetry'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity size={15} />
            <span>Vital Telemetry ({filteredReadings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'alerts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Logged Alerts ({isRealUser ? dbAlerts.length : 'Live'})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={15} />
            <span>Clinical Lab Reports ({activeReports.length})</span>
          </button>
        </div>

        {/* Time Filter & Export Buttons */}
        {activeTab === 'telemetry' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {(['24h', '7d', '30d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all uppercase ${
                    timeRange === range ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>

            <button
              onClick={exportCSV}
              disabled={filteredReadings.length === 0}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Error Banner if any ── */}
      {fetchError && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {fetchError.includes('sensor_readings') || fetchError.includes('schema cache')
                    ? "Supabase Setup Required: Table 'public.sensor_readings' Not Found"
                    : 'Database Query Notice'}
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {fetchError.includes('sensor_readings') || fetchError.includes('schema cache')
                    ? "Your hosted Supabase project does not have the 'public.sensor_readings' table created yet. Run the SQL migration in your Supabase SQL Editor to enable real telemetry persistence."
                    : fetchError}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {(fetchError.includes('sensor_readings') || fetchError.includes('schema cache')) && (
                <button
                  onClick={() => setShowMigrationHelper(!showMigrationHelper)}
                  className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-colors"
                >
                  {showMigrationHelper ? 'Hide SQL Script' : 'View Migration SQL'}
                </button>
              )}
              <button
                onClick={fetchRealHistory}
                className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>

          {showMigrationHelper && (
            <div className="mt-3 p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 border border-slate-700 font-mono">
              <div className="flex items-center justify-between text-slate-300 font-sans pb-1 border-b border-slate-800">
                <span className="font-bold text-teal-400">Run in Supabase Dashboard SQL Editor:</span>
                <span className="text-[11px] text-slate-400">supabase/migrations/20261012200000_create_sensor_readings.sql</span>
              </div>
              <pre className="text-[11px] text-teal-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
{`CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT DEFAULT 'manual-entry',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  heart_rate NUMERIC,
  spo2 NUMERIC,
  temperature NUMERIC,
  systolic_bp NUMERIC,
  diastolic_bp NUMERIC,
  motion_status TEXT DEFAULT 'normal',
  source TEXT NOT NULL DEFAULT 'sensor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sensor readings"
  ON public.sensor_readings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sensor readings"
  ON public.sensor_readings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';`}
              </pre>
              <p className="text-[11px] text-slate-400 font-sans pt-1">
                After clicking <strong>Run</strong> in the Supabase Dashboard, click <strong>Retry Connection</strong> above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 1: SENSOR TELEMETRY & VITALS HISTORY ── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Aggregate Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Heart Rate Span</span>
                <Heart size={16} className="text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {stats.avgHr !== null ? stats.avgHr : '--'}
                </span>
                <span className="text-xs text-slate-500 font-medium">BPM Avg</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Lowest: <strong className="text-slate-700">{stats.minHr ?? '--'} BPM</strong></span>
                <span>Peak: <strong className="text-slate-700">{stats.maxHr ?? '--'} BPM</strong></span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">SpO₂ Oxygen Span</span>
                <Wind size={16} className="text-sky-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {stats.avgSpo2 !== null ? `${stats.avgSpo2}%` : '--'}
                </span>
                <span className="text-xs text-slate-500 font-medium">Mean Saturation</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Minimum Dip: <strong className="text-slate-700">{stats.minSpo2 !== null ? `${stats.minSpo2}%` : '--'}</strong></span>
                <span>Target: &gt;= 95%</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skin Temp Mean</span>
                <Thermometer size={16} className="text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {stats.avgTemp !== null ? `${stats.avgTemp}°C` : '--'}
                </span>
                <span className="text-xs text-slate-500 font-medium">Normative</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Fever Threshold: 38.0°C</span>
                <span>Stable Baseline</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Blood Pressure Mean</span>
                <Activity size={16} className="text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {stats.avgSys !== null && stats.avgDia !== null ? `${stats.avgSys}/${stats.avgDia}` : '--/--'}
                </span>
                <span className="text-xs text-slate-500 font-medium">mmHg Avg</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Target: &lt; 130/85</span>
                <span>Vascular index</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Longitudinal Vital Trajectory</h2>
                <p className="text-xs text-slate-500">
                  {isRealUser
                    ? 'Chronological readings recorded in personal Supabase account'
                    : 'Continuous sliding telemetry stream over demonstration session'}
                </p>
              </div>

              {/* Chart Parameter Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setSelectedChartParam('heartRate')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedChartParam === 'heartRate' ? 'bg-white shadow text-rose-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  Heart Rate
                </button>
                <button
                  onClick={() => setSelectedChartParam('spo2')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedChartParam === 'spo2' ? 'bg-white shadow text-sky-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  SpO₂
                </button>
                <button
                  onClick={() => setSelectedChartParam('temperature')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedChartParam === 'temperature' ? 'bg-white shadow text-amber-700 font-bold' : 'text-slate-600'
                  }`}
                >
                  Temperature
                </button>
              </div>
            </div>

            {filteredReadings.length > 0 ? (
              <LiveChart
                readings={filteredReadings}
                parameter={selectedChartParam}
                label={`${selectedChartParam === 'heartRate' ? 'Heart Rate' : selectedChartParam === 'spo2' ? 'Blood Oxygen (SpO₂)' : 'Body Temperature'} Longitudinal Profile`}
                unit={selectedChartParam === 'heartRate' ? 'BPM' : selectedChartParam === 'spo2' ? '%' : '°C'}
                color={selectedChartParam === 'heartRate' ? '#f43f5e' : selectedChartParam === 'spo2' ? '#0ea5e9' : '#f59e0b'}
                referenceLines={
                  selectedChartParam === 'heartRate'
                    ? [
                        { value: settings.thresholds.heartRateMin, color: '#f59e0b', label: 'Min' },
                        { value: settings.thresholds.heartRateMax, color: '#ef4444', label: 'Max' },
                      ]
                    : selectedChartParam === 'spo2'
                    ? [{ value: settings.thresholds.spo2Min, color: '#ef4444', label: 'SpO₂ Target' }]
                    : [{ value: settings.thresholds.temperatureMax, color: '#ef4444', label: 'Fever Line' }]
                }
                windowCount={50}
              />
            ) : (
              <div className="h-44 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                <Activity size={28} className="text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Telemetry In Selected Date Window</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {isRealUser
                    ? 'No vital sign entries match the current time filter. Record a check-in or expand to All Time.'
                    : 'Awaiting demo telemetry ingestion.'}
                </p>
              </div>
            )}
          </div>

          {/* Auditable Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Historical Telemetry Log</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {filteredReadings.length} Total Records
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isRealUser
                    ? 'Cryptographically authenticated entries isolated to current patient UID'
                    : 'Synthetically generated verification frames for demonstration review'}
                </p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search motion, source or value..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mb-2 text-blue-600" />
                <p className="text-xs font-semibold">Loading verified records from Supabase...</p>
              </div>
            ) : filteredReadings.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center p-6 bg-slate-50/50">
                <Database size={32} className="text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No Biometric Records Logged</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  {isRealUser
                    ? 'Your personal health account does not currently have any recorded telemetry entries for this time period. Pair an IoT monitoring band or log your first manual check-in below.'
                    : 'The synthetic simulator stream has not ingested any readings yet.'}
                </p>
                {isRealUser && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Log First Vitals Entry
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Heart Rate</th>
                      <th className="py-2.5 px-3">Oxygen (SpO₂)</th>
                      <th className="py-2.5 px-3">Body Temp</th>
                      <th className="py-2.5 px-3">Blood Pressure</th>
                      <th className="py-2.5 px-3">Motion Posture</th>
                      <th className="py-2.5 px-3">Data Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {currentItems.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-slate-600 font-sans">
                          {format(new Date(r.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-600">
                          {r.heartRate !== null && r.heartRate !== undefined ? `${r.heartRate} BPM` : '--'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-sky-600">
                          {r.spo2 !== null && r.spo2 !== undefined ? `${r.spo2}%` : '--'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-600">
                          {r.temperature !== null && r.temperature !== undefined ? `${r.temperature.toFixed(1)}°C` : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-indigo-700 font-medium">
                          {r.systolicBp && r.diastolicBp ? `${r.systolicBp}/${r.diastolicBp} mmHg` : '--/--'}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`capitalize px-2 py-0.5 rounded text-[11px] font-medium ${
                            r.motionStatus === 'fall_detected'
                              ? 'bg-red-100 text-red-700 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {r.motionStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            r.source === 'manual'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : r.source === 'sensor'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {r.source || 'sensor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            {filteredReadings.length > 0 && (
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
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: HISTORICAL HEALTH ALERTS ── */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Historical Health Events & Alert Logs</h3>
            <p className="text-xs text-slate-500">
              {isRealUser
                ? 'Persistent audit record of physiological anomalies and caregiver notifications'
                : 'Simulated demonstration alert escalation history'}
            </p>
          </div>

          {(isRealUser ? dbAlerts : []).length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center p-6 bg-slate-50/50">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Critical Health Alerts Recorded</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No past abnormal threshold violations or fall alerts have been triggered for this patient profile.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dbAlerts.map(alert => (
                <div key={alert.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high_risk' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{alert.message}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Parameter: <strong>{alert.parameter} ({alert.value})</strong> • Score: {alert.riskScore}
                      </p>
                      {alert.explanation && (
                        <p className="text-slate-600 text-[11px] mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {alert.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:flex-shrink-0">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                    </span>
                    <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      alert.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      alert.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: CLINICAL LAB REPORTS & BIOMARKERS ── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Diagnostic Reports & Extracted Biomarker History
                </h3>
                <p className="text-xs text-slate-500">
                  Clinical laboratory panels, hematology findings, and metabolic parameters preserved separately from sensor telemetry
                </p>
              </div>

              {!isRealUser && (
                <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                  Demonstration Lab Panels
                </span>
              )}
            </div>

            {activeReports.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center p-6 bg-slate-50/50">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No Clinical Reports On File</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You haven't uploaded or scanned any laboratory diagnostic reports yet. Visit Patient Reports to ingest a PDF or text lab report.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeReports.map(report => (
                  <div key={report.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{report.reportName}</h4>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {report.reportType.toUpperCase()}
                          </span>
                          {report.isDemo && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Report Date: <strong>{report.reportDate || 'N/A'}</strong> • Data Quality: <strong>{report.dataQuality}</strong>
                        </p>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Uploaded: {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    {/* Parameters Table */}
                    {report.parameters && report.parameters.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-white text-slate-600 uppercase font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Biomarker</th>
                              <th className="py-2 px-3">Observed Value</th>
                              <th className="py-2 px-3">Unit</th>
                              <th className="py-2 px-3">Reference Range</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 bg-white">
                            {report.parameters.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-3 font-semibold text-slate-800">{p.parameterName}</td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.value}</td>
                                <td className="py-2 px-3 text-slate-500">{p.unit || '--'}</td>
                                <td className="py-2 px-3 text-slate-500">{p.referenceRange || '--'}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    p.status === 'abnormal' ? 'bg-red-100 text-red-700' :
                                    p.status === 'borderline' ? 'bg-amber-100 text-amber-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No extracted parameters recorded for this report.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manual Vitals Entry Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Log Manual Vitals Entry</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Record a verified manual vital signs check-in. The entry will be immediately persisted into your personal Supabase health history.
            </p>

            <form onSubmit={handleSaveManual} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    value={manualForm.heartRate}
                    onChange={(e) => setManualForm({ ...manualForm, heartRate: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Oxygen (SpO₂ %)
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={manualForm.spo2}
                    onChange={(e) => setManualForm({ ...manualForm, spo2: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Body Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="34"
                    max="42"
                    value={manualForm.temperature}
                    onChange={(e) => setManualForm({ ...manualForm, temperature: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motion Posture
                  </label>
                  <select
                    value={manualForm.motionStatus}
                    onChange={(e) => setManualForm({ ...manualForm, motionStatus: e.target.value as MotionStatus })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal / Active</option>
                    <option value="inactive">Resting / Inactive</option>
                    <option value="elevated">Elevated Activity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="240"
                    value={manualForm.systolicBp}
                    onChange={(e) => setManualForm({ ...manualForm, systolicBp: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="140"
                    value={manualForm.diastolicBp}
                    onChange={(e) => setManualForm({ ...manualForm, diastolicBp: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {saveMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold ${
                  saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {saveMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingManual && <RefreshCw size={13} className="animate-spin" />}
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MedicalDisclaimer />
    </div>
  );
}
