import { GradeAgeConverter, GradeAgeValidator, getGradeDisplayName, getAllGrades } from '../gradeAgeUtils';
import { EducationalLevel } from '@prisma/client';

describe('GradeAgeConverter', () => {
  describe('getAgeRangeByGrade', () => {
    it('should return correct age range for kindergarten', () => {
      const ageRange = GradeAgeConverter.getAgeRangeByGrade('K');
      expect(ageRange).toEqual({
        min: 4,
        max: 6,
        typical: 5
      });
    });

    it('should return correct age range for 5th grade', () => {
      const ageRange = GradeAgeConverter.getAgeRangeByGrade('5');
      expect(ageRange).toEqual({
        min: 9,
        max: 11,
        typical: 10
      });
    });

    it('should return null for invalid grade', () => {
      const ageRange = GradeAgeConverter.getAgeRangeByGrade('13');
      expect(ageRange).toBeNull();
    });
  });

  describe('getGradesByAge', () => {
    it('should return correct grades for age 5', () => {
      const grades = GradeAgeConverter.getGradesByAge(5);
      expect(grades).toContain('K');
      expect(grades).toContain('1');
    });

    it('should return correct grades for age 10', () => {
      const grades = GradeAgeConverter.getGradesByAge(10);
      expect(grades).toContain('4');
      expect(grades).toContain('5');
      expect(grades).toContain('6');
    });

    it('should return empty array for age outside range', () => {
      const grades = GradeAgeConverter.getGradesByAge(25);
      expect(grades).toEqual([]);
    });
  });

  describe('getTypicalGradeByAge', () => {
    it('should return K for age 5', () => {
      const grade = GradeAgeConverter.getTypicalGradeByAge(5);
      expect(grade).toBe('K');
    });

    it('should return 8 for age 13', () => {
      const grade = GradeAgeConverter.getTypicalGradeByAge(13);
      expect(grade).toBe('8');
    });

    it('should return closest grade for edge cases', () => {
      const grade = GradeAgeConverter.getTypicalGradeByAge(3);
      expect(grade).toBe('K'); // Closest to kindergarten
    });
  });

  describe('isAgeAppropriateForGrade', () => {
    it('should return true for appropriate age-grade combinations', () => {
      expect(GradeAgeConverter.isAgeAppropriateForGrade(5, 'K')).toBe(true);
      expect(GradeAgeConverter.isAgeAppropriateForGrade(10, '5')).toBe(true);
      expect(GradeAgeConverter.isAgeAppropriateForGrade(17, '12')).toBe(true);
    });

    it('should return false for inappropriate age-grade combinations', () => {
      expect(GradeAgeConverter.isAgeAppropriateForGrade(3, '5')).toBe(false);
      expect(GradeAgeConverter.isAgeAppropriateForGrade(20, 'K')).toBe(false);
    });

    it('should return false for invalid grade', () => {
      expect(GradeAgeConverter.isAgeAppropriateForGrade(10, '15')).toBe(false);
    });
  });

  describe('getEducationalLevelByGrade', () => {
    it('should return ELEMENTARY for K-5', () => {
      expect(GradeAgeConverter.getEducationalLevelByGrade('K')).toBe(EducationalLevel.ELEMENTARY);
      expect(GradeAgeConverter.getEducationalLevelByGrade('3')).toBe(EducationalLevel.ELEMENTARY);
      expect(GradeAgeConverter.getEducationalLevelByGrade('5')).toBe(EducationalLevel.ELEMENTARY);
    });

    it('should return MIDDLE for 6-8', () => {
      expect(GradeAgeConverter.getEducationalLevelByGrade('6')).toBe(EducationalLevel.MIDDLE);
      expect(GradeAgeConverter.getEducationalLevelByGrade('7')).toBe(EducationalLevel.MIDDLE);
      expect(GradeAgeConverter.getEducationalLevelByGrade('8')).toBe(EducationalLevel.MIDDLE);
    });

    it('should return HIGH for 9-12', () => {
      expect(GradeAgeConverter.getEducationalLevelByGrade('9')).toBe(EducationalLevel.HIGH);
      expect(GradeAgeConverter.getEducationalLevelByGrade('12')).toBe(EducationalLevel.HIGH);
    });

    it('should return null for invalid grade', () => {
      expect(GradeAgeConverter.getEducationalLevelByGrade('13')).toBeNull();
    });
  });

  describe('getGradesByEducationalLevel', () => {
    it('should return correct grades for ELEMENTARY', () => {
      const grades = GradeAgeConverter.getGradesByEducationalLevel(EducationalLevel.ELEMENTARY);
      expect(grades).toEqual(['K', '1', '2', '3', '4', '5']);
    });

    it('should return correct grades for MIDDLE', () => {
      const grades = GradeAgeConverter.getGradesByEducationalLevel(EducationalLevel.MIDDLE);
      expect(grades).toEqual(['6', '7', '8']);
    });

    it('should return correct grades for HIGH', () => {
      const grades = GradeAgeConverter.getGradesByEducationalLevel(EducationalLevel.HIGH);
      expect(grades).toEqual(['9', '10', '11', '12']);
    });
  });

  describe('getNextGrade', () => {
    it('should return correct next grade', () => {
      expect(GradeAgeConverter.getNextGrade('K')).toBe('1');
      expect(GradeAgeConverter.getNextGrade('5')).toBe('6');
      expect(GradeAgeConverter.getNextGrade('11')).toBe('12');
    });

    it('should return null for last grade', () => {
      expect(GradeAgeConverter.getNextGrade('12')).toBeNull();
    });

    it('should return null for invalid grade', () => {
      expect(GradeAgeConverter.getNextGrade('13')).toBeNull();
    });
  });

  describe('getPreviousGrade', () => {
    it('should return correct previous grade', () => {
      expect(GradeAgeConverter.getPreviousGrade('1')).toBe('K');
      expect(GradeAgeConverter.getPreviousGrade('6')).toBe('5');
      expect(GradeAgeConverter.getPreviousGrade('12')).toBe('11');
    });

    it('should return null for first grade', () => {
      expect(GradeAgeConverter.getPreviousGrade('K')).toBeNull();
    });

    it('should return null for invalid grade', () => {
      expect(GradeAgeConverter.getPreviousGrade('13')).toBeNull();
    });
  });

  describe('getGradeProgressionPath', () => {
    it('should return correct progression path', () => {
      const path = GradeAgeConverter.getGradeProgressionPath('K', '3');
      expect(path).toEqual(['K', '1', '2', '3']);
    });

    it('should return correct progression path for middle school', () => {
      const path = GradeAgeConverter.getGradeProgressionPath('6', '8');
      expect(path).toEqual(['6', '7', '8']);
    });

    it('should return empty array for invalid progression', () => {
      const path = GradeAgeConverter.getGradeProgressionPath('5', '3');
      expect(path).toEqual([]);
    });

    it('should return empty array for invalid grades', () => {
      const path = GradeAgeConverter.getGradeProgressionPath('K', '13');
      expect(path).toEqual([]);
    });
  });

  describe('arePrerequisitesMet', () => {
    it('should return true when prerequisites are met', () => {
      const result = GradeAgeConverter.arePrerequisitesMet('2', ['K', '1']);
      expect(result).toBe(true);
    });

    it('should return false when prerequisites are not met', () => {
      const result = GradeAgeConverter.arePrerequisitesMet('3', ['K', '1']);
      expect(result).toBe(false);
    });

    it('should return true for kindergarten (no prerequisites)', () => {
      const result = GradeAgeConverter.arePrerequisitesMet('K', []);
      expect(result).toBe(true);
    });

    it('should return false for invalid grade', () => {
      const result = GradeAgeConverter.arePrerequisitesMet('13', ['K', '1']);
      expect(result).toBe(false);
    });
  });

  describe('getMissingPrerequisites', () => {
    it('should return missing prerequisites', () => {
      const missing = GradeAgeConverter.getMissingPrerequisites('3', ['K']);
      expect(missing).toEqual(['2']); // Grade 3 only requires grade 2 as direct prerequisite
    });

    it('should return empty array when all prerequisites are met', () => {
      const missing = GradeAgeConverter.getMissingPrerequisites('3', ['K', '1', '2']);
      expect(missing).toEqual([]);
    });

    it('should return empty array for kindergarten', () => {
      const missing = GradeAgeConverter.getMissingPrerequisites('K', []);
      expect(missing).toEqual([]);
    });
  });
});

describe('GradeAgeValidator', () => {
  describe('validateGrade', () => {
    it('should validate correct grades', () => {
      const result = GradeAgeValidator.validateGrade('K');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate numeric grades', () => {
      const result = GradeAgeValidator.validateGrade('5');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid grades', () => {
      const result = GradeAgeValidator.validateGrade('13');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty grade', () => {
      const result = GradeAgeValidator.validateGrade('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateAge', () => {
    it('should validate appropriate ages', () => {
      const result = GradeAgeValidator.validateAge(10);
      expect(result.isValid).toBe(true);
      expect(result.suggestedGrades.length).toBeGreaterThan(0);
    });

    it('should reject ages outside educational range', () => {
      const result = GradeAgeValidator.validateAge(25);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject negative ages', () => {
      const result = GradeAgeValidator.validateAge(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should suggest grades for valid ages', () => {
      const result = GradeAgeValidator.validateAge(5);
      expect(result.isValid).toBe(true);
      expect(result.suggestedGrades).toContain('K');
    });
  });

  describe('validateAgeGradeCombination', () => {
    it('should validate appropriate age-grade combinations', () => {
      const result = GradeAgeValidator.validateAgeGradeCombination(5, 'K');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should warn about inappropriate age-grade combinations', () => {
      const result = GradeAgeValidator.validateAgeGradeCombination(15, 'K');
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject invalid grades', () => {
      const result = GradeAgeValidator.validateAgeGradeCombination(10, '13');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid ages', () => {
      const result = GradeAgeValidator.validateAgeGradeCombination(25, '5');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateGradeProgression', () => {
    it('should validate correct progression', () => {
      const result = GradeAgeValidator.validateGradeProgression(['K', '1', '2']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should warn about out-of-order progression', () => {
      const result = GradeAgeValidator.validateGradeProgression(['2', 'K', '1']);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about gaps in progression', () => {
      const result = GradeAgeValidator.validateGradeProgression(['K', '3']);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject empty progression', () => {
      const result = GradeAgeValidator.validateGradeProgression([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid grades in progression', () => {
      const result = GradeAgeValidator.validateGradeProgression(['K', '1', '13']);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('getGradeDisplayName', () => {
    it('should return correct display names', () => {
      expect(getGradeDisplayName('K')).toBe('Kindergarten');
      expect(getGradeDisplayName('1')).toBe('1st Grade');
      expect(getGradeDisplayName('12')).toBe('12th Grade (Senior)');
    });

    it('should return original grade for invalid grades', () => {
      expect(getGradeDisplayName('13')).toBe('13');
    });
  });

  describe('getAllGrades', () => {
    it('should return all grade mappings', () => {
      const grades = getAllGrades();
      expect(grades.length).toBe(13); // K through 12
      expect(grades[0].grade).toBe('K');
      expect(grades[12].grade).toBe('12');
    });

    it('should return grades in correct order', () => {
      const grades = getAllGrades();
      for (let i = 1; i < grades.length; i++) {
        expect(grades[i].sortOrder).toBeGreaterThan(grades[i - 1].sortOrder);
      }
    });
  });
});