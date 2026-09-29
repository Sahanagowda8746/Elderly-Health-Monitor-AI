export type UserRole = 'patient' | 'caregiver' | 'admin';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type AlertSeverity = 'info' | 'warning' | 'high_risk' | 'critical';

export type AlertStatus = 'unacknowledged' | 'acknowledged' | 'resolved';

export type AlertType =
  | 'vital_abnormal'
  | 'trend_warning'
  | 'predictive_alert'
  | 'fall_detected'
  | 'emergency'
  | 'device_offline'
  | 'report_ready';

export type MotionStatus = 'normal' | 'elevated' | 'fall_detected' | 'inactive';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export type DataQuality = 'high' | 'moderate' | 'limited' | 'unknown';

export type TrendDirection = 'rising' | 'falling' | 'stable' | 'insufficient_data';

export type ReportType =
  | 'blood_test'
  | 'cbc'
  | 'blood_sugar'
  | 'lipid_profile'
  | 'thyroid_profile'
  | 'liver_function'
  | 'kidney_function'
  | 'blood_pressure_report'
  | 'ecg_report'
  | 'general_health'
  | 'other';

export type DemoScenario =
  | 'normal'
  | 'increasing_heart_rate'
  | 'decreasing_spo2'
  | 'increasing_temperature'
  | 'combined_risk'
  | 'fall_emergency';

// ─── Health Data ─────────────────────────────────────────────────────────────

export interface VitalSigns {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  motionStatus: MotionStatus;
  accelerometerX?: number;
  accelerometerY?: number;
  accelerometerZ?: number;
}

export interface SensorReading extends VitalSigns {
  id: string;
  userId: string;
  deviceId: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  source: 'sensor' | 'demo' | 'manual';
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number;
  rateOfChange: number;
  recentAverage: number | null;
  readingCount: number;
  durationMinutes: number;
  description: string;
}

export interface VitalTrends {
  heartRate: TrendAnalysis;
  spo2: TrendAnalysis;
  temperature: TrendAnalysis;
}

export interface HealthRiskScore {
  total: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
  label: string;
  components: {
    heartRateScore: number;
    spo2Score: number;
    temperatureScore: number;
    trendMultiplier: number;
    multiParamBonus: number;
    fallBonus: number;
    alertBonus: number;
  };
  explanation: string;
  observedFactors: string[];
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export interface HealthAlert {
  id: string;
  userId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  parameter: string;
  value: string;
  message: string;
  riskScore: number;
  status: AlertStatus;
  source: 'sensor' | 'trend' | 'report' | 'fall' | 'combined';
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  explanation?: string;
  observedFactors?: string[];
}

// ─── Devices ──────────────────────────────────────────────────────────────────

export interface Device {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'raspberry_pi' | 'esp32' | 'demo';
  connectionStatus: ConnectionStatus;
  lastSeen: string | null;
  deviceId: string;
  firmwareVersion?: string;
  location?: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  // Account credentials
  fullName: string;
  email: string;
  phone: string | null;
  // Patient information
  patientName: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  patientPhone: string | null;
  // Emergency contact
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  // Caregiver
  caregiverName: string | null;
  caregiverPhone: string | null;
  caregiverRelationship: string | null;
  // Health profile (all optional)
  medicalNotes: string | null;
  allergies: string | null;
  existingConditions: string | null;
  medications: string | null;
  // Legacy / device
  emergencyContact: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportParameter {
  id: string;
  reportId: string;
  parameterName: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  extractedText: string | null;
  extractionConfidence: 'high' | 'moderate' | 'low';
  status: 'normal' | 'abnormal' | 'borderline' | 'unknown';
  createdAt: string;
}

export interface PatientReport {
  id: string;
  userId: string;
  reportName: string;
  reportType: ReportType;
  filePath: string | null;
  uploadDate: string;
  reportDate: string | null;
  extractionStatus: 'pending' | 'processing' | 'complete' | 'failed';
  analysisStatus: 'pending' | 'processing' | 'complete' | 'failed';
  dataQuality: DataQuality;
  parameterCount: number;
  isDemo: boolean;
  createdAt: string;
  parameters?: ReportParameter[];
}

export interface ReportComparison {
  parameterName: string;
  previousValue: string | null;
  currentValue: string | null;
  unit: string | null;
  trend: TrendDirection;
  changeDescription: string;
  clinicalNote: string;
}

// ─── Health Intelligence ──────────────────────────────────────────────────────

export interface PredictiveAlert {
  id: string;
  parameter: string;
  trend: TrendAnalysis;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  riskScore: number;
  createdAt: string;
  isActive: boolean;
  message?: string;
  urgency?: string;
  predictedTimeToThreshold?: string;
  contributingFactors?: string[];
  recommendedAction?: string;
}

export interface HealthInsight {
  id: string;
  category: 'sensor' | 'trend' | 'report' | 'combined';
  parameter: string;
  observation: string;
  confidence: 'high' | 'moderate' | 'low' | 'insufficient';
  timestamp: string;
  title?: string;
  level?: 'low' | 'moderate' | 'warning' | 'high_risk' | 'critical';
  description?: string;
  actionableAdvice?: string;
}

export interface CombinedHealthSummary {
  overallStatus: 'normal' | 'attention_required' | 'high_risk' | 'critical';
  riskScore: HealthRiskScore;
  currentVitals: VitalSigns | null;
  trends: VitalTrends | null;
  insights: HealthInsight[];
  predictiveAlerts: PredictiveAlert[];
  reportFindings: string[];
  dataQuality: DataQuality;
  monitoringRecommendation: string;
  lastUpdated: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'report';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  alertId?: string;
}

// ─── Demo ────────────────────────────────────────────────────────────────────

export interface DemoState {
  isEnabled: boolean;
  scenario: DemoScenario;
  stepIndex: number;
  isRunning: boolean;
  speed: 'slow' | 'normal' | 'fast';
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface MonitoringThresholds {
  heartRateMin: number;
  heartRateMax: number;
  spo2Min: number;
  temperatureMin: number;
  temperatureMax: number;
  systolicBpMax: number;
  diastolicBpMax: number;
}

export interface AppSettings {
  thresholds: MonitoringThresholds;
  notifications: {
    criticalAlerts: boolean;
    warningAlerts: boolean;
    reportReady: boolean;
    deviceStatus: boolean;
    emailAlerts: boolean;
  };
  demo: {
    enabled: boolean;
    scenario: DemoScenario;
    speed: 'slow' | 'normal' | 'fast';
    autoProgress: boolean;
  };
  display: {
    showRiskExplanation: boolean;
    chartWindowMinutes: number;
    language: 'en';
  };
}
