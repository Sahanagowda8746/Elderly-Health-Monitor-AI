import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { user, loading, sessionType } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  // Allow demo sessions (no Supabase auth needed)
  if (sessionType === 'demo') return <>{children}</>;

  // Allow real authenticated users
  if (sessionType === 'real' && user) return <>{children}</>;

  // No session — redirect to login
  return <Navigate to="/login" replace />;
}
