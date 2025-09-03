import express from 'express';
import { authenticateToken, requireParent, requireChild } from '../middleware/auth';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { geminiService } from '../services/geminiService';
import { getTopicsByGradeAndSubject, CURRICULUM_MASTER_DATA } from '../data/curriculumMasterData';
import { getActivitiesForTopics, TOPIC_SPECIFIC_ACTIVITIES } from '../data/topicSpecificActivities';

const router = express.Router();

// Validation schemas
const createStudyPlanSchema = Joi.object({
  childId: Joi.string().required(),
  subject: Joi.string().required(),
  grade: Joi.string().required(),
  difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').required(),
  selectedTopics: Joi.array().items(Joi.string()).optional(),
  learningStyle: Joi.string().optional(),
  additionalNotes: Joi.string().optional().allow(''),
});

const updateStudyPlanSchema = Joi.object({
  subject: Joi.string().optional(),
  difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT').optional(),
  status: Joi.string().valid('draft', 'active', 'completed', 'paused').optional(),
});

// Import Prisma client for database operations
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get study plans for a specific child (child access)
 * GET /api/study-plans/child/:childId
 */
router.get('/child/:childId', authenticateToken, requireChild, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify the child is accessing their own study plans
    if (req.user?.userId !== childId) {
      return res.status(403).json({
        error: {
          code: 'ACCESS_DENIED',
          message: 'Children can only access their own study plans',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    const plans = await prisma.studyPlan.findMany({
      where: { 
        childId,
        status: 'ACTIVE' // Only show active plans to children
      },
      include: {
        activities: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Parse objectives for each plan
    const plansWithParsedObjectives = plans.map(plan => ({
      ...plan,
      objectives: JSON.parse(plan.objectives as string)
    }));
    
    res.json({
      plans: plansWithParsedObjectives,
      message: 'Study plans retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching child study plans:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch study plans',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get all study plans for the authenticated parent
 * GET /api/study-plans
 */
router.get('/', authenticateToken, requireParent, async (req, res) => {
  try {
    const { childId } = req.query;
    
    const whereClause = childId ? { childId: childId as string } : {};
    
    const plans = await prisma.studyPlan.findMany({
      where: whereClause,
      include: {
        activities: true,
        child: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      plans,
      message: 'Study plans retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching study plans:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch study plans',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Get a specific study plan
 * GET /api/study-plans/:planId
 */
router.get('/:planId', authenticateToken, requireParent, async (req, res) => {
  try {
    const { planId } = req.params;
    
    const plan = await prisma.studyPlan.findUnique({
      where: { id: planId },
      include: {
        activities: true,
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!plan) {
      return res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Study plan not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    res.json({
      plan,
      message: 'Study plan retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching study plan:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Create a new study plan
 * POST /api/study-plans
 */
router.post('/', authenticateToken, requireParent, async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createStudyPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    const { childId, subject, grade, difficulty, selectedTopics, learningStyle, additionalNotes } = value;
    
    // Try to generate AI-powered study plan using Gemini
    let aiGeneratedPlan = null;
    try {
      // Get child information for better personalization
      const childInfo = {
        name: 'Student', // In a real app, fetch from database
        age: 11, // In a real app, fetch from database
        gradeLevel: '3rd' // In a real app, fetch from database
      };

      // Get topic details for the selected topics
      const allTopics = CURRICULUM_MASTER_DATA
        .find(g => g.grade === grade)?.subjects
        .flatMap(s => s.topics) || [];
      
      const selectedTopicDetails = selectedTopics
        .map(topicId => allTopics.find(t => t.id === topicId))
        .filter(Boolean);

      const geminiRequest = {
        childName: childInfo.name,
        childAge: childInfo.age,
        gradeLevel: grade,
        subject: subject.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        learningStyle: learningStyle.toLowerCase(),
        selectedTopics: selectedTopicDetails,
        additionalRequirements: additionalNotes || '',
        focusAreas: selectedTopicDetails.map(topic => topic?.name || ''),
        timeConstraints: {
          sessionsPerWeek: 3,
          minutesPerSession: 30
        }
      };

      logger.info('Generating AI study plan with Gemini', { geminiRequest });
      aiGeneratedPlan = await geminiService.generateStudyPlan(geminiRequest);
      logger.info('AI study plan generated successfully');
    } catch (aiError) {
      logger.warn('Failed to generate AI study plan, falling back to template', { error: aiError });
    }

    // Generate study plan content (AI-powered or fallback to topic-specific templates)
    let activities, objectives;
    
    if (aiGeneratedPlan && aiGeneratedPlan.activities && aiGeneratedPlan.objectives) {
      // Use AI-generated content
      activities = aiGeneratedPlan.activities.map((activity: any, index: number) => ({
        id: `activity_${index + 1}`,
        planId: '',
        title: activity.title,
        description: activity.description,
        subject,
        content: {
          type: activity.type || 'interactive',
          data: {
            instructions: activity.description,
            difficulty: difficulty.toLowerCase(),
            visualAids: activity.visualAids || [],
            exercises: activity.exercises || []
          }
        },
        estimatedDuration: activity.estimatedDuration || 20,
        difficulty: getDifficultyNumber(difficulty),
        prerequisites: activity.prerequisites || [],
        completionCriteria: {
          type: 'completion',
          threshold: 80
        }
      }));

      objectives = aiGeneratedPlan.objectives.map((obj: any, index: number) => ({
        id: `obj_${index + 1}`,
        description: obj.description || obj,
        completed: false
      }));
    } else {
      // Fallback to topic-specific template-based generation
      activities = generateTopicSpecificActivities(subject, selectedTopics, difficulty);
      objectives = generateTopicSpecificObjectives(subject, selectedTopics, difficulty);
    }
    
    // Create the study plan in the database
    const newPlan = await prisma.studyPlan.create({
      data: {
        childId,
        subject,
        difficulty,
        objectives: JSON.stringify(objectives),
        status: 'DRAFT',
        estimatedDuration: activities.reduce((sum, activity) => sum + activity.estimatedDuration, 0)
      },
      include: {
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create activities for the study plan
    const createdActivities = await Promise.all(
      activities.map(activity => 
        prisma.studyActivity.create({
          data: {
            planId: newPlan.id,
            title: activity.title,
            description: activity.description,
            content: JSON.stringify(activity.content),
            estimatedDuration: activity.estimatedDuration,
            difficulty: activity.difficulty,
            prerequisites: JSON.stringify(activity.prerequisites),
            completionCriteria: JSON.stringify(activity.completionCriteria)
          }
        })
      )
    );

    // Return the complete plan with activities
    const completePlan = {
      ...newPlan,
      objectives: JSON.parse(newPlan.objectives as string),
      activities: createdActivities,
      selectedTopics,
      learningStyle,
      additionalNotes: additionalNotes || ''
    };
    
    logger.info(`Study plan created: ${newPlan.id} for child: ${childId}`);
    
    res.status(201).json({
      plan: completePlan,
      message: 'Study plan created successfully'
    });
  } catch (error) {
    logger.error('Error creating study plan:', error);
    res.status(500).json({
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Update a study plan
 * PUT /api/study-plans/:planId
 */
router.put('/:planId', authenticateToken, requireParent, async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Validate request body
    const { error, value } = updateStudyPlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message,
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }

    // Check if plan exists
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id: planId }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Study plan not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Update the plan
    const updatedPlan = await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        subject: value.subject,
        difficulty: value.difficulty,
        status: value.status?.toUpperCase() as any,
        updatedAt: new Date()
      },
      include: {
        activities: true,
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json({
      plan: {
        ...updatedPlan,
        objectives: JSON.parse(updatedPlan.objectives as string)
      },
      message: 'Study plan updated successfully'
    });
  } catch (error) {
    logger.error('Error updating study plan:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Delete a study plan
 * DELETE /api/study-plans/:planId
 */
router.delete('/:planId', authenticateToken, requireParent, async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if plan exists
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id: planId }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Study plan not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Delete the plan (activities will be deleted due to cascade)
    await prisma.studyPlan.delete({
      where: { id: planId }
    });
    
    res.json({
      message: 'Study plan deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting study plan:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Activate a study plan
 * POST /api/study-plans/:planId/activate
 */
router.post('/:planId/activate', authenticateToken, requireParent, async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if plan exists
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id: planId }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Study plan not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Update plan status to active
    const updatedPlan = await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      },
      include: {
        activities: true,
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json({
      plan: {
        ...updatedPlan,
        objectives: JSON.parse(updatedPlan.objectives as string)
      },
      message: 'Study plan activated successfully'
    });
  } catch (error) {
    logger.error('Error activating study plan:', error);
    res.status(500).json({
      error: {
        code: 'ACTIVATE_FAILED',
        message: 'Failed to activate study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

/**
 * Pause a study plan
 * POST /api/study-plans/:planId/pause
 */
router.post('/:planId/pause', authenticateToken, requireParent, async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Check if plan exists
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id: planId }
    });
    
    if (!existingPlan) {
      return res.status(404).json({
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Study plan not found',
          timestamp: new Date().toISOString(),
          requestId: req.id || 'unknown'
        }
      });
    }
    
    // Update plan status to paused
    const updatedPlan = await prisma.studyPlan.update({
      where: { id: planId },
      data: {
        status: 'PAUSED',
        updatedAt: new Date()
      },
      include: {
        activities: true,
        child: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json({
      plan: {
        ...updatedPlan,
        objectives: JSON.parse(updatedPlan.objectives as string)
      },
      message: 'Study plan paused successfully'
    });
  } catch (error) {
    logger.error('Error pausing study plan:', error);
    res.status(500).json({
      error: {
        code: 'PAUSE_FAILED',
        message: 'Failed to pause study plan',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      }
    });
  }
});

// Helper functions to generate topic-specific study plan content
function generateTopicSpecificActivities(subject: string, selectedTopics: string[], difficulty: string) {
  // Get topic-specific activities from our comprehensive database
  const topicActivities = getActivitiesForTopics(subject, selectedTopics);
  
  if (topicActivities.length > 0) {
    // Use topic-specific activities and enhance them with plan details
    return topicActivities.map((activity, index) => ({
      id: `activity_${index + 1}`,
      planId: '', // Will be set when plan is created
      title: activity.title,
      description: activity.description,
      subject,
      content: {
        type: activity.type,
        data: {
          instructions: activity.description,
          difficulty: difficulty.toLowerCase(),
          relatedTopics: activity.relatedTopics
        }
      },
      estimatedDuration: activity.estimatedDuration,
      difficulty: getDifficultyNumber(difficulty),
      prerequisites: [],
      completionCriteria: {
        type: 'completion',
        threshold: 80
      }
    }));
  }
  
  // Fallback to generic activities if no topic-specific activities found
  return generateActivities(subject, difficulty, 'mixed');
}

function generateTopicSpecificObjectives(subject: string, selectedTopics: string[], difficulty: string) {
  // Get topic details from curriculum data
  const allTopics = CURRICULUM_MASTER_DATA
    .flatMap(g => g.subjects)
    .flatMap(s => s.topics);
  
  const selectedTopicDetails = selectedTopics
    .map(topicId => allTopics.find(t => t.id === topicId))
    .filter(Boolean);

  if (selectedTopicDetails.length > 0) {
    // Generate objectives based on selected topics
    return selectedTopicDetails.map((topic, index) => ({
      id: `obj_${index + 1}`,
      description: `Master ${topic?.name}: ${topic?.description}`,
      completed: false
    }));
  }
  
  // Fallback to generic objectives
  return generateObjectives(subject, difficulty);
}

// Helper functions to generate study plan content
function generateObjectives(subject: string, difficulty: string) {
  // Normalize subject name to match our templates
  const normalizeSubject = (subjectName: string): string => {
    const subjectMap: { [key: string]: string } = {
      'Mathematics': 'MATHEMATICS',
      'Math': 'MATHEMATICS',
      'English': 'ENGLISH',
      'Science': 'SCIENCE',
      'History': 'HISTORY',
      'Geography': 'GEOGRAPHY'
    };
    return subjectMap[subjectName] || subjectName.toUpperCase();
  };

  const objectiveTemplates = {
    MATHEMATICS: {
      BEGINNER: [
        'Understand basic number concepts and counting',
        'Learn addition and subtraction with single digits',
        'Recognize shapes and patterns'
      ],
      INTERMEDIATE: [
        'Master multiplication and division',
        'Understand fractions and decimals',
        'Solve basic word problems'
      ],
      ADVANCED: [
        'Apply algebraic thinking',
        'Understand geometry concepts',
        'Solve complex multi-step problems'
      ],
      EXPERT: [
        'Master advanced mathematical concepts',
        'Apply mathematical reasoning to real-world problems',
        'Understand calculus fundamentals'
      ]
    },
    SCIENCE: {
      BEGINNER: [
        'Observe and describe natural phenomena',
        'Understand basic scientific method',
        'Learn about living and non-living things'
      ],
      INTERMEDIATE: [
        'Understand basic chemistry and physics concepts',
        'Learn about ecosystems and environment',
        'Conduct simple experiments'
      ],
      ADVANCED: [
        'Apply scientific method to investigations',
        'Understand complex biological processes',
        'Analyze data and draw conclusions'
      ],
      EXPERT: [
        'Master advanced scientific concepts',
        'Design and conduct independent research',
        'Apply scientific knowledge to solve problems'
      ]
    },
    ENGLISH: {
      BEGINNER: [
        'Develop basic reading and writing skills',
        'Understand phonics and vocabulary',
        'Express ideas clearly in simple sentences'
      ],
      INTERMEDIATE: [
        'Improve reading comprehension',
        'Write structured paragraphs and essays',
        'Understand grammar and punctuation'
      ],
      ADVANCED: [
        'Analyze literature and texts critically',
        'Write persuasive and creative pieces',
        'Master advanced grammar concepts'
      ],
      EXPERT: [
        'Demonstrate mastery of language arts',
        'Create sophisticated written works',
        'Analyze complex literary themes'
      ]
    },
    HISTORY: {
      BEGINNER: [
        'Learn about important historical figures',
        'Understand basic timeline concepts',
        'Explore different cultures and traditions'
      ],
      INTERMEDIATE: [
        'Understand cause and effect in history',
        'Learn about major historical events',
        'Compare different time periods'
      ],
      ADVANCED: [
        'Analyze primary and secondary sources',
        'Understand historical perspectives',
        'Connect past events to present day'
      ],
      EXPERT: [
        'Conduct historical research',
        'Analyze complex historical patterns',
        'Evaluate historical interpretations'
      ]
    },
    GEOGRAPHY: {
      BEGINNER: [
        'Learn about continents and oceans',
        'Understand basic map reading skills',
        'Explore different countries and cultures'
      ],
      INTERMEDIATE: [
        'Study physical and human geography',
        'Understand climate and weather patterns',
        'Learn about natural resources and environments'
      ],
      ADVANCED: [
        'Analyze geographic patterns and relationships',
        'Understand urbanization and population dynamics',
        'Study environmental challenges and solutions'
      ],
      EXPERT: [
        'Conduct geographic research and analysis',
        'Understand complex geographic systems',
        'Apply geographic knowledge to real-world problems'
      ]
    }
  };

  const normalizedSubject = normalizeSubject(subject);
  const templates = objectiveTemplates[normalizedSubject as keyof typeof objectiveTemplates] || objectiveTemplates.MATHEMATICS;
  const objectives = templates[difficulty as keyof typeof templates] || templates.BEGINNER;
  
  return objectives.map((description, index) => ({
    id: `obj_${index + 1}`,
    description,
    completed: false
  }));
}

function generateActivities(subject: string, difficulty: string, learningStyle: string) {
  // Normalize subject name to match our templates
  const normalizeSubject = (subjectName: string): string => {
    const subjectMap: { [key: string]: string } = {
      'Mathematics': 'MATHEMATICS',
      'Math': 'MATHEMATICS',
      'English': 'ENGLISH',
      'Science': 'SCIENCE',
      'History': 'HISTORY',
      'Geography': 'GEOGRAPHY'
    };
    return subjectMap[subjectName] || subjectName.toUpperCase();
  };

  const activityTemplates = {
    MATHEMATICS: [
      {
        title: 'Number Recognition Practice',
        description: 'Interactive exercises to recognize and write numbers',
        type: 'interactive',
        estimatedDuration: 15
      },
      {
        title: 'Basic Addition Problems',
        description: 'Solve addition problems with visual aids',
        type: 'quiz',
        estimatedDuration: 20
      },
      {
        title: 'Shape Identification Game',
        description: 'Identify and categorize different geometric shapes',
        type: 'interactive',
        estimatedDuration: 10
      }
    ],
    SCIENCE: [
      {
        title: 'Nature Observation Journal',
        description: 'Record observations about plants and animals',
        type: 'text',
        estimatedDuration: 25
      },
      {
        title: 'Simple Experiments',
        description: 'Conduct safe, simple science experiments',
        type: 'interactive',
        estimatedDuration: 30
      },
      {
        title: 'Scientific Method Quiz',
        description: 'Test understanding of the scientific method',
        type: 'quiz',
        estimatedDuration: 15
      }
    ],
    ENGLISH: [
      {
        title: 'Reading Comprehension',
        description: 'Read short stories and answer questions',
        type: 'text',
        estimatedDuration: 20
      },
      {
        title: 'Vocabulary Building',
        description: 'Learn new words through interactive games',
        type: 'interactive',
        estimatedDuration: 15
      },
      {
        title: 'Writing Practice',
        description: 'Write short paragraphs on given topics',
        type: 'text',
        estimatedDuration: 25
      }
    ],
    HISTORY: [
      {
        title: 'Timeline Creation',
        description: 'Create timelines of historical events',
        type: 'interactive',
        estimatedDuration: 30
      },
      {
        title: 'Historical Figure Research',
        description: 'Research and write about important historical figures',
        type: 'text',
        estimatedDuration: 25
      },
      {
        title: 'History Quiz',
        description: 'Test knowledge of historical facts and events',
        type: 'quiz',
        estimatedDuration: 15
      }
    ],
    GEOGRAPHY: [
      {
        title: 'Map Reading Exercise',
        description: 'Practice reading and interpreting different types of maps',
        type: 'interactive',
        estimatedDuration: 20
      },
      {
        title: 'Country Research Project',
        description: 'Research and present information about different countries',
        type: 'text',
        estimatedDuration: 30
      },
      {
        title: 'Geography Quiz',
        description: 'Test knowledge of world geography and locations',
        type: 'quiz',
        estimatedDuration: 15
      }
    ]
  };

  const normalizedSubject = normalizeSubject(subject);
  const templates = activityTemplates[normalizedSubject as keyof typeof activityTemplates] || activityTemplates.MATHEMATICS;
  
  return templates.map((template, index) => ({
    id: `activity_${index + 1}`,
    planId: '', // Will be set when plan is created
    title: template.title,
    description: template.description,
    subject,
    content: {
      type: template.type,
      data: {
        instructions: template.description,
        difficulty: difficulty.toLowerCase()
      }
    },
    estimatedDuration: template.estimatedDuration,
    difficulty: getDifficultyNumber(difficulty),
    prerequisites: [],
    completionCriteria: {
      type: 'completion',
      threshold: 80
    }
  }));
}

function getDifficultyNumber(difficulty: string): number {
  const difficultyMap = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4
  };
  return difficultyMap[difficulty as keyof typeof difficultyMap] || 1;
}

export default router;