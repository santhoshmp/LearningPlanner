import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthResult, LoginCredentials, RegisterData } from '../types/auth';
import { authApi } from '../services/api';
import { SessionManager, UserRole } from '../utils/sessionManager';
import { ChildAuthErrorHandler, AuthError } from '../utils/childErrorHandler';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isChild: boolean;
  userRole: UserRole | null;
  lastError: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  childLogin: (username: string, pin: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  handleAuthError: (error: any) => AuthError;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<AuthError | null>(null);

  const isAuthenticated = !!user && !!userRole;
  const isChild = userRole === 'child' || user?.role === 'CHILD';

  const clearError = () => {
    setLastError(null);
  };

  const handleAuthError = (error: any): AuthError => {
    const authError = ChildAuthErrorHandler.handleAuthenticationError(error, {
      onRetry: () => {
        clearError();
        refreshAuth();
      },
      onLogout: () => {
        clearError();
        logout();
      },
      onContactHelp: () => {
        const helpMessage = isChild
          ? 'Please ask a grown-up to help you! 👨‍👩‍👧‍👦'
          : 'Please contact support for assistance.';
        toast.error(helpMessage);
      },
      onGoHome: () => {
        clearError();
        window.location.href = '/';
      }
    });

    setLastError(authError);
    return authError;
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      clearError();
      console.log('Attempting parent login with:', { email: credentials.email });

      const result: AuthResult = await ChildAuthErrorHandler.withNetworkRetry(
        () => authApi.login(credentials)
      );
      console.log('Parent login successful, result:', result);

      // Create and save session using SessionManager
      const sessionData = SessionManager.createSessionFromAuthResult(result);
      SessionManager.saveSession(sessionData);

      setUser(result.user);
      setUserRole(sessionData.userRole);
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Parent login error:', error);
      const authError = handleAuthError(error);

      // Show child-friendly or parent-appropriate error message
      const errorMessage = authError.userFriendlyMessage;
      toast.error(errorMessage);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Registering user:', { email: data.email });
      const result = await authApi.register(data);
      console.log('Registration successful:', result);
      toast.success('Registration successful!');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear session using SessionManager
      SessionManager.clearSession();
      setUser(null);
      setUserRole(null);
      toast.success('Logged out successfully');
    }
  };

  const refreshAuth = async () => {
    try {
      setIsLoading(true);
      clearError();
      console.log('Starting authentication refresh...');

      // Check for authentication loops
      if (ChildAuthErrorHandler.isLoopDetected()) {
        console.warn('Authentication loop detected during refresh, breaking loop');
        ChildAuthErrorHandler.resetLoopDetection();
        ChildAuthErrorHandler.cleanCorruptedSession();
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Check for session corruption - but only if there's partial data (real corruption)
      console.log('🔧 refreshAuth: Checking for session corruption...');
      const corruptionIssues = ChildAuthErrorHandler.getSessionCorruptionIssues();
      console.log('🔧 refreshAuth: Corruption check result:', corruptionIssues);

      // Check if localStorage is completely empty (normal for new users)
      const hasAnySessionData = localStorage.getItem('accessToken') ||
        localStorage.getItem('refreshToken') ||
        localStorage.getItem('user') ||
        localStorage.getItem('userRole');

      if (corruptionIssues.length > 0 && hasAnySessionData) {
        console.warn('🔧 Session corruption detected (partial data found):', corruptionIssues);
        console.log('🔧 Current localStorage state:', {
          accessToken: localStorage.getItem('accessToken'),
          refreshToken: localStorage.getItem('refreshToken'),
          user: localStorage.getItem('user'),
          userRole: localStorage.getItem('userRole')
        });
        ChildAuthErrorHandler.cleanCorruptedSession();
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      } else if (corruptionIssues.length > 0 && !hasAnySessionData) {
        console.log('🔧 Empty localStorage detected (normal for new users) - skipping corruption cleanup');
      }

      // Try to repair corrupted session first
      if (SessionManager.hasSession() && !SessionManager.repairSession()) {
        console.warn('Session repair failed, clearing corrupted session');
        SessionManager.clearSession();
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Load session from storage
      const sessionData = SessionManager.loadSession();
      if (!sessionData) {
        console.log('No session found in storage');
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      // Validate session data using enhanced validation
      if (!ChildAuthErrorHandler.validateSession(sessionData)) {
        console.error('Invalid session data detected');
        ChildAuthErrorHandler.cleanCorruptedSession();
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const validation = SessionManager.validateSession(sessionData);
      if (!validation.isValid) {
        console.error('Session validation failed:', validation.errors);
        SessionManager.clearSession();
        setUser(null);
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      console.log('Session loaded from storage:', {
        userId: sessionData.user.id,
        role: sessionData.userRole,
        hasRefreshToken: !!sessionData.refreshToken
      });

      // For child users, we can load directly from storage without refresh
      // This is because child sessions are managed differently
      if (sessionData.userRole === 'child') {
        setUser(sessionData.user);
        setUserRole(sessionData.userRole);
        console.log('Child session restored from storage');
        setIsLoading(false);
        return;
      }

      // For parent users, try to refresh the token if we have a refresh token
      if (sessionData.refreshToken) {
        try {
          console.log('Attempting token refresh for parent user...');
          const result: AuthResult = await ChildAuthErrorHandler.withNetworkRetry(
            () => authApi.refreshToken(sessionData.refreshToken!)
          );

          // Validate refresh result
          if (!ChildAuthErrorHandler.validateSession({
            user: result.user,
            userRole: result.user.role === 'CHILD' ? 'child' : 'parent',
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          })) {
            throw new Error('Invalid refresh token result');
          }

          // Update session with new tokens
          const updatedSessionData = SessionManager.createSessionFromAuthResult(result);
          SessionManager.saveSession(updatedSessionData);

          setUser(result.user);
          setUserRole(updatedSessionData.userRole);
          console.log('Parent authentication refreshed successfully');
        } catch (refreshError: any) {
          console.error('Token refresh failed:', refreshError);
          const authError = handleAuthError(refreshError);

          // Handle refresh failure based on error type
          if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
            // Definitive auth failure - clear session
            console.log('Authentication failed, clearing session');
            SessionManager.clearSession();
            setUser(null);
            setUserRole(null);
          } else if (authError.code === 'NETWORK_ERROR') {
            // Network error - keep existing session for offline capability
            console.log('Network error during refresh, keeping existing session');
            setUser(sessionData.user);
            setUserRole(sessionData.userRole);
          } else {
            // Other errors - clear session to be safe
            console.log('Unexpected error during refresh, clearing session');
            SessionManager.clearSession();
            setUser(null);
            setUserRole(null);
          }
        }
      } else {
        // No refresh token but we have session data - use it
        console.log('No refresh token, using stored session data');
        setUser(sessionData.user);
        setUserRole(sessionData.userRole);
      }
    } catch (error) {
      console.error('Error during authentication refresh:', error);
      const authError = handleAuthError(error);

      // On any unexpected error, clear session to prevent loops
      SessionManager.clearSession();
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    refreshAuth();
  }, []);

  const childLogin = async (username: string, pin: string) => {
    try {
      setIsLoading(true);
      clearError();
      console.log('Attempting child login with:', { username });

      // Always clean any existing session data before login to prevent interference
      console.log('Cleaning any existing session data before login...');
      ChildAuthErrorHandler.cleanCorruptedSession();
      
      // Check for authentication loops before attempting login
      if (ChildAuthErrorHandler.isLoopDetected()) {
        console.warn('Authentication loop detected, resetting');
        ChildAuthErrorHandler.resetLoopDetection();
      }

      const result: AuthResult = await ChildAuthErrorHandler.withNetworkRetry(
        () => authApi.childLogin(username, pin)
      );
      console.log('Child login successful, result:', result);

      // Validate the result before proceeding
      if (!ChildAuthErrorHandler.validateSession({
        user: result.user,
        userRole: result.user.role === 'CHILD' ? 'child' : 'parent',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      })) {
        throw new Error('Invalid authentication result received');
      }

      // Create and save session using SessionManager
      const sessionData = SessionManager.createSessionFromAuthResult(result);
      SessionManager.saveSession(sessionData);

      setUser(result.user);
      setUserRole(sessionData.userRole);

      // Reset loop detection on successful login
      ChildAuthErrorHandler.resetLoopDetection();

      toast.success('Welcome back!', {
        icon: '👋',
        style: {
          borderRadius: '10px',
          background: '#4ade80',
          color: '#fff',
        },
      });
    } catch (error: any) {
      console.error('Child login error:', error);
      const authError = handleAuthError(error);

      toast.error(authError.userFriendlyMessage, {
        icon: '😕',
        style: {
          borderRadius: '10px',
          background: '#f87171',
          color: '#fff',
        },
      });
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isChild,
    userRole,
    lastError,
    login,
    childLogin,
    register,
    logout,
    refreshAuth,
    clearError,
    handleAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};