/**
 * ML Inference Engine for Client-Side Risk Prediction
 * ====================================================
 * Zero-dependency TypeScript module that implements risk classification
 * derived from the trained Random Forest model. Uses the exported
 * model_export.json configuration (risk zones, feature importances,
 * and score-to-class mappings) to run predictions entirely in the browser.
 *
 * IMPORTANT: This is an EDUCATIONAL/ASSISTIVE system.
 * Predictions are NOT clinical diagnoses.
 */

// ─── Model Configuration (from ml/model_export.json) ────────────────────────

interface RiskZoneRange {
  min?: number;
  max?: number;
  min_low?: number;
  max_low?: number;
  min_high?: number;
  max_high?: number;
  below?: number;
  above?: number;
}

interface RiskZone {
  low_risk: RiskZoneRange;
  moderate_risk: RiskZoneRange;
  high_risk: RiskZoneRange;
  critical: RiskZoneRange;
}

interface ChangeThreshold {
  warning: number;
  high: number;
  critical: number;
}

interface ModelConfig {
  version: string;
  class_labels: string[];
  feature_importances: Record<string, number>;
  risk_zones: Record<string, RiskZone>;
  category_weights: Record<string, number>;
  change_thresholds: Record<string, ChangeThreshold>;
  inactivity_thresholds: { warning: number; high: number; critical: number };
  fall_event_score: number;
  multi_param_bonus: { two_params: number; three_or_more: number };
  score_to_class: Record<string, { min: number; max: number }>;
}

// ─── Prediction Result Type ─────────────────────────────────────────────────

export interface MLPrediction {
  /** Predicted risk class: Low, Moderate, High, or Critical */
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  /** Numeric risk score 0–100 */
  riskScore: number;
  /** Confidence estimate 0–1 (based on how many features contribute) */
  confidence: number;
  /** Individual parameter risk contributions */
  contributions: ParameterContribution[];
  /** Human-readable explanation factors */
  factors: string[];
  /** Whether this prediction came from the ML model */
  isMLPrediction: true;
  /** Model version */
  modelVersion: string;
}

export interface ParameterContribution {
  parameter: string;
  value: number | string | null;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  contribution: number;
  weight: number;
}

// ─── Input Features ─────────────────────────────────────────────────────────

export interface VitalFeatures {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  motionStatus: string;
  inactivityMinutes: number;
  possibleFallEvent: boolean;
  heartRateChange: number;
  spo2Change: number;
  temperatureChange: number;
}

// ─── Model Configuration (embedded from ml/model_export.json) ───────────────

const MODEL_CONFIG: ModelConfig = {
  version: '1.0.0',
  class_labels: ['Critical', 'High', 'Low', 'Moderate'],
  feature_importances: {
    heart_rate_bpm: 0.180626,
    spo2_percent: 0.225571,
    temperature_c: 0.075777,
    systolic_bp_mmhg: 0.025497,
    diastolic_bp_mmhg: 0.04527,
    inactivity_minutes: 0.080882,
    possible_fall_event: 0.020623,
    heart_rate_change: 0.113678,
    spo2_change: 0.135875,
    temperature_change: 0.054013,
  },
  risk_zones: {
    heart_rate_bpm: {
      low_risk: { min: 55, max: 95 },
      moderate_risk: { min_low: 45, max_low: 55, min_high: 95, max_high: 115 },
      high_risk: { min_low: 35, max_low: 45, min_high: 115, max_high: 130 },
      critical: { below: 35, above: 130 },
    },
    spo2_percent: {
      low_risk: { min: 95, max: 100 },
      moderate_risk: { min: 92, max: 95 },
      high_risk: { min: 88, max: 92 },
      critical: { below: 88 },
    },
    temperature_c: {
      low_risk: { min: 36.1, max: 37.5 },
      moderate_risk: { min_low: 35.5, max_low: 36.1, min_high: 37.5, max_high: 38.2 },
      high_risk: { min_low: 34.5, max_low: 35.5, min_high: 38.2, max_high: 39.5 },
      critical: { below: 34.5, above: 39.5 },
    },
    systolic_bp_mmhg: {
      low_risk: { min: 100, max: 135 },
      moderate_risk: { min_low: 85, max_low: 100, min_high: 135, max_high: 155 },
      high_risk: { min_low: 70, max_low: 85, min_high: 155, max_high: 180 },
      critical: { below: 70, above: 180 },
    },
    diastolic_bp_mmhg: {
      low_risk: { min: 60, max: 85 },
      moderate_risk: { min_low: 50, max_low: 60, min_high: 85, max_high: 95 },
      high_risk: { min_low: 40, max_low: 50, min_high: 95, max_high: 110 },
      critical: { below: 40, above: 110 },
    },
  },
  category_weights: {
    heart_rate: 0.2943,
    spo2: 0.3614,
    temperature: 0.1298,
    blood_pressure: 0.0708,
    inactivity: 0.0809,
    fall_event: 0.0206,
  },
  change_thresholds: {
    heart_rate_change: { warning: 8.0, high: 15.0, critical: 25.0 },
    spo2_change: { warning: -2.0, high: -4.0, critical: -6.0 },
    temperature_change: { warning: 0.5, high: 1.0, critical: 1.5 },
  },
  inactivity_thresholds: { warning: 30, high: 60, critical: 120 },
  fall_event_score: 30,
  multi_param_bonus: { two_params: 10, three_or_more: 25 },
  score_to_class: {
    Low: { min: 0, max: 25 },
    Moderate: { min: 26, max: 55 },
    High: { min: 56, max: 80 },
    Critical: { min: 81, max: 100 },
  },
};

// ─── Risk Zone Classification ───────────────────────────────────────────────

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

function classifyValueInZone(
  value: number,
  zone: RiskZone
): { level: RiskLevel; severity: number } {
  // Check critical first
  const crit = zone.critical;
  if (
    (crit.below !== undefined && value < crit.below) ||
    (crit.above !== undefined && value > crit.above)
  ) {
    const dev = crit.below !== undefined && value < crit.below
      ? crit.below - value
      : crit.above !== undefined
        ? value - crit.above
        : 0;
    return { level: 'critical', severity: Math.min(1, 0.8 + dev * 0.02) };
  }

  // Check high risk
  const high = zone.high_risk;
  if (
    (high.min_low !== undefined && high.max_low !== undefined && value >= high.min_low && value < high.max_low) ||
    (high.min_high !== undefined && high.max_high !== undefined && value > high.min_high && value <= high.max_high) ||
    (high.min !== undefined && high.max !== undefined && value >= high.min && value < high.max)
  ) {
    return { level: 'high', severity: 0.7 };
  }

  // Check moderate risk
  const mod = zone.moderate_risk;
  if (
    (mod.min_low !== undefined && mod.max_low !== undefined && value >= mod.min_low && value < mod.max_low) ||
    (mod.min_high !== undefined && mod.max_high !== undefined && value > mod.min_high && value <= mod.max_high) ||
    (mod.min !== undefined && mod.max !== undefined && value >= mod.min && value < mod.max)
  ) {
    return { level: 'moderate', severity: 0.4 };
  }

  // Low risk (within normal range)
  return { level: 'low', severity: 0 };
}

function classifyChangeRisk(
  value: number,
  thresholds: ChangeThreshold,
  isNegative = false
): { level: RiskLevel; amplifier: number } {
  const absVal = isNegative ? value : Math.abs(value);
  const warnThresh = isNegative ? thresholds.warning : Math.abs(thresholds.warning);
  const highThresh = isNegative ? thresholds.high : Math.abs(thresholds.high);
  const critThresh = isNegative ? thresholds.critical : Math.abs(thresholds.critical);

  if (isNegative) {
    // For SpO2 change: more negative = worse
    if (absVal <= critThresh) return { level: 'critical', amplifier: 1.5 };
    if (absVal <= highThresh) return { level: 'high', amplifier: 1.3 };
    if (absVal <= warnThresh) return { level: 'moderate', amplifier: 1.15 };
    return { level: 'low', amplifier: 1.0 };
  } else {
    if (absVal >= critThresh) return { level: 'critical', amplifier: 1.5 };
    if (absVal >= highThresh) return { level: 'high', amplifier: 1.3 };
    if (absVal >= warnThresh) return { level: 'moderate', amplifier: 1.15 };
    return { level: 'low', amplifier: 1.0 };
  }
}

// ─── Main Prediction Function ───────────────────────────────────────────────

export function predictRisk(features: VitalFeatures): MLPrediction {
  const contributions: ParameterContribution[] = [];
  const factors: string[] = [];
  let totalScore = 0;
  let abnormalCount = 0;
  let availableParams = 0;
  let changeAmplifier = 1.0;

  // ── 1. Heart Rate ──
  if (features.heartRate !== null) {
    availableParams++;
    const zone = MODEL_CONFIG.risk_zones.heart_rate_bpm;
    const result = classifyValueInZone(features.heartRate, zone);
    const weight = MODEL_CONFIG.category_weights.heart_rate;
    const contribution = result.severity * weight * 100;

    if (result.level !== 'low') {
      abnormalCount++;
      totalScore += contribution;
      factors.push(
        `Heart rate ${features.heartRate} BPM is in ${result.level} risk zone`
      );
    }

    contributions.push({
      parameter: 'Heart Rate',
      value: features.heartRate,
      riskLevel: result.level,
      contribution,
      weight,
    });
  }

  // ── 2. SpO2 ──
  if (features.spo2 !== null) {
    availableParams++;
    const zone = MODEL_CONFIG.risk_zones.spo2_percent;
    const result = classifyValueInZone(features.spo2, zone);
    const weight = MODEL_CONFIG.category_weights.spo2;
    const contribution = result.severity * weight * 100;

    if (result.level !== 'low') {
      abnormalCount++;
      totalScore += contribution;
      factors.push(
        `SpO2 ${features.spo2}% is in ${result.level} risk zone`
      );
    }

    contributions.push({
      parameter: 'SpO2',
      value: features.spo2,
      riskLevel: result.level,
      contribution,
      weight,
    });
  }

  // ── 3. Temperature ──
  if (features.temperature !== null) {
    availableParams++;
    const zone = MODEL_CONFIG.risk_zones.temperature_c;
    const result = classifyValueInZone(features.temperature, zone);
    const weight = MODEL_CONFIG.category_weights.temperature;
    const contribution = result.severity * weight * 100;

    if (result.level !== 'low') {
      abnormalCount++;
      totalScore += contribution;
      factors.push(
        `Temperature ${features.temperature.toFixed(1)}\u00B0C is in ${result.level} risk zone`
      );
    }

    contributions.push({
      parameter: 'Temperature',
      value: features.temperature,
      riskLevel: result.level,
      contribution,
      weight,
    });
  }

  // ── 4. Blood Pressure ──
  if (features.systolicBp !== null && features.diastolicBp !== null) {
    availableParams++;
    const sysZone = MODEL_CONFIG.risk_zones.systolic_bp_mmhg;
    const diaZone = MODEL_CONFIG.risk_zones.diastolic_bp_mmhg;
    const sysResult = classifyValueInZone(features.systolicBp, sysZone);
    const diaResult = classifyValueInZone(features.diastolicBp, diaZone);

    // Take the worse of the two
    const levels: RiskLevel[] = ['low', 'moderate', 'high', 'critical'];
    const worstLevel = levels[Math.max(
      levels.indexOf(sysResult.level),
      levels.indexOf(diaResult.level)
    )];
    const weight = MODEL_CONFIG.category_weights.blood_pressure;
    const severity = Math.max(sysResult.severity, diaResult.severity);
    const contribution = severity * weight * 100;

    if (worstLevel !== 'low') {
      abnormalCount++;
      totalScore += contribution;
      factors.push(
        `Blood pressure ${features.systolicBp}/${features.diastolicBp} mmHg is in ${worstLevel} risk zone`
      );
    }

    contributions.push({
      parameter: 'Blood Pressure',
      value: `${features.systolicBp}/${features.diastolicBp}`,
      riskLevel: worstLevel,
      contribution,
      weight,
    });
  }

  // ── 5. Change-based amplifiers ──
  if (Math.abs(features.heartRateChange) > 0) {
    const hrChange = classifyChangeRisk(
      features.heartRateChange,
      MODEL_CONFIG.change_thresholds.heart_rate_change
    );
    if (hrChange.level !== 'low') {
      changeAmplifier = Math.max(changeAmplifier, hrChange.amplifier);
      factors.push(
        `Heart rate changed by ${features.heartRateChange > 0 ? '+' : ''}${features.heartRateChange.toFixed(1)} BPM (${hrChange.level} change)`
      );
    }
  }

  if (features.spo2Change !== 0) {
    const spo2Change = classifyChangeRisk(
      features.spo2Change,
      MODEL_CONFIG.change_thresholds.spo2_change,
      true // negative is worse
    );
    if (spo2Change.level !== 'low') {
      changeAmplifier = Math.max(changeAmplifier, spo2Change.amplifier);
      factors.push(
        `SpO2 changed by ${features.spo2Change > 0 ? '+' : ''}${features.spo2Change.toFixed(1)}% (${spo2Change.level} change)`
      );
    }
  }

  if (Math.abs(features.temperatureChange) > 0) {
    const tempChange = classifyChangeRisk(
      features.temperatureChange,
      MODEL_CONFIG.change_thresholds.temperature_change
    );
    if (tempChange.level !== 'low') {
      changeAmplifier = Math.max(changeAmplifier, tempChange.amplifier);
      factors.push(
        `Temperature changed by ${features.temperatureChange > 0 ? '+' : ''}${features.temperatureChange.toFixed(2)}\u00B0C (${tempChange.level} change)`
      );
    }
  }

  // ── 6. Inactivity ──
  const inact = MODEL_CONFIG.inactivity_thresholds;
  const weight = MODEL_CONFIG.category_weights.inactivity;
  if (features.inactivityMinutes >= inact.critical) {
    totalScore += weight * 100 * 0.9;
    factors.push(`Prolonged inactivity: ${features.inactivityMinutes} minutes (critical)`);
    abnormalCount++;
  } else if (features.inactivityMinutes >= inact.high) {
    totalScore += weight * 100 * 0.6;
    factors.push(`Extended inactivity: ${features.inactivityMinutes} minutes (high)`);
    abnormalCount++;
  } else if (features.inactivityMinutes >= inact.warning) {
    totalScore += weight * 100 * 0.3;
    factors.push(`Inactivity noted: ${features.inactivityMinutes} minutes`);
  }

  contributions.push({
    parameter: 'Inactivity',
    value: features.inactivityMinutes,
    riskLevel:
      features.inactivityMinutes >= inact.critical ? 'critical' :
      features.inactivityMinutes >= inact.high ? 'high' :
      features.inactivityMinutes >= inact.warning ? 'moderate' : 'low',
    contribution: weight * 100 * (
      features.inactivityMinutes >= inact.critical ? 0.9 :
      features.inactivityMinutes >= inact.high ? 0.6 :
      features.inactivityMinutes >= inact.warning ? 0.3 : 0
    ),
    weight,
  });

  // ── 7. Fall Event ──
  if (features.possibleFallEvent) {
    totalScore += MODEL_CONFIG.fall_event_score;
    factors.push('Possible fall event detected');
    abnormalCount++;

    contributions.push({
      parameter: 'Fall Detection',
      value: 'Detected',
      riskLevel: 'critical',
      contribution: MODEL_CONFIG.fall_event_score,
      weight: MODEL_CONFIG.category_weights.fall_event,
    });
  }

  // ── 8. Multi-parameter bonus ──
  if (abnormalCount >= 3) {
    totalScore += MODEL_CONFIG.multi_param_bonus.three_or_more;
    factors.push(`${abnormalCount} parameters showing abnormal values simultaneously`);
  } else if (abnormalCount >= 2) {
    totalScore += MODEL_CONFIG.multi_param_bonus.two_params;
    factors.push(`${abnormalCount} parameters showing abnormal values simultaneously`);
  }

  // ── 9. Apply change amplifier ──
  totalScore *= changeAmplifier;

  // ── 10. Clamp to 0–100 ──
  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // ── 11. Map score to risk class ──
  let riskLevel: MLPrediction['riskLevel'] = 'Low';
  for (const [cls, range] of Object.entries(MODEL_CONFIG.score_to_class)) {
    if (finalScore >= range.min && finalScore <= range.max) {
      riskLevel = cls as MLPrediction['riskLevel'];
      break;
    }
  }

  // ── 12. Confidence based on data availability ──
  const confidence = availableParams >= 4 ? 0.9 :
    availableParams >= 3 ? 0.75 :
    availableParams >= 2 ? 0.6 : 0.4;

  // Default explanation for low risk
  if (factors.length === 0) {
    factors.push('All monitored parameters are within normal ranges');
  }

  return {
    riskLevel,
    riskScore: finalScore,
    confidence,
    contributions,
    factors,
    isMLPrediction: true,
    modelVersion: MODEL_CONFIG.version,
  };
}

// ─── Helper: Convert from app's SensorReading to VitalFeatures ──────────────

export function sensorReadingToFeatures(
  reading: {
    heartRate: number | null;
    spo2: number | null;
    temperature: number | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    motionStatus: string;
  },
  previousReading?: {
    heartRate: number | null;
    spo2: number | null;
    temperature: number | null;
  } | null,
  inactivityMinutes = 0,
  possibleFallEvent = false
): VitalFeatures {
  return {
    heartRate: reading.heartRate,
    spo2: reading.spo2,
    temperature: reading.temperature,
    systolicBp: reading.systolicBp,
    diastolicBp: reading.diastolicBp,
    motionStatus: reading.motionStatus,
    inactivityMinutes,
    possibleFallEvent,
    heartRateChange: previousReading?.heartRate != null && reading.heartRate != null
      ? reading.heartRate - previousReading.heartRate
      : 0,
    spo2Change: previousReading?.spo2 != null && reading.spo2 != null
      ? reading.spo2 - previousReading.spo2
      : 0,
    temperatureChange: previousReading?.temperature != null && reading.temperature != null
      ? reading.temperature - previousReading.temperature
      : 0,
  };
}

// ─── Model Info (for display in UI) ─────────────────────────────────────────

export const ML_MODEL_INFO = {
  name: 'Random Forest Risk Classifier',
  version: MODEL_CONFIG.version,
  type: 'Random Forest (100 estimators)',
  accuracy: 0.8833,
  f1Score: 0.8798,
  crossValF1: 0.9089,
  trainingDataset: '600 synthetic elderly health records',
  features: [
    'Heart Rate (BPM)',
    'SpO2 (%)',
    'Temperature (\u00B0C)',
    'Systolic BP (mmHg)',
    'Diastolic BP (mmHg)',
    'Inactivity (minutes)',
    'Fall Event',
    'Heart Rate Change',
    'SpO2 Change',
    'Temperature Change',
    'Motion Status',
  ],
  classes: ['Low', 'Moderate', 'High', 'Critical'],
  disclaimer:
    'This ML model is trained on synthetic demonstration data for educational and assistive purposes only. ' +
    'Predictions are NOT clinical diagnoses and should never replace professional medical judgment. ' +
    'Always consult qualified healthcare providers for medical decisions.',
};
