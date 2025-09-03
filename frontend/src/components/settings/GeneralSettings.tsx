import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  SelectChangeEvent,
} from '@mui/material';
import {
  Palette as ThemeIcon,
  Language as LanguageIcon,
  Schedule as TimezoneIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeContext';
import { profileApi } from '../../services/api';

interface GeneralSettingsProps {
  settings: any;
  onSettingsUpdate: (settings: any) => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const { themeMode, toggleThemeMode, textSize, setTextSize } = useTheme();
  const [localSettings, setLocalSettings] = useState({
    theme: settings?.theme || themeMode,
    language: settings?.language || 'en',
    timezone: settings?.timezone || 'UTC',
    autoSave: settings?.autoSave !== false, // Default to true
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleThemeChange = (event: SelectChangeEvent) => {
    const newTheme = event.target.value as 'light' | 'dark' | 'auto';
    setLocalSettings(prev => ({ ...prev, theme: newTheme }));
    
    // Apply theme change immediately for better UX
    if (newTheme !== 'auto') {
      if ((newTheme === 'light' && themeMode === 'dark') || 
          (newTheme === 'dark' && themeMode === 'light')) {
        toggleThemeMode();
      }
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLocalSettings(prev => ({ ...prev, language: event.target.value }));
  };

  const handleTimezoneChange = (event: SelectChangeEvent) => {
    setLocalSettings(prev => ({ ...prev, timezone: event.target.value }));
  };

  const handleAutoSaveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({ ...prev, autoSave: event.target.checked }));
  };

  const handleTextSizeChange = (event: SelectChangeEvent) => {
    const newSize = event.target.value as 'normal' | 'large' | 'larger';
    setTextSize(newSize);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      const updatedSettings = await profileApi.updateSettings({
        theme: localSettings.theme,
        language: localSettings.language,
        timezone: localSettings.timezone,
      });

      onSettingsUpdate(updatedSettings);
      setSaveMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = 
    localSettings.theme !== (settings?.theme || themeMode) ||
    localSettings.language !== (settings?.language || 'en') ||
    localSettings.timezone !== (settings?.timezone || 'UTC');

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        General Preferences
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

      {/* Theme Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ThemeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Appearance
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Customize how the application looks and feels.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="theme-select-label">Theme</InputLabel>
              <Select
                labelId="theme-select-label"
                id="theme-select"
                value={localSettings.theme}
                label="Theme"
                onChange={handleThemeChange}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto (System)</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="text-size-select-label">Text Size</InputLabel>
              <Select
                labelId="text-size-select-label"
                id="text-size-select"
                value={textSize}
                label="Text Size"
                onChange={handleTextSizeChange}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="large">Large</MenuItem>
                <MenuItem value="larger">Larger</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Language and Region Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Language & Region
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set your preferred language and timezone for the best experience.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="language-select-label">Language</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={localSettings.language}
                label="Language"
                onChange={handleLanguageChange}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel id="timezone-select-label">Timezone</InputLabel>
              <Select
                labelId="timezone-select-label"
                id="timezone-select"
                value={localSettings.timezone}
                label="Timezone"
                onChange={handleTimezoneChange}
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Application Behavior */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TimezoneIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Application Behavior
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure how the application behaves during your sessions.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={localSettings.autoSave}
                onChange={handleAutoSaveChange}
                color="primary"
              />
            }
            label="Auto-save progress"
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
            Automatically save your progress as you work through activities.
          </Typography>
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

export default GeneralSettings;