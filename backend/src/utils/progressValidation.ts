import Joi from 'joi';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import { logger } from './logger';

export interface ProgressValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData: any;
  consistencyChecks: ConsistencyCheckResult[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ConsistencyCheckResult {
  check: string;
  passed: boolean;
  message: string;
  data?: any;
}

export interface ProgressUpdatePayload {
  activityId: string;
  timeSpent: number;
  score?: number;
  status?: ProgressStatus;
  sessionData?: ActivitySessionData;
  helpRequestsCount?: number;
  pauseCount?: number;
  resumeCount?: number;
}

export interface ActivitySessionData {
  startTime: Date;
  endTime?: Date;
  pausedDuration: number;
  focusEvents: FocusEvent[];
  difficultyAdjustments: DifficultyAdjustment[];
  helpRequests: HelpRequest[];
  interactionEvents: InteractionEvent[];
}

export interface FocusEvent {
  type: 'focus' | 'blur';
  timestamp: Date;
}

export interface DifficultyAdjustment {
  fromDifficulty: number;
  toDifficulty: number;
  reason: string;
  timestamp: Date;
}

export interface HelpRequest {
  question: string;
  timestamp: Date;
  resolved: boolean;
  responseTime?: number;
}

export interface InteractionEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation';
  element?: string;
  timestamp: Date;
  data?: any;
}

/**
 * Enhanced validation schemas for progress updates with strict validation rules
 */
export const progressValidationSchemas = {
  progressUpdate: Joi.object({
    activityId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Activity ID must be a valid UUID',
        'any.required': 'Activity ID is required'
      }),
    
    timeSpent: Joi.number()
      .integer()
      .min(1)
      .max(14400) // 4 hours maximum
      .required()
      .messages({
        'number.base': 'Time spent must be a number',
        'number.integer': 'Time spent must be a whole number of seconds',
        'number.min': 'Time spent must be at least 1 second',
        'number.max': 'Time spent cannot exceed 4 hours (14400 seconds)',
        'any.required': 'Time spent is required'
      }),
    
    score: Joi.number()
      .min(0)
      .max(100)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Score must be a number',
        'number.min': 'Score cannot be negative',
        'number.max': 'Score cannot exceed 100',
        'number.precision': 'Score can have at most 2 decimal places'
      }),
    
    status: Joi.string()
      .valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED')
      .optional()
      .messages({
        'any.only': 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED, PAUSED'
      }),
    
    sessionData: Joi.object({
      startTime: Joi.date()
        .iso()
        .max('now')
        .required()
        .messages({
          'date.base': 'Start time must be a valid date',
          'date.format': 'Start time must be in ISO format',
          'date.max': 'Start time cannot be in the future',
          'any.required': 'Start time is required'
        }),
      
      endTime: Joi.date()
        .iso()
        .max('now')
        .greater(Joi.ref('startTime'))
        .optional()
        .messages({
          'date.base': 'End time must be a valid date',
          'date.format': 'End time must be in ISO format',
          'date.max': 'End time cannot be in the future',
          'date.greater': 'End time must be after start time'
        }),
      
      pausedDuration: Joi.number()
        .integer()
        .min(0)
        .max(7200) // 2 hours max paused time
        .default(0)
        .messages({
          'number.base': 'Paused duration must be a number',
          'number.integer': 'Paused duration must be a whole number of seconds',
          'number.min': 'Paused duration cannot be negative',
          'number.max': 'Paused duration cannot exceed 2 hours'
        }),
      
      focusEvents: Joi.array()
        .items(Joi.object({
          type: Joi.string().valid('focus', 'blur').required(),
          timestamp: Joi.date().iso().max('now').required()
        }))
        .max(1000) // Reasonable limit for focus events
        .default([])
        .messages({
          'array.max': 'Too many focus events (maximum 1000)'
        }),
      
      difficultyAdjustments: Joi.array()
        .items(Joi.object({
          fromDifficulty: Joi.number().integer().min(1).max(10).required(),
          toDifficulty: Joi.number().integer().min(1).max(10).required(),
          reason: Joi.string().max(500).required(),
          timestamp: Joi.date().iso().max('now').required()
        }))
        .max(50) // Reasonable limit for difficulty adjustments
        .default([])
        .messages({
          'array.max': 'Too many difficulty adjustments (maximum 50)'
        }),
      
      helpRequests: Joi.array()
        .items(Joi.object({
          question: Joi.string().min(1).max(1000).required(),
          timestamp: Joi.date().iso().max('now').required(),
          resolved: Joi.boolean().default(false),
          responseTime: Joi.number().integer().min(0).max(3600).optional()
        }))
        .max(100) // Reasonable limit for help requests
        .default([])
        .messages({
          'array.max': 'Too many help requests (maximum 100)'
        }),
      
      interactionEvents: Joi.array()
        .items(Joi.object({
          type: Joi.string().valid('click', 'scroll', 'input', 'navigation').required(),
          element: Joi.string().max(200).optional(),
          timestamp: Joi.date().iso().max('now').required(),
          data: Joi.any().optional()
        }))
        .max(5000) // Reasonable limit for interaction events
        .default([])
        .messages({
          'array.max': 'Too many interaction events (maximum 5000)'
        })
    }).optional(),
    
    helpRequestsCount: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Help requests count must be a number',
        'number.integer': 'Help requests count must be a whole number',
        'number.min': 'Help requests count cannot be negative',
        'number.max': 'Help requests count cannot exceed 100'
      }),
    
    pauseCount: Joi.number()
      .integer()
      .min(0)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Pause count must be a number',
        'number.integer': 'Pause count must be a whole number',
        'number.min': 'Pause count cannot be negative',
        'number.max': 'Pause count cannot exceed 1000'
      }),
    
    resumeCount: Joi.number()
      .integer()
      .min(0)
      .max(1000)
      .optional()
      .messages({
        'number.base': 'Resume count must be a number',
        'number.integer': 'Resume count must be a whole number',
        'number.min': 'Resume count cannot be negative',
        'number.max': 'Resume count cannot exceed 1000'
      })
  }).custom((value, helpers) => {
    // Custom validation: pause count should not exceed resume count + 1
    if (value.pauseCount && value.resumeCount && value.pauseCount > value.resumeCount + 1) {
      return helpers.error('custom.pauseResumeLogic', {
        message: 'Pause count cannot exceed resume count by more than 1'
      });
    }
    
    // Custom validation: if status is COMPLETED, score should be provided
    if (value.status === 'COMPLETED' && (value.score === undefined || value.score === null)) {
      return helpers.error('custom.completedScore', {
        message: 'Score is required when marking activity as completed'
      });
    }
    
    // Custom validation: session data consistency
    if (value.sessionData) {
      const { startTime, endTime, pausedDuration } = value.sessionData;
      if (endTime && startTime) {
        const sessionDuration = (endTime.getTime() - startTime.getTime()) / 1000;
        const activeDuration = sessionDuration - (pausedDuration || 0);
        
        // Time spent should not exceed active session duration by more than 10%
        if (value.timeSpent > activeDuration * 1.1) {
          return helpers.error('custom.timeSpentConsistency', {
            message: 'Time spent is inconsistent with session duration'
          });
        }
      }
    }
    
    return value;
  })
};

/**
 * Enhanced progress validation service with comprehensive checks
 */
export class ProgressValidationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Validate progress update payload with comprehensive checks
   */
  async validateProgressUpdate(
    childId: string,
    payload: ProgressUpdatePayload
  ): Promise<ProgressValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const consistencyChecks: ConsistencyCheckResult[] = [];

    try {
      // 1. Schema validation
      const { error, value } = progressValidationSchemas.progressUpdate.validate(payload, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        error.details.forEach(detail => {
          errors.push({
            field: detail.path.join('.'),
            message: detail.message,
            code: detail.type,
            severity: 'error'
          });
        });
      }

      // 2. Database consistency checks
      const dbChecks = await this.performDatabaseConsistencyChecks(childId, payload);
      consistencyChecks.push(...dbChecks);

      // 3. Business logic validation
      const businessChecks = await this.performBusinessLogicValidation(childId, payload);
      consistencyChecks.push(...businessChecks);

      // 4. Time-based validation
      const timeChecks = this.performTimeValidation(payload);
      consistencyChecks.push(...timeChecks);

      // 5. Score validation
      const scoreChecks = this.performScoreValidation(payload);
      consistencyChecks.push(...scoreChecks);

      // Add failed consistency checks as errors
      consistencyChecks.forEach(check => {
        if (!check.passed) {
          errors.push({
            field: check.check,
            message: check.message,
            code: 'CONSISTENCY_CHECK_FAILED',
            severity: 'error'
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedData: value || payload,
        consistencyChecks
      };

    } catch (validationError) {
      logger.error('Progress validation error:', validationError);
      errors.push({
        field: 'system',
        message: 'Internal validation error occurred',
        code: 'VALIDATION_SYSTEM_ERROR',
        severity: 'error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        sanitizedData: payload,
        consistencyChecks
      };
    }
  }

  /**
   * Perform database consistency checks
   */
  private async performDatabaseConsistencyChecks(
    childId: string,
    payload: ProgressUpdatePayload
  ): Promise<ConsistencyCheckResult[]> {
    const checks: ConsistencyCheckResult[] = [];

    try {
      // Check if child exists and is active
      const child = await this.prisma.childProfile.findUnique({
        where: { id: childId }
      });

      checks.push({
        check: 'child_exists',
        passed: !!child,
        message: child ? 'Child profile found' : 'Child profile not found'
      });

      checks.push({
        check: 'child_active',
        passed: child?.isActive === true,
        message: child?.isActive ? 'Child profile is active' : 'Child profile is not active'
      });

      // Check if activity exists and belongs to child
      const activity = await this.prisma.studyActivity.findUnique({
        where: { id: payload.activityId },
        include: {
          plan: {
            select: {
              childId: true,
              status: true
            }
          }
        }
      });

      checks.push({
        check: 'activity_exists',
        passed: !!activity,
        message: activity ? 'Activity found' : 'Activity not found'
      });

      checks.push({
        check: 'activity_belongs_to_child',
        passed: activity?.plan.childId === childId,
        message: activity?.plan.childId === childId 
          ? 'Activity belongs to child' 
          : 'Activity does not belong to child'
      });

      // Check existing progress record for consistency
      const existingProgress = await this.prisma.progressRecord.findUnique({
        where: {
          childId_activityId: {
            childId,
            activityId: payload.activityId
          }
        }
      });

      if (existingProgress) {
        // Check for logical status transitions
        if (payload.status) {
          const validTransitions = this.getValidStatusTransitions(existingProgress.status);
          checks.push({
            check: 'valid_status_transition',
            passed: validTransitions.includes(payload.status),
            message: validTransitions.includes(payload.status)
              ? `Valid status transition from ${existingProgress.status} to ${payload.status}`
              : `Invalid status transition from ${existingProgress.status} to ${payload.status}`,
            data: { from: existingProgress.status, to: payload.status, valid: validTransitions }
          });
        }

        // Check for score regression (score should not decrease significantly)
        if (payload.score !== undefined && existingProgress.score > 0) {
          const scoreDecrease = existingProgress.score - payload.score;
          const significantDecrease = scoreDecrease > 20; // More than 20 point decrease
          
          checks.push({
            check: 'score_regression',
            passed: !significantDecrease,
            message: significantDecrease
              ? `Significant score decrease detected: ${existingProgress.score} → ${payload.score}`
              : 'Score progression is normal',
            data: { previousScore: existingProgress.score, newScore: payload.score, decrease: scoreDecrease }
          });
        }
      }

    } catch (error) {
      logger.error('Database consistency check error:', error);
      checks.push({
        check: 'database_access',
        passed: false,
        message: 'Failed to perform database consistency checks'
      });
    }

    return checks;
  }

  /**
   * Perform business logic validation
   */
  private async performBusinessLogicValidation(
    childId: string,
    payload: ProgressUpdatePayload
  ): Promise<ConsistencyCheckResult[]> {
    const checks: ConsistencyCheckResult[] = [];

    try {
      // Check for reasonable time spent vs activity duration
      const activity = await this.prisma.studyActivity.findUnique({
        where: { id: payload.activityId },
        select: { estimatedDuration: true }
      });

      if (activity) {
        const estimatedSeconds = activity.estimatedDuration * 60;
        const timeRatio = payload.timeSpent / estimatedSeconds;
        
        // Time spent should be between 10% and 500% of estimated duration
        const reasonableTime = timeRatio >= 0.1 && timeRatio <= 5.0;
        
        checks.push({
          check: 'reasonable_time_spent',
          passed: reasonableTime,
          message: reasonableTime
            ? 'Time spent is within reasonable bounds'
            : `Time spent (${payload.timeSpent}s) is ${timeRatio < 0.1 ? 'too short' : 'too long'} for estimated duration (${estimatedSeconds}s)`,
          data: { timeSpent: payload.timeSpent, estimated: estimatedSeconds, ratio: timeRatio }
        });
      }

      // Check help request consistency
      if (payload.helpRequestsCount !== undefined && payload.sessionData?.helpRequests) {
        const sessionHelpCount = payload.sessionData.helpRequests.length;
        const consistentHelpCount = Math.abs(payload.helpRequestsCount - sessionHelpCount) <= 1;
        
        checks.push({
          check: 'help_request_consistency',
          passed: consistentHelpCount,
          message: consistentHelpCount
            ? 'Help request count is consistent with session data'
            : `Help request count mismatch: payload=${payload.helpRequestsCount}, session=${sessionHelpCount}`,
          data: { payloadCount: payload.helpRequestsCount, sessionCount: sessionHelpCount }
        });
      }

      // Check pause/resume logic
      if (payload.pauseCount !== undefined && payload.resumeCount !== undefined) {
        const validPauseResume = payload.pauseCount <= payload.resumeCount + 1;
        
        checks.push({
          check: 'pause_resume_logic',
          passed: validPauseResume,
          message: validPauseResume
            ? 'Pause/resume counts are logically consistent'
            : `Invalid pause/resume logic: pauses=${payload.pauseCount}, resumes=${payload.resumeCount}`,
          data: { pauseCount: payload.pauseCount, resumeCount: payload.resumeCount }
        });
      }

    } catch (error) {
      logger.error('Business logic validation error:', error);
      checks.push({
        check: 'business_logic',
        passed: false,
        message: 'Failed to perform business logic validation'
      });
    }

    return checks;
  }

  /**
   * Perform time-based validation
   */
  private performTimeValidation(payload: ProgressUpdatePayload): ConsistencyCheckResult[] {
    const checks: ConsistencyCheckResult[] = [];

    if (payload.sessionData) {
      const { startTime, endTime, pausedDuration } = payload.sessionData;

      // Check session duration consistency
      if (endTime && startTime) {
        const sessionDuration = (endTime.getTime() - startTime.getTime()) / 1000;
        const activeDuration = sessionDuration - (pausedDuration || 0);
        
        checks.push({
          check: 'positive_session_duration',
          passed: sessionDuration > 0,
          message: sessionDuration > 0 
            ? 'Session duration is positive' 
            : 'Session duration must be positive',
          data: { sessionDuration, startTime, endTime }
        });

        checks.push({
          check: 'positive_active_duration',
          passed: activeDuration > 0,
          message: activeDuration > 0 
            ? 'Active duration is positive' 
            : 'Active duration must be positive after accounting for pauses',
          data: { activeDuration, sessionDuration, pausedDuration }
        });

        // Time spent should be close to active duration (within 10% tolerance)
        const timeDifference = Math.abs(payload.timeSpent - activeDuration);
        const tolerance = Math.max(activeDuration * 0.1, 5); // 10% or 5 seconds, whichever is larger
        
        checks.push({
          check: 'time_spent_session_consistency',
          passed: timeDifference <= tolerance,
          message: timeDifference <= tolerance
            ? 'Time spent is consistent with session duration'
            : `Time spent (${payload.timeSpent}s) differs significantly from active session duration (${activeDuration}s)`,
          data: { timeSpent: payload.timeSpent, activeDuration, difference: timeDifference, tolerance }
        });
      }

      // Check focus events chronology
      if (payload.sessionData.focusEvents.length > 0) {
        const focusEvents = payload.sessionData.focusEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        let chronologyValid = true;
        
        for (let i = 0; i < focusEvents.length - 1; i++) {
          if (focusEvents[i].timestamp >= focusEvents[i + 1].timestamp) {
            chronologyValid = false;
            break;
          }
        }
        
        checks.push({
          check: 'focus_events_chronology',
          passed: chronologyValid,
          message: chronologyValid 
            ? 'Focus events are in chronological order' 
            : 'Focus events are not in chronological order',
          data: { eventCount: focusEvents.length }
        });
      }
    }

    return checks;
  }

  /**
   * Perform score validation
   */
  private performScoreValidation(payload: ProgressUpdatePayload): ConsistencyCheckResult[] {
    const checks: ConsistencyCheckResult[] = [];

    if (payload.score !== undefined) {
      // Check for reasonable score based on help requests
      if (payload.helpRequestsCount !== undefined) {
        const helpPenalty = Math.min(payload.helpRequestsCount * 2, 20); // 2 points per help request, max 20 points
        const expectedMaxScore = 100 - helpPenalty;
        
        const reasonableScore = payload.score <= expectedMaxScore + 5; // 5 point tolerance
        
        checks.push({
          check: 'score_help_consistency',
          passed: reasonableScore,
          message: reasonableScore
            ? 'Score is reasonable given help request count'
            : `Score (${payload.score}) seems high for ${payload.helpRequestsCount} help requests`,
          data: { score: payload.score, helpRequests: payload.helpRequestsCount, expectedMax: expectedMaxScore }
        });
      }

      // Check for reasonable score based on time spent
      if (payload.timeSpent) {
        // Very quick completion (< 30 seconds) with perfect score is suspicious
        const quickPerfectScore = payload.timeSpent < 30 && payload.score >= 95;
        
        checks.push({
          check: 'quick_perfect_score',
          passed: !quickPerfectScore,
          message: quickPerfectScore
            ? 'Perfect score in very short time may indicate cheating'
            : 'Score and time spent appear reasonable',
          data: { score: payload.score, timeSpent: payload.timeSpent }
        });
      }
    }

    return checks;
  }

  /**
   * Get valid status transitions for progress records
   */
  private getValidStatusTransitions(currentStatus: ProgressStatus): ProgressStatus[] {
    const transitions: Record<ProgressStatus, ProgressStatus[]> = {
      NOT_STARTED: ['IN_PROGRESS', 'COMPLETED'],
      IN_PROGRESS: ['COMPLETED', 'PAUSED', 'NOT_STARTED'],
      COMPLETED: ['IN_PROGRESS'], // Allow re-attempting
      PAUSED: ['IN_PROGRESS', 'COMPLETED', 'NOT_STARTED']
    };

    return transitions[currentStatus] || [];
  }
}