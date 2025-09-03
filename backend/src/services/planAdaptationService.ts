import { PrismaClient, StudyPlanStatus } from '@prisma/client';
import analyticsService from './analyticsService';
import claudeService from './claudeService';
import emailService from './emailService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

class PlanAdaptationService {
  /**
   * Adapt study plan based on child's performance
   */
  async adaptPlanBasedOnPerformance(childId: string, planId: string) {
    try {
      // Get the study plan
      const plan = await prisma.studyPlan.findUnique({
        where: { id: planId },
        include: {
          activities: {
            include: {
              progressRecords: {
                where: { childId }
              }
            }
          },
          child: true
        }
      });

      if (!plan) {
        throw new Error(`Study plan ${planId} not found`);
      }

      // Check if plan is active
      if (plan.status !== StudyPlanStatus.ACTIVE) {
        logger.info(`Plan ${planId} is not active, skipping adaptation`);
        return { adapted: false, reason: 'Plan is not active' };
      }

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(plan);
      
      // Determine if adaptation is needed
      const adaptationNeeded = this.determineAdaptationNeeded(performanceMetrics);
      
      if (!adaptationNeeded.needed) {
        logger.info(`No adaptation needed for plan ${planId}: ${adaptationNeeded.reason}`);
        return { adapted: false, reason: adaptationNeeded.reason };
      }
      
      // Generate adaptation recommendations
      const adaptationRecommendations = await this.generateAdaptationRecommendations(
        plan,
        performanceMetrics,
        adaptationNeeded.type
      );
      
      // Apply adaptations to the plan
      const adaptedPlan = await this.applyAdaptations(
        plan,
        adaptationRecommendations
      );
      
      // Notify parent about the adaptation
      await this.notifyParentAboutAdaptation(
        plan.child.parentId,
        plan.child.name,
        adaptedPlan,
        adaptationNeeded.type,
        performanceMetrics
      );
      
      return {
        adapted: true,
        adaptationType: adaptationNeeded.type,
        metrics: performanceMetrics,
        recommendations: adaptationRecommendations
      };
    } catch (error) {
      logger.error('Error adapting plan based on performance:', error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics for a study plan
   */
  private calculatePerformanceMetrics(plan) {
    // Extract activities and progress records
    const activities = plan.activities;
    
    // Initialize metrics
    const metrics = {
      totalActivities: activities.length,
      completedActivities: 0,
      averageScore: 0,
      totalScore: 0,
      lowScoreActivities: 0,
      highScoreActivities: 0,
      averageTimeSpent: 0,
      totalTimeSpent: 0,
      helpRequestCount: 0,
      completionRate: 0,
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    };
    
    // Calculate metrics from activities and progress records
    activities.forEach(activity => {
      // Count activities by difficulty
      if (activity.difficulty <= 3) {
        metrics.difficultyDistribution.easy++;
      } else if (activity.difficulty <= 7) {
        metrics.difficultyDistribution.medium++;
      } else {
        metrics.difficultyDistribution.hard++;
      }
      
      // Process progress records if they exist
      if (activity.progressRecords && activity.progressRecords.length > 0) {
        const record = activity.progressRecords[0]; // There should be only one per child
        
        if (record.status === 'COMPLETED') {
          metrics.completedActivities++;
          metrics.totalScore += record.score || 0;
          
          if ((record.score || 0) < 60) {
            metrics.lowScoreActivities++;
          } else if ((record.score || 0) > 85) {
            metrics.highScoreActivities++;
          }
        }
        
        metrics.totalTimeSpent += record.timeSpent;
        metrics.helpRequestCount += record.helpRequests?.length || 0;
      }
    });
    
    // Calculate derived metrics
    metrics.completionRate = metrics.totalActivities > 0 
      ? (metrics.completedActivities / metrics.totalActivities) * 100 
      : 0;
      
    metrics.averageScore = metrics.completedActivities > 0 
      ? metrics.totalScore / metrics.completedActivities 
      : 0;
      
    metrics.averageTimeSpent = metrics.completedActivities > 0 
      ? metrics.totalTimeSpent / metrics.completedActivities 
      : 0;
    
    return metrics;
  }

  /**
   * Determine if plan adaptation is needed and what type
   */
  private determineAdaptationNeeded(metrics) {
    // Minimum threshold for having enough data to make adaptation decisions
    const MIN_COMPLETED_ACTIVITIES = 3;
    
    // Check if we have enough data
    if (metrics.completedActivities < MIN_COMPLETED_ACTIVITIES) {
      return { 
        needed: false, 
        reason: `Not enough completed activities (${metrics.completedActivities}/${MIN_COMPLETED_ACTIVITIES} required)` 
      };
    }
    
    // Check for consistently low scores (struggling)
    if (metrics.averageScore < 60 && metrics.lowScoreActivities >= 2) {
      return { 
        needed: true, 
        type: 'decrease_difficulty',
        reason: 'Low average score indicates student is struggling' 
      };
    }
    
    // Check for consistently high scores (too easy)
    if (metrics.averageScore > 85 && metrics.highScoreActivities >= 3) {
      return { 
        needed: true, 
        type: 'increase_difficulty',
        reason: 'High average score indicates content is too easy' 
      };
    }
    
    // Check for low engagement (high time between activities)
    if (metrics.completionRate < 30 && metrics.totalActivities > 5) {
      return { 
        needed: true, 
        type: 'increase_engagement',
        reason: 'Low completion rate indicates engagement issues' 
      };
    }
    
    // No adaptation needed
    return { 
      needed: false, 
      reason: 'Current difficulty level appears appropriate' 
    };
  }

  /**
   * Generate adaptation recommendations using Claude AI
   */
  private async generateAdaptationRecommendations(plan, metrics, adaptationType) {
    try {
      // Prepare context for Claude
      const context = {
        planSubject: plan.subject,
        planDifficulty: plan.difficulty,
        childAge: plan.child.age,
        childGradeLevel: plan.child.gradeLevel,
        childLearningStyle: plan.child.learningStyle,
        performanceMetrics: metrics,
        adaptationType
      };
      
      // Generate prompt for Claude
      let prompt = `You are an educational AI assistant helping to adapt a study plan based on a student's performance. 
      
Here is information about the student and their current study plan:
- Subject: ${context.planSubject}
- Current difficulty level: ${context.planDifficulty}
- Student age: ${context.childAge}
- Grade level: ${context.childGradeLevel}
- Learning style preference: ${context.childLearningStyle}

Performance metrics:
- Completion rate: ${metrics.completionRate.toFixed(1)}%
- Average score: ${metrics.averageScore.toFixed(1)}%
- Low score activities: ${metrics.lowScoreActivities}
- High score activities: ${metrics.highScoreActivities}
- Help requests: ${metrics.helpRequestCount}

Based on these metrics, the system has determined that the plan needs to be adapted to `;
      
      // Add specific adaptation type context
      if (adaptationType === 'decrease_difficulty') {
        prompt += `DECREASE DIFFICULTY because the student is struggling with the current content.

Please provide recommendations for:
1. How to adjust the difficulty level of future activities
2. What specific content areas might need more foundational work
3. Alternative teaching approaches that might help this student
4. Any specific accommodations that might benefit the student`;
      } else if (adaptationType === 'increase_difficulty') {
        prompt += `INCREASE DIFFICULTY because the student is finding the current content too easy.

Please provide recommendations for:
1. How to adjust the difficulty level of future activities
2. What advanced concepts could be introduced
3. How to provide more challenging content while maintaining engagement
4. Any enrichment activities that might benefit this student`;
      } else if (adaptationType === 'increase_engagement') {
        prompt += `INCREASE ENGAGEMENT because the student has a low completion rate.

Please provide recommendations for:
1. How to make activities more engaging for this student
2. Alternative formats or approaches that might increase interest
3. How to incorporate the student's learning style preferences more effectively
4. Gamification elements that might motivate this student`;
      }
      
      prompt += `

Please format your response as a JSON object with the following structure:
{
  "recommendedDifficulty": "string (easy, medium, hard, or specific level)",
  "contentRecommendations": ["list of specific content recommendations"],
  "teachingApproaches": ["list of teaching approach recommendations"],
  "accommodations": ["list of specific accommodations if needed"],
  "explanation": "brief explanation of your recommendations"
}`;

      // Call Claude API
      const response = await claudeService.generateContent(prompt, {
        maxTokens: 1000,
        temperature: 0.3,
        childAge: context.childAge
      });
      
      // Parse the JSON response
      try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in Claude response');
        }
        
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations;
      } catch (parseError) {
        logger.error('Error parsing Claude recommendations:', parseError);
        logger.error('Claude response:', response);
        
        // Return a default recommendation if parsing fails
        return {
          recommendedDifficulty: adaptationType === 'decrease_difficulty' ? 'easier' : 
                                adaptationType === 'increase_difficulty' ? 'harder' : 'same',
          contentRecommendations: ['Review current content structure'],
          teachingApproaches: ['Consider alternative teaching methods'],
          accommodations: ['Adjust based on student needs'],
          explanation: 'Generated as fallback due to parsing error'
        };
      }
    } catch (error) {
      logger.error('Error generating adaptation recommendations:', error);
      throw error;
    }
  }

  /**
   * Apply adaptations to the study plan
   */
  private async applyAdaptations(plan, recommendations) {
    try {
      // Update the plan difficulty based on recommendations
      const updatedPlan = await prisma.studyPlan.update({
        where: { id: plan.id },
        data: {
          difficulty: recommendations.recommendedDifficulty
        }
      });
      
      // For future activities, we'll adjust their difficulty
      // This is a simplified implementation - in a real system, you might
      // generate new activities or modify existing ones more extensively
      
      // Get incomplete activities
      const incompleteActivities = plan.activities.filter(activity => {
        const progressRecord = activity.progressRecords[0];
        return !progressRecord || progressRecord.status !== 'COMPLETED';
      });
      
      // Adjust difficulty of incomplete activities
      for (const activity of incompleteActivities) {
        let newDifficulty = activity.difficulty;
        
        if (recommendations.recommendedDifficulty === 'easy' || 
            recommendations.recommendedDifficulty === 'easier') {
          newDifficulty = Math.max(1, activity.difficulty - 2);
        } else if (recommendations.recommendedDifficulty === 'medium') {
          newDifficulty = 5; // Middle of 1-10 scale
        } else if (recommendations.recommendedDifficulty === 'hard' || 
                  recommendations.recommendedDifficulty === 'harder') {
          newDifficulty = Math.min(10, activity.difficulty + 2);
        } else if (!isNaN(parseInt(recommendations.recommendedDifficulty))) {
          // If it's a numeric value
          newDifficulty = parseInt(recommendations.recommendedDifficulty);
        }
        
        // Update the activity difficulty
        await prisma.studyActivity.update({
          where: { id: activity.id },
          data: { difficulty: newDifficulty }
        });
      }
      
      // Store the adaptation record
      await prisma.$executeRaw`
        INSERT INTO plan_adaptations (plan_id, reason, recommendations, applied_at)
        VALUES (${plan.id}, ${recommendations.explanation}, ${JSON.stringify(recommendations)}, NOW())
      `;
      
      return updatedPlan;
    } catch (error) {
      logger.error('Error applying adaptations to plan:', error);
      throw error;
    }
  }

  /**
   * Notify parent about plan adaptation
   */
  private async notifyParentAboutAdaptation(parentId, childName, plan, adaptationType, metrics) {
    try {
      // Get parent email
      const parent = await prisma.user.findUnique({
        where: { id: parentId },
        select: { email: true, firstName: true }
      });
      
      if (!parent || !parent.email) {
        logger.warn(`Cannot notify parent ${parentId} about plan adaptation: email not found`);
        return;
      }
      
      // Create notification message
      const subject = `Study Plan Adapted for ${childName}`;
      
      let adaptationReason;
      if (adaptationType === 'decrease_difficulty') {
        adaptationReason = 'the content appeared too challenging';
      } else if (adaptationType === 'increase_difficulty') {
        adaptationReason = 'your child is excelling and ready for more challenges';
      } else if (adaptationType === 'increase_engagement') {
        adaptationReason = 'we noticed engagement could be improved';
      }
      
      const message = `
        <h2>Study Plan Automatically Adapted</h2>
        <p>Hello ${parent.firstName || 'Parent'},</p>
        <p>We've automatically adjusted ${childName}'s study plan for ${plan.subject} because ${adaptationReason}.</p>
        
        <h3>Performance Summary:</h3>
        <ul>
          <li>Completion rate: ${metrics.completionRate.toFixed(1)}%</li>
          <li>Average score: ${metrics.averageScore.toFixed(1)}%</li>
          <li>Activities completed: ${metrics.completedActivities} of ${metrics.totalActivities}</li>
        </ul>
        
        <p>You can review the updated plan and make further adjustments in your parent dashboard.</p>
        
        <p>Thank you for using AI Study Planner!</p>
      `;
      
      // Send email notification
      await emailService.sendEmail(parent.email, subject, message);
      
      // Also create an in-app notification
      await prisma.$executeRaw`
        INSERT INTO notifications (user_id, title, message, type, read, created_at)
        VALUES (${parentId}, ${subject}, ${message}, 'plan_adaptation', false, NOW())
      `;
      
      logger.info(`Parent ${parentId} notified about plan adaptation for child ${childName}`);
    } catch (error) {
      logger.error('Error notifying parent about plan adaptation:', error);
      // Don't throw here, as this is a non-critical operation
    }
  }

  /**
   * Check all active plans for potential adaptations
   * This would typically be run by a scheduled job
   */
  async checkAllPlansForAdaptation() {
    try {
      // Get all active plans
      const activePlans = await prisma.studyPlan.findMany({
        where: { status: StudyPlanStatus.ACTIVE },
        select: { id: true, childId: true }
      });
      
      logger.info(`Checking ${activePlans.length} active plans for potential adaptation`);
      
      const adaptationResults = [];
      
      // Check each plan for adaptation
      for (const plan of activePlans) {
        try {
          const result = await this.adaptPlanBasedOnPerformance(plan.childId, plan.id);
          adaptationResults.push({
            planId: plan.id,
            childId: plan.childId,
            adapted: result.adapted,
            reason: result.reason || result.adaptationType
          });
        } catch (error) {
          logger.error(`Error checking plan ${plan.id} for adaptation:`, error);
          adaptationResults.push({
            planId: plan.id,
            childId: plan.childId,
            adapted: false,
            error: error.message
          });
        }
      }
      
      return {
        totalPlans: activePlans.length,
        adaptedPlans: adaptationResults.filter(r => r.adapted).length,
        results: adaptationResults
      };
    } catch (error) {
      logger.error('Error checking plans for adaptation:', error);
      throw error;
    }
  }

  /**
   * Create content recommendations based on performance
   */
  async createContentRecommendations(childId: string) {
    try {
      // Get learning patterns from analytics service
      const learningPatterns = await analyticsService.detectLearningPatterns(childId);
      
      // Get child profile
      const child = await prisma.childProfile.findUnique({
        where: { id: childId },
        select: {
          name: true,
          age: true,
          gradeLevel: true,
          learningStyle: true
        }
      });
      
      if (!child) {
        throw new Error(`Child ${childId} not found`);
      }
      
      // Generate recommendations using Claude
      const prompt = `You are an educational AI assistant creating personalized content recommendations for a student.

Student information:
- Name: ${child.name}
- Age: ${child.age}
- Grade level: ${child.gradeLevel}
- Learning style preference: ${child.learningStyle}

Learning patterns analysis:
- Strengths: ${learningPatterns.recommendedFocus.strengths.join(', ') || 'None identified yet'}
- Areas needing focus: ${learningPatterns.recommendedFocus.focusAreas.join(', ') || 'None identified yet'}

Subject insights:
${JSON.stringify(learningPatterns.subjectInsights, null, 2)}

Based on this information, please provide:
1. 3-5 content recommendations that would help this student improve in areas needing focus
2. 2-3 content recommendations that would build on the student's strengths
3. Specific learning activities that match their learning style preference

Format your response as a JSON object with the following structure:
{
  "focusAreaRecommendations": [
    {
      "subject": "subject name",
      "activityType": "quiz/game/reading/etc",
      "title": "Engaging title for the activity",
      "description": "Brief description of the recommended content",
      "reason": "Why this is recommended"
    }
  ],
  "strengthBuildingRecommendations": [
    {
      "subject": "subject name",
      "activityType": "quiz/game/reading/etc",
      "title": "Engaging title for the activity",
      "description": "Brief description of the recommended content",
      "reason": "Why this is recommended"
    }
  ],
  "learningStyleRecommendations": [
    {
      "activityType": "quiz/game/reading/etc",
      "title": "Engaging title for the activity",
      "description": "Brief description of the recommended content",
      "reason": "Why this matches their learning style"
    }
  ]
}`;

      // Call Claude API
      const response = await claudeService.generateContent(prompt, {
        maxTokens: 1500,
        temperature: 0.4,
        childAge: child.age
      });
      
      // Parse the JSON response
      try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in Claude response');
        }
        
        const recommendations = JSON.parse(jsonMatch[0]);
        
        // Store recommendations in database
        await prisma.$executeRaw`
          INSERT INTO content_recommendations (child_id, recommendations, created_at)
          VALUES (${childId}, ${JSON.stringify(recommendations)}, NOW())
        `;
        
        return recommendations;
      } catch (parseError) {
        logger.error('Error parsing Claude content recommendations:', parseError);
        throw parseError;
      }
    } catch (error) {
      logger.error('Error creating content recommendations:', error);
      throw error;
    }
  }
}

export default new PlanAdaptationService();