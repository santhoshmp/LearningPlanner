import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import AccountLinkingModal from '../auth/AccountLinkingModal';

const AccountSettings: React.FC = () => {
  const [linkingModalOpen, setLinkingModalOpen] = useState(false);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Connected Accounts
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Social Login Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Link your social media accounts to sign in more easily. You can manage 
            which accounts are connected and remove them at any time.
          </Typography>
        </CardContent>
        <Divider />
        <CardActions>
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => setLinkingModalOpen(true)}
          >
            Manage Connected Accounts
          </Button>
        </CardActions>
      </Card>

      <AccountLinkingModal
        open={linkingModalOpen}
        onClose={() => setLinkingModalOpen(false)}
      />
    </Box>
  );
};

export default AccountSettings;