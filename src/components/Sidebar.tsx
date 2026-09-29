import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Activity, Bell, FileText, History,
  AlertTriangle, MapPin, Cpu, User, Settings, LogOut,
  Heart, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useHealth } from '../contexts/HealthContext';

const NAV_ITEMS = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monitoring',         icon: Activity,        label: 'Live Monitoring' },
  { to: '/predictive-alerts',  icon: Bell,            label: 'Predictive Alerts' },
  { to: '/reports',            icon: FileText,        label: 'Patient Reports' },
  { to: '/history',            icon: History,         label: 'Health History' },
  { to: '/emergency-alerts',   icon: AlertTriangle,   label: 'Emergency Alerts' },
  { to: '/emergency-location', icon: MapPin,          label: 'Emergency Location' },
  { to: '/device-status',      icon: Cpu,             label: 'Device Status' },
  { to: '/profile',            icon: User,            label: 'Patient Profile' },
  { to: '/settings',           icon: Settings,        label: 'Settings' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { signOut, profile, user, sessionType, exitDemoSession } = useAuth();
  const { demoMode, unreadAlertCount } = useHealth();
  const navigate = useNavigate();

  const handleExitOrLogout = async () => {
    if (sessionType === 'demo') {
      exitDemoSession();
      navigate('/login');
    } else {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart size={16} color="white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">HealthGuard AI</p>
            <p className="text-xs text-slate-400">Elderly Care Monitor</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Demo badge */}
      {sessionType === 'demo' && (
        <div className="mx-4 mt-3 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 w-full justify-center">
            DEMO MODE ACTIVE
          </span>
        </div>
      )}

      {/* Patient info */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 font-semibold text-xs">
            {sessionType === 'demo' ? 'DM' : (profile?.fullName ? profile.fullName.charAt(0) : 'U')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {sessionType === 'demo'
                ? 'Margaret Vance'
                : (profile?.fullName || user?.email || 'My Account')}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {sessionType === 'demo'
                ? 'Demo Simulation'
                : (user?.email || profile?.email || 'Personal Account')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {to === '/emergency-alerts' && unreadAlertCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout / Exit Demo */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={handleExitOrLogout}
          className={`sidebar-link w-full ${
            sessionType === 'demo'
              ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
              : 'text-red-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          <LogOut size={17} />
          <span>{sessionType === 'demo' ? 'Exit Demo Mode' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-white border border-slate-200 rounded-lg shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`sidebar-mobile-overlay fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 z-50 shadow-xl transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
