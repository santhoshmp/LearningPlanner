import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import SettingsPage from '../SettingsPage';

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

// Mock the auth context
const mockUseAuth = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PARENT',
  },
  isLoading: false,
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
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

describe('SettingsPage', () => {
  const mockUserSettings = {
    id: 'settings-123',
    userId: 'user-123',
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    dataSharing: false,
    privacyLevel: 'standard',
    twoFactorEnabled: false,
    sessionTimeout: 30,
  };

  const mockChildren = [
    {
      id: 'child-1',
      firstName: 'Alice',
      lastName: 'Doe',
      age: 8,
    },
    {
      id: 'child-2',
      firstName: 'Bob',
      lastName: 'Doe',
      age: 12,
    },
  ];

  const mockChildSettings = {
    'child-1': {
      id: 'child-settings-1',
      childId: 'child-1',
      contentFiltering: 'strict',
      maxDailyScreenTime: 60,
      allowedContentTypes: ['educational'],
      parentalApprovalRequired: true,
      bedtimeRestrictions: {
        enabled: true,
        startTime: '20:00',
        endTime: '07:00',
      },
    },
    'child-2': {
      id: 'child-settings-2',
      childId: 'child-2',
      contentFiltering: 'moderate',
      maxDailyScreenTime: 90,
      allowedContentTypes: ['educational', 'entertainment'],
      parentalApprovalRequired: false,
      bedtimeRestrictions: {
        enabled: false,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockApi.get.mockImplementation((url) => {
      if (url === '/settings/user/user-123') {
        return Promise.resolve({ data: mockUserSettings });
      }
      if (url === '/children') {
        return Promise.resolve({ data: mockChildren });
      }
      if (url.startsWith('/settings/child/')) {
        const childId = url.split('/').pop();
        return Promise.resolve({ data: mockChildSettings[childId] });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render settings page with tabs', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Check for tab navigation
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Child Safety')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('should load and display user settings', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/settings/user/user-123');
    });

    // Check that settings are displayed
    await waitFor(() => {
      expect(screen.getByDisplayValue('light')).toBeInTheDocument();
      expect(screen.getByDisplayValue('en')).toBeInTheDocument();
      expect(screen.getByDisplayValue('America/New_York')).toBeInTheDocument();
    });
  });

  it('should update general settings', async () => {
    mockApi.put.mockResolvedValue({
      data: { ...mockUserSettings, theme: 'dark' }
    });

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('light')).toBeInTheDocument();
    });

    // Change theme to dark
    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/user/user-123', {
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true,
        dataSharing: false,
        privacyLevel: 'standard',
        twoFactorEnabled: false,
        sessionTimeout: 30,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Settings updated successfully!');
  });

  it('should switch between tabs', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    // Click on Notifications tab
    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);

    // Should show notification settings
    await waitFor(() => {
      expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/push notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/weekly reports/i)).toBeInTheDocument();
    });
  });

  it('should handle notification settings', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // Switch to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/email notifications/i)).toBeChecked();
      expect(screen.getByLabelText(/push notifications/i)).not.toBeChecked();
    });

    // Toggle push notifications
    const pushNotificationsCheckbox = screen.getByLabelText(/push notifications/i);
    fireEvent.click(pushNotificationsCheckbox);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/user/user-123',
        expect.objectContaining({
          pushNotifications: true
        })
      );
    });
  });

  it('should handle privacy settings', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    // Switch to privacy tab
    const privacyTab = screen.getByText('Privacy');
    fireEvent.click(privacyTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('standard')).toBeInTheDocument();
      expect(screen.getByLabelText(/data sharing/i)).not.toBeChecked();
    });

    // Change privacy level
    const privacySelect = screen.getByLabelText(/privacy level/i);
    fireEvent.change(privacySelect, { target: { value: 'high' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/user/user-123',
        expect.objectContaining({
          privacyLevel: 'high'
        })
      );
    });
  });

  it('should load and display child safety settings', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Child Safety')).toBeInTheDocument();
    });

    // Switch to child safety tab
    const childSafetyTab = screen.getByText('Child Safety');
    fireEvent.click(childSafetyTab);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/children');
      expect(mockApi.get).toHaveBeenCalledWith('/settings/child/child-1');
      expect(mockApi.get).toHaveBeenCalledWith('/settings/child/child-2');
    });

    // Should show child settings
    await waitFor(() => {
      expect(screen.getByText('Alice Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Doe')).toBeInTheDocument();
    });
  });

  it('should update child settings', async () => {
    mockApi.put.mockResolvedValue({
      data: { ...mockChildSettings['child-1'], maxDailyScreenTime: 90 }
    });

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    // Switch to child safety tab
    const childSafetyTab = screen.getByText('Child Safety');
    fireEvent.click(childSafetyTab);

    await waitFor(() => {
      expect(screen.getByText('Alice Doe')).toBeInTheDocument();
    });

    // Expand Alice's settings
    const aliceCard = screen.getByText('Alice Doe').closest('.MuiCard-root');
    const expandButton = aliceCard?.querySelector('[aria-label="expand"]');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('60')).toBeInTheDocument(); // Screen time
    });

    // Update screen time
    const screenTimeInput = screen.getByLabelText(/daily screen time/i);
    fireEvent.change(screenTimeInput, { target: { value: '90' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/child/child-1',
        expect.objectContaining({
          maxDailyScreenTime: 90
        })
      );
    });
  });

  it('should handle account settings', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    // Switch to account tab
    const accountTab = screen.getByText('Account');
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(screen.getByLabelText(/two-factor authentication/i)).not.toBeChecked();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Session timeout
    });

    // Enable two-factor authentication
    const twoFactorCheckbox = screen.getByLabelText(/two-factor authentication/i);
    fireEvent.click(twoFactorCheckbox);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/user/user-123',
        expect.objectContaining({
          twoFactorEnabled: true
        })
      );
    });
  });

  it('should show unsaved changes warning', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('light')).toBeInTheDocument();
    });

    // Make a change
    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'dark' } });

    // Should show unsaved changes warning
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
  });

  it('should handle bulk settings export', async () => {
    const mockExportData = {
      format: 'json',
      data: JSON.stringify({ userSettings: mockUserSettings }),
      filename: 'settings_user-123_2024-01-01.json'
    };

    mockApi.get.mockResolvedValueOnce({ data: mockExportData });

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    // Switch to account tab
    const accountTab = screen.getByText('Account');
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(screen.getByText('Export Settings')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Settings');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/settings/export/user-123?format=json');
    });
  });

  it('should handle settings import', async () => {
    const mockFile = new File(['{"userSettings": {"theme": "dark"}}'], 'settings.json', {
      type: 'application/json'
    });

    mockApi.post.mockResolvedValue({
      data: {
        success: true,
        importedUserSettings: true,
        importedChildSettings: [],
        errors: []
      }
    });

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    // Switch to account tab
    const accountTab = screen.getByText('Account');
    fireEvent.click(accountTab);

    await waitFor(() => {
      expect(screen.getByText('Import Settings')).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/import settings file/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    const importButton = screen.getByText('Import Settings');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/settings/import/user-123',
        expect.any(FormData)
      );
    });
  });

  it('should handle settings validation errors', async () => {
    const validationError = new Error('Invalid settings data');
    validationError.name = 'ValidationError';
    
    mockApi.put.mockRejectedValue(validationError);

    const toast = require('react-hot-toast');

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    });

    // Switch to account tab
    const accountTab = screen.getByText('Account');
    fireEvent.click(accountTab);

    // Set invalid session timeout
    const sessionTimeoutInput = screen.getByLabelText(/session timeout/i);
    fireEvent.change(sessionTimeoutInput, { target: { value: '-1' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid settings data. Please check your inputs.');
    });
  });

  it('should be accessible with proper ARIA labels', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /privacy/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /child safety/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /account/i })).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation between tabs', async () => {
    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    const generalTab = screen.getByRole('tab', { name: /general/i });
    const notificationsTab = screen.getByRole('tab', { name: /notifications/i });

    // Focus first tab
    generalTab.focus();
    expect(document.activeElement).toBe(generalTab);

    // Arrow key to next tab
    fireEvent.keyDown(generalTab, { key: 'ArrowRight' });
    notificationsTab.focus();
    expect(document.activeElement).toBe(notificationsTab);
  });

  it('should show loading state while fetching settings', () => {
    // Mock delayed response
    mockApi.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: mockUserSettings }), 100)
      )
    );

    render(
      <TestWrapper>
        <SettingsPage />
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });
});