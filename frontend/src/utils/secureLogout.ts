import { useAuth } from '../contexts/AuthContext';

interface SecureLogoutOptions {
  reason?: 'user_initiated' | 'session_timeout' | 'suspicious_activity' | 'parent_request';
  showConfirmation?: boolean;
  redirectTo?: string;
  clearAllData?: boolean;
}

interface LogoutResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

export class SecureLogoutService {
  private static instance: SecureLogoutService;

  static getInstance(): SecureLogoutService {
    if (!SecureLogoutService.instance) {
      SecureLogoutService.instance = new SecureLogoutService();
    }
    return SecureLogoutService.instance;
  }

  async performSecureLogout(options: SecureLogoutOptions = {}): Promise<LogoutResult> {
    const {
      reason = 'user_initiated',
      showConfirmation = false,
      redirectTo = '/child/login',
      clearAllData = true
    } = options;

    try {
      // Show confirmation dialog if requested
      if (showConfirmation && reason === 'user_initiated') {
        const confirmed = await this.showLogoutConfirmation();
        if (!confirmed) {
          return {
            success: false,
            message: 'Logout cancelled by user'
          };
        }
      }

      // Get current session info before logout
      const sessionInfo = await this.getCurrentSessionInfo();

      // Call backend logout endpoint
      await this.callLogoutEndpoint(sessionInfo?.sessionId, reason);

      // Clear local storage and session data
      if (clearAllData) {
        this.clearLocalData();
      }

      // Clear any cached data
      this.clearCachedData();

      // Log the logout event
      this.logLogoutEvent(reason, sessionInfo);

      return {
        success: true,
        message: this.getLogoutMessage(reason),
        redirectUrl: redirectTo
      };

    } catch (error) {
      console.error('Secure logout failed:', error);
      
      // Even if backend call fails, clear local data for security
      if (clearAllData) {
        this.clearLocalData();
      }

      return {
        success: false,
        message: 'Logout completed with errors. Please log in again for security.'
      };
    }
  }

  private async showLogoutConfirmation(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <div class="text-center">
            <div class="text-4xl mb-4">👋</div>
            <h2 class="text-xl font-bold text-gray-800 mb-2">
              Ready to take a break?
            </h2>
            <p class="text-gray-600 mb-6">
              Are you sure you want to log out? Your progress has been saved!
            </p>
            <div class="flex gap-3 justify-center">
              <button id="confirm-logout" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Yes, Log Out 👋
              </button>
              <button id="cancel-logout" class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Keep Learning 📚
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const confirmBtn = modal.querySelector('#confirm-logout');
      const cancelBtn = modal.querySelector('#cancel-logout');

      const cleanup = () => {
        document.body.removeChild(modal);
      };

      confirmBtn?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      cancelBtn?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // Auto-cancel after 30 seconds
      setTimeout(() => {
        if (document.body.contains(modal)) {
          cleanup();
          resolve(false);
        }
      }, 30000);
    });
  }

  private async getCurrentSessionInfo() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/child/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get session info:', error);
    }
    return null;
  }

  private async callLogoutEndpoint(sessionId?: string, reason?: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/child/auth/session-end', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          reason,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to call logout endpoint:', error);
      // Don't throw - we still want to clear local data
    }
  }

  private clearLocalData() {
    // Clear authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Clear any cached user data
    localStorage.removeItem('user');
    localStorage.removeItem('childProfile');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear any child-specific cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('child_') || key.startsWith('progress_') || key.startsWith('badge_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private clearCachedData() {
    // Clear any React Query cache if available
    if (window.queryClient) {
      window.queryClient.clear();
    }

    // Clear any other cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('child') || name.includes('progress')) {
            caches.delete(name);
          }
        });
      });
    }
  }

  private logLogoutEvent(reason: string, sessionInfo: any) {
    try {
      // Send logout event using beacon API for reliability
      const logData = {
        event: 'child_logout',
        reason,
        timestamp: new Date().toISOString(),
        sessionId: sessionInfo?.sessionId,
        sessionDuration: sessionInfo ? 
          Math.floor((Date.now() - new Date(sessionInfo.loginTime).getTime()) / 1000) : 
          null,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/child/auth/logout-event', JSON.stringify(logData));
      }
    } catch (error) {
      console.error('Failed to log logout event:', error);
    }
  }

  private getLogoutMessage(reason: string): string {
    switch (reason) {
      case 'session_timeout':
        return 'Your learning session has ended. Great job today! 🌟';
      case 'suspicious_activity':
        return 'For your safety, please ask a parent to help you log in again.';
      case 'parent_request':
        return 'A parent has requested you to log out. Time for a break! 😊';
      case 'user_initiated':
      default:
        return 'You\'ve been logged out successfully. See you next time! 👋';
    }
  }

  // Emergency logout - clears everything immediately without backend calls
  emergencyLogout(): void {
    this.clearLocalData();
    this.clearCachedData();
    
    // Force redirect to login
    window.location.href = '/child/login';
  }

  // Check if user should be logged out (for security checks)
  async shouldForceLogout(): Promise<{ shouldLogout: boolean; reason?: string }> {
    try {
      const sessionInfo = await this.getCurrentSessionInfo();
      
      if (!sessionInfo) {
        return { shouldLogout: true, reason: 'no_session' };
      }

      // Check session duration
      const sessionStart = new Date(sessionInfo.loginTime);
      const sessionDurationMinutes = (Date.now() - sessionStart.getTime()) / (1000 * 60);
      
      if (sessionDurationMinutes > 20) {
        return { shouldLogout: true, reason: 'session_timeout' };
      }

      // Check for suspicious activity
      if (sessionInfo.suspiciousActivity) {
        return { shouldLogout: true, reason: 'suspicious_activity' };
      }

      return { shouldLogout: false };

    } catch (error) {
      console.error('Error checking logout status:', error);
      return { shouldLogout: true, reason: 'security_check_failed' };
    }
  }
}

// Export singleton instance
export const secureLogout = SecureLogoutService.getInstance();

// Hook for React components
export const useSecureLogout = () => {
  const { logout } = useAuth();

  const performLogout = async (options: SecureLogoutOptions = {}) => {
    const result = await secureLogout.performSecureLogout(options);
    
    if (result.success) {
      // Call the auth context logout to update React state
      logout();
      
      // Redirect if specified
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    }
    
    return result;
  };

  const emergencyLogout = () => {
    secureLogout.emergencyLogout();
    logout();
  };

  const checkLogoutStatus = () => {
    return secureLogout.shouldForceLogout();
  };

  return {
    performLogout,
    emergencyLogout,
    checkLogoutStatus
  };
};