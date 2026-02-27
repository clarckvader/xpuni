import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'
import { AuthProvider, AuthContext } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import Toaster from '@/components/Toaster'
import { useContext } from 'react'

// Pages
import LandingPage from '@/pages/Landing'
import InstitutionPage from '@/pages/InstitutionPage'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import ProfilePage from '@/pages/Profile'
import NotFoundPage from '@/pages/NotFound'

// Student pages
import StudentActivitiesPage from '@/pages/student/Activities'
import StudentActivityDetailPage from '@/pages/student/ActivityDetail'
import StudentSubmissionsPage from '@/pages/student/Submissions'
import StudentRewardsPage from '@/pages/student/Rewards'
import StudentRewardDetailPage from '@/pages/student/RewardDetail'
import StudentBalancePage from '@/pages/student/Balance'
import StudentTransactionsPage from '@/pages/student/Transactions'

// Reviewer pages
import ReviewerSubmissionsPage from '@/pages/reviewer/Submissions'
import ReviewerSubmissionDetailPage from '@/pages/reviewer/SubmissionDetail'

// Admin pages
import AdminUsersPage from '@/pages/admin/Users'
import AdminActivitiesPage from '@/pages/admin/Activities'
import AdminInstitutionsPage from '@/pages/admin/Institutions'
import AdminRewardsPage from '@/pages/admin/Rewards'
import AdminRedemptionsPage from '@/pages/admin/Redemptions'
import AdminHealthPage from '@/pages/admin/Health'

// Components
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingPage from '@/pages/Loading'

function AppContent() {
  const authContext = useContext(AuthContext)

  if (authContext?.isLoading) {
    return <LoadingPage />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/i/:slug" element={<InstitutionPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />

        {/* Student Routes */}
        <Route path="/student/activities" element={<StudentActivitiesPage />} />
        <Route path="/student/activities/:id" element={<StudentActivityDetailPage />} />
        <Route path="/student/submissions" element={<StudentSubmissionsPage />} />
        <Route path="/student/rewards" element={<StudentRewardsPage />} />
        <Route path="/student/rewards/:id" element={<StudentRewardDetailPage />} />
        <Route path="/student/balance" element={<StudentBalancePage />} />
        <Route path="/student/transactions" element={<StudentTransactionsPage />} />

        {/* Reviewer Routes */}
        <Route path="/reviewer/submissions" element={<ReviewerSubmissionsPage />} />
        <Route path="/reviewer/submissions/:id" element={<ReviewerSubmissionDetailPage />} />

        {/* Admin Routes */}
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/activities" element={<AdminActivitiesPage />} />
        <Route path="/admin/institutions" element={<AdminInstitutionsPage />} />
        <Route path="/admin/rewards" element={<AdminRewardsPage />} />
        <Route path="/admin/redemptions" element={<AdminRedemptionsPage />} />
        <Route path="/admin/health" element={<AdminHealthPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <PrimeReactProvider>
      <Router>
        <AuthProvider persistAuth={true}>
          <NotificationProvider>
            <AppContent />
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </PrimeReactProvider>
  )
}
