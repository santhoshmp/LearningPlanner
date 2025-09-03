import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../LoginForm';
import { AuthProvider } from '../../../contexts/AuthContext';
import '@testing-library/jest-dom';
import { testA11y, defaultAxeOptions } from '../../../utils/testUtils/a11y';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the auth context
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    login: jest.fn().mockImplementation((credentials) => {
      if (credentials.email === 'error@example.com') {
        return Promise.reject(new Error('Invalid credentials'));
      }
      return Promise.resolve();
    }),
    isLoading: false,
  }),
}));

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  it('renders the login form correctly', () => {
    renderLoginForm();
    
    // Check for form elements
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up here/i)).toBeInTheDocument();
  });

  it('validates email input', async () => {
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter invalid email
    await userEvent.type(emailInput, 'invalid-email');
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    
    // Clear and enter valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@example.com');
    
    // Check that error message is gone
    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  it('validates password input', async () => {
    renderLoginForm();
    
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit without password
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Enter password
    await userEvent.type(passwordInput, 'password123');
    
    // Check that error message is gone
    await waitFor(() => {
      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    renderLoginForm();
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // The eye icon button
    
    // Password should be hidden by default
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    fireEvent.click(toggleButton);
    
    // Password should be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle button again
    fireEvent.click(toggleButton);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits the form with valid data', async () => {
    const { useAuth } = require('../../../contexts/AuthContext');
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
    
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter valid data
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check that login was called with correct data
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows loading state during submission', async () => {
    const { useAuth } = require('../../../contexts/AuthContext');
    // Create a promise that doesn't resolve immediately
    const loginPromise = new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
    const mockLogin = jest.fn().mockReturnValue(loginPromise);
    
    useAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });
    
    renderLoginForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter valid data
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for loading indicator
    expect(submitButton).toBeDisabled();
    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should not have any accessibility violations', async () => {
    await testA11y(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>,
      defaultAxeOptions
    );
  });
});