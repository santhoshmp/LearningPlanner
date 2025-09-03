import express from 'express';
import { MasterDataService } from '../services/masterDataService';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const masterDataService = new MasterDataService(prisma);

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Grade Management Routes
router.get('/grades', async (req, res) => {
  try {
    const grades = await masterDataService.getAllGrades();
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.get('/grades/by-age/:age', async (req, res) => {
  try {
    const age = parseInt(req.params.age);
    if (isNaN(age)) {
      return res.status(400).json({ error: 'Invalid age parameter' });
    }
    
    const grade = await masterDataService.getGradeByAge(age);
    res.json(grade);
  } catch (error) {
    console.error('Error fetching grade by age:', error);
    res.status(500).json({ error: 'Failed to fetch grade by age' });
  }
});

router.get('/grades/:grade/age-range', async (req, res) => {
  try {
    const { grade } = req.params;
    const ageRange = await masterDataService.getAgeRangeByGrade(grade);
    res.json(ageRange);
  } catch (error) {
    console.error('Error fetching age range:', error);
    res.status(500).json({ error: 'Failed to fetch age range' });
  }
});

// Subject Management Routes
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await masterDataService.getAllSubjects();
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.get('/subjects/by-grade/:grade', async (req, res) => {
  try {
    const { grade } = req.params;
    const subjects = await masterDataService.getSubjectsByGrade(grade);
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects by grade:', error);
    res.status(500).json({ error: 'Failed to fetch subjects by grade' });
  }
});

router.get('/subjects/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await masterDataService.getSubjectById(subjectId);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json(subject);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Topic Management Routes
router.get('/topics/by-subject/:grade/:subjectId', async (req, res) => {
  try {
    const { grade, subjectId } = req.params;
    const topics = await masterDataService.getTopicsBySubject(grade, subjectId);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics by subject:', error);
    res.status(500).json({ error: 'Failed to fetch topics by subject' });
  }
});

router.get('/topics/hierarchy/:grade', async (req, res) => {
  try {
    const { grade } = req.params;
    const hierarchy = await masterDataService.getTopicHierarchy(grade);
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching topic hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch topic hierarchy' });
  }
});

router.get('/topics/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const topic = await masterDataService.getTopicById(topicId);
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// Resource Management Routes
router.get('/resources/by-topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { type, safetyRating, difficulty } = req.query;
    
    const filters: any = {};
    if (type) filters.resourceType = type;
    if (safetyRating) filters.safetyRating = safetyRating;
    if (difficulty) filters.difficulty = difficulty;
    
    const resources = await masterDataService.getResourcesByTopic(topicId, filters);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources by topic:', error);
    res.status(500).json({ error: 'Failed to fetch resources by topic' });
  }
});

router.get('/resources/youtube/:topicId/:grade', async (req, res) => {
  try {
    const { topicId, grade } = req.params;
    const videos = await masterDataService.getYouTubeVideosByTopic(topicId, grade);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
});

router.get('/resources/reading/:topicId/:grade', async (req, res) => {
  try {
    const { topicId, grade } = req.params;
    const materials = await masterDataService.getReadingMaterialsByTopic(topicId, grade);
    res.json(materials);
  } catch (error) {
    console.error('Error fetching reading materials:', error);
    res.status(500).json({ error: 'Failed to fetch reading materials' });
  }
});

// Validation Routes
router.get('/validate', async (req, res) => {
  try {
    const validation = await masterDataService.validateMasterData();
    res.json(validation);
  } catch (error) {
    console.error('Error validating master data:', error);
    res.status(500).json({ error: 'Failed to validate master data' });
  }
});

// Cache Management Routes
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    await masterDataService.clearCache(pattern);
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

router.get('/cache/stats', async (req, res) => {
  try {
    const stats = await masterDataService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

export default router;