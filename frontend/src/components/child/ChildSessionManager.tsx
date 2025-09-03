import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSecureLogout } from '../../utils/secureLogout';

interface ChildSessionManagerProps {
  children: React.ReactNode;
  sessionTimeout?: number; // in minutes, default 20
  warningTime?: number; // in minutes before timeout to show warning, default 2
  activityCheckInterval?: number; // in seconds, default 30
}

interface SessionWarningModalProps {
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  timeRemaining,
  onExtendSession,
  onLogout
}) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Session Ending Soon!
          </h2>
          <p className="text-gray-600 mb-4">
            Your learning session will end in{' '}
            <span className="font-bold text-red-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Would you like to continue learning or take a break?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onExtendSession}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Keep Learning! 📚
            </button>
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Take a Break 😴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChildSessionManager: React.FC<ChildSessionManagerProps> = ({
  children,
  sessionTimeout = 20,
  warningTime = 2,
  activityCheckInterval = 30
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { performLogout, checkLogoutStatus } = useSecureLogout();
  
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(0);
  const [isActive, setIsActive] = useState(true);
  
  const activityTimerRef = useRef<NodeJS.Timeout>();
  const warningTimerRef = useRef<NodeJS.Timeout>();
  const sessionTimerRef = useRef<NodeJS.Timeout>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();

  const isChild = user?.role === 'child';

  // Activity tracking events
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  const updateActivity = useCallback(() => {
    const now = new Date();
    setLastActivityTime(now);
    setIsActive(true);

    // Send activity update to server
    if (isChild) {
      sendActivityUpdate(now);
    }
  }, [isChild]);

  const sendActivityUpdate = async (timestamp: Date) => {
    try {
      await fetch('/api/child/auth/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: timestamp.toISOString(),
          page: location.pathname,
          action: 'user_activity'
        })
      });
    } catch (error) {
      console.error('Failed to send activity update:', error);
    }
  };

  const checkSessionValidity = useCallback(async () => {
    if (!isChild || !sessionStartTime) return;

    try {
      // Use the secure logout service to check if logout is needed
      const logoutCheck = await checkLogoutStatus();
      
      if (logoutCheck.shouldLogout) {
        switch (logoutCheck.reason) {
          case 'session_timeout':
            handleSessionTimeout();
            break;
          case 'suspicious_activity':
            handleSuspiciousActivity({ reason: logoutCheck.reason });
            break;
          case 'no_session':
          case 'security_check_failed':
          default:
            handleSessionExpired();
            break;
        }
        return;
      }

      // If no logout needed, continue with regular session check
      const response = await fetch('/api/child/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpired();
        }
        return;
      }

      const sessionData = await response.json();
      
      // Check for suspicious activity
      if (sessionData.suspiciousActivity) {
        handleSuspiciousActivity(sessionData.suspiciousActivity);
        return;
      }

      // Update session start time if different
      if (sessionData.loginTime) {
        const serverSessionStart = new Date(sessionData.loginTime);
        if (serverSessionStart.getTime() !== sessionStartTime.getTime()) {
          setSessionStartTime(serverSessionStart);
        }
      }

    } catch (error) {
      console.error('Session check failed:', error);
      // On error, perform security logout
      handleSessionExpired();
    }
  }, [isChild, sessionStartTime, checkLogoutStatus]);

  const handleSessionExpired = async () => {
    cleanupTimers();
    await performLogout({
      reason: 'session_timeout',
      redirectTo: '/child/login'
    });
  };

  const handleSuspiciousActivity = async (activityDetails: any) => {
    cleanupTimers();
    await performLogout({
      reason: 'suspicious_activity',
      redirectTo: '/child/login'
    });
  };

  const handleSessionTimeout = async () => {
    cleanupTimers();
    await performLogout({
      reason: 'session_timeout',
      redirectTo: '/child/login'
    });
  };

  const showSessionWarning = () => {
    setShowWarning(true);
    setWarningCountdown(warningTime * 60); // Convert to seconds

    // Start countdown timer
    countdownTimerRef.current = setInterval(() => {
      setWarningCountdown(prev => {
        if (prev <= 1) {
          handleSessionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const extendSession = async () => {
    try {
      const response = await fetch('/api/child/auth/extend-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowWarning(false);
        setSessionStartTime(new Date());
        setLastActivityTime(new Date());
        
        // Clear warning timer and restart session timer
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        startSessionTimer();
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleSessionExpired();
    }
  };

  const startSessionTimer = () => {
    // Clear existing timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }

    // Set timer for warning
    const warningTimeMs = (sessionTimeout - warningTime) * 60 * 1000;
    sessionTimerRef.current = setTimeout(() => {
      showSessionWarning();
    }, warningTimeMs);
  };

  const cleanupTimers = () => {
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
  };

  // Initialize session management for child users
  useEffect(() => {
    if (!isChild) return;

    // Set session start time
    setSessionStartTime(new Date());
    
    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Start activity check timer
    activityTimerRef.current = setInterval(checkSessionValidity, activityCheckInterval * 1000);

    // Start session timeout timer
    startSessionTimer();

    return () => {
      // Cleanup event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      // Cleanup timers
      cleanupTimers();
    };
  }, [isChild, updateActivity, checkSessionValidity, activityCheckInterval]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
      } else {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateActivity]);

  // Handle beforeunload for session cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isChild) {
        // Send session end signal
        navigator.sendBeacon('/api/child/auth/session-end', JSON.stringify({
          timestamp: new Date().toISOString(),
          sessionId: sessionStartTime?.getTime().toString()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isChild, sessionStartTime]);

  return (
    <>
      {children}
      {showWarning && (
        <SessionWarningModal
          timeRemaining={warningCountdown}
          onExtendSession={extendSession}
          onLogout={handleSessionTimeout}
        />
      )}
    </>
  );
};

export default ChildSessionManager;