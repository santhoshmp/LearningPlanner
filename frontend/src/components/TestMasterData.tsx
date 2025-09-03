import React, { useState } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { GradeSelector } from './common';
import { SubjectSelector } from './common';
import { TopicSelector } from './common';

const TestMasterData: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Master Data Test Page
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Master Data Components
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <GradeSelector
              value={selectedGrade}
              onChange={setSelectedGrade}
              label="Select Grade"
              showAgeRange={true}
            />
            {selectedGrade && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected Grade: {selectedGrade}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <SubjectSelector
              value={selectedSubject}
              onChange={setSelectedSubject}
              label="Select Subject"
              grade={selectedGrade}
              disabled={!selectedGrade}
            />
            {selectedSubject && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected Subject: {selectedSubject}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TopicSelector
              value={selectedTopic}
              onChange={setSelectedTopic}
              label="Select Topic"
              grade={selectedGrade}
              subject={selectedSubject}
              disabled={!selectedGrade || !selectedSubject}
            />
            {selectedTopic && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected Topic: {selectedTopic}
              </Typography>
            )}
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Selection:
          </Typography>
          <Typography variant="body1">
            Grade: {selectedGrade || 'None'} | 
            Subject: {selectedSubject || 'None'} | 
            Topic: {selectedTopic || 'None'}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TestMasterData;