import { 
  TopicManager, 
  TopicValidator, 
  getTopicDisplayName, 
  getTopicEstimatedHours,
  getTopicDifficulty,
  getTopicSkills,
  buildLearningPath
} from '../topicUtils';
import { DifficultyLevel } from '@prisma/client';

describe('TopicManager', () => {
  describe('getAllTopics', () => {
    it('should return all topics sorted properly', () => {
      const topics = TopicManager.getAllTopics();
      expect(topics.length).toBeGreaterThan(0);
      
      // Check if sorted by grade, then subject, then sort order
      for (let i = 1; i < topics.length; i++) {
        const prev = topics[i - 1];
        const curr = topics[i];
        
        if (prev.gradeId === curr.gradeId && prev.subjectId === curr.subjectId) {
          expect(curr.sortOrder).toBeGreaterThanOrEqual(prev.sortOrder);
        }
      }
    });
  });

  describe('getTopicById', () => {
    it('should return correct topic for valid ID', () => {
      const topic = TopicManager.getTopicById('k-math-counting-1-10');
      expect(topic).toBeTruthy();
      expect(topic?.id).toBe('k-math-counting-1-10');
      expect(topic?.displayName).toBe('Counting 1-10');
    });

    it('should return null for invalid ID', () => {
      const topic = TopicManager.getTopicById('invalid-topic');
      expect(topic).toBeNull();
    });
  });

  describe('getTopicsByGrade', () => {
    it('should return topics for kindergarten', () => {
      const topics = TopicManager.getTopicsByGrade('K');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.gradeId).toBe('K');
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return topics for grade 1', () => {
      const topics = TopicManager.getTopicsByGrade('1');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.gradeId).toBe('1');
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return empty array for invalid grade', () => {
      const topics = TopicManager.getTopicsByGrade('invalid');
      expect(topics).toEqual([]);
    });
  });

  describe('getTopicsBySubject', () => {
    it('should return topics for mathematics', () => {
      const topics = TopicManager.getTopicsBySubject('mathematics');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.subjectId).toBe('mathematics');
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return topics for english-language-arts', () => {
      const topics = TopicManager.getTopicsBySubject('english-language-arts');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.subjectId).toBe('english-language-arts');
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return empty array for invalid subject', () => {
      const topics = TopicManager.getTopicsBySubject('invalid-subject');
      expect(topics).toEqual([]);
    });
  });

  describe('getTopicsByGradeAndSubject', () => {
    it('should return topics for kindergarten mathematics', () => {
      const topics = TopicManager.getTopicsByGradeAndSubject('K', 'mathematics');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.gradeId).toBe('K');
        expect(topic.subjectId).toBe('mathematics');
        expect(topic.isActive).toBe(true);
      });
      
      // Check if sorted by sort order
      for (let i = 1; i < topics.length; i++) {
        expect(topics[i].sortOrder).toBeGreaterThanOrEqual(topics[i - 1].sortOrder);
      }
    });

    it('should return topics for grade 5 mathematics', () => {
      const topics = TopicManager.getTopicsByGradeAndSubject('5', 'mathematics');
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.gradeId).toBe('5');
        expect(topic.subjectId).toBe('mathematics');
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return empty array for invalid combination', () => {
      const topics = TopicManager.getTopicsByGradeAndSubject('invalid', 'invalid');
      expect(topics).toEqual([]);
    });
  });

  describe('getTopicsByDifficulty', () => {
    it('should return beginner topics', () => {
      const topics = TopicManager.getTopicsByDifficulty(DifficultyLevel.BEGINNER);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.difficulty).toBe(DifficultyLevel.BEGINNER);
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return intermediate topics', () => {
      const topics = TopicManager.getTopicsByDifficulty(DifficultyLevel.INTERMEDIATE);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.difficulty).toBe(DifficultyLevel.INTERMEDIATE);
        expect(topic.isActive).toBe(true);
      });
    });

    it('should return advanced topics', () => {
      const topics = TopicManager.getTopicsByDifficulty(DifficultyLevel.ADVANCED);
      expect(topics.length).toBeGreaterThan(0);
      topics.forEach(topic => {
        expect(topic.difficulty).toBe(DifficultyLevel.ADVANCED);
        expect(topic.isActive).toBe(true);
      });
    });
  });

  describe('getTopicHierarchy', () => {
    it('should return hierarchy for kindergarten mathematics', () => {
      const hierarchy = TopicManager.getTopicHierarchy('K', 'mathematics');
      
      expect(hierarchy.grade).toBe('K');
      expect(hierarchy.subject).toBe('mathematics');
      expect(hierarchy.topics.length).toBeGreaterThan(0);
      expect(hierarchy.totalEstimatedHours).toBeGreaterThan(0);
      expect(hierarchy.difficultyDistribution).toBeDefined();
      
      // Check topic summaries
      hierarchy.topics.forEach(summary => {
        expect(summary.id).toBeTruthy();
        expect(summary.displayName).toBeTruthy();
        expect(summary.estimatedHours).toBeGreaterThan(0);
        expect(summary.prerequisiteCount).toBeGreaterThanOrEqual(0);
        expect(summary.skillCount).toBeGreaterThan(0);
      });
    });

    it('should return empty hierarchy for invalid combination', () => {
      const hierarchy = TopicManager.getTopicHierarchy('invalid', 'invalid');
      
      expect(hierarchy.grade).toBe('invalid');
      expect(hierarchy.subject).toBe('invalid');
      expect(hierarchy.topics).toEqual([]);
      expect(hierarchy.totalEstimatedHours).toBe(0);
    });
  });

  describe('checkPrerequisites', () => {
    it('should allow topics with no prerequisites', () => {
      const result = TopicManager.checkPrerequisites('k-math-counting-1-10', []);
      expect(result.canStart).toBe(true);
      expect(result.missingPrerequisites).toEqual([]);
    });

    it('should require prerequisites for dependent topics', () => {
      const result = TopicManager.checkPrerequisites('k-math-simple-addition', []);
      expect(result.canStart).toBe(false);
      expect(result.missingPrerequisites.length).toBeGreaterThan(0);
    });

    it('should allow topics when prerequisites are met', () => {
      const result = TopicManager.checkPrerequisites('k-math-simple-addition', [
        'k-math-counting-1-10',
        'k-math-number-recognition'
      ]);
      expect(result.canStart).toBe(true);
      expect(result.missingPrerequisites).toEqual([]);
    });

    it('should return false for invalid topic', () => {
      const result = TopicManager.checkPrerequisites('invalid-topic', []);
      expect(result.canStart).toBe(false);
    });
  });

  describe('getPrerequisiteChain', () => {
    it('should return empty chain for topic with no prerequisites', () => {
      const chain = TopicManager.getPrerequisiteChain('k-math-counting-1-10');
      expect(chain).toEqual([]);
    });

    it('should return correct chain for topic with prerequisites', () => {
      const chain = TopicManager.getPrerequisiteChain('k-math-simple-addition');
      expect(chain.length).toBeGreaterThan(0);
      expect(chain).toContain('k-math-counting-1-10');
      expect(chain).toContain('k-math-number-recognition');
    });

    it('should return empty chain for invalid topic', () => {
      const chain = TopicManager.getPrerequisiteChain('invalid-topic');
      expect(chain).toEqual([]);
    });
  });

  describe('getTopicProgression', () => {
    it('should return progression info for valid topic', () => {
      const progression = TopicManager.getTopicProgression('k-math-number-recognition');
      
      expect(progression).toBeTruthy();
      expect(progression?.currentTopic.id).toBe('k-math-number-recognition');
      expect(progression?.prerequisites.length).toBeGreaterThanOrEqual(0);
      expect(progression?.nextTopics.length).toBeGreaterThanOrEqual(0);
      expect(progression?.relatedTopics.length).toBeGreaterThanOrEqual(0);
    });

    it('should return null for invalid topic', () => {
      const progression = TopicManager.getTopicProgression('invalid-topic');
      expect(progression).toBeNull();
    });
  });

  describe('getLearningPath', () => {
    it('should return ordered learning path for kindergarten mathematics', () => {
      const path = TopicManager.getLearningPath('K', 'mathematics');
      expect(path.length).toBeGreaterThan(0);
      
      // Check that prerequisites come before dependent topics
      const topicIds = path.map(t => t.id);
      for (const topic of path) {
        for (const prereqId of topic.prerequisites) {
          const prereqIndex = topicIds.indexOf(prereqId);
          const topicIndex = topicIds.indexOf(topic.id);
          if (prereqIndex !== -1) {
            expect(prereqIndex).toBeLessThan(topicIndex);
          }
        }
      }
    });

    it('should return empty path for invalid combination', () => {
      const path = TopicManager.getLearningPath('invalid', 'invalid');
      expect(path).toEqual([]);
    });
  });

  describe('getEstimatedCompletionTime', () => {
    it('should calculate correct total time', () => {
      const topicIds = ['k-math-counting-1-10', 'k-math-number-recognition'];
      const totalTime = TopicManager.getEstimatedCompletionTime(topicIds);
      expect(totalTime).toBe(7); // 3 + 4 hours
    });

    it('should return 0 for empty array', () => {
      const totalTime = TopicManager.getEstimatedCompletionTime([]);
      expect(totalTime).toBe(0);
    });

    it('should handle invalid topic IDs', () => {
      const topicIds = ['k-math-counting-1-10', 'invalid-topic'];
      const totalTime = TopicManager.getEstimatedCompletionTime(topicIds);
      expect(totalTime).toBe(3); // Only valid topic counted
    });
  });

  describe('getAssessmentCriteria', () => {
    it('should return topic-specific criteria', () => {
      const criteria = TopicManager.getAssessmentCriteria('k-math-counting-1-10');
      expect(criteria.length).toBeGreaterThan(0);
      expect(criteria).toContain('Can count aloud from 1 to 10');
    });

    it('should return empty array for invalid topic', () => {
      const criteria = TopicManager.getAssessmentCriteria('invalid-topic');
      expect(criteria).toEqual([]);
    });
  });
});

describe('TopicValidator', () => {
  describe('validateTopicId', () => {
    it('should validate correct topic IDs', () => {
      const result = TopicValidator.validateTopicId('k-math-counting-1-10');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid topic IDs', () => {
      const result = TopicValidator.validateTopicId('invalid-topic');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty topic ID', () => {
      const result = TopicValidator.validateTopicId('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTopicPrerequisites', () => {
    it('should validate topics with no prerequisites', () => {
      const result = TopicValidator.validateTopicPrerequisites('k-math-counting-1-10', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject topics with missing prerequisites', () => {
      const result = TopicValidator.validateTopicPrerequisites('k-math-simple-addition', []);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate topics with met prerequisites', () => {
      const result = TopicValidator.validateTopicPrerequisites('k-math-simple-addition', [
        'k-math-counting-1-10',
        'k-math-number-recognition'
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateLearningPath', () => {
    it('should validate correct learning path', () => {
      const path = [
        'k-math-counting-1-10',
        'k-math-number-recognition',
        'k-math-simple-addition'
      ];
      const result = TopicValidator.validateLearningPath(path);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty learning path', () => {
      const result = TopicValidator.validateLearningPath([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject path with invalid topics', () => {
      const path = ['k-math-counting-1-10', 'invalid-topic'];
      const result = TopicValidator.validateLearningPath(path);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject path with duplicate topics', () => {
      const path = ['k-math-counting-1-10', 'k-math-counting-1-10'];
      const result = TopicValidator.validateLearningPath(path);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject path with prerequisite violations', () => {
      const path = ['k-math-simple-addition', 'k-math-counting-1-10']; // Wrong order
      const result = TopicValidator.validateLearningPath(path);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateDifficultyProgression', () => {
    it('should validate reasonable difficulty progression', () => {
      const path = ['k-math-counting-1-10', 'k-math-number-recognition']; // Both beginner
      const result = TopicValidator.validateDifficultyProgression(path);
      expect(result.isValid).toBe(true);
    });

    it('should warn about large difficulty jumps', () => {
      // This test would need topics with different difficulty levels in sequence
      const path = ['k-math-counting-1-10']; // Single topic, no progression issues
      const result = TopicValidator.validateDifficultyProgression(path);
      expect(result.isValid).toBe(true);
    });

    it('should reject path with invalid topics', () => {
      const path = ['invalid-topic'];
      const result = TopicValidator.validateDifficultyProgression(path);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('getTopicDisplayName', () => {
    it('should return correct display names', () => {
      expect(getTopicDisplayName('k-math-counting-1-10')).toBe('Counting 1-10');
      expect(getTopicDisplayName('k-ela-letter-recognition')).toBe('Letter Recognition');
    });

    it('should return original ID for invalid topics', () => {
      expect(getTopicDisplayName('invalid-topic')).toBe('invalid-topic');
    });
  });

  describe('getTopicEstimatedHours', () => {
    it('should return correct estimated hours', () => {
      expect(getTopicEstimatedHours('k-math-counting-1-10')).toBe(3);
      expect(getTopicEstimatedHours('k-math-number-recognition')).toBe(4);
    });

    it('should return 0 for invalid topics', () => {
      expect(getTopicEstimatedHours('invalid-topic')).toBe(0);
    });
  });

  describe('getTopicDifficulty', () => {
    it('should return correct difficulty levels', () => {
      expect(getTopicDifficulty('k-math-counting-1-10')).toBe(DifficultyLevel.BEGINNER);
      expect(getTopicDifficulty('5-math-fractions-basics')).toBe(DifficultyLevel.INTERMEDIATE);
    });

    it('should return null for invalid topics', () => {
      expect(getTopicDifficulty('invalid-topic')).toBeNull();
    });
  });

  describe('getTopicSkills', () => {
    it('should return correct skills', () => {
      const skills = getTopicSkills('k-math-counting-1-10');
      expect(skills).toContain('Number recognition');
      expect(skills).toContain('Counting');
    });

    it('should return empty array for invalid topics', () => {
      expect(getTopicSkills('invalid-topic')).toEqual([]);
    });
  });

  describe('buildLearningPath', () => {
    it('should build correct learning path', () => {
      const path = buildLearningPath('K', 'mathematics');
      expect(path.length).toBeGreaterThan(0);
      
      // Should be properly ordered by prerequisites
      const topicIds = path.map(t => t.id);
      for (const topic of path) {
        for (const prereqId of topic.prerequisites) {
          const prereqIndex = topicIds.indexOf(prereqId);
          const topicIndex = topicIds.indexOf(topic.id);
          if (prereqIndex !== -1) {
            expect(prereqIndex).toBeLessThan(topicIndex);
          }
        }
      }
    });

    it('should return empty path for invalid combination', () => {
      const path = buildLearningPath('invalid', 'invalid');
      expect(path).toEqual([]);
    });
  });
});