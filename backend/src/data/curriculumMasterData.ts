export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: Topic[];
}

export interface GradeCurriculum {
  grade: string;
  subjects: Subject[];
}

export const CURRICULUM_MASTER_DATA: GradeCurriculum[] = [
  {
    grade: "1",
    subjects: [
      {
        id: "math-1",
        name: "Mathematics",
        icon: "calculate",
        color: "#2196F3",
        topics: [
          { id: "counting-1-10", name: "Counting 1-10", description: "Learn to count from 1 to 10", difficulty: "beginner", estimatedHours: 2 },
          { id: "basic-addition", name: "Basic Addition", description: "Simple addition with numbers 1-10", difficulty: "beginner", estimatedHours: 3 },
          { id: "basic-subtraction", name: "Basic Subtraction", description: "Simple subtraction with numbers 1-10", difficulty: "beginner", estimatedHours: 3 },
          { id: "shapes-recognition", name: "Shape Recognition", description: "Identify basic shapes", difficulty: "beginner", estimatedHours: 2 },
          { id: "number-patterns", name: "Number Patterns", description: "Recognize simple number patterns", difficulty: "intermediate", estimatedHours: 2 }
        ]
      },
      {
        id: "english-1",
        name: "English",
        icon: "book",
        color: "#4CAF50",
        topics: [
          { id: "alphabet-recognition", name: "Alphabet Recognition", description: "Learn to recognize all letters", difficulty: "beginner", estimatedHours: 4 },
          { id: "phonics-basics", name: "Basic Phonics", description: "Letter sounds and simple words", difficulty: "beginner", estimatedHours: 5 },
          { id: "sight-words", name: "Sight Words", description: "Common words recognition", difficulty: "beginner", estimatedHours: 3 },
          { id: "simple-sentences", name: "Simple Sentences", description: "Reading simple sentences", difficulty: "intermediate", estimatedHours: 4 }
        ]
      },
      {
        id: "science-1",
        name: "Science",
        icon: "science",
        color: "#FF9800",
        topics: [
          { id: "living-nonliving", name: "Living vs Non-living", description: "Distinguish between living and non-living things", difficulty: "beginner", estimatedHours: 2 },
          { id: "animal-habitats", name: "Animal Habitats", description: "Where different animals live", difficulty: "beginner", estimatedHours: 3 },
          { id: "weather-basics", name: "Weather Basics", description: "Different types of weather", difficulty: "beginner", estimatedHours: 2 },
          { id: "plant-parts", name: "Parts of a Plant", description: "Basic plant anatomy", difficulty: "beginner", estimatedHours: 2 }
        ]
      },
      {
        id: "geography-1",
        name: "Geography",
        icon: "public",
        color: "#607D8B",
        topics: [
          { id: "my-neighborhood", name: "My Neighborhood", description: "Learning about local community", difficulty: "beginner", estimatedHours: 2 },
          { id: "maps-directions", name: "Maps & Directions", description: "Basic map reading and directions", difficulty: "beginner", estimatedHours: 3 },
          { id: "land-water", name: "Land & Water", description: "Different types of land and water features", difficulty: "beginner", estimatedHours: 2 },
          { id: "weather-seasons", name: "Weather & Seasons", description: "Understanding seasons and weather patterns", difficulty: "beginner", estimatedHours: 2 }
        ]
      }
    ]
  },
  {
    grade: "5",
    subjects: [
      {
        id: "math-5",
        name: "Mathematics",
        icon: "calculate",
        color: "#2196F3",
        topics: [
          { id: "fractions-decimals", name: "Fractions & Decimals", description: "Understanding fractions and decimal numbers", difficulty: "intermediate", estimatedHours: 6 },
          { id: "multiplication-division", name: "Multiplication & Division", description: "Multi-digit multiplication and division", difficulty: "intermediate", estimatedHours: 8 },
          { id: "geometry-basics", name: "Basic Geometry", description: "Angles, triangles, and quadrilaterals", difficulty: "intermediate", estimatedHours: 5 },
          { id: "measurement-units", name: "Measurement & Units", description: "Length, weight, volume measurements", difficulty: "intermediate", estimatedHours: 4 },
          { id: "data-graphs", name: "Data & Graphs", description: "Reading and creating graphs", difficulty: "intermediate", estimatedHours: 3 }
        ]
      },
      {
        id: "english-5",
        name: "English",
        icon: "book",
        color: "#4CAF50",
        topics: [
          { id: "reading-comprehension", name: "Reading Comprehension", description: "Understanding and analyzing texts", difficulty: "intermediate", estimatedHours: 8 },
          { id: "creative-writing", name: "Creative Writing", description: "Story writing and creative expression", difficulty: "intermediate", estimatedHours: 6 },
          { id: "grammar-advanced", name: "Advanced Grammar", description: "Complex sentence structures", difficulty: "intermediate", estimatedHours: 5 },
          { id: "vocabulary-building", name: "Vocabulary Building", description: "Expanding word knowledge", difficulty: "intermediate", estimatedHours: 4 },
          { id: "poetry-analysis", name: "Poetry Analysis", description: "Understanding poems and literary devices", difficulty: "advanced", estimatedHours: 4 }
        ]
      },
      {
        id: "science-5",
        name: "Science",
        icon: "science",
        color: "#FF9800",
        topics: [
          { id: "human-body-systems", name: "Human Body Systems", description: "Digestive, respiratory, and circulatory systems", difficulty: "intermediate", estimatedHours: 6 },
          { id: "ecosystems", name: "Ecosystems", description: "Food chains and environmental relationships", difficulty: "intermediate", estimatedHours: 5 },
          { id: "matter-states", name: "States of Matter", description: "Solids, liquids, gases, and changes", difficulty: "intermediate", estimatedHours: 4 },
          { id: "simple-machines", name: "Simple Machines", description: "Levers, pulleys, and mechanical advantage", difficulty: "intermediate", estimatedHours: 5 },
          { id: "earth-science", name: "Earth Science", description: "Rocks, minerals, and geological processes", difficulty: "intermediate", estimatedHours: 4 }
        ]
      },
      {
        id: "history-5",
        name: "History",
        icon: "history_edu",
        color: "#9C27B0",
        topics: [
          { id: "ancient-civilizations", name: "Ancient Civilizations", description: "Egypt, Greece, and Rome", difficulty: "intermediate", estimatedHours: 6 },
          { id: "american-revolution", name: "American Revolution", description: "Causes and effects of independence", difficulty: "intermediate", estimatedHours: 5 },
          { id: "westward-expansion", name: "Westward Expansion", description: "Pioneer life and territorial growth", difficulty: "intermediate", estimatedHours: 4 },
          { id: "civil-war", name: "Civil War", description: "Causes, events, and consequences", difficulty: "advanced", estimatedHours: 5 }
        ]
      },
      {
        id: "geography-5",
        name: "Geography",
        icon: "public",
        color: "#607D8B",
        topics: [
          { id: "world-continents", name: "World Continents", description: "Learning about the seven continents", difficulty: "intermediate", estimatedHours: 4 },
          { id: "climate-zones", name: "Climate Zones", description: "Understanding different climate patterns", difficulty: "intermediate", estimatedHours: 5 },
          { id: "natural-resources", name: "Natural Resources", description: "Earth's resources and their uses", difficulty: "intermediate", estimatedHours: 4 },
          { id: "population-patterns", name: "Population Patterns", description: "How people are distributed around the world", difficulty: "intermediate", estimatedHours: 3 },
          { id: "landforms-features", name: "Landforms & Features", description: "Mountains, rivers, plains, and other features", difficulty: "intermediate", estimatedHours: 4 }
        ]
      }
    ]
  },
  {
    grade: "8",
    subjects: [
      {
        id: "math-8",
        name: "Mathematics",
        icon: "calculate",
        color: "#2196F3",
        topics: [
          { id: "algebra-basics", name: "Basic Algebra", description: "Variables, equations, and expressions", difficulty: "intermediate", estimatedHours: 10 },
          { id: "linear-equations", name: "Linear Equations", description: "Solving and graphing linear equations", difficulty: "intermediate", estimatedHours: 8 },
          { id: "geometry-proofs", name: "Geometric Proofs", description: "Logical reasoning in geometry", difficulty: "advanced", estimatedHours: 6 },
          { id: "statistics-probability", name: "Statistics & Probability", description: "Data analysis and probability concepts", difficulty: "intermediate", estimatedHours: 5 },
          { id: "pythagorean-theorem", name: "Pythagorean Theorem", description: "Right triangles and applications", difficulty: "intermediate", estimatedHours: 4 }
        ]
      },
      {
        id: "english-8",
        name: "English",
        icon: "book",
        color: "#4CAF50",
        topics: [
          { id: "literary-analysis", name: "Literary Analysis", description: "Analyzing themes, characters, and plot", difficulty: "advanced", estimatedHours: 8 },
          { id: "persuasive-writing", name: "Persuasive Writing", description: "Arguments and persuasive techniques", difficulty: "intermediate", estimatedHours: 6 },
          { id: "research-skills", name: "Research Skills", description: "Finding and citing reliable sources", difficulty: "intermediate", estimatedHours: 5 },
          { id: "shakespeare-intro", name: "Introduction to Shakespeare", description: "Basic understanding of Shakespeare's works", difficulty: "advanced", estimatedHours: 6 },
          { id: "debate-discussion", name: "Debate & Discussion", description: "Oral communication and argumentation", difficulty: "intermediate", estimatedHours: 4 }
        ]
      },
      {
        id: "science-8",
        name: "Science",
        icon: "science",
        color: "#FF9800",
        topics: [
          { id: "chemistry-basics", name: "Basic Chemistry", description: "Atoms, molecules, and chemical reactions", difficulty: "intermediate", estimatedHours: 8 },
          { id: "physics-motion", name: "Physics of Motion", description: "Force, acceleration, and energy", difficulty: "intermediate", estimatedHours: 7 },
          { id: "cell-biology", name: "Cell Biology", description: "Cell structure and function", difficulty: "intermediate", estimatedHours: 6 },
          { id: "genetics-intro", name: "Introduction to Genetics", description: "Heredity and DNA basics", difficulty: "advanced", estimatedHours: 5 },
          { id: "environmental-science", name: "Environmental Science", description: "Human impact on environment", difficulty: "intermediate", estimatedHours: 5 }
        ]
      },
      {
        id: "history-8",
        name: "History",
        icon: "history_edu",
        color: "#9C27B0",
        topics: [
          { id: "constitution-government", name: "Constitution & Government", description: "Formation of US government", difficulty: "intermediate", estimatedHours: 6 },
          { id: "industrial-revolution", name: "Industrial Revolution", description: "Technological and social changes", difficulty: "intermediate", estimatedHours: 5 },
          { id: "world-war-1", name: "World War I", description: "Causes, events, and aftermath", difficulty: "advanced", estimatedHours: 6 },
          { id: "great-depression", name: "Great Depression", description: "Economic crisis and recovery", difficulty: "intermediate", estimatedHours: 4 },
          { id: "civil-rights-movement", name: "Civil Rights Movement", description: "Struggle for equality and justice", difficulty: "intermediate", estimatedHours: 5 }
        ]
      },
      {
        id: "geography-8",
        name: "Geography",
        icon: "public",
        color: "#607D8B",
        topics: [
          { id: "physical-geography", name: "Physical Geography", description: "Landforms, climate, and natural processes", difficulty: "intermediate", estimatedHours: 6 },
          { id: "human-geography", name: "Human Geography", description: "Population, culture, and economic activities", difficulty: "intermediate", estimatedHours: 5 },
          { id: "world-regions", name: "World Regions", description: "Detailed study of major world regions", difficulty: "intermediate", estimatedHours: 8 },
          { id: "environmental-issues", name: "Environmental Issues", description: "Global environmental challenges", difficulty: "advanced", estimatedHours: 5 },
          { id: "urban-rural", name: "Urban vs Rural", description: "Differences between urban and rural areas", difficulty: "intermediate", estimatedHours: 4 }
        ]
      }
    ]
  }
];

export const getTopicsByGradeAndSubject = (grade: string, subjectId: string): Topic[] => {
  const gradeCurriculum = CURRICULUM_MASTER_DATA.find(g => g.grade === grade);
  if (!gradeCurriculum) return [];
  
  const subject = gradeCurriculum.subjects.find(s => s.id === subjectId);
  return subject ? subject.topics : [];
};

export const getSubjectsByGrade = (grade: string): Subject[] => {
  const gradeCurriculum = CURRICULUM_MASTER_DATA.find(g => g.grade === grade);
  return gradeCurriculum ? gradeCurriculum.subjects : [];
};

export const getAllGrades = (): string[] => {
  return CURRICULUM_MASTER_DATA.map(g => g.grade);
};