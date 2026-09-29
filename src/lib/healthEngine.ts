import type {
  VitalSigns,
  SensorReading,
  TrendAnalysis,
  VitalTrends,
  HealthRiskScore,
  PredictiveAlert,
  HealthInsight,
  AlertSeverity,
  TrendDirection,
  MonitoringThresholds,
} from '../types';

// ─── Default Thresholds ───────────────────────────────────────────────────────

export const DEFAULT_THRESHOLDS: MonitoringThresholds = {
  heartRateMin: 50,
  heartRateMax: 100,
  spo2Min: 94,
  temperatureMin: 36.0,
  temperatureMax: 37.8,
  systolicBpMax: 140,
  diastolicBpMax: 90,
};

// ─── Trend Calculation ────────────────────────────────────────────────────────

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

function classifyTrend(slope: number, threshold = 0.15): TrendDirection {
  if (Math.abs(slope) < threshold) return 'stable';
  return slope > 0 ? 'rising' : 'falling';
}

export function analyzeTrend(
  values: number[],
  unit: string,
  parameterName: string
): TrendAnalysis {
  const validValues = values.filter((v) => v !== null && !isNaN(v));
  if (validValues.length < 3) {
    return {
      direction: 'insufficient_data',
      slope: 0,
      rateOfChange: 0,
      recentAverage: validValues.length > 0 ? validValues[validValues.length - 1] : null,
      readingCount: validValues.length,
      durationMinutes: 0,
      description: 'Insufficient data to identify a reliable trend.',
    };
  }

  const recent = validValues.slice(-20);
  const slope = linearSlope(recent);
  const direction = classifyTrend(slope, parameterName === 'temperature' ? 0.02 : 0.15);
  const rateOfChange = Math.abs(slope);
  const recentAverage = recent.reduce((a, b) => a + b, 0) / recent.length;
  const durationMinutes = recent.length * 2; // approximate: reading every 2 mins

  let description = '';
  if (direction === 'stable') {
    description = `${parameterName} has remained relatively stable across recent readings.`;
  } else if (direction === 'rising') {
    description = `${parameterName} has shown a sustained upward trend across recent readings.`;
  } else if (direction === 'falling') {
    description = `${parameterName} has shown a decreasing trend across recent readings.`;
  }

  return {
    direction,
    slope,
    rateOfChange,
    recentAverage,
    readingCount: recent.length,
    durationMinutes,
    description,
  };
}

export function extractTrends(readings: SensorReading[]): VitalTrends {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const heartRates = sorted.map((r) => r.heartRate).filter((v): v is number => v !== null);
  const spo2s = sorted.map((r) => r.spo2).filter((v): v is number => v !== null);
  const temps = sorted.map((r) => r.temperature).filter((v): v is number => v !== null);

  return {
    heartRate: analyzeTrend(heartRates, 'BPM', 'Heart rate'),
    spo2: analyzeTrend(spo2s, '%', 'SpO₂'),
    temperature: analyzeTrend(temps, '°C', 'Temperature'),
  };
}

// ─── Risk Score ────────────────────────────────────────────────────────────────

export function calculateRiskScore(
  vitals: VitalSigns,
  trends: VitalTrends | null,
  thresholds: MonitoringThresholds = DEFAULT_THRESHOLDS,
  hasFallEvent = false,
  recentAlertCount = 0
): HealthRiskScore {
  let heartRateScore = 0;
  let spo2Score = 0;
  let temperatureScore = 0;
  const observedFactors: string[] = [];

  // Heart Rate scoring (0–25)
  if (vitals.heartRate !== null) {
    const hr = vitals.heartRate;
    if (hr < thresholds.heartRateMin) {
      const deviation = thresholds.heartRateMin - hr;
      heartRateScore = Math.min(25, deviation * 1.2);
      observedFactors.push(`Heart rate below configured lower range (${hr} BPM)`);
    } else if (hr > thresholds.heartRateMax) {
      const deviation = hr - thresholds.heartRateMax;
      heartRateScore = Math.min(25, deviation * 0.8);
      observedFactors.push(`Heart rate above configured upper range (${hr} BPM)`);
    }
  }

  // SpO₂ scoring (0–25)
  if (vitals.spo2 !== null) {
    const spo2 = vitals.spo2;
    if (spo2 < thresholds.spo2Min) {
      const deviation = thresholds.spo2Min - spo2;
      spo2Score = Math.min(25, deviation * 3.5);
      observedFactors.push(`SpO₂ below configured lower range (${spo2}%)`);
    }
  }

  // Temperature scoring (0–15)
  if (vitals.temperature !== null) {
    const temp = vitals.temperature;
    if (temp < thresholds.temperatureMin) {
      const deviation = thresholds.temperatureMin - temp;
      temperatureScore = Math.min(15, deviation * 6);
      observedFactors.push(`Temperature below configured lower range (${temp}°C)`);
    } else if (temp > thresholds.temperatureMax) {
      const deviation = temp - thresholds.temperatureMax;
      temperatureScore = Math.min(15, deviation * 5);
      observedFactors.push(`Temperature above configured upper range (${temp}°C)`);
    }
  }

  // Trend multiplier (1.0–1.5)
  let trendMultiplier = 1.0;
  if (trends) {
    let trendCount = 0;
    if (trends.heartRate.direction === 'rising' && vitals.heartRate !== null && vitals.heartRate > thresholds.heartRateMax - 10) {
      trendMultiplier += 0.15;
      trendCount++;
      if (trends.heartRate.rateOfChange > 0.5) {
        observedFactors.push('Heart rate showing sustained upward trend');
      }
    }
    if (trends.spo2.direction === 'falling' && vitals.spo2 !== null && vitals.spo2 < thresholds.spo2Min + 3) {
      trendMultiplier += 0.2;
      trendCount++;
      observedFactors.push('SpO₂ showing decreasing trend');
    }
    if (trends.temperature.direction === 'rising' && vitals.temperature !== null && vitals.temperature > thresholds.temperatureMax - 0.3) {
      trendMultiplier += 0.1;
      trendCount++;
      observedFactors.push('Temperature showing upward trend');
    }
    if (trendCount > 1) {
      observedFactors.push(`Multiple parameters (${trendCount}) showing concerning trends simultaneously`);
    }
  }

  // Multi-parameter bonus (0–20)
  const abnormalCount = [heartRateScore > 0, spo2Score > 0, temperatureScore > 0].filter(Boolean).length;
  let multiParamBonus = 0;
  if (abnormalCount === 2) multiParamBonus = 10;
  if (abnormalCount === 3) multiParamBonus = 20;
  if (abnormalCount >= 2) {
    observedFactors.push('Multiple monitored parameters showing abnormal values simultaneously');
  }

  // Fall event bonus (0–25)
  let fallBonus = 0;
  if (vitals.motionStatus === 'fall_detected') {
    fallBonus = 25;
    observedFactors.push('Possible fall event detected');
  } else if (vitals.motionStatus === 'inactive') {
    fallBonus = 10;
    observedFactors.push('Prolonged inactivity detected after motion event');
  } else if (hasFallEvent) {
    fallBonus = 15;
    observedFactors.push('Recent fall event recorded');
  }

  // Recent alert bonus (0–10)
  const alertBonus = Math.min(10, recentAlertCount * 2);

  const rawTotal =
    (heartRateScore + spo2Score + temperatureScore) * trendMultiplier +
    multiParamBonus +
    fallBonus +
    alertBonus;

  const total = Math.min(100, Math.round(rawTotal));

  let level: HealthRiskScore['level'];
  let label: string;
  if (total <= 30) {
    level = 'low';
    label = 'Low Risk';
  } else if (total <= 60) {
    level = 'moderate';
    label = 'Moderate Risk';
  } else if (total <= 80) {
    level = 'high';
    label = 'High Risk';
  } else {
    level = 'critical';
    label = 'Critical';
  }

  let explanation = '';
  if (observedFactors.length === 0) {
    explanation = 'All monitored parameters are within configured demonstration ranges.';
  } else if (observedFactors.length === 1) {
    explanation = `Risk indicator observed: ${observedFactors[0].toLowerCase()}.`;
  } else {
    explanation =
      'Risk level increased because multiple monitored parameters are showing abnormal or changing patterns.';
  }

  return {
    total,
    level,
    label,
    components: {
      heartRateScore: Math.round(heartRateScore),
      spo2Score: Math.round(spo2Score),
      temperatureScore: Math.round(temperatureScore),
      trendMultiplier: Math.round(trendMultiplier * 100) / 100,
      multiParamBonus,
      fallBonus,
      alertBonus,
    },
    explanation,
    observedFactors,
  };
}

// ─── Predictive Alerts ────────────────────────────────────────────────────────

export function generatePredictiveAlerts(
  trends: VitalTrends,
  vitals: VitalSigns,
  thresholds: MonitoringThresholds = DEFAULT_THRESHOLDS
): PredictiveAlert[] {
  const alerts: PredictiveAlert[] = [];
  const now = new Date().toISOString();

  // Heart Rate
  if (
    trends.heartRate.direction === 'rising' &&
    trends.heartRate.readingCount >= 5 &&
    vitals.heartRate !== null &&
    vitals.heartRate > thresholds.heartRateMax - 15
  ) {
    const severity: AlertSeverity =
      vitals.heartRate > thresholds.heartRateMax ? 'high_risk' : 'warning';
    alerts.push({
      id: `pred-hr-${Date.now()}`,
      parameter: 'Heart Rate',
      trend: trends.heartRate,
      severity,
      title: 'Sustained Heart Rate Increase Detected',
      description: `Heart rate has increased consistently across the last ${trends.heartRate.readingCount} readings, with a current value of ${vitals.heartRate} BPM. The upward trend has continued without stabilisation.`,
      recommendation:
        'Continued monitoring is recommended. If the trend persists or the patient reports discomfort, caregiver attention may be appropriate.',
      riskScore: Math.min(80, 30 + trends.heartRate.rateOfChange * 20),
      createdAt: now,
      isActive: true,
    });
  }

  // SpO₂
  if (
    trends.spo2.direction === 'falling' &&
    trends.spo2.readingCount >= 4 &&
    vitals.spo2 !== null &&
    vitals.spo2 < thresholds.spo2Min + 4
  ) {
    const severity: AlertSeverity =
      vitals.spo2 < thresholds.spo2Min ? 'high_risk' : 'warning';
    alerts.push({
      id: `pred-spo2-${Date.now()}`,
      parameter: 'SpO₂',
      trend: trends.spo2,
      severity,
      title: 'SpO₂ Showing Decreasing Trend',
      description: `SpO₂ has shown a decreasing trend across recent readings, with a current value of ${vitals.spo2}%. The pattern has persisted across ${trends.spo2.readingCount} consecutive readings.`,
      recommendation:
        'Monitoring is recommended. If SpO₂ continues to decrease or the patient experiences breathing difficulty, professional medical review is advised.',
      riskScore: Math.min(85, 40 + (100 - (vitals.spo2 ?? 95)) * 5),
      createdAt: now,
      isActive: true,
    });
  }

  // Temperature
  if (
    trends.temperature.direction === 'rising' &&
    trends.temperature.readingCount >= 5 &&
    vitals.temperature !== null &&
    vitals.temperature > thresholds.temperatureMax - 0.5
  ) {
    alerts.push({
      id: `pred-temp-${Date.now()}`,
      parameter: 'Temperature',
      trend: trends.temperature,
      severity: vitals.temperature > thresholds.temperatureMax ? 'high_risk' : 'warning',
      title: 'Body Temperature Increasing Trend Observed',
      description: `Body temperature has shown an increasing trend across recent readings, reaching ${vitals.temperature}°C. The upward pattern has been observed across ${trends.temperature.readingCount} readings.`,
      recommendation:
        'Continued monitoring is recommended. If temperature continues to rise significantly, caregiver attention and professional review may be appropriate.',
      riskScore: Math.min(70, 25 + (vitals.temperature - thresholds.temperatureMax) * 15),
      createdAt: now,
      isActive: true,
    });
  }

  return alerts;
}

// ─── Health Insights ──────────────────────────────────────────────────────────

export function generateHealthInsights(
  vitals: VitalSigns,
  trends: VitalTrends,
  readings: SensorReading[],
  thresholds: MonitoringThresholds = DEFAULT_THRESHOLDS
): HealthInsight[] {
  const insights: HealthInsight[] = [];
  const now = new Date().toISOString();

  if (vitals.heartRate !== null) {
    const hr = vitals.heartRate;
    if (hr > thresholds.heartRateMax) {
      insights.push({
        id: `ins-hr-high-${Date.now()}`,
        category: 'sensor',
        parameter: 'Heart Rate',
        observation: `Heart rate is currently ${hr} BPM, which is above the configured upper demonstration range of ${thresholds.heartRateMax} BPM.`,
        confidence: 'high',
        timestamp: now,
      });
    } else if (hr < thresholds.heartRateMin) {
      insights.push({
        id: `ins-hr-low-${Date.now()}`,
        category: 'sensor',
        parameter: 'Heart Rate',
        observation: `Heart rate is currently ${hr} BPM, which is below the configured lower demonstration range of ${thresholds.heartRateMin} BPM.`,
        confidence: 'high',
        timestamp: now,
      });
    }
    if (trends.heartRate.direction !== 'insufficient_data') {
      insights.push({
        id: `ins-hr-trend-${Date.now()}`,
        category: 'trend',
        parameter: 'Heart Rate',
        observation: trends.heartRate.description,
        confidence: readings.length >= 10 ? 'high' : 'moderate',
        timestamp: now,
      });
    }
  }

  if (vitals.spo2 !== null) {
    const spo2 = vitals.spo2;
    if (spo2 < thresholds.spo2Min) {
      insights.push({
        id: `ins-spo2-${Date.now()}`,
        category: 'sensor',
        parameter: 'SpO₂',
        observation: `SpO₂ is currently ${spo2}%, which is below the configured lower demonstration range of ${thresholds.spo2Min}%.`,
        confidence: 'high',
        timestamp: now,
      });
    }
    if (trends.spo2.direction === 'falling' && trends.spo2.readingCount >= 3) {
      insights.push({
        id: `ins-spo2-trend-${Date.now()}`,
        category: 'trend',
        parameter: 'SpO₂',
        observation: trends.spo2.description,
        confidence: 'moderate',
        timestamp: now,
      });
    }
  }

  if (vitals.temperature !== null) {
    const temp = vitals.temperature;
    if (temp > thresholds.temperatureMax) {
      insights.push({
        id: `ins-temp-${Date.now()}`,
        category: 'sensor',
        parameter: 'Temperature',
        observation: `Body temperature is ${temp}°C, which is above the configured upper demonstration range of ${thresholds.temperatureMax}°C.`,
        confidence: 'high',
        timestamp: now,
      });
    }
    if (trends.temperature.direction !== 'insufficient_data' && trends.temperature.direction !== 'stable') {
      insights.push({
        id: `ins-temp-trend-${Date.now()}`,
        category: 'trend',
        parameter: 'Temperature',
        observation: trends.temperature.description,
        confidence: 'moderate',
        timestamp: now,
      });
    }
  }

  if (vitals.motionStatus === 'fall_detected') {
    insights.push({
      id: `ins-fall-${Date.now()}`,
      category: 'sensor',
      parameter: 'Motion',
      observation: 'Abnormal motion pattern detected. Possible fall event. Vital signs and subsequent movement are being monitored.',
      confidence: 'moderate',
      timestamp: now,
    });
  }

  const abnormalCount = [
    vitals.heartRate !== null && (vitals.heartRate > thresholds.heartRateMax || vitals.heartRate < thresholds.heartRateMin),
    vitals.spo2 !== null && vitals.spo2 < thresholds.spo2Min,
    vitals.temperature !== null && (vitals.temperature > thresholds.temperatureMax || vitals.temperature < thresholds.temperatureMin),
  ].filter(Boolean).length;

  if (abnormalCount >= 2) {
    insights.push({
      id: `ins-multi-${Date.now()}`,
      category: 'combined',
      parameter: 'Multiple Parameters',
      observation: `${abnormalCount} monitored parameters are currently showing values outside their configured demonstration ranges. This combination of observations may warrant closer attention.`,
      confidence: 'high',
      timestamp: now,
    });
  }

  if (readings.length < 5) {
    insights.push({
      id: `ins-data-${Date.now()}`,
      category: 'sensor',
      parameter: 'Data Availability',
      observation: 'Historical data is currently insufficient for a reliable trend analysis. More readings are needed.',
      confidence: 'insufficient',
      timestamp: now,
    });
  }

  return insights;
}

// ─── Status Classification ────────────────────────────────────────────────────

export function classifyOverallStatus(riskScore: number): {
  status: 'normal' | 'attention_required' | 'high_risk' | 'critical';
  label: string;
  color: string;
} {
  if (riskScore <= 30) return { status: 'normal', label: 'Normal', color: 'green' };
  if (riskScore <= 60) return { status: 'attention_required', label: 'Attention Required', color: 'amber' };
  if (riskScore <= 80) return { status: 'high_risk', label: 'High Risk', color: 'orange' };
  return { status: 'critical', label: 'Critical', color: 'red' };
}

export function getVitalStatus(
  parameter: 'heartRate' | 'spo2' | 'temperature',
  value: number | null,
  thresholds: MonitoringThresholds = DEFAULT_THRESHOLDS
): { status: 'normal' | 'warning' | 'high_risk' | 'critical'; label: string } {
  if (value === null) return { status: 'normal', label: 'No Data' };

  switch (parameter) {
    case 'heartRate': {
      if (value >= thresholds.heartRateMin && value <= thresholds.heartRateMax)
        return { status: 'normal', label: 'Normal' };
      const dev = Math.max(
        thresholds.heartRateMin - value,
        value - thresholds.heartRateMax,
        0
      );
      if (dev < 10) return { status: 'warning', label: 'Elevated' };
      if (dev < 20) return { status: 'high_risk', label: 'Abnormal' };
      return { status: 'critical', label: 'Critical' };
    }
    case 'spo2': {
      if (value >= thresholds.spo2Min) return { status: 'normal', label: 'Normal' };
      const dev = thresholds.spo2Min - value;
      if (dev < 2) return { status: 'warning', label: 'Low' };
      if (dev < 5) return { status: 'high_risk', label: 'Abnormal' };
      return { status: 'critical', label: 'Critical' };
    }
    case 'temperature': {
      if (value >= thresholds.temperatureMin && value <= thresholds.temperatureMax)
        return { status: 'normal', label: 'Normal' };
      const dev = Math.max(
        thresholds.temperatureMin - value,
        value - thresholds.temperatureMax,
        0
      );
      if (dev < 0.5) return { status: 'warning', label: 'Elevated' };
      if (dev < 1.0) return { status: 'high_risk', label: 'Abnormal' };
      return { status: 'critical', label: 'Critical' };
    }
  }
}
