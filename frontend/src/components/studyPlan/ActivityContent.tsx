import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Button
} from '@mui/material';
import { StudyActivity } from '../../types/studyPlan';

interface ActivityContentProps {
  activity: StudyActivity;
  currentStep: number;
  answers: Record<string, any>;
  onAnswerChange: (answer: any) => void;
}

const ActivityContent: React.FC<ActivityContentProps> = ({
  activity,
  currentStep,
  answers,
  onAnswerChange
}) => {
  const renderContent = () => {
    const { type, data } = activity.content;

    switch (type) {
      case 'text':
        return renderTextContent(data);
      case 'quiz':
        return renderQuizContent(data, currentStep);
      case 'interactive':
        return renderInteractiveContent(data);
      case 'video':
        return renderVideoContent(data);
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error">Unsupported content type</Typography>
          </Box>
        );
    }
  };

  const renderTextContent = (data: any) => {
    return (
      <Box>
        <Box 
          sx={{ 
            typography: 'body1',
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: 'primary.main',
              mt: 3,
              mb: 2
            },
            '& p': {
              mb: 2
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 1,
              my: 2
            },
            '& a': {
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }
          }}
          dangerouslySetInnerHTML={{ __html: data.content }} 
        />
        
        {/* Simple comprehension check */}
        <Paper 
          elevation={0} 
          sx={{ 
            mt: 4, 
            p: 3, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="medium">
            Comprehension Check
          </Typography>
          <Typography variant="body1" paragraph>
            {data.comprehensionQuestion}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your answer here..."
            value={answers[currentStep] || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            variant="outlined"
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
        </Paper>
      </Box>
    );
  };

  const renderQuizContent = (data: any, stepIndex: number) => {
    const question = data.questions[stepIndex];
    if (!question) return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">Question not found</Typography>
      </Box>
    );

    return (
      <Box>
        <Typography variant="h5" component="h3" gutterBottom color="primary.main" fontWeight="medium">
          {question.text}
        </Typography>
        
        {question.image && (
          <Box sx={{ my: 3, textAlign: 'center' }}>
            <Card elevation={2}>
              <CardMedia
                component="img"
                image={question.image}
                alt="Question illustration"
                sx={{ 
                  maxHeight: 300,
                  objectFit: 'contain'
                }}
              />
            </Card>
          </Box>
        )}

        <Box sx={{ mt: 4 }}>
          {question.type === 'multiple-choice' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary', fontWeight: 'medium' }}>
                Choose the correct answer:
              </FormLabel>
              <RadioGroup
                value={answers[stepIndex] !== undefined ? answers[stepIndex] : ''}
                onChange={(e) => onAnswerChange(parseInt(e.target.value, 10))}
              >
                {question.options.map((option: any, idx: number) => (
                  <FormControlLabel
                    key={idx}
                    value={idx}
                    control={<Radio color="primary" />}
                    label={option}
                    sx={{ 
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'true-false' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary', fontWeight: 'medium' }}>
                True or False:
              </FormLabel>
              <RadioGroup
                value={answers[stepIndex] !== undefined ? answers[stepIndex].toString() : ''}
                onChange={(e) => onAnswerChange(e.target.value === 'true')}
              >
                <FormControlLabel
                  value="true"
                  control={<Radio color="primary" />}
                  label="True"
                  sx={{ 
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                />
                <FormControlLabel
                  value="false"
                  control={<Radio color="primary" />}
                  label="False"
                  sx={{ 
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                />
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'short-answer' && (
            <Box>
              <FormLabel component="legend" sx={{ mb: 2, color: 'text.primary', fontWeight: 'medium' }}>
                Your answer:
              </FormLabel>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your answer here..."
                value={answers[stepIndex] || ''}
                onChange={(e) => onAnswerChange(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const renderInteractiveContent = (data: any) => {
    return (
      <Card 
        sx={{ 
          textAlign: 'center', 
          p: 4, 
          bgcolor: 'warning.light',
          color: 'warning.contrastText',
          borderRadius: 3
        }}
      >
        <Typography variant="h3" sx={{ mb: 3 }}>🎮</Typography>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Interactive Activity
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 4 }}>
          {data.description}
        </Typography>
        <Button
          variant="contained"
          color="warning"
          size="large"
          onClick={() => onAnswerChange(true)}
          sx={{ 
            borderRadius: 4,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            boxShadow: 3
          }}
        >
          Mark as Complete
        </Button>
      </Card>
    );
  };

  const renderVideoContent = (data: any) => {
    return (
      <Box>
        <Card elevation={3} sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
              src={data.videoUrl}
              title={data.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
          <CardContent>
            <Typography variant="h5" gutterBottom color="primary">
              {data.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {data.description}
            </Typography>
          </CardContent>
        </Card>
        
        <Paper 
          elevation={0} 
          sx={{ 
            mt: 4, 
            p: 3, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="medium">
            Video Comprehension
          </Typography>
          <Typography variant="body1" paragraph>
            {data.comprehensionQuestion}
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your answer here..."
            value={answers[currentStep] || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            variant="outlined"
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1
              }
            }}
          />
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', borderRadius: 2 }}>
      {renderContent()}
    </Box>
  );
};

export default ActivityContent;