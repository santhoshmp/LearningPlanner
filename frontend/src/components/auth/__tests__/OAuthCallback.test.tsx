import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import OAuthCallback from '../OAuthCallback';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
}));

// Mock the auth context
const mockUseAuth = {
  login: jest.fn(),
  user: null,
  isLoading: false,
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

const mockApi = require('../../../services/api');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/auth/callback?code=test-code&state=test-state'] 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('OAuthCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/auth/callback?code=test-code&state=test-state',
        search: '?code=test-code&state=test-state',
        assign: jest.fn(),
        replace: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Completing authentication...')).toBeInTheDocument();
  });

  it('should handle successful OAuth callback', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    // Mock sessionStorage values
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state') // oauth_state
      .mockReturnValueOnce('test-code-verifier'); // oauth_code_verifier

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: mockUser,
        tokens: mockTokens,
        isNewUser: false,
        linkedAccount: false,
      }
    });

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/callback', {
        code: 'test-code',
        state: 'test-state',
        codeVerifier: 'test-code-verifier',
        provider: 'google', // Default provider
      });
    });

    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalledWith(mockUser, mockTokens);
      expect(toast.success).toHaveBeenCalledWith('Successfully signed in!');
    });

    expect(screen.getByText('Authentication successful!')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to dashboard...')).toBeInTheDocument();
  });

  it('should handle new user registration', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
    };

    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: mockUser,
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isNewUser: true,
        linkedAccount: false,
      }
    });

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Welcome! Your account has been created successfully.');
    });

    expect(screen.getByText('Welcome to the platform!')).toBeInTheDocument();
  });

  it('should handle account linking', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'existing@example.com',
      firstName: 'Existing',
      lastName: 'User',
    };

    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: mockUser,
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isNewUser: false,
        linkedAccount: true,
        conflictResolution: 'linked_to_existing_email',
      }
    });

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account linked successfully!');
    });

    expect(screen.getByText('Account linked!')).toBeInTheDocument();
  });

  it('should handle state mismatch error', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('different-state') // Mismatched state
      .mockReturnValueOnce('test-code-verifier');

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Authentication failed: Invalid state parameter');
    });

    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid authentication state. Please try again.')).toBeInTheDocument();
  });

  it('should handle missing authorization code', async () => {
    const toast = require('react-hot-toast');

    render(
      <TestWrapper initialEntries={['/auth/callback?state=test-state']}>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Authentication failed: Missing authorization code');
    });

    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
  });

  it('should handle OAuth error responses', async () => {
    const toast = require('react-hot-toast');

    render(
      <TestWrapper initialEntries={['/auth/callback?error=access_denied&error_description=User denied access']}>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Authentication cancelled: User denied access');
    });

    expect(screen.getByText('Authentication cancelled')).toBeInTheDocument();
    expect(screen.getByText('User denied access')).toBeInTheDocument();
  });

  it('should handle API errors during callback', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    const apiError = new Error('Invalid authorization code');
    mockApi.post.mockRejectedValueOnce(apiError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Authentication failed: Invalid authorization code');
    });

    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
  });

  it('should detect provider from URL parameters', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123' },
        tokens: { accessToken: 'token' },
        isNewUser: false,
      }
    });

    render(
      <TestWrapper initialEntries={['/auth/callback?code=test-code&state=test-state&provider=apple']}>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/callback', {
        code: 'test-code',
        state: 'test-state',
        codeVerifier: 'test-code-verifier',
        provider: 'apple',
      });
    });
  });

  it('should clean up session storage after successful authentication', async () => {
    const mockRemoveItem = jest.fn();
    window.sessionStorage.removeItem = mockRemoveItem;
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123' },
        tokens: { accessToken: 'token' },
        isNewUser: false,
      }
    });

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockRemoveItem).toHaveBeenCalledWith('oauth_state');
      expect(mockRemoveItem).toHaveBeenCalledWith('oauth_code_verifier');
      expect(mockRemoveItem).toHaveBeenCalledWith('oauth_provider');
    });
  });

  it('should handle account conflict scenarios', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    const conflictError = new Error('Account conflict detected');
    conflictError.name = 'AccountConflictError';
    
    mockApi.post.mockRejectedValueOnce(conflictError);

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Conflict')).toBeInTheDocument();
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    });

    // Should show conflict resolution options
    expect(screen.getByText('Link Accounts')).toBeInTheDocument();
    expect(screen.getByText('Use Different Account')).toBeInTheDocument();
  });

  it('should redirect to appropriate page after authentication', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier')
      .mockReturnValueOnce('/dashboard/analytics'); // redirect_after_auth

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', role: 'PARENT' },
        tokens: { accessToken: 'token' },
        isNewUser: false,
      }
    });

    const mockReplace = jest.fn();
    window.location.replace = mockReplace;

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/analytics');
    });
  });

  it('should handle different user roles appropriately', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123', role: 'CHILD' },
        tokens: { accessToken: 'token' },
        isNewUser: false,
      }
    });

    const mockReplace = jest.fn();
    window.location.replace = mockReplace;

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/child/dashboard');
    });
  });

  it('should show retry option on authentication failure', async () => {
    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state')
      .mockReturnValueOnce('test-code-verifier');

    mockApi.post.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });

  it('should be accessible with proper ARIA labels', async () => {
    render(
      <TestWrapper>
        <OAuthCallback />
      </TestWrapper>
    );

    // Loading state should have proper accessibility
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Authenticating');
    expect(screen.getByText('Completing authentication...')).toHaveAttribute('aria-live', 'polite');
  });

  it('should handle Apple-specific form post callback', async () => {
    // Mock form data for Apple's form_post response mode
    const mockFormData = new FormData();
    mockFormData.append('code', 'apple-auth-code');
    mockFormData.append('state', 'test-state');

    window.sessionStorage.getItem = jest.fn()
      .mockReturnValueOnce('test-state');

    mockApi.post.mockResolvedValueOnce({
      data: {
        user: { id: 'user-123' },
        tokens: { accessToken: 'token' },
        isNewUser: false,
      }
    });

    render(
      <TestWrapper initialEntries={['/auth/callback']}>
        <OAuthCallback formData={mockFormData} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/callback', {
        code: 'apple-auth-code',
        state: 'test-state',
        provider: 'apple',
      });
    });
  });
});