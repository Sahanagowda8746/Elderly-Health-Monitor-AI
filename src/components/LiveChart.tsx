import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import type { SensorReading } from '../types';

interface LiveChartProps {
  readings: SensorReading[];
  parameter: 'heartRate' | 'spo2' | 'temperature';
  label: string;
  unit: string;
  color: string;
  yDomain?: [number, number];
  referenceLines?: { value: number; color: string; label: string }[];
  windowCount?: number;
}

interface ChartDataPoint {
  time: string;
  value: number | null;
}

export function LiveChart({
  readings, parameter, label, unit, color,
  yDomain, referenceLines = [], windowCount = 30,
}: LiveChartProps) {
  const data: ChartDataPoint[] = readings
    .slice(-windowCount)
    .map(r => ({
      time: format(new Date(r.timestamp), 'HH:mm:ss'),
      value: r[parameter] as number | null,
    }));

  const CustomTooltip = ({ active, payload, label: lbl }: {
    active?: boolean; payload?: { value: number }[]; label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md text-xs">
        <p className="text-slate-500 mb-1">{lbl}</p>
        <p className="font-bold" style={{ color }}>
          {payload[0].value} {unit}
        </p>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="card p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">{label}</h4>
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">
          Waiting for readings…
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            domain={yDomain ?? ['auto', 'auto']}
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {referenceLines.map(rl => (
            <ReferenceLine
              key={rl.value}
              y={rl.value}
              stroke={rl.color}
              strokeDasharray="4 2"
              strokeWidth={1}
              label={{ value: rl.label, position: 'insideTopRight', fontSize: 9, fill: rl.color }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
