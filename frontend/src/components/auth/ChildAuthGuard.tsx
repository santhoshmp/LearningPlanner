import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState } from '../common';
import { ErrorState } from '../common';

interface ChildAuthGuardProps {
  children: React.ReactNode;
  requireActiveSession?: boolean;
  maxSessionDuration?: number; // in minutes, default 20
}

interface ChildSessionInfo {
  isValid: boolean;
  timeRemaining: number;
  lastActivity: Date;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
  };
}

export const ChildAuthGuard: React.FC<ChildAuthGuardProps> = ({
  children,
  requireActiveSession = true,
  maxSessionDuration = 20
}) => {
  const { user, isAuthenticated, isLoading, isChild } = useAuth();
  const location = useLocation();
  const [sessionInfo, setSessionInfo] = useState<ChildSessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Use the isChild from AuthContext which is more reliable

  useEffect(() => {
    if (!isAuthenticated || !isChild) {
      setSessionLoading(false);
      return;
    }

    validateChildSession();
  }, [isAuthenticated, isChild, user]);

  const validateChildSession = async () => {
    try {
      setSessionLoading(true);
      setSessionError(null);

      const response = await fetch('/api/child/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or invalid
          handleSessionExpired();
          return;
        }
        throw new Error('Failed to validate session');
      }

      const sessionData = await response.json();
      
      // Check session duration
      const sessionStart = new Date(sessionData.loginTime);
      const now = new Date();
      const sessionDurationMinutes = (now.getTime() - sessionStart.getTime()) / (1000 * 60);

      if (sessionDurationMinutes > maxSessionDuration) {
        handleSessionTimeout();
        return;
      }

      // Check for suspicious activity
      if (sessionData.suspiciousActivity) {
        handleSuspiciousActivity(sessionData.suspiciousActivity);
        return;
      }

      setSessionInfo({
        isValid: true,
        timeRemaining: maxSessionDuration - sessionDurationMinutes,
        lastActivity: new Date(sessionData.lastActivity),
        sessionId: sessionData.sessionId,
        deviceInfo: sessionData.deviceInfo
      });

      // Update last activity
      updateLastActivity();

    } catch (error) {
      console.error('Session validation error:', error);
      setSessionError('Unable to validate session. Please try logging in again.');
    } finally {
      setSessionLoading(false);
    }
  };

  const updateLastActivity = async () => {
    try {
      await fetch('/api/child/auth/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          page: location.pathname,
          action: 'page_view'
        })
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  const handleSessionExpired = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setSessionError('Your session has expired. Please log in again.');
  };

  const handleSessionTimeout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setSessionError('Your learning session has ended. Time for a break! Please log in again when you\'re ready to continue.');
  };

  const handleSuspiciousActivity = (activityDetails: any) => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setSessionError('We noticed some unusual activity. For your safety, please ask a parent to help you log in again.');
    
    // Notify parents about suspicious activity
    notifyParentsOfSuspiciousActivity(activityDetails);
  };

  const notifyParentsOfSuspiciousActivity = async (activityDetails: any) => {
    try {
      await fetch('/api/child/security/suspicious-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childId: user?.id,
          activityDetails,
          timestamp: new Date().toISOString(),
          location: location.pathname
        })
      });
    } catch (error) {
      console.error('Failed to notify parents:', error);
    }
  };

  // Show loading state while checking authentication and session
  if (isLoading || sessionLoading) {
    return <LoadingState message="Checking your session..." childFriendly={true} icon="🔐" />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/child-login" state={{ from: location }} replace />;
  }

  // Redirect to parent login if not a child user
  if (!isChild) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show error state if session validation failed
  if (sessionError) {
    return (
      <ErrorState
        title="Session Problem"
        message={sessionError}
        actionButton={{
          text: "Go to Login",
          onClick: () => window.location.href = '/child-login'
        }}
      />
    );
  }

  // Show error if session is invalid and active session is required
  if (requireActiveSession && (!sessionInfo || !sessionInfo.isValid)) {
    return (
      <ErrorState
        title="Session Required"
        message="You need an active session to access this page."
        actionButton={{
          text: "Go to Login",
          onClick: () => window.location.href = '/child-login'
        }}
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ChildAuthGuard;