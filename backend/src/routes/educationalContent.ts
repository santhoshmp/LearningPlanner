import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { educationalContentService } from '../services/educationalContentService';
import { logger } from '../utils/logger';

const router = express.Router();

// Get educational content for a specific topic
router.get('/topic/:grade/:subjectId/:topicId', authenticateToken, async (req, res) => {
  try {
    const { grade, subjectId, topicId } = req.params;
    
    const content = await educationalContentService.getTopicContent(grade, subjectId, topicId);
    
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found for the specified topic' 
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error fetching topic content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch topic content' 
    });
  }
});

// Get content by type (articles or videos)
router.get('/type/:grade/:subjectId/:topicId/:type', authenticateToken, async (req, res) => {
  try {
    const { grade, subjectId, topicId, type } = req.params;
    
    if (type !== 'article' && type !== 'video') {
      return res.status(400).json({ 
        success: false, 
        message: 'Content type must be either "article" or "video"' 
      });
    }

    const content = await educationalContentService.getContentByType(grade, subjectId, topicId, type);
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error fetching content by type:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch content' 
    });
  }
});

// Get all content for a grade level
router.get('/grade/:grade', authenticateToken, async (req, res) => {
  try {
    const { grade } = req.params;
    
    const content = await educationalContentService.getAllContentForGrade(grade);
    
    if (!content) {
      return res.status(404).json({ 
        success: false, 
        message: 'Content not found for the specified grade' 
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    logger.error('Error fetching grade content:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch grade content' 
    });
  }
});

// Get child's skill profile
router.get('/skills/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user?.id;

    // Verify the child belongs to the authenticated user
    const child = await educationalContentService.getChildSkillProfile(childId);
    if (!child) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child profile not found' 
      });
    }

    res.json({
      success: true,
      data: child
    });
  } catch (error) {
    logger.error('Error fetching skill profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch skill profile' 
    });
  }
});

// Get skill summary for dashboard
router.get('/skills/:childId/summary', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    
    const summary = await educationalContentService.getSkillSummary(childId);
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Skill summary not found' 
      });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching skill summary:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch skill summary' 
    });
  }
});

// Update skill progress after activity completion
router.post('/skills/:childId/progress', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { subjectId, topicId, score, timeSpent } = req.body;

    if (!subjectId || !topicId || score === undefined || timeSpent === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: subjectId, topicId, score, timeSpent' 
      });
    }

    if (score < 0 || score > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Score must be between 0 and 100' 
      });
    }

    const updatedProfile = await educationalContentService.updateChildSkillProgress(
      childId, 
      subjectId, 
      topicId, 
      score, 
      timeSpent
    );

    if (!updatedProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Failed to update skill progress' 
      });
    }

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Skill progress updated successfully'
    });
  } catch (error) {
    logger.error('Error updating skill progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update skill progress' 
    });
  }
});

// Get recommended content based on skill level
router.get('/recommendations/:childId', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { subjectId } = req.query;

    const recommendations = await educationalContentService.getRecommendedContent(
      childId, 
      subjectId as string
    );

    if (!recommendations) {
      return res.status(404).json({ 
        success: false, 
        message: 'No recommendations found' 
      });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('Error fetching recommendations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch recommendations' 
    });
  }
});

// Initialize skill profile for a child
router.post('/skills/:childId/initialize', authenticateToken, async (req, res) => {
  try {
    const { childId } = req.params;
    const { gradeLevel } = req.body;

    if (!gradeLevel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Grade level is required' 
      });
    }

    const skillProfile = await educationalContentService.initializeChildSkillProfile(childId, gradeLevel);

    res.json({
      success: true,
      data: skillProfile,
      message: 'Skill profile initialized successfully'
    });
  } catch (error) {
    logger.error('Error initializing skill profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize skill profile' 
    });
  }
});

export default router;