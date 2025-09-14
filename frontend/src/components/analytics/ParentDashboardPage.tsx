import React, { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Typography,
  Alert,
  Button,
  Container,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  School as SchoolIcon,
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
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Modern Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid #e2e8f0',
          px: 3,
          py: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          mx: 'auto'
        }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              bgcolor: '#3b82f6',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2
            }}>
              <SchoolIcon />
              <Typography variant="h6" fontWeight="bold">
                Study Plan Pro
              </Typography>
            </Box>
          </Box>

          {/* Navigation Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#64748b',
                  '&.Mui-selected': {
                    color: '#3b82f6',
                    fontWeight: 600,
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#3b82f6',
                  height: 3,
                  borderRadius: '2px 2px 0 0'
                }
              }}
            >
              <Tab 
                icon={<DashboardIcon />} 
                label="Dashboard" 
                iconPosition="start"
                {...getTabProps(0)}
              />
              <Tab 
                icon={<SchoolIcon />} 
                label="Study Plans" 
                iconPosition="start"
                {...getTabProps(1)}
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Reports" 
                iconPosition="start"
                {...getTabProps(2)}
              />
            </Tabs>
          </Box>

          {/* User Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Make a copy">
              <Button 
                variant="outlined" 
                size="small"
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Make a copy
              </Button>
            </Tooltip>
            <Button 
              variant="contained" 
              size="small"
              sx={{ 
                textTransform: 'none',
                bgcolor: '#3b82f6',
                '&:hover': {
                  bgcolor: '#2563eb'
                }
              }}
            >
              Share
            </Button>
            <Tooltip title="User Profile">
              <IconButton>
                <PersonIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Log Out">
              <IconButton>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        {/* Tab Content */}
        <TabPanel value={tabValue} index={0}>
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
      </Container>
    </Box>
  );
};

export default ParentDashboardPage;