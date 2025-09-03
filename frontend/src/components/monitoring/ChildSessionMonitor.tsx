import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import {
  Security as SecurityIcon,
  AccessTime as TimeIcon,
  Computer as DeviceIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  PowerSettingsNew as TerminateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useChildSessionMonitoring } from '../../hooks/useChildSessionMonitoring';

interface ChildSessionMonitorProps {
  childId: string;
  childName: string;
}

const ChildSessionMonitor: React.FC<ChildSessionMonitorProps> = ({
  childId,
  childName
}) => {
  const {
    sessionInfo,
    securityLogs,
    isLoading,
    error,
    getSessionInfo,
    terminateSession,
    getSecurityLogs,
    formatDuration,
    getSessionStatusColor,
    getSecurityLogColor
  } = useChildSessionMonitoring(childId);

  const [showSecurityLogs, setShowSecurityLogs] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);

  useEffect(() => {
    // Load security logs when component mounts
    getSecurityLogs();
  }, [getSecurityLogs]);

  const handleTerminateSession = async () => {
    const success = await terminateSession('PARENT_TERMINATED');
    if (success) {
      setShowTerminateDialog(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <ErrorIcon color="error" />;
      case 'MEDIUM': return <WarningIcon color="warning" />;
      case 'LOW': return <InfoIcon color="info" />;
      case 'INFO': return <SuccessIcon color="success" />;
      default: return <InfoIcon />;
    }
  };

  const formatEventName = (event: string): string => {
    return event.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading && !sessionInfo) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={`${childName}'s Session Monitor`}
          action={
            <Button
              startIcon={<RefreshIcon />}
              onClick={getSessionInfo}
              disabled={isLoading}
              size="small"
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Session Status */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Session Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Chip
                    label={sessionInfo?.isActive ? 'Active' : 'Inactive'}
                    color={sessionInfo?.isActive ? 'success' : 'default'}
                    size="small"
                  />
                  {sessionInfo?.isActive && (
                    <Button
                      startIcon={<TerminateIcon />}
                      onClick={() => setShowTerminateDialog(true)}
                      color="error"
                      size="small"
                      variant="outlined"
                    >
                      Terminate
                    </Button>
                  )}
                </Box>

                {sessionInfo?.isActive && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TimeIcon fontSize="small" />
                      <Typography variant="body2">
                        Duration: {formatDuration(sessionInfo.duration)}
                      </Typography>
                    </Box>
                    {sessionInfo.loginTime && (
                      <Typography variant="body2" color="text.secondary">
                        Started: {new Date(sessionInfo.loginTime).toLocaleString()}
                      </Typography>
                    )}
                    {sessionInfo.lastActivity && (
                      <Typography variant="body2" color="text.secondary">
                        Last Activity: {new Date(sessionInfo.lastActivity).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}

                {!sessionInfo?.isActive && (
                  <Typography variant="body2" color="text.secondary">
                    No active session
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Security Overview */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Security Overview
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SecurityIcon fontSize="small" />
                  <Typography variant="body2">
                    {securityLogs.length} recent events
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowSecurityLogs(true)}
                    disabled={securityLogs.length === 0}
                  >
                    View Details
                  </Button>
                </Box>

                {securityLogs.length > 0 && (
                  <Box>
                    {securityLogs.slice(0, 3).map((log) => (
                      <Box key={log.id} display="flex" alignItems="center" gap={1} mb={1}>
                        {getSeverityIcon(log.severity)}
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {formatEventName(log.event)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ))}
                    {securityLogs.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        +{securityLogs.length - 3} more events
                      </Typography>
                    )}
                  </Box>
                )}

                {securityLogs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No recent security events
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Logs Dialog */}
      <Dialog
        open={showSecurityLogs}
        onClose={() => setShowSecurityLogs(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Security Logs for {childName}</DialogTitle>
        <DialogContent>
          {securityLogs.length > 0 ? (
            <List>
              {securityLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getSeverityIcon(log.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={formatEventName(log.event)}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(log.createdAt).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            IP: {log.ipAddress}
                          </Typography>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                              Details: {JSON.stringify(log.metadata, null, 2)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      label={log.severity}
                      color={getSecurityLogColor(log.severity) as any}
                      size="small"
                    />
                  </ListItem>
                  {index < securityLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography>No security logs available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityLogs(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Session Dialog */}
      <Dialog
        open={showTerminateDialog}
        onClose={() => setShowTerminateDialog(false)}
      >
        <DialogTitle>Terminate Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to terminate {childName}'s current session? 
            They will be logged out immediately and will need to log in again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerminateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTerminateSession}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Terminate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChildSessionMonitor;