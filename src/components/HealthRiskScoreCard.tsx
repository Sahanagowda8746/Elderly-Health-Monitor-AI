import React from 'react';
import type { HealthRiskScore } from '../types';

interface Props {
  score: HealthRiskScore;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  low:      { color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  label: 'Low Risk' },
  moderate: { color: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  label: 'Moderate Risk' },
  high:     { color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700', label: 'High Risk' },
  critical: { color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    label: 'Critical' },
};

export function HealthRiskScoreCard({ score, compact = false }: Props) {
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
          <p className={`text-sm font-bold ${config.text}`}>{config.label}</p>
          <p className="text-xs text-slate-500">{score.total} / 100</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-5 border ${config.border} ${config.bg}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Health Risk Score</h3>
          <p className="text-xs text-slate-400 mt-0.5">Based on current readings and trends</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.border} ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-6">
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
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700 mb-2">{score.explanation}</p>
          {score.observedFactors.length > 0 && (
            <ul className="space-y-1">
              {score.observedFactors.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Score bars */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Heart Rate', val: score.components.heartRateScore, max: 25 },
              { label: 'SpO₂', val: score.components.spo2Score, max: 25 },
              { label: 'Temperature', val: score.components.temperatureScore, max: 15 },
            ].map(({ label, val, max }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-400 mb-1">{label}</p>
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

      <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-current/10">
        Risk indicators are based on configured demonstration thresholds and observed trends. This is not a clinical assessment.
      </p>
    </div>
  );
}
