import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Service for monitoring and tracking system metrics
 */
export const monitoringService = {
  /**
   * Track Claude API usage for cost monitoring
   * @param requestType Type of Claude API request
   * @param inputTokens Number of input tokens used
   * @param outputTokens Number of output tokens used
   * @param userId User who initiated the request
   * @param childId Child profile associated with the request (if applicable)
   * @param success Whether the request was successful
   */
  trackClaudeUsage: async (
    requestType: string,
    inputTokens: number,
    outputTokens: number,
    userId: string,
    childId?: string,
    success: boolean = true
  ) => {
    try {
      // Calculate estimated cost based on Claude's pricing
      // These rates should be stored in configuration and updated as needed
      const inputTokenRate = 0.000003; // $0.003 per 1K input tokens (example rate)
      const outputTokenRate = 0.000015; // $0.015 per 1K output tokens (example rate)
      
      const estimatedCost = 
        (inputTokens * inputTokenRate) + 
        (outputTokens * outputTokenRate);
      
      // Store usage data in database
      await prisma.aiUsage.create({
        data: {
          requestType,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          estimatedCost,
          userId,
          childId,
          success,
          timestamp: new Date()
        }
      });
      
      // Log usage for monitoring
      logger.info({
        type: 'claude_api_usage',
        requestType,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost,
        userId,
        childId,
        success,
        timestamp: new Date().toISOString()
      });
      
      return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost
      };
    } catch (error) {
      logger.error('Error tracking Claude API usage:', error);
      // Don't throw error to prevent disrupting the main application flow
    }
  },
  
  /**
   * Get Claude API usage statistics for a time period
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @returns Usage statistics
   */
  getClaudeUsageStats: async (startDate: Date, endDate: Date) => {
    try {
      // Get total usage for the period
      const totalUsage = await prisma.aiUsage.aggregate({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          estimatedCost: true
        },
        _count: true
      });
      
      // Get usage breakdown by request type
      const usageByType = await prisma.aiUsage.groupBy({
        by: ['requestType'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalTokens: true,
          estimatedCost: true
        },
        _count: true
      });
      
      // Get daily usage trend
      const dailyUsage = await prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          SUM(totalTokens) as tokens,
          SUM(estimatedCost) as cost,
          COUNT(*) as requests
        FROM AiUsage
        WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `;
      
      return {
        totalRequests: totalUsage._count,
        totalTokens: totalUsage._sum.totalTokens || 0,
        totalCost: totalUsage._sum.estimatedCost || 0,
        usageByType,
        dailyUsage
      };
    } catch (error) {
      logger.error('Error getting Claude API usage stats:', error);
      throw new Error('Failed to retrieve Claude API usage statistics');
    }
  },
  
  /**
   * Track API errors for monitoring and alerting
   * @param errorType Type of error
   * @param endpoint Affected endpoint
   * @param errorMessage Error message
   * @param userId User who experienced the error (if applicable)
   * @param requestId Request ID associated with the error
   */
  trackApiError: async (
    errorType: string,
    endpoint: string,
    errorMessage: string,
    userId?: string,
    requestId?: string
  ) => {
    try {
      // Store error in database for tracking
      await prisma.errorLog.create({
        data: {
          errorType,
          endpoint,
          errorMessage,
          userId: userId || 'unknown',
          requestId: requestId || 'unknown',
          timestamp: new Date()
        }
      });
      
      // Log error for monitoring
      logger.error({
        type: 'api_error',
        errorType,
        endpoint,
        errorMessage,
        userId: userId || 'unknown',
        requestId: requestId || 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error tracking API error:', error);
      // Don't throw error to prevent disrupting the main application flow
    }
  },
  
  /**
   * Get error statistics for a time period
   * @param startDate Start date for the report
   * @param endDate End date for the report
   * @returns Error statistics
   */
  getErrorStats: async (startDate: Date, endDate: Date) => {
    try {
      // Get total errors for the period
      const totalErrors = await prisma.errorLog.count({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Get errors by type
      const errorsByType = await prisma.errorLog.groupBy({
        by: ['errorType'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      // Get errors by endpoint
      const errorsByEndpoint = await prisma.errorLog.groupBy({
        by: ['endpoint'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: true
      });
      
      return {
        totalErrors,
        errorsByType,
        errorsByEndpoint
      };
    } catch (error) {
      logger.error('Error getting error statistics:', error);
      throw new Error('Failed to retrieve error statistics');
    }
  }
};

export default monitoringService;