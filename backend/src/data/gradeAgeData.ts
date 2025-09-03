import { EducationalLevel } from '@prisma/client';

export interface GradeAgeMapping {
  grade: string;
  displayName: string;
  ageMin: number;
  ageMax: number;
  ageTypical: number;
  educationalLevel: EducationalLevel;
  prerequisites: string[];
  nextGrade?: string;
  sortOrder: number;
}

/**
 * Comprehensive grade-age mapping system for K-12 education
 * Based on standard US educational system with typical age ranges
 */
export const GRADE_AGE_MAPPINGS: GradeAgeMapping[] = [
  {
    grade: 'K',
    displayName: 'Kindergarten',
    ageMin: 4,
    ageMax: 6,
    ageTypical: 5,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: [],
    nextGrade: '1',
    sortOrder: 0
  },
  {
    grade: '1',
    displayName: '1st Grade',
    ageMin: 5,
    ageMax: 7,
    ageTypical: 6,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: ['K'],
    nextGrade: '2',
    sortOrder: 1
  },
  {
    grade: '2',
    displayName: '2nd Grade',
    ageMin: 6,
    ageMax: 8,
    ageTypical: 7,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: ['1'],
    nextGrade: '3',
    sortOrder: 2
  },
  {
    grade: '3',
    displayName: '3rd Grade',
    ageMin: 7,
    ageMax: 9,
    ageTypical: 8,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: ['2'],
    nextGrade: '4',
    sortOrder: 3
  },
  {
    grade: '4',
    displayName: '4th Grade',
    ageMin: 8,
    ageMax: 10,
    ageTypical: 9,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: ['3'],
    nextGrade: '5',
    sortOrder: 4
  },
  {
    grade: '5',
    displayName: '5th Grade',
    ageMin: 9,
    ageMax: 11,
    ageTypical: 10,
    educationalLevel: EducationalLevel.ELEMENTARY,
    prerequisites: ['4'],
    nextGrade: '6',
    sortOrder: 5
  },
  {
    grade: '6',
    displayName: '6th Grade',
    ageMin: 10,
    ageMax: 12,
    ageTypical: 11,
    educationalLevel: EducationalLevel.MIDDLE,
    prerequisites: ['5'],
    nextGrade: '7',
    sortOrder: 6
  },
  {
    grade: '7',
    displayName: '7th Grade',
    ageMin: 11,
    ageMax: 13,
    ageTypical: 12,
    educationalLevel: EducationalLevel.MIDDLE,
    prerequisites: ['6'],
    nextGrade: '8',
    sortOrder: 7
  },
  {
    grade: '8',
    displayName: '8th Grade',
    ageMin: 12,
    ageMax: 14,
    ageTypical: 13,
    educationalLevel: EducationalLevel.MIDDLE,
    prerequisites: ['7'],
    nextGrade: '9',
    sortOrder: 8
  },
  {
    grade: '9',
    displayName: '9th Grade (Freshman)',
    ageMin: 13,
    ageMax: 15,
    ageTypical: 14,
    educationalLevel: EducationalLevel.HIGH,
    prerequisites: ['8'],
    nextGrade: '10',
    sortOrder: 9
  },
  {
    grade: '10',
    displayName: '10th Grade (Sophomore)',
    ageMin: 14,
    ageMax: 16,
    ageTypical: 15,
    educationalLevel: EducationalLevel.HIGH,
    prerequisites: ['9'],
    nextGrade: '11',
    sortOrder: 10
  },
  {
    grade: '11',
    displayName: '11th Grade (Junior)',
    ageMin: 15,
    ageMax: 17,
    ageTypical: 16,
    educationalLevel: EducationalLevel.HIGH,
    prerequisites: ['10'],
    nextGrade: '12',
    sortOrder: 11
  },
  {
    grade: '12',
    displayName: '12th Grade (Senior)',
    ageMin: 16,
    ageMax: 18,
    ageTypical: 17,
    educationalLevel: EducationalLevel.HIGH,
    prerequisites: ['11'],
    nextGrade: undefined,
    sortOrder: 12
  }
];

/**
 * Grade progression paths showing the sequence of grades
 */
export const GRADE_PROGRESSION_PATHS = {
  elementary: ['K', '1', '2', '3', '4', '5'],
  middle: ['6', '7', '8'],
  high: ['9', '10', '11', '12'],
  all: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
};

/**
 * Educational level mappings
 */
export const EDUCATIONAL_LEVEL_INFO = {
  [EducationalLevel.ELEMENTARY]: {
    displayName: 'Elementary School',
    description: 'Foundation learning with basic skills development',
    grades: ['K', '1', '2', '3', '4', '5'],
    ageRange: { min: 4, max: 11 },
    focusAreas: ['Basic literacy', 'Numeracy', 'Social skills', 'Creative expression']
  },
  [EducationalLevel.MIDDLE]: {
    displayName: 'Middle School',
    description: 'Transitional period with increased academic complexity',
    grades: ['6', '7', '8'],
    ageRange: { min: 10, max: 14 },
    focusAreas: ['Subject specialization', 'Critical thinking', 'Independence', 'Social development']
  },
  [EducationalLevel.HIGH]: {
    displayName: 'High School',
    description: 'Advanced academic preparation for college and career',
    grades: ['9', '10', '11', '12'],
    ageRange: { min: 13, max: 18 },
    focusAreas: ['Advanced academics', 'College preparation', 'Career exploration', 'Leadership']
  }
};