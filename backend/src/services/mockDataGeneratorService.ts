import { PrismaClient, ProgressStatus, DifficultyLevel, ResourceType, SafetyRating } from '@prisma/client';
import { MasterDataService } from './masterDataService';
import { logger } from '../utils/logger';

export interface MockDataConfig {
  childId: string;
  timeRangeMonths: number;
  learningVelocity: 'slow' | 'average' | 'fast';
  subjectPreferences: Record<string, number>; // Subject ID to preference score (0-1)
  difficultyPreference: 'conservative' | 'balanced' | 'challenging';
  sessionFrequency: 'low' | 'medium' | 'high'; // Sessions per week
  consistencyLevel: 'inconsistent' | 'moderate' | 'consistent';
  helpSeekingBehavior: 'independent' | 'moderate' | 'frequent';
}

export interface LearningPattern {
  subjectEngagement: Record<string, number>;
  timeOfDayPreferences: Record<string, number>;
  sessionLengthPreferences: Record<string, number>;
  difficultyProgression: Record<string, DifficultyLevel>;
  resourceTypePreferences: Record<ResourceType, number>;
  helpRequestPatterns: {
    frequency: number;
    topicTypes: string[];
    timeInSession: number[];
  };
}

export interface MockProgressData {
  progressRecords: any[];
  contentInteractions: any[];
  resourceUsage: any[];
  helpRequests: any[];
  achievements: any[];
  studyPlans: any[];
  activities: any[];
}

export class MockDataGeneratorService {
  private prisma: PrismaClient;
  private masterDataService: MasterDataService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.masterDataService = new MasterDataService(prisma);
  }

  /**
   * Generate realistic mock data based on master data structure
   */
  async generateRealisticMockData(config: MockDataConfig): Promise<MockProgressData> {
    try {
      logger.info(`Generating mock data for child ${config.childId}`);

      // Get child's grade level and available subjects
      const child = await this.prisma.childProfile.findUnique({
        where: { id: config.childId },
        select: { gradeLevel: true, name: true }
      });

      if (!child) {
        throw new Error(`Child not found: ${config.childId}`);
      }

      // Get master data for the child's grade
      const subjects = await this.masterDataService.getSubjectsByGrade(child.gradeLevel);
      const allTopics = await Promise.all(
        subjects.map(subject => 
          this.masterDataService.getTopicsBySubject(child.gradeLevel, subject.id)
        )
      ).then(topicArrays => topicArrays.flat());

      // Generate learning patterns based on config
      const learningPattern = this.generateLearningPattern(config, subjects);

      // Generate time-based progression data
      const timeProgression = this.generateTimeProgression(config);

      // Generate study plans and activities
      const { studyPlans, activities } = await this.generateStudyPlansAndActivities(
        config, 
        subjects, 
        allTopics, 
        learningPattern
      );

      // Generate progress records with realistic patterns
      const progressRecords = await this.generateProgressRecords(
        config,
        activities,
        learningPattern,
        timeProgression
      );

      // Generate content interactions
      const contentInteractions = await this.generateContentInteractions(
        config,
        activities,
        progressRecords,
        learningPattern
      );

      // Generate resource usage data
      const resourceUsage = await this.generateResourceUsage(
        config,
        allTopics,
        progressRecords,
        learningPattern
      );

      // Generate help requests
      const helpRequests = await this.generateHelpRequests(
        config,
        progressRecords,
        learningPattern
      );

      // Generate achievements
      const achievements = await this.generateAchievements(
        config,
        progressRecords,
        subjects
      );

      logger.info(`Generated mock data: ${progressRecords.length} progress records, ${contentInteractions.length} interactions, ${resourceUsage.length} resource uses`);

      return {
        progressRecords,
        contentInteractions,
        resourceUsage,
        helpRequests,
        achievements,
        studyPlans,
        activities
      };
    } catch (error) {
      logger.error('Error generating realistic mock data:', error);
      throw error;
    }
  }

  /**
   * Generate learning patterns based on configuration
   */
  private generateLearningPattern(config: MockDataConfig, subjects: any[]): LearningPattern {
    // Subject engagement based on preferences
    const subjectEngagement: Record<string, number> = {};
    subjects.forEach(subject => {
      const baseEngagement = config.subjectPreferences[subject.id] || 0.5;
      // Add some randomness but keep it realistic
      subjectEngagement[subject.id] = Math.max(0.1, Math.min(1.0, 
        baseEngagement + (Math.random() - 0.5) * 0.3
      ));
    });

    // Time of day preferences (morning, afternoon, evening)
    const timeOfDayPreferences = {
      morning: Math.random() * 0.4 + 0.3, // 0.3-0.7
      afternoon: Math.random() * 0.5 + 0.4, // 0.4-0.9
      evening: Math.random() * 0.3 + 0.2  // 0.2-0.5
    };

    // Session length preferences based on learning velocity
    const sessionLengthPreferences = {
      short: config.learningVelocity === 'fast' ? 0.3 : 0.6,
      medium: 0.5,
      long: config.learningVelocity === 'slow' ? 0.3 : 0.6
    };

    // Difficulty progression based on preference
    const difficultyProgression: Record<string, DifficultyLevel> = {};
    subjects.forEach(subject => {
      const engagement = subjectEngagement[subject.id];
      if (config.difficultyPreference === 'challenging' && engagement > 0.7) {
        difficultyProgression[subject.id] = DifficultyLevel.ADVANCED;
      } else if (config.difficultyPreference === 'conservative' || engagement < 0.4) {
        difficultyProgression[subject.id] = DifficultyLevel.BEGINNER;
      } else {
        difficultyProgression[subject.id] = DifficultyLevel.INTERMEDIATE;
      }
    });

    // Resource type preferences
    const resourceTypePreferences = {
      [ResourceType.VIDEO]: Math.random() * 0.4 + 0.4, // 0.4-0.8
      [ResourceType.ARTICLE]: Math.random() * 0.3 + 0.3, // 0.3-0.6
      [ResourceType.INTERACTIVE]: Math.random() * 0.5 + 0.3, // 0.3-0.8
      [ResourceType.WORKSHEET]: Math.random() * 0.3 + 0.2, // 0.2-0.5
      [ResourceType.GAME]: Math.random() * 0.6 + 0.3, // 0.3-0.9
      [ResourceType.BOOK]: Math.random() * 0.4 + 0.3, // 0.3-0.7
      [ResourceType.EXTERNAL_LINK]: Math.random() * 0.3 + 0.2 // 0.2-0.5
    };

    // Help request patterns
    const helpFrequencyMap = {
      independent: 0.1,
      moderate: 0.3,
      frequent: 0.6
    };

    const helpRequestPatterns = {
      frequency: helpFrequencyMap[config.helpSeekingBehavior],
      topicTypes: subjects.filter(s => subjectEngagement[s.id] < 0.5).map(s => s.id),
      timeInSession: [0.3, 0.6, 0.8] // Times during session when help is requested
    };

    return {
      subjectEngagement,
      timeOfDayPreferences,
      sessionLengthPreferences,
      difficultyProgression,
      resourceTypePreferences,
      helpRequestPatterns
    };
  }

  /**
   * Generate time progression for activities over the specified period
   */
  private generateTimeProgression(config: MockDataConfig): Date[] {
    const dates: Date[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - config.timeRangeMonths);

    const sessionsPerWeekMap = {
      low: 2,
      medium: 4,
      high: 6
    };

    const sessionsPerWeek = sessionsPerWeekMap[config.sessionFrequency];
    const totalWeeks = config.timeRangeMonths * 4.33; // Average weeks per month

    // Generate session dates with realistic patterns
    for (let week = 0; week < totalWeeks; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + week * 7);

      // Apply consistency level
      let actualSessions = sessionsPerWeek;
      if (config.consistencyLevel === 'inconsistent') {
        actualSessions = Math.max(1, Math.floor(sessionsPerWeek * (0.3 + Math.random() * 0.7)));
      } else if (config.consistencyLevel === 'moderate') {
        actualSessions = Math.max(1, Math.floor(sessionsPerWeek * (0.6 + Math.random() * 0.4)));
      }

      // Generate session dates within the week
      for (let session = 0; session < actualSessions; session++) {
        const sessionDate = new Date(weekStart);
        sessionDate.setDate(sessionDate.getDate() + Math.floor(Math.random() * 7));
        
        // Add realistic time of day
        const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
        sessionDate.setHours(hour, Math.floor(Math.random() * 60));
        
        dates.push(sessionDate);
      }
    }

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Generate study plans and activities based on master data
   */
  private async generateStudyPlansAndActivities(
    config: MockDataConfig,
    subjects: any[],
    topics: any[],
    learningPattern: LearningPattern
  ): Promise<{ studyPlans: any[], activities: any[] }> {
    const studyPlans: any[] = [];
    const activities: any[] = [];

    // Generate 2-4 study plans over the time period
    const planCount = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < planCount; i++) {
      // Select subject based on engagement
      const subjectWeights = subjects.map(s => learningPattern.subjectEngagement[s.id] || 0.5);
      const selectedSubject = this.weightedRandomSelect(subjects, subjectWeights);

      // Get topics for this subject
      const subjectTopics = topics.filter(t => t.subjectId === selectedSubject.id);
      if (subjectTopics.length === 0) continue;

      // Create study plan
      const planId = `mock-plan-${config.childId}-${i}`;
      const createdAt = new Date(Date.now() - (config.timeRangeMonths - i) * 30 * 24 * 60 * 60 * 1000);

      const studyPlan = {
        id: planId,
        childId: config.childId,
        title: `${selectedSubject.displayName} Learning Plan ${i + 1}`,
        description: `Comprehensive learning plan for ${selectedSubject.displayName}`,
        subject: selectedSubject.name,
        gradeLevel: await this.getChildGradeLevel(config.childId),
        difficulty: learningPattern.difficultyProgression[selectedSubject.id] || DifficultyLevel.INTERMEDIATE,
        estimatedHours: Math.floor(Math.random() * 20) + 10,
        status: i < planCount - 1 ? 'COMPLETED' : 'IN_PROGRESS',
        createdAt,
        updatedAt: createdAt,
        isActive: i === planCount - 1
      };

      studyPlans.push(studyPlan);

      // Generate activities for this plan
      const activityCount = Math.floor(Math.random() * 8) + 5; // 5-12 activities
      const selectedTopics = this.selectRandomItems(subjectTopics, Math.min(activityCount, subjectTopics.length));

      for (let j = 0; j < activityCount; j++) {
        const topic = selectedTopics[j % selectedTopics.length];
        const activityId = `mock-activity-${planId}-${j}`;

        const activity = {
          id: activityId,
          planId,
          title: `${topic.displayName} Activity ${j + 1}`,
          description: `Learn about ${topic.displayName}`,
          type: this.selectActivityType(),
          difficulty: topic.difficulty,
          estimatedMinutes: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
          order: j,
          isRequired: Math.random() > 0.2, // 80% required
          createdAt,
          updatedAt: createdAt,
          topicId: topic.id,
          subjectId: selectedSubject.id
        };

        activities.push(activity);
      }
    }

    return { studyPlans, activities };
  }

  /**
   * Generate realistic progress records
   */
  private async generateProgressRecords(
    config: MockDataConfig,
    activities: any[],
    learningPattern: LearningPattern,
    timeProgression: Date[]
  ): Promise<any[]> {
    const progressRecords: any[] = [];
    let sessionIndex = 0;

    // Sort activities by creation date and plan
    const sortedActivities = activities.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime() || a.order - b.order
    );

    for (const activity of sortedActivities) {
      if (sessionIndex >= timeProgression.length) break;

      // Determine if this activity should be attempted based on engagement
      const subjectEngagement = learningPattern.subjectEngagement[activity.subjectId] || 0.5;
      const attemptProbability = subjectEngagement * 0.8 + 0.2; // 0.2-1.0

      if (Math.random() > attemptProbability) continue;

      // Generate 1-3 attempts for this activity
      const attempts = Math.floor(Math.random() * 3) + 1;

      for (let attempt = 0; attempt < attempts; attempt++) {
        if (sessionIndex >= timeProgression.length) break;

        const sessionDate = timeProgression[sessionIndex];
        const recordId = `mock-progress-${activity.id}-${attempt}`;

        // Calculate performance based on learning velocity and subject engagement
        const basePerformance = this.calculateBasePerformance(
          config.learningVelocity,
          subjectEngagement,
          attempt
        );

        // Generate realistic score with some variance
        const score = Math.max(0, Math.min(100, 
          basePerformance + (Math.random() - 0.5) * 20
        ));

        // Determine status based on score and attempt
        let status: ProgressStatus;
        if (score >= 70 || attempt === attempts - 1) {
          status = ProgressStatus.COMPLETED;
        } else if (score >= 50) {
          status = ProgressStatus.IN_PROGRESS;
        } else {
          status = ProgressStatus.NOT_STARTED;
        }

        // Calculate realistic time spent
        const baseTime = activity.estimatedMinutes || 30;
        const timeSpent = Math.floor(baseTime * (0.7 + Math.random() * 0.6)); // 70%-130% of estimated

        const progressRecord = {
          id: recordId,
          childId: config.childId,
          activityId: activity.id,
          status,
          score: Math.round(score),
          timeSpent,
          attempts: attempt + 1,
          startedAt: sessionDate,
          completedAt: status === ProgressStatus.COMPLETED ? 
            new Date(sessionDate.getTime() + timeSpent * 60 * 1000) : null,
          createdAt: sessionDate,
          updatedAt: sessionDate,
          activity: activity // Include for reference
        };

        progressRecords.push(progressRecord);
        sessionIndex++;

        // If completed, move to next activity
        if (status === ProgressStatus.COMPLETED) break;
      }
    }

    return progressRecords;
  }

  /**
   * Generate content interactions based on progress records
   */
  private async generateContentInteractions(
    config: MockDataConfig,
    activities: any[],
    progressRecords: any[],
    learningPattern: LearningPattern
  ): Promise<any[]> {
    const contentInteractions: any[] = [];

    for (const record of progressRecords) {
      // Generate 1-3 content interactions per progress record
      const interactionCount = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < interactionCount; i++) {
        const interactionId = `mock-interaction-${record.id}-${i}`;
        const interactionDate = new Date(record.createdAt.getTime() + i * 5 * 60 * 1000); // 5 minutes apart

        const interaction = {
          id: interactionId,
          childId: config.childId,
          contentId: `mock-content-${record.activityId}-${i}`,
          interactionType: this.selectInteractionType(),
          duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
          completed: Math.random() > 0.2, // 80% completion rate
          createdAt: interactionDate,
          content: {
            id: `mock-content-${record.activityId}-${i}`,
            title: `Content for ${record.activity.title}`,
            type: this.selectContentType(),
            activityId: record.activityId,
            activity: record.activity
          }
        };

        contentInteractions.push(interaction);
      }
    }

    return contentInteractions;
  }

  /**
   * Generate resource usage data
   */
  private async generateResourceUsage(
    config: MockDataConfig,
    topics: any[],
    progressRecords: any[],
    learningPattern: LearningPattern
  ): Promise<any[]> {
    const resourceUsage: any[] = [];

    for (const record of progressRecords) {
      // Find topic for this activity
      const topic = topics.find(t => t.id === record.activity.topicId);
      if (!topic) continue;

      // Generate resource usage based on preferences
      const resourceTypes = Object.keys(learningPattern.resourceTypePreferences) as ResourceType[];
      const usedResourceTypes = resourceTypes.filter(type => 
        Math.random() < learningPattern.resourceTypePreferences[type]
      );

      for (const resourceType of usedResourceTypes) {
        const usageId = `mock-usage-${record.id}-${resourceType}`;
        const usageDate = new Date(record.createdAt.getTime() + Math.random() * record.timeSpent * 60 * 1000);

        const usage = {
          id: usageId,
          childId: config.childId,
          resourceId: `mock-resource-${topic.id}-${resourceType}`,
          duration: Math.floor(Math.random() * 600) + 120, // 2-10 minutes
          completed: Math.random() > 0.3, // 70% completion rate
          rating: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 3 : null, // 3-5 stars, 50% rate
          timestamp: usageDate,
          resource: {
            id: `mock-resource-${topic.id}-${resourceType}`,
            title: `${resourceType} Resource for ${topic.displayName}`,
            type: resourceType,
            url: `https://example.com/resource/${topic.id}/${resourceType}`,
            safetyRating: SafetyRating.SAFE,
            topicId: topic.id,
            topic: topic
          }
        };

        resourceUsage.push(usage);
      }
    }

    return resourceUsage;
  }

  /**
   * Generate help requests based on learning patterns
   */
  private async generateHelpRequests(
    config: MockDataConfig,
    progressRecords: any[],
    learningPattern: LearningPattern
  ): Promise<any[]> {
    const helpRequests: any[] = [];

    for (const record of progressRecords) {
      // Generate help requests based on frequency and difficulty
      const shouldRequestHelp = Math.random() < learningPattern.helpRequestPatterns.frequency;
      
      if (shouldRequestHelp && record.score < 80) {
        const requestId = `mock-help-${record.id}`;
        const requestTime = new Date(
          record.createdAt.getTime() + 
          Math.random() * record.timeSpent * 60 * 1000 * 0.8 // Within 80% of session
        );

        const helpRequest = {
          id: requestId,
          childId: config.childId,
          progressRecordId: record.id,
          question: this.generateHelpQuestion(record.activity.title),
          category: this.selectHelpCategory(),
          priority: record.score < 50 ? 'HIGH' : 'MEDIUM',
          status: 'RESOLVED',
          createdAt: requestTime,
          resolvedAt: new Date(requestTime.getTime() + Math.random() * 10 * 60 * 1000), // Resolved within 10 minutes
          progressRecord: record
        };

        helpRequests.push(helpRequest);
      }
    }

    return helpRequests;
  }

  /**
   * Generate achievements based on progress
   */
  private async generateAchievements(
    config: MockDataConfig,
    progressRecords: any[],
    subjects: any[]
  ): Promise<any[]> {
    const achievements: any[] = [];
    const completedRecords = progressRecords.filter(r => r.status === ProgressStatus.COMPLETED);

    // First completion achievement
    if (completedRecords.length > 0) {
      achievements.push({
        id: `achievement-first-${config.childId}`,
        childId: config.childId,
        type: 'FIRST_COMPLETION',
        title: 'First Steps',
        description: 'Completed your first learning activity!',
        points: 10,
        earnedAt: completedRecords[0].completedAt,
        metadata: {
          activityTitle: completedRecords[0].activity.title
        }
      });
    }

    // Subject mastery achievements
    for (const subject of subjects) {
      const subjectRecords = completedRecords.filter(r => r.activity.subjectId === subject.id);
      if (subjectRecords.length >= 5) {
        achievements.push({
          id: `achievement-subject-${subject.id}-${config.childId}`,
          childId: config.childId,
          type: 'SUBJECT_PROGRESS',
          title: `${subject.displayName} Explorer`,
          description: `Completed 5 activities in ${subject.displayName}!`,
          points: 50,
          earnedAt: subjectRecords[4].completedAt,
          metadata: {
            subject: subject.displayName,
            count: subjectRecords.length
          }
        });
      }
    }

    // High score achievements
    const highScoreRecords = completedRecords.filter(r => r.score >= 90);
    if (highScoreRecords.length >= 3) {
      achievements.push({
        id: `achievement-high-score-${config.childId}`,
        childId: config.childId,
        type: 'HIGH_PERFORMANCE',
        title: 'Excellence Achiever',
        description: 'Scored 90% or higher on 3 activities!',
        points: 75,
        earnedAt: highScoreRecords[2].completedAt,
        metadata: {
          count: highScoreRecords.length,
          averageScore: Math.round(highScoreRecords.reduce((sum, r) => sum + r.score, 0) / highScoreRecords.length)
        }
      });
    }

    return achievements;
  }

  // Helper methods
  private calculateBasePerformance(velocity: string, engagement: number, attempt: number): number {
    const velocityMap: Record<string, number> = { slow: 0.7, average: 0.8, fast: 0.9 };
    const velocityMultiplier = velocityMap[velocity] || 0.8;
    const attemptBonus = Math.min(attempt * 10, 20); // Up to 20 point bonus for retries
    return (velocityMultiplier * engagement * 100) + attemptBonus;
  }

  private weightedRandomSelect<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private selectActivityType(): string {
    const types = ['lesson', 'practice', 'quiz', 'project', 'review'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectInteractionType(): string {
    const types = ['view', 'click', 'scroll', 'pause', 'replay'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectContentType(): string {
    const types = ['video', 'text', 'interactive', 'image', 'audio'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private selectHelpCategory(): string {
    const categories = ['concept', 'technical', 'navigation', 'content'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateHelpQuestion(activityTitle: string): string {
    const templates = [
      `I'm having trouble understanding ${activityTitle}`,
      `Can you explain more about ${activityTitle}?`,
      `I'm stuck on this part of ${activityTitle}`,
      `How do I solve this problem in ${activityTitle}?`,
      `I need help with ${activityTitle}`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private async getChildGradeLevel(childId: string): Promise<string> {
    const child = await this.prisma.childProfile.findUnique({
      where: { id: childId },
      select: { gradeLevel: true }
    });
    return child?.gradeLevel || 'K';
  }
}