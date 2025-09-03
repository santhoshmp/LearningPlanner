import { DifficultyLevel, SafetyRating } from '../types/masterData';

export interface YouTubeResourceSeedData {
  topicName: string;
  grade: string;
  subject: string;
  videos: {
    videoId: string;
    title: string;
    description: string;
    channelName: string;
    duration: number; // in minutes
    difficulty: DifficultyLevel;
    tags: string[];
    ageAppropriate: boolean;
    safetyRating: SafetyRating;
    educationalValue: number; // 0-1 score
  }[];
}

export const youtubeResourceSeedData: YouTubeResourceSeedData[] = [
  {
    topicName: 'counting-1-10',
    grade: 'K',
    subject: 'mathematics',
    videos: [
      {
        videoId: 'D0Ajq682yrA',
        title: 'Count to 10 Song | Super Simple Songs',
        description: 'A fun and catchy song to help children learn counting from 1 to 10 with animated characters and engaging visuals.',
        channelName: 'Super Simple Songs - Kids Songs',
        duration: 3,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['counting', 'numbers', 'kindergarten', 'song', 'animation'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.9
      },
      {
        videoId: 'bGetqbqDVaA',
        title: 'Counting 1 to 10 for Kids | Learn Numbers',
        description: 'Learn to count from 1 to 10 with colorful objects and clear pronunciation. Perfect for preschool and kindergarten children.',
        channelName: 'Kids Learning Tube',
        duration: 4,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['counting', 'numbers', 'preschool', 'learning', 'objects'],
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
    videos: [
      {
        videoId: 'StqXbKhsKjI',
        title: 'Addition for Kids | Math for Grade 1',
        description: 'Learn basic addition with visual aids and simple examples. Great introduction to adding numbers for first grade students.',
        channelName: 'Math & Learning Videos 4 Kids',
        duration: 6,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['addition', 'math', 'grade1', 'elementary', 'visual'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.88
      },
      {
        videoId: 'dFzAU3u06Ps',
        title: 'Adding with Toys | Fun Addition for Kids',
        description: 'Learn addition by counting toys and objects in this engaging video. Makes math fun and relatable for young learners.',
        channelName: 'Educational Kids TV',
        duration: 5,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['addition', 'toys', 'counting', 'fun', 'interactive'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.82
      }
    ]
  },
  {
    topicName: 'alphabet-recognition',
    grade: 'K',
    subject: 'english',
    videos: [
      {
        videoId: 'BELlZKpi1Zs',
        title: 'ABC Song | Alphabet Song for Children',
        description: 'Classic ABC song with colorful animations to help children learn letters. Features clear pronunciation and engaging visuals.',
        channelName: 'Cocomelon - Nursery Rhymes',
        duration: 3,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['alphabet', 'abc', 'song', 'letters', 'kindergarten'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.9
      },
      {
        videoId: 'hq3yfQnllfQ',
        title: 'Learn the Alphabet with Animals',
        description: 'Learn each letter of the alphabet with corresponding animal names and sounds. Educational and entertaining for young children.',
        channelName: 'ABCmouse.com Early Learning Academy',
        duration: 4,
        difficulty: DifficultyLevel.BEGINNER,
        tags: ['alphabet', 'animals', 'phonics', 'learning', 'preschool'],
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
    videos: [
      {
        videoId: 'uK2VBYz9wEc',
        title: 'Introduction to Fractions | Math for Kids',
        description: 'Learn about fractions by dividing pizzas and understanding parts of a whole. Clear explanations with visual examples.',
        channelName: 'Khan Academy Kids',
        duration: 8,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['fractions', 'math', 'grade3', 'parts', 'whole'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.92
      },
      {
        videoId: 'M3Jv1uJNZVs',
        title: 'Fractions Explained Simply',
        description: 'Simple explanation of what fractions are and how they work. Uses everyday examples to make fractions easy to understand.',
        channelName: 'Math Antics',
        duration: 7,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['fractions', 'explanation', 'simple', 'examples', 'understanding'],
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
    videos: [
      {
        videoId: 'dcckN6iy7lM',
        title: 'Decimal Place Value | 4th Grade Math',
        description: 'Understanding tenths, hundredths, and thousandths with clear examples and visual representations.',
        channelName: 'Math with Mr. J',
        duration: 7,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['decimals', 'place-value', 'grade4', 'tenths', 'hundredths'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.91
      }
    ]
  },
  {
    topicName: 'human-body-systems',
    grade: '5',
    subject: 'science',
    videos: [
      {
        videoId: 'X_GkFaJ2HS0',
        title: 'Human Body Systems | Educational Video',
        description: 'Journey through the circulatory system and learn how blood travels through your body. Includes heart, blood vessels, and circulation.',
        channelName: 'National Geographic Kids',
        duration: 10,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['human-body', 'circulatory', 'science', 'grade5', 'systems'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.94
      },
      {
        videoId: 'Imvg5vgn8Cs',
        title: 'Digestive System for Kids',
        description: 'Learn how your digestive system works to break down food and provide energy for your body.',
        channelName: 'Crash Course Kids',
        duration: 8,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['digestive-system', 'science', 'kids', 'body', 'nutrition'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.88
      }
    ]
  },
  {
    topicName: 'basic-algebra',
    grade: '6',
    subject: 'mathematics',
    videos: [
      {
        videoId: 'NybHckSEQBI',
        title: 'Introduction to Algebra | Variables and Expressions',
        description: 'Understanding variables and how they represent unknown values in mathematical expressions. Perfect introduction to algebra concepts.',
        channelName: 'Khan Academy',
        duration: 12,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['algebra', 'variables', 'expressions', 'grade6', 'math'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.93
      }
    ]
  },
  {
    topicName: 'periodic-table',
    grade: '7',
    subject: 'science',
    videos: [
      {
        videoId: 'rz4Dd1I_fX0',
        title: 'The Periodic Table Explained',
        description: 'Learn about the periodic table and how elements are organized by their properties and atomic structure.',
        channelName: 'TED-Ed',
        duration: 15,
        difficulty: DifficultyLevel.INTERMEDIATE,
        tags: ['periodic-table', 'elements', 'chemistry', 'science', 'grade7'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.95
      }
    ]
  },
  {
    topicName: 'world-war-ii',
    grade: '8',
    subject: 'social-studies',
    videos: [
      {
        videoId: 'Q78COTwT7nE',
        title: 'World War II Overview for Students',
        description: 'Comprehensive overview of World War II causes, major events, and consequences. Age-appropriate content for middle school students.',
        channelName: 'Crash Course World History',
        duration: 18,
        difficulty: DifficultyLevel.ADVANCED,
        tags: ['world-war-ii', 'history', 'grade8', 'social-studies', 'overview'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.92
      }
    ]
  },
  {
    topicName: 'geometry-basics',
    grade: '9',
    subject: 'mathematics',
    videos: [
      {
        videoId: 'XjQDfVGWKzg',
        title: 'Introduction to Geometry | High School Math',
        description: 'Basic geometry concepts including points, lines, angles, and shapes. Foundation for high school geometry course.',
        channelName: 'Professor Leonard',
        duration: 20,
        difficulty: DifficultyLevel.ADVANCED,
        tags: ['geometry', 'high-school', 'math', 'shapes', 'angles'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.89
      }
    ]
  },
  {
    topicName: 'cell-biology',
    grade: '10',
    subject: 'science',
    videos: [
      {
        videoId: 'URUJD5NEXC8',
        title: 'Cell Structure and Function | Biology',
        description: 'Detailed exploration of cell structure and function, including organelles and their roles in cellular processes.',
        channelName: 'Amoeba Sisters',
        duration: 16,
        difficulty: DifficultyLevel.ADVANCED,
        tags: ['cell-biology', 'organelles', 'biology', 'grade10', 'science'],
        ageAppropriate: true,
        safetyRating: SafetyRating.SAFE,
        educationalValue: 0.94
      }
    ]
  }
];

export const getYouTubeResourcesByTopic = (topicName: string, grade: string, subject: string) => {
  return youtubeResourceSeedData.find(
    data => data.topicName === topicName && data.grade === grade && data.subject === subject
  )?.videos || [];
};

export const getAllYouTubeResources = () => {
  return youtubeResourceSeedData.flatMap(data => 
    data.videos.map(video => ({
      ...video,
      topicName: data.topicName,
      grade: data.grade,
      subject: data.subject
    }))
  );
};