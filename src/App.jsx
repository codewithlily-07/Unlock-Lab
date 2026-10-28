import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { Layout } from './components/layout/Layout';
import { RoleGuard } from './components/layout/RoleGuard';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AllocationExplainedPage } from './pages/AllocationExplainedPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { CredentialsPage } from './pages/CredentialsPage';
import { ExplorePage } from './pages/ExplorePage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';

// Owner & Admin Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { ReviewQueuePage } from './pages/owner/ReviewQueuePage';
import { ResourceEditorPage } from './pages/owner/ResourceEditorPage';
import { VerificationQueuePage } from './pages/admin/VerificationQueuePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<LandingPage />} />
              <Route path="how-allocation-works" element={<AllocationExplainedPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="resources/:id" element={<ResourceDetailPage />} />

              {/* Authenticated User Routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="credentials" element={<CredentialsPage />} />
              <Route path="my-bookings" element={<MyBookingsPage />} />
              <Route path="bookings/:id" element={<BookingDetailPage />} />

              {/* Owner / Manager Routes */}
              <Route
                path="owner/dashboard"
                element={
                  <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                    <OwnerDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="owner/requests"
                element={
                  <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                    <ReviewQueuePage />
                  </RoleGuard>
                }
              />
              <Route
                path="owner/resources/new"
                element={
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <ResourceEditorPage />
                  </RoleGuard>
                }
              />
              <Route
                path="owner/resources/:id/edit"
                element={
                  <RoleGuard allowedRoles={['owner', 'admin']}>
                    <ResourceEditorPage />
                  </RoleGuard>
                }
              />

              {/* Admin Routes */}
              <Route
                path="admin/dashboard"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <VerificationQueuePage />
                  </RoleGuard>
                }
              />
              <Route
                path="admin/verifications"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <VerificationQueuePage />
                  </RoleGuard>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
