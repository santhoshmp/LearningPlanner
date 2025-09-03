import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Switch, 
  FormControlLabel, 
  Button, 
  Divider, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  SecurityOutlined, 
  PrivacyTipOutlined, 
  DeleteOutline, 
  DownloadOutlined,
  SaveOutlined
} from '@mui/icons-material';
import { privacyService } from '../../services/privacyService';

interface AccountPrivacySettingsProps {
  userId: string;
}

const AccountPrivacySettings: React.FC<AccountPrivacySettingsProps> = ({ userId }) => {
  const [settings, setSettings] = useState({
    dataCollection: true,
    contentLogging: true,
    aiUsageTracking: true,
    emailNotifications: true
  });
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      await privacyService.updatePrivacySettings(userId, settings);
      setSuccessMessage('Privacy settings updated successfully');
    } catch (error) {
      setErrorMessage('Failed to update privacy settings. Please try again.');
      console.error('Error updating privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      await privacyService.requestDataExport(userId);
      setSuccessMessage('Data export requested. You will receive an email with your data shortly.');
    } catch (error) {
      setErrorMessage('Failed to request data export. Please try again.');
      console.error('Error requesting data export:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setErrorMessage('Please type DELETE to confirm account deletion');
      return;
    }
    
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    
    try {
      await privacyService.deleteAccount(userId);
      setSuccessMessage('Account deletion initiated. Your account and all associated data will be removed.');
      setDeleteDialogOpen(false);
    } catch (error) {
      setErrorMessage('Failed to delete account. Please try again.');
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Privacy & Security Settings
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PrivacyTipOutlined sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">
            Privacy Settings
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.dataCollection}
              onChange={() => handleSettingChange('dataCollection')}
              color="primary"
            />
          }
          label="Allow data collection for service improvement"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          We collect anonymous usage data to improve our educational services.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.contentLogging}
              onChange={() => handleSettingChange('contentLogging')}
              color="primary"
            />
          }
          label="Enable conversation logging for content safety"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Logs conversations with Claude AI to ensure content safety and appropriate responses.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.aiUsageTracking}
              onChange={() => handleSettingChange('aiUsageTracking')}
              color="primary"
            />
          }
          label="Track AI usage for analytics"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Tracks how your child interacts with Claude AI to improve learning recommendations.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.emailNotifications}
              onChange={() => handleSettingChange('emailNotifications')}
              color="primary"
            />
          }
          label="Receive email notifications about content safety"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Get notified when potentially inappropriate content is detected.
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveOutlined />}
          onClick={handleSaveSettings}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          Save Privacy Settings
        </Button>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityOutlined sx={{ mr: 1 }} color="primary" />
          <Typography variant="h6">
            Data Management
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          You can export all your data or delete your account and all associated data.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadOutlined />}
            onClick={handleExportData}
            disabled={loading}
          >
            Export All Data
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutline />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading}
          >
            Delete Account
          </Button>
        </Box>
      </Paper>
      
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Warning: This action cannot be undone. All your account data, including child profiles, study plans, and progress data will be permanently deleted.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
            To confirm, please type DELETE in the field below:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} color="error" disabled={deleteConfirmText !== 'DELETE'}>
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountPrivacySettings;