import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChildSessionManager } from '../ChildSessionManager';
import { useAuth } from '../../../contexts/AuthContext';
import { useSecureLogout } from '../../../utils/secureLogout';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../utils/secureLogout');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSecureLogout = useSecureLogout as jest.MockedFunction<typeof useSecureLogout>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock timers
jest.useFakeTimers();

describe('ChildSessionManager', () => {
  const mockPerformLogout = jest.fn();
  const mockCheckLogoutStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    mockUseSecureLogout.mockReturnValue({
      performLogout: mockPerformLogout,
      emergencyLogout: jest.fn(),
      checkLogoutStatus: mockCheckLogoutStatus
    });

    // Mock successful session check by default
    mockCheckLogoutStatus.mockResolvedValue({ shouldLogout: false });
    
    // Mock successful session validation
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'session123',
        loginTime: new Date().toISOString(),
        suspiciousActivity: null
      })
    } as Response);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render children for non-child users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', role: 'parent', email: 'parent@test.com' },
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildSessionManager>
        <div>Content</div>
      </ChildSessionManager>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should start session monitoring for child users', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildSessionManager sessionTimeout={20} activityCheckInterval={30}>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();

    // Fast-forward to trigger activity check
    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    await waitFor(() => {
      expect(mockCheckLogoutStatus).toHaveBeenCalled();
    });
  });

  it('should show session warning before timeout', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildSessionManager sessionTimeout={5} warningTime={2}>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Fast-forward to warning time (3 minutes = 5 - 2)
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Ending Soon!')).toBeInTheDocument();
      expect(screen.getByText(/Your learning session will end in/)).toBeInTheDocument();
    });
  });

  it('should allow session extension', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    // Mock successful session extension
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Session extended successfully',
        newSessionId: 'session456',
        loginTime: new Date().toISOString()
      })
    } as Response);

    renderWithRouter(
      <ChildSessionManager sessionTimeout={5} warningTime={2}>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Ending Soon!')).toBeInTheDocument();
    });

    // Click extend session
    const extendButton = screen.getByText('Keep Learning! 📚');
    fireEvent.click(extendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/child/auth/extend-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer null',
          'Content-Type': 'application/json'
        }
      });
    });

    // Warning should disappear
    await waitFor(() => {
      expect(screen.queryByText('Session Ending Soon!')).not.toBeInTheDocument();
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

    renderWithRouter(
      <ChildSessionManager sessionTimeout={5} warningTime={2}>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Trigger warning
    act(() => {
      jest.advanceTimersByTime(3 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Session Ending Soon!')).toBeInTheDocument();
    });

    // Let countdown expire
    act(() => {
      jest.advanceTimersByTime(2 * 60 * 1000);
    });

    await waitFor(() => {
      expect(mockPerformLogout).toHaveBeenCalledWith({
        reason: 'session_timeout',
        redirectTo: '/child/login'
      });
    });
  });

  it('should handle suspicious activity logout', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    // Mock logout check returning suspicious activity
    mockCheckLogoutStatus.mockResolvedValueOnce({
      shouldLogout: true,
      reason: 'suspicious_activity'
    });

    renderWithRouter(
      <ChildSessionManager>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Trigger activity check
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockPerformLogout).toHaveBeenCalledWith({
        reason: 'suspicious_activity',
        redirectTo: '/child/login'
      });
    });
  });

  it('should track user activity', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildSessionManager>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Simulate user activity
    fireEvent.mouseDown(document);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/child/auth/activity', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer null',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: expect.any(String),
          page: '/',
          action: 'user_activity'
        })
      });
    });
  });

  it('should handle page visibility changes', async () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    renderWithRouter(
      <ChildSessionManager>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Simulate page becoming hidden
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: true
    });

    fireEvent(document, new Event('visibilitychange'));

    // Simulate page becoming visible again
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false
    });

    fireEvent(document, new Event('visibilitychange'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/child/auth/activity', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer null',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: expect.any(String),
          page: '/',
          action: 'user_activity'
        })
      });
    });
  });

  it('should send beacon on page unload', () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    // Mock sendBeacon
    const mockSendBeacon = jest.fn();
    Object.defineProperty(navigator, 'sendBeacon', {
      writable: true,
      value: mockSendBeacon
    });

    renderWithRouter(
      <ChildSessionManager>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Simulate page unload
    fireEvent(window, new Event('beforeunload'));

    expect(mockSendBeacon).toHaveBeenCalledWith(
      '/api/child/auth/session-end',
      expect.stringContaining('"timestamp"')
    );
  });

  it('should cleanup timers on unmount', () => {
    const mockUser = { id: 'child1', role: 'child', username: 'testchild' };
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn()
    });

    const { unmount } = renderWithRouter(
      <ChildSessionManager>
        <div>Child Content</div>
      </ChildSessionManager>
    );

    // Verify timers are running
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();

    // Timers should be cleaned up
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });
});