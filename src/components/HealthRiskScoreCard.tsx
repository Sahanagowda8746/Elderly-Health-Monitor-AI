import React from 'react';
import type { HealthRiskScore } from '../types';
import type { MLPrediction } from '../lib/mlInference';
import { Cpu, ShieldAlert, Sparkles, Activity, CheckCircle2 } from 'lucide-react';

interface Props {
  score: HealthRiskScore;
  mlPrediction?: MLPrediction | null;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  low:      { color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  badge: 'bg-green-100 text-green-800 border-green-300', label: 'Low Risk' },
  moderate: { color: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Moderate Risk' },
  high:     { color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800 border-orange-300', label: 'High Risk' },
  critical: { color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-800 border-red-300', label: 'Critical' },
};

const ML_CLASS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export function HealthRiskScoreCard({ score, mlPrediction, compact = false }: Props) {
  const config = LEVEL_CONFIG[score.level];
  const circumference = 2 * Math.PI * 40;
  const dashoffset = circumference * (1 - score.total / 100);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${config.border} ${config.bg}`}>
        <div className="relative w-10 h-10">
          <svg viewBox="0 0 100 100" className="w-10 h-10 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={config.color}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: config.color }}>
            {score.total}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-bold ${config.text}`}>{config.label}</p>
            {mlPrediction && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                ML: {mlPrediction.riskLevel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{score.total} / 100</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-5 border ${config.border} ${config.bg} space-y-4`}>
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Health Risk Score</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
              Real-time Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Based on continuous telemetry readings & clinical thresholds</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {/* Main Gauge + Breakdown */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="9" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={config.color}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: config.color }}>{score.total}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full">
          <p className="text-sm font-medium text-slate-700 mb-2">{score.explanation}</p>
          {score.observedFactors.length > 0 && (
            <ul className="space-y-1 mb-3">
              {score.observedFactors.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Score bars */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Heart Rate', val: score.components.heartRateScore, max: 25 },
              { label: 'SpO₂', val: score.components.spo2Score, max: 25 },
              { label: 'Temperature', val: score.components.temperatureScore, max: 15 },
            ].map(({ label, val, max }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(val / max) * 100}%`,
                      background: val > max * 0.6 ? config.color : '#94a3b8',
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{val}/{max}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ML Random Forest Classification Section ── */}
      {mlPrediction ? (
        <div className="bg-white/90 border border-indigo-100 rounded-xl p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Cpu size={14} />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Random Forest ML Risk Classification
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v{mlPrediction.modelVersion}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                ML_CLASS_COLORS[mlPrediction.riskLevel]?.bg || 'bg-slate-100'
              } ${
                ML_CLASS_COLORS[mlPrediction.riskLevel]?.text || 'text-slate-800'
              } ${
                ML_CLASS_COLORS[mlPrediction.riskLevel]?.border || 'border-slate-200'
              }`}>
                Predicted: {mlPrediction.riskLevel}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {(mlPrediction.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1">
            {mlPrediction.factors && mlPrediction.factors.length > 0 && (
              <p className="flex items-start gap-1">
                <span className="font-semibold text-slate-700">Model Factors:</span>
                <span>{mlPrediction.factors.slice(0, 2).join(' • ')}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500">
              <Sparkles size={11} className="text-amber-500" />
              Trained on 600 synthetic elderly health records
            </span>
            <span className="italic">Educational Assistive AI</span>
          </div>
        </div>
      ) : (
        <div className="bg-white/60 border border-slate-200 rounded-xl p-2.5 text-center text-xs text-slate-500">
          <span className="text-[11px]">ML classification standby: awaiting live continuous vital stream.</span>
        </div>
      )}

      {/* Non-clinical Disclaimer Footer */}
      <p className="text-[11px] text-slate-400 pt-2 border-t border-current/10 leading-relaxed">
        <strong>Educational Notice:</strong> Risk scores and ML predictions are assistive approximations based on demonstration thresholds and synthetic model training. They do not constitute a clinical medical diagnosis or a guarantee of health outcomes.
      </p>
    </div>
  );
}
