import { SubjectCategory } from '@prisma/client';

export interface SubjectDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string; // Material-UI icon name
  color: string; // Hex color code
  category: SubjectCategory;
  isCore: boolean;
  sortOrder: number;
  gradeAvailability: string[]; // Grades where this subject is available
  estimatedHoursPerGrade: Record<string, number>; // Hours per grade level
  prerequisites: string[]; // Subject prerequisites
  difficultyProgression: Record<string, 'beginner' | 'intermediate' | 'advanced'>; // Difficulty by grade
}

/**
 * Comprehensive subject catalog with standardized definitions
 * Organized by category with consistent naming, icons, and color schemes
 */
export const SUBJECT_DEFINITIONS: SubjectDefinition[] = [
  // CORE ACADEMIC SUBJECTS
  {
    id: 'mathematics',
    name: 'mathematics',
    displayName: 'Mathematics',
    description: 'Number sense, arithmetic, algebra, geometry, and mathematical reasoning',
    icon: 'calculate',
    color: '#2196F3', // Blue
    category: SubjectCategory.CORE_ACADEMIC,
    isCore: true,
    sortOrder: 1,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 60, '1': 80, '2': 90, '3': 100, '4': 110, '5': 120,
      '6': 130, '7': 140, '8': 150, '9': 160, '10': 170, '11': 180, '12': 180
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'intermediate',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'advanced', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'english-language-arts',
    name: 'english-language-arts',
    displayName: 'English Language Arts',
    description: 'Reading, writing, speaking, listening, and language skills',
    icon: 'menu_book',
    color: '#4CAF50', // Green
    category: SubjectCategory.LANGUAGE_ARTS,
    isCore: true,
    sortOrder: 2,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 80, '1': 100, '2': 110, '3': 120, '4': 130, '5': 140,
      '6': 150, '7': 160, '8': 170, '9': 180, '10': 180, '11': 180, '12': 180
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'intermediate', '5': 'intermediate',
      '6': 'intermediate', '7': 'intermediate', '8': 'advanced', '9': 'advanced', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'science',
    name: 'science',
    displayName: 'Science',
    description: 'Physical science, life science, earth science, and scientific inquiry',
    icon: 'science',
    color: '#FF9800', // Orange
    category: SubjectCategory.STEM,
    isCore: true,
    sortOrder: 3,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 40, '1': 50, '2': 60, '3': 70, '4': 80, '5': 90,
      '6': 100, '7': 110, '8': 120, '9': 140, '10': 150, '11': 160, '12': 170
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'intermediate',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'advanced', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'social-studies',
    name: 'social-studies',
    displayName: 'Social Studies',
    description: 'History, geography, civics, economics, and cultural studies',
    icon: 'public',
    color: '#9C27B0', // Purple
    category: SubjectCategory.SOCIAL_STUDIES,
    isCore: true,
    sortOrder: 4,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 30, '1': 40, '2': 50, '3': 60, '4': 70, '5': 80,
      '6': 90, '7': 100, '8': 110, '9': 120, '10': 130, '11': 140, '12': 150
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'intermediate',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'advanced', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },

  // SPECIALIZED STEM SUBJECTS (High School)
  {
    id: 'biology',
    name: 'biology',
    displayName: 'Biology',
    description: 'Study of living organisms, cells, genetics, and ecosystems',
    icon: 'biotech',
    color: '#8BC34A', // Light Green
    category: SubjectCategory.STEM,
    isCore: false,
    sortOrder: 10,
    gradeAvailability: ['9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '9': 140, '10': 150, '11': 160, '12': 170
    },
    prerequisites: ['science'],
    difficultyProgression: {
      '9': 'intermediate', '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'chemistry',
    name: 'chemistry',
    displayName: 'Chemistry',
    description: 'Study of matter, chemical reactions, and molecular interactions',
    icon: 'science',
    color: '#00BCD4', // Cyan
    category: SubjectCategory.STEM,
    isCore: false,
    sortOrder: 11,
    gradeAvailability: ['10', '11', '12'],
    estimatedHoursPerGrade: {
      '10': 150, '11': 160, '12': 170
    },
    prerequisites: ['science', 'mathematics'],
    difficultyProgression: {
      '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'physics',
    name: 'physics',
    displayName: 'Physics',
    description: 'Study of matter, energy, motion, and fundamental forces',
    icon: 'psychology',
    color: '#3F51B5', // Indigo
    category: SubjectCategory.STEM,
    isCore: false,
    sortOrder: 12,
    gradeAvailability: ['11', '12'],
    estimatedHoursPerGrade: {
      '11': 160, '12': 170
    },
    prerequisites: ['science', 'mathematics'],
    difficultyProgression: {
      '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'computer-science',
    name: 'computer-science',
    displayName: 'Computer Science',
    description: 'Programming, algorithms, data structures, and computational thinking',
    icon: 'computer',
    color: '#607D8B', // Blue Grey
    category: SubjectCategory.STEM,
    isCore: false,
    sortOrder: 13,
    gradeAvailability: ['6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '6': 60, '7': 70, '8': 80, '9': 120, '10': 140, '11': 160, '12': 180
    },
    prerequisites: ['mathematics'],
    difficultyProgression: {
      '6': 'beginner', '7': 'beginner', '8': 'intermediate', '9': 'intermediate', '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },

  // LANGUAGE ARTS SPECIALIZATIONS
  {
    id: 'literature',
    name: 'literature',
    displayName: 'Literature',
    description: 'Analysis of literary works, poetry, drama, and creative writing',
    icon: 'auto_stories',
    color: '#795548', // Brown
    category: SubjectCategory.LANGUAGE_ARTS,
    isCore: false,
    sortOrder: 20,
    gradeAvailability: ['9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '9': 120, '10': 130, '11': 140, '12': 150
    },
    prerequisites: ['english-language-arts'],
    difficultyProgression: {
      '9': 'intermediate', '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'world-languages',
    name: 'world-languages',
    displayName: 'World Languages',
    description: 'Foreign language acquisition, culture, and communication',
    icon: 'translate',
    color: '#E91E63', // Pink
    category: SubjectCategory.LANGUAGE_ARTS,
    isCore: false,
    sortOrder: 21,
    gradeAvailability: ['6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '6': 80, '7': 90, '8': 100, '9': 120, '10': 130, '11': 140, '12': 150
    },
    prerequisites: ['english-language-arts'],
    difficultyProgression: {
      '6': 'beginner', '7': 'beginner', '8': 'beginner', '9': 'intermediate', '10': 'intermediate', '11': 'intermediate', '12': 'advanced'
    }
  },

  // ARTS SUBJECTS
  {
    id: 'visual-arts',
    name: 'visual-arts',
    displayName: 'Visual Arts',
    description: 'Drawing, painting, sculpture, and visual design',
    icon: 'palette',
    color: '#F44336', // Red
    category: SubjectCategory.ARTS,
    isCore: false,
    sortOrder: 30,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 40, '1': 40, '2': 40, '3': 50, '4': 50, '5': 60,
      '6': 70, '7': 80, '8': 90, '9': 100, '10': 110, '11': 120, '12': 130
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'beginner',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'intermediate', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'music',
    name: 'music',
    displayName: 'Music',
    description: 'Music theory, performance, composition, and appreciation',
    icon: 'music_note',
    color: '#9C27B0', // Purple
    category: SubjectCategory.ARTS,
    isCore: false,
    sortOrder: 31,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 30, '1': 30, '2': 40, '3': 40, '4': 50, '5': 50,
      '6': 60, '7': 70, '8': 80, '9': 90, '10': 100, '11': 110, '12': 120
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'beginner',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'intermediate', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'drama-theater',
    name: 'drama-theater',
    displayName: 'Drama & Theater',
    description: 'Acting, stagecraft, dramatic literature, and performance',
    icon: 'theater_comedy',
    color: '#673AB7', // Deep Purple
    category: SubjectCategory.ARTS,
    isCore: false,
    sortOrder: 32,
    gradeAvailability: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '3': 30, '4': 40, '5': 50, '6': 60, '7': 70, '8': 80,
      '9': 90, '10': 100, '11': 110, '12': 120
    },
    prerequisites: [],
    difficultyProgression: {
      '3': 'beginner', '4': 'beginner', '5': 'beginner', '6': 'beginner', '7': 'intermediate', '8': 'intermediate',
      '9': 'intermediate', '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },

  // PHYSICAL EDUCATION & HEALTH
  {
    id: 'physical-education',
    name: 'physical-education',
    displayName: 'Physical Education',
    description: 'Physical fitness, sports, movement, and health education',
    icon: 'sports',
    color: '#FF5722', // Deep Orange
    category: SubjectCategory.PHYSICAL_EDUCATION,
    isCore: true,
    sortOrder: 40,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 60, '1': 60, '2': 60, '3': 70, '4': 70, '5': 80,
      '6': 90, '7': 90, '8': 100, '9': 100, '10': 100, '11': 100, '12': 100
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'beginner',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'intermediate', '10': 'intermediate', '11': 'advanced', '12': 'advanced'
    }
  },
  {
    id: 'health',
    name: 'health',
    displayName: 'Health Education',
    description: 'Personal health, nutrition, safety, and wellness',
    icon: 'health_and_safety',
    color: '#4CAF50', // Green
    category: SubjectCategory.LIFE_SKILLS,
    isCore: true,
    sortOrder: 41,
    gradeAvailability: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      'K': 20, '1': 20, '2': 30, '3': 30, '4': 40, '5': 40,
      '6': 50, '7': 60, '8': 70, '9': 80, '10': 80, '11': 80, '12': 80
    },
    prerequisites: [],
    difficultyProgression: {
      'K': 'beginner', '1': 'beginner', '2': 'beginner', '3': 'beginner', '4': 'beginner', '5': 'beginner',
      '6': 'intermediate', '7': 'intermediate', '8': 'intermediate', '9': 'intermediate', '10': 'advanced', '11': 'advanced', '12': 'advanced'
    }
  },

  // LIFE SKILLS & ELECTIVES
  {
    id: 'career-technical-education',
    name: 'career-technical-education',
    displayName: 'Career & Technical Education',
    description: 'Vocational skills, career preparation, and technical training',
    icon: 'work',
    color: '#795548', // Brown
    category: SubjectCategory.ELECTIVE,
    isCore: false,
    sortOrder: 50,
    gradeAvailability: ['9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '9': 120, '10': 140, '11': 160, '12': 180
    },
    prerequisites: [],
    difficultyProgression: {
      '9': 'beginner', '10': 'intermediate', '11': 'intermediate', '12': 'advanced'
    }
  },
  {
    id: 'life-skills',
    name: 'life-skills',
    displayName: 'Life Skills',
    description: 'Personal finance, cooking, time management, and independent living',
    icon: 'home',
    color: '#607D8B', // Blue Grey
    category: SubjectCategory.LIFE_SKILLS,
    isCore: false,
    sortOrder: 51,
    gradeAvailability: ['6', '7', '8', '9', '10', '11', '12'],
    estimatedHoursPerGrade: {
      '6': 40, '7': 50, '8': 60, '9': 80, '10': 90, '11': 100, '12': 110
    },
    prerequisites: [],
    difficultyProgression: {
      '6': 'beginner', '7': 'beginner', '8': 'beginner', '9': 'intermediate', '10': 'intermediate', '11': 'intermediate', '12': 'advanced'
    }
  }
];

/**
 * Subject categories with metadata
 */
export const SUBJECT_CATEGORY_INFO = {
  [SubjectCategory.CORE_ACADEMIC]: {
    displayName: 'Core Academic',
    description: 'Essential academic subjects required for all students',
    color: '#1976D2',
    icon: 'school',
    priority: 1
  },
  [SubjectCategory.STEM]: {
    displayName: 'STEM',
    description: 'Science, Technology, Engineering, and Mathematics',
    color: '#388E3C',
    icon: 'science',
    priority: 2
  },
  [SubjectCategory.LANGUAGE_ARTS]: {
    displayName: 'Language Arts',
    description: 'Communication, literature, and language studies',
    color: '#7B1FA2',
    icon: 'menu_book',
    priority: 3
  },
  [SubjectCategory.SOCIAL_STUDIES]: {
    displayName: 'Social Studies',
    description: 'History, geography, civics, and cultural studies',
    color: '#F57C00',
    icon: 'public',
    priority: 4
  },
  [SubjectCategory.ARTS]: {
    displayName: 'Arts',
    description: 'Visual arts, music, drama, and creative expression',
    color: '#C2185B',
    icon: 'palette',
    priority: 5
  },
  [SubjectCategory.PHYSICAL_EDUCATION]: {
    displayName: 'Physical Education',
    description: 'Physical fitness, sports, and movement education',
    color: '#D32F2F',
    icon: 'sports',
    priority: 6
  },
  [SubjectCategory.LIFE_SKILLS]: {
    displayName: 'Life Skills',
    description: 'Practical skills for daily living and personal development',
    color: '#455A64',
    icon: 'psychology',
    priority: 7
  },
  [SubjectCategory.ELECTIVE]: {
    displayName: 'Electives',
    description: 'Optional subjects for specialized interests and career preparation',
    color: '#5D4037',
    icon: 'explore',
    priority: 8
  }
};

/**
 * Subject hierarchy definitions
 */
export const SUBJECT_HIERARCHY = {
  core: ['mathematics', 'english-language-arts', 'science', 'social-studies', 'physical-education', 'health'],
  stem: ['mathematics', 'science', 'biology', 'chemistry', 'physics', 'computer-science'],
  languageArts: ['english-language-arts', 'literature', 'world-languages'],
  socialStudies: ['social-studies'],
  arts: ['visual-arts', 'music', 'drama-theater'],
  physicalEducation: ['physical-education', 'health'],
  lifeSkills: ['life-skills', 'career-technical-education'],
  electives: ['career-technical-education', 'life-skills']
};

/**
 * Grade-specific subject requirements
 */
export const GRADE_SUBJECT_REQUIREMENTS = {
  elementary: {
    required: ['mathematics', 'english-language-arts', 'science', 'social-studies', 'physical-education', 'health'],
    recommended: ['visual-arts', 'music'],
    optional: []
  },
  middle: {
    required: ['mathematics', 'english-language-arts', 'science', 'social-studies', 'physical-education', 'health'],
    recommended: ['visual-arts', 'music', 'computer-science'],
    optional: ['world-languages', 'drama-theater', 'life-skills']
  },
  high: {
    required: ['mathematics', 'english-language-arts', 'science', 'social-studies', 'physical-education', 'health'],
    recommended: ['biology', 'chemistry', 'physics', 'literature', 'world-languages'],
    optional: ['computer-science', 'visual-arts', 'music', 'drama-theater', 'career-technical-education', 'life-skills']
  }
};