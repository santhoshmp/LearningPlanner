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
  onComplete?: () => void; // Add completion callback
}

const ActivityContent: React.FC<ActivityContentProps> = ({
  activity,
  currentStep,
  answers,
  onAnswerChange,
  onComplete
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
        return renderStaticStudyPlanResources(activity);
    }
  };

  const renderTextContent = (data: any) => {
    // If no content available, show static resources
    if (!data || !data.content) {
      return renderStaticStudyPlanResources(activity);
    }

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
    // If no questions available, show static resources
    if (!data || !data.questions || data.questions.length === 0) {
      return renderStaticStudyPlanResources(activity);
    }

    const question = data.questions[stepIndex];
    if (!question) {
      return renderStaticStudyPlanResources(activity);
    }

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
    // If data is missing or incomplete, show static resources
    if (!data || !data.description) {
      return renderStaticStudyPlanResources(activity);
    }

    return (
      <Box>
        {/* Enhanced Interactive Activity Display */}
        <Card elevation={2} sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎮 {activity.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {data.description || activity.description}
            </Typography>
          </CardContent>
        </Card>

        {/* Interactive Content */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 Activity Instructions
            </Typography>
            <Typography variant="body1" paragraph>
              {data.instructions || "Follow the interactive exercises below to complete this activity."}
            </Typography>

            {/* Show exercises if available */}
            {data.exercises && data.exercises.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  ✏️ Practice Exercises
                </Typography>
                {data.exercises.map((exercise: any, index: number) => (
                  <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Exercise {index + 1}: {exercise.number ? `Number ${exercise.number}` : `Practice Item ${index + 1}`}
                    </Typography>
                    {exercise.word && (
                      <Typography variant="body2" color="text.secondary">
                        Word form: {exercise.word}
                      </Typography>
                    )}
                    {exercise.number && (
                      <Box sx={{
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        p: 2,
                        borderRadius: 1,
                        mt: 1,
                        textAlign: 'center'
                      }}>
                        <Typography variant="h4" fontWeight="bold">
                          {exercise.number}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Add static educational content as well */}
        {renderStaticStudyPlanResources(activity)}

        {/* Completion Action */}
        <Card elevation={2} sx={{ bgcolor: 'success.light', color: 'success.contrastText', mt: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              🎉 Complete This Activity
            </Typography>
            <Typography variant="body2" paragraph>
              Great job working through this interactive activity! Mark it as complete when you're ready.
            </Typography>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={() => {
                onAnswerChange(true);
                if (onComplete) {
                  onComplete();
                }
              }}
              sx={{
                borderRadius: 4,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                boxShadow: 3
              }}
            >
              Mark as Complete ✓
            </Button>
          </CardContent>
        </Card>
      </Box>
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

  const renderStaticStudyPlanResources = (activity: StudyActivity) => {
    // Extract subject and difficulty from activity
    const subject = activity.title.toLowerCase().includes('math') ? 'Mathematics' :
      activity.title.toLowerCase().includes('science') ? 'Science' :
        activity.title.toLowerCase().includes('english') ? 'English' : 'General';

    const difficulty = activity.difficulty || 2;

    // Static educational resources based on the activity
    const resources = getStaticResourcesForActivity(activity.title, subject, difficulty);

    return (
      <Box>
        {/* Activity Header */}
        <Card elevation={2} sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📚 {activity.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {activity.description}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                px: 2, py: 0.5,
                borderRadius: 1
              }}>
                Subject: {subject}
              </Typography>
              <Typography variant="caption" sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                px: 2, py: 0.5,
                borderRadius: 1
              }}>
                Duration: ~{activity.estimatedDuration} minutes
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Learning Objectives */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 Learning Objectives
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {resources.objectives.map((objective, index) => (
                <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                  {objective}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Interactive Learning Content */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🧠 Key Concepts
            </Typography>
            {resources.concepts.map((concept, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  {concept.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {concept.description}
                </Typography>
                {concept.example && (
                  <Box sx={{
                    bgcolor: 'info.light',
                    color: 'info.contrastText',
                    p: 2,
                    borderRadius: 1,
                    mt: 1
                  }}>
                    <Typography variant="body2" fontWeight="medium">
                      Example: {concept.example}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </CardContent>
        </Card>

        {/* Practice Exercises */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              ✏️ Practice Exercises
            </Typography>
            {resources.exercises.map((exercise, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                  Exercise {index + 1}: {exercise.title}
                </Typography>
                <Typography variant="body2" paragraph>
                  {exercise.instruction}
                </Typography>
                {exercise.questions && (
                  <Box sx={{ pl: 2 }}>
                    {exercise.questions.map((question, qIndex) => (
                      <Typography key={qIndex} variant="body2" sx={{ mb: 1 }}>
                        {qIndex + 1}. {question}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📖 Additional Resources
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {resources.additionalResources.map((resource, index) => (
                <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                    {resource.type === 'video' ? '🎥' : resource.type === 'article' ? '📄' : '🔗'} {resource.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {resource.description}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Completion Action */}
        <Card elevation={2} sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              🎉 Ready to Continue?
            </Typography>
            <Typography variant="body2" paragraph>
              Review the concepts above and when you're ready, mark this activity as complete!
            </Typography>
            <Button
              variant="contained"
              color="success"
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
              Mark as Complete ✓
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Helper function to generate static resources based on activity
  const getStaticResourcesForActivity = (_title: string, subject: string, _difficulty: number) => {
    const baseResources = {
      Mathematics: {
        objectives: [
          "Understand fundamental mathematical concepts",
          "Apply problem-solving strategies",
          "Build confidence in mathematical thinking",
          "Connect math to real-world situations"
        ],
        concepts: [
          {
            title: "Number Recognition",
            description: "Learning to identify, read, and write numbers is the foundation of mathematics. Numbers help us count, measure, and solve problems in everyday life.",
            example: "The number 25 can be written as 'twenty-five' and represents 2 tens and 5 ones."
          },
          {
            title: "Basic Operations",
            description: "Addition, subtraction, multiplication, and division are the building blocks of mathematics. These operations help us solve problems and understand relationships between numbers.",
            example: "15 + 8 = 23 (combining quantities) or 20 - 7 = 13 (finding the difference)"
          }
        ],
        exercises: [
          {
            title: "Number Practice",
            instruction: "Practice identifying and writing numbers from 1 to 100.",
            questions: [
              "Write the number that comes after 47",
              "What number is 10 more than 35?",
              "Count by 5s from 5 to 50"
            ]
          },
          {
            title: "Problem Solving",
            instruction: "Solve these word problems step by step.",
            questions: [
              "Sarah has 12 stickers. She gives 4 to her friend. How many does she have left?",
              "There are 8 birds in a tree. 5 more birds join them. How many birds are there now?"
            ]
          }
        ],
        additionalResources: [
          {
            type: "video",
            title: "Fun with Numbers",
            description: "Interactive video lessons about number recognition and basic math concepts"
          },
          {
            type: "article",
            title: "Math in Daily Life",
            description: "Discover how we use math in cooking, shopping, and playing games"
          }
        ]
      },
      Science: {
        objectives: [
          "Explore the natural world through observation",
          "Understand basic scientific concepts",
          "Develop curiosity about how things work",
          "Learn to ask questions and find answers"
        ],
        concepts: [
          {
            title: "Living vs Non-Living",
            description: "Living things grow, move, eat, and reproduce. Non-living things don't have these characteristics but are still important in our world.",
            example: "A plant is living because it grows and needs water. A rock is non-living but provides homes for animals."
          },
          {
            title: "Simple Machines",
            description: "Simple machines like levers, wheels, and ramps make work easier. They help us move heavy objects and solve everyday problems.",
            example: "A bottle opener is a lever that helps us open bottles with less effort."
          }
        ],
        exercises: [
          {
            title: "Nature Observation",
            instruction: "Look around your environment and identify living and non-living things.",
            questions: [
              "List 5 living things you can see",
              "List 5 non-living things you can see",
              "How do you know something is living?"
            ]
          }
        ],
        additionalResources: [
          {
            type: "video",
            title: "Amazing Animals",
            description: "Learn about different animals and their habitats"
          },
          {
            type: "article",
            title: "Simple Experiments",
            description: "Safe and fun science experiments you can do at home"
          }
        ]
      },
      English: {
        objectives: [
          "Improve reading comprehension skills",
          "Expand vocabulary and word knowledge",
          "Practice writing clear sentences",
          "Develop communication skills"
        ],
        concepts: [
          {
            title: "Reading Comprehension",
            description: "Understanding what we read involves thinking about the main idea, details, and connecting the story to our own experiences.",
            example: "After reading a story about friendship, we can discuss what makes a good friend."
          },
          {
            title: "Vocabulary Building",
            description: "Learning new words helps us express our thoughts better and understand more complex texts.",
            example: "Instead of saying 'big', we could use words like 'enormous', 'gigantic', or 'massive'."
          }
        ],
        exercises: [
          {
            title: "Reading Practice",
            instruction: "Read a short story and answer questions about it.",
            questions: [
              "What was the main character's problem?",
              "How was the problem solved?",
              "What would you do in the same situation?"
            ]
          }
        ],
        additionalResources: [
          {
            type: "article",
            title: "Fun Stories",
            description: "Age-appropriate stories to practice reading skills"
          },
          {
            type: "video",
            title: "Word Games",
            description: "Interactive games to build vocabulary and spelling skills"
          }
        ]
      },
      General: {
        objectives: [
          "Develop critical thinking skills",
          "Build confidence in learning",
          "Practice problem-solving strategies",
          "Connect learning to real life"
        ],
        concepts: [
          {
            title: "Learning Strategies",
            description: "Good learners use different strategies like asking questions, making connections, and practicing regularly.",
            example: "When learning something new, try to connect it to something you already know."
          }
        ],
        exercises: [
          {
            title: "Reflection",
            instruction: "Think about your learning and set goals.",
            questions: [
              "What did you learn today?",
              "What was challenging?",
              "What would you like to learn next?"
            ]
          }
        ],
        additionalResources: [
          {
            type: "article",
            title: "Study Tips",
            description: "Helpful strategies for effective learning"
          }
        ]
      }
    };

    return baseResources[subject as keyof typeof baseResources] || baseResources.General;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', borderRadius: 2 }}>
      {renderContent()}
    </Box>
  );
};

export default ActivityContent;