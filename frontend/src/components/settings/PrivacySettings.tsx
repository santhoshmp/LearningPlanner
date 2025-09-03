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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  DataUsage as DataIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { profileApi } from '../../services/api';

interface PrivacySettingsProps {
  settings: any;
  onSettingsUpdate: (settings: any) => void;
}

const PRIVACY_LEVELS = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Only essential data is collected and processed.',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Balanced approach with analytics for improving experience.',
  },
  {
    value: 'full',
    label: 'Full',
    description: 'All features enabled including personalization and recommendations.',
  },
];

const DATA_TYPES = [
  {
    id: 'learning_progress',
    name: 'Learning Progress',
    description: 'Activity completion, scores, and time spent learning',
    required: true,
  },
  {
    id: 'usage_analytics',
    name: 'Usage Analytics',
    description: 'How you interact with the platform to improve user experience',
    required: false,
  },
  {
    id: 'performance_data',
    name: 'Performance Data',
    description: 'Detailed analytics to provide personalized recommendations',
    required: false,
  },
  {
    id: 'device_information',
    name: 'Device Information',
    description: 'Browser type, screen size, and technical specifications',
    required: false,
  },
];

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState({
    privacyLevel: settings?.privacyLevel || 'standard',
    dataSharingConsent: settings?.dataSharingConsent || false,
    analyticsOptOut: settings?.analyticsOptOut || false,
    personalizedContent: settings?.personalizedContent !== false, // Default to true
    thirdPartyIntegrations: settings?.thirdPartyIntegrations || false,
    dataRetentionPeriod: settings?.dataRetentionPeriod || '2years',
    profileVisibility: settings?.profileVisibility || 'private',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataExportDialog, setDataExportDialog] = useState(false);
  const [dataDeleteDialog, setDataDeleteDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        privacyLevel: localSettings.privacyLevel,
        dataSharingConsent: localSettings.dataSharingConsent,
      });

      onSettingsUpdate(updatedSettings);
      setSaveMessage('Privacy settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
      setError('Failed to save privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setExporting(true);
      const blob = await profileApi.downloadProfile();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDataExportDialog(false);
      setSaveMessage('Your data has been exported successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const hasChanges = 
    localSettings.privacyLevel !== (settings?.privacyLevel || 'standard') ||
    localSettings.dataSharingConsent !== (settings?.dataSharingConsent || false);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Privacy & Data Settings
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

      {/* Privacy Level */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Privacy Level
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose how much data you're comfortable sharing to improve your experience.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="privacy-level-label">Privacy Level</InputLabel>
            <Select
              labelId="privacy-level-label"
              value={localSettings.privacyLevel}
              label="Privacy Level"
              onChange={handleSelectChange('privacyLevel')}
            >
              {PRIVACY_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  <Box>
                    <Typography variant="body1">{level.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {level.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Your privacy level affects which features are available and how your data is used. 
              You can change this setting at any time.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Data Sharing Consent */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DataIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Data Sharing & Usage
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Control how your data is used and shared within the platform.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.dataSharingConsent}
                  onChange={handleSwitchChange('dataSharingConsent')}
                  color="primary"
                />
              }
              label="Data Sharing Consent"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Allow anonymized data to be used for research and platform improvement.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={!localSettings.analyticsOptOut}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    analyticsOptOut: !e.target.checked 
                  }))}
                  color="primary"
                />
              }
              label="Usage Analytics"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Help us improve the platform by sharing usage patterns and performance data.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.personalizedContent}
                  onChange={handleSwitchChange('personalizedContent')}
                  color="primary"
                />
              }
              label="Personalized Content"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Use your activity data to provide personalized study recommendations.
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.thirdPartyIntegrations}
                  onChange={handleSwitchChange('thirdPartyIntegrations')}
                  color="primary"
                />
              }
              label="Third-Party Integrations"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Allow integration with external educational tools and services.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Data Types Collected */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Data Types We Collect
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Here's what data we collect and how it's used to improve your experience.
          </Typography>

          <List>
            {DATA_TYPES.map((dataType) => (
              <ListItem key={dataType.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  <CheckIcon color={dataType.required ? 'primary' : 'action'} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{dataType.name}</Typography>
                      {dataType.required && (
                        <Chip label="Required" size="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={dataType.description}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Profile Visibility
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Control who can see your profile information.
          </Typography>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="profile-visibility-label">Profile Visibility</InputLabel>
            <Select
              labelId="profile-visibility-label"
              value={localSettings.profileVisibility}
              label="Profile Visibility"
              onChange={handleSelectChange('profileVisibility')}
            >
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="friends">Friends Only</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="data-retention-label">Data Retention</InputLabel>
              <Select
                labelId="data-retention-label"
                value={localSettings.dataRetentionPeriod}
                label="Data Retention"
                onChange={handleSelectChange('dataRetentionPeriod')}
              >
                <MenuItem value="1year">1 Year</MenuItem>
                <MenuItem value="2years">2 Years</MenuItem>
                <MenuItem value="5years">5 Years</MenuItem>
                <MenuItem value="indefinite">Indefinite</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Data Management
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Export or delete your personal data at any time.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setDataExportDialog(true)}
            >
              Export My Data
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDataDeleteDialog(true)}
            >
              Delete My Data
            </Button>
          </Box>
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

      {/* Data Export Dialog */}
      <Dialog open={dataExportDialog} onClose={() => setDataExportDialog(false)}>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will download all your personal data in JSON format, including:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Profile information" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Learning progress and activity data" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Settings and preferences" />
            </ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Account activity logs" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataExportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDataExport} 
            variant="contained"
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Delete Dialog */}
      <Dialog open={dataDeleteDialog} onClose={() => setDataDeleteDialog(false)}>
        <DialogTitle>Delete Your Data</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1">
              <strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.
            </Typography>
          </Alert>
          <Typography variant="body1">
            If you proceed, we will delete all your personal data within 30 days. 
            You will receive a confirmation email when the deletion is complete.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDataDeleteDialog(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => {
              // This would typically call an API to initiate data deletion
              setDataDeleteDialog(false);
              setSaveMessage('Data deletion request submitted. You will receive a confirmation email.');
              setTimeout(() => setSaveMessage(null), 5000);
            }}
          >
            Delete My Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrivacySettings;