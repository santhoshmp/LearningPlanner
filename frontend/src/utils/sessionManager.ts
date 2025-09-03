/**
 * Session Management Utility
 * 
 * Provides standardized session storage and management for both parent and child users.
 * Handles consistent data structures, validation, and cleanup across the application.
 */

import { User } from '../types/auth';

export type UserRole = 'parent' | 'child';

export interface SessionData {
  user: User;
  userRole: UserRole;
  accessToken: string;
  refreshToken: string;
  loginTime: string;
  sessionId?: string; // For child sessions
}

export interface SessionValidationResult {
  isValid: boolean;
  errors: string[];
  data?: SessionData;
}

/**
 * Session Manager class for handling authentication session data
 */
export class SessionManager {
  private static readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    USER_ROLE: 'userRole',
    LOGIN_TIME: 'loginTime',
    SESSION_ID: 'sessionId'
  } as const;

  /**
   * Save session data to localStorage with consistent structure
   */
  static saveSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, sessionData.accessToken);
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, sessionData.refreshToken);
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(sessionData.user));
      localStorage.setItem(this.STORAGE_KEYS.USER_ROLE, sessionData.userRole);
      localStorage.setItem(this.STORAGE_KEYS.LOGIN_TIME, sessionData.loginTime);
      
      if (sessionData.sessionId) {
        localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionData.sessionId);
      }

      console.log('Session saved successfully:', {
        userId: sessionData.user.id,
        role: sessionData.userRole,
        hasSessionId: !!sessionData.sessionId
      });
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session data');
    }
  }

  /**
   * Load session data from localStorage with validation
   */
  static loadSession(): SessionData | null {
    try {
      const accessToken = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
      const userRole = localStorage.getItem(this.STORAGE_KEYS.USER_ROLE) as UserRole;
      const loginTime = localStorage.getItem(this.STORAGE_KEYS.LOGIN_TIME);
      const sessionId = localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);

      // Validate required fields
      if (!accessToken || !refreshToken || !userStr || !userRole) {
        console.log('Session load failed: missing required fields');
        return null;
      }

      let user: User;
      try {
        user = JSON.parse(userStr);
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError);
        return null;
      }

      // Validate user object structure
      if (!user.id || !user.role) {
        console.error('Invalid user data structure:', user);
        return null;
      }

      const sessionData: SessionData = {
        user,
        userRole,
        accessToken,
        refreshToken,
        loginTime: loginTime || new Date().toISOString(),
        sessionId: sessionId || undefined
      };

      console.log('Session loaded successfully:', {
        userId: user.id,
        role: userRole,
        hasSessionId: !!sessionId
      });

      return sessionData;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Validate session data integrity and consistency
   */
  static validateSession(sessionData: SessionData): SessionValidationResult {
    const errors: string[] = [];

    // Validate user data
    if (!sessionData.user?.id) {
      errors.push('Missing user ID');
    }

    if (!sessionData.user?.role) {
      errors.push('Missing user role');
    }

    // Validate role consistency
    const expectedRole = sessionData.user?.role === 'CHILD' ? 'child' : 'parent';
    if (sessionData.userRole !== expectedRole) {
      errors.push(`Role mismatch: userRole=${sessionData.userRole}, user.role=${sessionData.user?.role}`);
    }

    // Validate tokens
    if (!sessionData.accessToken) {
      errors.push('Missing access token');
    }

    if (!sessionData.refreshToken) {
      errors.push('Missing refresh token');
    }

    // Validate child-specific requirements
    if (sessionData.userRole === 'child') {
      if (!sessionData.user?.username && !sessionData.user?.name) {
        errors.push('Child user missing username or name');
      }
    }

    // Validate parent-specific requirements
    if (sessionData.userRole === 'parent') {
      if (!sessionData.user?.email) {
        errors.push('Parent user missing email');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? sessionData : undefined
    };
  }

  /**
   * Clear all session data from localStorage
   */
  static clearSession(): void {
    try {
      const keysToRemove = Object.values(this.STORAGE_KEYS);
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Check if current session is for a child user
   */
  static isChildSession(): boolean {
    const userRole = localStorage.getItem(this.STORAGE_KEYS.USER_ROLE);
    return userRole === 'child';
  }

  /**
   * Check if current session is for a parent user
   */
  static isParentSession(): boolean {
    const userRole = localStorage.getItem(this.STORAGE_KEYS.USER_ROLE);
    return userRole === 'parent';
  }

  /**
   * Get current user role from storage
   */
  static getCurrentUserRole(): UserRole | null {
    return localStorage.getItem(this.STORAGE_KEYS.USER_ROLE) as UserRole | null;
  }

  /**
   * Update tokens in existing session
   */
  static updateTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      console.log('Tokens updated successfully');
    } catch (error) {
      console.error('Failed to update tokens:', error);
      throw new Error('Failed to update session tokens');
    }
  }

  /**
   * Check if session exists in storage
   */
  static hasSession(): boolean {
    const accessToken = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    const user = localStorage.getItem(this.STORAGE_KEYS.USER);
    const userRole = localStorage.getItem(this.STORAGE_KEYS.USER_ROLE);
    
    return !!(accessToken && user && userRole);
  }

  /**
   * Get session age in milliseconds
   */
  static getSessionAge(): number {
    const loginTime = localStorage.getItem(this.STORAGE_KEYS.LOGIN_TIME);
    if (!loginTime) return 0;
    
    try {
      const loginDate = new Date(loginTime);
      return Date.now() - loginDate.getTime();
    } catch (error) {
      console.error('Failed to calculate session age:', error);
      return 0;
    }
  }

  /**
   * Create session data from authentication result
   */
  static createSessionFromAuthResult(
    authResult: { user: User; accessToken: string; refreshToken: string },
    sessionId?: string
  ): SessionData {
    const userRole: UserRole = authResult.user.role === 'CHILD' ? 'child' : 'parent';
    
    return {
      user: authResult.user,
      userRole,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      loginTime: new Date().toISOString(),
      sessionId
    };
  }

  /**
   * Detect and fix corrupted session data
   */
  static repairSession(): boolean {
    try {
      const sessionData = this.loadSession();
      if (!sessionData) return false;

      const validation = this.validateSession(sessionData);
      if (validation.isValid) return true;

      console.warn('Corrupted session detected, attempting repair:', validation.errors);

      // Try to repair common issues
      let repaired = false;

      // Fix role mismatch
      if (sessionData.user?.role && !sessionData.userRole) {
        sessionData.userRole = sessionData.user.role === 'CHILD' ? 'child' : 'parent';
        repaired = true;
      }

      // Fix missing login time
      if (!sessionData.loginTime) {
        sessionData.loginTime = new Date().toISOString();
        repaired = true;
      }

      if (repaired) {
        this.saveSession(sessionData);
        console.log('Session repaired successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to repair session:', error);
      return false;
    }
  }
}