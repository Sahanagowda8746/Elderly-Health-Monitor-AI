import React, {
  createContext, useContext, useEffect, useRef, useState, useCallback,
} from 'react';
import { DemoSimulator } from '../lib/demoSimulator';
import {
  calculateRiskScore,
  extractTrends,
  generatePredictiveAlerts,
  generateHealthInsights,
  DEFAULT_THRESHOLDS,
} from '../lib/healthEngine';
import type {
  SensorReading, HealthRiskScore, VitalTrends, PredictiveAlert,
  HealthInsight, HealthAlert, Notification, DemoScenario, AppSettings,
  MonitoringThresholds, Device,
} from '../types';
import { useAuth } from './AuthContext';
import type { SessionType } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_SETTINGS: AppSettings = {
  thresholds: DEFAULT_THRESHOLDS,
  notifications: {
    criticalAlerts: true,
    warningAlerts: true,
    reportReady: true,
    deviceStatus: true,
    emailAlerts: false,
  },
  demo: {
    enabled: true,
    scenario: 'normal',
    speed: 'normal',
    autoProgress: true,
  },
  display: {
    showRiskExplanation: true,
    chartWindowMinutes: 30,
    language: 'en',
  },
};

interface HealthContextValue {
  // Readings
  readings: SensorReading[];
  latestReading: SensorReading | null;
  // Computed
  riskScore: HealthRiskScore | null;
  trends: VitalTrends | null;
  predictiveAlerts: PredictiveAlert[];
  insights: HealthInsight[];
  // Alerts
  alerts: HealthAlert[];
  unreadAlertCount: number;
  acknowledgeAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Device
  device: Device;
  // Demo
  demoMode: boolean;
  sessionType: SessionType;
  demoScenario: DemoScenario;
  setDemoMode: (on: boolean) => void;
  setDemoScenario: (s: DemoScenario) => void;
  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  updateThresholds: (t: Partial<MonitoringThresholds>) => void;
  // Actions
  clearReadings: () => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

const SPEED_MS: Record<string, number> = { slow: 5000, normal: 3000, fast: 1500 };

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user, sessionType } = useAuth();
  const userId = user?.id ?? (sessionType === 'demo' ? 'demo-user' : 'no-user');

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  // demoMode is TRUE only when the session is a demo session
  const demoMode = sessionType === 'demo';
  const [demoScenario, setDemoScenarioState] = useState<DemoScenario>('normal');
  // Internal override: allows a real user to temporarily explore demo from dashboard
  const [demoModeOverride, setDemoModeOverride] = useState(false);
  const effectiveDemoMode = demoMode || demoModeOverride;

  const simulatorRef = useRef<DemoSimulator>(new DemoSimulator(userId));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const trends = readings.length >= 3 ? extractTrends(readings) : null;
  const riskScore = latestReading
    ? calculateRiskScore(
        latestReading,
        trends,
        settings.thresholds,
        alerts.some(a => a.alertType === 'fall_detected' && a.status !== 'resolved'),
        alerts.filter(a => a.status === 'unacknowledged').length
      )
    : null;

  const predictiveAlerts = trends && latestReading
    ? generatePredictiveAlerts(trends, latestReading, settings.thresholds)
    : [];

  const insights = trends && latestReading
    ? generateHealthInsights(latestReading, trends, readings, settings.thresholds)
    : [];

  const unreadAlertCount = alerts.filter(a => a.status === 'unacknowledged').length;
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const [realDevice, setRealDevice] = useState<Device | null>(null);

  const device: Device = effectiveDemoMode
    ? {
        id: 'dev-demo-001',
        userId,
        deviceName: 'Demo Biosensor Band',
        deviceType: 'demo',
        connectionStatus: 'connected',
        lastSeen: latestReading?.timestamp ?? new Date().toISOString(),
        deviceId: 'DEMO-001',
        firmwareVersion: 'v1.0.0-demo',
        location: 'Home',
      }
    : (realDevice ?? {
        id: 'dev-001',
        userId,
        deviceName: 'Raspberry Pi / ESP32 Monitor',
        deviceType: 'raspberry_pi',
        connectionStatus: 'disconnected',
        lastSeen: null,
        deviceId: '',
        firmwareVersion: 'v1.0.0',
        location: 'Standby',
      });

  // Push notification helper
  const pushNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  }, []);

  // Push alert helper
  const pushAlert = useCallback((reading: SensorReading, score: number) => {
    const thresholds = settings.thresholds;
    const newAlerts: HealthAlert[] = [];

    if (reading.motionStatus === 'fall_detected') {
      const alert: HealthAlert = {
        id: `alert-fall-${Date.now()}`,
        userId,
        alertType: 'fall_detected',
        severity: 'critical',
        parameter: 'Motion',
        value: 'Fall Detected',
        message: 'Possible fall event detected. Vital signs and subsequent movement are being monitored.',
        riskScore: score,
        status: 'unacknowledged',
        source: 'fall',
        latitude: reading.latitude,
        longitude: reading.longitude,
        createdAt: reading.timestamp,
        acknowledgedAt: null,
        resolvedAt: null,
        explanation: 'Abnormal motion pattern detected consistent with a possible fall event. Post-event inactivity monitoring has been initiated.',
        observedFactors: ['Abnormal acceleration pattern', 'Subsequent inactivity detected'],
      };
      newAlerts.push(alert);
      pushNotification({
        type: 'critical',
        title: 'Possible Fall Detected',
        message: 'Abnormal motion pattern detected. Emergency workflow initiated.',
        alertId: alert.id,
      });
    }

    if (reading.heartRate !== null && reading.heartRate > thresholds.heartRateMax + 15) {
      const alert: HealthAlert = {
        id: `alert-hr-${Date.now()}`,
        userId,
        alertType: 'vital_abnormal',
        severity: score > 70 ? 'critical' : 'high_risk',
        parameter: 'Heart Rate',
        value: `${reading.heartRate} BPM`,
        message: `Heart rate detected at ${reading.heartRate} BPM, which is significantly above the configured upper demonstration range of ${thresholds.heartRateMax} BPM.`,
        riskScore: score,
        status: 'unacknowledged',
        source: 'sensor',
        latitude: reading.latitude,
        longitude: reading.longitude,
        createdAt: reading.timestamp,
        acknowledgedAt: null,
        resolvedAt: null,
        explanation: `Both the current value and the observed trend indicate an abnormal pattern requiring attention.`,
        observedFactors: ['Heart rate outside demonstration range', 'Sustained upward trend observed'],
      };
      newAlerts.push(alert);
      pushNotification({
        type: score > 70 ? 'critical' : 'warning',
        title: 'Abnormal Heart Rate Detected',
        message: `Heart rate at ${reading.heartRate} BPM — outside configured range.`,
        alertId: alert.id,
      });
    }

    if (reading.spo2 !== null && reading.spo2 < thresholds.spo2Min - 3) {
      const alert: HealthAlert = {
        id: `alert-spo2-${Date.now()}`,
        userId,
        alertType: 'vital_abnormal',
        severity: reading.spo2 < 90 ? 'critical' : 'high_risk',
        parameter: 'SpO₂',
        value: `${reading.spo2}%`,
        message: `SpO₂ detected at ${reading.spo2}%, below the configured lower demonstration range of ${thresholds.spo2Min}%.`,
        riskScore: score,
        status: 'unacknowledged',
        source: 'sensor',
        latitude: reading.latitude,
        longitude: reading.longitude,
        createdAt: reading.timestamp,
        acknowledgedAt: null,
        resolvedAt: null,
        explanation: 'SpO₂ has moved outside its configured demonstration range and the decreasing trend has persisted across multiple readings.',
        observedFactors: ['SpO₂ below demonstration range', 'Decreasing trend persisting'],
      };
      newAlerts.push(alert);
      pushNotification({
        type: reading.spo2 < 90 ? 'critical' : 'warning',
        title: 'Low SpO₂ Detected',
        message: `SpO₂ at ${reading.spo2}% — monitoring recommended.`,
        alertId: alert.id,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const existingTypes = new Set(prev.filter(a => a.status === 'unacknowledged').map(a => `${a.alertType}-${a.parameter}`));
        const toAdd = newAlerts.filter(a => !existingTypes.has(`${a.alertType}-${a.parameter}`));
        return [...toAdd, ...prev].slice(0, 100);
      });
    }
  }, [userId, settings.thresholds, pushNotification]);

  // ── Load Real User Data from Supabase ──────────────────────────────────────
  useEffect(() => {
    if (sessionType !== 'real' || !user || !isSupabaseConfigured() || effectiveDemoMode) {
      return;
    }

    let isMounted = true;

    async function loadRealData() {
      try {
        // 1. Fetch real device status
        const { data: devData } = await supabase
          .from('devices')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle();

        if (isMounted && devData) {
          setRealDevice({
            id: devData.id,
            userId: user!.id,
            deviceName: devData.device_name || 'Raspberry Pi Health Monitor',
            deviceType: devData.device_type || 'raspberry_pi',
            connectionStatus: devData.connection_status || 'disconnected',
            lastSeen: devData.last_seen || null,
            deviceId: devData.device_id || '',
            firmwareVersion: devData.firmware_version || 'v1.0.0',
            location: devData.location || 'Home',
          });
        }

        // 2. Fetch sensor readings
        const { data: readingsData } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('user_id', user!.id)
          .order('timestamp', { ascending: true })
          .limit(100);

        if (isMounted) {
          if (readingsData && readingsData.length > 0) {
            const mapped: SensorReading[] = readingsData.map((r: any) => ({
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
            setReadings(mapped);
          } else {
            setReadings([]);
          }
        }

        // 3. Fetch health alerts
        const { data: alertsData } = await supabase
          .from('health_alerts')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (isMounted) {
          if (alertsData && alertsData.length > 0) {
            const mappedAlerts: HealthAlert[] = alertsData.map((a: any) => ({
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
            }));
            setAlerts(mappedAlerts);
          } else {
            setAlerts([]);
          }
        }
      } catch (err) {
        console.warn('Real user data loading exception:', err);
      }
    }

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [sessionType, user, effectiveDemoMode]);

  // Demo simulator loop — only runs when session is a demo or user triggered override
  useEffect(() => {
    if (!effectiveDemoMode) {
      if (timerRef.current) clearInterval(timerRef.current);
      // Clear readings when exiting demo so real dashboard is empty
      if (sessionType === 'real') setReadings([]);
      return;
    }

    simulatorRef.current.setScenario(demoScenario);

    const run = () => {
      const reading = simulatorRef.current.nextReading();
      setReadings(prev => [...prev.slice(-200), reading]);

      // Compute score for alert threshold checks
      const currentReadings = simulatorRef.current.getReadings();
      const currentTrends = currentReadings.length >= 3 ? extractTrends(currentReadings) : null;
      const score = calculateRiskScore(reading, currentTrends, settings.thresholds).total;

      if (score > 60 || reading.motionStatus === 'fall_detected') {
        pushAlert(reading, score);
      }
    };

    run(); // immediate first reading
    timerRef.current = setInterval(run, SPEED_MS[settings.demo.speed] ?? 3000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [effectiveDemoMode, demoScenario, settings.demo.speed, settings.thresholds, pushAlert, sessionType]);

  const setDemoMode = (on: boolean) => {
    // For real users: toggle the override flag (temporary demo exploration)
    setDemoModeOverride(on);
    if (!on && timerRef.current) clearInterval(timerRef.current);
    if (on) {
      pushNotification({ type: 'info', title: 'Demo Mode Enabled', message: 'Simulated sensor data is now active. This does not affect your personal health records.' });
    } else if (sessionType === 'real') {
      setReadings([]);
      setAlerts([]);
      pushNotification({ type: 'info', title: 'Demo Exited', message: 'Returned to your personal account. No real sensor data has been affected.' });
    }
  };

  const setDemoScenario = (s: DemoScenario) => {
    setDemoScenarioState(s);
    setReadings([]);
    simulatorRef.current.setScenario(s);
    setAlerts([]);
    pushNotification({
      type: 'info',
      title: 'Demo Scenario Changed',
      message: `Scenario: ${s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
    });
  };

  const acknowledgeAlert = (id: string) => {
    const now = new Date().toISOString();
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'acknowledged', acknowledgedAt: now } : a
    ));
    if (sessionType === 'real' && isSupabaseConfigured() && user) {
      supabase.from('health_alerts').update({ status: 'acknowledged', acknowledged_at: now }).eq('id', id).then();
    }
    pushNotification({ type: 'info', title: 'Alert Acknowledged', message: 'The alert has been acknowledged by the caregiver.' });
  };

  const resolveAlert = (id: string) => {
    const now = new Date().toISOString();
    setAlerts(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'resolved', resolvedAt: now } : a
    ));
    if (sessionType === 'real' && isSupabaseConfigured() && user) {
      supabase.from('health_alerts').update({ status: 'resolved', resolved_at: now }).eq('id', id).then();
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateThresholds = (t: Partial<MonitoringThresholds>) => {
    setSettings(prev => ({ ...prev, thresholds: { ...prev.thresholds, ...t } }));
  };

  const clearReadings = () => {
    setReadings([]);
    simulatorRef.current.reset();
  };

  return (
    <HealthContext.Provider value={{
      readings, latestReading,
      riskScore, trends, predictiveAlerts, insights,
      alerts, unreadAlertCount, acknowledgeAlert, resolveAlert,
      notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead,
      device,
      demoMode: effectiveDemoMode, sessionType, demoScenario, setDemoMode, setDemoScenario,
      settings, updateSettings, updateThresholds,
      clearReadings,
    }}>
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used inside HealthProvider');
  return ctx;
}
