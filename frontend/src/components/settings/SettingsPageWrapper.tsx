import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Palette as ThemeIcon,
} from '@mui/icons-material';
import { ParentDashboardLayout } from '../layout';
import { profileApi } from '../../services/api';

const SettingsPageWrapper: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settingsData = await profileApi.getSettings();
      setSettings(settingsData || {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
      });
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Using defaults.');
      setSettings({
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        privacyLevel: 'standard',
        dataSharingConsent: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await profileApi.updateSettings(settings);
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ParentDashboardLayout
        title="Settings"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings' }
        ]}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ParentDashboardLayout>
    );
  }

  return (
    <ParentDashboardLayout
      title="Settings"
      breadcrumbs={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' }
      ]}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <SettingsIcon sx={{ mr: 2, fontSize: '2rem' }} />
              <Typography variant="h4">
                Application Settings
              </Typography>
            </Box>

            {/* General Settings */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ThemeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">General</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings?.theme || 'light'}
                      label="Theme"
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings?.language || 'en'}
                      label="Language"
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Notification Settings */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Notifications</Typography>
              </Box>
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.emailNotifications || false}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings?.pushNotifications || false}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
              </FormGroup>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Privacy Settings */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Privacy & Security</Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Privacy Level</InputLabel>
                    <Select
                      value={settings?.privacyLevel || 'standard'}
                      label="Privacy Level"
                      onChange={(e) => handleSettingChange('privacyLevel', e.target.value)}
                    >
                      <MenuItem value="minimal">Minimal</MenuItem>
                      <MenuItem value="standard">Standard</MenuItem>
                      <MenuItem value="full">Full</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.dataSharingConsent || false}
                        onChange={(e) => handleSettingChange('dataSharingConsent', e.target.checked)}
                      />
                    }
                    label="Allow anonymous data sharing for product improvement"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Save Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ParentDashboardLayout>
  );
};

export default SettingsPageWrapper;