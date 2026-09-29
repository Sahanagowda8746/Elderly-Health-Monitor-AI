import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HealthProvider } from './contexts/HealthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { PredictiveAlertsPage } from './pages/PredictiveAlertsPage';
import { PatientReportsPage } from './pages/PatientReportsPage';
import { HealthHistoryPage } from './pages/HealthHistoryPage';
import { EmergencyAlertsPage } from './pages/EmergencyAlertsPage';
import { EmergencyLocationPage } from './pages/EmergencyLocationPage';
import { DeviceStatusPage } from './pages/DeviceStatusPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HealthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />

            {/* Protected Application Routes wrapped in Layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LiveMonitoringPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/predictive-alerts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PredictiveAlertsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PatientReportsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <HealthHistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-alerts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EmergencyAlertsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-location"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EmergencyLocationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/device-status"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DeviceStatusPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PatientProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HealthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
