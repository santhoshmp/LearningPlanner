import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import { profileApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SimpleProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadProfile}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 3 }}>
          <Tab label="Profile Information" />
          <Tab label="Avatar" />
          <Tab label="Account Linking" />
          <Tab label="Settings Integration" />
          <Tab label="Audit Trail" />
        </Tabs>
      </Paper>

      <Paper>
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          {profile ? (
            <Box>
              <Typography variant="body1">
                <strong>Name:</strong> {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {profile.email}
              </Typography>
              <Typography variant="body1">
                <strong>Role:</strong> {profile.role}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No profile data available
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Avatar Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Avatar upload functionality coming soon...
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Account Linking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Social account linking functionality coming soon...
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Settings Integration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Settings integration functionality coming soon...
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Audit Trail
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Audit trail functionality coming soon...
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SimpleProfilePage;