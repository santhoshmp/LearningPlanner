import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider
} from '@mui/material';
import { School as SchoolIcon, MenuBook as ContentIcon } from '@mui/icons-material';
import EducationalContentViewer from '../studyPlan/EducationalContentViewer';
import ChildSkillLevels from '../child/ChildSkillLevels';

const EducationalContentDemo: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedSubject, setSelectedSubject] = useState('math-1');
  const [selectedTopic, setSelectedTopic] = useState('counting-1-10');
  const [selectedChild, setSelectedChild] = useState('demo-child-1');

  // Demo data
  const grades = [
    { value: '1', label: 'Grade 1' },
    { value: '5', label: 'Grade 5' },
    { value: '8', label: 'Grade 8' }
  ];

  const subjects = {
    '1': [
      { value: 'math-1', label: 'Mathematics' },
      { value: 'english-1', label: 'English' },
      { value: 'science-1', label: 'Science' }
    ],
    '5': [
      { value: 'math-5', label: 'Mathematics' },
      { value: 'english-5', label: 'English' },
      { value: 'science-5', label: 'Science' }
    ],
    '8': [
      { value: 'math-8', label: 'Mathematics' },
      { value: 'english-8', label: 'English' },
      { value: 'science-8', label: 'Science' }
    ]
  };

  const topics = {
    'math-1': [
      { value: 'counting-1-10', label: 'Counting 1-10' },
      { value: 'basic-addition', label: 'Basic Addition' }
    ],
    'english-1': [
      { value: 'alphabet-recognition', label: 'Alphabet Recognition' }
    ],
    'science-1': [
      { value: 'living-nonliving', label: 'Living vs Non-living' }
    ],
    'math-5': [
      { value: 'fractions-decimals', label: 'Fractions & Decimals' }
    ],
    'science-5': [
      { value: 'human-body-systems', label: 'Human Body Systems' }
    ],
    'math-8': [
      { value: 'algebra-basics', label: 'Basic Algebra' }
    ],
    'science-8': [
      { value: 'chemistry-basics', label: 'Basic Chemistry' }
    ]
  };

  const handleContentComplete = (contentId: string, timeSpent: number) => {
    console.log(`Content ${contentId} completed in ${timeSpent} minutes`);
    // Here you would normally update the skill progress
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SchoolIcon color="primary" />
        Educational Content & Skills Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo shows the educational content system with articles and YouTube videos organized by grade, subject, and topic, 
        plus skill level tracking for children.
      </Typography>

      <Grid container spacing={3}>
        {/* Content Selection Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContentIcon />
                Educational Content Viewer
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Grade</InputLabel>
                    <Select
                      value={selectedGrade}
                      label="Grade"
                      onChange={(e) => {
                        setSelectedGrade(e.target.value);
                        // Reset subject and topic when grade changes
                        const newSubjects = subjects[e.target.value as keyof typeof subjects];
                        if (newSubjects.length > 0) {
                          setSelectedSubject(newSubjects[0].value);
                          const newTopics = topics[newSubjects[0].value as keyof typeof topics];
                          if (newTopics && newTopics.length > 0) {
                            setSelectedTopic(newTopics[0].value);
                          }
                        }
                      }}
                    >
                      {grades.map((grade) => (
                        <MenuItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={selectedSubject}
                      label="Subject"
                      onChange={(e) => {
                        setSelectedSubject(e.target.value);
                        // Reset topic when subject changes
                        const newTopics = topics[e.target.value as keyof typeof topics];
                        if (newTopics && newTopics.length > 0) {
                          setSelectedTopic(newTopics[0].value);
                        }
                      }}
                    >
                      {subjects[selectedGrade as keyof typeof subjects]?.map((subject) => (
                        <MenuItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Topic</InputLabel>
                    <Select
                      value={selectedTopic}
                      label="Topic"
                      onChange={(e) => setSelectedTopic(e.target.value)}
                    >
                      {topics[selectedSubject as keyof typeof topics]?.map((topic) => (
                        <MenuItem key={topic.value} value={topic.value}>
                          {topic.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <EducationalContentViewer
                  grade={selectedGrade}
                  subjectId={selectedSubject}
                  topicId={selectedTopic}
                  topicName={topics[selectedSubject as keyof typeof topics]?.find(t => t.value === selectedTopic)?.label || 'Selected Topic'}
                  onContentComplete={handleContentComplete}
                />
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Skill Levels Demo */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon />
                Child Skill Levels
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                This shows how skill levels are tracked for each child across different subjects and topics.
                Note: This is demo data - in a real application, this would be populated from actual child profiles.
              </Typography>

              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <ChildSkillLevels childId="demo-child-1" />
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Features Implemented:
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li><strong>Educational Content Data:</strong> Organized by grade, subject, and topic with articles and YouTube videos</li>
            <li><strong>Skill Level Tracking:</strong> Individual progress tracking for each child across subjects and topics</li>
            <li><strong>Content Viewer:</strong> Interactive interface to browse and access educational resources</li>
            <li><strong>Progress Monitoring:</strong> Visual representation of learning progress and skill mastery</li>
            <li><strong>Personalized Recommendations:</strong> Content suggestions based on current skill levels</li>
            <li><strong>Safety Ratings:</strong> All content is pre-screened for age-appropriateness</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default EducationalContentDemo;