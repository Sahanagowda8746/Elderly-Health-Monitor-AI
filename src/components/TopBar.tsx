import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, FileText, Cpu, TrendingUp } from 'lucide-react';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

function NotificationIcon({ type }: { type: string }) {
  const cls = 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0';
  switch (type) {
    case 'critical': return <div className={`${cls} bg-red-100`}><AlertTriangle size={13} className="text-red-600" /></div>;
    case 'warning':  return <div className={`${cls} bg-amber-100`}><AlertTriangle size={13} className="text-amber-600" /></div>;
    case 'report':   return <div className={`${cls} bg-teal-100`}><FileText size={13} className="text-teal-600" /></div>;
    case 'success':  return <div className={`${cls} bg-green-100`}><CheckCheck size={13} className="text-green-600" /></div>;
    default:         return <div className={`${cls} bg-blue-100`}><Info size={13} className="text-blue-600" /></div>;
  }
}

export function TopBar() {
  const { profile, sessionType } = useAuth();
  const {
    notifications, unreadNotificationCount,
    markNotificationRead, markAllNotificationsRead,
    demoMode, device,
  } = useHealth();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = sessionType === 'demo'
    ? 'Demo User'
    : (profile?.fullName?.split(' ')[0] ?? 'User');

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 sticky top-0 z-20">
      {/* Left: greeting */}
      <div>
        <h1 className="text-base font-semibold text-slate-900">
          {greeting}, <span className="text-blue-700">{firstName}</span>
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${demoMode ? 'bg-amber-500' : device.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-slate-400'} animate-pulse`} />
          <p className="text-xs text-slate-500">
            {demoMode
              ? 'Demo Mode Active — Simulated Readings'
              : device.connectionStatus === 'connected'
                ? 'Monitoring Active — Real Hardware Paired'
                : 'Personal Account — Hardware Device Standby'}
          </p>
        </div>
      </div>

      {/* Right: badges & notifications */}
      <div className="flex items-center gap-3" ref={panelRef}>
        {demoMode ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            DEMO MODE • Simulated Data
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className={`w-1.5 h-1.5 rounded-full ${device.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            PERSONAL ACCOUNT • {device.connectionStatus === 'connected' ? 'Live Telemetry' : 'Device Standby'}
          </span>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Notification panel */}
        {open && (
          <div className="absolute right-4 top-16 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              {unreadNotificationCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <NotificationIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${!n.read ? 'text-slate-800' : 'text-slate-600'}`}>
                          {n.title}
                          {!n.read && <span className="ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {format(new Date(n.timestamp), 'dd MMM, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
