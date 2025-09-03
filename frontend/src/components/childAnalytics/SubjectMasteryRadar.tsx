import React from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { School, TrendingUp, Star } from '@mui/icons-material';

interface SubjectMasteryData {
  subject: string;
  proficiency: number; // 0-100
  activitiesCompleted: number;
  averageScore: number;
  timeSpent: number; // in hours
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

interface SubjectMasteryRadarProps {
  subjectData: SubjectMasteryData[];
  overallLevel: string;
}

const SubjectMasteryRadar: React.FC<SubjectMasteryRadarProps> = ({
  subjectData,
  overallLevel
}) => {
  const getSubjectColor = (proficiency: number) => {
    if (proficiency >= 80) return '#4caf50';
    if (proficiency >= 60) return '#ff9800';
    if (proficiency >= 40) return '#2196f3';
    return '#f44336';
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Expert': return <Star sx={{ color: '#ffd700' }} />;
      case 'Advanced': return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'Intermediate': return <School sx={{ color: '#ff9800' }} />;
      default: return <School sx={{ color: '#2196f3' }} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return '#ffd700';
      case 'Advanced': return '#4caf50';
      case 'Intermediate': return '#ff9800';
      default: return '#2196f3';
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Subject Mastery
          </Typography>
          <Chip 
            icon={getLevelIcon(overallLevel)}
            label={overallLevel}
            sx={{ 
              backgroundColor: getLevelColor(overallLevel),
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <Box sx={{ height: 300, mb: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subjectData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#999' }}
              />
              <Radar
                name="Proficiency"
                dataKey="proficiency"
                stroke="#2196f3"
                fill="#2196f3"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Box>        {/* 
Subject Details */}
        <Box>
          {subjectData.map((subject, index) => (
            <Box 
              key={subject.subject}
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              py={1}
              sx={{ 
                borderBottom: index < subjectData.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: getSubjectColor(subject.proficiency)
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {subject.subject}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Chip 
                  label={subject.level}
                  size="small"
                  sx={{ 
                    backgroundColor: getLevelColor(subject.level),
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {subject.proficiency}%
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Summary Stats */}
        <Box mt={3} p={2} sx={{ backgroundColor: '#f8f9fa', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            🎯 Keep practicing to improve your weakest subjects! 
            Focus on areas below 60% for the biggest learning gains.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubjectMasteryRadar;