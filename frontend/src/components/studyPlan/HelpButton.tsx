import React, { useState } from 'react';
import { Button, Badge, Tooltip } from '@mui/material';
import { HelpOutline, Psychology, AutoAwesome } from '@mui/icons-material';
import ClaudeHelpAssistant from './ClaudeHelpAssistant';
import { HelpRequest } from '../../types/activity';
import { useTheme } from '../../theme/ThemeContext';

interface HelpButtonProps {
  onRequestHelp: (question: string) => Promise<HelpRequest>;
  activityId: string;
  childId: string;
  childAge: number;
  activityContext: {
    title: string;
    subject: string;
    currentStep?: number;
    currentContent?: any;
  };
  helpRequestCount?: number;
  onHelpRequestTracked?: (helpRequest: HelpRequest) => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ 
  onRequestHelp, 
  activityId, 
  childId,
  childAge, 
  activityContext,
  helpRequestCount = 0,
  onHelpRequestTracked
}) => {
  const [showHelpAssistant, setShowHelpAssistant] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme } = useTheme();

  // Enhanced help request handler with tracking
  const handleHelpRequest = async (question: string): Promise<HelpRequest> => {
    try {
      const helpRequest = await onRequestHelp(question);
      
      // Track the help request for analytics
      if (onHelpRequestTracked) {
        onHelpRequestTracked(helpRequest);
      }

      // Trigger animation for successful help request
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);

      return helpRequest;
    } catch (error) {
      console.error('Error requesting help:', error);
      throw error;
    }
  };

  // Get age-appropriate button text and styling
  const getButtonConfig = () => {
    if (childAge <= 7) {
      return {
        text: '🤔 Need Help?',
        icon: <AutoAwesome />,
        color: 'secondary' as const,
        tooltip: 'Ask Claude for help! He loves helping kids learn! 😊'
      };
    } else if (childAge <= 10) {
      return {
        text: 'Ask for Help',
        icon: <Psychology />,
        color: 'info' as const,
        tooltip: 'Get help from Claude, your AI learning assistant'
      };
    } else {
      return {
        text: 'Get Help',
        icon: <HelpOutline />,
        color: 'info' as const,
        tooltip: 'Request assistance from Claude AI'
      };
    }
  };

  const buttonConfig = getButtonConfig();

  // Show badge if there have been multiple help requests
  const showBadge = helpRequestCount > 0;

  return (
    <>
      <Tooltip title={buttonConfig.tooltip} arrow>
        <Badge 
          badgeContent={showBadge ? helpRequestCount : 0} 
          color="primary"
          max={9}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              minWidth: '18px',
              height: '18px'
            }
          }}
        >
          <Button
            onClick={() => setShowHelpAssistant(true)}
            variant="contained"
            color={buttonConfig.color}
            startIcon={buttonConfig.icon}
            size={childAge <= 7 ? "medium" : "small"}
            aria-label={`Get help from Claude - ${helpRequestCount} previous requests`}
            sx={{
              borderRadius: childAge <= 7 ? 6 : 4,
              px: childAge <= 7 ? 3 : 2,
              py: childAge <= 7 ? 1.5 : 1,
              fontSize: childAge <= 7 ? '1rem' : '0.875rem',
              fontWeight: childAge <= 7 ? 600 : 500,
              textTransform: childAge <= 7 ? 'none' : 'uppercase',
              boxShadow: theme.shadows[2],
              transition: 'all 0.3s ease',
              transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: theme.shadows[4]
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            {buttonConfig.text}
          </Button>
        </Badge>
      </Tooltip>

      <ClaudeHelpAssistant
        isOpen={showHelpAssistant}
        onClose={() => setShowHelpAssistant(false)}
        onRequestHelp={handleHelpRequest}
        activityId={activityId}
        childId={childId}
        childAge={childAge}
        activityContext={activityContext}
        helpRequestCount={helpRequestCount}
      />
    </>
  );
};

export default HelpButton;