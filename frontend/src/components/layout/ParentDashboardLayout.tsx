import React from 'react';
import { Box, Paper, Typography, Grid, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AppLayout from './AppLayout';
import { KeyCodes } from '../../utils/keyboardNavigation';

interface ParentDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  actions?: React.ReactNode;
}

const ParentDashboardLayout: React.FC<ParentDashboardLayoutProps> = ({
  children,
  title,
  breadcrumbs = [],
  actions,
}) => {
  return (
    <AppLayout>
      <Box sx={{ mb: 4 }}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumbs 
            sx={{ mb: 2 }}
            aria-label="breadcrumb navigation"
            separator="›"
          >
            <MuiLink
              component={RouterLink}
              to="/dashboard"
              underline="hover"
              color="inherit"
              sx={{
                '&:focus': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                }
              }}
              onKeyDown={(e) => {
                // Handle left/right arrow navigation between breadcrumbs
                if (e.key === KeyCodes.ARROW_RIGHT && breadcrumbs.length > 0) {
                  e.preventDefault();
                  const nextLink = document.querySelector('[data-breadcrumb-index="0"]') as HTMLElement;
                  nextLink?.focus();
                }
              }}
            >
              Dashboard
            </MuiLink>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography 
                  color="text.primary" 
                  key={crumb.label}
                  aria-current="page"
                >
                  {crumb.label}
                </Typography>
              ) : (
                <MuiLink
                  component={RouterLink}
                  to={crumb.path || '#'}
                  underline="hover"
                  color="inherit"
                  key={crumb.label}
                  data-breadcrumb-index={index}
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    // Handle left/right arrow navigation between breadcrumbs
                    if (e.key === KeyCodes.ARROW_LEFT && index === 0) {
                      e.preventDefault();
                      const dashboardLink = document.querySelector('[aria-label="breadcrumb navigation"] a') as HTMLElement;
                      dashboardLink?.focus();
                    } else if (e.key === KeyCodes.ARROW_LEFT && index > 0) {
                      e.preventDefault();
                      const prevLink = document.querySelector(`[data-breadcrumb-index="${index - 1}"]`) as HTMLElement;
                      prevLink?.focus();
                    } else if (e.key === KeyCodes.ARROW_RIGHT && index < breadcrumbs.length - 1) {
                      e.preventDefault();
                      const nextLink = document.querySelector(`[data-breadcrumb-index="${index + 1}"]`) as HTMLElement;
                      nextLink?.focus();
                    }
                  }}
                >
                  {crumb.label}
                </MuiLink>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Header with title and actions */}
        <Grid container alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Grid item xs>
            <Typography variant="h4" component="h1" gutterBottom>
              {title}
            </Typography>
          </Grid>
          {actions && (
            <Grid item>{actions}</Grid>
          )}
        </Grid>

        {/* Main content */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none',
          }}
        >
          {children}
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default ParentDashboardLayout;