import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface SessionInfo {
  sessionId?: string;
  isActive: boolean;
  duration: number;
  loginTime?: string;
  lastActivity?: string;
}

interface SecurityLog {
  id: string;
  event: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'INFO';
  ipAddress: string;
  userAgent: string;
  metadata: any;
  createdAt: string;
}

export const useChildSessionMonitoring = (childId?: string) => {
  const { user, isChild } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get current session information
   */
  const getSessionInfo = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (isChild) {
        // Child getting their own session info
        response = await api.get('/api/child-session-monitoring/my-session');
      } else if (childId) {
        // Parent getting child's session info
        response = await api.get(`/api/child-session-monitoring/child/${childId}/session`);
      } else {
        throw new Error('Child ID required for parent access');
      }

      if (response.data.success) {
        setSessionInfo(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to get session info:', err);
      setError(err.response?.data?.error || 'Failed to get session information');
    } finally {
      setIsLoading(false);
    }
  }, [user, isChild, childId]);

  /**
   * Update session activity (child only)
   */
  const updateActivity = useCallback(async () => {
    if (!isChild || !user) return;

    try {
      await api.post('/api/child-session-monitoring/my-session/activity');
    } catch (err: any) {
      console.error('Failed to update activity:', err);
      // Don't set error state for activity updates to avoid UI disruption
    }
  }, [isChild, user]);

  /**
   * Terminate child session (parent only)
   */
  const terminateSession = useCallback(async (reason = 'PARENT_TERMINATED') => {
    if (isChild || !childId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post(
        `/api/child-session-monitoring/child/${childId}/session/terminate`,
        { reason }
      );

      if (response.data.success) {
        // Refresh session info after termination
        await getSessionInfo();
        return true;
      }
    } catch (err: any) {
      console.error('Failed to terminate session:', err);
      setError(err.response?.data?.error || 'Failed to terminate session');
      return false;
    } finally {
      setIsLoading(false);
    }

    return false;
  }, [isChild, childId, getSessionInfo]);

  /**
   * Get security logs (parent only)
   */
  const getSecurityLogs = useCallback(async (limit = 50, offset = 0) => {
    if (isChild || !childId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/child-session-monitoring/child/${childId}/security-logs`,
        { params: { limit, offset } }
      );

      if (response.data.success) {
        setSecurityLogs(response.data.data.logs);
      }
    } catch (err: any) {
      console.error('Failed to get security logs:', err);
      setError(err.response?.data?.error || 'Failed to get security logs');
    } finally {
      setIsLoading(false);
    }
  }, [isChild, childId]);

  /**
   * Auto-refresh session info
   */
  useEffect(() => {
    if (!user) return;

    // Initial load
    getSessionInfo();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(getSessionInfo, 30000);

    return () => clearInterval(interval);
  }, [getSessionInfo, user]);

  /**
   * Auto-update activity for child users
   */
  useEffect(() => {
    if (!isChild || !user) return;

    // Update activity every 2 minutes
    const interval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateActivity, isChild, user]);

  /**
   * Format session duration
   */
  const formatDuration = useCallback((duration: number): string => {
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, []);

  /**
   * Get session status color
   */
  const getSessionStatusColor = useCallback((isActive: boolean): string => {
    return isActive ? 'success' : 'error';
  }, []);

  /**
   * Get security log severity color
   */
  const getSecurityLogColor = useCallback((severity: string): string => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      case 'INFO': return 'success';
      default: return 'default';
    }
  }, []);

  return {
    sessionInfo,
    securityLogs,
    isLoading,
    error,
    getSessionInfo,
    updateActivity,
    terminateSession,
    getSecurityLogs,
    formatDuration,
    getSessionStatusColor,
    getSecurityLogColor
  };
};