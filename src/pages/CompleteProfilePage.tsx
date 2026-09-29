import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, CheckCircle2, ArrowRight, User, Shield, Cpu,
} from 'lucide-react';

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const patientName = (location.state as { name?: string } | null)?.name ?? 'Patient';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50/40 to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success animation */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-white" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow">
            <Heart size={14} className="text-white fill-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to HealthGuard AI!
        </h1>
        <p className="text-slate-500 text-base mb-1">
          Your account has been created successfully.
        </p>
        <p className="text-blue-600 font-semibold text-lg mb-8">
          {patientName}'s health monitoring profile is ready.
        </p>

        {/* Feature overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md shadow-slate-200/60 p-6 mb-6 text-left space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">What happens next</h2>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Your personal dashboard is ready</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your profile information is saved. The dashboard currently shows "waiting for device" until a monitoring device is connected.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cpu size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Connect your monitoring device</p>
              <p className="text-xs text-slate-500 mt-0.5">
                A Raspberry Pi or ESP32 device running the HealthGuard sensor firmware will stream live vitals to your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={16} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Your data stays private</p>
              <p className="text-xs text-slate-500 mt-0.5">
                All health data is encrypted and belongs exclusively to your account. Demo data is never mixed with real patient records.
              </p>
            </div>
          </div>
        </div>

        {/* Medical disclaimer */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-700 text-left mb-6">
          <p className="font-semibold text-sky-900 mb-1">⚕ Important Health Notice</p>
          <p className="leading-relaxed">
            HealthGuard AI is an assistive monitoring and alert system. It does not diagnose medical conditions and does not replace professional medical care. Always consult a qualified healthcare provider for any health concerns.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2.5 group"
        >
          <span>Go to My Dashboard</span>
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
