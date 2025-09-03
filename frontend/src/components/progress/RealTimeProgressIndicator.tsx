import React from 'react';
import { 
  Box, 
  Chip, 
  IconButton, 
  Tooltip, 
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Sync,
  SyncDisabled,
  CloudDone,
  CloudOff,
  Warning,
  Backup,
  Restore
} from '@mui/icons-material';
import { useRealTimeProgress } from '../../hooks/useRealTimeProgress';

interface RealTimeProgressIndicatorProps {
  childId?: string;
  showDetails?: boolean;
  onBackupCreate?: () => void;
  onBackupRestore?: (backupId: string) => void;
}

export const RealTimeProgressIndicator: React.FC<RealTimeProgressIndicatorProps> = ({
  childId,
  showDetails = false,
  onBackupCreate,
  onBackupRestore
}) => {
  const {
    isConnected,
    isOnline,
    offlineQueueSize,
    connectionStatus,
    lastSyncTime,
    requestSync,
    createBackup,
    restoreBackup
  } = useRealTimeProgress(childId);

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (connectionStatus === 'connected') return 'success';
    if (connectionStatus === 'connecting') return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff />;
    if (connectionStatus === 'connected') return <Wifi />;
    if (connectionStatus === 'connecting') return <Sync className="animate-spin" />;
    return <SyncDisabled />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (connectionStatus === 'connected') return 'Connected';
    if (connectionStatus === 'connecting') return 'Connecting...';
    if (connectionStatus === 'error') return 'Connection Error';
    return 'Disconnected';
  };

  const handleSyncClick = async () => {
    try {
      await requestSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleBackupCreate = async () => {
    try {
      const backupId = await createBackup();
      if (backupId && onBackupCreate) {
        onBackupCreate();
      }
    } catch (error) {
      console.error('Backup creation failed:', error);
    }
  };

  if (!childId) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Connection Status Chip */}
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        size="small"
        variant={connectionStatus === 'connected' ? 'filled' : 'outlined'}
      />

      {/* Offline Queue Indicator */}
      {offlineQueueSize > 0 && (
        <Tooltip title={`${offlineQueueSize} updates pending sync`}>
          <Chip
            icon={<CloudOff />}
            label={offlineQueueSize}
            color="warning"
            size="small"
            variant="outlined"
          />
        </Tooltip>
      )}

      {/* Manual Sync Button */}
      {isOnline && (
        <Tooltip title="Sync now">
          <IconButton
            size="small"
            onClick={handleSyncClick}
            disabled={connectionStatus === 'connecting'}
          >
            <Sync />
          </IconButton>
        </Tooltip>
      )}

      {/* Backup Controls */}
      {isConnected && (
        <>
          <Tooltip title="Create backup">
            <IconButton size="small" onClick={handleBackupCreate}>
              <Backup />
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <Box sx={{ ml: 2, minWidth: 200 }}>
          {connectionStatus === 'connecting' && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Connecting to sync service...
              </Typography>
              <LinearProgress size="small" />
            </Box>
          )}

          {lastSyncTime && (
            <Typography variant="caption" color="text.secondary">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </Typography>
          )}

          {!isOnline && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                You're offline. Progress will sync when connection is restored.
              </Typography>
            </Alert>
          )}

          {connectionStatus === 'error' && isOnline && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="caption">
                Connection error. Retrying automatically...
              </Typography>
            </Alert>
          )}

          {offlineQueueSize > 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="caption">
                {offlineQueueSize} progress updates waiting to sync
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RealTimeProgressIndicator;