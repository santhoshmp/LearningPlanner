export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  role: 'PARENT' | 'CHILD';
  createdAt: string;
  updatedAt: string;
  settings: UserSettings | null;
  socialProviders: SocialAuthProvider[];
  profilePicture?: string;
  childrenCount: number;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  privacyLevel: 'minimal' | 'standard' | 'full';
  dataSharingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAuthProvider {
  provider: string;
  providerEmail: string | null;
  providerName: string | null;
  isLinked: boolean;
  linkedAt: Date;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  settings?: Partial<UserSettings>;
}

export interface SettingsUpdateData {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  privacyLevel?: 'minimal' | 'standard' | 'full';
  dataSharingConsent?: boolean;
}

export interface AvatarUploadResult {
  filename: string;
  url: string;
  size: number;
}

export interface ProfileValidationError {
  field: string;
  message: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface AvatarCropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}