import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ReadingMaterialsService } from '../services/readingMaterialsService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();
const readingService = new ReadingMaterialsService(prisma);

// Validation schemas
const createReadingMaterialSchema = z.object({
  topicId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  url: z.string().url(),
  author: z.string().max(100).optional(),
  publisher: z.string().max(100).optional(),
  isbn: z.string().max(20).optional(),
  readingLevel: z.string().min(1).max(50),
  wordCount: z.number().positive().optional(),
  language: z.string().min(2).max(10).default('en'),
  format: z.enum(['pdf', 'html', 'epub', 'external']),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  estimatedReadingTime: z.number().positive(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY']).optional(),
  ageAppropriate: z.boolean().optional()
});

const getReadingMaterialsSchema = z.object({
  topicId: z.string().cuid(),
  readingLevel: z.string().optional(),
  format: z.enum(['pdf', 'html', 'epub', 'external']).optional(),
  language: z.string().optional(),
  maxReadingTime: z.number().positive().optional(),
  minReadingTime: z.number().positive().optional(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERY']).optional(),
  safetyRating: z.enum(['SAFE', 'REVIEW_NEEDED', 'RESTRICTED', 'BLOCKED']).optional()
});

const discoverMaterialsSchema = z.object({
  topicId: z.string().cuid(),
  gradeLevel: z.string().min(1),
  subjectName: z.string().min(1),
  readingLevel: z.string().optional()
});

const getRecommendationsSchema = z.object({
  topicId: z.string().cuid(),
  childAge: z.number().min(3).max(18),
  readingLevel: z.string().optional(),
  preferredFormats: z.array(z.enum(['pdf', 'html', 'epub', 'external'])).optional()
});

/**
 * POST /api/reading-materials
 * Create a new reading material resource
 */
router.post('/', 
  authenticateToken,
  validateRequest(createReadingMaterialSchema),
  async (req, res) => {
    try {
      const materialData = req.body;
      const { topicId, difficulty, ageAppropriate, ...data } = materialData;

      const resource = await readingService.createReadingMaterial(
        topicId,
        data,
        difficulty,
        ageAppropriate
      );

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Reading material created successfully'
      });
    } catch (error) {
      console.error('Error creating reading material:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create reading material',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/reading-materials/topic/:topicId
 * Get reading materials for a specific topic
 */
router.get('/topic/:topicId',
  authenticateToken,
  async (req, res) => {
    try {
      const { topicId } = req.params;
      const filters = req.query;

      // Convert query parameters to appropriate types
      const processedFilters: any = {};
      if (filters.readingLevel) processedFilters.readingLevel = filters.readingLevel;
      if (filters.format) processedFilters.format = filters.format;
      if (filters.language) processedFilters.language = filters.language;
      if (filters.maxReadingTime) processedFilters.maxReadingTime = parseInt(filters.maxReadingTime as string);
      if (filters.minReadingTime) processedFilters.minReadingTime = parseInt(filters.minReadingTime as string);
      if (filters.author) processedFilters.author = filters.author;
      if (filters.publisher) processedFilters.publisher = filters.publisher;
      if (filters.difficulty) processedFilters.difficulty = filters.difficulty;
      if (filters.safetyRating) processedFilters.safetyRating = filters.safetyRating;

      const materials = await readingService.getReadingMaterialsByTopic(topicId, processedFilters);

      res.json({
        success: true,
        data: materials,
        count: materials.length
      });
    } catch (error) {
      console.error('Error fetching reading materials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reading materials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/reading-materials/discover
 * Discover new reading materials for a topic
 */
router.post('/discover',
  authenticateToken,
  validateRequest(discoverMaterialsSchema),
  async (req, res) => {
    try {
      const { topicId, gradeLevel, subjectName, readingLevel } = req.body;

      const recommendations = await readingService.discoverReadingMaterials(
        topicId,
        gradeLevel,
        subjectName,
        readingLevel
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: `Found ${recommendations.length} reading material recommendations`
      });
    } catch (error) {
      console.error('Error discovering reading materials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to discover reading materials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/reading-materials/recommendations
 * Get personalized reading material recommendations
 */
router.post('/recommendations',
  authenticateToken,
  validateRequest(getRecommendationsSchema),
  async (req, res) => {
    try {
      const { topicId, childAge, readingLevel, preferredFormats } = req.body;

      const recommendations = await readingService.getReadingRecommendations(
        topicId,
        childAge,
        readingLevel,
        preferredFormats
      );

      res.json({
        success: true,
        data: recommendations,
        count: recommendations.length,
        message: 'Personalized reading recommendations generated'
      });
    } catch (error) {
      console.error('Error getting reading recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reading recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/reading-materials/:resourceId/validate
 * Validate a specific reading material resource
 */
router.post('/:resourceId/validate',
  authenticateToken,
  async (req, res) => {
    try {
      const { resourceId } = req.params;

      const validation = await readingService.validateReadingMaterial(resourceId);

      res.json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Resource is valid' : 'Resource validation failed'
      });
    } catch (error) {
      console.error('Error validating reading material:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate reading material',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/reading-materials/validate-all
 * Bulk validate all reading materials
 */
router.post('/validate-all',
  authenticateToken,
  async (req, res) => {
    try {
      const results = await readingService.validateAllReadingMaterials();

      res.json({
        success: true,
        data: results,
        message: `Validated ${results.total} materials: ${results.validated} valid, ${results.broken} broken`
      });
    } catch (error) {
      console.error('Error bulk validating reading materials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate reading materials',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/reading-materials/stats
 * Get reading materials statistics
 */
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await readingService.getReadingMaterialsStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching reading materials stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reading materials statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/reading-materials/formats
 * Get available reading material formats
 */
router.get('/formats',
  authenticateToken,
  async (req, res) => {
    try {
      const formats = [
        { value: 'pdf', label: 'PDF Document', description: 'Downloadable PDF files' },
        { value: 'html', label: 'Web Article', description: 'Online web-based content' },
        { value: 'epub', label: 'E-Book', description: 'Electronic book format' },
        { value: 'external', label: 'External Link', description: 'Links to external educational websites' }
      ];

      res.json({
        success: true,
        data: formats
      });
    } catch (error) {
      console.error('Error fetching reading material formats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reading material formats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/reading-materials/reading-levels
 * Get available reading levels
 */
router.get('/reading-levels',
  authenticateToken,
  async (req, res) => {
    try {
      const readingLevels = [
        { value: 'pre-k', label: 'Pre-K', description: 'Pre-Kindergarten level' },
        { value: 'kindergarten', label: 'Kindergarten', description: 'Kindergarten reading level' },
        { value: 'grade-1', label: '1st Grade', description: '1st grade reading level' },
        { value: 'grade-2', label: '2nd Grade', description: '2nd grade reading level' },
        { value: 'grade-3', label: '3rd Grade', description: '3rd grade reading level' },
        { value: 'grade-4', label: '4th Grade', description: '4th grade reading level' },
        { value: 'grade-5', label: '5th Grade', description: '5th grade reading level' },
        { value: 'grade-6', label: '6th Grade', description: '6th grade reading level' },
        { value: 'grade-7', label: '7th Grade', description: '7th grade reading level' },
        { value: 'grade-8', label: '8th Grade', description: '8th grade reading level' },
        { value: 'grade-9', label: '9th Grade', description: '9th grade reading level' },
        { value: 'grade-10', label: '10th Grade', description: '10th grade reading level' },
        { value: 'grade-11', label: '11th Grade', description: '11th grade reading level' },
        { value: 'grade-12', label: '12th Grade', description: '12th grade reading level' }
      ];

      res.json({
        success: true,
        data: readingLevels
      });
    } catch (error) {
      console.error('Error fetching reading levels:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reading levels',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;