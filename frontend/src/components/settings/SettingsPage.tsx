import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Palette as ThemeIcon,
  Notifications as NotificationIcon,
  Security as PrivacyIcon,
  ChildCare as ChildIcon,
  AccountBox as AccountIcon,
} from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeContext';
import GeneralSettings from './GeneralSettings';
import NotificationSettings from './NotificationSettings';
import PrivacySettings from './PrivacySettings';
import ChildSafetySettings from './ChildSafetySettings';
import AccountSettings from './AccountSettings';
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const { userRole } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await profileApi.getSettings();
      setUserSettings(settings);
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSettingsUpdate = (updatedSettings: any) => {
    setUserSettings(updatedSettings);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          fontWeight: 600, 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <SettingsIcon fontSize="large" />
        Settings
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mb: 4 }}
      >
        Manage your account preferences, privacy settings, and application behavior.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={1} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="settings navigation tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<ThemeIcon />}
              iconPosition="start"
              label="General"
              {...a11yProps(0)}
            />
            <Tab
              icon={<NotificationIcon />}
              iconPosition="start"
              label="Notifications"
              {...a11yProps(1)}
            />
            <Tab
              icon={<PrivacyIcon />}
              iconPosition="start"
              label="Privacy"
              {...a11yProps(2)}
            />
            {userRole === 'parent' && (
              <Tab
                icon={<ChildIcon />}
                iconPosition="start"
                label="Child Safety"
                {...a11yProps(3)}
              />
            )}
            <Tab
              icon={<AccountIcon />}
              iconPosition="start"
              label="Account"
              {...a11yProps(userRole === 'parent' ? 4 : 3)}
            />
          </Tabs>
        </Box>

        <Box sx={{ px: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <GeneralSettings 
              settings={userSettings}
              onSettingsUpdate={handleSettingsUpdate}
            />
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <NotificationSettings 
              settings={userSettings}
              onSettingsUpdate={handleSettingsUpdate}
            />
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <PrivacySettings 
              settings={userSettings}
              onSettingsUpdate={handleSettingsUpdate}
            />
          </TabPanel>
          
          {userRole === 'parent' && (
            <TabPanel value={activeTab} index={3}>
              <ChildSafetySettings 
                settings={userSettings}
                onSettingsUpdate={handleSettingsUpdate}
              />
            </TabPanel>
          )}
          
          <TabPanel value={activeTab} index={userRole === 'parent' ? 4 : 3}>
            <AccountSettings />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;