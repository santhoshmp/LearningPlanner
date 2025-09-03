/**
 * Tablet-optimized layout component for educational settings
 * Provides responsive design with child-friendly interactions
 */

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  styled,
  alpha
} from '@mui/material';
import { useMobileOptimizations, usePerformanceMonitoring } from '../../hooks/useMobileOptimizations';

interface TabletOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showPerformanceIndicator?: boolean;
  educationalMode?: boolean;
}

const LayoutContainer = styled(Box)<{ isTablet: boolean; educationalMode: boolean }>(
  ({ theme, isTablet, educationalMode }) => ({
    minHeight: '100vh',
    backgroundColor: educationalMode 
      ? theme.palette.background.default 
      : theme.palette.background.paper,
    padding: isTablet ? theme.spacing(2) : theme.spacing(1),
    
    // Optimize for tablet viewing angles
    ...(isTablet && {
      fontSize: '1.1rem',
      lineHeight: 1.6,
      
      // Reduce eye strain with softer colors
      '& .MuiPaper-root': {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)'
      }
    })
  })
);

const MainContent = styled(Box)<{ hasSidebar: boolean; isTablet: boolean }>(
  ({ theme, hasSidebar, isTablet }) => ({
    flex: 1,
    padding: theme.spacing(2),
    
    ...(isTablet && {
      padding: theme.spacing(3),
      
      // Optimize content width for reading
      maxWidth: hasSidebar ? '100%' : '800px',
      margin: hasSidebar ? 0 : '0 auto'
    })
  })
);

const Sidebar = styled(Paper)<{ isTablet: boolean }>(
  ({ theme, isTablet }) => ({
    padding: theme.spacing(2),
    height: 'fit-content',
    position: 'sticky',
    top: theme.spacing(2),
    
    ...(isTablet && {
      padding: theme.spacing(3),
      minWidth: '280px',
      
      // Larger touch targets in sidebar
      '& .MuiButton-root': {
        minHeight: '48px',
        fontSize: '1.1rem'
      },
      
      '& .MuiListItem-root': {
        minHeight: '56px',
        padding: theme.spacing(1.5, 2)
      }
    })
  })
);

const PerformanceIndicator = styled(Box)<{ level: 'good' | 'warning' | 'critical' }>(
  ({ theme, level }) => {
    const colors = {
      good: theme.palette.success.main,
      warning: theme.palette.warning.main,
      critical: theme.palette.error.main
    };
    
    return {
      position: 'fixed',
      top: theme.spacing(1),
      right: theme.spacing(1),
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: colors[level],
      zIndex: theme.zIndex.tooltip,
      opacity: 0.7,
      transition: theme.transitions.create(['opacity', 'transform'], {
        duration: theme.transitions.duration.short
      }),
      
      '&:hover': {
        opacity: 1,
        transform: 'scale(1.2)'
      }
    };
  }
);

const HeaderSection = styled(Box)<{ isTablet: boolean }>(
  ({ theme, isTablet }) => ({
    marginBottom: theme.spacing(3),
    
    ...(isTablet && {
      marginBottom: theme.spacing(4),
      
      '& .MuiTypography-h1, & .MuiTypography-h2': {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.2
      },
      
      '& .MuiTypography-h3': {
        fontSize: '2rem',
        fontWeight: 500
      }
    })
  })
);

const FooterSection = styled(Box)<{ isTablet: boolean }>(
  ({ theme, isTablet }) => ({
    marginTop: 'auto',
    padding: theme.spacing(2, 0),
    borderTop: `1px solid ${theme.palette.divider}`,
    
    ...(isTablet && {
      padding: theme.spacing(3, 0),
      
      '& .MuiButton-root': {
        minHeight: '48px',
        minWidth: '120px',
        fontSize: '1.1rem'
      }
    })
  })
);

export const TabletOptimizedLayout: React.FC<TabletOptimizedLayoutProps> = ({
  children,
  title,
  sidebar,
  header,
  footer,
  showPerformanceIndicator = false,
  educationalMode = false
}) => {
  const theme = useTheme();
  const { isTablet, orientation, screenSize, batteryStatus } = useMobileOptimizations();
  const { performanceMetrics, shouldOptimizePerformance } = usePerformanceMonitoring();
  
  const isLandscape = orientation === 'landscape';
  const hasSidebar = Boolean(sidebar);
  
  // Determine performance level for indicator
  const getPerformanceLevel = (): 'good' | 'warning' | 'critical' => {
    if (shouldOptimizePerformance()) return 'critical';
    if (batteryStatus.lowPowerMode || performanceMetrics.memoryUsage > 0.6) return 'warning';
    return 'good';
  };

  // Responsive grid configuration
  const getGridConfig = () => {
    if (!hasSidebar) return { main: 12 };
    
    if (isTablet && isLandscape) {
      return { sidebar: 3, main: 9 };
    } else if (isTablet) {
      return { sidebar: 4, main: 8 };
    } else {
      return { sidebar: 12, main: 12 }; // Stack on mobile
    }
  };

  const gridConfig = getGridConfig();

  return (
    <LayoutContainer 
      isTablet={isTablet} 
      educationalMode={educationalMode}
    >
      {/* Performance Indicator */}
      {showPerformanceIndicator && (
        <PerformanceIndicator 
          level={getPerformanceLevel()}
          title={`Performance: ${getPerformanceLevel()}`}
        />
      )}

      <Container 
        maxWidth={false}
        sx={{ 
          maxWidth: isTablet ? '1400px' : '100%',
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {/* Header Section */}
        {(header || title) && (
          <HeaderSection isTablet={isTablet}>
            {header || (
              <Typography 
                variant="h2" 
                component="h1"
                sx={{
                  color: 'primary.main',
                  textAlign: isTablet ? 'left' : 'center',
                  mb: 2
                }}
              >
                {title}
              </Typography>
            )}
          </HeaderSection>
        )}

        {/* Main Layout */}
        <Grid container spacing={isTablet ? 3 : 2}>
          {/* Sidebar */}
          {hasSidebar && (
            <Grid 
              item 
              xs={12} 
              md={gridConfig.sidebar}
              sx={{
                order: { xs: 2, md: 1 },
                ...(screenSize === 'small' && {
                  order: 2 // Always show sidebar after content on mobile
                })
              }}
            >
              <Sidebar isTablet={isTablet}>
                {sidebar}
              </Sidebar>
            </Grid>
          )}

          {/* Main Content */}
          <Grid 
            item 
            xs={12} 
            md={gridConfig.main}
            sx={{
              order: { xs: 1, md: hasSidebar ? 2 : 1 }
            }}
          >
            <MainContent hasSidebar={hasSidebar} isTablet={isTablet}>
              {children}
            </MainContent>
          </Grid>
        </Grid>

        {/* Footer Section */}
        {footer && (
          <FooterSection isTablet={isTablet}>
            {footer}
          </FooterSection>
        )}
      </Container>
    </LayoutContainer>
  );
};

export default TabletOptimizedLayout;