import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChildAuthGuard } from '../ChildAuthGuard';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/child/dashboard' })
}));

describe('ChildAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    expect(screen.getByText('Checking your session...')).toBeInTheDocument();
  });

  it('should redirect to child login if not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    // Should redirect to child login
    expect(window.location.pathname).toBe('/');
  });

  it('should redirect to parent login if user is not a child', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'parent', email: 'parent@test.com' },
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    // Should redirect to parent login
    expect(window.location.pathname).toBe('/');
  });

  it('should validate session for authenticated child user', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    const mockSessionResponse = {
      sessionId: 'session123',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      deviceInfo: { userAgent: 'test', platform: 'test', isMobile: false },
      sessionDurationMinutes: 5,
      maxSessionMinutes: 20,
      timeRemainingMinutes: 15,
      suspiciousActivity: null
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionResponse
    } as Response);

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/child/auth/session', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer null',
        'Content-Type': 'application/json'
      }
    });
  });

  it('should handle session expiration', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    } as Response);

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Session Problem')).toBeInTheDocument();
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
  });

  it('should handle suspicious activity', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    const mockSessionResponse = {
      sessionId: 'session123',
      loginTime: new Date().toISOString(),
      suspiciousActivity: {
        detected: true,
        patterns: [{ type: 'unusual_hours', severity: 'medium' }],
        riskLevel: 'medium'
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionResponse
    } as Response);

    // Mock the suspicious activity report endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reported successfully' })
    } as Response);

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Session Problem')).toBeInTheDocument();
      expect(screen.getByText(/unusual activity/i)).toBeInTheDocument();
    });

    // Should have called the suspicious activity endpoint
    expect(mockFetch).toHaveBeenCalledWith('/api/child/security/suspicious-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        childId: 'child1',
        activityDetails: mockSessionResponse.suspiciousActivity,
        timestamp: expect.any(String),
        location: '/child/dashboard'
      })
    });
  });

  it('should handle session timeout', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    // Mock a session that's over the time limit
    const oldLoginTime = new Date(Date.now() - 25 * 60 * 1000); // 25 minutes ago
    const mockSessionResponse = {
      sessionId: 'session123',
      loginTime: oldLoginTime.toISOString(),
      sessionDurationMinutes: 25,
      maxSessionMinutes: 20,
      timeRemainingMinutes: -5
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionResponse
    } as Response);

    renderWithRouter(
      <ChildAuthGuard maxSessionDuration={20}>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Session Problem')).toBeInTheDocument();
      expect(screen.getByText(/session has ended/i)).toBeInTheDocument();
    });
  });

  it('should allow access with valid session', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    const mockSessionResponse = {
      sessionId: 'session123',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      deviceInfo: { userAgent: 'test', platform: 'test', isMobile: false },
      sessionDurationMinutes: 5,
      maxSessionMinutes: 20,
      timeRemainingMinutes: 15,
      suspiciousActivity: null
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionResponse
    } as Response);

    // Mock activity update endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Activity logged' })
    } as Response);

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    // Should have called activity update
    expect(mockFetch).toHaveBeenCalledWith('/api/child/auth/activity', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer null',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: expect.any(String),
        page: '/child/dashboard',
        action: 'page_view'
      })
    });
  });

  it('should handle network errors gracefully', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(
      <ChildAuthGuard>
        <div>Protected Content</div>
      </ChildAuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Session Problem')).toBeInTheDocument();
      expect(screen.getByText(/Unable to validate session/i)).toBeInTheDocument();
    });
  });
});