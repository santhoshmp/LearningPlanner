import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Email as EmailIcon,
  PhoneAndroid as PushIcon,
  Schedule as ScheduleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { profileApi } from '../../services/api';

interface NotificationSettingsProps {
  settings: any;
  onSettingsUpdate: (settings: any) => void;
}

const NOTIFICATION_FREQUENCY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'daily', label: 'Daily Digest' },
  { value: 'weekly', label: 'Weekly Summary' },
  { value: 'never', label: 'Never' },
];

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: settings?.emailNotifications !== false, // Default to true
    pushNotifications: settings?.pushNotifications !== false, // Default to true
    progressUpdates: settings?.progressUpdates !== false,
    achievementAlerts: settings?.achievementAlerts !== false,
    studyReminders: settings?.studyReminders !== false,
    parentalAlerts: settings?.parentalAlerts !== false,
    systemUpdates: settings?.systemUpdates !== false,
    marketingEmails: settings?.marketingEmails || false, // Default to false
    notificationFrequency: settings?.notificationFrequency || 'daily',
    quietHoursEnabled: settings?.quietHoursEnabled || false,
    quietHoursStart: settings?.quietHoursStart || '22:00',
    quietHoursEnd: settings?.quietHoursEnd || '08:00',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const handleSelectChange = (field: string) => (event: SelectChangeEvent) => {
    setLocalSettings(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      const updatedSettings = await profileApi.updateSettings({
        emailNotifications: localSettings.emailNotifications,
        pushNotifications: localSettings.pushNotifications,
      });

      onSettingsUpdate(updatedSettings);
      setSaveMessage('Notification settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      setError('Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    localSettings.emailNotifications !== (settings?.emailNotifications !== false) ||
    localSettings.pushNotifications !== (settings?.pushNotifications !== false);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Notification Preferences
      </Typography>

      {saveMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {saveMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* General Notification Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              General Notifications
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Control how you receive notifications from the platform.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.emailNotifications}
                  onChange={handleSwitchChange('emailNotifications')}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  <Typography>Email Notifications</Typography>
                </Box>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive important updates and alerts via email.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.pushNotifications}
                  onChange={handleSwitchChange('pushNotifications')}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PushIcon fontSize="small" />
                  <Typography>Push Notifications</Typography>
                </Box>
              }
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Receive real-time notifications on your device.
            </Typography>

            <FormControl sx={{ mt: 2, maxWidth: 300 }}>
              <InputLabel id="notification-frequency-label">Notification Frequency</InputLabel>
              <Select
                labelId="notification-frequency-label"
                value={localSettings.notificationFrequency}
                label="Notification Frequency"
                onChange={handleSelectChange('notificationFrequency')}
              >
                {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Specific Notification Types */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Notification Types
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose which types of notifications you want to receive.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.progressUpdates}
                  onChange={handleSwitchChange('progressUpdates')}
                  color="primary"
                />
              }
              label="Progress Updates"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Get notified about your child's learning progress and milestones.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.achievementAlerts}
                  onChange={handleSwitchChange('achievementAlerts')}
                  color="primary"
                />
              }
              label="Achievement Alerts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Celebrate when your child completes activities or earns badges.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.studyReminders}
                  onChange={handleSwitchChange('studyReminders')}
                  color="primary"
                />
              }
              label="Study Reminders"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Gentle reminders to help maintain consistent study habits.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.parentalAlerts}
                  onChange={handleSwitchChange('parentalAlerts')}
                  color="primary"
                />
              }
              label="Parental Alerts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Important notifications about your child's account and safety.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.systemUpdates}
                  onChange={handleSwitchChange('systemUpdates')}
                  color="primary"
                />
              }
              label="System Updates"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Information about new features, maintenance, and important changes.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.marketingEmails}
                  onChange={handleSwitchChange('marketingEmails')}
                  color="primary"
                />
              }
              label="Marketing Communications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Tips, educational content, and promotional offers.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Quiet Hours
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set times when you don't want to receive notifications.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={localSettings.quietHoursEnabled}
                onChange={handleSwitchChange('quietHoursEnabled')}
                color="primary"
              />
            }
            label="Enable Quiet Hours"
            sx={{ mb: 2 }}
          />

          {localSettings.quietHoursEnabled && (
            <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Start Time</InputLabel>
                <Select
                  value={localSettings.quietHoursStart}
                  label="Start Time"
                  onChange={handleSelectChange('quietHoursStart')}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <MenuItem key={`${hour}:00`} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>End Time</InputLabel>
                <Select
                  value={localSettings.quietHoursEnd}
                  label="End Time"
                  onChange={handleSelectChange('quietHoursEnd')}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <MenuItem key={`${hour}:00`} value={`${hour}:00`}>
                        {`${hour}:00`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || saving}
          sx={{ minWidth: 120 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings;