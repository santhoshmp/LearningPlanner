import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SessionManagerProps {
  inactivityTimeout?: number; // in milliseconds, default 30 minutes
}

const SessionManager: React.FC<SessionManagerProps> = ({ inactivityTimeout = 30 * 60 * 1000 }) => {
  const { user, isChild, refreshAuth } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds warning before logout
  const navigate = useNavigate();

  useEffect(() => {
    if (!isChild) return; // Only apply to child users

    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownTimer);
      setShowWarning(false);

      // Set timer for inactivity
      inactivityTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(60);
        
        // Start countdown
        countdownTimer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set timer for auto-logout
        warningTimer = setTimeout(() => {
          setShowWarning(false);
          navigate('/child-login');
        }, 60000); // 60 seconds after warning
      }, inactivityTimeout);
    };

    // Reset timers on mount
    resetTimers();

    // Reset timers on user activity
    const handleActivity = () => {
      resetTimers();
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      // Clean up timers and event listeners
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearInterval(countdownTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isChild, inactivityTimeout, navigate]);

  const handleStayLoggedIn = () => {
    refreshAuth();
    setShowWarning(false);
  };

  if (!showWarning || !isChild) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-4">
            <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Are you still there?</h3>
          <p className="mt-2 text-gray-600">
            You'll be logged out in {timeLeft} seconds due to inactivity.
          </p>
        </div>
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            onClick={handleStayLoggedIn}
            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            I'm still here!
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;