import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestPages: React.FC = () => {
  const navigate = useNavigate();

  const testPages = [
    { name: 'Profile', path: '/profile' },
    { name: 'Settings', path: '/settings' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Master Data Test', path: '/test-master-data' },
  ];

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Page Navigation Test
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Use these buttons to test navigation to different pages. All pages should load without errors.
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {testPages.map((page) => (
          <Button
            key={page.path}
            variant="outlined"
            onClick={() => navigate(page.path)}
            sx={{ justifyContent: 'flex-start', p: 2 }}
          >
            Go to {page.name} Page
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Debug Info:
        </Typography>
        <Typography variant="body2">
          Current URL: {window.location.pathname}
        </Typography>
        <Typography variant="body2">
          API Base URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}
        </Typography>
      </Box>
    </Box>
  );
};

export default TestPages;