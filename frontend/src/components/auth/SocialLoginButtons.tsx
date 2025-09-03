import React from 'react';
import { Box, Button, Divider, Typography, CircularProgress } from '@mui/material';
import { Google, Apple } from '@mui/icons-material';
import InstagramIcon from '@mui/icons-material/Instagram';

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: 'google' | 'apple' | 'instagram') => void;
  isLoading?: boolean;
  loadingProvider?: string;
  disabled?: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onSocialLogin,
  isLoading = false,
  loadingProvider,
  disabled = false,
}) => {
  const socialProviders = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: <Google />,
      color: '#4285f4',
      hoverColor: '#357ae8',
    },
    {
      id: 'apple' as const,
      name: 'Apple',
      icon: <Apple />,
      color: '#000000',
      hoverColor: '#333333',
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      icon: <InstagramIcon />,
      color: '#E4405F',
      hoverColor: '#d73559',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
        <Divider sx={{ flex: 1 }} />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, fontWeight: 500 }}
        >
          Or continue with
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {socialProviders.map((provider) => (
          <Button
            key={provider.id}
            variant="outlined"
            fullWidth
            disabled={disabled || (isLoading && loadingProvider !== provider.id)}
            onClick={() => onSocialLogin(provider.id)}
            startIcon={
              isLoading && loadingProvider === provider.id ? (
                <CircularProgress size={20} />
              ) : (
                provider.icon
              )
            }
            sx={{
              py: 1.5,
              borderColor: provider.color,
              color: provider.color,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              position: 'relative',
              '&:hover': {
                borderColor: provider.hoverColor,
                backgroundColor: `${provider.color}08`,
                color: provider.hoverColor,
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {isLoading && loadingProvider === provider.id
              ? `Connecting to ${provider.name}...`
              : `Continue with ${provider.name}`}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default SocialLoginButtons;