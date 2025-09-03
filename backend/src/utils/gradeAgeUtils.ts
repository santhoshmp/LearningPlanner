import { GRADE_AGE_MAPPINGS, GRADE_PROGRESSION_PATHS, EDUCATIONAL_LEVEL_INFO, GradeAgeMapping } from '../data/gradeAgeData';
import { EducationalLevel } from '@prisma/client';

export interface AgeRange {
  min: number;
  max: number;
  typical: number;
}

export interface GradeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AgeValidationResult {
  isValid: boolean;
  suggestedGrades: string[];
  errors: string[];
}

/**
 * Grade-to-Age Conversion Utilities
 */
export class GradeAgeConverter {
  
  /**
   * Get age range for a specific grade
   */
  static getAgeRangeByGrade(grade: string): AgeRange | null {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
    if (!gradeMapping) return null;
    
    return {
      min: gradeMapping.ageMin,
      max: gradeMapping.ageMax,
      typical: gradeMapping.ageTypical
    };
  }

  /**
   * Get suggested grades for a specific age
   */
  static getGradesByAge(age: number): string[] {
    return GRADE_AGE_MAPPINGS
      .filter(g => age >= g.ageMin && age <= g.ageMax)
      .map(g => g.grade);
  }

  /**
   * Get the most appropriate grade for a specific age
   */
  static getTypicalGradeByAge(age: number): string | null {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.ageTypical === age);
    if (gradeMapping) return gradeMapping.grade;
    
    // If no exact match, find the closest typical age
    const closest = GRADE_AGE_MAPPINGS.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.ageTypical - age);
      const currDiff = Math.abs(curr.ageTypical - age);
      return currDiff < prevDiff ? curr : prev;
    });
    
    return closest.grade;
  }

  /**
   * Check if an age is appropriate for a grade
   */
  static isAgeAppropriateForGrade(age: number, grade: string): boolean {
    const ageRange = this.getAgeRangeByGrade(grade);
    if (!ageRange) return false;
    
    return age >= ageRange.min && age <= ageRange.max;
  }

  /**
   * Get educational level for a grade
   */
  static getEducationalLevelByGrade(grade: string): EducationalLevel | null {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
    return gradeMapping?.educationalLevel || null;
  }

  /**
   * Get all grades for an educational level
   */
  static getGradesByEducationalLevel(level: EducationalLevel): string[] {
    return GRADE_AGE_MAPPINGS
      .filter(g => g.educationalLevel === level)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(g => g.grade);
  }

  /**
   * Get next grade in progression
   */
  static getNextGrade(currentGrade: string): string | null {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === currentGrade);
    return gradeMapping?.nextGrade || null;
  }

  /**
   * Get previous grade in progression
   */
  static getPreviousGrade(currentGrade: string): string | null {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.nextGrade === currentGrade);
    return gradeMapping?.grade || null;
  }

  /**
   * Get grade progression path from start to end grade
   */
  static getGradeProgressionPath(startGrade: string, endGrade: string): string[] {
    const startIndex = GRADE_PROGRESSION_PATHS.all.indexOf(startGrade);
    const endIndex = GRADE_PROGRESSION_PATHS.all.indexOf(endGrade);
    
    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
      return [];
    }
    
    return GRADE_PROGRESSION_PATHS.all.slice(startIndex, endIndex + 1);
  }

  /**
   * Check if grade prerequisites are met
   */
  static arePrerequisitesMet(grade: string, completedGrades: string[]): boolean {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
    if (!gradeMapping) return false;
    
    return gradeMapping.prerequisites.every(prereq => completedGrades.includes(prereq));
  }

  /**
   * Get missing prerequisites for a grade
   */
  static getMissingPrerequisites(grade: string, completedGrades: string[]): string[] {
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
    if (!gradeMapping) return [];
    
    return gradeMapping.prerequisites.filter(prereq => !completedGrades.includes(prereq));
  }
}

/**
 * Validation Functions
 */
export class GradeAgeValidator {
  
  /**
   * Validate a grade level
   */
  static validateGrade(grade: string): GradeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if grade exists
    const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
    if (!gradeMapping) {
      errors.push(`Invalid grade: ${grade}. Must be one of: ${GRADE_PROGRESSION_PATHS.all.join(', ')}`);
      return { isValid: false, errors, warnings };
    }
    
    // Check grade format
    if (!/^(K|[1-9]|1[0-2])$/.test(grade)) {
      warnings.push(`Grade format may be non-standard: ${grade}`);
    }
    
    return { isValid: true, errors, warnings };
  }

  /**
   * Validate an age for educational appropriateness
   */
  static validateAge(age: number): AgeValidationResult {
    const errors: string[] = [];
    const suggestedGrades: string[] = [];
    
    // Check age range
    if (age < 3 || age > 20) {
      errors.push(`Age ${age} is outside typical educational range (3-20 years)`);
      return { isValid: false, suggestedGrades, errors };
    }
    
    // Get suggested grades
    const grades = GradeAgeConverter.getGradesByAge(age);
    suggestedGrades.push(...grades);
    
    if (grades.length === 0) {
      // Age is between typical ranges, suggest closest grades
      const closest = GRADE_AGE_MAPPINGS.reduce((prev, curr) => {
        const prevDiff = Math.min(
          Math.abs(prev.ageMin - age),
          Math.abs(prev.ageMax - age),
          Math.abs(prev.ageTypical - age)
        );
        const currDiff = Math.min(
          Math.abs(curr.ageMin - age),
          Math.abs(curr.ageMax - age),
          Math.abs(curr.ageTypical - age)
        );
        return currDiff < prevDiff ? curr : prev;
      });
      suggestedGrades.push(closest.grade);
    }
    
    return { isValid: true, suggestedGrades, errors };
  }

  /**
   * Validate age-grade combination
   */
  static validateAgeGradeCombination(age: number, grade: string): GradeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate grade first
    const gradeValidation = this.validateGrade(grade);
    if (!gradeValidation.isValid) {
      return gradeValidation;
    }
    
    // Validate age
    const ageValidation = this.validateAge(age);
    if (!ageValidation.isValid) {
      errors.push(...ageValidation.errors);
      return { isValid: false, errors, warnings };
    }
    
    // Check if age is appropriate for grade
    if (!GradeAgeConverter.isAgeAppropriateForGrade(age, grade)) {
      const ageRange = GradeAgeConverter.getAgeRangeByGrade(grade);
      const suggestedGrades = GradeAgeConverter.getGradesByAge(age);
      
      warnings.push(
        `Age ${age} is outside typical range for grade ${grade} (${ageRange?.min}-${ageRange?.max}). ` +
        `Suggested grades for age ${age}: ${suggestedGrades.join(', ')}`
      );
    }
    
    return { isValid: true, errors, warnings };
  }

  /**
   * Validate grade progression sequence
   */
  static validateGradeProgression(grades: string[]): GradeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (grades.length === 0) {
      errors.push('Grade progression cannot be empty');
      return { isValid: false, errors, warnings };
    }
    
    // Validate each grade
    for (const grade of grades) {
      const gradeValidation = this.validateGrade(grade);
      if (!gradeValidation.isValid) {
        errors.push(...gradeValidation.errors);
      }
      warnings.push(...gradeValidation.warnings);
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }
    
    // Check progression order
    const sortedGrades = [...grades].sort((a, b) => {
      const aIndex = GRADE_PROGRESSION_PATHS.all.indexOf(a);
      const bIndex = GRADE_PROGRESSION_PATHS.all.indexOf(b);
      return aIndex - bIndex;
    });
    
    if (JSON.stringify(grades) !== JSON.stringify(sortedGrades)) {
      warnings.push('Grades are not in sequential order');
    }
    
    // Check for gaps in progression
    for (let i = 1; i < grades.length; i++) {
      const currentIndex = GRADE_PROGRESSION_PATHS.all.indexOf(grades[i]);
      const previousIndex = GRADE_PROGRESSION_PATHS.all.indexOf(grades[i - 1]);
      
      if (currentIndex - previousIndex > 1) {
        const missingGrades = GRADE_PROGRESSION_PATHS.all.slice(previousIndex + 1, currentIndex);
        warnings.push(`Gap in progression between ${grades[i - 1]} and ${grades[i]}. Missing: ${missingGrades.join(', ')}`);
      }
    }
    
    return { isValid: true, errors, warnings };
  }
}

/**
 * Utility functions for getting grade information
 */
export const getGradeDisplayName = (grade: string): string => {
  const gradeMapping = GRADE_AGE_MAPPINGS.find(g => g.grade === grade);
  return gradeMapping?.displayName || grade;
};

export const getEducationalLevelInfo = (level: EducationalLevel) => {
  return EDUCATIONAL_LEVEL_INFO[level];
};

export const getAllGrades = (): GradeAgeMapping[] => {
  return [...GRADE_AGE_MAPPINGS];
};

export const getGradesByLevel = (level: EducationalLevel): GradeAgeMapping[] => {
  return GRADE_AGE_MAPPINGS.filter(g => g.educationalLevel === level);
};