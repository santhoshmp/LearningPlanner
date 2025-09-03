import { renderHook, act } from '@testing-library/react';
import { useChildErrorHandler } from '../useChildErrorHandler';
import { AuthContext } from '../../contexts/AuthContext';
import React from 'react';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'user-123', email: 'parent@example.com' },
  currentChild: { id: 'child-123', name: 'Test Child', age: 10 },
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuthContext}>
    {children}
  </AuthContext.Provider>
);

describe('useChildErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '', reload: jest.fn() } as any;
  });

  it('should initialize with no error', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    expect(result.current.currentError).toBeNull();
    expect(result.current.isErrorVisible).toBe(false);
  });

  it('should show authentication error for child', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Authentication failed');
      error.name = 'AuthenticationError';
      result.current.showError(error);
    });

    expect(result.current.currentError).not.toBeNull();
    expect(result.current.currentError?.title).toBe('Login Problem 🔑');
    expect(result.current.currentError?.severity).toBe('error');
    expect(result.current.currentError?.parentNotification).toBe(true);
    expect(result.current.isErrorVisible).toBe(true);
  });

  it('should show network error with appropriate recovery options', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Network connection failed');
      error.name = 'NetworkError';
      result.current.showError(error);
    });

    expect(result.current.currentError?.title).toBe('Connection Problem 🌐');
    expect(result.current.currentError?.severity).toBe('warning');
    expect(result.current.currentError?.recoveryOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'retry_connection' })
      ])
    );
  });

  it('should show activity error for middle age group', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Activity loading failed');
      error.name = 'ActivityError';
      result.current.showError(error);
    });

    expect(result.current.currentError?.title).toBe('Activity Problem 🎯');
    expect(result.current.currentError?.message).toContain('Something went wrong with this activity');
    expect(result.current.currentError?.icon).toBe('🎯');
  });

  it('should show progress error with save retry option', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Failed to save progress');
      error.name = 'ProgressError';
      result.current.showError(error);
    });

    expect(result.current.currentError?.title).toBe('Progress Save Issue 💾');
    expect(result.current.currentError?.severity).toBe('warning');
    expect(result.current.currentError?.recoveryOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'retry_save' })
      ])
    );
  });

  it('should show badge error with info severity', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Badge system unavailable');
      error.name = 'BadgeError';
      result.current.showError(error);
    });

    expect(result.current.currentError?.title).toBe('Badge System Busy 🏅');
    expect(result.current.currentError?.severity).toBe('info');
    expect(result.current.currentError?.parentNotification).toBe(false);
  });

  it('should dismiss error correctly', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Test error');
      result.current.showError(error);
    });

    expect(result.current.isErrorVisible).toBe(true);

    act(() => {
      result.current.dismissError();
    });

    expect(result.current.isErrorVisible).toBe(false);
  });

  it('should handle retry login action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('retry_login');
    });

    expect(window.location.href).toBe('/child/login');
  });

  it('should handle retry connection action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('retry_connection');
    });

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should handle select different activity action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('select_different_activity');
    });

    expect(window.location.href).toBe('/child/dashboard');
  });

  it('should handle continue learning action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    // First show an error
    act(() => {
      const error = new Error('Test error');
      result.current.showError(error);
    });

    expect(result.current.isErrorVisible).toBe(true);

    // Then handle continue learning action
    act(() => {
      result.current.handleErrorAction('continue_learning');
    });

    expect(result.current.isErrorVisible).toBe(false);
  });

  it('should handle request help action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('request_help');
    });

    expect(console.log).toHaveBeenCalledWith('Help requested');
  });

  it('should handle notify parent action', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('notify_parent');
    });

    expect(console.log).toHaveBeenCalledWith('Parent notification requested');
  });

  it('should handle unknown action gracefully', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      result.current.handleErrorAction('unknown_action');
    });

    expect(console.log).toHaveBeenCalledWith('Unknown error action:', 'unknown_action');
  });

  it('should use context child age when available', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Test error');
      result.current.showError(error, { childAge: 7 });
    });

    // Should use the child age from context (10) not the provided age (7)
    expect(result.current.currentError?.message).toContain('Something went wrong with this activity');
  });

  it('should use provided context when child not in auth context', () => {
    const noChildWrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ ...mockAuthContext, currentChild: null }}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useChildErrorHandler(), { wrapper: noChildWrapper });

    act(() => {
      const error = new Error('Test error');
      result.current.showError(error, { childAge: 7, childId: 'child-456' });
    });

    expect(result.current.currentError).not.toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Child Error:',
      expect.objectContaining({
        childId: 'child-456',
        childAge: 7
      })
    );
  });

  it('should log error with proper context', () => {
    const { result } = renderHook(() => useChildErrorHandler(), { wrapper });

    act(() => {
      const error = new Error('Test error for logging');
      result.current.showError(error, {
        activityId: 'activity-123',
        sessionId: 'session-456'
      });
    });

    expect(console.error).toHaveBeenCalledWith(
      'Child Error:',
      expect.objectContaining({
        childId: 'child-123',
        childAge: 10,
        error: expect.objectContaining({
          name: 'Error',
          message: 'Test error for logging'
        }),
        context: expect.objectContaining({
          activityId: 'activity-123',
          sessionId: 'session-456',
          childId: 'child-123',
          childAge: 10
        })
      })
    );
  });
});