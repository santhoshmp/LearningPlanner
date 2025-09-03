import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import ProfileEditor from '../ProfileEditor';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
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
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('ProfileEditor', () => {
  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
    dateOfBirth: '1990-01-01',
    bio: 'Test bio',
    location: 'New York, NY',
    website: 'https://example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      emailNotifications: true,
      pushNotifications: false,
    },
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
    },
  };

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful profile fetch
    mockApi.get.mockResolvedValue({
      data: mockProfile
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render profile editor with existing data', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching profile', () => {
    // Mock delayed response
    mockApi.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: mockProfile }), 100)
      )
    );

    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('should handle form validation', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Clear required fields
    const firstNameInput = screen.getByLabelText(/first name/i);
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should save profile changes successfully', async () => {
    mockApi.put.mockResolvedValue({
      data: { ...mockProfile, firstName: 'Jane' }
    });

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Update first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/profile/user-123', {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        bio: 'Test bio',
        location: 'New York, NY',
        website: 'https://example.com',
        preferences: mockProfile.preferences,
        socialLinks: mockProfile.socialLinks,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
    expect(mockOnSave).toHaveBeenCalledWith({ ...mockProfile, firstName: 'Jane' });
  });

  it('should handle save errors', async () => {
    const saveError = new Error('Failed to update profile');
    mockApi.put.mockRejectedValue(saveError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update profile. Please try again.');
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should handle cancel action', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should validate phone number format', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should validate website URL format', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });

    const websiteInput = screen.getByLabelText(/website/i);
    fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
    });
  });

  it('should validate date of birth', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
    });

    const dobInput = screen.getByLabelText(/date of birth/i);
    fireEvent.change(dobInput, { target: { value: '2030-01-01' } }); // Future date

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Date of birth cannot be in the future')).toBeInTheDocument();
    });
  });

  it('should handle social links validation', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://twitter.com/johndoe')).toBeInTheDocument();
    });

    const twitterInput = screen.getByLabelText(/twitter/i);
    fireEvent.change(twitterInput, { target: { value: 'invalid-twitter-url' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid Twitter URL')).toBeInTheDocument();
    });
  });

  it('should show unsaved changes warning', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    // Make a change
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Should show unsaved changes indicator
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('should handle preferences updates', async () => {
    mockApi.put.mockResolvedValue({
      data: { 
        ...mockProfile, 
        preferences: { 
          ...mockProfile.preferences, 
          emailNotifications: false 
        }
      }
    });

    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email notifications/i)).toBeChecked();
    });

    // Toggle email notifications
    const emailNotificationsCheckbox = screen.getByLabelText(/email notifications/i);
    fireEvent.click(emailNotificationsCheckbox);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/profile/user-123', 
        expect.objectContaining({
          preferences: expect.objectContaining({
            emailNotifications: false
          })
        })
      );
    });
  });

  it('should handle timezone selection', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
    });

    // Change timezone
    const timezoneSelect = screen.getByLabelText(/timezone/i);
    fireEvent.change(timezoneSelect, { target: { value: 'Europe/London' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/profile/user-123',
        expect.objectContaining({
          preferences: expect.objectContaining({
            timezone: 'Europe/London'
          })
        })
      );
    });
  });

  it('should handle language selection', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('en')).toBeInTheDocument();
    });

    // Change language
    const languageSelect = screen.getByLabelText(/language/i);
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/profile/user-123',
        expect.objectContaining({
          preferences: expect.objectContaining({
            language: 'es'
          })
        })
      );
    });
  });

  it('should be accessible with proper form labels', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);

    // Focus first input
    firstNameInput.focus();
    expect(document.activeElement).toBe(firstNameInput);

    // Tab to next input
    fireEvent.keyDown(firstNameInput, { key: 'Tab' });
    lastNameInput.focus();
    expect(document.activeElement).toBe(lastNameInput);
  });

  it('should handle character limits for text fields', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    });

    const bioInput = screen.getByLabelText(/bio/i);
    const longBio = 'a'.repeat(501); // Assuming 500 character limit

    fireEvent.change(bioInput, { target: { value: longBio } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Bio must be 500 characters or less')).toBeInTheDocument();
    });
  });

  it('should show character count for bio field', async () => {
    render(
      <TestWrapper>
        <ProfileEditor userId="user-123" onSave={mockOnSave} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('8/500')).toBeInTheDocument(); // "Test bio" is 8 characters
    });

    const bioInput = screen.getByLabelText(/bio/i);
    fireEvent.change(bioInput, { target: { value: 'New bio content' } });

    expect(screen.getByText('16/500')).toBeInTheDocument();
  });
});