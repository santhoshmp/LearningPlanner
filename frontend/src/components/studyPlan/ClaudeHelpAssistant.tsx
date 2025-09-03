import React, { useState, useEffect, useRef } from 'react';
import { HelpRequest } from '../../types/activity';
import { claudeService } from '../../services/claudeService';
import { childHelpAnalyticsService } from '../../services/childHelpAnalyticsService';
import { useTheme } from '../../theme/ThemeContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  Fade,
  CircularProgress,
  Divider,
  AppBar,
  Toolbar,
  InputAdornment,
  Alert,
  Rating,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ReportIcon from '@mui/icons-material/Report';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { keyframes } from '@mui/system';

interface ClaudeHelpAssistantProps {
  activityId: string;
  childId: string;
  childAge: number;
  activityContext: {
    title: string;
    subject: string;
    currentStep?: number;
    currentContent?: any;
  };
  onRequestHelp: (question: string) => Promise<HelpRequest>;
  onClose: () => void;
  isOpen: boolean;
  helpRequestCount?: number;
}

interface Message {
  id: string;
  sender: 'user' | 'claude';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  helpRequestId?: string;
  rating?: number;
  wasHelpful?: boolean;
}

// Define typing animation keyframes
const typingAnimation = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
`;

// Styled components
const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser?: boolean }>(({ theme, isUser }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  maxWidth: '80%',
  wordBreak: 'break-word',
  marginBottom: theme.spacing(0.5),
  backgroundColor: isUser ? theme.palette.primary.main : 
    theme.palette.mode === 'light' ? '#f5f5f5' : theme.palette.background.paper,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  boxShadow: isUser ? 'none' : theme.shadows[1],
  border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[2]
  },
  transition: 'box-shadow 0.2s ease'
}));

const SuggestionChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.mode === 'light' ? 
    theme.palette.grey[100] : theme.palette.grey[800],
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? 
      theme.palette.grey[200] : theme.palette.grey[700],
  },
  transition: 'all 0.2s ease',
  cursor: 'pointer'
}));

const MessageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser?: boolean }>(({ isUser }) => ({
  display: 'flex',
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  width: '100%',
  marginBottom: '8px'
}));

// Dialog transition
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ClaudeHelpAssistant: React.FC<ClaudeHelpAssistantProps> = ({
  activityId,
  childId,
  childAge,
  activityContext,
  onRequestHelp,
  onClose,
  isOpen,
  helpRequestCount = 0
}) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParentNotification, setShowParentNotification] = useState(false);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Add welcome message and load personalized suggestions when component mounts
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = claudeService.getWelcomeMessage(childAge, activityContext);
      setMessages([
        {
          id: 'welcome',
          sender: 'claude',
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);

      // Load personalized suggestions based on child's help history
      loadPersonalizedSuggestions();

      // Check if parent notification is needed
      checkParentNotification();
    }
    
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, childAge, activityContext, messages.length]);

  // Load personalized help suggestions
  const loadPersonalizedSuggestions = async () => {
    try {
      const suggestions = await childHelpAnalyticsService.getPersonalizedSuggestions(
        childId, 
        activityContext.subject
      );
      setPersonalizedSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading personalized suggestions:', error);
    }
  };

  // Check if parent should be notified about help requests
  const checkParentNotification = async () => {
    try {
      const notification = await childHelpAnalyticsService.checkParentNotificationNeeded(childId);
      if (notification) {
        setShowParentNotification(true);
      }
    } catch (error) {
      console.error('Error checking parent notification:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isSubmitting) return;
    
    const question = inputValue.trim();
    setInputValue('');
    
    // Add user message
    const userMessageId = `user-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        content: question,
        timestamp: new Date()
      }
    ]);
    
    // Add loading message from Claude
    const claudeLoadingId = `claude-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: claudeLoadingId,
        sender: 'claude',
        content: '',
        timestamp: new Date(),
        isLoading: true
      }
    ]);
    
    setIsSubmitting(true);
    
    try {
      // Send help request to backend
      const helpResponse = await onRequestHelp(question);
      
      // Track the help request for analytics
      await childHelpAnalyticsService.trackHelpRequest(
        childId,
        activityId,
        question,
        helpResponse.response || '',
        activityContext
      );
      
      // Remove loading message and add actual response
      setMessages(prev => prev.filter(msg => msg.id !== claudeLoadingId));
      
      // The response should already be age-appropriate from the backend
      // but we can still format it on the frontend for extra safety
      const formattedResponse = helpResponse.response || "I'm not sure about that, but let's figure it out together!";
      
      setMessages(prev => [
        ...prev,
        {
          id: `claude-${Date.now()}`,
          sender: 'claude',
          content: formattedResponse,
          timestamp: new Date(),
          helpRequestId: helpResponse.id
        }
      ]);

      // Check if we need to notify parent after this help request
      checkParentNotification();
    } catch (error) {
      console.error('Failed to get help:', error);
      
      // Remove loading message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== claudeLoadingId));
      setMessages(prev => [
        ...prev,
        {
          id: `claude-${Date.now()}`,
          sender: 'claude',
          content: 'Oops! I had trouble answering that question. Could you try asking in a different way?',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle rating a Claude response
  const handleRateResponse = async (messageId: string, helpRequestId: string, rating: number) => {
    try {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, rating, wasHelpful: rating >= 3 }
          : msg
      ));

      // Mark help request as resolved with rating
      await childHelpAnalyticsService.markHelpRequestResolved(helpRequestId, rating >= 3);
    } catch (error) {
      console.error('Error rating response:', error);
    }
  };

  // Handle reporting inappropriate response
  const handleReportResponse = async (helpRequestId: string) => {
    try {
      await childHelpAnalyticsService.reportResponse(
        helpRequestId, 
        'inappropriate_content',
        'Child reported response as inappropriate or unhelpful'
      );
      
      // Show confirmation message
      setMessages(prev => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          sender: 'claude',
          content: childAge <= 7 
            ? "Thanks for letting me know! I'll try to give better answers. 😊"
            : "Thank you for the feedback. I'll work on providing better responses.",
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error reporting response:', error);
    }
  };

  // Quick help suggestions based on activity context and personalized history
  const getHelpSuggestions = () => {
    // Get common suggestions for all subjects
    const commonSuggestions = [
      "I don't understand this question",
      "Can you explain this in a simpler way?",
      "What should I do next?"
    ];
    
    // Get subject-specific suggestions from the service
    const subjectSuggestions = claudeService.getSubjectSpecificSuggestions(activityContext.subject);
    
    // Combine with personalized suggestions
    const allSuggestions = [
      ...commonSuggestions, 
      ...subjectSuggestions,
      ...personalizedSuggestions
    ];
    
    // Remove duplicates and limit to a reasonable number (max 6 suggestions)
    return [...new Set(allSuggestions)].slice(0, 6);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: { xs: '100%', sm: '80vh' },
          maxHeight: { xs: '100%', sm: '80vh' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <AppBar position="static" color="primary" elevation={0} sx={{ borderRadius: '8px 8px 0 0' }}>
        <Toolbar sx={{ minHeight: '64px' }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.light', 
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            <SmartToyIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              Claude Helper
            </Typography>
            <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
              Ask me anything about this activity!
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Parent Notification Alert */}
      {showParentNotification && (
        <Alert 
          severity="info" 
          onClose={() => setShowParentNotification(false)}
          sx={{ m: 2, mb: 0 }}
          icon={<TrendingUpIcon />}
        >
          <Typography variant="body2">
            {childAge <= 7 
              ? "You're asking lots of great questions! Your grown-ups will get a note about how much you're learning! 📚"
              : "You've been asking for help frequently. Your parents will receive a summary of your learning progress."
            }
          </Typography>
        </Alert>
      )}

      {/* Messages */}
      <DialogContent 
        ref={messagesContainerRef}
        sx={{ 
          p: 2, 
          flexGrow: 1, 
          overflowY: 'auto',
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {messages.map((message) => (
          <Fade key={message.id} in={true} timeout={300}>
            <MessageContainer isUser={message.sender === 'user'}>
              {message.sender === 'claude' && (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 1, 
                    mt: 0.5,
                    bgcolor: 'primary.light'
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 18 }} />
                </Avatar>
              )}
              
              <Box sx={{ maxWidth: '80%' }}>
                <MessageBubble isUser={message.sender === 'user'}>
                  {message.isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          opacity: 0.7,
                          mx: 0.5,
                          animation: `${typingAnimation} 1s infinite`,
                          animationDelay: '0ms'
                        }}
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          opacity: 0.7,
                          mx: 0.5,
                          animation: `${typingAnimation} 1s infinite`,
                          animationDelay: '333ms'
                        }}
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'text.secondary',
                          opacity: 0.7,
                          mx: 0.5,
                          animation: `${typingAnimation} 1s infinite`,
                          animationDelay: '666ms'
                        }}
                      />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      
                      {/* Rating and feedback for Claude responses */}
                      {message.sender === 'claude' && message.helpRequestId && !message.isLoading && (
                        <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                          {message.rating ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {childAge <= 7 ? 'You rated this:' : 'Your rating:'}
                              </Typography>
                              <Rating 
                                value={message.rating} 
                                readOnly 
                                size="small"
                                sx={{ color: 'primary.main' }}
                              />
                              {message.wasHelpful && (
                                <Typography variant="caption" color="success.main">
                                  {childAge <= 7 ? '😊 Helpful!' : 'Helpful'}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="caption" color="text.secondary">
                                {childAge <= 7 ? 'Was this helpful?' : 'Rate this response:'}
                              </Typography>
                              
                              {childAge <= 7 ? (
                                // Simple thumbs up/down for younger children
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="This helped me! 😊">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleRateResponse(message.id, message.helpRequestId!, 5)}
                                      sx={{ color: 'success.main' }}
                                    >
                                      <ThumbUpIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="This didn't help 😕">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleRateResponse(message.id, message.helpRequestId!, 1)}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <ThumbDownIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                // Star rating for older children
                                <Rating 
                                  size="small"
                                  onChange={(_, value) => {
                                    if (value) {
                                      handleRateResponse(message.id, message.helpRequestId!, value);
                                    }
                                  }}
                                />
                              )}
                              
                              <Tooltip title={childAge <= 7 ? "Tell a grown-up about this" : "Report inappropriate content"}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleReportResponse(message.helpRequestId!)}
                                  sx={{ color: 'warning.main' }}
                                >
                                  <ReportIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </MessageBubble>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block', 
                    mt: 0.5, 
                    ml: message.sender === 'claude' ? 0 : 'auto',
                    mr: message.sender === 'user' ? 0 : 'auto',
                    px: 1
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
              
              {message.sender === 'user' && (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    ml: 1, 
                    mt: 0.5,
                    bgcolor: 'primary.main'
                  }}
                >
                  {/* User initial or icon */}
                  <Typography variant="body2">U</Typography>
                </Avatar>
              )}
            </MessageContainer>
          </Fade>
        ))}
        <div ref={messagesEndRef} />
      </DialogContent>

      {/* Quick help suggestions */}
      <Box 
        sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LightbulbIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Quick help:
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {getHelpSuggestions().map((suggestion, index) => (
            <SuggestionChip
              key={index}
              label={suggestion}
              size="small"
              onClick={() => handleSuggestionClick(suggestion)}
              icon={<HelpOutlineIcon fontSize="small" />}
            />
          ))}
        </Box>
      </Box>

      {/* Input */}
      <DialogActions sx={{ p: 2, bgcolor: theme.palette.background.paper }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', display: 'flex' }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask Claude for help..."
            variant="outlined"
            disabled={isSubmitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                pr: 1
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    type="submit"
                    disabled={!inputValue.trim() || isSubmitting}
                    sx={{
                      bgcolor: inputValue.trim() && !isSubmitting ? 'primary.main' : 'action.disabledBackground',
                      color: inputValue.trim() && !isSubmitting ? 'primary.contrastText' : 'text.disabled',
                      '&:hover': {
                        bgcolor: inputValue.trim() && !isSubmitting ? 'primary.dark' : 'action.disabledBackground',
                      },
                      transition: 'background-color 0.3s',
                      width: 40,
                      height: 40
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ClaudeHelpAssistant;