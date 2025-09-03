import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Google,
  Apple,
  Close as CloseIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import InstagramIcon from '@mui/icons-material/Instagram';
import { oauthApi } from '../../services/api';
import toast from 'react-hot-toast';

interface LinkedAccount {
  provider: string;
  providerEmail?: string;
  linkedAt: string;
}

interface AccountLinkingModalProps {
  open: boolean;
  onClose: () => void;
}

const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  open,
  onClose,
}) => {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socialProviders = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: <Google />,
      color: '#4285f4',
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: <Apple />,
      color: '#000000',
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      icon: <InstagramIcon />,
      color: '#E4405F',
    },
  ];

  useEffect(() => {
    if (open) {
      fetchLinkedAccounts();
    }
  }, [open]);

  const fetchLinkedAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await oauthApi.getLinkedAccounts();
      setLinkedAccounts(response.providers);
    } catch (error: any) {
      console.error('Failed to fetch linked accounts:', error);
      setError('Failed to load linked accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'apple' | 'instagram') => {
    try {
      setActionLoading(provider);
      
      // Initiate OAuth flow for account linking
      const { authUrl } = await oauthApi.initiateAuth(provider, true);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Failed to link account:', error);
      toast.error(error.response?.data?.message || `Failed to link ${provider} account`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkAccount = async (provider: 'google' | 'apple' | 'instagram') => {
    try {
      setActionLoading(provider);
      
      await oauthApi.unlinkAccount(provider);
      
      // Remove from local state
      setLinkedAccounts(prev => prev.filter(account => account.provider !== provider));
      
      toast.success(`Successfully unlinked your ${provider} account`);
    } catch (error: any) {
      console.error('Failed to unlink account:', error);
      toast.error(error.response?.data?.message || `Failed to unlink ${provider} account`);
    } finally {
      setActionLoading(null);
    }
  };

  const isLinked = (provider: string) => {
    return linkedAccounts.some(account => account.provider === provider);
  };

  const getLinkedAccount = (provider: string) => {
    return linkedAccounts.find(account => account.provider === provider);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Manage Connected Accounts
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Link your social accounts for easier sign-in options
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {socialProviders.map((provider, index) => {
              const linked = isLinked(provider.id);
              const linkedAccount = getLinkedAccount(provider.id);
              const isActionLoading = actionLoading === provider.id;

              return (
                <React.Fragment key={provider.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 2,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${provider.color}15`,
                          color: provider.color,
                        }}
                      >
                        {provider.icon}
                      </Box>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {provider.name}
                          </Typography>
                          {linked && (
                            <Chip
                              label="Connected"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        linked && linkedAccount ? (
                          <Box sx={{ mt: 0.5 }}>
                            {linkedAccount.providerEmail && (
                              <Typography variant="body2" color="text.secondary">
                                {linkedAccount.providerEmail}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              Connected on {formatDate(linkedAccount.linkedAt)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not connected
                          </Typography>
                        )
                      }
                    />

                    <ListItemSecondaryAction>
                      {linked ? (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={isActionLoading ? <CircularProgress size={16} /> : <UnlinkIcon />}
                          onClick={() => handleUnlinkAccount(provider.id)}
                          disabled={isActionLoading}
                          sx={{ minWidth: 100 }}
                        >
                          {isActionLoading ? 'Unlinking...' : 'Unlink'}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={isActionLoading ? <CircularProgress size={16} /> : <LinkIcon />}
                          onClick={() => handleLinkAccount(provider.id)}
                          disabled={isActionLoading}
                          sx={{ 
                            minWidth: 100,
                            borderColor: provider.color,
                            color: provider.color,
                            '&:hover': {
                              borderColor: provider.color,
                              backgroundColor: `${provider.color}08`,
                            },
                          }}
                        >
                          {isActionLoading ? 'Linking...' : 'Link'}
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < socialProviders.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Linking social accounts allows you to sign in using those providers. 
            You can unlink accounts at any time, but make sure you have at least one way to access your account.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountLinkingModal;