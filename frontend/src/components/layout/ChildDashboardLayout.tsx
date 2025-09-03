import React, { useRef } from 'react';
import { Box, Paper, Typography, Grid, Button, Tooltip } from '@mui/material';
import { Home, Award, HelpCircle } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import AppLayout from './AppLayout';
import { KeyCodes } from '../../utils/keyboardNavigation';
import { useScreenReader } from '../../utils/screenReaderAnnouncements';

interface ChildDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  showHelp?: boolean;
  onHelpClick?: () => void;
  actions?: React.ReactNode;
}

const ChildDashboardLayout: React.FC<ChildDashboardLayoutProps> = ({
  children,
  title,
  showHelp = true,
  onHelpClick,
  actions,
}) => {
  const { announce } = useScreenReader();
  
  // Refs for keyboard navigation
  const homeButtonRef = useRef<HTMLAnchorElement>(null);
  const achievementsButtonRef = useRef<HTMLAnchorElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  
  // Wrap onHelpClick to announce to screen readers
  const handleHelpClick = () => {
    if (onHelpClick) {
      onHelpClick();
      announce("Help assistant opened. You can ask for assistance here.");
    }
  };
  
  // Handle keyboard navigation between navigation buttons
  const handleNavKeyDown = (
    event: React.KeyboardEvent,
    buttonIndex: number,
    totalButtons: number
  ) => {
    switch (event.key) {
      case KeyCodes.ARROW_RIGHT:
        event.preventDefault();
        if (buttonIndex < totalButtons - 1) {
          if (buttonIndex === 0) {
            achievementsButtonRef.current?.focus();
          } else if (buttonIndex === 1 && showHelp) {
            helpButtonRef.current?.focus();
          }
        }
        break;
      case KeyCodes.ARROW_LEFT:
        event.preventDefault();
        if (buttonIndex > 0) {
          if (buttonIndex === 1) {
            homeButtonRef.current?.focus();
          } else if (buttonIndex === 2) {
            achievementsButtonRef.current?.focus();
          }
        }
        break;
      case KeyCodes.HOME:
        event.preventDefault();
        homeButtonRef.current?.focus();
        break;
      case KeyCodes.END:
        event.preventDefault();
        if (showHelp) {
          helpButtonRef.current?.focus();
        } else {
          achievementsButtonRef.current?.focus();
        }
        break;
      default:
        break;
    }
  };
  return (
    <AppLayout disablePadding>
      {/* Header with title */}
      <Box
        sx={{
          p: 3,
          mb: 2,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
          color: 'white',
          borderRadius: { xs: 0, sm: '0 0 24px 24px' },
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {title}
            </Typography>
          </Grid>
          {actions && <Grid item>{actions}</Grid>}
        </Grid>
      </Box>

      {/* Navigation buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mb: 3,
          px: 2,
        }}
        role="navigation"
        aria-label="Main Navigation"
      >
        <Button
          component={RouterLink}
          to="/child-dashboard"
          variant="contained"
          color="primary"
          startIcon={<Home aria-hidden="true" />}
          sx={{
            borderRadius: 4,
            px: 3,
            py: 1,
            boxShadow: 2,
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            }
          }}
          ref={homeButtonRef}
          onKeyDown={(e) => handleNavKeyDown(e, 0, showHelp ? 3 : 2)}
          aria-current={window.location.pathname === '/child-dashboard' ? 'page' : undefined}
        >
          Home
        </Button>
        <Button
          component={RouterLink}
          to="/child/achievements"
          variant="contained"
          color="secondary"
          startIcon={<Award aria-hidden="true" />}
          sx={{
            borderRadius: 4,
            px: 3,
            py: 1,
            boxShadow: 2,
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'secondary.main',
              outlineOffset: '2px',
            }
          }}
          ref={achievementsButtonRef}
          onKeyDown={(e) => handleNavKeyDown(e, 1, showHelp ? 3 : 2)}
          aria-current={window.location.pathname === '/child/achievements' ? 'page' : undefined}
        >
          Achievements
        </Button>
        {showHelp && (
          <Button
            onClick={handleHelpClick}
            variant="contained"
            color="info"
            startIcon={<HelpCircle aria-hidden="true" />}
            sx={{
              borderRadius: 4,
              px: 3,
              py: 1,
              boxShadow: 2,
              '&:focus': {
                outline: '2px solid',
                outlineColor: 'info.main',
                outlineOffset: '2px',
              }
            }}
            ref={helpButtonRef}
            onKeyDown={(e) => handleNavKeyDown(e, 2, 3)}
            aria-label="Get help"
          >
            Help
          </Button>
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ px: 3, pb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: 'background.paper',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {children}
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default ChildDashboardLayout;