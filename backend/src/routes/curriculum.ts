import express from 'express';
import { getTopicsByGradeAndSubject, getSubjectsByGrade, getAllGrades } from '../data/curriculumMasterData';

const router = express.Router();

// Get all available grades
router.get('/grades', (req, res) => {
  try {
    const grades = getAllGrades();
    res.json({ grades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Get subjects by grade
router.get('/subjects/:grade', (req, res) => {
  try {
    const { grade } = req.params;
    const subjects = getSubjectsByGrade(grade);
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get topics by grade and subject
router.get('/topics/:grade/:subjectId', (req, res) => {
  try {
    const { grade, subjectId } = req.params;
    const topics = getTopicsByGradeAndSubject(grade, subjectId);
    res.json({ topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

export default router;