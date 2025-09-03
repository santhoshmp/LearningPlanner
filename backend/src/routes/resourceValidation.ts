import express from 'express';
import { PrismaClient } from '@prisma/client';
import { ResourceValidationService } from '../services/resourceValidationService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();
const validationService = new ResourceValidationService(prisma);

// Validation schemas
const validateResourceSchema = z.object({
  resourceId: z.string().cuid()
});

const validateBatchSchema = z.object({
  resourceIds: z.array(z.string().cuid()).min(1).max(50)
});

const validateByTypeSchema = z.object({
  resourceType: z.enum(['VIDEO', 'ARTICLE', 'INTERACTIVE', 'WORKSHEET', 'GAME', 'BOOK', 'EXTERNAL_LINK'])
});

const scheduleValidationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).optional(),
  limit: z.number().positive().max(100).optional()
});

/**
 * POST /api/resource-validation/validate/:resourceId
 * Validate a single resource
 */
router.post('/validate/:resourceId',
  authenticateToken,
  async (req, res) => {
    try {
      const { resourceId } = req.params;

      const report = await validationService.validateResource(resourceId);

      res.json({
        success: true,
        data: report,
        message: `Resource validation completed. Status: ${report.validationResult.status}`
      });
    } catch (error) {
      console.error('Error validating resource:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate resource',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/resource-validation/validate-batch
 * Validate multiple resources in batch
 */
router.post('/validate-batch',
  authenticateToken,
  validateRequest(validateBatchSchema),
  async (req, res) => {
    try {
      const { resourceIds } = req.body;

      const reports = await validationService.validateResourcesBatch(resourceIds);

      const summary = {
        total: resourceIds.length,
        validated: reports.filter(r => r.validationResult.isValid).length,
        broken: reports.filter(r => !r.validationResult.isValid).length,
        safeResources: reports.filter(r => r.safetyAssessment.safetyRating === 'SAFE').length
      };

      res.json({
        success: true,
        data: {
          reports,
          summary
        },
        message: `Batch validation completed: ${summary.validated} valid, ${summary.broken} broken`
      });
    } catch (error) {
      console.error('Error validating resource batch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate resource batch',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/resource-validation/validate-by-type
 * Validate all resources of a specific type
 */
router.post('/validate-by-type',
  authenticateToken,
  validateRequest(validateByTypeSchema),
  async (req, res) => {
    try {
      const { resourceType } = req.body;

      const results = await validationService.validateAllResourcesByType(resourceType);

      res.json({
        success: true,
        data: results,
        message: `Validated ${results.total} ${resourceType} resources: ${results.validated} valid, ${results.broken} broken`
      });
    } catch (error) {
      console.error('Error validating resources by type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate resources by type',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/resource-validation/needs-validation
 * Get resources that need validation
 */
router.get('/needs-validation',
  authenticateToken,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const resources = await validationService.getResourcesNeedingValidation(limit);

      res.json({
        success: true,
        data: resources,
        count: resources.length,
        message: `Found ${resources.length} resources needing validation`
      });
    } catch (error) {
      console.error('Error fetching resources needing validation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch resources needing validation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/resource-validation/schedule
 * Schedule automatic validation
 */
router.post('/schedule',
  authenticateToken,
  async (req, res) => {
    try {
      const results = await validationService.scheduleValidation();

      res.json({
        success: true,
        data: results,
        message: `Scheduled validation for ${results.scheduled} resources`
      });
    } catch (error) {
      console.error('Error scheduling validation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule validation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/resource-validation/statistics
 * Get validation statistics
 */
router.get('/statistics',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await validationService.getValidationStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching validation statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch validation statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/resource-validation/safety-ratings
 * Get available safety ratings with descriptions
 */
router.get('/safety-ratings',
  authenticateToken,
  async (req, res) => {
    try {
      const safetyRatings = [
        {
          value: 'SAFE',
          label: 'Safe',
          description: 'Content is safe and appropriate for the target age group',
          color: '#4CAF50'
        },
        {
          value: 'REVIEW_NEEDED',
          label: 'Review Needed',
          description: 'Content requires manual review before use',
          color: '#FF9800'
        },
        {
          value: 'RESTRICTED',
          label: 'Restricted',
          description: 'Content has safety concerns and should be used with caution',
          color: '#F44336'
        },
        {
          value: 'BLOCKED',
          label: 'Blocked',
          description: 'Content is not suitable and should not be used',
          color: '#9E9E9E'
        }
      ];

      res.json({
        success: true,
        data: safetyRatings
      });
    } catch (error) {
      console.error('Error fetching safety ratings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch safety ratings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/resource-validation/validation-status
 * Get available validation statuses with descriptions
 */
router.get('/validation-status',
  authenticateToken,
  async (req, res) => {
    try {
      const validationStatuses = [
        {
          value: 'PENDING',
          label: 'Pending',
          description: 'Resource is waiting to be validated',
          color: '#2196F3'
        },
        {
          value: 'VALIDATED',
          label: 'Validated',
          description: 'Resource has been validated and is ready for use',
          color: '#4CAF50'
        },
        {
          value: 'NEEDS_UPDATE',
          label: 'Needs Update',
          description: 'Resource validation is outdated and needs refresh',
          color: '#FF9800'
        },
        {
          value: 'BROKEN',
          label: 'Broken',
          description: 'Resource is inaccessible or has validation errors',
          color: '#F44336'
        },
        {
          value: 'REMOVED',
          label: 'Removed',
          description: 'Resource has been removed from validation',
          color: '#9E9E9E'
        }
      ];

      res.json({
        success: true,
        data: validationStatuses
      });
    } catch (error) {
      console.error('Error fetching validation statuses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch validation statuses',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/resource-validation/health
 * Get validation system health status
 */
router.get('/health',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await validationService.getValidationStatistics();
      
      const healthScore = stats.totalResources > 0 
        ? Math.round((stats.validatedResources / stats.totalResources) * 100)
        : 100;

      const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical';

      const health = {
        status,
        healthScore,
        totalResources: stats.totalResources,
        validatedResources: stats.validatedResources,
        brokenResources: stats.brokenResources,
        pendingValidation: stats.pendingValidation,
        lastValidationRun: stats.lastValidationRun,
        recommendations: []
      };

      // Add recommendations based on health status
      if (stats.pendingValidation > 10) {
        health.recommendations.push('Consider running validation for pending resources');
      }
      if (stats.brokenResources > 5) {
        health.recommendations.push('Review and fix broken resources');
      }
      if (!stats.lastValidationRun || 
          new Date(stats.lastValidationRun) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        health.recommendations.push('Schedule regular validation runs');
      }

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Error fetching validation health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch validation health status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;