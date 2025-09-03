import { DifficultyLevel } from '@prisma/client';

export interface TopicDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  gradeId: string;
  subjectId: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  prerequisites: string[]; // Topic IDs that must be completed first
  learningObjectives: string[];
  skills: string[];
  assessmentCriteria: string[];
  sortOrder: number;
  isActive: boolean;
}

/**
 * Comprehensive topic definitions organized by grade and subject
 * Each topic includes prerequisites, learning objectives, skills, and assessment criteria
 */

// KINDERGARTEN TOPICS
export const KINDERGARTEN_TOPICS: TopicDefinition[] = [
  // Mathematics - Kindergarten
  {
    id: 'k-math-counting-1-10',
    name: 'counting-1-10',
    displayName: 'Counting 1-10',
    description: 'Learn to count from 1 to 10 with understanding of number sequence',
    gradeId: 'K',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 3,
    prerequisites: [],
    learningObjectives: [
      'Count from 1 to 10 in sequence',
      'Recognize written numbers 1-10',
      'Match quantities to numbers 1-10'
    ],
    skills: ['Number recognition', 'Counting', 'One-to-one correspondence'],
    assessmentCriteria: [
      'Can count aloud from 1 to 10',
      'Can identify written numbers 1-10',
      'Can count objects up to 10'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'k-math-number-recognition',
    name: 'number-recognition',
    displayName: 'Number Recognition',
    description: 'Identify and write numbers 0-10',
    gradeId: 'K',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 4,
    prerequisites: ['k-math-counting-1-10'],
    learningObjectives: [
      'Recognize numbers 0-10 in different contexts',
      'Write numbers 0-10 correctly',
      'Understand that numbers represent quantities'
    ],
    skills: ['Number identification', 'Number writing', 'Visual recognition'],
    assessmentCriteria: [
      'Can identify numbers 0-10 when shown randomly',
      'Can write numbers 0-10 legibly',
      'Can match numbers to corresponding quantities'
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'k-math-basic-shapes',
    name: 'basic-shapes',
    displayName: 'Basic Shapes',
    description: 'Identify and describe basic geometric shapes',
    gradeId: 'K',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 3,
    prerequisites: [],
    learningObjectives: [
      'Identify circles, squares, triangles, and rectangles',
      'Describe basic properties of shapes',
      'Find shapes in the environment'
    ],
    skills: ['Shape recognition', 'Spatial awareness', 'Observation'],
    assessmentCriteria: [
      'Can name basic shapes when shown',
      'Can describe shape characteristics',
      'Can find shapes in real-world objects'
    ],
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'k-math-simple-addition',
    name: 'simple-addition',
    displayName: 'Simple Addition',
    description: 'Add numbers within 5 using objects and pictures',
    gradeId: 'K',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 4,
    prerequisites: ['k-math-counting-1-10', 'k-math-number-recognition'],
    learningObjectives: [
      'Add two numbers that sum to 5 or less',
      'Use objects to solve addition problems',
      'Understand addition as combining groups'
    ],
    skills: ['Addition', 'Problem solving', 'Mathematical reasoning'],
    assessmentCriteria: [
      'Can solve addition problems within 5',
      'Can use manipulatives to show addition',
      'Can explain addition process'
    ],
    sortOrder: 4,
    isActive: true
  },

  // English Language Arts - Kindergarten
  {
    id: 'k-ela-letter-recognition',
    name: 'letter-recognition',
    displayName: 'Letter Recognition',
    description: 'Identify uppercase and lowercase letters of the alphabet',
    gradeId: 'K',
    subjectId: 'english-language-arts',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 6,
    prerequisites: [],
    learningObjectives: [
      'Recognize all 26 uppercase letters',
      'Recognize all 26 lowercase letters',
      'Match uppercase and lowercase letter pairs'
    ],
    skills: ['Letter identification', 'Visual discrimination', 'Alphabet knowledge'],
    assessmentCriteria: [
      'Can identify 24/26 uppercase letters',
      'Can identify 24/26 lowercase letters',
      'Can match uppercase to lowercase letters'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'k-ela-phonics-sounds',
    name: 'phonics-sounds',
    displayName: 'Letter Sounds',
    description: 'Learn the sounds that letters make',
    gradeId: 'K',
    subjectId: 'english-language-arts',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 8,
    prerequisites: ['k-ela-letter-recognition'],
    learningObjectives: [
      'Produce sounds for consonants and short vowels',
      'Blend sounds to form simple words',
      'Identify beginning sounds in words'
    ],
    skills: ['Phonemic awareness', 'Sound-letter correspondence', 'Blending'],
    assessmentCriteria: [
      'Can produce sounds for 20/26 letters',
      'Can identify beginning sounds in words',
      'Can blend simple CVC words'
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'k-ela-sight-words',
    name: 'sight-words',
    displayName: 'Sight Words',
    description: 'Recognize common high-frequency words',
    gradeId: 'K',
    subjectId: 'english-language-arts',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 5,
    prerequisites: ['k-ela-letter-recognition'],
    learningObjectives: [
      'Recognize 25 high-frequency sight words',
      'Read sight words automatically',
      'Use sight words in simple sentences'
    ],
    skills: ['Word recognition', 'Reading fluency', 'Vocabulary'],
    assessmentCriteria: [
      'Can read 20/25 kindergarten sight words',
      'Can use sight words in context',
      'Can write 10 sight words from memory'
    ],
    sortOrder: 3,
    isActive: true
  },

  // Science - Kindergarten
  {
    id: 'k-science-living-nonliving',
    name: 'living-nonliving',
    displayName: 'Living vs Non-living',
    description: 'Distinguish between living and non-living things',
    gradeId: 'K',
    subjectId: 'science',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 3,
    prerequisites: [],
    learningObjectives: [
      'Identify characteristics of living things',
      'Classify objects as living or non-living',
      'Understand basic needs of living things'
    ],
    skills: ['Classification', 'Observation', 'Scientific thinking'],
    assessmentCriteria: [
      'Can list 3 characteristics of living things',
      'Can correctly classify 8/10 items',
      'Can explain why something is living or non-living'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'k-science-five-senses',
    name: 'five-senses',
    displayName: 'Five Senses',
    description: 'Explore the five senses and how we use them',
    gradeId: 'K',
    subjectId: 'science',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 4,
    prerequisites: [],
    learningObjectives: [
      'Name the five senses',
      'Identify body parts associated with each sense',
      'Use senses to explore the environment'
    ],
    skills: ['Sensory awareness', 'Observation', 'Investigation'],
    assessmentCriteria: [
      'Can name all five senses',
      'Can identify sense organs',
      'Can describe objects using multiple senses'
    ],
    sortOrder: 2,
    isActive: true
  }
];

// GRADE 1 TOPICS
export const GRADE_1_TOPICS: TopicDefinition[] = [
  // Mathematics - Grade 1
  {
    id: '1-math-counting-to-100',
    name: 'counting-to-100',
    displayName: 'Counting to 100',
    description: 'Count to 100 by ones and tens',
    gradeId: '1',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 4,
    prerequisites: [],
    learningObjectives: [
      'Count to 100 by ones',
      'Count to 100 by tens',
      'Understand place value concepts'
    ],
    skills: ['Counting', 'Number patterns', 'Place value'],
    assessmentCriteria: [
      'Can count to 100 by ones',
      'Can count to 100 by tens',
      'Can identify missing numbers in sequence'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: '1-math-addition-within-20',
    name: 'addition-within-20',
    displayName: 'Addition within 20',
    description: 'Add numbers with sums up to 20',
    gradeId: '1',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 6,
    prerequisites: ['1-math-counting-to-100'],
    learningObjectives: [
      'Add single-digit numbers',
      'Use strategies like counting on',
      'Solve word problems involving addition'
    ],
    skills: ['Addition', 'Problem solving', 'Mental math'],
    assessmentCriteria: [
      'Can solve addition facts within 20',
      'Can use multiple strategies for addition',
      'Can solve simple word problems'
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    id: '1-math-subtraction-within-20',
    name: 'subtraction-within-20',
    displayName: 'Subtraction within 20',
    description: 'Subtract numbers within 20',
    gradeId: '1',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.BEGINNER,
    estimatedHours: 6,
    prerequisites: ['1-math-addition-within-20'],
    learningObjectives: [
      'Subtract single-digit numbers',
      'Understand relationship between addition and subtraction',
      'Solve word problems involving subtraction'
    ],
    skills: ['Subtraction', 'Problem solving', 'Mathematical reasoning'],
    assessmentCriteria: [
      'Can solve subtraction facts within 20',
      'Can explain relationship to addition',
      'Can solve simple word problems'
    ],
    sortOrder: 3,
    isActive: true
  }
];

// GRADE 5 TOPICS (Sample for intermediate level)
export const GRADE_5_TOPICS: TopicDefinition[] = [
  // Mathematics - Grade 5
  {
    id: '5-math-fractions-basics',
    name: 'fractions-basics',
    displayName: 'Understanding Fractions',
    description: 'Understand fractions as parts of a whole and parts of a set',
    gradeId: '5',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedHours: 8,
    prerequisites: [],
    learningObjectives: [
      'Understand fractions as equal parts of a whole',
      'Compare and order fractions',
      'Add and subtract fractions with like denominators'
    ],
    skills: ['Fraction concepts', 'Comparison', 'Fraction operations'],
    assessmentCriteria: [
      'Can identify and create equivalent fractions',
      'Can compare fractions using models',
      'Can add/subtract fractions with like denominators'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: '5-math-decimals-basics',
    name: 'decimals-basics',
    displayName: 'Understanding Decimals',
    description: 'Understand decimal notation and place value',
    gradeId: '5',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedHours: 6,
    prerequisites: ['5-math-fractions-basics'],
    learningObjectives: [
      'Understand decimal place value',
      'Convert between fractions and decimals',
      'Compare and order decimals'
    ],
    skills: ['Decimal concepts', 'Place value', 'Number conversion'],
    assessmentCriteria: [
      'Can read and write decimals to hundredths',
      'Can convert simple fractions to decimals',
      'Can order decimals from least to greatest'
    ],
    sortOrder: 2,
    isActive: true
  },
  {
    id: '5-math-multiplication-multi-digit',
    name: 'multiplication-multi-digit',
    displayName: 'Multi-digit Multiplication',
    description: 'Multiply multi-digit numbers using various strategies',
    gradeId: '5',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.INTERMEDIATE,
    estimatedHours: 8,
    prerequisites: [],
    learningObjectives: [
      'Multiply multi-digit numbers',
      'Use area models and standard algorithm',
      'Estimate products'
    ],
    skills: ['Multiplication', 'Estimation', 'Problem solving'],
    assessmentCriteria: [
      'Can multiply 3-digit by 2-digit numbers',
      'Can use multiple strategies',
      'Can estimate to check reasonableness'
    ],
    sortOrder: 3,
    isActive: true
  }
];

// HIGH SCHOOL TOPICS (Sample for advanced level)
export const GRADE_9_TOPICS: TopicDefinition[] = [
  // Mathematics - Grade 9 (Algebra)
  {
    id: '9-math-linear-equations',
    name: 'linear-equations',
    displayName: 'Linear Equations',
    description: 'Solve and graph linear equations in one and two variables',
    gradeId: '9',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.ADVANCED,
    estimatedHours: 12,
    prerequisites: [],
    learningObjectives: [
      'Solve linear equations in one variable',
      'Graph linear equations in two variables',
      'Understand slope and y-intercept'
    ],
    skills: ['Algebraic manipulation', 'Graphing', 'Problem solving'],
    assessmentCriteria: [
      'Can solve multi-step linear equations',
      'Can graph linear equations accurately',
      'Can interpret slope and intercepts'
    ],
    sortOrder: 1,
    isActive: true
  },
  {
    id: '9-math-systems-equations',
    name: 'systems-equations',
    displayName: 'Systems of Equations',
    description: 'Solve systems of linear equations using multiple methods',
    gradeId: '9',
    subjectId: 'mathematics',
    difficulty: DifficultyLevel.ADVANCED,
    estimatedHours: 10,
    prerequisites: ['9-math-linear-equations'],
    learningObjectives: [
      'Solve systems by graphing',
      'Solve systems by substitution',
      'Solve systems by elimination'
    ],
    skills: ['Systems solving', 'Multiple methods', 'Verification'],
    assessmentCriteria: [
      'Can solve systems using all three methods',
      'Can choose appropriate method',
      'Can verify solutions'
    ],
    sortOrder: 2,
    isActive: true
  }
];

// Combine all topics
export const ALL_TOPICS: TopicDefinition[] = [
  ...KINDERGARTEN_TOPICS,
  ...GRADE_1_TOPICS,
  ...GRADE_5_TOPICS,
  ...GRADE_9_TOPICS
];

/**
 * Topic progression paths showing prerequisite relationships
 */
export const TOPIC_PROGRESSION_PATHS = {
  // Mathematics progression examples
  'k-math': [
    'k-math-counting-1-10',
    'k-math-number-recognition',
    'k-math-simple-addition'
  ],
  '1-math': [
    '1-math-counting-to-100',
    '1-math-addition-within-20',
    '1-math-subtraction-within-20'
  ],
  '5-math': [
    '5-math-fractions-basics',
    '5-math-decimals-basics',
    '5-math-multiplication-multi-digit'
  ],
  '9-math': [
    '9-math-linear-equations',
    '9-math-systems-equations'
  ],
  
  // English Language Arts progression examples
  'k-ela': [
    'k-ela-letter-recognition',
    'k-ela-phonics-sounds',
    'k-ela-sight-words'
  ]
};

/**
 * Skill mappings for topics
 */
export const TOPIC_SKILL_MAPPINGS = {
  'mathematical-thinking': [
    'k-math-counting-1-10',
    'k-math-number-recognition',
    '1-math-counting-to-100',
    '5-math-fractions-basics',
    '9-math-linear-equations'
  ],
  'problem-solving': [
    'k-math-simple-addition',
    '1-math-addition-within-20',
    '5-math-multiplication-multi-digit',
    '9-math-systems-equations'
  ],
  'reading-foundations': [
    'k-ela-letter-recognition',
    'k-ela-phonics-sounds',
    'k-ela-sight-words'
  ],
  'scientific-inquiry': [
    'k-science-living-nonliving',
    'k-science-five-senses'
  ]
};

/**
 * Assessment criteria templates by difficulty level
 */
export const ASSESSMENT_CRITERIA_TEMPLATES = {
  [DifficultyLevel.BEGINNER]: [
    'Can demonstrate basic understanding',
    'Can complete simple tasks with guidance',
    'Can identify key concepts'
  ],
  [DifficultyLevel.INTERMEDIATE]: [
    'Can apply concepts to new situations',
    'Can work independently on tasks',
    'Can explain reasoning'
  ],
  [DifficultyLevel.ADVANCED]: [
    'Can analyze complex problems',
    'Can synthesize multiple concepts',
    'Can evaluate and critique solutions'
  ]
};