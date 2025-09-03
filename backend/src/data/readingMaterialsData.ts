import { DifficultyLevel, SafetyRating } from '../types/masterData';

export interface ReadingMaterialSeedData {
  topicName: string;
  grade: string;
  subject: string;
  materials: {
    title: string;
    description: string;
    url: string;
    author?: string;
    publisher?: string;
    isbn?: string;
    readingLevel: string;
    wordCount?: number;
    language: string;
    format: 'pdf' | 'html' | 'epub' | 'external';
    thumbnailUrl?: string;
    tags: string[];
    estimatedReadingTime: number; // in minutes
    difficulty: DifficultyLevel;
    ageAppropriate: boolean;
    safetyRating: SafetyRating;
    educationalValue: number; // 0-1 score
  }[];
}

export const readingMaterialsSeedData: ReadingMaterialSeedData[] = [
  {
    topicName: 'counting-1-10',
    grade: 'K',
    subject: 'mathematics',
    materials: [
      {
        title: 'Counting Fun: Numbers 1-10',
        description: 'Interactive counting book with colorful illustrations to help children learn numbers 1 through 10.',
        url: 'https://www.education.com/worksheet/article/counting-1-10/',
        author: 'Education.com Team',
        publisher: 'Education.com',
        readingLevel: 'kindergarten',
        wordCount: 150,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://cdn.education.com/worksheet-image/counting-1-10.jpg',
        tags: ['counting', 'numbers', 'kindergarten', 'interactive', 'colorful'],
        estimatedReadingTime: 5,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.9
      },
      {
        title: 'My First Numbers Workbook',
        description: 'Printable workbook with counting exercises and number recognition activities for young learners.',
        url: 'https://www.scholastic.com/content/dam/teachers/lesson-plans/migrated-files-in-body/numbers_1-10_workbook.pdf',
        author: 'Scholastic Teaching Team',
        publisher: 'Scholastic',
        readingLevel: 'pre-k',
        wordCount: 200,
        language: 'en',
        format: 'pdf',
        tags: ['workbook', 'counting', 'exercises', 'printable', 'numbers'],
        estimatedReadingTime: 8,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.85
      }
    ]
  },
  {
    topicName: 'basic-addition',
    grade: '1',
    subject: 'mathematics',
    materials: [
      {
        title: 'Addition Adventures: A First Grade Guide',
        description: 'Comprehensive guide to basic addition with visual aids, practice problems, and fun activities.',
        url: 'https://www.khanacademy.org/math/arithmetic/arith-decimals/basic-addition/a/addition-intro',
        author: 'Khan Academy',
        publisher: 'Khan Academy',
        readingLevel: 'grade-1',
        wordCount: 400,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://cdn.kastatic.org/images/addition-intro.png',
        tags: ['addition', 'math', 'grade1', 'visual', 'practice'],
        estimatedReadingTime: 10,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.92
      },
      {
        title: 'Math Facts: Addition Within 10',
        description: 'Interactive worksheet collection focusing on addition facts within 10, perfect for first grade students.',
        url: 'https://www.readworks.org/article/Math-Facts-Addition-Within-10',
        author: 'ReadWorks Team',
        publisher: 'ReadWorks',
        readingLevel: 'grade-1',
        wordCount: 300,
        language: 'en',
        format: 'html',
        tags: ['math-facts', 'addition', 'worksheet', 'grade1', 'practice'],
        estimatedReadingTime: 7,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.88
      }
    ]
  },
  {
    topicName: 'alphabet-recognition',
    grade: 'K',
    subject: 'english',
    materials: [
      {
        title: 'The Complete Alphabet Book',
        description: 'Comprehensive alphabet book with letter recognition, phonics, and writing practice for each letter.',
        url: 'https://www.starfall.com/h/abcs/',
        author: 'Starfall Education',
        publisher: 'Starfall',
        readingLevel: 'kindergarten',
        wordCount: 500,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.starfall.com/images/alphabet-book.jpg',
        tags: ['alphabet', 'phonics', 'letters', 'kindergarten', 'interactive'],
        estimatedReadingTime: 12,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.94
      },
      {
        title: 'Letter Recognition Worksheets A-Z',
        description: 'Printable worksheets for each letter of the alphabet with tracing, identification, and sound activities.',
        url: 'https://www.education.com/worksheets/alphabet/',
        author: 'Education.com Team',
        publisher: 'Education.com',
        readingLevel: 'pre-k',
        wordCount: 100,
        language: 'en',
        format: 'pdf',
        tags: ['worksheets', 'alphabet', 'tracing', 'printable', 'recognition'],
        estimatedReadingTime: 15,
        difficulty: DifficultyLevel.BEGINNER,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.87
      }
    ]
  },
  {
    topicName: 'fractions-introduction',
    grade: '3',
    subject: 'mathematics',
    materials: [
      {
        title: 'Understanding Fractions: A Visual Guide',
        description: 'Comprehensive introduction to fractions using visual models, real-world examples, and step-by-step explanations.',
        url: 'https://www.mathisfun.com/definitions/fraction.html',
        author: 'Math is Fun Team',
        publisher: 'Math is Fun',
        readingLevel: 'grade-3',
        wordCount: 800,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.mathisfun.com/images/fraction-pizza.svg',
        tags: ['fractions', 'visual', 'grade3', 'math', 'introduction'],
        estimatedReadingTime: 15,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.91
      },
      {
        title: 'Fractions Workbook for Grade 3',
        description: 'Practice workbook with fraction problems, visual exercises, and real-world applications for third grade students.',
        url: 'https://www.commoncore.org/maps/math/content/3/nf',
        author: 'Common Core Team',
        publisher: 'Common Core State Standards',
        readingLevel: 'grade-3',
        wordCount: 600,
        language: 'en',
        format: 'pdf',
        tags: ['workbook', 'fractions', 'practice', 'grade3', 'common-core'],
        estimatedReadingTime: 20,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.89
      }
    ]
  },
  {
    topicName: 'decimal-place-value',
    grade: '4',
    subject: 'mathematics',
    materials: [
      {
        title: 'Decimal Place Value Explained',
        description: 'Clear explanation of decimal place value with examples, practice problems, and visual representations.',
        url: 'https://www.khanacademy.org/math/arithmetic/arith-decimals/decimal-place-value/a/decimal-place-value-intro',
        author: 'Khan Academy',
        publisher: 'Khan Academy',
        readingLevel: 'grade-4',
        wordCount: 700,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://cdn.kastatic.org/images/decimal-place-value.png',
        tags: ['decimals', 'place-value', 'grade4', 'math', 'visual'],
        estimatedReadingTime: 12,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.93
      }
    ]
  },
  {
    topicName: 'human-body-systems',
    grade: '5',
    subject: 'science',
    materials: [
      {
        title: 'The Human Body: Systems and Functions',
        description: 'Comprehensive guide to human body systems including circulatory, respiratory, digestive, and nervous systems.',
        url: 'https://www.nationalgeographic.org/encyclopedia/human-body/',
        author: 'National Geographic Society',
        publisher: 'National Geographic',
        readingLevel: 'grade-5',
        wordCount: 1200,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.nationalgeographic.org/images/human-body-systems.jpg',
        tags: ['human-body', 'systems', 'science', 'grade5', 'biology'],
        estimatedReadingTime: 18,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.95
      },
      {
        title: 'Body Systems Interactive Guide',
        description: 'Interactive exploration of human body systems with diagrams, quizzes, and detailed explanations.',
        url: 'https://www.britannica.com/science/human-body',
        author: 'Britannica Educational',
        publisher: 'Britannica',
        readingLevel: 'grade-5',
        wordCount: 1000,
        language: 'en',
        format: 'html',
        tags: ['interactive', 'body-systems', 'diagrams', 'science', 'educational'],
        estimatedReadingTime: 16,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.92
      }
    ]
  },
  {
    topicName: 'basic-algebra',
    grade: '6',
    subject: 'mathematics',
    materials: [
      {
        title: 'Introduction to Algebra: Variables and Expressions',
        description: 'Beginner-friendly introduction to algebraic concepts including variables, expressions, and basic equations.',
        url: 'https://www.purplemath.com/modules/variable.htm',
        author: 'Elizabeth Stapel',
        publisher: 'Purplemath',
        readingLevel: 'grade-6',
        wordCount: 900,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.purplemath.com/images/algebra-intro.gif',
        tags: ['algebra', 'variables', 'expressions', 'grade6', 'introduction'],
        estimatedReadingTime: 14,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.91
      }
    ]
  },
  {
    topicName: 'periodic-table',
    grade: '7',
    subject: 'science',
    materials: [
      {
        title: 'The Periodic Table: A Complete Guide',
        description: 'Comprehensive guide to the periodic table including element properties, organization, and chemical families.',
        url: 'https://www.rsc.org/periodic-table',
        author: 'Royal Society of Chemistry',
        publisher: 'Royal Society of Chemistry',
        readingLevel: 'grade-7',
        wordCount: 1500,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.rsc.org/images/periodic-table-guide.jpg',
        tags: ['periodic-table', 'chemistry', 'elements', 'grade7', 'science'],
        estimatedReadingTime: 22,
        difficulty: DifficultyLevel.INTERMEDIATE,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.94
      }
    ]
  },
  {
    topicName: 'world-war-ii',
    grade: '8',
    subject: 'social-studies',
    materials: [
      {
        title: 'World War II: Causes, Events, and Consequences',
        description: 'Comprehensive overview of World War II including causes, major battles, key figures, and lasting impact.',
        url: 'https://www.britannica.com/event/World-War-II',
        author: 'Britannica Editors',
        publisher: 'Britannica',
        readingLevel: 'grade-8',
        wordCount: 2000,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.britannica.com/images/wwii-overview.jpg',
        tags: ['world-war-ii', 'history', 'grade8', 'social-studies', 'comprehensive'],
        estimatedReadingTime: 25,
        difficulty: DifficultyLevel.ADVANCED,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.93
      }
    ]
  },
  {
    topicName: 'geometry-basics',
    grade: '9',
    subject: 'mathematics',
    materials: [
      {
        title: 'Geometry Fundamentals: Points, Lines, and Angles',
        description: 'Introduction to basic geometry concepts including points, lines, angles, and geometric shapes.',
        url: 'https://www.mathplanet.com/education/geometry',
        author: 'Mathplanet Team',
        publisher: 'Mathplanet',
        readingLevel: 'grade-9',
        wordCount: 1800,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.mathplanet.com/images/geometry-basics.png',
        tags: ['geometry', 'high-school', 'math', 'fundamentals', 'shapes'],
        estimatedReadingTime: 20,
        difficulty: DifficultyLevel.ADVANCED,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.90
      }
    ]
  },
  {
    topicName: 'cell-biology',
    grade: '10',
    subject: 'science',
    materials: [
      {
        title: 'Cell Structure and Function: A Detailed Study',
        description: 'In-depth exploration of cell biology including organelles, cellular processes, and cell types.',
        url: 'https://www.nature.com/scitable/topicpage/cell-structure-function-14023971/',
        author: 'Nature Education',
        publisher: 'Nature',
        readingLevel: 'grade-10',
        wordCount: 2500,
        language: 'en',
        format: 'html',
        thumbnailUrl: 'https://www.nature.com/images/cell-biology.jpg',
        tags: ['cell-biology', 'organelles', 'biology', 'grade10', 'detailed'],
        estimatedReadingTime: 30,
        difficulty: DifficultyLevel.ADVANCED,
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.96
      }
    ]
  }
];

export const getReadingMaterialsByTopic = (topicName: string, grade: string, subject: string) => {
  return readingMaterialsSeedData.find(
    data => data.topicName === topicName && data.grade === grade && data.subject === subject
  )?.materials || [];
};

export const getAllReadingMaterials = () => {
  return readingMaterialsSeedData.flatMap(data => 
    data.materials.map(material => ({
      ...material,
      topicName: data.topicName,
      grade: data.grade,
      subject: data.subject
    }))
  );
};