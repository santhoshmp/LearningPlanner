import { 
  ALL_TOPICS, 
  TOPIC_PROGRESSION_PATHS, 
  TOPIC_SKILL_MAPPINGS, 
  ASSESSMENT_CRITERIA_TEMPLATES,
  TopicDefinition 
} from '../data/topicData';
import { DifficultyLevel } from '@prisma/client';

export interface TopicValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TopicPrerequisiteResult {
  canStart: boolean;
  missingPrerequisites: string[];
  recommendedPrerequisites: string[];
  prerequisiteChain: string[];
}

export interface TopicProgressionResult {
  currentTopic: TopicDefinition;
  prerequisites: TopicDefinition[];
  nextTopics: TopicDefinition[];
  relatedTopics: TopicDefinition[];
}

export interface TopicHierarchy {
  grade: string;
  subject: string;
  topics: TopicSummary[];
  totalEstimatedHours: number;
  difficultyDistribution: Record<DifficultyLevel, number>;
}

export interface TopicSummary {
  id: string;
  name: string;
  displayName: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  prerequisiteCount: number;
  skillCount: number;
  sortOrder: number;
}

/**
 * Topic Management Utilities
 */
export class TopicManager {
  
  /**
   * Get all topics
   */
  static getAllTopics(): TopicDefinition[] {
    return [...ALL_TOPICS].sort((a, b) => {
      // Sort by grade, then subject, then sort order
      if (a.gradeId !== b.gradeId) {
        return a.gradeId.localeCompare(b.gradeId);
      }
      if (a.subjectId !== b.subjectId) {
        return a.subjectId.localeCompare(b.subjectId);
      }
      return a.sortOrder - b.sortOrder;
    });
  }

  /**
   * Get topic by ID
   */
  static getTopicById(topicId: string): TopicDefinition | null {
    return ALL_TOPICS.find(t => t.id === topicId) || null;
  }

  /**
   * Get topics by grade
   */
  static getTopicsByGrade(grade: string): TopicDefinition[] {
    return ALL_TOPICS
      .filter(t => t.gradeId === grade && t.isActive)
      .sort((a, b) => {
        if (a.subjectId !== b.subjectId) {
          return a.subjectId.localeCompare(b.subjectId);
        }
        return a.sortOrder - b.sortOrder;
      });
  }

  /**
   * Get topics by subject
   */
  static getTopicsBySubject(subjectId: string): TopicDefinition[] {
    return ALL_TOPICS
      .filter(t => t.subjectId === subjectId && t.isActive)
      .sort((a, b) => {
        if (a.gradeId !== b.gradeId) {
          return a.gradeId.localeCompare(b.gradeId);
        }
        return a.sortOrder - b.sortOrder;
      });
  }

  /**
   * Get topics by grade and subject
   */
  static getTopicsByGradeAndSubject(grade: string, subjectId: string): TopicDefinition[] {
    return ALL_TOPICS
      .filter(t => t.gradeId === grade && t.subjectId === subjectId && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get topics by difficulty level
   */
  static getTopicsByDifficulty(difficulty: DifficultyLevel): TopicDefinition[] {
    return ALL_TOPICS
      .filter(t => t.difficulty === difficulty && t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get topics by skill
   */
  static getTopicsBySkill(skill: string): TopicDefinition[] {
    const topicIds = TOPIC_SKILL_MAPPINGS[skill] || [];
    return topicIds
      .map(id => this.getTopicById(id))
      .filter((t): t is TopicDefinition => t !== null && t.isActive);
  }

  /**
   * Get topic hierarchy for a grade-subject combination
   */
  static getTopicHierarchy(grade: string, subjectId: string): TopicHierarchy {
    const topics = this.getTopicsByGradeAndSubject(grade, subjectId);
    
    const topicSummaries: TopicSummary[] = topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      displayName: topic.displayName,
      difficulty: topic.difficulty,
      estimatedHours: topic.estimatedHours,
      prerequisiteCount: topic.prerequisites.length,
      skillCount: topic.skills.length,
      sortOrder: topic.sortOrder
    }));

    const totalEstimatedHours = topics.reduce((sum, topic) => sum + topic.estimatedHours, 0);
    
    const difficultyDistribution = topics.reduce((dist, topic) => {
      dist[topic.difficulty] = (dist[topic.difficulty] || 0) + 1;
      return dist;
    }, {} as Record<DifficultyLevel, number>);

    return {
      grade,
      subject: subjectId,
      topics: topicSummaries,
      totalEstimatedHours,
      difficultyDistribution
    };
  }

  /**
   * Check topic prerequisites
   */
  static checkPrerequisites(topicId: string, completedTopics: string[]): TopicPrerequisiteResult {
    const topic = this.getTopicById(topicId);
    if (!topic) {
      return {
        canStart: false,
        missingPrerequisites: [],
        recommendedPrerequisites: [],
        prerequisiteChain: []
      };
    }

    const missingPrerequisites = topic.prerequisites.filter(
      prereq => !completedTopics.includes(prereq)
    );

    // Build complete prerequisite chain
    const prerequisiteChain = this.getPrerequisiteChain(topicId);
    
    // Get recommended prerequisites (topics that would help but aren't required)
    const recommendedPrerequisites = this.getRecommendedPrerequisites(topicId, completedTopics);

    return {
      canStart: missingPrerequisites.length === 0,
      missingPrerequisites,
      recommendedPrerequisites,
      prerequisiteChain
    };
  }

  /**
   * Get complete prerequisite chain for a topic
   */
  static getPrerequisiteChain(topicId: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(topicId)) return []; // Prevent circular dependencies
    visited.add(topicId);

    const topic = this.getTopicById(topicId);
    if (!topic) return [];

    const chain: string[] = [];
    
    // Add prerequisites recursively
    for (const prereqId of topic.prerequisites) {
      const prereqChain = this.getPrerequisiteChain(prereqId, visited);
      chain.push(...prereqChain);
      if (!chain.includes(prereqId)) {
        chain.push(prereqId);
      }
    }

    return chain;
  }

  /**
   * Get recommended prerequisites based on skills and difficulty
   */
  static getRecommendedPrerequisites(topicId: string, completedTopics: string[]): string[] {
    const topic = this.getTopicById(topicId);
    if (!topic) return [];

    const recommended: string[] = [];
    
    // Find topics that develop similar skills at lower difficulty
    const relatedTopics = ALL_TOPICS.filter(t => 
      t.id !== topicId &&
      t.gradeId === topic.gradeId &&
      t.subjectId === topic.subjectId &&
      t.difficulty < topic.difficulty &&
      t.skills.some(skill => topic.skills.includes(skill)) &&
      !completedTopics.includes(t.id) &&
      !topic.prerequisites.includes(t.id)
    );

    recommended.push(...relatedTopics.map(t => t.id));
    
    return recommended;
  }

  /**
   * Get topic progression information
   */
  static getTopicProgression(topicId: string): TopicProgressionResult | null {
    const topic = this.getTopicById(topicId);
    if (!topic) return null;

    const prerequisites = topic.prerequisites
      .map(id => this.getTopicById(id))
      .filter((t): t is TopicDefinition => t !== null);

    // Find topics that have this topic as a prerequisite
    const nextTopics = ALL_TOPICS.filter(t => 
      t.prerequisites.includes(topicId) && t.isActive
    );

    // Find related topics (same grade/subject, similar skills)
    const relatedTopics = ALL_TOPICS.filter(t =>
      t.id !== topicId &&
      t.gradeId === topic.gradeId &&
      t.subjectId === topic.subjectId &&
      t.skills.some(skill => topic.skills.includes(skill)) &&
      !t.prerequisites.includes(topicId) &&
      !topic.prerequisites.includes(t.id) &&
      t.isActive
    );

    return {
      currentTopic: topic,
      prerequisites,
      nextTopics,
      relatedTopics
    };
  }

  /**
   * Get learning path for a subject in a grade
   */
  static getLearningPath(grade: string, subjectId: string): TopicDefinition[] {
    const topics = this.getTopicsByGradeAndSubject(grade, subjectId);
    
    // Sort topics by prerequisites (topological sort)
    const sorted: TopicDefinition[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (topic: TopicDefinition) => {
      if (visiting.has(topic.id)) {
        // Circular dependency detected, skip
        return;
      }
      if (visited.has(topic.id)) {
        return;
      }

      visiting.add(topic.id);

      // Visit prerequisites first
      for (const prereqId of topic.prerequisites) {
        const prereq = topics.find(t => t.id === prereqId);
        if (prereq) {
          visit(prereq);
        }
      }

      visiting.delete(topic.id);
      visited.add(topic.id);
      sorted.push(topic);
    };

    // Visit all topics
    for (const topic of topics) {
      visit(topic);
    }

    return sorted;
  }

  /**
   * Get estimated completion time for a learning path
   */
  static getEstimatedCompletionTime(topicIds: string[]): number {
    return topicIds.reduce((total, id) => {
      const topic = this.getTopicById(id);
      return total + (topic?.estimatedHours || 0);
    }, 0);
  }

  /**
   * Get topics by learning objective
   */
  static getTopicsByLearningObjective(objective: string): TopicDefinition[] {
    return ALL_TOPICS.filter(topic =>
      topic.learningObjectives.some(obj => 
        obj.toLowerCase().includes(objective.toLowerCase())
      ) && topic.isActive
    );
  }

  /**
   * Get assessment criteria for a topic
   */
  static getAssessmentCriteria(topicId: string): string[] {
    const topic = this.getTopicById(topicId);
    if (!topic) return [];

    // Return topic-specific criteria or template-based criteria
    if (topic.assessmentCriteria.length > 0) {
      return topic.assessmentCriteria;
    }

    return ASSESSMENT_CRITERIA_TEMPLATES[topic.difficulty] || [];
  }
}

/**
 * Topic Validation Utilities
 */
export class TopicValidator {
  
  /**
   * Validate topic ID
   */
  static validateTopicId(topicId: string): TopicValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!topicId || topicId.trim() === '') {
      errors.push('Topic ID cannot be empty');
      return { isValid: false, errors, warnings };
    }

    const topic = TopicManager.getTopicById(topicId);
    if (!topic) {
      errors.push(`Invalid topic ID: ${topicId}`);
      return { isValid: false, errors, warnings };
    }

    if (!topic.isActive) {
      warnings.push(`Topic ${topicId} is not currently active`);
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validate topic prerequisites
   */
  static validateTopicPrerequisites(topicId: string, completedTopics: string[]): TopicValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const prerequisiteResult = TopicManager.checkPrerequisites(topicId, completedTopics);
    
    if (!prerequisiteResult.canStart) {
      const topic = TopicManager.getTopicById(topicId);
      const missingNames = prerequisiteResult.missingPrerequisites
        .map(id => TopicManager.getTopicById(id)?.displayName || id)
        .join(', ');
      
      errors.push(
        `Cannot start ${topic?.displayName}. Missing prerequisites: ${missingNames}`
      );
    }

    if (prerequisiteResult.recommendedPrerequisites.length > 0) {
      const recommendedNames = prerequisiteResult.recommendedPrerequisites
        .map(id => TopicManager.getTopicById(id)?.displayName || id)
        .join(', ');
      
      warnings.push(
        `Recommended topics for better success: ${recommendedNames}`
      );
    }

    return { 
      isValid: prerequisiteResult.canStart, 
      errors, 
      warnings 
    };
  }

  /**
   * Validate learning path
   */
  static validateLearningPath(topicIds: string[]): TopicValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (topicIds.length === 0) {
      errors.push('Learning path cannot be empty');
      return { isValid: false, errors, warnings };
    }

    // Validate each topic
    for (const topicId of topicIds) {
      const validation = this.validateTopicId(topicId);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Check for prerequisite violations
    const completed = new Set<string>();
    for (const topicId of topicIds) {
      const prerequisiteValidation = this.validateTopicPrerequisites(topicId, Array.from(completed));
      if (!prerequisiteValidation.isValid) {
        errors.push(...prerequisiteValidation.errors);
      }
      warnings.push(...prerequisiteValidation.warnings);
      completed.add(topicId);
    }

    // Check for duplicates
    const duplicates = topicIds.filter((id, index) => topicIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate topics found: ${duplicates.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate topic difficulty progression
   */
  static validateDifficultyProgression(topicIds: string[]): TopicValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const topics = topicIds
      .map(id => TopicManager.getTopicById(id))
      .filter((t): t is TopicDefinition => t !== null);

    if (topics.length !== topicIds.length) {
      errors.push('Some topics in the progression are invalid');
      return { isValid: false, errors, warnings };
    }

    // Check for reasonable difficulty progression
    const difficultyOrder = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED, DifficultyLevel.MASTERY];
    
    for (let i = 1; i < topics.length; i++) {
      const prevDifficulty = difficultyOrder.indexOf(topics[i - 1].difficulty);
      const currDifficulty = difficultyOrder.indexOf(topics[i].difficulty);
      
      if (currDifficulty < prevDifficulty - 1) {
        warnings.push(
          `Significant difficulty drop from ${topics[i - 1].displayName} to ${topics[i].displayName}`
        );
      }
      
      if (currDifficulty > prevDifficulty + 1) {
        warnings.push(
          `Large difficulty jump from ${topics[i - 1].displayName} to ${topics[i].displayName}`
        );
      }
    }

    return { isValid: true, errors, warnings };
  }
}

/**
 * Utility functions for getting topic information
 */
export const getTopicDisplayName = (topicId: string): string => {
  const topic = TopicManager.getTopicById(topicId);
  return topic?.displayName || topicId;
};

export const getTopicEstimatedHours = (topicId: string): number => {
  const topic = TopicManager.getTopicById(topicId);
  return topic?.estimatedHours || 0;
};

export const getTopicDifficulty = (topicId: string): DifficultyLevel | null => {
  const topic = TopicManager.getTopicById(topicId);
  return topic?.difficulty || null;
};

export const getTopicSkills = (topicId: string): string[] => {
  const topic = TopicManager.getTopicById(topicId);
  return topic?.skills || [];
};

export const getTopicsForGradeSubject = (grade: string, subjectId: string): TopicDefinition[] => {
  return TopicManager.getTopicsByGradeAndSubject(grade, subjectId);
};

export const buildLearningPath = (grade: string, subjectId: string): TopicDefinition[] => {
  return TopicManager.getLearningPath(grade, subjectId);
};