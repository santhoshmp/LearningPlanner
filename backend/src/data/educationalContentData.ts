export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in minutes for videos, estimated reading time for articles
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ageRange: {
    min: number;
    max: number;
  };
  tags: string[];
  source: string;
  safetyRating: 'safe' | 'review_needed';
}

export interface TopicContent {
  topicId: string;
  articles: EducationalContent[];
  videos: EducationalContent[];
}

export interface SubjectContent {
  subjectId: string;
  topics: TopicContent[];
}

export interface GradeContent {
  grade: string;
  subjects: SubjectContent[];
}

// Educational content organized by grade, subject, and topic
export const EDUCATIONAL_CONTENT_DATA: GradeContent[] = [
  {
    grade: "1",
    subjects: [
      {
        subjectId: "math-1",
        topics: [
          {
            topicId: "counting-1-10",
            articles: [
              {
                id: "counting-basics-article-1",
                title: "Learning to Count: A Fun Journey from 1 to 10",
                description: "Interactive guide to help children learn counting with colorful examples and activities.",
                type: "article",
                url: "https://example.com/counting-basics",
                thumbnailUrl: "https://example.com/thumbnails/counting.jpg",
                duration: 5,
                difficulty: "beginner",
                ageRange: { min: 5, max: 7 },
                tags: ["counting", "numbers", "basic-math"],
                source: "Educational Kids",
                safetyRating: "safe"
              },
              {
                id: "number-recognition-article-1",
                title: "Number Recognition Made Easy",
                description: "Visual guide to help children recognize and write numbers 1-10.",
                type: "article",
                url: "https://example.com/number-recognition",
                thumbnailUrl: "https://example.com/thumbnails/numbers.jpg",
                duration: 4,
                difficulty: "beginner",
                ageRange: { min: 5, max: 7 },
                tags: ["numbers", "recognition", "writing"],
                source: "Math for Kids",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "counting-song-video-1",
                title: "Count to 10 Song | Fun Counting Video for Kids",
                description: "Catchy song to help children learn counting from 1 to 10 with animated characters.",
                type: "video",
                url: "https://www.youtube.com/watch?v=D0Ajq682yrA", // Real Super Simple Songs video
                thumbnailUrl: "https://img.youtube.com/vi/D0Ajq682yrA/maxresdefault.jpg",
                duration: 3,
                difficulty: "beginner",
                ageRange: { min: 4, max: 8 },
                tags: ["counting", "song", "animation"],
                source: "Super Simple Songs",
                safetyRating: "safe"
              },
              {
                id: "finger-counting-video-1",
                title: "Finger Counting for Beginners",
                description: "Learn to count using your fingers with this interactive video lesson.",
                type: "video",
                url: "https://youtube.com/watch?v=fingercounting",
                thumbnailUrl: "https://img.youtube.com/vi/fingercounting/maxresdefault.jpg",
                duration: 4,
                difficulty: "beginner",
                ageRange: { min: 5, max: 7 },
                tags: ["counting", "fingers", "hands-on"],
                source: "Math Made Fun",
                safetyRating: "safe"
              }
            ]
          },
          {
            topicId: "basic-addition",
            articles: [
              {
                id: "addition-basics-article-1",
                title: "Your First Steps in Addition",
                description: "Simple introduction to addition using pictures and everyday objects.",
                type: "article",
                url: "https://example.com/addition-basics",
                thumbnailUrl: "https://example.com/thumbnails/addition.jpg",
                duration: 6,
                difficulty: "beginner",
                ageRange: { min: 6, max: 8 },
                tags: ["addition", "basic-math", "visual-learning"],
                source: "Elementary Math Hub",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "addition-with-toys-video-1",
                title: "Addition with Toys | Learn Math with Fun",
                description: "Learn addition by counting toys and objects in this engaging video.",
                type: "video",
                url: "https://youtube.com/watch?v=additiontoys",
                thumbnailUrl: "https://img.youtube.com/vi/additiontoys/maxresdefault.jpg",
                duration: 5,
                difficulty: "beginner",
                ageRange: { min: 5, max: 8 },
                tags: ["addition", "toys", "visual-learning"],
                source: "Fun Math Channel",
                safetyRating: "safe"
              }
            ]
          }
        ]
      },
      {
        subjectId: "english-1",
        topics: [
          {
            topicId: "alphabet-recognition",
            articles: [
              {
                id: "alphabet-guide-article-1",
                title: "The Complete Alphabet Guide for Young Learners",
                description: "Comprehensive guide to learning all 26 letters with pictures and examples.",
                type: "article",
                url: "https://example.com/alphabet-guide",
                thumbnailUrl: "https://example.com/thumbnails/alphabet.jpg",
                duration: 8,
                difficulty: "beginner",
                ageRange: { min: 4, max: 7 },
                tags: ["alphabet", "letters", "reading"],
                source: "Reading First Steps",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "abc-song-video-1",
                title: "ABC Song | Learn the Alphabet",
                description: "Classic ABC song with colorful animations to help children learn letters.",
                type: "video",
                url: "https://youtube.com/watch?v=abcsong123",
                thumbnailUrl: "https://img.youtube.com/vi/abcsong123/maxresdefault.jpg",
                duration: 3,
                difficulty: "beginner",
                ageRange: { min: 3, max: 7 },
                tags: ["alphabet", "song", "letters"],
                source: "Alphabet Kids TV",
                safetyRating: "safe"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    grade: "5",
    subjects: [
      {
        subjectId: "math-5",
        topics: [
          {
            topicId: "fractions-decimals",
            articles: [
              {
                id: "fractions-explained-article-5",
                title: "Understanding Fractions: From Pizza Slices to Math Success",
                description: "Learn fractions through real-world examples and visual representations.",
                type: "article",
                url: "https://example.com/fractions-explained",
                thumbnailUrl: "https://example.com/thumbnails/fractions.jpg",
                duration: 12,
                difficulty: "intermediate",
                ageRange: { min: 9, max: 12 },
                tags: ["fractions", "decimals", "visual-math"],
                source: "Math Concepts Today",
                safetyRating: "safe"
              },
              {
                id: "decimals-guide-article-5",
                title: "Decimal Numbers Made Simple",
                description: "Step-by-step guide to understanding decimal places and operations.",
                type: "article",
                url: "https://example.com/decimals-guide",
                thumbnailUrl: "https://example.com/thumbnails/decimals.jpg",
                duration: 10,
                difficulty: "intermediate",
                ageRange: { min: 9, max: 12 },
                tags: ["decimals", "place-value", "math-operations"],
                source: "Elementary Math Pro",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "fractions-pizza-video-5",
                title: "Fractions with Pizza | Math is Delicious!",
                description: "Learn about fractions by dividing pizzas and understanding parts of a whole.",
                type: "video",
                url: "https://youtube.com/watch?v=fractionspizza",
                thumbnailUrl: "https://img.youtube.com/vi/fractionspizza/maxresdefault.jpg",
                duration: 8,
                difficulty: "intermediate",
                ageRange: { min: 8, max: 12 },
                tags: ["fractions", "pizza", "visual-learning"],
                source: "Math Kitchen",
                safetyRating: "safe"
              },
              {
                id: "decimal-place-value-video-5",
                title: "Decimal Place Value Explained",
                description: "Understanding tenths, hundredths, and thousandths with clear examples.",
                type: "video",
                url: "https://youtube.com/watch?v=decimalplace",
                thumbnailUrl: "https://img.youtube.com/vi/decimalplace/maxresdefault.jpg",
                duration: 7,
                difficulty: "intermediate",
                ageRange: { min: 9, max: 12 },
                tags: ["decimals", "place-value", "math-concepts"],
                source: "Number Sense Academy",
                safetyRating: "safe"
              }
            ]
          }
        ]
      },
      {
        subjectId: "science-5",
        topics: [
          {
            topicId: "human-body-systems",
            articles: [
              {
                id: "body-systems-overview-article-5",
                title: "Amazing Human Body Systems",
                description: "Explore how different body systems work together to keep us healthy.",
                type: "article",
                url: "https://example.com/body-systems",
                thumbnailUrl: "https://example.com/thumbnails/body-systems.jpg",
                duration: 15,
                difficulty: "intermediate",
                ageRange: { min: 9, max: 13 },
                tags: ["human-body", "systems", "health"],
                source: "Science Explorers",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "circulatory-system-video-5",
                title: "The Circulatory System | How Blood Flows",
                description: "Journey through the circulatory system and learn how blood travels through your body.",
                type: "video",
                url: "https://youtube.com/watch?v=circulatory",
                thumbnailUrl: "https://img.youtube.com/vi/circulatory/maxresdefault.jpg",
                duration: 10,
                difficulty: "intermediate",
                ageRange: { min: 8, max: 13 },
                tags: ["circulatory-system", "blood", "heart"],
                source: "Body Science TV",
                safetyRating: "safe"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    grade: "8",
    subjects: [
      {
        subjectId: "math-8",
        topics: [
          {
            topicId: "algebra-basics",
            articles: [
              {
                id: "algebra-introduction-article-8",
                title: "Introduction to Algebra: Variables and Expressions",
                description: "Learn the fundamentals of algebra with clear explanations and examples.",
                type: "article",
                url: "https://example.com/algebra-intro",
                thumbnailUrl: "https://example.com/thumbnails/algebra.jpg",
                duration: 18,
                difficulty: "intermediate",
                ageRange: { min: 12, max: 16 },
                tags: ["algebra", "variables", "expressions"],
                source: "Advanced Math Academy",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "algebra-variables-video-8",
                title: "What are Variables in Algebra?",
                description: "Understanding variables and how they represent unknown values in mathematical expressions.",
                type: "video",
                url: "https://youtube.com/watch?v=algebravariables",
                thumbnailUrl: "https://img.youtube.com/vi/algebravariables/maxresdefault.jpg",
                duration: 12,
                difficulty: "intermediate",
                ageRange: { min: 11, max: 16 },
                tags: ["algebra", "variables", "math-concepts"],
                source: "Algebra Mastery",
                safetyRating: "safe"
              }
            ]
          }
        ]
      },
      {
        subjectId: "science-8",
        topics: [
          {
            topicId: "chemistry-basics",
            articles: [
              {
                id: "atoms-molecules-article-8",
                title: "Atoms and Molecules: The Building Blocks of Matter",
                description: "Discover the fundamental particles that make up everything around us.",
                type: "article",
                url: "https://example.com/atoms-molecules",
                thumbnailUrl: "https://example.com/thumbnails/atoms.jpg",
                duration: 20,
                difficulty: "intermediate",
                ageRange: { min: 12, max: 16 },
                tags: ["chemistry", "atoms", "molecules"],
                source: "Chemistry Central",
                safetyRating: "safe"
              }
            ],
            videos: [
              {
                id: "periodic-table-video-8",
                title: "The Periodic Table Explained",
                description: "Learn about the periodic table and how elements are organized.",
                type: "video",
                url: "https://youtube.com/watch?v=periodictable",
                thumbnailUrl: "https://img.youtube.com/vi/periodictable/maxresdefault.jpg",
                duration: 15,
                difficulty: "intermediate",
                ageRange: { min: 11, max: 16 },
                tags: ["chemistry", "periodic-table", "elements"],
                source: "Science Simplified",
                safetyRating: "safe"
              }
            ]
          }
        ]
      }
    ]
  }
];

// Helper functions to retrieve content
export const getContentByTopic = (grade: string, subjectId: string, topicId: string): TopicContent | null => {
  const gradeContent = EDUCATIONAL_CONTENT_DATA.find(g => g.grade === grade);
  if (!gradeContent) return null;
  
  const subjectContent = gradeContent.subjects.find(s => s.subjectId === subjectId);
  if (!subjectContent) return null;
  
  const topicContent = subjectContent.topics.find(t => t.topicId === topicId);
  return topicContent || null;
};

export const getAllContentForGrade = (grade: string): GradeContent | null => {
  return EDUCATIONAL_CONTENT_DATA.find(g => g.grade === grade) || null;
};

export const getContentByType = (grade: string, subjectId: string, topicId: string, type: 'article' | 'video'): EducationalContent[] => {
  const topicContent = getContentByTopic(grade, subjectId, topicId);
  if (!topicContent) return [];
  
  return type === 'article' ? topicContent.articles : topicContent.videos;
};