import React, { useState, useEffect } from 'react';
import { UserProfile, UserSettings, SettingsUpdateData } from '../../types/profile';
import { profileApi } from '../../services/api';

interface ProfileSettingsIntegrationProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

const ProfileSettingsIntegration: React.FC<ProfileSettingsIntegrationProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(profile.settings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<SettingsUpdateData>({});

  useEffect(() => {
    setSettings(profile.settings);
  }, [profile.settings]);

  const handleSettingChange = (key: keyof SettingsUpdateData, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    const changes = { ...pendingChanges, [key]: value };
    setPendingChanges(changes);
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (!hasChanges) return;

    setShowConfirmation(true);
  };

  const confirmSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedSettings = await profileApi.updateSettings(pendingChanges);
      const updatedProfile = await profileApi.getProfile();
      
      onProfileUpdate(updatedProfile);
      setSettings(updatedSettings);
      setPendingChanges({});
      setHasChanges(false);
      setShowConfirmation(false);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelChanges = () => {
    setSettings(profile.settings);
    setPendingChanges({});
    setHasChanges(false);
    setShowConfirmation(false);
  };

  const handleExportProfile = async () => {
    try {
      setLoading(true);
      const exportData = await profileApi.exportProfile();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export profile:', err);
      setError(err.response?.data?.message || 'Failed to export profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadProfile = async () => {
    try {
      setLoading(true);
      const blob = await profileApi.downloadProfile();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download profile:', err);
      setError(err.response?.data?.message || 'Failed to download profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Settings not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Preferences</h3>
        
        <div className="space-y-6">
          {/* Theme Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          {/* Language Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
            </select>
          </div>

          {/* Timezone Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Europe/Berlin">Berlin</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Notifications</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive updates and alerts via email
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive push notifications in your browser
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Level
            </label>
            <select
              value={settings.privacyLevel}
              onChange={(e) => handleSettingChange('privacyLevel', e.target.value as 'minimal' | 'standard' | 'full')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="minimal">Minimal - Basic functionality only</option>
              <option value="standard">Standard - Balanced privacy and features</option>
              <option value="full">Full - All features enabled</option>
            </select>
          </div>

          {/* Data Sharing Consent */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data Sharing Consent
              </label>
              <p className="text-sm text-gray-500">
                Allow anonymous usage data to help improve the platform
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSettingChange('dataSharingConsent', !settings.dataSharingConsent)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.dataSharingConsent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.dataSharingConsent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelChanges}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Export Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
        <p className="text-sm text-gray-600 mb-6">
          Download your profile data and settings for backup or transfer purposes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleExportProfile}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Exporting...' : 'Export Profile Data'}
          </button>
          <button
            onClick={handleDownloadProfile}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Downloading...' : 'Download Complete Data'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
                Confirm Settings Changes
              </h3>
              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-3">You are about to update the following settings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(pendingChanges).map(([key, value]) => (
                    <li key={key}>
                      <span className="font-medium">{key}:</span> {String(value)}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  These changes will be applied immediately and logged for audit purposes.
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveSettings}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Confirm Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsIntegration;