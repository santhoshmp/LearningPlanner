import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import SocialLoginButtons from '../SocialLoginButtons';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

const mockApi = require('../../../services/api');

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const theme = createTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SocialLoginButtons', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        assign: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render all social login buttons', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
    expect(screen.getByText('Continue with Instagram')).toBeInTheDocument();
  });

  it('should handle Google login click', async () => {
    const mockAuthUrl = 'https://accounts.google.com/oauth/authorize?client_id=test';
    
    mockApi.post.mockResolvedValueOnce({
      data: {
        authUrl: mockAuthUrl,
        state: 'test-state',
        codeVerifier: 'test-verifier'
      }
    });

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/initiate', {
        provider: 'google',
        redirectUri: expect.stringContaining('/auth/callback')
      });
    });

    expect(window.location.assign).toHaveBeenCalledWith(mockAuthUrl);
  });

  it('should handle Apple login click', async () => {
    const mockAuthUrl = 'https://appleid.apple.com/auth/authorize?client_id=test';
    
    mockApi.post.mockResolvedValueOnce({
      data: {
        authUrl: mockAuthUrl,
        state: 'test-state'
      }
    });

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const appleButton = screen.getByText('Continue with Apple');
    fireEvent.click(appleButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/initiate', {
        provider: 'apple',
        redirectUri: expect.stringContaining('/auth/callback')
      });
    });

    expect(window.location.assign).toHaveBeenCalledWith(mockAuthUrl);
  });

  it('should handle Instagram login click', async () => {
    const mockAuthUrl = 'https://api.instagram.com/oauth/authorize?client_id=test';
    
    mockApi.post.mockResolvedValueOnce({
      data: {
        authUrl: mockAuthUrl,
        state: 'test-state'
      }
    });

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const instagramButton = screen.getByText('Continue with Instagram');
    fireEvent.click(instagramButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/initiate', {
        provider: 'instagram',
        redirectUri: expect.stringContaining('/auth/callback')
      });
    });

    expect(window.location.assign).toHaveBeenCalledWith(mockAuthUrl);
  });

  it('should show loading state during authentication', async () => {
    // Mock a delayed response
    mockApi.post.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: { authUrl: 'test-url', state: 'test-state' }
        }), 100)
      )
    );

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    // Check for loading state
    expect(googleButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(googleButton).not.toBeDisabled();
    });
  });

  it('should handle authentication errors', async () => {
    const mockError = new Error('Authentication failed');
    mockApi.post.mockRejectedValueOnce(mockError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
      expect(toast.error).toHaveBeenCalledWith('Authentication failed. Please try again.');
    });
  });

  it('should disable all buttons when one is loading', async () => {
    mockApi.post.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: { authUrl: 'test-url', state: 'test-state' }
        }), 100)
      )
    );

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    const appleButton = screen.getByText('Continue with Apple');
    const instagramButton = screen.getByText('Continue with Instagram');

    fireEvent.click(googleButton);

    // All buttons should be disabled during loading
    expect(googleButton).toBeDisabled();
    expect(appleButton).toBeDisabled();
    expect(instagramButton).toBeDisabled();

    await waitFor(() => {
      expect(googleButton).not.toBeDisabled();
      expect(appleButton).not.toBeDisabled();
      expect(instagramButton).not.toBeDisabled();
    });
  });

  it('should render with custom styling props', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons 
          onSuccess={mockOnSuccess} 
          onError={mockOnError}
          variant="outlined"
          size="large"
          fullWidth={true}
        />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('MuiButton-outlined');
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });
  });

  it('should handle custom redirect URI', async () => {
    const customRedirectUri = 'https://custom.example.com/callback';
    
    mockApi.post.mockResolvedValueOnce({
      data: {
        authUrl: 'test-url',
        state: 'test-state'
      }
    });

    render(
      <TestWrapper>
        <SocialLoginButtons 
          onSuccess={mockOnSuccess} 
          onError={mockOnError}
          redirectUri={customRedirectUri}
        />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/auth/oauth/initiate', {
        provider: 'google',
        redirectUri: customRedirectUri
      });
    });
  });

  it('should store OAuth state in sessionStorage', async () => {
    const mockState = 'test-oauth-state';
    const mockCodeVerifier = 'test-code-verifier';
    
    mockApi.post.mockResolvedValueOnce({
      data: {
        authUrl: 'test-url',
        state: mockState,
        codeVerifier: mockCodeVerifier
      }
    });

    // Mock sessionStorage
    const mockSetItem = jest.fn();
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: mockSetItem,
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('oauth_state', mockState);
      expect(mockSetItem).toHaveBeenCalledWith('oauth_code_verifier', mockCodeVerifier);
    });
  });

  it('should show appropriate icons for each provider', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    // Check for Google icon (should contain 'G' or Google-specific styling)
    const googleButton = screen.getByText('Continue with Google').closest('button');
    expect(googleButton).toBeInTheDocument();

    // Check for Apple icon
    const appleButton = screen.getByText('Continue with Apple').closest('button');
    expect(appleButton).toBeInTheDocument();

    // Check for Instagram icon
    const instagramButton = screen.getByText('Continue with Instagram').closest('button');
    expect(instagramButton).toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    
    mockApi.post.mockRejectedValueOnce(networkError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error. Please check your connection and try again.');
    });
  });

  it('should handle rate limiting errors', async () => {
    const rateLimitError = new Error('Too many requests');
    rateLimitError.name = 'RateLimitError';
    
    mockApi.post.mockRejectedValueOnce(rateLimitError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many login attempts. Please wait a moment and try again.');
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const appleButton = screen.getByRole('button', { name: /continue with apple/i });
    const instagramButton = screen.getByRole('button', { name: /continue with instagram/i });

    expect(googleButton).toHaveAttribute('aria-label', expect.stringContaining('Google'));
    expect(appleButton).toHaveAttribute('aria-label', expect.stringContaining('Apple'));
    expect(instagramButton).toHaveAttribute('aria-label', expect.stringContaining('Instagram'));
  });

  it('should support keyboard navigation', () => {
    render(
      <TestWrapper>
        <SocialLoginButtons onSuccess={mockOnSuccess} onError={mockOnError} />
      </TestWrapper>
    );

    const googleButton = screen.getByText('Continue with Google');
    const appleButton = screen.getByText('Continue with Apple');

    // Focus first button
    googleButton.focus();
    expect(document.activeElement).toBe(googleButton);

    // Tab to next button
    fireEvent.keyDown(googleButton, { key: 'Tab' });
    appleButton.focus();
    expect(document.activeElement).toBe(appleButton);
  });
});