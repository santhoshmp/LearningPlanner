import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as EmojiEventsIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { analyticsApi } from '../../services/api';
import { ProgressAlert } from '../../types/analytics';

interface AlertsPanelProps {
  childId?: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ childId }) => {
  const [alerts, setAlerts] = useState<ProgressAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const alertsData = await analyticsApi.getProgressAlerts(false); // Get unread alerts
        
        // Filter alerts by childId if provided
        const filteredAlerts = childId 
          ? alertsData.filter(alert => alert.childId === childId)
          : alertsData;
          
        setAlerts(filteredAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setError('Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
    
    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(intervalId);
  }, [childId]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await analyticsApi.markAlertAsRead(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleDismissAll = async () => {
    try {
      await Promise.all(alerts.map(alert => analyticsApi.markAlertAsRead(alert.id)));
      setAlerts([]);
    } catch (err) {
      console.error('Failed to dismiss all alerts:', err);
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'inactivity':
        return (
          <Avatar sx={{ bgcolor: 'warning.light' }}>
            <AccessTimeIcon sx={{ color: 'warning.dark' }} />
          </Avatar>
        );
      case 'low_performance':
        return (
          <Avatar sx={{ bgcolor: 'error.light' }}>
            <TrendingDownIcon sx={{ color: 'error.dark' }} />
          </Avatar>
        );
      case 'achievement':
      case 'milestone':
        return (
          <Avatar sx={{ bgcolor: 'success.light' }}>
            <EmojiEventsIcon sx={{ color: 'success.dark' }} />
          </Avatar>
        );
      default:
        return (
          <Avatar sx={{ bgcolor: 'info.light' }}>
            <InfoIcon sx={{ color: 'info.dark' }} />
          </Avatar>
        );
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title="Progress Alerts" 
        action={
          alerts.length > 0 && (
            <Button 
              size="small" 
              color="primary"
              onClick={handleDismissAll}
            >
              Dismiss All
            </Button>
          )
        }
      />
      
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
        {loading && alerts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        ) : alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">No new alerts</Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="dismiss" 
                      size="small"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{ py: 2 }}
                >
                  <ListItemAvatar>
                    {getAlertIcon(alert.type, alert.severity)}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {alert.childName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={alert.message}
                    secondaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                {index < alerts.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
      
      {alerts.length > 0 && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {alerts.length} unread alert{alerts.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default AlertsPanel;