import { 
  SubjectManager, 
  SubjectValidator, 
  getSubjectDisplayName, 
  getSubjectColor, 
  getSubjectIcon,
  getCoreSubjectsForGrade,
  getElectiveSubjectsForGrade
} from '../subjectUtils';
import { SubjectCategory, EducationalLevel } from '@prisma/client';

describe('SubjectManager', () => {
  describe('getAllSubjects', () => {
    it('should return all subjects sorted by sort order', () => {
      const subjects = SubjectManager.getAllSubjects();
      expect(subjects.length).toBeGreaterThan(0);
      
      // Check if sorted by sortOrder
      for (let i = 1; i < subjects.length; i++) {
        expect(subjects[i].sortOrder).toBeGreaterThanOrEqual(subjects[i - 1].sortOrder);
      }
    });
  });

  describe('getSubjectById', () => {
    it('should return correct subject for valid ID', () => {
      const subject = SubjectManager.getSubjectById('mathematics');
      expect(subject).toBeTruthy();
      expect(subject?.id).toBe('mathematics');
      expect(subject?.displayName).toBe('Mathematics');
    });

    it('should return null for invalid ID', () => {
      const subject = SubjectManager.getSubjectById('invalid-subject');
      expect(subject).toBeNull();
    });
  });

  describe('getSubjectsByCategory', () => {
    it('should return subjects for CORE_ACADEMIC category', () => {
      const subjects = SubjectManager.getSubjectsByCategory(SubjectCategory.CORE_ACADEMIC);
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.category).toBe(SubjectCategory.CORE_ACADEMIC);
      });
    });

    it('should return subjects for STEM category', () => {
      const subjects = SubjectManager.getSubjectsByCategory(SubjectCategory.STEM);
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.category).toBe(SubjectCategory.STEM);
      });
    });

    it('should return empty array for category with no subjects', () => {
      // This test assumes we don't have subjects in all categories
      const subjects = SubjectManager.getSubjectsByCategory(SubjectCategory.ARTS);
      expect(Array.isArray(subjects)).toBe(true);
    });
  });

  describe('getCoreSubjects', () => {
    it('should return only core subjects', () => {
      const subjects = SubjectManager.getCoreSubjects();
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.isCore).toBe(true);
      });
    });
  });

  describe('getElectiveSubjects', () => {
    it('should return only elective subjects', () => {
      const subjects = SubjectManager.getElectiveSubjects();
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.isCore).toBe(false);
      });
    });
  });

  describe('getSubjectsForGrade', () => {
    it('should return subjects available for kindergarten', () => {
      const subjects = SubjectManager.getSubjectsForGrade('K');
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.gradeAvailability).toContain('K');
      });
    });

    it('should return subjects available for 5th grade', () => {
      const subjects = SubjectManager.getSubjectsForGrade('5');
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.gradeAvailability).toContain('5');
      });
    });

    it('should return subjects available for 12th grade', () => {
      const subjects = SubjectManager.getSubjectsForGrade('12');
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.gradeAvailability).toContain('12');
      });
    });

    it('should return empty array for invalid grade', () => {
      const subjects = SubjectManager.getSubjectsForGrade('invalid');
      expect(subjects).toEqual([]);
    });
  });

  describe('getSubjectsForEducationalLevel', () => {
    it('should return subjects for elementary level', () => {
      const subjects = SubjectManager.getSubjectsForEducationalLevel(EducationalLevel.ELEMENTARY);
      expect(subjects.length).toBeGreaterThan(0);
      
      // Should include basic subjects like math and english
      const subjectIds = subjects.map(s => s.id);
      expect(subjectIds).toContain('mathematics');
      expect(subjectIds).toContain('english-language-arts');
    });

    it('should return subjects for high school level', () => {
      const subjects = SubjectManager.getSubjectsForEducationalLevel(EducationalLevel.HIGH);
      expect(subjects.length).toBeGreaterThan(0);
      
      // Should include advanced subjects like biology, chemistry
      const subjectIds = subjects.map(s => s.id);
      expect(subjectIds).toContain('biology');
      expect(subjectIds).toContain('chemistry');
    });
  });

  describe('getSubjectAvailabilityForGrade', () => {
    it('should return correct availability breakdown for elementary grade', () => {
      const availability = SubjectManager.getSubjectAvailabilityForGrade('3');
      
      expect(availability.available.length).toBeGreaterThan(0);
      expect(availability.required.length).toBeGreaterThan(0);
      
      // Should include core subjects as required
      const requiredIds = availability.required.map(s => s.id);
      expect(requiredIds).toContain('mathematics');
      expect(requiredIds).toContain('english-language-arts');
    });

    it('should return correct availability breakdown for high school grade', () => {
      const availability = SubjectManager.getSubjectAvailabilityForGrade('11');
      
      expect(availability.available.length).toBeGreaterThan(0);
      expect(availability.required.length).toBeGreaterThan(0);
      expect(availability.optional.length).toBeGreaterThan(0);
    });
  });

  describe('isSubjectAvailableForGrade', () => {
    it('should return true for mathematics in kindergarten', () => {
      const isAvailable = SubjectManager.isSubjectAvailableForGrade('mathematics', 'K');
      expect(isAvailable).toBe(true);
    });

    it('should return false for chemistry in kindergarten', () => {
      const isAvailable = SubjectManager.isSubjectAvailableForGrade('chemistry', 'K');
      expect(isAvailable).toBe(false);
    });

    it('should return true for chemistry in 11th grade', () => {
      const isAvailable = SubjectManager.isSubjectAvailableForGrade('chemistry', '11');
      expect(isAvailable).toBe(true);
    });

    it('should return false for invalid subject', () => {
      const isAvailable = SubjectManager.isSubjectAvailableForGrade('invalid-subject', '5');
      expect(isAvailable).toBe(false);
    });
  });

  describe('getEstimatedHours', () => {
    it('should return correct hours for mathematics in 5th grade', () => {
      const hours = SubjectManager.getEstimatedHours('mathematics', '5');
      expect(hours).toBeGreaterThan(0);
      expect(typeof hours).toBe('number');
    });

    it('should return 0 for invalid subject', () => {
      const hours = SubjectManager.getEstimatedHours('invalid-subject', '5');
      expect(hours).toBe(0);
    });

    it('should return 0 for valid subject but invalid grade', () => {
      const hours = SubjectManager.getEstimatedHours('mathematics', 'invalid-grade');
      expect(hours).toBe(0);
    });
  });

  describe('getDifficultyLevel', () => {
    it('should return beginner for mathematics in kindergarten', () => {
      const difficulty = SubjectManager.getDifficultyLevel('mathematics', 'K');
      expect(difficulty).toBe('beginner');
    });

    it('should return advanced for mathematics in 12th grade', () => {
      const difficulty = SubjectManager.getDifficultyLevel('mathematics', '12');
      expect(difficulty).toBe('advanced');
    });

    it('should return null for invalid subject', () => {
      const difficulty = SubjectManager.getDifficultyLevel('invalid-subject', '5');
      expect(difficulty).toBeNull();
    });
  });

  describe('checkPrerequisites', () => {
    it('should allow enrollment in mathematics with no prerequisites', () => {
      const result = SubjectManager.checkPrerequisites('mathematics', []);
      expect(result.canEnroll).toBe(true);
      expect(result.missingPrerequisites).toEqual([]);
    });

    it('should require prerequisites for chemistry', () => {
      const result = SubjectManager.checkPrerequisites('chemistry', []);
      expect(result.canEnroll).toBe(false);
      expect(result.missingPrerequisites.length).toBeGreaterThan(0);
    });

    it('should allow enrollment when prerequisites are met', () => {
      const result = SubjectManager.checkPrerequisites('chemistry', ['science', 'mathematics']);
      expect(result.canEnroll).toBe(true);
      expect(result.missingPrerequisites).toEqual([]);
    });

    it('should return false for invalid subject', () => {
      const result = SubjectManager.checkPrerequisites('invalid-subject', []);
      expect(result.canEnroll).toBe(false);
    });
  });

  describe('getSubjectProgressionPath', () => {
    it('should return correct progression path for chemistry', () => {
      const path = SubjectManager.getSubjectProgressionPath('chemistry');
      expect(path).toContain('chemistry');
      expect(path).toContain('science');
      expect(path).toContain('mathematics');
      
      // Prerequisites should come before the subject
      const chemistryIndex = path.indexOf('chemistry');
      const scienceIndex = path.indexOf('science');
      const mathIndex = path.indexOf('mathematics');
      
      expect(scienceIndex).toBeLessThan(chemistryIndex);
      expect(mathIndex).toBeLessThan(chemistryIndex);
    });

    it('should return single item for subject with no prerequisites', () => {
      const path = SubjectManager.getSubjectProgressionPath('mathematics');
      expect(path).toEqual(['mathematics']);
    });

    it('should return empty array for invalid subject', () => {
      const path = SubjectManager.getSubjectProgressionPath('invalid-subject');
      expect(path).toEqual([]);
    });
  });

  describe('getRelatedSubjects', () => {
    it('should return related subjects for mathematics', () => {
      const related = SubjectManager.getRelatedSubjects('mathematics');
      expect(related.length).toBeGreaterThan(0);
      
      // Should not include mathematics itself
      const relatedIds = related.map(s => s.id);
      expect(relatedIds).not.toContain('mathematics');
    });

    it('should return empty array for invalid subject', () => {
      const related = SubjectManager.getRelatedSubjects('invalid-subject');
      expect(related).toEqual([]);
    });
  });

  describe('getSubjectsByHierarchy', () => {
    it('should return core subjects', () => {
      const subjects = SubjectManager.getSubjectsByHierarchy('core');
      expect(subjects.length).toBeGreaterThan(0);
      
      const subjectIds = subjects.map(s => s.id);
      expect(subjectIds).toContain('mathematics');
      expect(subjectIds).toContain('english-language-arts');
    });

    it('should return STEM subjects', () => {
      const subjects = SubjectManager.getSubjectsByHierarchy('stem');
      expect(subjects.length).toBeGreaterThan(0);
      
      const subjectIds = subjects.map(s => s.id);
      expect(subjectIds).toContain('mathematics');
      expect(subjectIds).toContain('science');
    });
  });
});

describe('SubjectValidator', () => {
  describe('validateSubjectId', () => {
    it('should validate correct subject IDs', () => {
      const result = SubjectValidator.validateSubjectId('mathematics');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid subject IDs', () => {
      const result = SubjectValidator.validateSubjectId('invalid-subject');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty subject ID', () => {
      const result = SubjectValidator.validateSubjectId('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSubjectGradeCombination', () => {
    it('should validate appropriate subject-grade combinations', () => {
      const result = SubjectValidator.validateSubjectGradeCombination('mathematics', 'K');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject inappropriate subject-grade combinations', () => {
      const result = SubjectValidator.validateSubjectGradeCombination('chemistry', 'K');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid subject ID', () => {
      const result = SubjectValidator.validateSubjectGradeCombination('invalid-subject', '5');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSubjectPrerequisites', () => {
    it('should validate subjects with no prerequisites', () => {
      const result = SubjectValidator.validateSubjectPrerequisites('mathematics', []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject subjects with missing prerequisites', () => {
      const result = SubjectValidator.validateSubjectPrerequisites('chemistry', []);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate subjects with met prerequisites', () => {
      const result = SubjectValidator.validateSubjectPrerequisites('chemistry', ['science', 'mathematics']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateSubjectListForGrade', () => {
    it('should validate appropriate subject list for grade', () => {
      const result = SubjectValidator.validateSubjectListForGrade(['mathematics', 'english-language-arts'], '5');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty subject list', () => {
      const result = SubjectValidator.validateSubjectListForGrade([], '5');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject duplicate subjects', () => {
      const result = SubjectValidator.validateSubjectListForGrade(['mathematics', 'mathematics'], '5');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject subjects not available for grade', () => {
      const result = SubjectValidator.validateSubjectListForGrade(['chemistry'], 'K');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about missing required subjects', () => {
      const result = SubjectValidator.validateSubjectListForGrade(['visual-arts'], '5');
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('getSubjectDisplayName', () => {
    it('should return correct display names', () => {
      expect(getSubjectDisplayName('mathematics')).toBe('Mathematics');
      expect(getSubjectDisplayName('english-language-arts')).toBe('English Language Arts');
    });

    it('should return original ID for invalid subjects', () => {
      expect(getSubjectDisplayName('invalid-subject')).toBe('invalid-subject');
    });
  });

  describe('getSubjectColor', () => {
    it('should return correct colors', () => {
      const color = getSubjectColor('mathematics');
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
    });

    it('should return default color for invalid subjects', () => {
      const color = getSubjectColor('invalid-subject');
      expect(color).toBe('#757575');
    });
  });

  describe('getSubjectIcon', () => {
    it('should return correct icons', () => {
      const icon = getSubjectIcon('mathematics');
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });

    it('should return default icon for invalid subjects', () => {
      const icon = getSubjectIcon('invalid-subject');
      expect(icon).toBe('subject');
    });
  });

  describe('getCoreSubjectsForGrade', () => {
    it('should return only core subjects for grade', () => {
      const subjects = getCoreSubjectsForGrade('5');
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.isCore).toBe(true);
        expect(subject.gradeAvailability).toContain('5');
      });
    });
  });

  describe('getElectiveSubjectsForGrade', () => {
    it('should return only elective subjects for grade', () => {
      const subjects = getElectiveSubjectsForGrade('11');
      expect(subjects.length).toBeGreaterThan(0);
      subjects.forEach(subject => {
        expect(subject.isCore).toBe(false);
        expect(subject.gradeAvailability).toContain('11');
      });
    });
  });
});