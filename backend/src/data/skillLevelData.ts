export interface SkillLevel {
  subjectId: string;
  subjectName: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  progress: number; // 0-100 percentage
  topicProgress: TopicSkillProgress[];
  lastAssessed: Date;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface TopicSkillProgress {
  topicId: string;
  topicName: string;
  mastery: number; // 0-100 percentage
  attemptsCount: number;
  averageScore: number;
  timeSpent: number; // in minutes
  lastActivity: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered';
}

export interface ChildSkillProfile {
  childId: string;
  gradeLevel: string;
  overallProgress: number; // 0-100 percentage
  skillLevels: SkillLevel[];
  learningVelocity: 'slow' | 'average' | 'fast';
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  lastUpdated: Date;
}

// Default skill levels for new children based on grade
export const getDefaultSkillLevels = (gradeLevel: string): SkillLevel[] => {
  const gradeNum = parseInt(gradeLevel);
  
  // Grade 1 default skills
  if (gradeNum === 1) {
    return [
      {
        subjectId: "math-1",
        subjectName: "Mathematics",
        currentLevel: "beginner",
        progress: 0,
        topicProgress: [
          {
            topicId: "counting-1-10",
            topicName: "Counting 1-10",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "basic-addition",
            topicName: "Basic Addition",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "basic-subtraction",
            topicName: "Basic Subtraction",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "shapes-recognition",
            topicName: "Shape Recognition",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: [],
        improvementAreas: ["counting", "basic-operations"]
      },
      {
        subjectId: "english-1",
        subjectName: "English",
        currentLevel: "beginner",
        progress: 0,
        topicProgress: [
          {
            topicId: "alphabet-recognition",
            topicName: "Alphabet Recognition",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "phonics-basics",
            topicName: "Basic Phonics",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "sight-words",
            topicName: "Sight Words",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: [],
        improvementAreas: ["letter-recognition", "reading"]
      },
      {
        subjectId: "science-1",
        subjectName: "Science",
        currentLevel: "beginner",
        progress: 0,
        topicProgress: [
          {
            topicId: "living-nonliving",
            topicName: "Living vs Non-living",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "animal-habitats",
            topicName: "Animal Habitats",
            mastery: 0,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: [],
        improvementAreas: ["observation", "classification"]
      }
    ];
  }
  
  // Grade 5 default skills
  if (gradeNum === 5) {
    return [
      {
        subjectId: "math-5",
        subjectName: "Mathematics",
        currentLevel: "intermediate",
        progress: 25,
        topicProgress: [
          {
            topicId: "fractions-decimals",
            topicName: "Fractions & Decimals",
            mastery: 20,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "multiplication-division",
            topicName: "Multiplication & Division",
            mastery: 30,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "geometry-basics",
            topicName: "Basic Geometry",
            mastery: 15,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["basic-arithmetic"],
        improvementAreas: ["fractions", "geometry"]
      },
      {
        subjectId: "english-5",
        subjectName: "English",
        currentLevel: "intermediate",
        progress: 35,
        topicProgress: [
          {
            topicId: "reading-comprehension",
            topicName: "Reading Comprehension",
            mastery: 40,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "in-progress"
          },
          {
            topicId: "creative-writing",
            topicName: "Creative Writing",
            mastery: 25,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["reading", "vocabulary"],
        improvementAreas: ["writing", "grammar"]
      },
      {
        subjectId: "science-5",
        subjectName: "Science",
        currentLevel: "intermediate",
        progress: 20,
        topicProgress: [
          {
            topicId: "human-body-systems",
            topicName: "Human Body Systems",
            mastery: 15,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "ecosystems",
            topicName: "Ecosystems",
            mastery: 25,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["observation"],
        improvementAreas: ["scientific-method", "analysis"]
      }
    ];
  }
  
  // Grade 8 default skills
  if (gradeNum === 8) {
    return [
      {
        subjectId: "math-8",
        subjectName: "Mathematics",
        currentLevel: "intermediate",
        progress: 45,
        topicProgress: [
          {
            topicId: "algebra-basics",
            topicName: "Basic Algebra",
            mastery: 35,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "in-progress"
          },
          {
            topicId: "linear-equations",
            topicName: "Linear Equations",
            mastery: 25,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "geometry-proofs",
            topicName: "Geometric Proofs",
            mastery: 10,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["arithmetic", "problem-solving"],
        improvementAreas: ["abstract-thinking", "proofs"]
      },
      {
        subjectId: "english-8",
        subjectName: "English",
        currentLevel: "intermediate",
        progress: 55,
        topicProgress: [
          {
            topicId: "literary-analysis",
            topicName: "Literary Analysis",
            mastery: 50,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "in-progress"
          },
          {
            topicId: "persuasive-writing",
            topicName: "Persuasive Writing",
            mastery: 40,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "in-progress"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["reading-comprehension", "vocabulary"],
        improvementAreas: ["critical-analysis", "essay-structure"]
      },
      {
        subjectId: "science-8",
        subjectName: "Science",
        currentLevel: "intermediate",
        progress: 40,
        topicProgress: [
          {
            topicId: "chemistry-basics",
            topicName: "Basic Chemistry",
            mastery: 30,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "not-started"
          },
          {
            topicId: "physics-motion",
            topicName: "Physics of Motion",
            mastery: 35,
            attemptsCount: 0,
            averageScore: 0,
            timeSpent: 0,
            lastActivity: new Date(),
            status: "in-progress"
          }
        ],
        lastAssessed: new Date(),
        strengthAreas: ["scientific-method", "observation"],
        improvementAreas: ["mathematical-applications", "abstract-concepts"]
      }
    ];
  }
  
  // Default fallback
  return [];
};

// Function to calculate overall skill level
export const calculateOverallLevel = (skillLevels: SkillLevel[]): 'beginner' | 'intermediate' | 'advanced' | 'mastery' => {
  if (skillLevels.length === 0) return 'beginner';
  
  const averageProgress = skillLevels.reduce((sum, skill) => sum + skill.progress, 0) / skillLevels.length;
  
  if (averageProgress >= 90) return 'mastery';
  if (averageProgress >= 70) return 'advanced';
  if (averageProgress >= 40) return 'intermediate';
  return 'beginner';
};

// Function to update skill progress based on activity completion
export const updateSkillProgress = (
  currentSkill: SkillLevel,
  topicId: string,
  score: number,
  timeSpent: number
): SkillLevel => {
  const updatedTopicProgress = currentSkill.topicProgress.map(topic => {
    if (topic.topicId === topicId) {
      const newAttemptsCount = topic.attemptsCount + 1;
      const newAverageScore = ((topic.averageScore * topic.attemptsCount) + score) / newAttemptsCount;
      const newTimeSpent = topic.timeSpent + timeSpent;
      
      // Calculate mastery based on score and consistency
      let newMastery = Math.min(100, topic.mastery + (score / 10));
      if (newAverageScore >= 80 && newAttemptsCount >= 3) {
        newMastery = Math.max(newMastery, 85);
      }
      
      // Determine status
      let status: TopicSkillProgress['status'] = 'in-progress';
      if (newMastery >= 90) status = 'mastered';
      else if (newMastery >= 70) status = 'completed';
      else if (newMastery > 0) status = 'in-progress';
      
      return {
        ...topic,
        mastery: newMastery,
        attemptsCount: newAttemptsCount,
        averageScore: newAverageScore,
        timeSpent: newTimeSpent,
        lastActivity: new Date(),
        status
      };
    }
    return topic;
  });
  
  // Calculate overall progress for the subject
  const totalMastery = updatedTopicProgress.reduce((sum, topic) => sum + topic.mastery, 0);
  const averageMastery = totalMastery / updatedTopicProgress.length;
  
  // Determine current level
  let currentLevel: SkillLevel['currentLevel'] = 'beginner';
  if (averageMastery >= 90) currentLevel = 'mastery';
  else if (averageMastery >= 70) currentLevel = 'advanced';
  else if (averageMastery >= 40) currentLevel = 'intermediate';
  
  return {
    ...currentSkill,
    currentLevel,
    progress: averageMastery,
    topicProgress: updatedTopicProgress,
    lastAssessed: new Date()
  };
};