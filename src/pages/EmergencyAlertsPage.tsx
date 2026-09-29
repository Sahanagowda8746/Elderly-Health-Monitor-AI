import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, CheckCircle, CheckCheck, Clock,
  MapPin, Phone, User, ExternalLink, Filter, Sparkles, AlertOctagon
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { format } from 'date-fns';

export function EmergencyAlertsPage() {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    setDemoScenario,
  } = useHealth();
  const { profile } = useAuth();

  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'acknowledged' | 'resolved'>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-300 bg-red-50/70 text-red-900';
      case 'high_risk':
        return 'border-orange-300 bg-orange-50/70 text-orange-900';
      default:
        return 'border-amber-300 bg-amber-50/70 text-amber-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Critical Event</span>;
      case 'high_risk':
        return <span className="bg-orange-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">High Risk</span>;
      default:
        return <span className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Warning</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Emergency Alert Center</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized triage, acknowledgment, and dispatch escalation protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDemoScenario('fall_emergency')}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-red-500/20 transition-all flex items-center gap-1.5"
            >
              <AlertOctagon size={15} />
              <span>Simulate Fall Alarm</span>
            </button>
            <button
              onClick={() => setDemoScenario('combined_risk')}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles size={15} />
              <span>Simulate Vitals Alarm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Escalation Contact Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-red-400">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Emergency Dispatch Sequence
              </p>
              <p className="text-sm font-bold text-white">
                Primary Contact: {profile?.caregiverName ?? 'David Vance'} ({profile?.caregiverPhone ?? '+1 (555) 987-6543'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/emergency-location"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <MapPin size={14} />
              <span>Open Emergency GPS Tracker</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('unacknowledged')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'unacknowledged' ? 'bg-white shadow text-red-600 font-bold' : 'text-slate-600'
            }`}
          >
            Unacknowledged ({alerts.filter(a => a.status === 'unacknowledged').length})
          </button>
          <button
            onClick={() => setFilter('acknowledged')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'acknowledged' ? 'bg-white shadow text-amber-600 font-bold' : 'text-slate-600'
            }`}
          >
            Acknowledged ({alerts.filter(a => a.status === 'acknowledged').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'resolved' ? 'bg-white shadow text-emerald-600 font-bold' : 'text-slate-600'
            }`}
          >
            Resolved ({alerts.filter(a => a.status === 'resolved').length})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all bg-white shadow-sm ${getSeverityStyle(alert.severity)}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs font-bold text-slate-800">
                      Parameter: {alert.parameter} ({alert.value})
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      • {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {alert.message}
                  </h3>

                  <p className="text-xs text-slate-600 max-w-3xl">
                    {alert.explanation}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span>
                      Observed: <strong className="text-slate-700">{alert.observedFactors ? alert.observedFactors.join(' | ') : 'Parameter deviation'}</strong>
                    </span>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {alert.status === 'unacknowledged' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <CheckCheck size={14} />
                        <span>Resolve</span>
                      </button>
                    )}

                    {alert.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCheck size={14} />
                        Resolved
                      </span>
                    )}
                  </div>

                  {alert.latitude && alert.longitude && (
                    <Link
                      to={`/emergency-location`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <MapPin size={12} />
                      <span>{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Status Timestamps */}
              {(alert.acknowledgedAt || alert.resolvedAt) && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-4 text-[11px] text-slate-500">
                  {alert.acknowledgedAt && (
                    <span>Ack: {format(new Date(alert.acknowledgedAt), 'HH:mm:ss')}</span>
                  )}
                  {alert.resolvedAt && (
                    <span>Resolved: {format(new Date(alert.resolvedAt), 'HH:mm:ss')}</span>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Alerts Found in Selected Filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Select "Simulate Fall Alarm" or "Simulate Vitals Alarm" above to inspect real-time alert dispatching.
            </p>
          </div>
        )}
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
