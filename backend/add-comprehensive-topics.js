const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive topic data for all grade-subject combinations
const topicsToAdd = [
  // Kindergarten Mathematics (additional topics)
  { slug: 'patterns-sorting', name: 'Patterns and Sorting', description: 'Recognize patterns and sort objects', grade: 'K', subject: 'mathematics' },
  { slug: 'measurement-basics', name: 'Measurement Basics', description: 'Compare sizes: big/small, long/short', grade: 'K', subject: 'mathematics' },
  
  // Kindergarten English Language Arts (additional topics)
  { slug: 'rhyming-words', name: 'Rhyming Words', description: 'Identify and create rhyming words', grade: 'K', subject: 'english-language-arts' },
  { slug: 'story-listening', name: 'Story Listening', description: 'Listen to and understand simple stories', grade: 'K', subject: 'english-language-arts' },
  
  // Kindergarten Science (additional topics)
  { slug: 'weather-patterns', name: 'Weather Patterns', description: 'Observe and describe weather', grade: 'K', subject: 'science' },
  { slug: 'animal-families', name: 'Animal Families', description: 'Learn about different animal families', grade: 'K', subject: 'science' },
  
  // Kindergarten Social Studies
  { slug: 'community-helpers', name: 'Community Helpers', description: 'Learn about people who help in our community', grade: 'K', subject: 'social-studies' },
  { slug: 'family-community', name: 'Family and Community', description: 'Understanding family and community roles', grade: 'K', subject: 'social-studies' },
  { slug: 'rules-safety', name: 'Rules and Safety', description: 'Basic rules and safety practices', grade: 'K', subject: 'social-studies' },
  
  // Grade 1 Mathematics (additional topics)
  { slug: 'place-value', name: 'Place Value', description: 'Understand tens and ones', grade: '1', subject: 'mathematics' },
  { slug: 'time-money', name: 'Time and Money', description: 'Tell time and count money', grade: '1', subject: 'mathematics' },
  { slug: 'measurement-length', name: 'Measurement and Length', description: 'Measure length using units', grade: '1', subject: 'mathematics' },
  
  // Grade 1 English Language Arts
  { slug: 'reading-comprehension', name: 'Reading Comprehension', description: 'Understand simple texts', grade: '1', subject: 'english-language-arts' },
  { slug: 'writing-sentences', name: 'Writing Sentences', description: 'Write complete sentences', grade: '1', subject: 'english-language-arts' },
  { slug: 'vocabulary-building', name: 'Vocabulary Building', description: 'Learn new words and meanings', grade: '1', subject: 'english-language-arts' },
  { slug: 'story-elements', name: 'Story Elements', description: 'Identify characters, setting, and plot', grade: '1', subject: 'english-language-arts' },
  
  // Grade 1 Science
  { slug: 'animal-habitats', name: 'Animal Habitats', description: 'Learn where animals live', grade: '1', subject: 'science' },
  { slug: 'plant-parts', name: 'Plant Parts', description: 'Identify parts of plants', grade: '1', subject: 'science' },
  { slug: 'seasons-changes', name: 'Seasons and Changes', description: 'Observe seasonal changes', grade: '1', subject: 'science' },
  { slug: 'materials-properties', name: 'Materials and Properties', description: 'Explore different materials', grade: '1', subject: 'science' },
  
  // Grade 1 Social Studies
  { slug: 'maps-globes', name: 'Maps and Globes', description: 'Introduction to maps and globes', grade: '1', subject: 'social-studies' },
  { slug: 'past-present', name: 'Past and Present', description: 'Compare past and present', grade: '1', subject: 'social-studies' },
  { slug: 'citizenship', name: 'Citizenship', description: 'Being a good citizen', grade: '1', subject: 'social-studies' },
  
  // Grade 2 Mathematics
  { slug: 'two-digit-addition', name: 'Two-Digit Addition', description: 'Add two-digit numbers', grade: '2', subject: 'mathematics' },
  { slug: 'two-digit-subtraction', name: 'Two-Digit Subtraction', description: 'Subtract two-digit numbers', grade: '2', subject: 'mathematics' },
  { slug: 'skip-counting', name: 'Skip Counting', description: 'Count by 2s, 5s, and 10s', grade: '2', subject: 'mathematics' },
  { slug: 'place-value-hundreds', name: 'Place Value to Hundreds', description: 'Understand hundreds, tens, and ones', grade: '2', subject: 'mathematics' },
  { slug: 'geometry-2d-3d', name: '2D and 3D Shapes', description: 'Identify 2D and 3D shapes', grade: '2', subject: 'mathematics' },
  { slug: 'data-graphs', name: 'Data and Graphs', description: 'Read and create simple graphs', grade: '2', subject: 'mathematics' },
  
  // Grade 2 English Language Arts
  { slug: 'sentence-structure', name: 'Sentence Structure', description: 'Build proper sentences', grade: '2', subject: 'english-language-arts' },
  { slug: 'reading-fluency', name: 'Reading Fluency', description: 'Read with expression and speed', grade: '2', subject: 'english-language-arts' },
  { slug: 'writing-paragraphs', name: 'Writing Paragraphs', description: 'Write simple paragraphs', grade: '2', subject: 'english-language-arts' },
  { slug: 'grammar-basics', name: 'Grammar Basics', description: 'Learn basic grammar rules', grade: '2', subject: 'english-language-arts' },
  
  // Grade 2 Science
  { slug: 'plant-life-cycle', name: 'Plant Life Cycle', description: 'Learn how plants grow and change', grade: '2', subject: 'science' },
  { slug: 'animal-life-cycles', name: 'Animal Life Cycles', description: 'Explore animal life cycles', grade: '2', subject: 'science' },
  { slug: 'forces-motion', name: 'Forces and Motion', description: 'Understand push, pull, and motion', grade: '2', subject: 'science' },
  { slug: 'earth-materials', name: 'Earth Materials', description: 'Explore rocks, soil, and water', grade: '2', subject: 'science' },
  
  // Grade 2 Social Studies
  { slug: 'american-symbols', name: 'American Symbols', description: 'Learn about American symbols', grade: '2', subject: 'social-studies' },
  { slug: 'communities-change', name: 'Communities Change', description: 'How communities change over time', grade: '2', subject: 'social-studies' },
  { slug: 'geography-basics', name: 'Geography Basics', description: 'Basic geography concepts', grade: '2', subject: 'social-studies' },
  
  // Grade 3 Mathematics
  { slug: 'multiplication-tables', name: 'Multiplication Tables', description: 'Learn multiplication facts', grade: '3', subject: 'mathematics' },
  { slug: 'division-basics', name: 'Division Basics', description: 'Introduction to division', grade: '3', subject: 'mathematics' },
  { slug: 'fractions-introduction', name: 'Introduction to Fractions', description: 'Understand basic fractions', grade: '3', subject: 'mathematics' },
  { slug: 'area-perimeter', name: 'Area and Perimeter', description: 'Calculate area and perimeter', grade: '3', subject: 'mathematics' },
  { slug: 'time-elapsed', name: 'Elapsed Time', description: 'Calculate elapsed time', grade: '3', subject: 'mathematics' },
  { slug: 'word-problems', name: 'Word Problems', description: 'Solve multi-step word problems', grade: '3', subject: 'mathematics' },
  
  // Grade 3 English Language Arts
  { slug: 'paragraph-writing', name: 'Paragraph Writing', description: 'Write well-structured paragraphs', grade: '3', subject: 'english-language-arts' },
  { slug: 'reading-strategies', name: 'Reading Strategies', description: 'Use strategies to understand text', grade: '3', subject: 'english-language-arts' },
  { slug: 'poetry-analysis', name: 'Poetry Analysis', description: 'Analyze poems and their meaning', grade: '3', subject: 'english-language-arts' },
  { slug: 'grammar-advanced', name: 'Advanced Grammar', description: 'Complex grammar concepts', grade: '3', subject: 'english-language-arts' },
  
  // Grade 3 Science
  { slug: 'states-of-matter', name: 'States of Matter', description: 'Explore solids, liquids, and gases', grade: '3', subject: 'science' },
  { slug: 'weather-climate', name: 'Weather and Climate', description: 'Understand weather patterns', grade: '3', subject: 'science' },
  { slug: 'ecosystems', name: 'Ecosystems', description: 'Learn about different ecosystems', grade: '3', subject: 'science' },
  { slug: 'simple-machines', name: 'Simple Machines', description: 'Explore levers, pulleys, and wedges', grade: '3', subject: 'science' },
  
  // Grade 3 Social Studies
  { slug: 'native-americans', name: 'Native Americans', description: 'Learn about Native American cultures', grade: '3', subject: 'social-studies' },
  { slug: 'explorers', name: 'Explorers', description: 'Famous explorers and their journeys', grade: '3', subject: 'social-studies' },
  { slug: 'government-basics', name: 'Government Basics', description: 'How government works', grade: '3', subject: 'social-studies' },
  
  // Grade 4 Mathematics
  { slug: 'long-division', name: 'Long Division', description: 'Master long division', grade: '4', subject: 'mathematics' },
  { slug: 'equivalent-fractions', name: 'Equivalent Fractions', description: 'Find equivalent fractions', grade: '4', subject: 'mathematics' },
  { slug: 'decimal-basics', name: 'Decimal Basics', description: 'Introduction to decimals', grade: '4', subject: 'mathematics' },
  { slug: 'angles-lines', name: 'Angles and Lines', description: 'Identify angles and line types', grade: '4', subject: 'mathematics' },
  { slug: 'multi-step-problems', name: 'Multi-step Problems', description: 'Solve complex word problems', grade: '4', subject: 'mathematics' },
  { slug: 'factors-multiples', name: 'Factors and Multiples', description: 'Find factors and multiples', grade: '4', subject: 'mathematics' },
  
  // Grade 4 English Language Arts
  { slug: 'research-skills', name: 'Research Skills', description: 'Learn to research and cite sources', grade: '4', subject: 'english-language-arts' },
  { slug: 'narrative-writing', name: 'Narrative Writing', description: 'Write engaging stories', grade: '4', subject: 'english-language-arts' },
  { slug: 'text-analysis', name: 'Text Analysis', description: 'Analyze different types of texts', grade: '4', subject: 'english-language-arts' },
  { slug: 'vocabulary-context', name: 'Vocabulary in Context', description: 'Use context clues for meaning', grade: '4', subject: 'english-language-arts' },
  
  // Grade 4 Science
  { slug: 'solar-system', name: 'Solar System', description: 'Explore planets and space', grade: '4', subject: 'science' },
  { slug: 'energy-forms', name: 'Forms of Energy', description: 'Learn about different energy types', grade: '4', subject: 'science' },
  { slug: 'rocks-minerals', name: 'Rocks and Minerals', description: 'Classify rocks and minerals', grade: '4', subject: 'science' },
  { slug: 'adaptation-survival', name: 'Adaptation and Survival', description: 'How animals adapt to survive', grade: '4', subject: 'science' },
  
  // Grade 4 Social Studies
  { slug: 'state-history', name: 'State History', description: 'Learn about your state\'s history', grade: '4', subject: 'social-studies' },
  { slug: 'regions-usa', name: 'Regions of the USA', description: 'Explore different US regions', grade: '4', subject: 'social-studies' },
  { slug: 'economics-basics', name: 'Economics Basics', description: 'Supply, demand, and trade', grade: '4', subject: 'social-studies' },
  
  // Grade 5 Mathematics (additional topics)
  { slug: 'geometry-basics', name: 'Geometry Basics', description: 'Advanced geometry concepts', grade: '5', subject: 'mathematics' },
  { slug: 'coordinate-plane', name: 'Coordinate Plane', description: 'Plot points on coordinate plane', grade: '5', subject: 'mathematics' },
  { slug: 'volume-surface-area', name: 'Volume and Surface Area', description: 'Calculate volume and surface area', grade: '5', subject: 'mathematics' },
  
  // Grade 5 English Language Arts
  { slug: 'essay-writing', name: 'Essay Writing', description: 'Write structured essays', grade: '5', subject: 'english-language-arts' },
  { slug: 'literary-analysis', name: 'Literary Analysis', description: 'Analyze literature and themes', grade: '5', subject: 'english-language-arts' },
  { slug: 'persuasive-writing', name: 'Persuasive Writing', description: 'Write convincing arguments', grade: '5', subject: 'english-language-arts' },
  { slug: 'research-projects', name: 'Research Projects', description: 'Complete research projects', grade: '5', subject: 'english-language-arts' },
  
  // Grade 5 Science (additional topics)
  { slug: 'human-body-systems', name: 'Human Body Systems', description: 'Learn about body systems', grade: '5', subject: 'science' },
  { slug: 'chemical-physical-changes', name: 'Chemical and Physical Changes', description: 'Distinguish types of changes', grade: '5', subject: 'science' },
  { slug: 'earth-space-systems', name: 'Earth and Space Systems', description: 'Earth\'s place in space', grade: '5', subject: 'science' },
  { slug: 'inheritance-traits', name: 'Inheritance and Traits', description: 'How traits are passed down', grade: '5', subject: 'science' },
  
  // Grade 5 Social Studies
  { slug: 'american-revolution', name: 'American Revolution', description: 'The founding of America', grade: '5', subject: 'social-studies' },
  { slug: 'constitution', name: 'Constitution', description: 'The US Constitution and Bill of Rights', grade: '5', subject: 'social-studies' },
  { slug: 'westward-expansion', name: 'Westward Expansion', description: 'America moves west', grade: '5', subject: 'social-studies' }
];

async function addComprehensiveTopics() {
  console.log('🚀 Adding comprehensive topics to the database...');
  
  try {
    // Get all grades and subjects first
    const grades = await prisma.grade.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    let topicsCreated = 0;
    let topicsSkipped = 0;
    
    for (const topicData of topicsToAdd) {
      try {
        // Find the grade and subject
        const grade = grades.find(g => g.level === topicData.grade);
        const subject = subjects.find(s => s.slug === topicData.subject);
        
        if (!grade) {
          console.log(`⚠️ Grade ${topicData.grade} not found, skipping topic ${topicData.slug}`);
          topicsSkipped++;
          continue;
        }
        
        if (!subject) {
          console.log(`⚠️ Subject ${topicData.subject} not found, skipping topic ${topicData.slug}`);
          topicsSkipped++;
          continue;
        }
        
        // Check if topic already exists
        const existingTopic = await prisma.topic.findUnique({
          where: { slug: topicData.slug }
        });
        
        if (existingTopic) {
          console.log(`   ⏭️ Topic ${topicData.slug} already exists, skipping...`);
          topicsSkipped++;
          continue;
        }
        
        // Create the topic
        await prisma.topic.create({
          data: {
            slug: topicData.slug,
            name: topicData.name,
            description: topicData.description,
            gradeId: grade.id,
            subjectId: subject.id,
            difficulty: getDifficultyForGrade(topicData.grade),
            prerequisites: [],
            learningObjectives: [
              `Understand ${topicData.name.toLowerCase()}`,
              `Apply ${topicData.name.toLowerCase()} concepts`,
              `Solve problems related to ${topicData.name.toLowerCase()}`
            ],
            estimatedDuration: getEstimatedDuration(topicData.grade),
            isActive: true
          }
        });
        
        console.log(`   ✅ Created topic: ${topicData.name} (${topicData.grade} - ${topicData.subject})`);
        topicsCreated++;
        
      } catch (error) {
        console.error(`   ❌ Error creating topic ${topicData.slug}:`, error.message);
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

function getEstimatedDuration(gradeLevel) {
  const durationMap = {
    'K': 15,
    '1': 20,
    '2': 25,
    '3': 30,
    '4': 35,
    '5': 40
  };
  return durationMap[gradeLevel] || 30;
}

// Run the script
addComprehensiveTopics();