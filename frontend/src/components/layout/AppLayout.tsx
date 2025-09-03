import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenReaderProvider } from '../../utils/screenReaderAnnouncements';

interface AppLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
  hideFooter?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  hideFooter = false,
}) => {
  const { theme } = useTheme();

  return (
    <ScreenReaderProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CssBaseline />
        <AppHeader />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            py: disablePadding ? 0 : 3,
          }}
        >
          <Container maxWidth={maxWidth} disableGutters={disablePadding}>
            {children}
          </Container>
        </Box>
        {!hideFooter && <AppFooter />}
      </Box>
    </ScreenReaderProvider>
  );
};

export default AppLayout;