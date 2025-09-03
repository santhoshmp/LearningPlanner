// Topic-specific activities that match curriculum topics

export interface TopicActivity {
  title: string;
  description: string;
  type: 'interactive' | 'quiz' | 'text' | 'video';
  estimatedDuration: number;
  relatedTopics: string[];
}

export interface SubjectActivities {
  [topicId: string]: TopicActivity[];
}

export interface TopicSpecificActivities {
  [subject: string]: SubjectActivities;
}

export const TOPIC_SPECIFIC_ACTIVITIES: TopicSpecificActivities = {
  "MATHEMATICS": {
    "counting-1-10": [
      {
        title: "Counting 1-10 Practice",
        description: "Interactive counting exercises for counting 1-10",
        type: "interactive",
        estimatedDuration: 15,
        relatedTopics: ["counting-1-10"]
      },
      {
        title: "Counting 1-10 Quiz",
        description: "Test your knowledge of counting 1-10",
        type: "quiz",
        estimatedDuration: 10,
        relatedTopics: ["counting-1-10"]
      }
    ],
    "basic-addition": [
      {
        title: "Basic Addition Problems",
        description: "Solve basic addition problems with visual aids",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["basic-addition"]
      },
      {
        title: "Basic Addition Word Problems",
        description: "Apply basic addition to real-world scenarios",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["basic-addition"]
      }
    ],
    "basic-subtraction": [
      {
        title: "Basic Subtraction Problems",
        description: "Solve basic subtraction problems with visual aids",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["basic-subtraction"]
      },
      {
        title: "Basic Subtraction Word Problems",
        description: "Apply basic subtraction to real-world scenarios",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["basic-subtraction"]
      }
    ],
    "shapes-recognition": [
      {
        title: "Shape Recognition Game",
        description: "Identify and work with shape recognition",
        type: "interactive",
        estimatedDuration: 15,
        relatedTopics: ["shapes-recognition"]
      },
      {
        title: "Shape Recognition Drawing",
        description: "Draw and create shape recognition",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["shapes-recognition"]
      }
    ],
    "fractions-decimals": [
      {
        title: "Fractions & Decimals Visual Learning",
        description: "Understand fractions & decimals with visual representations",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["fractions-decimals"]
      },
      {
        title: "Fractions & Decimals Practice Problems",
        description: "Solve fractions & decimals problems step by step",
        type: "quiz",
        estimatedDuration: 20,
        relatedTopics: ["fractions-decimals"]
      }
    ],
    "multiplication-division": [
      {
        title: "Multiplication & Division Problems",
        description: "Solve multiplication & division problems with visual aids",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["multiplication-division"]
      },
      {
        title: "Multiplication & Division Word Problems",
        description: "Apply multiplication & division to real-world scenarios",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["multiplication-division"]
      }
    ],
    "geometry-basics": [
      {
        title: "Basic Geometry Game",
        description: "Identify and work with basic geometry",
        type: "interactive",
        estimatedDuration: 15,
        relatedTopics: ["geometry-basics"]
      },
      {
        title: "Basic Geometry Drawing",
        description: "Draw and create basic geometry",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["geometry-basics"]
      }
    ],
    "algebra-basics": [
      {
        title: "Basic Algebra Introduction",
        description: "Learn the basics of basic algebra",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["algebra-basics"]
      },
      {
        title: "Basic Algebra Problem Solving",
        description: "Practice solving basic algebra problems",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["algebra-basics"]
      }
    ]
  },
  "ENGLISH": {
    "alphabet-recognition": [
      {
        title: "Alphabet Recognition Practice",
        description: "Interactive alphabet recognition learning activities",
        type: "interactive",
        estimatedDuration: 15,
        relatedTopics: ["alphabet-recognition"]
      },
      {
        title: "Alphabet Recognition Games",
        description: "Fun games to master alphabet recognition",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["alphabet-recognition"]
      }
    ],
    "phonics-basics": [
      {
        title: "Basic Phonics Practice",
        description: "Interactive basic phonics learning activities",
        type: "interactive",
        estimatedDuration: 15,
        relatedTopics: ["phonics-basics"]
      },
      {
        title: "Basic Phonics Games",
        description: "Fun games to master basic phonics",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["phonics-basics"]
      }
    ],
    "sight-words": [
      {
        title: "Sight Words Study",
        description: "Comprehensive study of sight words",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["sight-words"]
      },
      {
        title: "Sight Words Practice",
        description: "Practice exercises for sight words",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["sight-words"]
      }
    ],
    "reading-comprehension": [
      {
        title: "Reading Comprehension Exercises",
        description: "Read passages and answer questions about reading comprehension",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["reading-comprehension"]
      },
      {
        title: "Reading Comprehension Discussion",
        description: "Discuss and analyze texts for reading comprehension",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["reading-comprehension"]
      }
    ],
    "creative-writing": [
      {
        title: "Creative Writing Workshop",
        description: "Practice creative writing with guided exercises",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["creative-writing"]
      },
      {
        title: "Creative Writing Projects",
        description: "Create original works using creative writing",
        type: "text",
        estimatedDuration: 35,
        relatedTopics: ["creative-writing"]
      }
    ],
    "grammar-advanced": [
      {
        title: "Advanced Grammar Lessons",
        description: "Learn and practice advanced grammar",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["grammar-advanced"]
      },
      {
        title: "Advanced Grammar Quiz",
        description: "Test your knowledge of advanced grammar",
        type: "quiz",
        estimatedDuration: 15,
        relatedTopics: ["grammar-advanced"]
      }
    ]
  },
  "SCIENCE": {
    "living-nonliving": [
      {
        title: "Living vs Non-living Observation",
        description: "Observe and study living vs non-living things",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["living-nonliving"]
      },
      {
        title: "Living vs Non-living Classification",
        description: "Classify and categorize living vs non-living things",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["living-nonliving"]
      }
    ],
    "animal-habitats": [
      {
        title: "Animal Habitats Exploration",
        description: "Explore where different animals live and why",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["animal-habitats"]
      },
      {
        title: "Animal Habitats Matching Game",
        description: "Match animals to their correct habitats",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["animal-habitats"]
      }
    ],
    "weather-basics": [
      {
        title: "Weather Observation Journal",
        description: "Record daily weather patterns and changes",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["weather-basics"]
      },
      {
        title: "Weather Types Quiz",
        description: "Identify different types of weather conditions",
        type: "quiz",
        estimatedDuration: 15,
        relatedTopics: ["weather-basics"]
      }
    ],
    "plant-parts": [
      {
        title: "Plant Parts Identification",
        description: "Learn to identify roots, stems, leaves, and flowers",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["plant-parts"]
      },
      {
        title: "Plant Parts Functions Study",
        description: "Understand what each part of a plant does",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["plant-parts"]
      }
    ],
    "human-body-systems": [
      {
        title: "Body Systems Interactive Model",
        description: "Explore digestive, respiratory, and circulatory systems",
        type: "interactive",
        estimatedDuration: 30,
        relatedTopics: ["human-body-systems"]
      },
      {
        title: "Body Systems Health Connection",
        description: "Learn how body systems work together for health",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["human-body-systems"]
      }
    ],
    "ecosystems": [
      {
        title: "Ecosystem Food Chains",
        description: "Build and understand food chains in different ecosystems",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["ecosystems"]
      },
      {
        title: "Ecosystem Balance Study",
        description: "Learn how organisms depend on each other",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["ecosystems"]
      }
    ],
    "matter-states": [
      {
        title: "States of Matter Experiments",
        description: "Observe solids, liquids, and gases through experiments",
        type: "interactive",
        estimatedDuration: 30,
        relatedTopics: ["matter-states"]
      },
      {
        title: "Matter Changes Investigation",
        description: "Study how matter changes from one state to another",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["matter-states"]
      }
    ],
    "simple-machines": [
      {
        title: "Simple Machines Workshop",
        description: "Build and test levers, pulleys, and inclined planes",
        type: "interactive",
        estimatedDuration: 35,
        relatedTopics: ["simple-machines"]
      },
      {
        title: "Mechanical Advantage Study",
        description: "Learn how simple machines make work easier",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["simple-machines"]
      }
    ],
    "earth-science": [
      {
        title: "Rock and Mineral Identification",
        description: "Learn to identify different rocks and minerals",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["earth-science"]
      },
      {
        title: "Geological Processes Study",
        description: "Understand how Earth's surface changes over time",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["earth-science"]
      }
    ],
    "chemistry-basics": [
      {
        title: "Safe Chemistry Experiments",
        description: "Conduct safe experiments with atoms and molecules",
        type: "interactive",
        estimatedDuration: 30,
        relatedTopics: ["chemistry-basics"]
      },
      {
        title: "Chemical Reactions Study",
        description: "Learn about different types of chemical reactions",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["chemistry-basics"]
      }
    ],
    "physics-motion": [
      {
        title: "Force and Motion Experiments",
        description: "Explore how forces affect motion and acceleration",
        type: "interactive",
        estimatedDuration: 30,
        relatedTopics: ["physics-motion"]
      },
      {
        title: "Energy Types Investigation",
        description: "Study kinetic and potential energy in everyday objects",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["physics-motion"]
      }
    ],
    "cell-biology": [
      {
        title: "Cell Structure Exploration",
        description: "Use microscopes to observe cell parts and functions",
        type: "interactive",
        estimatedDuration: 30,
        relatedTopics: ["cell-biology"]
      },
      {
        title: "Cell Functions Study",
        description: "Learn how different cell parts work together",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["cell-biology"]
      }
    ],
    "genetics-intro": [
      {
        title: "Heredity Patterns Investigation",
        description: "Study how traits are passed from parents to offspring",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["genetics-intro"]
      },
      {
        title: "DNA Basics Study",
        description: "Learn about DNA structure and function",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["genetics-intro"]
      }
    ],
    "environmental-science": [
      {
        title: "Environmental Impact Assessment",
        description: "Study human impact on different environments",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["environmental-science"]
      },
      {
        title: "Conservation Solutions Project",
        description: "Design solutions for environmental challenges",
        type: "interactive",
        estimatedDuration: 35,
        relatedTopics: ["environmental-science"]
      }
    ]
  },
  "HISTORY": {
    "ancient-civilizations": [
      {
        title: "Ancient Civilizations Timeline",
        description: "Create and study timelines for ancient civilizations",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["ancient-civilizations"]
      },
      {
        title: "Ancient Civilizations Research",
        description: "Research key figures and events in ancient civilizations",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["ancient-civilizations"]
      },
      {
        title: "Ancient Civilizations Analysis",
        description: "Analyze causes and effects in ancient civilizations",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["ancient-civilizations"]
      }
    ],
    "american-revolution": [
      {
        title: "American Revolution Timeline",
        description: "Create and study timelines for american revolution",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["american-revolution"]
      },
      {
        title: "American Revolution Research",
        description: "Research key figures and events in american revolution",
        type: "text",
        estimatedDuration: 30,
        relatedTopics: ["american-revolution"]
      },
      {
        title: "American Revolution Analysis",
        description: "Analyze causes and effects in american revolution",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["american-revolution"]
      }
    ]
  },
  "GEOGRAPHY": {
    "my-neighborhood": [
      {
        title: "My Neighborhood Exploration",
        description: "Explore and learn about my neighborhood",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["my-neighborhood"]
      },
      {
        title: "My Neighborhood Mapping",
        description: "Create maps and diagrams for my neighborhood",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["my-neighborhood"]
      }
    ],
    "maps-directions": [
      {
        title: "Maps & Directions Practice",
        description: "Practice maps & directions with interactive maps",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["maps-directions"]
      },
      {
        title: "Maps & Directions Navigation",
        description: "Learn navigation skills using maps & directions",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["maps-directions"]
      }
    ],
    "climate-zones": [
      {
        title: "Climate Zones Study",
        description: "Study patterns and effects of climate zones",
        type: "text",
        estimatedDuration: 25,
        relatedTopics: ["climate-zones"]
      },
      {
        title: "Climate Zones Tracking",
        description: "Track and analyze climate zones data",
        type: "interactive",
        estimatedDuration: 20,
        relatedTopics: ["climate-zones"]
      }
    ],
    "world-continents": [
      {
        title: "World Continents Exploration",
        description: "Explore and learn about world continents",
        type: "interactive",
        estimatedDuration: 25,
        relatedTopics: ["world-continents"]
      },
      {
        title: "World Continents Mapping",
        description: "Create maps and diagrams for world continents",
        type: "text",
        estimatedDuration: 20,
        relatedTopics: ["world-continents"]
      }
    ]
  }
};

export const getActivitiesForTopic = (subject: string, topicId: string): TopicActivity[] => {
  const subjectKey = subject.toUpperCase();
  return TOPIC_SPECIFIC_ACTIVITIES[subjectKey]?.[topicId] || [];
};

export const getActivitiesForTopics = (subject: string, topicIds: string[]): TopicActivity[] => {
  const subjectKey = subject.toUpperCase();
  const activities: TopicActivity[] = [];
  
  topicIds.forEach(topicId => {
    const topicActivities = TOPIC_SPECIFIC_ACTIVITIES[subjectKey]?.[topicId] || [];
    activities.push(...topicActivities);
  });
  
  return activities;
};