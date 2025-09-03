import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Divider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Snackbar,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { parentalMonitoringApi } from '../../services/api';

interface NotificationPreferences {
  loginNotifications: boolean;
  achievementNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  helpRequestAlerts: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
}

const ParentalNotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    loginNotifications: true,
    achievementNotifications: true,
    weeklyReports: true,
    securityAlerts: true,
    helpRequestAlerts: true,
    emailFrequency: 'immediate',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreferenceChange = (key: keyof NotificationPreferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const handleFrequencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      emailFrequency: event.target.value as 'immediate' | 'daily' | 'weekly',
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await parentalMonitoringApi.updateNotificationPreferences(preferences);
      
      setSuccess(true);
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      setError('Failed to update notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWeeklyReport = async () => {
    try {
      setLoading(true);
      await parentalMonitoringApi.sendWeeklyReport();
      setSuccess(true);
    } catch (err) {
      console.error('Error sending test report:', err);
      setError('Failed to send test report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon />
        Parental Notification Settings
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how and when you receive notifications about your child's learning activities.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            Security & Safety Notifications
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.loginNotifications}
                  onChange={handlePreferenceChange('loginNotifications')}
                />
              }
              label="Login Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Get notified when your child logs into their account
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.securityAlerts}
                  onChange={handlePreferenceChange('securityAlerts')}
                />
              }
              label="Security Alerts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive alerts for suspicious activity or security concerns
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            Learning Progress Notifications
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.achievementNotifications}
                  onChange={handlePreferenceChange('achievementNotifications')}
                />
              }
              label="Achievement Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Get notified when your child earns badges or reaches milestones
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.helpRequestAlerts}
                  onChange={handlePreferenceChange('helpRequestAlerts')}
                />
              }
              label="Help Request Alerts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive alerts when your child frequently requests help
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.weeklyReports}
                  onChange={handlePreferenceChange('weeklyReports')}
                />
              }
              label="Weekly Progress Reports"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive comprehensive weekly summaries of your child's learning progress
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon />
            Email Frequency
          </Typography>
          
          <FormControl component="fieldset">
            <FormLabel component="legend">How often would you like to receive email notifications?</FormLabel>
            <RadioGroup
              value={preferences.emailFrequency}
              onChange={handleFrequencyChange}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="immediate"
                control={<Radio />}
                label="Immediate"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
                Receive notifications as they happen
              </Typography>
              
              <FormControlLabel
                value="daily"
                control={<Radio />}
                label="Daily Digest"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
                Receive a daily summary of all notifications
              </Typography>
              
              <FormControlLabel
                value="weekly"
                control={<Radio />}
                label="Weekly Summary"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive notifications in weekly batches
              </Typography>
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleTestWeeklyReport}
          disabled={loading}
        >
          Send Test Report
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Settings saved successfully!"
      />
    </Box>
  );
};

export default ParentalNotificationSettings;