import { 
  SUBJECT_DEFINITIONS, 
  SUBJECT_CATEGORY_INFO, 
  SUBJECT_HIERARCHY, 
  GRADE_SUBJECT_REQUIREMENTS,
  SubjectDefinition 
} from '../data/subjectData';
import { SubjectCategory, EducationalLevel } from '@prisma/client';
import { GradeAgeConverter } from './gradeAgeUtils';

export interface SubjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SubjectAvailabilityResult {
  available: SubjectDefinition[];
  required: SubjectDefinition[];
  recommended: SubjectDefinition[];
  optional: SubjectDefinition[];
}

export interface SubjectPrerequisiteResult {
  canEnroll: boolean;
  missingPrerequisites: string[];
  recommendedPrerequisites: string[];
}

/**
 * Subject Management Utilities
 */
export class SubjectManager {
  
  /**
   * Get all subjects
   */
  static getAllSubjects(): SubjectDefinition[] {
    return [...SUBJECT_DEFINITIONS].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get subject by ID
   */
  static getSubjectById(subjectId: string): SubjectDefinition | null {
    return SUBJECT_DEFINITIONS.find(s => s.id === subjectId) || null;
  }

  /**
   * Get subjects by category
   */
  static getSubjectsByCategory(category: SubjectCategory): SubjectDefinition[] {
    return SUBJECT_DEFINITIONS
      .filter(s => s.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get core subjects only
   */
  static getCoreSubjects(): SubjectDefinition[] {
    return SUBJECT_DEFINITIONS
      .filter(s => s.isCore)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get elective subjects only
   */
  static getElectiveSubjects(): SubjectDefinition[] {
    return SUBJECT_DEFINITIONS
      .filter(s => !s.isCore)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get subjects available for a specific grade
   */
  static getSubjectsForGrade(grade: string): SubjectDefinition[] {
    return SUBJECT_DEFINITIONS
      .filter(s => s.gradeAvailability.includes(grade))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get subjects available for an educational level
   */
  static getSubjectsForEducationalLevel(level: EducationalLevel): SubjectDefinition[] {
    const grades = GradeAgeConverter.getGradesByEducationalLevel(level);
    const subjectIds = new Set<string>();
    
    grades.forEach(grade => {
      const gradeSubjects = this.getSubjectsForGrade(grade);
      gradeSubjects.forEach(subject => subjectIds.add(subject.id));
    });
    
    return Array.from(subjectIds)
      .map(id => this.getSubjectById(id))
      .filter((s): s is SubjectDefinition => s !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get subject availability breakdown for a grade
   */
  static getSubjectAvailabilityForGrade(grade: string): SubjectAvailabilityResult {
    const available = this.getSubjectsForGrade(grade);
    const educationalLevel = GradeAgeConverter.getEducationalLevelByGrade(grade);
    
    let requirements;
    if (educationalLevel === EducationalLevel.ELEMENTARY) {
      requirements = GRADE_SUBJECT_REQUIREMENTS.elementary;
    } else if (educationalLevel === EducationalLevel.MIDDLE) {
      requirements = GRADE_SUBJECT_REQUIREMENTS.middle;
    } else {
      requirements = GRADE_SUBJECT_REQUIREMENTS.high;
    }
    
    const required = available.filter(s => requirements.required.includes(s.id));
    const recommended = available.filter(s => requirements.recommended.includes(s.id));
    const optional = available.filter(s => 
      !requirements.required.includes(s.id) && 
      !requirements.recommended.includes(s.id)
    );
    
    return { available, required, recommended, optional };
  }

  /**
   * Check if a subject is available for a grade
   */
  static isSubjectAvailableForGrade(subjectId: string, grade: string): boolean {
    const subject = this.getSubjectById(subjectId);
    return subject ? subject.gradeAvailability.includes(grade) : false;
  }

  /**
   * Get estimated hours for a subject in a specific grade
   */
  static getEstimatedHours(subjectId: string, grade: string): number {
    const subject = this.getSubjectById(subjectId);
    if (!subject || !subject.estimatedHoursPerGrade[grade]) {
      return 0;
    }
    return subject.estimatedHoursPerGrade[grade];
  }

  /**
   * Get difficulty level for a subject in a specific grade
   */
  static getDifficultyLevel(subjectId: string, grade: string): 'beginner' | 'intermediate' | 'advanced' | null {
    const subject = this.getSubjectById(subjectId);
    if (!subject || !subject.difficultyProgression[grade]) {
      return null;
    }
    return subject.difficultyProgression[grade];
  }

  /**
   * Check subject prerequisites
   */
  static checkPrerequisites(subjectId: string, completedSubjects: string[]): SubjectPrerequisiteResult {
    const subject = this.getSubjectById(subjectId);
    if (!subject) {
      return {
        canEnroll: false,
        missingPrerequisites: [],
        recommendedPrerequisites: []
      };
    }

    const missingPrerequisites = subject.prerequisites.filter(
      prereq => !completedSubjects.includes(prereq)
    );

    // Get recommended prerequisites based on subject hierarchy
    const recommendedPrerequisites: string[] = [];
    if (subject.category === SubjectCategory.STEM && !completedSubjects.includes('mathematics')) {
      recommendedPrerequisites.push('mathematics');
    }
    if (subject.category === SubjectCategory.LANGUAGE_ARTS && !completedSubjects.includes('english-language-arts')) {
      recommendedPrerequisites.push('english-language-arts');
    }

    return {
      canEnroll: missingPrerequisites.length === 0,
      missingPrerequisites,
      recommendedPrerequisites: recommendedPrerequisites.filter(
        rec => !completedSubjects.includes(rec) && !missingPrerequisites.includes(rec)
      )
    };
  }

  /**
   * Get subject progression path
   */
  static getSubjectProgressionPath(subjectId: string): string[] {
    const subject = this.getSubjectById(subjectId);
    if (!subject) return [];

    const path: string[] = [];
    
    // Add prerequisites recursively
    const addPrerequisites = (currentSubjectId: string, visited: Set<string> = new Set()) => {
      if (visited.has(currentSubjectId)) return; // Prevent circular dependencies
      visited.add(currentSubjectId);
      
      const currentSubject = this.getSubjectById(currentSubjectId);
      if (!currentSubject) return;
      
      currentSubject.prerequisites.forEach(prereq => {
        addPrerequisites(prereq, visited);
        if (!path.includes(prereq)) {
          path.push(prereq);
        }
      });
    };

    addPrerequisites(subjectId);
    
    // Add the subject itself
    if (!path.includes(subjectId)) {
      path.push(subjectId);
    }

    return path;
  }

  /**
   * Get related subjects
   */
  static getRelatedSubjects(subjectId: string): SubjectDefinition[] {
    const subject = this.getSubjectById(subjectId);
    if (!subject) return [];

    // Find subjects in the same category
    const categorySubjects = this.getSubjectsByCategory(subject.category)
      .filter(s => s.id !== subjectId);

    // Find subjects that have this subject as a prerequisite
    const dependentSubjects = SUBJECT_DEFINITIONS
      .filter(s => s.prerequisites.includes(subjectId));

    // Combine and deduplicate
    const related = [...categorySubjects, ...dependentSubjects];
    const uniqueRelated = related.filter((subject, index, self) => 
      index === self.findIndex(s => s.id === subject.id)
    );

    return uniqueRelated.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Get subjects by hierarchy
   */
  static getSubjectsByHierarchy(hierarchyKey: keyof typeof SUBJECT_HIERARCHY): SubjectDefinition[] {
    const subjectIds = SUBJECT_HIERARCHY[hierarchyKey];
    return subjectIds
      .map(id => this.getSubjectById(id))
      .filter((s): s is SubjectDefinition => s !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}

/**
 * Subject Validation Utilities
 */
export class SubjectValidator {
  
  /**
   * Validate subject ID
   */
  static validateSubjectId(subjectId: string): SubjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!subjectId || subjectId.trim() === '') {
      errors.push('Subject ID cannot be empty');
      return { isValid: false, errors, warnings };
    }

    const subject = SubjectManager.getSubjectById(subjectId);
    if (!subject) {
      const availableSubjects = SubjectManager.getAllSubjects().map(s => s.id);
      errors.push(`Invalid subject ID: ${subjectId}. Available subjects: ${availableSubjects.join(', ')}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validate subject-grade combination
   */
  static validateSubjectGradeCombination(subjectId: string, grade: string): SubjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate subject first
    const subjectValidation = this.validateSubjectId(subjectId);
    if (!subjectValidation.isValid) {
      return subjectValidation;
    }

    // Check if subject is available for grade
    if (!SubjectManager.isSubjectAvailableForGrade(subjectId, grade)) {
      const subject = SubjectManager.getSubjectById(subjectId);
      errors.push(
        `Subject ${subject?.displayName} is not available for grade ${grade}. ` +
        `Available grades: ${subject?.gradeAvailability.join(', ')}`
      );
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * Validate subject prerequisites
   */
  static validateSubjectPrerequisites(subjectId: string, completedSubjects: string[]): SubjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const prerequisiteResult = SubjectManager.checkPrerequisites(subjectId, completedSubjects);
    
    if (!prerequisiteResult.canEnroll) {
      const subject = SubjectManager.getSubjectById(subjectId);
      const missingNames = prerequisiteResult.missingPrerequisites
        .map(id => SubjectManager.getSubjectById(id)?.displayName || id)
        .join(', ');
      
      errors.push(
        `Cannot enroll in ${subject?.displayName}. Missing prerequisites: ${missingNames}`
      );
    }

    if (prerequisiteResult.recommendedPrerequisites.length > 0) {
      const recommendedNames = prerequisiteResult.recommendedPrerequisites
        .map(id => SubjectManager.getSubjectById(id)?.displayName || id)
        .join(', ');
      
      warnings.push(
        `Recommended prerequisites for better success: ${recommendedNames}`
      );
    }

    return { 
      isValid: prerequisiteResult.canEnroll, 
      errors, 
      warnings 
    };
  }

  /**
   * Validate subject list for a grade
   */
  static validateSubjectListForGrade(subjectIds: string[], grade: string): SubjectValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (subjectIds.length === 0) {
      errors.push('Subject list cannot be empty');
      return { isValid: false, errors, warnings };
    }

    // Validate each subject
    for (const subjectId of subjectIds) {
      const validation = this.validateSubjectGradeCombination(subjectId, grade);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Check for required subjects
    const availability = SubjectManager.getSubjectAvailabilityForGrade(grade);
    const missingRequired = availability.required
      .filter(subject => !subjectIds.includes(subject.id))
      .map(subject => subject.displayName);

    if (missingRequired.length > 0) {
      warnings.push(`Missing required subjects for grade ${grade}: ${missingRequired.join(', ')}`);
    }

    // Check for duplicate subjects
    const duplicates = subjectIds.filter((id, index) => subjectIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate subjects found: ${duplicates.join(', ')}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }
}

/**
 * Utility functions for getting subject information
 */
export const getSubjectDisplayName = (subjectId: string): string => {
  const subject = SubjectManager.getSubjectById(subjectId);
  return subject?.displayName || subjectId;
};

export const getSubjectColor = (subjectId: string): string => {
  const subject = SubjectManager.getSubjectById(subjectId);
  return subject?.color || '#757575';
};

export const getSubjectIcon = (subjectId: string): string => {
  const subject = SubjectManager.getSubjectById(subjectId);
  return subject?.icon || 'subject';
};

export const getCategoryInfo = (category: SubjectCategory) => {
  return SUBJECT_CATEGORY_INFO[category];
};

export const getSubjectsByGrade = (grade: string): SubjectDefinition[] => {
  return SubjectManager.getSubjectsForGrade(grade);
};

export const getCoreSubjectsForGrade = (grade: string): SubjectDefinition[] => {
  return SubjectManager.getSubjectsForGrade(grade).filter(s => s.isCore);
};

export const getElectiveSubjectsForGrade = (grade: string): SubjectDefinition[] => {
  return SubjectManager.getSubjectsForGrade(grade).filter(s => !s.isCore);
};