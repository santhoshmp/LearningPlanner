import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Button, Alert, Chip, Badge, Divider } from '@mui/material';
import { FlagOutlined, WarningAmber, CheckCircleOutline } from '@mui/icons-material';
import { contentSafetyService, ConversationLogEntry, FlaggedContentStats } from '../../services/contentSafetyService';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`privacy-tabpanel-${index}`}
      aria-labelledby={`privacy-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ChildPrivacyProps {
  childId: string;
  childName: string;
}

const PrivacySettingsManager: React.FC<ChildPrivacyProps> = ({ childId, childName }) => {
  const [tabValue, setTabValue] = useState(0);
  const [conversations, setConversations] = useState<ConversationLogEntry[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FlaggedContentStats | null>(null);

  // Fetch conversations when component mounts or filters change
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const logs = await contentSafetyService.getConversationLogs(childId, flaggedOnly);
        setConversations(logs);
      } catch (err) {
        setError('Failed to load conversation logs. Please try again.');
        console.error('Error fetching conversation logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [childId, flaggedOnly]);

  // Fetch stats when viewing the stats tab
  useEffect(() => {
    if (tabValue === 1) {
      const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
          const statsData = await contentSafetyService.getFlaggedContentStats();
          setStats(statsData);
        } catch (err) {
          setError('Failed to load content safety statistics. Please try again.');
          console.error('Error fetching content safety stats:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleFlaggedOnly = () => {
    setFlaggedOnly(!flaggedOnly);
  };

  const getSeverityColor = (concerns: string[] | undefined) => {
    if (!concerns || concerns.length === 0) return 'success';
    
    const severity = contentSafetyService.getSeverityLevel(concerns);
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Privacy & Content Safety for {childName}
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="privacy settings tabs">
          <Tab label="Conversation Logs" />
          <Tab label="Content Safety Stats" />
        </Tabs>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Conversation History
          </Typography>
          <Button 
            variant={flaggedOnly ? "contained" : "outlined"} 
            color="warning"
            onClick={toggleFlaggedOnly}
            startIcon={<FlagOutlined />}
          >
            {flaggedOnly ? "Showing Flagged Only" : "Show Flagged Only"}
          </Button>
        </Box>
        
        {loading ? (
          <Typography>Loading conversations...</Typography>
        ) : conversations.length === 0 ? (
          <Alert severity="info">
            No {flaggedOnly ? "flagged " : ""}conversations found for this child.
          </Alert>
        ) : (
          <Box>
            {conversations.map((conversation) => (
              <Paper 
                key={conversation.id} 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  border: conversation.flagged ? '1px solid #f44336' : 'none',
                  position: 'relative'
                }}
              >
                {conversation.flagged && (
                  <Chip
                    icon={<WarningAmber />}
                    label={`Flagged: ${contentSafetyService.formatConcerns(conversation.concerns || [])}`}
                    color={getSeverityColor(conversation.concerns)}
                    sx={{ position: 'absolute', top: 10, right: 10 }}
                  />
                )}
                
                <Typography variant="subtitle2" color="text.secondary">
                  {format(new Date(conversation.timestamp), 'MMM d, yyyy h:mm a')} • {conversation.activityTitle}
                </Typography>
                
                <Box sx={{ mt: 1, mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Question:
                  </Typography>
                  <Typography variant="body1">
                    {conversation.question}
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Claude's Response:
                  </Typography>
                  <Typography variant="body1">
                    {conversation.response}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Content Safety Statistics
        </Typography>
        
        {loading ? (
          <Typography>Loading statistics...</Typography>
        ) : !stats ? (
          <Alert severity="info">
            No content safety statistics available.
          </Alert>
        ) : (
          <Box>
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Overview
              </Typography>
              <Typography variant="body1">
                Total flagged conversations: <Chip color="error" label={stats.totalFlagged} />
              </Typography>
            </Paper>
            
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Flagged Content by Child
              </Typography>
              {stats.flaggedByChild.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutline />}>
                  No flagged content for any children.
                </Alert>
              ) : (
                stats.flaggedByChild.map((item) => (
                  <Box key={item.childId} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{item.childName}</Typography>
                    <Badge badgeContent={item.count} color="error" />
                  </Box>
                ))
              )}
            </Paper>
            
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Common Concerns
              </Typography>
              {stats.flaggedByConcern.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutline />}>
                  No concerns detected.
                </Alert>
              ) : (
                stats.flaggedByConcern.map((item, index) => (
                  <Box key={index} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>{item.concern}</Typography>
                    <Badge badgeContent={item.count} color="warning" />
                  </Box>
                ))
              )}
            </Paper>
            
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Flagged Content
              </Typography>
              {stats.recentFlagged.length === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutline />}>
                  No recent flagged content.
                </Alert>
              ) : (
                stats.recentFlagged.map((item) => (
                  <Box key={item.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">
                      {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')} • {item.childName}
                    </Typography>
                    <Typography variant="body2" color="error">
                      Concerns: {contentSafetyService.formatConcerns(item.concerns)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))
              )}
            </Paper>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};

export default PrivacySettingsManager;