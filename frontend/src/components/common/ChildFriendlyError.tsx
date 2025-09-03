import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Collapse,
  Chip,
  Stack,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChildFriendlyError {
  title: string;
  message: string;
  icon: string;
  severity: 'info' | 'warning' | 'error';
  actionButton?: {
    text: string;
    action: string;
  };
  parentNotification: boolean;
  recoveryOptions: RecoveryOption[];
}

export interface RecoveryOption {
  id: string;
  text: string;
  action: string;
  icon: string;
}

interface ChildFriendlyErrorProps {
  error: ChildFriendlyError;
  onAction: (action: string) => void;
  onDismiss: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const ChildFriendlyErrorComponent: React.FC<ChildFriendlyErrorProps> = ({
  error,
  onAction,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const theme = useTheme();
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && error.severity === 'info') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow animation to complete
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error.severity, onDismiss]);

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'info':
        return theme.palette.info.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getSeverityBackground = () => {
    switch (error.severity) {
      case 'info':
        return theme.palette.info.light;
      case 'warning':
        return theme.palette.warning.light;
      case 'error':
        return theme.palette.error.light;
      default:
        return theme.palette.primary.light;
    }
  };

  const handleActionClick = (action: string) => {
    onAction(action);
    if (action === 'retry' || action === 'retry_login' || action === 'retry_connection') {
      // Auto-dismiss on retry actions
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 1000);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card
            sx={{
              mb: 2,
              border: `2px solid ${getSeverityColor()}`,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${getSeverityBackground()}15, ${getSeverityBackground()}05)`,
              boxShadow: `0 4px 20px ${getSeverityColor()}20`,
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box display="flex" alignItems="center" flex={1}>
                  <motion.div
                    animate={{ 
                      rotate: error.severity === 'error' ? [0, -10, 10, -10, 0] : 0,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: error.severity === 'error' ? 0.5 : 0.3,
                      repeat: error.severity === 'error' ? 2 : 0
                    }}
                  >
                    <Typography
                      variant="h2"
                      sx={{
                        fontSize: '2.5rem',
                        mr: 2,
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))'
                      }}
                    >
                      {error.icon}
                    </Typography>
                  </motion.div>
                  
                  <Box flex={1}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: getSeverityColor(),
                        fontSize: '1.25rem',
                        mb: 1
                      }}
                    >
                      {error.title}
                    </Typography>
                    
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: '1rem',
                        lineHeight: 1.5
                      }}
                    >
                      {error.message}
                    </Typography>

                    {error.parentNotification && (
                      <Chip
                        label="👨‍👩‍👧‍👦 Parent will be notified"
                        size="small"
                        sx={{
                          mt: 1,
                          backgroundColor: theme.palette.info.light,
                          color: theme.palette.info.dark,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </Box>
                </Box>

                <IconButton
                  onClick={onDismiss}
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: getSeverityColor() + '20'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Primary Action Button */}
              {error.actionButton && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleActionClick(error.actionButton!.action)}
                    sx={{
                      backgroundColor: getSeverityColor(),
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: `0 4px 12px ${getSeverityColor()}40`,
                      '&:hover': {
                        backgroundColor: getSeverityColor(),
                        filter: 'brightness(1.1)',
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 16px ${getSeverityColor()}50`
                      },
                      transition: 'all 0.2s ease'
                    }}
                    startIcon={<RefreshIcon />}
                  >
                    {error.actionButton.text}
                  </Button>
                </Box>
              )}

              {/* Recovery Options */}
              {error.recoveryOptions.length > 1 && (
                <Box mt={2}>
                  <Button
                    onClick={() => setShowRecoveryOptions(!showRecoveryOptions)}
                    sx={{
                      color: getSeverityColor(),
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 'medium'
                    }}
                    endIcon={showRecoveryOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                    More Options
                  </Button>

                  <Collapse in={showRecoveryOptions}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                      {error.recoveryOptions.slice(1).map((option) => (
                        <Button
                          key={option.id}
                          variant="outlined"
                          size="small"
                          onClick={() => handleActionClick(option.action)}
                          sx={{
                            borderColor: getSeverityColor(),
                            color: getSeverityColor(),
                            textTransform: 'none',
                            fontSize: '0.85rem',
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: getSeverityColor() + '10',
                              borderColor: getSeverityColor()
                            }
                          }}
                          startIcon={
                            <span style={{ fontSize: '1rem' }}>{option.icon}</span>
                          }
                        >
                          {option.text}
                        </Button>
                      ))}
                    </Stack>
                  </Collapse>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChildFriendlyErrorComponent;