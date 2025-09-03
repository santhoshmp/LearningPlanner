import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PublicRoute } from '../PublicRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock react-router-dom Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PublicRoute', () => {
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
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders children when not authenticated', () => {
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
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when authenticated as parent', () => {
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
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/dashboard');
  });

  it('redirects to child-dashboard when authenticated as child', () => {
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

    renderWithRouter(
      <PublicRoute>
        <div>Public Content</div>
      </PublicRoute>
    );

    expect(screen.getByTestId('navigate-to')).toHaveTextContent('/child-dashboard');
  });
});