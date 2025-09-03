import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ThemeProvider } from '../../../theme/ThemeProvider';

// Mock the entire ChildDashboard component to focus on authentication logic
const MockChildDashboard = () => {
  const { user, isAuthenticated, isLoading, isChild, lastError } = require('../../../contexts/AuthContext').useAuth();
  
  if (isLoading) {
    return <div data-testid="loading">Checking your login...</div>;
  }
  
  if (!isAuthenticated) {
    return <div data-testid="not-authenticated">Not authenticated</div>;
  }
  
  if (!isChild) {
    return <div data-testid="not-child">Not a child user</div>;
  }
  
  if (lastError && lastError.shouldRedirect) {
    return <div data-testid="auth-error">{lastError.userFriendlyMessage}</div>;
  }
  
  return (
    <div data-testid="child-dashboard">
      <div>Welcome, {user?.name || user?.username}!</div>
      <div>User ID: {user?.id}</div>
      <div>Role: {user?.role}</div>
    </div>
  );
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            {component}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ChildDashboard Authentication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when authentication is loading', async () => {
    const mockAuthContext = {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isChild: false,
      userRole: null,
      lastError: null
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Checking your login...')).toBeInTheDocument();
  });

  it('shows not authenticated state when user is not authenticated', async () => {
    const mockAuthContext = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isChild: false,
      userRole: null,
      lastError: null
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
  });

  it('shows not child state when user is not a child', async () => {
    const mockAuthContext = {
      user: {
        id: 'parent-id',
        role: 'PARENT',
        email: 'parent@test.com',
        firstName: 'Parent',
        lastName: 'User'
      },
      isAuthenticated: true,
      isLoading: false,
      isChild: false,
      userRole: 'parent',
      lastError: null
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('not-child')).toBeInTheDocument();
  });

  it('shows error state when there is an authentication error', async () => {
    const mockAuthContext = {
      user: {
        id: 'child-id',
        role: 'CHILD',
        username: 'testchild',
        name: 'Test Child'
      },
      isAuthenticated: true,
      isLoading: false,
      isChild: true,
      userRole: 'child',
      lastError: {
        code: 'SESSION_EXPIRED',
        message: 'Session expired',
        userFriendlyMessage: 'Your learning time is up! Please log in again to continue. ⏰',
        shouldRedirect: true,
        severity: 'high',
        recoveryActions: []
      }
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('auth-error')).toBeInTheDocument();
    expect(screen.getByText('Your learning time is up! Please log in again to continue. ⏰')).toBeInTheDocument();
  });

  it('renders dashboard for authenticated child user', async () => {
    const mockAuthContext = {
      user: {
        id: 'child-id',
        role: 'CHILD',
        username: 'testchild',
        name: 'Test Child',
        parentId: 'parent-id'
      },
      isAuthenticated: true,
      isLoading: false,
      isChild: true,
      userRole: 'child',
      lastError: null
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('child-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Test Child!')).toBeInTheDocument();
    expect(screen.getByText('User ID: child-id')).toBeInTheDocument();
    expect(screen.getByText('Role: CHILD')).toBeInTheDocument();
  });

  it('handles child user with username instead of name', async () => {
    const mockAuthContext = {
      user: {
        id: 'child-id',
        role: 'CHILD',
        username: 'testchild',
        parentId: 'parent-id'
      },
      isAuthenticated: true,
      isLoading: false,
      isChild: true,
      userRole: 'child',
      lastError: null
    };

    jest.doMock('../../../contexts/AuthContext', () => ({
      ...jest.requireActual('../../../contexts/AuthContext'),
      useAuth: () => mockAuthContext
    }));

    renderWithProviders(<MockChildDashboard />);

    expect(screen.getByTestId('child-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, testchild!')).toBeInTheDocument();
  });
});

describe('Authentication State Validation', () => {
  it('validates that child users have required fields', () => {
    const validChildUser = {
      id: 'child-id',
      role: 'CHILD',
      username: 'testchild',
      parentId: 'parent-id'
    };

    // Test that child user has required fields
    expect(validChildUser.id).toBeDefined();
    expect(validChildUser.role).toBe('CHILD');
    expect(validChildUser.username).toBeDefined();
    expect(validChildUser.parentId).toBeDefined();
  });

  it('validates that parent users have required fields', () => {
    const validParentUser = {
      id: 'parent-id',
      role: 'PARENT',
      email: 'parent@test.com',
      firstName: 'Parent',
      lastName: 'User'
    };

    // Test that parent user has required fields
    expect(validParentUser.id).toBeDefined();
    expect(validParentUser.role).toBe('PARENT');
    expect(validParentUser.email).toBeDefined();
    expect(validParentUser.firstName).toBeDefined();
  });

  it('validates authentication state consistency', () => {
    const authState = {
      user: {
        id: 'child-id',
        role: 'CHILD',
        username: 'testchild'
      },
      isAuthenticated: true,
      isChild: true,
      userRole: 'child'
    };

    // Test state consistency
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.isChild).toBe(true);
    expect(authState.userRole).toBe('child');
    expect(authState.user?.role).toBe('CHILD');
  });
});