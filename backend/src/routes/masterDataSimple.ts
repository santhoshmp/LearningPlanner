import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Simple Grade Management Routes (bypassing service layer for testing)
router.get('/grades', async (req, res) => {
  try {
    const grades = await prisma.gradeLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    console.log(`Found ${grades.length} grades in simple route`);
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    console.log(`Found ${subjects.length} subjects in simple route`);
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/topics/by-subject/:grade/:subjectId', async (req, res) => {
  try {
    const { grade, subjectId } = req.params;
    
    // Find the grade and subject
    const gradeRecord = await prisma.gradeLevel.findUnique({
      where: { grade: grade }
    });
    
    const subjectRecord = await prisma.subject.findUnique({
      where: { name: subjectId }
    });
    
    if (!gradeRecord || !subjectRecord) {
      return res.status(404).json({ error: 'Grade or subject not found' });
    }
    
    const topics = await prisma.topic.findMany({
      where: {
        gradeId: gradeRecord.id,
        subjectId: subjectRecord.id,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log(`Found ${topics.length} topics for ${grade} ${subjectId}`);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

export default router;