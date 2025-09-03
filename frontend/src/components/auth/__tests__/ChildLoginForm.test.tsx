import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ChildLoginForm from '../ChildLoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SessionManager } from '../../../utils/sessionManager';
import '@testing-library/jest-dom';
import { testA11y, defaultAxeOptions } from '../../../utils/testUtils/a11y';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock SessionManager
jest.mock('../../../utils/sessionManager', () => ({
  SessionManager: {
    saveSession: jest.fn(),
    clearSession: jest.fn(),
    createSessionFromAuthResult: jest.fn(),
  },
}));

// Mock the auth context
const mockChildLogin = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    childLogin: mockChildLogin,
    isLoading: false,
  }),
}));

const renderChildLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ChildLoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ChildLoginForm', () => {
  const mockSessionManager = SessionManager as jest.Mocked<typeof SessionManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChildLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the child login form correctly', () => {
    renderChildLoginForm();
    
    // Check for form elements
    expect(screen.getByText('Welcome to Study Adventure!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start learning/i })).toBeInTheDocument();
    expect(screen.getByText(/need help\? ask a parent or guardian/i)).toBeInTheDocument();
  });

  it('submits the form with valid data and handles successful login', async () => {
    const mockAuthResult = {
      user: {
        id: 'child-123',
        username: 'testuser',
        name: 'Test Child',
        role: 'CHILD',
        parentId: 'parent-123'
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      sessionId: 'session-123',
      expiresIn: 1200
    };

    const mockSessionData = {
      user: mockAuthResult.user,
      userRole: 'child' as const,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      loginTime: new Date().toISOString(),
      sessionId: 'session-123'
    };

    mockChildLogin.mockResolvedValue(mockAuthResult);
    mockSessionManager.createSessionFromAuthResult.mockReturnValue(mockSessionData);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    // Enter valid data
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    // Submit form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check that childLogin was called with correct data
    await waitFor(() => {
      expect(mockChildLogin).toHaveBeenCalledWith('testuser', '123456');
    });

    // Check that session was created and saved
    expect(mockSessionManager.createSessionFromAuthResult).toHaveBeenCalledWith(
      mockAuthResult,
      'session-123'
    );
    expect(mockSessionManager.saveSession).toHaveBeenCalledWith(mockSessionData);

    // Check that navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/child-dashboard');
  });

  it('shows error message when login fails', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Invalid username or PIN'
        }
      }
    };

    mockChildLogin.mockRejectedValue(mockError);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    // Enter invalid data
    await userEvent.type(usernameInput, 'invaliduser');
    await userEvent.type(pinInput, '123456');
    
    // Submit form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid username or PIN')).toBeInTheDocument();
    });

    // Check that session was not created
    expect(mockSessionManager.saveSession).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Create a promise that doesn't resolve immediately
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    
    mockChildLogin.mockReturnValue(loginPromise);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button');
    
    // Enter valid data
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    // Submit form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Check for loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Logging in...')).toBeInTheDocument();

    // Resolve the promise to clean up
    await act(async () => {
      resolveLogin!({
        user: { id: 'child-123', role: 'CHILD' },
        accessToken: 'token',
        refreshToken: 'refresh-token'
      });
    });
  });

  it('limits PIN input to 6 characters', async () => {
    renderChildLoginForm();
    
    const pinInput = screen.getByPlaceholderText('PIN');
    
    // Try to enter more than 6 characters
    await userEvent.type(pinInput, '12345678');
    
    // Check that only 6 characters were entered
    expect(pinInput).toHaveValue('123456');
  });

  it('handles network errors gracefully', async () => {
    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    mockChildLogin.mockRejectedValue(networkError);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  it('handles session storage errors during login', async () => {
    const mockAuthResult = {
      user: { id: 'child-123', role: 'CHILD' },
      accessToken: 'token',
      refreshToken: 'refresh-token',
      sessionId: 'session-123'
    };

    mockChildLogin.mockResolvedValue(mockAuthResult);
    mockSessionManager.createSessionFromAuthResult.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/storage error/i)).toBeInTheDocument();
    });
  });

  it('validates form inputs before submission', async () => {
    renderChildLoginForm();
    
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    // Try to submit empty form
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Should show validation errors
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/pin is required/i)).toBeInTheDocument();
    
    // Should not call childLogin
    expect(mockChildLogin).not.toHaveBeenCalled();
  });

  it('validates PIN length', async () => {
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '12'); // Too short
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    expect(screen.getByText(/pin must be at least 4 digits/i)).toBeInTheDocument();
    expect(mockChildLogin).not.toHaveBeenCalled();
  });

  it('handles account lockout scenarios', async () => {
    const lockoutError = {
      response: {
        data: {
          error: 'Account temporarily locked due to too many failed attempts'
        }
      }
    };

    mockChildLogin.mockRejectedValue(lockoutError);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument();
      expect(screen.getByText(/ask a parent or guardian/i)).toBeInTheDocument();
    });
  });

  it('handles inactive account scenarios', async () => {
    const inactiveError = {
      response: {
        data: {
          error: 'Account is inactive'
        }
      }
    };

    mockChildLogin.mockRejectedValue(inactiveError);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/account is inactive/i)).toBeInTheDocument();
      expect(screen.getByText(/contact your parent/i)).toBeInTheDocument();
    });
  });

  it('clears error messages when user starts typing', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Invalid username or PIN'
        }
      }
    };

    mockChildLogin.mockRejectedValue(mockError);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    // Submit invalid form to show error
    await userEvent.type(usernameInput, 'invalid');
    await userEvent.type(pinInput, '0000');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid username or PIN')).toBeInTheDocument();
    });
    
    // Start typing in username field
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'n');
    
    // Error should be cleared
    expect(screen.queryByText('Invalid username or PIN')).not.toBeInTheDocument();
  });

  it('prevents multiple simultaneous submissions', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    
    mockChildLogin.mockReturnValue(loginPromise);
    
    renderChildLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const pinInput = screen.getByPlaceholderText('PIN');
    const submitButton = screen.getByRole('button', { name: /start learning/i });
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(pinInput, '123456');
    
    // Submit form multiple times
    await act(async () => {
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
    });
    
    // Should only call childLogin once
    expect(mockChildLogin).toHaveBeenCalledTimes(1);
    
    // Button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Resolve to clean up
    await act(async () => {
      resolveLogin!({
        user: { id: 'child-123', role: 'CHILD' },
        accessToken: 'token',
        refreshToken: 'refresh-token'
      });
    });
  });

  it('should not have any accessibility violations', async () => {
    await testA11y(
      <BrowserRouter>
        <AuthProvider>
          <ChildLoginForm />
        </AuthProvider>
      </BrowserRouter>,
      defaultAxeOptions
    );
  });

  describe('Child-Friendly Error Messages', () => {
    const errorScenarios = [
      {
        serverError: 'Invalid credentials',
        expectedMessage: 'Oops! Your username or PIN doesn\'t match. Let\'s try again! 🔑'
      },
      {
        serverError: 'Account temporarily locked',
        expectedMessage: 'Your account needs a break! Ask a parent or guardian for help. 🔒'
      },
      {
        serverError: 'Network timeout',
        expectedMessage: 'We\'re having trouble connecting. Check your internet and try again! 🌐'
      }
    ];

    errorScenarios.forEach(({ serverError, expectedMessage }) => {
      it(`shows child-friendly message for ${serverError}`, async () => {
        mockChildLogin.mockRejectedValue({
          response: { data: { error: serverError } }
        });
        
        renderChildLoginForm();
        
        const usernameInput = screen.getByPlaceholderText('Username');
        const pinInput = screen.getByPlaceholderText('PIN');
        const submitButton = screen.getByRole('button', { name: /start learning/i });
        
        await userEvent.type(usernameInput, 'testuser');
        await userEvent.type(pinInput, '123456');
        
        await act(async () => {
          fireEvent.click(submitButton);
        });
        
        await waitFor(() => {
          expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Session Recovery', () => {
    it('handles corrupted session data during login', async () => {
      const mockAuthResult = {
        user: { id: 'child-123', role: 'CHILD' },
        accessToken: 'token',
        refreshToken: 'refresh-token'
      };

      mockChildLogin.mockResolvedValue(mockAuthResult);
      mockSessionManager.createSessionFromAuthResult.mockReturnValue({
        user: mockAuthResult.user,
        userRole: 'child' as const,
        accessToken: 'token',
        refreshToken: 'refresh-token',
        loginTime: new Date().toISOString()
      });
      mockSessionManager.saveSession.mockImplementation(() => {
        throw new Error('Failed to save session data');
      });
      
      renderChildLoginForm();
      
      const usernameInput = screen.getByPlaceholderText('Username');
      const pinInput = screen.getByPlaceholderText('PIN');
      const submitButton = screen.getByRole('button', { name: /start learning/i });
      
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(pinInput, '123456');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Should show storage error but still attempt to navigate
      await waitFor(() => {
        expect(screen.getByText(/storage error/i)).toBeInTheDocument();
      });
      
      // Should still try to navigate (fallback behavior)
      expect(mockNavigate).toHaveBeenCalledWith('/child-dashboard');
    });
  });
});