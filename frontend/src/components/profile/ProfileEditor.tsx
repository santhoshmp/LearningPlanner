import React, { useState, useEffect } from 'react';
import { UserProfile, ProfileFormData, ProfileValidationError } from '../../types/profile';

interface ProfileEditorProps {
  profile: UserProfile;
  isEditing: boolean;
  onSave: (formData: ProfileFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  isEditing,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
  });
  const [errors, setErrors] = useState<ProfileValidationError[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
      setErrors([]);
      setShowPasswordFields(false);
    }
  }, [isEditing, profile]);

  const validateForm = (): ProfileValidationError[] => {
    const newErrors: ProfileValidationError[] = [];

    if (!formData.firstName.trim()) {
      newErrors.push({ field: 'firstName', message: 'First name is required' });
    } else if (formData.firstName.length > 50) {
      newErrors.push({ field: 'firstName', message: 'First name must be 50 characters or less' });
    }

    if (!formData.lastName.trim()) {
      newErrors.push({ field: 'lastName', message: 'Last name is required' });
    } else if (formData.lastName.length > 50) {
      newErrors.push({ field: 'lastName', message: 'Last name must be 50 characters or less' });
    }

    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (showPasswordFields) {
      if (!formData.currentPassword) {
        newErrors.push({ field: 'currentPassword', message: 'Current password is required to change password' });
      }

      if (!formData.newPassword) {
        newErrors.push({ field: 'newPassword', message: 'New password is required' });
      } else if (formData.newPassword.length < 8) {
        newErrors.push({ field: 'newPassword', message: 'New password must be at least 8 characters long' });
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      const result = await onSave(formData);
      if (result.success) {
        // Success handled by parent component
      } else {
        setErrors([{ field: 'general', message: result.error || 'Failed to update profile' }]);
      }
    } catch (error) {
      setErrors([{ field: 'general', message: 'An unexpected error occurred' }]);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const hasChanges = () => {
    return (
      formData.firstName !== profile.firstName ||
      formData.lastName !== profile.lastName ||
      formData.email !== profile.email ||
      showPasswordFields
    );
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {profile.firstName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {profile.lastName}
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="flex items-center">
            <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">
              {profile.email}
            </div>
            {profile.isEmailVerified ? (
              <div className="ml-3 flex items-center text-green-600">
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Verified</span>
              </div>
            ) : (
              <div className="ml-3 flex items-center text-yellow-600">
                <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Unverified</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Created
          </label>
          <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.some(error => error.field === 'general') && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {getFieldError('general')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('firstName')
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter your first name"
          />
          {getFieldError('firstName') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('lastName')
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter your last name"
          />
          {getFieldError('lastName') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            getFieldError('email')
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder="Enter your email address"
        />
        {getFieldError('email') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
        )}
        {formData.email !== profile.email && (
          <p className="mt-1 text-sm text-yellow-600">
            Changing your email will require re-verification
          </p>
        )}
      </div>

      {/* Password Change Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <button
            type="button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showPasswordFields ? 'Cancel Password Change' : 'Change Password'}
          </button>
        </div>

        {showPasswordFields && (
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <input
                type="password"
                id="currentPassword"
                value={formData.currentPassword || ''}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('currentPassword')
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Enter your current password"
              />
              {getFieldError('currentPassword') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('currentPassword')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword || ''}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('newPassword')
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Enter new password"
                />
                {getFieldError('newPassword') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('newPassword')}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError('confirmPassword')
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Confirm new password"
                />
                {getFieldError('confirmPassword') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('confirmPassword')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hasChanges()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditor;