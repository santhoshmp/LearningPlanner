import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { masterDataService, MasterDataTopic } from '../../services/masterDataService';

interface TopicSelectorProps {
  grade: string;
  subjectId: string;
  selectedTopics: string[];
  onTopicsChange: (topicIds: string[]) => void;
  maxSelections?: number;
  showDifficulty?: boolean;
  showEstimatedHours?: boolean;
  showPrerequisites?: boolean;
  groupByDifficulty?: boolean;
  allowSelectAll?: boolean;
  disabled?: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  grade,
  subjectId,
  selectedTopics,
  onTopicsChange,
  maxSelections,
  showDifficulty = true,
  showEstimatedHours = true,
  showPrerequisites = false,
  groupByDifficulty = false,
  allowSelectAll = true,
  disabled = false
}) => {
  const [topics, setTopics] = useState<MasterDataTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!grade || !subjectId) {
        setTopics([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const topicData = await masterDataService.getTopicsBySubject(grade, subjectId);
        setTopics(topicData);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to load topics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [grade, subjectId]);

  const handleTopicToggle = (topicId: string) => {
    if (disabled) return;

    const newSelectedTopics = selectedTopics.includes(topicId)
      ? selectedTopics.filter(id => id !== topicId)
      : [...selectedTopics, topicId];
    
    // Check max selections limit
    if (maxSelections && newSelectedTopics.length > maxSelections) {
      return;
    }
    
    onTopicsChange(newSelectedTopics);
  };

  const handleSelectAllTopics = () => {
    if (disabled) return;

    const allTopicIds = topics.map(topic => topic.id);
    const allSelected = allTopicIds.every(id => selectedTopics.includes(id));
    
    if (allSelected) {
      // Deselect all topics
      const newSelectedTopics = selectedTopics.filter(id => !allTopicIds.includes(id));
      onTopicsChange(newSelectedTopics);
    } else {
      // Select all topics (respecting max limit)
      const newSelectedTopics = [...new Set([...selectedTopics, ...allTopicIds])];
      if (maxSelections && newSelectedTopics.length > maxSelections) {
        // Select up to the limit
        const availableSlots = maxSelections - selectedTopics.filter(id => !allTopicIds.includes(id)).length;
        const topicsToAdd = allTopicIds.filter(id => !selectedTopics.includes(id)).slice(0, availableSlots);
        onTopicsChange([...selectedTopics, ...topicsToAdd]);
      } else {
        onTopicsChange(newSelectedTopics);
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  const groupTopicsByDifficulty = () => {
    const grouped = topics.reduce((acc, topic) => {
      const difficulty = topic.difficulty;
      if (!acc[difficulty]) {
        acc[difficulty] = [];
      }
      acc[difficulty].push(topic);
      return acc;
    }, {} as Record<string, MasterDataTopic[]>);

    return grouped;
  };

  const renderTopicItem = (topic: MasterDataTopic) => {
    const isSelected = selectedTopics.includes(topic.id);
    const isDisabled = disabled || (maxSelections && !isSelected && selectedTopics.length >= maxSelections);

    return (
      <Box
        key={topic.id}
        sx={{
          p: 2,
          border: 1,
          borderColor: isSelected ? 'primary.main' : 'divider',
          borderRadius: 1,
          bgcolor: isSelected ? 'primary.50' : 'background.paper',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: isSelected ? 'primary.100' : 'grey.50'
          },
          opacity: isDisabled ? 0.6 : 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isSelected}
                onChange={() => handleTopicToggle(topic.id)}
                disabled={isDisabled}
                icon={<RadioButtonUncheckedIcon />}
                checkedIcon={<CheckCircleIcon />}
              />
            }
            label={
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" component="span">
                    {topic.displayName}
                  </Typography>
                  {showDifficulty && (
                    <Chip
                      label={`${getDifficultyIcon(topic.difficulty)} ${topic.difficulty}`}
                      size="small"
                      color={getDifficultyColor(topic.difficulty) as any}
                      variant="outlined"
                    />
                  )}
                  {showEstimatedHours && (
                    <Chip
                      label={`${topic.estimatedHours}h`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {showPrerequisites && topic.prerequisites.length > 0 && (
                    <Tooltip title={`Prerequisites: ${topic.prerequisites.join(', ')}`}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                {topic.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {topic.description}
                  </Typography>
                )}

                {topic.learningObjectives.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Learning Objectives:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {topic.learningObjectives.slice(0, 3).map((objective, index) => (
                        <Chip
                          key={index}
                          label={objective}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {topic.learningObjectives.length > 3 && (
                        <Chip
                          label={`+${topic.learningObjectives.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {topic.skills.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {topic.skills.slice(0, 3).map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {topic.skills.length > 3 && (
                        <Chip
                          label={`+${topic.skills.length - 3} more`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            }
            sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
          />
        </Box>
      </Box>
    );
  };

  const renderTopicsByDifficulty = () => {
    const groupedTopics = groupTopicsByDifficulty();
    const difficultyOrder = ['beginner', 'intermediate', 'advanced'];

    return difficultyOrder.map(difficulty => {
      const difficultyTopics = groupedTopics[difficulty] || [];
      if (difficultyTopics.length === 0) return null;

      const selectedInGroup = difficultyTopics.filter(topic => selectedTopics.includes(topic.id)).length;

      return (
        <Accordion key={difficulty} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                {getDifficultyIcon(difficulty)} {difficulty} Topics
              </Typography>
              <Chip
                label={`${selectedInGroup}/${difficultyTopics.length} selected`}
                size="small"
                color={selectedInGroup > 0 ? 'primary' : 'default'}
              />
              <Box sx={{ flex: 1, mx: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(selectedInGroup / difficultyTopics.length) * 100}
                  color={getDifficultyColor(difficulty) as any}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {difficultyTopics.map(renderTopicItem)}
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading topics...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!grade || !subjectId) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Please select a grade and subject to view available topics.
      </Alert>
    );
  }

  if (topics.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No topics available for the selected grade and subject.
      </Alert>
    );
  }

  const selectedCount = topics.filter(topic => selectedTopics.includes(topic.id)).length;
  const allSelected = selectedCount === topics.length;
  const someSelected = selectedCount > 0 && selectedCount < topics.length;

  return (
    <Box>
      {/* Header with selection summary */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Select Topics
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${selectedCount}/${topics.length} selected`}
              size="small"
              color={selectedCount > 0 ? 'primary' : 'default'}
            />
            {maxSelections && (
              <Chip
                label={`Max: ${maxSelections}`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        </Box>

        {allowSelectAll && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAllTopics}
              disabled={disabled}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            {someSelected && (
              <Button
                size="small"
                variant="text"
                onClick={() => onTopicsChange([])}
                disabled={disabled}
              >
                Clear Selection
              </Button>
            )}
          </Box>
        )}

        {selectedCount > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(selectedCount / topics.length) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Paper>

      {/* Topics list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groupByDifficulty ? renderTopicsByDifficulty() : topics.map(renderTopicItem)}
      </Box>

      {/* Selected topics summary */}
      {selectedTopics.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'primary.50' }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Topics ({selectedTopics.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedTopics.map(topicId => {
              const topic = topics.find(t => t.id === topicId);
              return topic ? (
                <Chip
                  key={topicId}
                  label={topic.displayName}
                  onDelete={() => handleTopicToggle(topicId)}
                  disabled={disabled}
                  color="primary"
                  variant="filled"
                />
              ) : null;
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TopicSelector;