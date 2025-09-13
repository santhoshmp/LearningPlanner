const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive topic data for all grade-subject combinations
const topicsToAdd = [
  // Kindergarten Mathematics (additional topics)
  { name: 'patterns-sorting', displayName: 'Patterns and Sorting', description: 'Recognize patterns and sort objects', grade: 'K', subject: 'mathematics' },
  { name: 'measurement-basics', displayName: 'Measurement Basics', description: 'Compare sizes: big/small, long/short', grade: 'K', subject: 'mathematics' },
  
  // Kindergarten English Language Arts (additional topics)
  { name: 'rhyming-words', displayName: 'Rhyming Words', description: 'Identify and create rhyming words', grade: 'K', subject: 'english-language-arts' },
  { name: 'story-listening', displayName: 'Story Listening', description: 'Listen to and understand simple stories', grade: 'K', subject: 'english-language-arts' },
  
  // Kindergarten Science (additional topics)
  { name: 'weather-patterns', displayName: 'Weather Patterns', description: 'Observe and describe weather', grade: 'K', subject: 'science' },
  { name: 'animal-families', displayName: 'Animal Families', description: 'Learn about different animal families', grade: 'K', subject: 'science' },
  
  // Kindergarten Social Studies
  { name: 'community-helpers', displayName: 'Community Helpers', description: 'Learn about people who help in our community', grade: 'K', subject: 'social-studies' },
  { name: 'family-community', displayName: 'Family and Community', description: 'Understanding family and community roles', grade: 'K', subject: 'social-studies' },
  { name: 'rules-safety', displayName: 'Rules and Safety', description: 'Basic rules and safety practices', grade: 'K', subject: 'social-studies' },
  
  // Grade 1 Mathematics (additional topics)
  { name: 'place-value', displayName: 'Place Value', description: 'Understand tens and ones', grade: '1', subject: 'mathematics' },
  { name: 'time-money', displayName: 'Time and Money', description: 'Tell time and count money', grade: '1', subject: 'mathematics' },
  { name: 'measurement-length', displayName: 'Measurement and Length', description: 'Measure length using units', grade: '1', subject: 'mathematics' },
  
  // Grade 1 English Language Arts
  { name: 'reading-comprehension', displayName: 'Reading Comprehension', description: 'Understand simple texts', grade: '1', subject: 'english-language-arts' },
  { name: 'writing-sentences', displayName: 'Writing Sentences', description: 'Write complete sentences', grade: '1', subject: 'english-language-arts' },
  { name: 'vocabulary-building', displayName: 'Vocabulary Building', description: 'Learn new words and meanings', grade: '1', subject: 'english-language-arts' },
  { name: 'story-elements', displayName: 'Story Elements', description: 'Identify characters, setting, and plot', grade: '1', subject: 'english-language-arts' },
  
  // Grade 1 Science
  { name: 'animal-habitats', displayName: 'Animal Habitats', description: 'Learn where animals live', grade: '1', subject: 'science' },
  { name: 'plant-parts', displayName: 'Plant Parts', description: 'Identify parts of plants', grade: '1', subject: 'science' },
  { name: 'seasons-changes', displayName: 'Seasons and Changes', description: 'Observe seasonal changes', grade: '1', subject: 'science' },
  { name: 'materials-properties', displayName: 'Materials and Properties', description: 'Explore different materials', grade: '1', subject: 'science' },
  
  // Grade 1 Social Studies
  { name: 'maps-globes', displayName: 'Maps and Globes', description: 'Introduction to maps and globes', grade: '1', subject: 'social-studies' },
  { name: 'past-present', displayName: 'Past and Present', description: 'Compare past and present', grade: '1', subject: 'social-studies' },
  { name: 'citizenship', displayName: 'Citizenship', description: 'Being a good citizen', grade: '1', subject: 'social-studies' },
  
  // Grade 2 Mathematics
  { name: 'two-digit-addition', displayName: 'Two-Digit Addition', description: 'Add two-digit numbers', grade: '2', subject: 'mathematics' },
  { name: 'two-digit-subtraction', displayName: 'Two-Digit Subtraction', description: 'Subtract two-digit numbers', grade: '2', subject: 'mathematics' },
  { name: 'skip-counting', displayName: 'Skip Counting', description: 'Count by 2s, 5s, and 10s', grade: '2', subject: 'mathematics' },
  { name: 'place-value-hundreds', displayName: 'Place Value to Hundreds', description: 'Understand hundreds, tens, and ones', grade: '2', subject: 'mathematics' },
  { name: 'geometry-2d-3d', displayName: '2D and 3D Shapes', description: 'Identify 2D and 3D shapes', grade: '2', subject: 'mathematics' },
  { name: 'data-graphs', displayName: 'Data and Graphs', description: 'Read and create simple graphs', grade: '2', subject: 'mathematics' },
  
  // Grade 2 English Language Arts
  { name: 'sentence-structure', displayName: 'Sentence Structure', description: 'Build proper sentences', grade: '2', subject: 'english-language-arts' },
  { name: 'reading-fluency', displayName: 'Reading Fluency', description: 'Read with expression and speed', grade: '2', subject: 'english-language-arts' },
  { name: 'writing-paragraphs', displayName: 'Writing Paragraphs', description: 'Write simple paragraphs', grade: '2', subject: 'english-language-arts' },
  { name: 'grammar-basics', displayName: 'Grammar Basics', description: 'Learn basic grammar rules', grade: '2', subject: 'english-language-arts' },
  
  // Grade 2 Science
  { name: 'plant-life-cycle', displayName: 'Plant Life Cycle', description: 'Learn how plants grow and change', grade: '2', subject: 'science' },
  { name: 'animal-life-cycles', displayName: 'Animal Life Cycles', description: 'Explore animal life cycles', grade: '2', subject: 'science' },
  { name: 'forces-motion', displayName: 'Forces and Motion', description: 'Understand push, pull, and motion', grade: '2', subject: 'science' },
  { name: 'earth-materials', displayName: 'Earth Materials', description: 'Explore rocks, soil, and water', grade: '2', subject: 'science' },
  
  // Grade 2 Social Studies
  { name: 'american-symbols', displayName: 'American Symbols', description: 'Learn about American symbols', grade: '2', subject: 'social-studies' },
  { name: 'communities-change', displayName: 'Communities Change', description: 'How communities change over time', grade: '2', subject: 'social-studies' },
  { name: 'geography-basics', displayName: 'Geography Basics', description: 'Basic geography concepts', grade: '2', subject: 'social-studies' },
  
  // Grade 3 Mathematics
  { name: 'multiplication-tables', displayName: 'Multiplication Tables', description: 'Learn multiplication facts', grade: '3', subject: 'mathematics' },
  { name: 'division-basics', displayName: 'Division Basics', description: 'Introduction to division', grade: '3', subject: 'mathematics' },
  { name: 'fractions-introduction', displayName: 'Introduction to Fractions', description: 'Understand basic fractions', grade: '3', subject: 'mathematics' },
  { name: 'area-perimeter', displayName: 'Area and Perimeter', description: 'Calculate area and perimeter', grade: '3', subject: 'mathematics' },
  { name: 'time-elapsed', displayName: 'Elapsed Time', description: 'Calculate elapsed time', grade: '3', subject: 'mathematics' },
  { name: 'word-problems', displayName: 'Word Problems', description: 'Solve multi-step word problems', grade: '3', subject: 'mathematics' },
  
  // Grade 3 English Language Arts
  { name: 'paragraph-writing', displayName: 'Paragraph Writing', description: 'Write well-structured paragraphs', grade: '3', subject: 'english-language-arts' },
  { name: 'reading-strategies', displayName: 'Reading Strategies', description: 'Use strategies to understand text', grade: '3', subject: 'english-language-arts' },
  { name: 'poetry-analysis', displayName: 'Poetry Analysis', description: 'Analyze poems and their meaning', grade: '3', subject: 'english-language-arts' },
  { name: 'grammar-advanced', displayName: 'Advanced Grammar', description: 'Complex grammar concepts', grade: '3', subject: 'english-language-arts' },
  
  // Grade 3 Science
  { name: 'states-of-matter', displayName: 'States of Matter', description: 'Explore solids, liquids, and gases', grade: '3', subject: 'science' },
  { name: 'weather-climate', displayName: 'Weather and Climate', description: 'Understand weather patterns', grade: '3', subject: 'science' },
  { name: 'ecosystems', displayName: 'Ecosystems', description: 'Learn about different ecosystems', grade: '3', subject: 'science' },
  { name: 'simple-machines', displayName: 'Simple Machines', description: 'Explore levers, pulleys, and wedges', grade: '3', subject: 'science' },
  
  // Grade 3 Social Studies
  { name: 'native-americans', displayName: 'Native Americans', description: 'Learn about Native American cultures', grade: '3', subject: 'social-studies' },
  { name: 'explorers', displayName: 'Explorers', description: 'Famous explorers and their journeys', grade: '3', subject: 'social-studies' },
  { name: 'government-basics', displayName: 'Government Basics', description: 'How government works', grade: '3', subject: 'social-studies' },
  
  // Grade 4 Mathematics
  { name: 'long-division', displayName: 'Long Division', description: 'Master long division', grade: '4', subject: 'mathematics' },
  { name: 'equivalent-fractions', displayName: 'Equivalent Fractions', description: 'Find equivalent fractions', grade: '4', subject: 'mathematics' },
  { name: 'decimal-basics', displayName: 'Decimal Basics', description: 'Introduction to decimals', grade: '4', subject: 'mathematics' },
  { name: 'angles-lines', displayName: 'Angles and Lines', description: 'Identify angles and line types', grade: '4', subject: 'mathematics' },
  { name: 'multi-step-problems', displayName: 'Multi-step Problems', description: 'Solve complex word problems', grade: '4', subject: 'mathematics' },
  { name: 'factors-multiples', displayName: 'Factors and Multiples', description: 'Find factors and multiples', grade: '4', subject: 'mathematics' },
  
  // Grade 4 English Language Arts
  { name: 'research-skills', displayName: 'Research Skills', description: 'Learn to research and cite sources', grade: '4', subject: 'english-language-arts' },
  { name: 'narrative-writing', displayName: 'Narrative Writing', description: 'Write engaging stories', grade: '4', subject: 'english-language-arts' },
  { name: 'text-analysis', displayName: 'Text Analysis', description: 'Analyze different types of texts', grade: '4', subject: 'english-language-arts' },
  { name: 'vocabulary-context', displayName: 'Vocabulary in Context', description: 'Use context clues for meaning', grade: '4', subject: 'english-language-arts' },
  
  // Grade 4 Science
  { name: 'solar-system', displayName: 'Solar System', description: 'Explore planets and space', grade: '4', subject: 'science' },
  { name: 'energy-forms', displayName: 'Forms of Energy', description: 'Learn about different energy types', grade: '4', subject: 'science' },
  { name: 'rocks-minerals', displayName: 'Rocks and Minerals', description: 'Classify rocks and minerals', grade: '4', subject: 'science' },
  { name: 'adaptation-survival', displayName: 'Adaptation and Survival', description: 'How animals adapt to survive', grade: '4', subject: 'science' },
  
  // Grade 4 Social Studies
  { name: 'state-history', displayName: 'State History', description: 'Learn about your state\'s history', grade: '4', subject: 'social-studies' },
  { name: 'regions-usa', displayName: 'Regions of the USA', description: 'Explore different US regions', grade: '4', subject: 'social-studies' },
  { name: 'economics-basics', displayName: 'Economics Basics', description: 'Supply, demand, and trade', grade: '4', subject: 'social-studies' },
  
  // Grade 5 Mathematics (additional topics)
  { name: 'geometry-basics', displayName: 'Geometry Basics', description: 'Advanced geometry concepts', grade: '5', subject: 'mathematics' },
  { name: 'coordinate-plane', displayName: 'Coordinate Plane', description: 'Plot points on coordinate plane', grade: '5', subject: 'mathematics' },
  { name: 'volume-surface-area', displayName: 'Volume and Surface Area', description: 'Calculate volume and surface area', grade: '5', subject: 'mathematics' },
  
  // Grade 5 English Language Arts
  { name: 'essay-writing', displayName: 'Essay Writing', description: 'Write structured essays', grade: '5', subject: 'english-language-arts' },
  { name: 'literary-analysis', displayName: 'Literary Analysis', description: 'Analyze literature and themes', grade: '5', subject: 'english-language-arts' },
  { name: 'persuasive-writing', displayName: 'Persuasive Writing', description: 'Write convincing arguments', grade: '5', subject: 'english-language-arts' },
  { name: 'research-projects', displayName: 'Research Projects', description: 'Complete research projects', grade: '5', subject: 'english-language-arts' },
  
  // Grade 5 Science (additional topics)
  { name: 'human-body-systems', displayName: 'Human Body Systems', description: 'Learn about body systems', grade: '5', subject: 'science' },
  { name: 'chemical-physical-changes', displayName: 'Chemical and Physical Changes', description: 'Distinguish types of changes', grade: '5', subject: 'science' },
  { name: 'earth-space-systems', displayName: 'Earth and Space Systems', description: 'Earth\'s place in space', grade: '5', subject: 'science' },
  { name: 'inheritance-traits', displayName: 'Inheritance and Traits', description: 'How traits are passed down', grade: '5', subject: 'science' },
  
  // Grade 5 Social Studies
  { name: 'american-revolution', displayName: 'American Revolution', description: 'The founding of America', grade: '5', subject: 'social-studies' },
  { name: 'constitution', displayName: 'Constitution', description: 'The US Constitution and Bill of Rights', grade: '5', subject: 'social-studies' },
  { name: 'westward-expansion', displayName: 'Westward Expansion', description: 'America moves west', grade: '5', subject: 'social-studies' }
];

async function addComprehensiveTopics() {
  console.log('🚀 Adding comprehensive topics to the database...');
  
  try {
    // Get all grades and subjects first
    const grades = await prisma.gradeLevel.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    let topicsCreated = 0;
    let topicsSkipped = 0;
    
    for (const topicData of topicsToAdd) {
      try {
        // Find the grade and subject
        const grade = grades.find(g => g.grade === topicData.grade);
        const subject = subjects.find(s => s.name === topicData.subject);
        
        if (!grade) {
          console.log(`⚠️ Grade ${topicData.grade} not found, skipping topic ${topicData.name}`);
          topicsSkipped++;
          continue;
        }
        
        if (!subject) {
          console.log(`⚠️ Subject ${topicData.subject} not found, skipping topic ${topicData.name}`);
          topicsSkipped++;
          continue;
        }
        
        // Check if topic already exists
        const existingTopic = await prisma.topic.findFirst({
          where: { 
            name: topicData.name,
            gradeId: grade.id,
            subjectId: subject.id
          }
        });
        
        if (existingTopic) {
          console.log(`   ⏭️ Topic ${topicData.name} already exists, skipping...`);
          topicsSkipped++;
          continue;
        }
        
        // Create the topic
        await prisma.topic.create({
          data: {
            name: topicData.name,
            displayName: topicData.displayName,
            description: topicData.description,
            gradeId: grade.id,
            subjectId: subject.id,
            difficulty: getDifficultyForGrade(topicData.grade),
            estimatedHours: getEstimatedHours(topicData.grade),
            prerequisites: [],
            learningObjectives: [
              `Understand ${topicData.displayName.toLowerCase()}`,
              `Apply ${topicData.displayName.toLowerCase()} concepts`,
              `Solve problems related to ${topicData.displayName.toLowerCase()}`
            ],
            skills: [],
            assessmentCriteria: [],
            sortOrder: 100,
            isActive: true
          }
        });
        
        console.log(`   ✅ Created topic: ${topicData.displayName} (${topicData.grade} - ${topicData.subject})`);
        topicsCreated++;
        
      } catch (error) {
        console.error(`   ❌ Error creating topic ${topicData.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Topic addition completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Topics created: ${topicsCreated}`);
    console.log(`   - Topics skipped: ${topicsSkipped}`);
    
    // Final count
    const totalTopics = await prisma.topic.count();
    console.log(`   - Total topics in database: ${totalTopics}`);
    
  } catch (error) {
    console.error('❌ Error adding topics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getDifficultyForGrade(gradeLevel) {
  const difficultyMap = {
    'K': 'BEGINNER',
    '1': 'BEGINNER',
    '2': 'BEGINNER',
    '3': 'INTERMEDIATE',
    '4': 'INTERMEDIATE',
    '5': 'INTERMEDIATE'
  };
  return difficultyMap[gradeLevel] || 'INTERMEDIATE';
}

function getEstimatedHours(gradeLevel) {
  const hoursMap = {
    'K': 1,
    '1': 1,
    '2': 2,
    '3': 2,
    '4': 3,
    '5': 3
  };
  return hoursMap[gradeLevel] || 2;
}

// Run the script
addComprehensiveTopics();