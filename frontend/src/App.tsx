import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { ParentDashboardLayout } from './components/layout';
import { ProtectedRoute as EnhancedProtectedRoute, PublicRoute as EnhancedPublicRoute } from './components/routing';
import { childProfileApi, studyPlanApi } from './services/api';

// Direct imports - no lazy loading for better reliability
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import EmailVerification from './components/auth/EmailVerification';
import ChildLoginForm from './components/auth/ChildLoginForm';
import LandingPage from './components/auth/LandingPage';
import ChildProfileManager from './components/child/ChildProfileManager';
import ChildDashboard from './components/child/ChildDashboard';
import StudyPlanList from './components/studyPlan/StudyPlanList';
import CreateStudyPlanForm from './components/studyPlan/CreateStudyPlanForm';
import StudyPlanReview from './components/studyPlan/StudyPlanReview';
import ActivityPlayer from './components/studyPlan/ActivityPlayer';
import AchievementCenter from './components/studyPlan/AchievementCenter';
import AnalyticsDashboardWrapper from './components/analytics/AnalyticsDashboardWrapper';
import ProfilePageWrapper from './components/profile/ProfilePageWrapper';
import EducationalContentDemo from './components/demo/EducationalContentDemo';
import SettingsPageWrapper from './components/settings/SettingsPageWrapper';
import TestPages from './components/TestPages';
import TestMasterData from './components/TestMasterData';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Use enhanced routing components
const ProtectedRoute = EnhancedProtectedRoute;
const PublicRoute = EnhancedPublicRoute;

// Root redirect component - handles authenticated vs unauthenticated users
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'CHILD' ? '/child-dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
};

// Catch-all redirect component - handles unknown routes
const CatchAllRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    // For authenticated users, redirect to appropriate dashboard
    const redirectPath = user.role === 'CHILD' ? '/child-dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // For unauthenticated users, determine redirect based on path
  const isChildPath = location.pathname.startsWith('/child');
  const redirectPath = isChildPath ? '/child-login' : '/login';
  return <Navigate to={redirectPath} replace />;
};

// Dashboard component
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    childrenCount: 0,
    studyPlansCount: 0,
    activeStudyPlans: 0,
    completedActivities: 0,
    loading: true
  });

  // Fetch dashboard statistics
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const [children, studyPlans] = await Promise.all([
          childProfileApi.getChildren().catch(() => []),
          studyPlanApi.getPlans().catch(() => [])
        ]);

        setStats({
          childrenCount: children.length,
          studyPlansCount: studyPlans.length,
          activeStudyPlans: studyPlans.filter(plan => plan.status === 'active').length,
          completedActivities: 0, // This would come from analytics
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <ParentDashboardLayout
      title={`Welcome, ${user?.firstName || 'Parent'}!`}
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <Box sx={{ mb: 4 }}>
        {/* Overview Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mb: 4 
        }}>
          <Box sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {stats.loading ? '...' : stats.childrenCount}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Child Profiles
            </Typography>
          </Box>

          <Box sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {stats.loading ? '...' : stats.studyPlansCount}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Study Plans
            </Typography>
          </Box>

          <Box sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {stats.loading ? '...' : stats.activeStudyPlans}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Active Plans
            </Typography>
          </Box>

          <Box sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {stats.loading ? '...' : stats.completedActivities}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Completed Activities
            </Typography>
          </Box>
        </Box>

        {/* Quick Actions */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 3 
        }}>
          <Box sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              👨‍👩‍👧‍👦
            </Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Manage Children
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add, edit, and manage your children's profiles and learning preferences
            </Typography>
            <Button
              component={RouterLink}
              to="/child-profiles"
              variant="contained"
              color="primary"
              fullWidth
            >
              Manage Profiles
            </Button>
          </Box>

          <Box sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'success.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              📚
            </Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Study Plans
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create and manage personalized study plans for your children
            </Typography>
            <Button
              component={RouterLink}
              to="/study-plans"
              variant="contained"
              color="success"
              fullWidth
            >
              View Plans
            </Button>
          </Box>

          <Box sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: 'info.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px'
            }}>
              📊
            </Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track progress and view detailed analytics of your children's learning
            </Typography>
            <Button
              component={RouterLink}
              to="/analytics"
              variant="contained"
              color="info"
              fullWidth
            >
              View Analytics
            </Button>
          </Box>


        </Box>

        {/* Recent Activity */}
        <Typography variant="h5" sx={{ mt: 5, mb: 3, fontWeight: 600 }}>
          Recent Activity
        </Typography>
        
        <Box sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: 'background.paper',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <Typography variant="body1" color="text.secondary">
            No recent activity to display. Start by creating child profiles and study plans!
          </Typography>
        </Box>
      </Box>
    </ParentDashboardLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <div className="App">
              <Routes>
                  {/* Public routes */}
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginForm />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <RegisterForm />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <ForgotPasswordForm />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <PublicRoute>
                        <ResetPasswordForm />
                      </PublicRoute>
                    }
                  />
                  <Route path="/verify-email" element={<EmailVerification />} />
                  <Route
                    path="/child-login"
                    element={
                      <PublicRoute>
                        <ChildLoginForm />
                      </PublicRoute>
                    }
                  />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/child-profiles"
                    element={
                      <ProtectedRoute>
                        <ChildProfileManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/study-plans"
                    element={
                      <ProtectedRoute>
                        <StudyPlanList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/study-plans/create"
                    element={
                      <ProtectedRoute>
                        <CreateStudyPlanForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/study-plans/:planId"
                    element={
                      <ProtectedRoute>
                        <StudyPlanReview />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <AnalyticsDashboardWrapper />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/child-dashboard"
                    element={
                      <ProtectedRoute>
                        <ChildDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/child/plan/:planId/activity/:activityId"
                    element={
                      <ProtectedRoute>
                        <ActivityPlayer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/child/activity/:planId"
                    element={
                      <ProtectedRoute>
                        <ActivityPlayer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/child/achievements"
                    element={
                      <ProtectedRoute>
                        <AchievementCenter />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePageWrapper />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPageWrapper />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/test"
                    element={
                      <ProtectedRoute>
                        <TestPages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/test-master-data"
                    element={
                      <ProtectedRoute>
                        <TestMasterData />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/educational-content-demo"
                    element={
                      <ProtectedRoute>
                        <EducationalContentDemo />
                      </ProtectedRoute>
                    }
                  />

                  {/* Root path - redirect based on authentication status */}
                  <Route path="/" element={<RootRedirect />} />

                  {/* Catch all route - redirect based on authentication status */}
                  <Route path="*" element={<CatchAllRedirect />} />
                </Routes>

                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;