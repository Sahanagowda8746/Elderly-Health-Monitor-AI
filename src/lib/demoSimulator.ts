import type { SensorReading, VitalSigns, DemoScenario, MotionStatus } from '../types';

// ─── Scenario Definitions ─────────────────────────────────────────────────────

interface ScenarioStep {
  heartRate: number;
  spo2: number;
  temperature: number;
  motionStatus: MotionStatus;
  note?: string;
}

const SCENARIOS: Record<DemoScenario, ScenarioStep[]> = {
  normal: [
    { heartRate: 72, spo2: 98, temperature: 36.6, motionStatus: 'normal' },
    { heartRate: 74, spo2: 98, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 73, spo2: 97, temperature: 36.6, motionStatus: 'normal' },
    { heartRate: 75, spo2: 98, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 74, spo2: 98, temperature: 36.6, motionStatus: 'normal' },
    { heartRate: 76, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 73, spo2: 98, temperature: 36.6, motionStatus: 'normal' },
    { heartRate: 75, spo2: 98, temperature: 36.7, motionStatus: 'normal' },
  ],

  increasing_heart_rate: [
    { heartRate: 72, spo2: 98, temperature: 36.6, motionStatus: 'normal' },
    { heartRate: 76, spo2: 98, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 81, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 87, spo2: 97, temperature: 36.8, motionStatus: 'normal' },
    { heartRate: 93, spo2: 96, temperature: 36.8, motionStatus: 'normal' },
    { heartRate: 99, spo2: 96, temperature: 36.9, motionStatus: 'normal' },
    { heartRate: 104, spo2: 95, temperature: 36.9, motionStatus: 'normal' },
    { heartRate: 108, spo2: 95, temperature: 37.0, motionStatus: 'normal' },
  ],

  decreasing_spo2: [
    { heartRate: 78, spo2: 98, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 79, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 80, spo2: 96, temperature: 36.8, motionStatus: 'normal' },
    { heartRate: 82, spo2: 95, temperature: 36.8, motionStatus: 'normal' },
    { heartRate: 83, spo2: 94, temperature: 36.9, motionStatus: 'normal' },
    { heartRate: 85, spo2: 93, temperature: 36.9, motionStatus: 'normal' },
    { heartRate: 87, spo2: 92, temperature: 37.0, motionStatus: 'normal' },
    { heartRate: 89, spo2: 91, temperature: 37.1, motionStatus: 'normal' },
  ],

  increasing_temperature: [
    { heartRate: 76, spo2: 97, temperature: 36.8, motionStatus: 'normal' },
    { heartRate: 78, spo2: 97, temperature: 37.1, motionStatus: 'normal' },
    { heartRate: 80, spo2: 97, temperature: 37.4, motionStatus: 'normal' },
    { heartRate: 82, spo2: 96, temperature: 37.7, motionStatus: 'normal' },
    { heartRate: 85, spo2: 96, temperature: 37.9, motionStatus: 'normal' },
    { heartRate: 88, spo2: 95, temperature: 38.1, motionStatus: 'normal' },
    { heartRate: 90, spo2: 95, temperature: 38.3, motionStatus: 'normal' },
    { heartRate: 92, spo2: 94, temperature: 38.5, motionStatus: 'normal' },
  ],

  combined_risk: [
    { heartRate: 74, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 79, spo2: 96, temperature: 37.0, motionStatus: 'normal' },
    { heartRate: 85, spo2: 95, temperature: 37.3, motionStatus: 'normal' },
    { heartRate: 91, spo2: 94, temperature: 37.6, motionStatus: 'normal' },
    { heartRate: 97, spo2: 93, temperature: 37.9, motionStatus: 'elevated' },
    { heartRate: 103, spo2: 92, temperature: 38.2, motionStatus: 'elevated' },
    { heartRate: 109, spo2: 91, temperature: 38.5, motionStatus: 'elevated' },
    { heartRate: 114, spo2: 90, temperature: 38.7, motionStatus: 'elevated' },
  ],

  fall_emergency: [
    { heartRate: 74, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 76, spo2: 97, temperature: 36.7, motionStatus: 'normal' },
    { heartRate: 110, spo2: 95, temperature: 36.8, motionStatus: 'fall_detected', note: 'Possible fall detected' },
    { heartRate: 115, spo2: 94, temperature: 36.9, motionStatus: 'inactive', note: 'Post-fall inactivity' },
    { heartRate: 118, spo2: 93, temperature: 37.0, motionStatus: 'inactive' },
    { heartRate: 112, spo2: 92, temperature: 37.1, motionStatus: 'inactive' },
    { heartRate: 105, spo2: 91, temperature: 37.2, motionStatus: 'inactive' },
    { heartRate: 98, spo2: 91, temperature: 37.2, motionStatus: 'inactive' },
  ],
};

const SCENARIO_LABELS: Record<DemoScenario, string> = {
  normal: 'Normal — Stable Readings',
  increasing_heart_rate: 'Increasing Heart Rate',
  decreasing_spo2: 'Decreasing SpO₂',
  increasing_temperature: 'Increasing Temperature',
  combined_risk: 'Combined Risk (Multiple Parameters)',
  fall_emergency: 'Possible Fall / Emergency',
};

const SCENARIO_DESCRIPTIONS: Record<DemoScenario, string> = {
  normal: 'All vital signs remain within normal demonstration ranges.',
  increasing_heart_rate: 'Heart rate gradually increases from 72 BPM to 108 BPM across readings.',
  decreasing_spo2: 'SpO₂ gradually decreases from 98% to 91% while heart rate slightly increases.',
  increasing_temperature: 'Body temperature increases from 36.8°C to 38.5°C while other parameters change.',
  combined_risk: 'Multiple parameters deteriorate simultaneously — heart rate rises, SpO₂ falls, temperature increases.',
  fall_emergency: 'A possible fall event is detected, followed by inactivity and vital sign changes triggering emergency workflow.',
};

// ─── Simulator ────────────────────────────────────────────────────────────────

export class DemoSimulator {
  private scenario: DemoScenario = 'normal';
  private stepIndex = 0;
  private readings: SensorReading[] = [];
  private userId: string;
  private deviceId: string;

  constructor(userId: string, deviceId = 'DEMO-001') {
    this.userId = userId;
    this.deviceId = deviceId;
  }

  setScenario(scenario: DemoScenario): void {
    this.scenario = scenario;
    this.stepIndex = 0;
    this.readings = [];
  }

  getCurrentScenario(): DemoScenario {
    return this.scenario;
  }

  getStepInfo(): { current: number; total: number; label: string; description: string } {
    const steps = SCENARIOS[this.scenario];
    return {
      current: this.stepIndex,
      total: steps.length,
      label: SCENARIO_LABELS[this.scenario],
      description: SCENARIO_DESCRIPTIONS[this.scenario],
    };
  }

  nextReading(): SensorReading {
    const steps = SCENARIOS[this.scenario];
    const step = steps[this.stepIndex % steps.length];

    // Add slight natural variation
    const jitter = (base: number, variance: number) =>
      Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10;

    const reading: SensorReading = {
      id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      deviceId: this.deviceId,
      timestamp: new Date().toISOString(),
      heartRate: Math.round(jitter(step.heartRate, 2)),
      spo2: Math.min(100, Math.max(85, Math.round(jitter(step.spo2, 0.5)))),
      temperature: Math.min(40, Math.max(35, jitter(step.temperature, 0.1))),
      systolicBp: null,
      diastolicBp: null,
      motionStatus: step.motionStatus,
      latitude: 12.9716,
      longitude: 77.5946,
      source: 'demo',
    };

    this.readings.push(reading);
    this.stepIndex = (this.stepIndex + 1) % steps.length;

    return reading;
  }

  getReadings(): SensorReading[] {
    return [...this.readings];
  }

  reset(): void {
    this.stepIndex = 0;
    this.readings = [];
  }

  static getScenarioList(): Array<{ value: DemoScenario; label: string; description: string }> {
    return (Object.keys(SCENARIOS) as DemoScenario[]).map((key) => ({
      value: key,
      label: SCENARIO_LABELS[key],
      description: SCENARIO_DESCRIPTIONS[key],
    }));
  }
}

// ─── Demo GPS Location ────────────────────────────────────────────────────────

export const DEMO_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
  address: 'Bangalore, Karnataka, India (Demo Location)',
  accuracy: 'High (GPS)',
};

// ─── Demo Report Data ─────────────────────────────────────────────────────────

export const DEMO_REPORT_PARAMETERS = [
  { parameterName: 'Hemoglobin', value: '12.1', unit: 'g/dL', referenceRange: '12.0–16.0', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'RBC Count', value: '4.2', unit: 'million/µL', referenceRange: '3.8–5.1', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'WBC Count', value: '9.8', unit: 'thousand/µL', referenceRange: '4.0–11.0', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'Platelet Count', value: '185', unit: 'thousand/µL', referenceRange: '150–400', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'Fasting Glucose', value: '118', unit: 'mg/dL', referenceRange: '70–100', status: 'abnormal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'HbA1c', value: '6.2', unit: '%', referenceRange: '< 5.7', status: 'abnormal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'Total Cholesterol', value: '198', unit: 'mg/dL', referenceRange: '< 200', status: 'borderline' as const, extractionConfidence: 'moderate' as const },
  { parameterName: 'Triglycerides', value: '165', unit: 'mg/dL', referenceRange: '< 150', status: 'abnormal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'HDL Cholesterol', value: '48', unit: 'mg/dL', referenceRange: '> 60', status: 'borderline' as const, extractionConfidence: 'moderate' as const },
  { parameterName: 'LDL Cholesterol', value: '117', unit: 'mg/dL', referenceRange: '< 100', status: 'abnormal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'Creatinine', value: '1.1', unit: 'mg/dL', referenceRange: '0.6–1.2', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'Urea', value: '28', unit: 'mg/dL', referenceRange: '10–50', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'TSH', value: '3.8', unit: 'mIU/L', referenceRange: '0.4–4.0', status: 'normal' as const, extractionConfidence: 'moderate' as const },
  { parameterName: 'ALT (SGPT)', value: '32', unit: 'U/L', referenceRange: '7–40', status: 'normal' as const, extractionConfidence: 'high' as const },
  { parameterName: 'AST (SGOT)', value: '28', unit: 'U/L', referenceRange: '10–40', status: 'normal' as const, extractionConfidence: 'high' as const },
];

export const DEMO_PREVIOUS_REPORT_PARAMETERS = [
  { parameterName: 'Hemoglobin', value: '11.4', unit: 'g/dL' },
  { parameterName: 'Fasting Glucose', value: '105', unit: 'mg/dL' },
  { parameterName: 'HbA1c', value: '5.9', unit: '%' },
  { parameterName: 'Total Cholesterol', value: '188', unit: 'mg/dL' },
  { parameterName: 'Triglycerides', value: '148', unit: 'mg/dL' },
  { parameterName: 'LDL Cholesterol', value: '108', unit: 'mg/dL' },
  { parameterName: 'Creatinine', value: '0.9', unit: 'mg/dL' },
];
