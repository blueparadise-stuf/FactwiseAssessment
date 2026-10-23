import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientListPage } from './pages/PatientListPage';
import { PatientRegisterPage } from './pages/PatientRegisterPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { TemperaturesPage } from './pages/TemperaturesPage';
import { DoctorRoundsPage } from './pages/DoctorRoundsPage';
import { DischargesPage } from './pages/DischargesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Application Routes inside AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientListPage />} />
              <Route
                path="patients/new"
                element={
                  <ProtectedRoute allowedRoles={['Administrator']}>
                    <PatientRegisterPage />
                  </ProtectedRoute>
                }
              />
              <Route path="patients/:id" element={<PatientDetailPage />} />
              <Route path="temperatures" element={<TemperaturesPage />} />
              <Route path="doctor-rounds" element={<DoctorRoundsPage />} />
              <Route path="discharges" element={<DischargesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['Administrator']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
