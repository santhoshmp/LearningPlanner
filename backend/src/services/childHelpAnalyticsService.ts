import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

export interface ChildHelpAnalytics {
  totalHelpRequests: number;
  helpRequestsToday: number;
  helpRequestsThisWeek: number;
  frequentTopics: string[];
  averageResponseTime: number;
  mostHelpfulResponses: any[];
  helpSeekingPattern: 'independent' | 'moderate' | 'frequent';
  parentNotificationThreshold: number;
  shouldNotifyParent: boolean;
}

export interface HelpRequestPattern {
  timeOfDay: string;
  subject: string;
  difficulty: number;
  questionType: 'concept' | 'procedure' | 'application' | 'general';
  wasResolved: boolean;
}

export interface ParentNotification {
  id: string;
  childId: string;
  type: 'frequent_help_requests' | 'struggling_with_topic' | 'help_pattern_change';
  message: string;
  helpRequestCount: number;
  timeframe: string;
  suggestions: string[];
  createdAt: string;
}

export const childHelpAnalyticsService = {
  /**
   * Get comprehensive help analytics for a child
   */
  getChildHelpAnalytics: async (childId: string): Promise<ChildHelpAnalytics> => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all help requests for the child
      const allHelpRequests = await prisma.helpRequest.findMany({
        where: { childId },
        orderBy: { timestamp: 'desc' }
      });

      // Get today's help requests
      const todayRequests = allHelpRequests.filter(
        req => req.timestamp >= todayStart
      );

      // Get this week's help requests
      const weekRequests = allHelpRequests.filter(
        req => req.timestamp >= weekStart
      );

      // Analyze frequent topics from context
      const topicCounts: Record<string, number> = {};
      allHelpRequests.forEach(req => {
        const context = req.context as any;
        if (context?.subject) {
          topicCounts[context.subject] = (topicCounts[context.subject] || 0) + 1;
        }
      });

      const frequentTopics = Object.entries(topicCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);

      // Calculate average response time (mock for now)
      const averageResponseTime = 2.5; // seconds

      // Get most helpful responses (those marked as resolved positively)
      const helpfulResponses = allHelpRequests
        .filter(req => req.isResolved)
        .slice(0, 3);

      // Determine help seeking pattern
      const weeklyRate = weekRequests.length / 7;
      let helpSeekingPattern: 'independent' | 'moderate' | 'frequent';
      
      if (weeklyRate < 1) {
        helpSeekingPattern = 'independent';
      } else if (weeklyRate < 3) {
        helpSeekingPattern = 'moderate';
      } else {
        helpSeekingPattern = 'frequent';
      }

      // Determine if parent should be notified
      const parentNotificationThreshold = 5;
      const shouldNotifyParent = weekRequests.length >= parentNotificationThreshold;

      return {
        totalHelpRequests: allHelpRequests.length,
        helpRequestsToday: todayRequests.length,
        helpRequestsThisWeek: weekRequests.length,
        frequentTopics,
        averageResponseTime,
        mostHelpfulResponses: helpfulResponses,
        helpSeekingPattern,
        parentNotificationThreshold,
        shouldNotifyParent
      };
    } catch (error) {
      logger.error('Error getting child help analytics:', error);
      throw new Error('Failed to get help analytics');
    }
  },

  /**
   * Get help request patterns for insights
   */
  getHelpRequestPatterns: async (
    childId: string, 
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<HelpRequestPattern[]> => {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const helpRequests = await prisma.helpRequest.findMany({
        where: {
          childId,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      return helpRequests.map(req => {
        const context = req.context as any;
        const hour = req.timestamp.getHours();
        
        let timeOfDay: string;
        if (hour < 6) timeOfDay = 'early_morning';
        else if (hour < 12) timeOfDay = 'morning';
        else if (hour < 17) timeOfDay = 'afternoon';
        else if (hour < 21) timeOfDay = 'evening';
        else timeOfDay = 'night';

        // Analyze question type based on content
        const question = req.question.toLowerCase();
        let questionType: 'concept' | 'procedure' | 'application' | 'general';
        
        if (question.includes('what') || question.includes('why') || question.includes('explain')) {
          questionType = 'concept';
        } else if (question.includes('how') || question.includes('step')) {
          questionType = 'procedure';
        } else if (question.includes('solve') || question.includes('calculate')) {
          questionType = 'application';
        } else {
          questionType = 'general';
        }

        return {
          timeOfDay,
          subject: context?.subject || 'unknown',
          difficulty: context?.difficulty || 1,
          questionType,
          wasResolved: req.isResolved
        };
      });
    } catch (error) {
      logger.error('Error getting help request patterns:', error);
      return [];
    }
  },

  /**
   * Check if parent should be notified about help requests
   */
  checkParentNotificationNeeded: async (childId: string): Promise<ParentNotification | null> => {
    try {
      const analytics = await childHelpAnalyticsService.getChildHelpAnalytics(childId);
      
      if (!analytics.shouldNotifyParent) {
        return null;
      }

      // Check if we've already sent a notification recently
      const recentNotification = await prisma.parentNotification.findFirst({
        where: {
          childId,
          type: 'frequent_help_requests',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentNotification) {
        return null; // Don't spam parents
      }

      // Create notification
      const notification = await prisma.parentNotification.create({
        data: {
          childId,
          type: 'frequent_help_requests',
          message: `Your child has requested help ${analytics.helpRequestsThisWeek} times this week, which is above the typical range. This could indicate they're working on challenging material or need additional support.`,
          helpRequestCount: analytics.helpRequestsThisWeek,
          timeframe: 'week',
          suggestions: [
            'Review the topics your child is asking about most frequently',
            'Consider adjusting the difficulty level of activities',
            'Spend some time working through challenging concepts together',
            'Celebrate their curiosity and willingness to ask for help'
          ]
        }
      });

      // Send email notification to parent
      await childHelpAnalyticsService.sendParentNotificationEmail(childId, notification);

      return {
        id: notification.id,
        childId: notification.childId,
        type: notification.type as any,
        message: notification.message,
        helpRequestCount: notification.helpRequestCount,
        timeframe: notification.timeframe,
        suggestions: notification.suggestions as string[],
        createdAt: notification.createdAt.toISOString()
      };
    } catch (error) {
      logger.error('Error checking parent notification:', error);
      return null;
    }
  },

  /**
   * Send email notification to parent about child's help requests
   */
  sendParentNotificationEmail: async (childId: string, notification: any): Promise<void> => {
    try {
      // Get child and parent information
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        include: { user: true }
      });

      if (!child || !child.user.email) {
        logger.warn(`No parent email found for child ${childId}`);
        return;
      }

      const emailContent = {
        to: child.user.email,
        subject: `Learning Update: ${child.name} is Actively Seeking Help`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Learning Progress Update</h2>
            
            <p>Hello,</p>
            
            <p>We wanted to share an update about <strong>${child.name}</strong>'s learning activity:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Help Request Summary</h3>
              <p>${notification.message}</p>
              
              <p><strong>Help requests this week:</strong> ${notification.helpRequestCount}</p>
              <p><strong>Most frequent topics:</strong> ${child.name} has been asking about various subjects</p>
            </div>
            
            <h3 style="color: #333;">What This Means</h3>
            <p>Frequent help requests can indicate:</p>
            <ul>
              <li>Your child is engaged and actively learning</li>
              <li>They're working on appropriately challenging material</li>
              <li>They feel comfortable asking for help (which is great!)</li>
              <li>Some concepts might need additional reinforcement</li>
            </ul>
            
            <h3 style="color: #333;">Suggestions</h3>
            <ul>
              ${notification.suggestions.map((suggestion: string) => `<li>${suggestion}</li>`).join('')}
            </ul>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Remember:</strong> Asking for help is a positive learning behavior! This shows ${child.name} is engaged and wants to understand the material.</p>
            </div>
            
            <p>You can view detailed progress reports and help request history in your parent dashboard.</p>
            
            <p>Best regards,<br>The AI Study Planner Team</p>
          </div>
        `
      };

      await emailService.sendEmail(emailContent);
      logger.info(`Parent notification email sent for child ${childId}`);
    } catch (error) {
      logger.error('Error sending parent notification email:', error);
    }
  },

  /**
   * Get personalized help suggestions based on child's history
   */
  getPersonalizedSuggestions: async (childId: string, subject: string): Promise<string[]> => {
    try {
      const patterns = await childHelpAnalyticsService.getHelpRequestPatterns(childId, 'week');
      
      // Filter patterns for the current subject
      const subjectPatterns = patterns.filter(p => p.subject === subject);
      
      // Analyze common question types
      const questionTypes = subjectPatterns.map(p => p.questionType);
      const conceptQuestions = questionTypes.filter(t => t === 'concept').length;
      const procedureQuestions = questionTypes.filter(t => t === 'procedure').length;
      
      const suggestions: string[] = [];
      
      // Add suggestions based on patterns
      if (conceptQuestions > procedureQuestions) {
        suggestions.push(
          `What does this ${subject} concept mean?`,
          `Can you explain this ${subject} idea differently?`,
          `Why is this important in ${subject}?`
        );
      } else {
        suggestions.push(
          `How do I solve this ${subject} problem?`,
          `What's the next step in this ${subject} process?`,
          `Can you walk me through this ${subject} method?`
        );
      }
      
      // Add subject-specific suggestions
      switch (subject.toLowerCase()) {
        case 'math':
          if (conceptQuestions > 2) {
            suggestions.push('What does this math symbol mean?', 'How does this formula work?');
          }
          break;
        case 'science':
          if (conceptQuestions > 2) {
            suggestions.push('Why does this happen in nature?', 'How does this scientific process work?');
          }
          break;
        case 'reading':
          suggestions.push('What is the main idea here?', 'What does this word mean?');
          break;
      }
      
      return suggestions.slice(0, 3); // Limit to 3 personalized suggestions
    } catch (error) {
      logger.error('Error getting personalized suggestions:', error);
      return [];
    }
  },

  /**
   * Mark help request as resolved
   */
  markHelpRequestResolved: async (helpRequestId: string, wasHelpful: boolean): Promise<void> => {
    try {
      await prisma.helpRequest.update({
        where: { id: helpRequestId },
        data: {
          isResolved: true,
          // Store additional feedback in context
          context: {
            ...(await prisma.helpRequest.findUnique({ where: { id: helpRequestId } }))?.context,
            wasHelpful,
            resolvedAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Error marking help request as resolved:', error);
      throw new Error('Failed to mark help request as resolved');
    }
  },

  /**
   * Report inappropriate or unhelpful response
   */
  reportResponse: async (helpRequestId: string, reason: string, details?: string): Promise<void> => {
    try {
      // Update the help request with report information
      await prisma.helpRequest.update({
        where: { id: helpRequestId },
        data: {
          context: {
            ...(await prisma.helpRequest.findUnique({ where: { id: helpRequestId } }))?.context,
            reported: true,
            reportReason: reason,
            reportDetails: details,
            reportedAt: new Date().toISOString()
          }
        }
      });

      // Log the report for review
      logger.warn(`Help request reported: ${helpRequestId}`, {
        reason,
        details,
        helpRequestId
      });

      // In a production system, this would trigger a review process
    } catch (error) {
      logger.error('Error reporting response:', error);
      throw new Error('Failed to report response');
    }
  }
};

export default childHelpAnalyticsService;