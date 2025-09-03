import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock react-router-dom Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  useLocation: () => ({ pathname: '/test' })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      isChild: false,
      userRole: null,
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      isChild: false,
      userRole: null,
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/login');
  });

  it('redirects to child-login for child paths when not authenticated', () => {
    // Mock useLocation to return a child path
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
      useLocation: () => ({ pathname: '/child-dashboard' })
    }));

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      isChild: false,
      userRole: null,
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/child-login');
  });

  it('renders children when authenticated as parent', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'PARENT', email: 'parent@test.com', firstName: 'Test', lastName: 'Parent' },
      isChild: false,
      userRole: 'parent',
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when authenticated as child on allowed path', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'CHILD', username: 'testchild', name: 'Test Child', parentId: '1' },
      isChild: true,
      userRole: 'child',
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    // Mock useLocation to return child dashboard path
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
      useLocation: () => ({ pathname: '/child-dashboard' })
    }));

    renderWithRouter(
      <ProtectedRoute>
        <div>Child Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('redirects child to child-dashboard when accessing parent route', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'CHILD', username: 'testchild', name: 'Test Child', parentId: '1' },
      isChild: true,
      userRole: 'child',
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    // Mock useLocation to return parent path
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
      useLocation: () => ({ pathname: '/dashboard' })
    }));

    renderWithRouter(
      <ProtectedRoute>
        <div>Child Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/child-dashboard');
  });

  it('redirects parent to dashboard when accessing child route', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', role: 'PARENT', email: 'parent@test.com', firstName: 'Test', lastName: 'Parent' },
      isChild: false,
      userRole: 'parent',
      login: jest.fn(),
      childLogin: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn()
    });

    // Mock useLocation to return child path
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
      useLocation: () => ({ pathname: '/child-dashboard' })
    }));

    renderWithRouter(
      <ProtectedRoute>
        <div>Parent Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/dashboard');
  });
});