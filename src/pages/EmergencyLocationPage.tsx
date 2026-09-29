import React, { useState } from 'react';
import {
  MapPin, Navigation, ShieldCheck, Phone, ExternalLink, Copy,
  Check, Hospital, AlertTriangle, Compass, Clock, Radio
} from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { format } from 'date-fns';

export function EmergencyLocationPage() {
  const { latestReading } = useHealth();
  const [copied, setCopied] = useState(false);

  // Defaults to elderly home location
  const lat = latestReading?.latitude ?? 37.7749;
  const lng = latestReading?.longitude ?? -122.4194;
  const address = '428 Elmwood Terrace, San Francisco, CA 94117';

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)} (${address})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Geospatial Emergency Location</h1>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Radio size={12} className="animate-pulse" /> Live GNSS Fix
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Precise patient positioning with geofenced safety boundary & EMS routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-slate-300"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy GPS String'}</span>
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <ExternalLink size={14} />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Map Display (Styled interactive simulation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Visualization Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800 relative min-h-[460px] flex flex-col justify-between p-6">
          {/* Simulated Map Visuals */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="0.8" />
                </pattern>
                <radialGradient id="geofence" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="90%" stopColor="#10b981" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Geofence safe circle */}
              <circle cx="50%" cy="48%" r="140" fill="url(#geofence)" stroke="#10b981" strokeWidth="2" strokeDasharray="6,4" />
            </svg>
          </div>

          {/* Top telemetry badges */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Geofence Status: <strong>Within Safe Zone (Home 500m)</strong></span>
            </div>
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
              Accuracy: ±2.4 meters
            </div>
          </div>

          {/* Center Pin Marker */}
          <div className="relative z-10 flex flex-col items-center justify-center my-auto">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 animate-ping absolute" />
              <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white relative z-10">
                <MapPin size={20} />
              </div>
            </div>
            <div className="mt-3 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-xl shadow-lg border border-slate-200 text-center">
              <p className="text-xs font-bold text-slate-900">Patient: Margaret Vance</p>
              <p className="text-[11px] font-mono text-slate-600">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
            </div>
          </div>

          {/* Bottom Hospital Marker & Info */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl p-3 text-xs text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                <Hospital size={16} />
              </div>
              <div>
                <p className="font-semibold text-slate-100">Nearest EMS Facility: St. Jude Memorial Hospital</p>
                <p className="text-slate-400 text-[11px]">1.8 miles • Estimated Ambulance Response: 6-8 mins</p>
              </div>
            </div>
            <div className="font-mono text-xs text-slate-300">
              Fix: {format(new Date(), 'HH:mm:ss')}
            </div>
          </div>
        </div>

        {/* Location Telemetry Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">GNSS Coordinates Telemetry</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Physical Address / Vicinity</span>
                <span className="font-semibold text-slate-800">{address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-[11px] font-sans block mb-0.5">Latitude</span>
                  <span className="font-bold text-slate-800">{lat.toFixed(6)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-[11px] font-sans block mb-0.5">Longitude</span>
                  <span className="font-bold text-slate-800">{lng.toFixed(6)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Altitude</span>
                  <span className="font-bold text-slate-800">48 m AMSL</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Velocity</span>
                  <span className="font-bold text-slate-800">0.0 km/h (Stationary)</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Emergency Dispatch Packet
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Pre-formatted coordinate and vital summary for 911 operator or paramedic relay.
              </p>
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono leading-relaxed">
                PATIENT: Margaret Vance (76F)<br />
                LOCATION: {address}<br />
                COORDS: {lat.toFixed(6)}, {lng.toFixed(6)}<br />
                LATEST HR: {latestReading?.heartRate ?? 76} BPM • SpO2: {latestReading?.spo2 ?? 97}%<br />
                PRIMARY CONTACT: +1 (555) 987-6543
              </div>
            </div>
          </div>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
}
