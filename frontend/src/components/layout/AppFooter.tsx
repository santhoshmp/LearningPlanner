import React, { useRef } from 'react';
import { Box, Container, Typography, Link, Divider, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { KeyCodes } from '../../utils/keyboardNavigation';
import TextSizeAdjuster from './TextSizeAdjuster';

const AppFooter: React.FC = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();
  
  // Refs for keyboard navigation
  const resourcesRef = useRef<HTMLDivElement>(null);
  const legalRef = useRef<HTMLDivElement>(null);
  
  // Handle keyboard navigation between footer links
  const handleFooterKeyDown = (
    event: React.KeyboardEvent, 
    currentIndex: number, 
    links: NodeListOf<HTMLAnchorElement>,
    nextGroupRef?: React.RefObject<HTMLDivElement>
  ) => {
    switch (event.key) {
      case KeyCodes.ARROW_DOWN:
        event.preventDefault();
        if (currentIndex < links.length - 1) {
          links[currentIndex + 1].focus();
        } else if (nextGroupRef?.current) {
          // Move to the first link in the next group
          const nextLinks = nextGroupRef.current.querySelectorAll('a');
          if (nextLinks.length > 0) {
            nextLinks[0].focus();
          }
        }
        break;
      case KeyCodes.ARROW_UP:
        event.preventDefault();
        if (currentIndex > 0) {
          links[currentIndex - 1].focus();
        }
        break;
      case KeyCodes.HOME:
        event.preventDefault();
        links[0].focus();
        break;
      case KeyCodes.END:
        event.preventDefault();
        links[links.length - 1].focus();
        break;
      default:
        break;
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 0 } }}>
            <Typography
              variant="h6"
              color="text.primary"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              AI Study Planner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personalized learning for every child
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 4 },
              alignItems: { xs: 'center', sm: 'flex-start' },
            }}
          >
            <Box 
              sx={{ textAlign: { xs: 'center', sm: 'left' } }}
              ref={resourcesRef}
            >
              <Typography 
                variant="subtitle2" 
                color="text.primary" 
                gutterBottom
                component="h2"
                id="resources-heading"
              >
                Resources
              </Typography>
              <Box 
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                role="navigation"
                aria-labelledby="resources-heading"
              >
                <Link 
                  component={RouterLink} 
                  to="/help" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    const links = resourcesRef.current?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
                    handleFooterKeyDown(e, 0, links, legalRef);
                  }}
                >
                  Help Center
                </Link>
                <Link 
                  component={RouterLink} 
                  to="/faq" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    const links = resourcesRef.current?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
                    handleFooterKeyDown(e, 1, links, legalRef);
                  }}
                >
                  FAQ
                </Link>
                <Link 
                  component={RouterLink} 
                  to="/contact" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    const links = resourcesRef.current?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
                    handleFooterKeyDown(e, 2, links, legalRef);
                  }}
                >
                  Contact Us
                </Link>
              </Box>
            </Box>

            <Box 
              sx={{ textAlign: { xs: 'center', sm: 'left' } }}
              ref={legalRef}
            >
              <Typography 
                variant="subtitle2" 
                color="text.primary" 
                gutterBottom
                component="h2"
                id="legal-heading"
              >
                Legal
              </Typography>
              <Box 
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                role="navigation"
                aria-labelledby="legal-heading"
              >
                <Link 
                  component={RouterLink} 
                  to="/privacy" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    const links = legalRef.current?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
                    handleFooterKeyDown(e, 0, links);
                  }}
                >
                  Privacy Policy
                </Link>
                <Link 
                  component={RouterLink} 
                  to="/terms" 
                  color="text.secondary" 
                  underline="hover"
                  sx={{
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    }
                  }}
                  onKeyDown={(e) => {
                    const links = legalRef.current?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
                    handleFooterKeyDown(e, 1, links);
                  }}
                >
                  Terms of Service
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {year} AI Study Planner. All rights reserved.
          </Typography>
          
          {/* Text size adjuster for accessibility */}
          <TextSizeAdjuster />
        </Box>
      </Container>
    </Box>
  );
};

export default AppFooter;