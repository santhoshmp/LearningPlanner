import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/auth';
import { SessionManager, UserRole } from '../utils/sessionManager';

interface SimpleAuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isChild: boolean;
  logout: () => void;
  refreshAuth: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!userRole;
  const isChild = userRole === 'child' || user?.role === 'CHILD';

  const logout = () => {
    SessionManager.clearSession();
    setUser(null);
    setUserRole(null);
  };

  const refreshAuth = () => {
    try {
      setIsLoading(true);
      
      // Load session from storage
      const sessionData = SessionManager.loadSession();
      if (!sessionData) {
        console.log('No session found');
        setUser(null);
        setUserRole(null);
        return;
      }

      // Validate session
      const validation = SessionManager.validateSession(sessionData);
      if (!validation.isValid) {
        console.log('Invalid session:', validation.errors);
        SessionManager.clearSession();
        setUser(null);
        setUserRole(null);
        return;
      }

      // Set user and role
      setUser(sessionData.user);
      setUserRole(sessionData.userRole);
      console.log('Session restored:', {
        userId: sessionData.user.id,
        role: sessionData.userRole
      });
      
    } catch (error) {
      console.error('Auth refresh error:', error);
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

  const value: SimpleAuthContextType = {
    user,
    userRole,
    isLoading,
    isAuthenticated,
    isChild,
    logout,
    refreshAuth,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};