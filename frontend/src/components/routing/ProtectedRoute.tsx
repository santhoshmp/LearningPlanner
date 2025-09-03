import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, isChild, userRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being determined
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box textAlign="center">
          <Box sx={{ fontSize: '48px', mb: 2, animation: 'bounce 1s infinite' }}>
            🔐
          </Box>
          <CircularProgress sx={{ color: 'white' }} />
          <Box sx={{ mt: 2, fontSize: '18px', fontWeight: 'bold' }}>
            Checking your login...
          </Box>
        </Box>
      </Box>
    );
  }

  // If not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    // Determine redirect path based on current location
    const isChildPath = location.pathname.startsWith('/child') || 
                       location.pathname === '/child-dashboard';
    
    const redirectPath = isChildPath ? '/child-login' : '/login';
    
    return <Navigate to={redirectPath} replace />;
  }

  // Handle role-based routing for authenticated users
  if (isChild || user?.role === 'CHILD') {
    // Child users can only access child routes
    const allowedChildPaths = [
      '/child-dashboard',
      '/child/',
      '/child-login'
    ];
    
    const isAllowedPath = allowedChildPaths.some(path => {
      if (path.endsWith('/')) {
        return location.pathname.startsWith(path);
      }
      return location.pathname === path;
    });
    
    if (!isAllowedPath) {
      console.log('Child user accessing non-child route, redirecting to dashboard');
      return <Navigate to="/child-dashboard" replace />;
    }
  } else if (userRole === 'parent' || user?.role === 'PARENT') {
    // Parent users cannot access child-specific routes
    if (location.pathname.startsWith('/child/') || location.pathname === '/child-dashboard') {
      console.log('Parent user accessing child route, redirecting to parent dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};