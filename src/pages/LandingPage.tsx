import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Activity, Bell, FileText, MapPin, Shield,
  Users, TrendingUp, Cpu, ChevronRight, ArrowRight,
  CheckCircle, Zap, BarChart2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-Time Health Monitoring',
    desc: 'Continuous tracking of heart rate, SpO₂, temperature and motion from wearable IoT sensors.',
    color: 'text-blue-600', bg: 'bg-blue-50',
  },
  {
    icon: Bell,
    title: 'Predictive Health Alerts',
    desc: 'Trend-aware engine detects deterioration patterns before critical thresholds are reached.',
    color: 'text-amber-600', bg: 'bg-amber-50',
  },
  {
    icon: FileText,
    title: 'Medical Report Analysis',
    desc: 'Upload blood tests, lipid panels and other reports to extract and compare health parameters over time.',
    color: 'text-teal-600', bg: 'bg-teal-50',
  },
  {
    icon: Shield,
    title: 'Emergency Assistance',
    desc: 'Automated emergency workflows with GPS location sharing and instant caregiver notifications.',
    color: 'text-red-600', bg: 'bg-red-50',
  },
  {
    icon: Zap,
    title: 'Fall Detection',
    desc: 'Motion analysis with false-alarm reduction logic — checks inactivity and vitals before escalating.',
    color: 'text-purple-600', bg: 'bg-purple-50',
  },
  {
    icon: MapPin,
    title: 'GPS Location Tracking',
    desc: 'Real-time location sharing during emergency events for rapid caregiver and responder access.',
    color: 'text-green-600', bg: 'bg-green-50',
  },
  {
    icon: BarChart2,
    title: 'Health History & Trends',
    desc: 'Longitudinal health charts with filtering, sorting and multi-source data comparison.',
    color: 'text-indigo-600', bg: 'bg-indigo-50',
  },
  {
    icon: Users,
    title: 'Caregiver Monitoring',
    desc: 'Dedicated caregiver portal with alert acknowledgement, resolution workflow and status tracking.',
    color: 'text-pink-600', bg: 'bg-pink-50',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'IoT Sensors', desc: 'Raspberry Pi / ESP32 sensors collect real-time vital signs and motion data.' },
  { step: '02', title: 'Continuous Monitoring', desc: 'Health data is streamed to the cloud in real time via secure API.' },
  { step: '03', title: 'Intelligent Analysis', desc: 'Multi-layer engine analyses current values, trends and uploaded medical reports.' },
  { step: '04', title: 'Risk Detection', desc: 'Predictive alerts are generated for patterns requiring attention before thresholds are breached.' },
  { step: '05', title: 'Caregiver Assistance', desc: 'Caregivers receive instant notifications and can acknowledge or resolve events remotely.' },
];

const STATS = [
  { value: '3', label: 'Intelligence Layers', sub: 'Real-time · Trends · Reports' },
  { value: '6', label: 'Demo Scenarios', sub: 'Normal to Emergency' },
  { value: '30+', label: 'Health Parameters', sub: 'Extracted from reports' },
  { value: '24/7', label: 'Monitoring Coverage', sub: 'Continuous IoT stream' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart size={16} color="white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">HealthGuard AI</p>
              <p className="text-[10px] text-slate-400">Elderly Care Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Login</Link>
            <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-700">Capstone Engineering Project · Demo Ready</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight max-w-4xl mx-auto mb-5">
          AI Smart Elderly Health Monitoring{' '}
          <span className="text-blue-600">&amp; Emergency Assistance</span>{' '}
          System
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Continuous health monitoring, intelligent risk detection and emergency assistance
          for safer elderly care — combining IoT sensors, predictive analytics and medical report intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link to="/signup" className="btn-primary py-3 px-6 text-base">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn-secondary py-3 px-6 text-base">
            Login to Dashboard
          </Link>
        </div>

        {/* Dashboard preview */}
        <div className="relative mx-auto max-w-4xl">
          <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl">
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              {/* Fake dashboard preview */}
              <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                    <Heart size={12} color="white" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">HealthGuard AI Dashboard</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Heart Rate', value: '78', unit: 'BPM', status: 'Normal', color: 'green' },
                  { label: 'SpO₂', value: '97', unit: '%', status: 'Normal', color: 'green' },
                  { label: 'Temperature', value: '36.8', unit: '°C', status: 'Normal', color: 'green' },
                  { label: 'Risk Score', value: '24', unit: '/100', status: 'Low Risk', color: 'green' },
                ].map(({ label, value, unit, status, color }) => (
                  <div key={label} className={`rounded-lg p-3 border bg-${color}-50 border-${color}-200`}>
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-xl font-bold text-slate-800">{value}<span className="text-xs font-normal text-slate-400 ml-1">{unit}</span></p>
                    <p className={`text-xs font-semibold text-${color}-600 mt-1`}>{status}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <div className="bg-slate-100 rounded-lg h-20 flex items-center justify-center">
                  <div className="flex items-end gap-1">
                    {[40, 55, 50, 60, 58, 65, 62, 68, 65, 70, 68, 72, 70, 74].map((h, i) => (
                      <div key={i} className="w-3 rounded-t" style={{ height: `${h}%`, background: '#3b82f6', opacity: 0.5 + i * 0.04 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, sub }) => (
              <div key={label} className="text-center text-white">
                <p className="text-3xl font-extrabold mb-1">{value}</p>
                <p className="text-sm font-semibold opacity-90">{label}</p>
                <p className="text-xs opacity-60 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Elderly Care Platform</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            A multi-source health monitoring framework that goes beyond simple sensor dashboards.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card p-4 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
            <p className="text-slate-500 text-sm">From sensor to caregiver in five intelligent steps</p>
          </div>
          <div className="flex flex-col md:flex-row gap-0">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="flex md:flex-col items-start md:items-center flex-1 gap-4 md:gap-2 pb-6 md:pb-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <>
                      <div className="hidden md:block flex-1 h-0.5 bg-blue-200 w-full mx-2" />
                      <ChevronRight size={14} className="md:hidden text-slate-400 flex-shrink-0" />
                    </>
                  )}
                </div>
                <div className="md:text-center mt-0 md:mt-2">
                  <p className="text-sm font-bold text-slate-800 mb-1">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Intelligence Layers */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Three Intelligence Layers</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            The core innovation: combining real-time IoT data, historical sensor trends,
            and uploaded medical reports into unified longitudinal health intelligence.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { num: '1', title: 'Real-Time Monitoring', items: ['Current sensor readings', 'Abnormal value detection', 'Immediate alerts'], color: 'blue' },
            { num: '2', title: 'Predictive Trend Analysis', items: ['Historical sensor data', 'Trend direction & rate', 'Predictive risk indicators'], color: 'teal' },
            { num: '3', title: 'Report Intelligence', items: ['Uploaded medical reports', 'Parameter extraction', 'Cross-report comparison'], color: 'purple' },
          ].map(({ num, title, items, color }) => (
            <div key={num} className={`card p-5 border-t-4 border-${color}-500`}>
              <div className={`w-8 h-8 rounded-lg bg-${color}-100 text-${color}-700 font-bold text-sm flex items-center justify-center mb-3`}>
                {num}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-3">{title}</h3>
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle size={12} className={`text-${color}-500`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="card p-5 bg-slate-900 text-white text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Combined Output</p>
          <p className="text-lg font-bold">Longitudinal Health Intelligence</p>
          <p className="text-sm text-slate-400 mt-1">
            Current Health + Historical Sensor Data + Medical Reports + Trend Analysis + Emergency Events
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Explore?</h2>
          <p className="text-blue-100 text-sm mb-6">
            No hardware required — the full demo mode simulates realistic health scenarios including
            normal readings, trend deterioration, and emergency events.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/signup" className="bg-white text-blue-700 font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="border border-blue-400 text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Heart size={12} color="white" />
              </div>
              <span className="text-sm font-semibold text-white">HealthGuard AI</span>
            </div>
            <p className="text-xs text-center">
              Final-year Engineering Capstone Project · Assistive Health Monitoring System · Not a medical device
            </p>
            <div className="flex gap-4 text-xs">
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
