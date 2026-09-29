import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck,
  Sparkles, User, FlaskConical,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, supabaseReady, enterDemoSession } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
    } else {
      navigate('/dashboard');
    }
  };

  const handleDemoAccess = () => {
    enterDemoSession();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">HealthGuard AI</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to your personal monitoring portal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-4">

        {/* ── REAL ACCOUNT LOGIN ─────────────────────────────────────────── */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <User size={14} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Personal Account</h3>
          </div>

          {!supabaseReady && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Supabase is not configured</p>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Real account sign-in requires valid <code className="bg-amber-100 font-mono px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-100 font-mono px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100 font-mono px-1 rounded">.env</code>. You can explore the app immediately via Demo Mode below.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset requires Supabase to be configured with your project credentials.')}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to My Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            New to HealthGuard?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
              Create a real account →
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Personal health data stays private and secure</span>
          </div>
        </div>

        {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex-shrink-0">
            Or explore without an account
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ── DEMO MODE SECTION ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-7 px-6 sm:px-10 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <FlaskConical size={14} className="text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Demo Mode</span>
              <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Simulated Data</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            Explore the <span className="text-white font-semibold">complete monitoring system</span> using realistic simulated health data. No account setup required. No personal data stored.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-slate-400">
            {['Simulated vitals', 'Live alerts', 'AI insights', 'Demo reports', 'GPS location', 'Fall detection'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={15} className="text-amber-300" />
            <span>Enter Demo Mode</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-500">
            Demo data is isolated from real patient records
          </p>
        </div>

      </div>
    </div>
  );
}
