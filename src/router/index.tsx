import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import PermissionRoute from './PermissionRoute';
import LoginPage from '@/features/auth/LoginPage';

const DashboardHome = lazy(() => import('@/features/Dashboard/Pages/DashboardHome'));
const StudentManagement = lazy(() => import('@/features/Students/Pages/StudentManagement'));
const ClassManagement = lazy(() => import('@/features/Classes/Pages/ClassManagement'));
const FinancialDashboard = lazy(() => import('@/features/Finance/Pages/FinancialDashboard'));
const GradesPage = lazy(() => import('@/features/Grades/Pages/GradesPage'));
const AdmissionManagement = lazy(() => import('@/features/Admissions/Pages/AdmissionManagement'));
const CommunicationCenter = lazy(() => import('@/features/Communication/Pages/CommunicationCenter'));
const EventsPage = lazy(() => import('@/features/Events/Pages/EventsPage'));
const InventoryPage = lazy(() => import('@/features/Inventory/Pages/InventoryPage'));
const UserManagement = lazy(() => import('@/features/Users/Pages/UserManagement'));
const DisciplinePage = lazy(() => import('@/features/Discipline/Pages/DisciplinePage'));
const ReportsPage = lazy(() => import('@/features/Reports/Pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/Settings/Pages/SettingsPage'));
const TeacherDashboardPage = lazy(() => import('@/features/Teachers/Pages/TeacherDashboardPage'));
const TeacherProfilePage = lazy(() => import('@/features/Teachers/Pages/TeacherProfilePage'));
const TeacherWorkloadPage = lazy(() => import('@/features/Teachers/Pages/TeacherWorkloadPage'));
const ConductPage = lazy(() => import('@/features/Conduct/Pages/ConductPage'));
const ProfilePage = lazy(() => import('@/features/Users/Pages/ProfilePage'));

export default function AppRouter() {
  return (
    <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route
            path="/students"
            element={
              <PermissionRoute permission="students:read">
                <StudentManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <PermissionRoute permission="classes:read">
                <ClassManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <PermissionRoute permission="finance:read">
                <FinancialDashboard />
              </PermissionRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <PermissionRoute permission="grades:read">
                <GradesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/admissions"
            element={
              <PermissionRoute permission="admissions:read">
                <AdmissionManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/communication"
            element={
              <PermissionRoute permission="communication:read">
                <CommunicationCenter />
              </PermissionRoute>
            }
          />
          <Route
            path="/events"
            element={
              <PermissionRoute permission="events:read">
                <EventsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PermissionRoute permission="inventory:read">
                <InventoryPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PermissionRoute permission="users:read">
                <UserManagement />
              </PermissionRoute>
            }
          />
          <Route
            path="/discipline"
            element={
              <PermissionRoute permission="discipline:read">
                <DisciplinePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PermissionRoute permission="reports:read">
                <ReportsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PermissionRoute permission="settings:read">
                <SettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PermissionRoute permission="grades:read">
                <TeacherDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <PermissionRoute permission="teachers:read">
                <TeacherProfilePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/teachers/workload"
            element={
              <PermissionRoute permission="teachers:read">
                <TeacherWorkloadPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/conduct"
            element={
              <PermissionRoute permission="conduct:write">
                <ConductPage />
              </PermissionRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

