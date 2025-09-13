import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import ParentDashboardLayout from '../layout/ParentDashboardLayout';
import ParentProgressDashboard from './ParentProgressDashboard';
import ParentalMonitoringDashboard from './ParentalMonitoringDashboard';
import EnhancedAnalyticsDashboard from './EnhancedAnalyticsDashboard';

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
      id={`parent-dashboard-tabpanel-${index}`}
      aria-labelledby={`parent-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const ParentDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getTabProps = (index: number) => ({
    id: `parent-dashboard-tab-${index}`,
    'aria-controls': `parent-dashboard-tabpanel-${index}`,
  });

  return (
    <ParentDashboardLayout
      title="Parent Dashboard"
      breadcrumbs={[
        { label: 'Dashboard' }
      ]}
      actions={
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh All
        </Button>
      }
    >
      <Box sx={{ width: '100%' }}>
        {/* Welcome Message */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1">
            Welcome to your parent dashboard! Here you can monitor your children's learning progress, 
            view detailed analytics, and ensure their safety while using the platform.
          </Typography>
        </Alert>

        {/* Navigation Tabs */}
        <Paper elevation={0} sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
              }
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Progress Overview" 
              iconPosition="start"
              {...getTabProps(0)}
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Safety Monitoring" 
              iconPosition="start"
              {...getTabProps(1)}
            />
            <Tab 
              icon={<AnalyticsIcon />} 
              label="Detailed Analytics" 
              iconPosition="start"
              {...getTabProps(2)}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Children's Learning Progress
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Real-time overview of your children's study progress, completion rates, and recent activities.
              Data is automatically updated every 30 seconds to show the latest progress.
            </Typography>
          </Box>
          <ParentProgressDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Safety & Security Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monitor your children's activity patterns, login sessions, and security alerts to ensure 
              safe usage of the platform.
            </Typography>
          </Box>
          <ParentalMonitoringDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Detailed Learning Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Comprehensive analytics and insights into your children's learning patterns, 
              performance trends, and areas for improvement.
            </Typography>
          </Box>
          <EnhancedAnalyticsDashboard />
        </TabPanel>
      </Box>
    </ParentDashboardLayout>
  );
};

export default ParentDashboardPage;