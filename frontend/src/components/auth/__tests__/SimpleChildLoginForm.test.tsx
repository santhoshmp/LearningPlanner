import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SimpleChildLoginForm from '../SimpleChildLoginForm';
import * as authApi from '../../../services/api';
import { SessionManager } from '../../../utils/sessionManager';

// Mock dependencies
jest.mock('../../../services/api');
jest.mock('../../../utils/sessionManager');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockSessionManager = SessionManager as jest.Mocked<typeof SessionManager>;

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('SimpleChildLoginForm', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionManager.clearSession = jest.fn();
    mockSessionManager.createSessionFromAuthResult = jest.fn().mockReturnValue({
      token: 'mock-token',
      user: { id: 'child-1', role: 'CHILD' }
    });
    mockSessionManager.saveSession = jest.fn();
    
    // Mock useNavigate
    require('react-router-dom').useNavigate = jest.fn(() => mockNavigate);
  });

  it('renders login form with username and PIN fields', () => {
    renderWithProviders(<SimpleChildLoginForm />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login flow', async () => {
    const mockAuthResult = {
      token: 'mock-jwt-token',
      user: { id: 'child-1', username: 'testchild', role: 'CHILD' }
    };

    mockAuthApi.childLogin = jest.fn().mockResolvedValue(mockAuthResult);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockAuthApi.childLogin).toHaveBeenCalledWith('testchild', '1234');
    });

    // Verify session management
    expect(mockSessionManager.clearSession).toHaveBeenCalled();
    expect(mockSessionManager.createSessionFromAuthResult).toHaveBeenCalledWith(mockAuthResult);
    expect(mockSessionManager.saveSession).toHaveBeenCalled();
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/child-dashboard', { replace: true });
  });

  it('displays error message on login failure', async () => {
    const mockError = {
      response: { status: 401 }
    };

    mockAuthApi.childLogin = jest.fn().mockRejectedValue(mockError);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: 'wrong' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or pin/i)).toBeInTheDocument();
    });

    // Verify session was cleared but not saved
    expect(mockSessionManager.clearSession).toHaveBeenCalled();
    expect(mockSessionManager.saveSession).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles rate limiting error (429)', async () => {
    const mockError = {
      response: { status: 429 }
    };

    mockAuthApi.childLogin = jest.fn().mockRejectedValue(mockError);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
    });
  });

  it('handles offline error', async () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const mockError = new Error('Network error');
    mockAuthApi.childLogin = jest.fn().mockRejectedValue(mockError);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
    });

    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  it('shows loading state during login', async () => {
    // Create a promise that we can control
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    mockAuthApi.childLogin = jest.fn().mockReturnValue(loginPromise);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check loading state
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();

    // Resolve the promise
    resolveLogin!({
      token: 'mock-token',
      user: { id: 'child-1', role: 'CHILD' }
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
    });
  });

  it('validates required fields', () => {
    renderWithProviders(<SimpleChildLoginForm />);

    // Try to submit without filling fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Form should not submit (no API call)
    expect(mockAuthApi.childLogin).not.toHaveBeenCalled();
  });

  it('clears error message when user starts typing', async () => {
    // First, create an error
    const mockError = {
      response: { status: 401 }
    };

    mockAuthApi.childLogin = jest.fn().mockRejectedValue(mockError);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit to create error
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username or pin/i)).toBeInTheDocument();
    });

    // Now type in username field - error should clear
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newusername' }
    });

    expect(screen.queryByText(/invalid username or pin/i)).not.toBeInTheDocument();
  });

  it('logs login attempt with correct parameters', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const mockAuthResult = {
      token: 'mock-jwt-token',
      user: { id: 'child-1', username: 'testchild', role: 'CHILD' }
    };

    mockAuthApi.childLogin = jest.fn().mockResolvedValue(mockAuthResult);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Attempting child login with:', { username: 'testchild' });
      expect(consoleSpy).toHaveBeenCalledWith('Login successful:', mockAuthResult);
    });

    consoleSpy.mockRestore();
  });

  it('logs errors appropriately', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const mockError = new Error('Test error');
    mockAuthApi.childLogin = jest.fn().mockRejectedValue(mockError);

    renderWithProviders(<SimpleChildLoginForm />);

    // Fill in form and submit
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testchild' }
    });
    fireEvent.change(screen.getByLabelText(/pin/i), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Login error:', mockError);
    });

    consoleErrorSpy.mockRestore();
  });
});