import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, AlertCircle } from 'lucide-react';
import type { TrendDirection } from '../types';
import { getVitalStatus } from '../lib/healthEngine';
import type { MonitoringThresholds } from '../types';
import { format } from 'date-fns';

interface VitalCardProps {
  title: string;
  value: number | null;
  unit: string;
  parameter: 'heartRate' | 'spo2' | 'temperature';
  trend?: TrendDirection;
  lastUpdated?: string;
  thresholds: MonitoringThresholds;
  icon: React.ReactNode;
  unavailableMessage?: string;
}

const STATUS_COLORS = {
  normal:   { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  badge: 'bg-green-100 text-green-700', value: 'text-green-800' },
  warning:  { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700', value: 'text-amber-800' },
  high_risk:{ bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700',value: 'text-orange-800' },
  critical: { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    value: 'text-red-800' },
};

function TrendArrow({ direction }: { direction?: TrendDirection }) {
  if (!direction || direction === 'insufficient_data') return null;
  if (direction === 'rising')  return <TrendingUp  size={14} className="text-orange-500" />;
  if (direction === 'falling') return <TrendingDown size={14} className="text-blue-500" />;
  return <Minus size={14} className="text-slate-400" />;
}

export function VitalCard({
  title, value, unit, parameter, trend,
  lastUpdated, thresholds, icon, unavailableMessage,
}: VitalCardProps) {
  const { status, label } = getVitalStatus(parameter, value, thresholds);
  const colors = STATUS_COLORS[status];

  if (value === null && unavailableMessage) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-700">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <AlertCircle size={16} />
          <p className="text-sm">{unavailableMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 border ${colors.border} ${colors.bg} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${colors.badge} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-700">{title}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {label}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${colors.value}`}>
            {value !== null ? (
              parameter === 'temperature' ? value.toFixed(1) : value
            ) : '—'}
          </span>
          <span className="text-sm text-slate-500 font-medium">{unit}</span>
          <TrendArrow direction={trend} />
        </div>
      </div>

      {lastUpdated && (
        <div className="flex items-center gap-1 mt-2">
          <Clock size={11} className="text-slate-400" />
          <p className="text-xs text-slate-400">
            {format(new Date(lastUpdated), 'HH:mm:ss')}
          </p>
        </div>
      )}
    </div>
  );
}

// Blood Pressure special card (no sensor yet)
interface BpCardProps {
  systolic: number | null;
  diastolic: number | null;
  lastUpdated?: string;
  icon: React.ReactNode;
}

export function BloodPressureCard({ systolic, diastolic, lastUpdated, icon }: BpCardProps) {
  if (systolic === null || diastolic === null) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-700">Blood Pressure</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <AlertCircle size={15} />
          <p className="text-sm">Blood pressure sensor not connected.</p>
        </div>
        <p className="text-xs text-slate-400 mt-1">Available with BP-enabled device module.</p>
      </div>
    );
  }

  const isHigh = systolic > 140 || diastolic > 90;
  const isBorderline = systolic > 130 || diastolic > 85;
  const statusClass = isHigh ? 'border-red-200 bg-red-50' : isBorderline ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50';
  const valueClass = isHigh ? 'text-red-800' : isBorderline ? 'text-amber-800' : 'text-green-800';
  const label = isHigh ? 'Elevated' : isBorderline ? 'Borderline' : 'Normal';
  const badgeClass = isHigh ? 'bg-red-100 text-red-700' : isBorderline ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  return (
    <div className={`card p-4 border ${statusClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${badgeClass} flex items-center justify-center`}>{icon}</div>
          <span className="text-sm font-semibold text-slate-700">Blood Pressure</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold ${valueClass}`}>{systolic}/{diastolic}</span>
        <span className="text-sm text-slate-500 font-medium">mmHg</span>
      </div>
      {lastUpdated && (
        <div className="flex items-center gap-1 mt-2">
          <Clock size={11} className="text-slate-400" />
          <p className="text-xs text-slate-400">{format(new Date(lastUpdated), 'HH:mm:ss')}</p>
        </div>
      )}
    </div>
  );
}
