import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfilePage } from '../index';
import { profileApi } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  profileApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    exportProfile: jest.fn(),
    downloadProfile: jest.fn(),
  },
  oauthApi: {
    getLinkedAccounts: jest.fn(),
    initiateAuth: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
  },
}));

const mockProfile = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isEmailVerified: true,
  role: 'PARENT',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  settings: {
    id: 'settings-123',
    userId: 'user-123',
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: true,
    privacyLevel: 'standard',
    dataSharingConsent: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  socialProviders: [],
  childrenCount: 2,
};

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
  });

  it('renders profile page with tabs', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    // Check that all tabs are present
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    expect(screen.getByText('Settings & Data')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('displays profile information correctly', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    // Click on Profile Picture tab
    await user.click(screen.getByText('Profile Picture'));
    expect(screen.getByText('Upload a photo to personalize your account')).toBeInTheDocument();

    // Click on Connected Accounts tab
    await user.click(screen.getByText('Connected Accounts'));
    expect(screen.getByText('About Connected Accounts')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (profileApi.getProfile as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100))
    );

    render(<UserProfilePage />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('shows error state when profile fails to load', async () => {
    (profileApi.getProfile as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('displays account summary correctly', async () => {
    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Account Summary')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('2 children')).toBeInTheDocument();
    });
  });
});