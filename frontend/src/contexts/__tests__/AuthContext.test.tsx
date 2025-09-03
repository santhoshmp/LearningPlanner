import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../../services/api';
import { SessionManager } from '../../utils/sessionManager';
import '@testing-library/jest-dom';

// Mock the API service
jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
    childLogin: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Mock SessionManager
jest.mock('../../utils/sessionManager', () => ({
  SessionManager: {
    saveSession: jest.fn(),
    loadSession: jest.fn(),
    clearSession: jest.fn(),
    isChildSession: jest.fn(),
    isParentSession: jest.fn(),
    getCurrentUserRole: jest.fn(),
    hasSession: jest.fn(),
    validateSession: jest.fn(),
    createSessionFromAuthResult: jest.fn(),
    repairSession: jest.fn(),
  },
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, isChild, login, childLogin, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="is-child">{isChild ? 'Child' : 'Not Child'}</div>
      <div data-testid="user-info">{user ? JSON.stringify(user) : 'No User'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>Login</button>
      <button onClick={() => childLogin('username', '1234')}>Child Login</button>
      <button onClick={() => register({ email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User' })}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

const renderAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  const mockSessionManager = SessionManager as jest.Mocked<typeof SessionManager>;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Reset SessionManager mocks
    mockSessionManager.loadSession.mockReturnValue(null);
    mockSessionManager.hasSession.mockReturnValue(false);
    mockSessionManager.isChildSession.mockReturnValue(false);
    mockSessionManager.getCurrentUserRole.mockReturnValue(null);
  });
  
  it('initializes with correct default values', async () => {
    // Mock localStorage.getItem to return null (no tokens)
    window.localStorage.getItem.mockReturnValue(null);
    
    renderAuthProvider();
    
    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    
    // After initialization completes
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('is-child')).toHaveTextContent('Not Child');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
  });
  
  it('handles parent login successfully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PARENT',
    };
    
    const mockAuthResult = {
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 900,
    };
    
    // Mock successful login
    (authApi.login as jest.Mock).mockResolvedValue(mockAuthResult);
    
    renderAuthProvider();
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    await act(async () => {
      screen.getByText('Login').click();
    });
    
    // Check that login was called with correct credentials
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    
    // Check that tokens were stored in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    
    // Check that user state was updated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('is-child')).toHaveTextContent('Not Child');
      expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockUser));
    });
  });
  
  it('handles child login successfully', async () => {
    const mockChild = {
      id: 'child-123',
      name: 'Test Child',
      username: 'testchild',
      role: 'CHILD',
    };
    
    const mockAuthResult = {
      user: mockChild,
      accessToken: 'child-access-token',
      refreshToken: 'child-refresh-token',
      expiresIn: 900,
    };
    
    // Mock successful child login
    (authApi.childLogin as jest.Mock).mockResolvedValue(mockAuthResult);
    
    renderAuthProvider();
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
    
    // Click child login button
    await act(async () => {
      screen.getByText('Child Login').click();
    });
    
    // Check that childLogin was called with correct credentials
    expect(authApi.childLogin).toHaveBeenCalledWith('username', '1234');
    
    // Check that tokens were stored in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'child-access-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'child-refresh-token');
    
    // Check that user state was updated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('is-child')).toHaveTextContent('Child');
      expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockChild));
    });
  });
  
  it('handles logout correctly', async () => {
    // Setup initial authenticated state
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PARENT',
    };
    
    // Mock successful logout
    (authApi.logout as jest.Mock).mockResolvedValue({ message: 'Logged out successfully' });
    
    // Render with authenticated state
    renderAuthProvider();
    
    // Set authenticated state manually
    await act(async () => {
      const { useAuth } = require('../AuthContext');
      const { setUser } = useAuth();
      setUser(mockUser);
    });
    
    // Click logout button
    await act(async () => {
      screen.getByText('Logout').click();
    });
    
    // Check that logout API was called
    expect(authApi.logout).toHaveBeenCalled();
    
    // Check that tokens were removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    
    // Check that user state was cleared
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
  });
  
  it('refreshes authentication on mount when refresh token exists', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PARENT',
    };
    
    const mockAuthResult = {
      user: mockUser,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 900,
    };
    
    // Mock localStorage.getItem to return a refresh token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'refreshToken') return 'existing-refresh-token';
      return null;
    });
    
    // Mock successful token refresh
    (authApi.refreshToken as jest.Mock).mockResolvedValue(mockAuthResult);
    
    renderAuthProvider();
    
    // Check that refreshToken was called with the token from localStorage
    expect(authApi.refreshToken).toHaveBeenCalledWith('existing-refresh-token');
    
    // Check that new tokens were stored in localStorage
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });
    
    // Check that user state was updated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockUser));
    });
  });
  
  it('handles refresh token failure correctly', async () => {
    // Mock localStorage.getItem to return a refresh token
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'refreshToken') return 'invalid-refresh-token';
      return null;
    });
    
    // Mock failed token refresh
    (authApi.refreshToken as jest.Mock).mockRejectedValue(new Error('Invalid refresh token'));
    
    renderAuthProvider();
    
    // Check that refreshToken was called
    expect(authApi.refreshToken).toHaveBeenCalledWith('invalid-refresh-token');
    
    // Check that tokens were removed from localStorage
    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
    
    // Check that user state remains unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('No User');
    });
  });

  describe('Child User Handling', () => {
    it('properly detects child users from session data', async () => {
      const mockChildSession = {
        user: {
          id: 'child-123',
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD',
          parentId: 'parent-123',
          age: 8,
          grade: '3rd'
        },
        userRole: 'child' as const,
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        loginTime: new Date().toISOString(),
        sessionId: 'session-123'
      };

      mockSessionManager.loadSession.mockReturnValue(mockChildSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.isChildSession.mockReturnValue(true);
      mockSessionManager.getCurrentUserRole.mockReturnValue('child');

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('is-child')).toHaveTextContent('Child');
        expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockChildSession.user));
      });
    });

    it('handles child login with session creation', async () => {
      const mockChild = {
        id: 'child-123',
        username: 'testchild',
        name: 'Test Child',
        role: 'CHILD',
        parentId: 'parent-123',
        age: 8,
        grade: '3rd'
      };

      const mockAuthResult = {
        user: mockChild,
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        sessionId: 'session-123',
        expiresIn: 1200
      };

      const mockSessionData = {
        user: mockChild,
        userRole: 'child' as const,
        accessToken: 'child-access-token',
        refreshToken: 'child-refresh-token',
        loginTime: new Date().toISOString(),
        sessionId: 'session-123'
      };

      (authApi.childLogin as jest.Mock).mockResolvedValue(mockAuthResult);
      mockSessionManager.createSessionFromAuthResult.mockReturnValue(mockSessionData);

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      await act(async () => {
        screen.getByText('Child Login').click();
      });

      expect(authApi.childLogin).toHaveBeenCalledWith('username', '1234');
      expect(mockSessionManager.createSessionFromAuthResult).toHaveBeenCalledWith(
        mockAuthResult,
        'session-123'
      );
      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(mockSessionData);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('is-child')).toHaveTextContent('Child');
      });
    });

    it('handles child token refresh correctly', async () => {
      const mockChildSession = {
        user: {
          id: 'child-123',
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD'
        },
        userRole: 'child' as const,
        accessToken: 'old-child-token',
        refreshToken: 'child-refresh-token',
        loginTime: new Date().toISOString(),
        sessionId: 'session-123'
      };

      const mockRefreshResult = {
        user: mockChildSession.user,
        accessToken: 'new-child-token',
        refreshToken: 'new-child-refresh-token',
        sessionId: 'session-123',
        expiresIn: 1200
      };

      mockSessionManager.loadSession.mockReturnValue(mockChildSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      (authApi.refreshToken as jest.Mock).mockResolvedValue(mockRefreshResult);

      renderAuthProvider();

      expect(authApi.refreshToken).toHaveBeenCalledWith('child-refresh-token');

      await waitFor(() => {
        expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
          expect.objectContaining({
            user: mockChildSession.user,
            userRole: 'child',
            accessToken: 'new-child-token',
            refreshToken: 'new-child-refresh-token',
            sessionId: 'session-123'
          })
        );
      });
    });

    it('redirects child users to child login on refresh failure', async () => {
      const mockChildSession = {
        user: { id: 'child-123', role: 'CHILD' },
        userRole: 'child' as const,
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token',
        loginTime: new Date().toISOString()
      };

      mockSessionManager.loadSession.mockReturnValue(mockChildSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.getCurrentUserRole.mockReturnValue('child');
      (authApi.refreshToken as jest.Mock).mockRejectedValue(new Error('Token expired'));

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      renderAuthProvider();

      await waitFor(() => {
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
        expect(window.location.href).toBe('/child-login');
      });
    });

    it('handles corrupted child session data', async () => {
      const corruptedSession = {
        user: { id: 'child-123' }, // Missing required fields
        userRole: 'child' as const,
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: new Date().toISOString()
      };

      mockSessionManager.loadSession.mockReturnValue(corruptedSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.validateSession.mockReturnValue({
        isValid: false,
        errors: ['Missing user role'],
        data: undefined
      });
      mockSessionManager.repairSession.mockReturnValue(false);

      renderAuthProvider();

      await waitFor(() => {
        expect(mockSessionManager.repairSession).toHaveBeenCalled();
        expect(mockSessionManager.clearSession).toHaveBeenCalled();
      });
    });

    it('successfully repairs minor session corruption', async () => {
      const corruptedSession = {
        user: { id: 'child-123', role: 'CHILD', username: 'testchild' },
        userRole: null as any, // Missing userRole
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: new Date().toISOString()
      };

      const repairedSession = {
        ...corruptedSession,
        userRole: 'child' as const
      };

      mockSessionManager.loadSession.mockReturnValue(corruptedSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.validateSession.mockReturnValue({
        isValid: false,
        errors: ['Missing userRole'],
        data: undefined
      });
      mockSessionManager.repairSession.mockReturnValue(true);

      renderAuthProvider();

      await waitFor(() => {
        expect(mockSessionManager.repairSession).toHaveBeenCalled();
        expect(mockSessionManager.clearSession).not.toHaveBeenCalled();
      });
    });

    it('handles child logout with session cleanup', async () => {
      const mockChild = {
        id: 'child-123',
        username: 'testchild',
        role: 'CHILD'
      };

      (authApi.logout as jest.Mock).mockResolvedValue({ message: 'Logged out successfully' });

      renderAuthProvider();

      // Set authenticated child state
      await act(async () => {
        const { useAuth } = require('../AuthContext');
        const context = useAuth();
        context.setUser(mockChild);
      });

      await act(async () => {
        screen.getByText('Logout').click();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(mockSessionManager.clearSession).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('is-child')).toHaveTextContent('Not Child');
      });
    });

    it('prevents authentication loops for child users', async () => {
      let refreshCallCount = 0;
      
      mockSessionManager.loadSession.mockReturnValue({
        user: { id: 'child-123', role: 'CHILD' },
        userRole: 'child' as const,
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: new Date().toISOString()
      });
      
      (authApi.refreshToken as jest.Mock).mockImplementation(() => {
        refreshCallCount++;
        if (refreshCallCount > 2) {
          throw new Error('Too many refresh attempts');
        }
        return Promise.reject(new Error('Token expired'));
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderAuthProvider();

      await waitFor(() => {
        expect(refreshCallCount).toBeLessThanOrEqual(2);
        expect(window.location.href).toBe('/child-login');
      });
    });
  });

  describe('Session Persistence', () => {
    it('restores child session on page refresh', async () => {
      const mockChildSession = {
        user: {
          id: 'child-123',
          username: 'testchild',
          name: 'Test Child',
          role: 'CHILD'
        },
        userRole: 'child' as const,
        accessToken: 'child-token',
        refreshToken: 'child-refresh-token',
        loginTime: new Date().toISOString(),
        sessionId: 'session-123'
      };

      mockSessionManager.loadSession.mockReturnValue(mockChildSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.validateSession.mockReturnValue({
        isValid: true,
        errors: [],
        data: mockChildSession
      });

      renderAuthProvider();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
        expect(screen.getByTestId('is-child')).toHaveTextContent('Child');
        expect(screen.getByTestId('user-info')).toHaveTextContent(JSON.stringify(mockChildSession.user));
      });
    });

    it('handles session age validation for child users', async () => {
      const oldSession = {
        user: { id: 'child-123', role: 'CHILD' },
        userRole: 'child' as const,
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        loginTime: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 minutes ago
      };

      mockSessionManager.loadSession.mockReturnValue(oldSession);
      mockSessionManager.hasSession.mockReturnValue(true);
      mockSessionManager.validateSession.mockReturnValue({
        isValid: true,
        errors: [],
        data: oldSession
      });

      const mockRefreshResult = {
        user: oldSession.user,
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 1200
      };

      (authApi.refreshToken as jest.Mock).mockResolvedValue(mockRefreshResult);

      renderAuthProvider();

      expect(authApi.refreshToken).toHaveBeenCalledWith('refresh-token');

      await waitFor(() => {
        expect(mockSessionManager.saveSession).toHaveBeenCalled();
      });
    });
  });
});