import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '../components/layout/AppShell'
import { ConsoleShell } from '../components/layout/ConsoleShell'
import { PublicLayout } from '../components/layout/PublicLayout'
import { RequireAuth } from '../components/guards/RequireAuth'
import { RequireHunterVerified } from '../components/guards/RequireHunterVerified'
import { RequireRole } from '../components/guards/RequireRole'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { TermsPage } from '../pages/legal/TermsPage'
import { PrivacyPage } from '../pages/legal/PrivacyPage'
import { OnboardingCertificatePage } from '../pages/onboarding/OnboardingCertificatePage'
import { OnboardingIdentityPage } from '../pages/onboarding/OnboardingIdentityPage'
import { OnboardingOathPage } from '../pages/onboarding/OnboardingOathPage'
import { OnboardingRootPage } from '../pages/onboarding/OnboardingRootPage'
import { OnboardingTestPage } from '../pages/onboarding/OnboardingTestPage'
import { OnboardingTrainingPage } from '../pages/onboarding/OnboardingTrainingPage'
import { DashboardPage } from '../pages/app/DashboardPage'
import { BaitsPage } from '../pages/app/BaitsPage'
import { BaitDetailPage } from '../pages/app/BaitDetailPage'
import { HuntSessionsPage } from '../pages/app/HuntSessionsPage'
import { HuntSessionPage } from '../pages/app/HuntSessionPage'
import { ReportsPage } from '../pages/app/ReportsPage'
import { ReportDetailPage } from '../pages/app/ReportDetailPage'
import { RewardsPage } from '../pages/app/RewardsPage'
import { RankingPage } from '../pages/app/RankingPage'
import { GlobalViewPage } from '../pages/app/GlobalViewPage'
import { ProfilePage } from '../pages/app/ProfilePage'
import { NotificationsPage } from '../pages/app/NotificationsPage'
import { ConsoleReportsPage } from '../pages/console/ConsoleReportsPage'
import { ConsoleReportDetailPage } from '../pages/console/ConsoleReportDetailPage'
import { ConsoleMonitoringPage } from '../pages/console/ConsoleMonitoringPage'
import { ConsoleUsersPage } from '../pages/console/ConsoleUsersPage'
import { ConsoleRedemptionsPage } from '../pages/console/ConsoleRedemptionsPage'
import { ConsoleSimulatePage } from '../pages/console/ConsoleSimulatePage'
import { ConsoleMorePage } from '../pages/console/ConsoleMorePage'
import { ConsoleContentPage } from '../pages/console/ConsoleContentPage'
import { ConsoleAuditPage } from '../pages/console/ConsoleAuditPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/legal/terms', element: <TermsPage /> },
      { path: '/legal/privacy', element: <PrivacyPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <OnboardingRootPage />
      </RequireAuth>
    ),
    children: [
      { path: '/onboarding', element: <Navigate to="/onboarding/identity" replace /> },
      { path: '/onboarding/identity', element: <OnboardingIdentityPage /> },
      { path: '/onboarding/training', element: <OnboardingTrainingPage /> },
      { path: '/onboarding/test', element: <OnboardingTestPage /> },
      { path: '/onboarding/oath', element: <OnboardingOathPage /> },
      { path: '/onboarding/certificate', element: <OnboardingCertificatePage /> },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <RequireHunterVerified>
          <AppShell />
        </RequireHunterVerified>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'baits', element: <BaitsPage /> },
      { path: 'baits/:baitId', element: <BaitDetailPage /> },
      { path: 'hunt', element: <HuntSessionsPage /> },
      { path: 'hunt/:sessionId', element: <HuntSessionPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'reports/:reportId', element: <ReportDetailPage /> },
      { path: 'rewards', element: <RewardsPage /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'global', element: <GlobalViewPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  {
    path: '/console',
    element: (
      <RequireAuth>
        <RequireRole allowed={['POLICE', 'ADMIN']}>
          <ConsoleShell />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/console/reports" replace /> },
      { path: 'reports', element: <ConsoleReportsPage /> },
      { path: 'reports/:reportId', element: <ConsoleReportDetailPage /> },
      { path: 'monitoring', element: <ConsoleMonitoringPage /> },
      {
        path: 'users',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleUsersPage />
          </RequireRole>
        ),
      },
      {
        path: 'rewards',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleRedemptionsPage />
          </RequireRole>
        ),
      },
      {
        path: 'simulate',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleSimulatePage />
          </RequireRole>
        ),
      },
      {
        path: 'content',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleContentPage />
          </RequireRole>
        ),
      },
      {
        path: 'audit',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleAuditPage />
          </RequireRole>
        ),
      },
      {
        path: 'more',
        element: (
          <RequireRole allowed={['ADMIN']}>
            <ConsoleMorePage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
