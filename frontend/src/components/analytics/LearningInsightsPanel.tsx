import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ExpandMore,
  Lightbulb,
  TrendingUp,
  Warning,
  CheckCircle,
  School,
  Psychology,
  Speed,
  Target,
  Info,
  BookmarkBorder,
  Bookmark,
} from '@mui/icons-material';
import { LearningInsight } from '../../types/analytics';

interface LearningInsightsPanelProps {
  insights: LearningInsight[];
}

const LearningInsightsPanel: React.FC<LearningInsightsPanelProps> = ({ insights }) => {
  const [bookmarkedInsights, setBookmarkedInsights] = useState<Set<string>>(new Set());
  const [expandedInsight, setExpandedInsight] = useState<string | false>(false);

  const handleAccordionChange = (insightId: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean,
  ) => {
    setExpandedInsight(isExpanded ? insightId : false);
  };

  const toggleBookmark = (insightId: string) => {
    const newBookmarked = new Set(bookmarkedInsights);
    if (newBookmarked.has(insightId)) {
      newBookmarked.delete(insightId);
    } else {
      newBookmarked.add(insightId);
    }
    setBookmarkedInsights(newBookmarked);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <Psychology color="primary" />;
      case 'recommendation':
        return <Lightbulb color="warning" />;
      case 'achievement':
        return <CheckCircle color="success" />;
      case 'concern':
        return <Warning color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'success';
      case 'concern':
        return 'error';
      case 'recommendation':
        return 'warning';
      case 'pattern':
        return 'info';
      default:
        return 'default';
    }
  };

  // Group insights by category
  const groupedInsights = insights.reduce((groups, insight) => {
    const category = insight.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(insight);
    return groups;
  }, {} as Record<string, LearningInsight[]>);

  // Sort insights by priority and confidence
  const sortInsights = (insights: LearningInsight[]) => {
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  };

  if (insights.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          No insights available yet. Complete more activities to generate personalized learning insights.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Learning Insights Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<Psychology />}
            label={`${insights.filter(i => i.type === 'pattern').length} Patterns`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            icon={<Lightbulb />}
            label={`${insights.filter(i => i.type === 'recommendation').length} Recommendations`}
            color="warning"
            variant="outlined"
          />
          <Chip 
            icon={<CheckCircle />}
            label={`${insights.filter(i => i.type === 'achievement').length} Achievements`}
            color="success"
            variant="outlined"
          />
          <Chip 
            icon={<Warning />}
            label={`${insights.filter(i => i.type === 'concern').length} Concerns`}
            color="error"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* High Priority Insights */}
      {insights.filter(i => i.priority === 'high').length > 0 && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              High Priority Insights
            </Typography>
            <List dense>
              {sortInsights(insights.filter(i => i.priority === 'high')).map((insight, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getInsightIcon(insight.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={insight.title}
                    secondary={insight.description}
                  />
                  <Box sx={{ ml: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={insight.confidence * 100}
                      sx={{ width: 60, mr: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(insight.confidence * 100)}%
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Insights by Category */}
      {Object.entries(groupedInsights).map(([category, categoryInsights]) => (
        <Card key={category} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {category}
            </Typography>
            
            {sortInsights(categoryInsights).map((insight, index) => {
              const insightId = `${category}-${index}`;
              const isBookmarked = bookmarkedInsights.has(insightId);
              
              return (
                <Accordion
                  key={index}
                  expanded={expandedInsight === insightId}
                  onChange={handleAccordionChange(insightId)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      pr: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        {getInsightIcon(insight.type)}
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="subtitle2">
                            {insight.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={insight.type}
                              size="small"
                              color={getSeverityColor(insight.type) as any}
                              variant="outlined"
                            />
                            <Chip 
                              label={insight.priority}
                              size="small"
                              color={getPriorityColor(insight.priority) as any}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={insight.confidence * 100}
                                sx={{ width: 40, mr: 1 }}
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {Math.round(insight.confidence * 100)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Tooltip title={isBookmarked ? "Remove bookmark" : "Bookmark insight"}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(insightId);
                          }}
                        >
                          {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" paragraph>
                        {insight.description}
                      </Typography>
                      
                      {insight.actionable && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Recommended Actions:
                          </Typography>
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              This insight suggests actionable steps that can be taken to improve learning outcomes.
                            </Typography>
                          </Alert>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {Math.round(insight.confidence * 100)}% | 
                            Priority: {insight.priority.toUpperCase()} | 
                            Category: {insight.category}
                          </Typography>
                        </Box>
                        
                        {insight.actionable && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<Target />}
                          >
                            Take Action
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Bookmarked Insights */}
      {bookmarkedInsights.size > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Badge badgeContent={bookmarkedInsights.size} color="primary">
                Bookmarked Insights
              </Badge>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {bookmarkedInsights.size} bookmarked insight{bookmarkedInsights.size !== 1 ? 's' : ''} for future reference.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* AI-Generated Recommendations Footer */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1, fontSize: 16 }} />
          These insights are generated using AI analysis of learning patterns and performance data.
          Recommendations are personalized based on individual learning behavior and progress.
        </Typography>
      </Box>
    </Box>
  );
};

export default LearningInsightsPanel;