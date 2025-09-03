import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Google,
  Apple,
} from '@mui/icons-material';
import InstagramIcon from '@mui/icons-material/Instagram';

interface ConflictAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt?: string;
  provider?: string;
  isCurrentAccount?: boolean;
}

interface AccountConflictResolverProps {
  open: boolean;
  onClose: () => void;
  conflictData: {
    provider: string;
    providerEmail: string;
    existingAccount: ConflictAccount;
    socialAccount: ConflictAccount;
  } | null;
  onResolve: (resolution: 'merge' | 'create_new' | 'cancel') => void;
  loading?: boolean;
}

const AccountConflictResolver: React.FC<AccountConflictResolverProps> = ({
  open,
  onClose,
  conflictData,
  onResolve,
  loading = false,
}) => {
  const [resolution, setResolution] = useState<'merge' | 'create_new'>('merge');

  if (!conflictData) return null;

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return <Google sx={{ color: '#4285f4' }} />;
      case 'apple':
        return <Apple sx={{ color: '#000000' }} />;
      case 'instagram':
        return <InstagramIcon sx={{ color: '#E4405F' }} />;
      default:
        return <PersonIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = () => {
    onResolve(resolution);
  };

  const handleCancel = () => {
    onResolve('cancel');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'warning.main' }}>
            <WarningIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Account Conflict Detected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We found an existing account with the same email address
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Email Address Already in Use</AlertTitle>
          The email address <strong>{conflictData.providerEmail}</strong> from your{' '}
          {conflictData.provider} account is already associated with an existing account.
          Please choose how you'd like to proceed.
        </Alert>

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Existing Account */}
          <Card sx={{ flex: 1, border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Existing Account
                  </Typography>
                  <Chip label="Current" size="small" color="primary" />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {conflictData.existingAccount.firstName} {conflictData.existingAccount.lastName}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {conflictData.existingAccount.email}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    Created: {formatDate(conflictData.existingAccount.createdAt)}
                  </Typography>
                </Box>
                
                {conflictData.existingAccount.lastLoginAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      Last login: {formatDate(conflictData.existingAccount.lastLoginAt)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Social Account */}
          <Card sx={{ flex: 1, border: '2px solid', borderColor: 'secondary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {getProviderIcon(conflictData.provider)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {conflictData.provider} Account
                  </Typography>
                  <Chip label="Social Login" size="small" color="secondary" />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {conflictData.socialAccount.firstName} {conflictData.socialAccount.lastName}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {conflictData.socialAccount.email}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          How would you like to proceed?
        </Typography>

        <RadioGroup
          value={resolution}
          onChange={(e) => setResolution(e.target.value as 'merge' | 'create_new')}
        >
          <Card sx={{ mb: 2, border: resolution === 'merge' ? '2px solid' : '1px solid', borderColor: resolution === 'merge' ? 'primary.main' : 'divider' }}>
            <CardContent sx={{ py: 2 }}>
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Link {conflictData.provider} to existing account (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect your {conflictData.provider} account to your existing account. 
                      You'll be able to sign in using either method.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </CardContent>
          </Card>

          <Card sx={{ border: resolution === 'create_new' ? '2px solid' : '1px solid', borderColor: resolution === 'create_new' ? 'primary.main' : 'divider' }}>
            <CardContent sx={{ py: 2 }}>
              <FormControlLabel
                value="create_new"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Create a new account
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create a separate account for your {conflictData.provider} login. 
                      You'll have two different accounts with the same email.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </CardContent>
          </Card>
        </RadioGroup>

        {resolution === 'create_new' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Creating a new account means you'll have separate profiles, 
              study plans, and progress tracking. Consider linking accounts instead to keep 
              everything in one place.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleResolve}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Processing...' : resolution === 'merge' ? 'Link Accounts' : 'Create New Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountConflictResolver;