const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive topic data for all grade-subject combinations
const comprehensiveTopics = {
  'K': {
    'mathematics': [
      { slug: 'counting-1-10', name: 'Counting 1-10', description: 'Learn to count from 1 to 10' },
      { slug: 'number-recognition', name: 'Number Recognition', description: 'Recognize and identify numbers 0-10' },
      { slug: 'basic-shapes', name: 'Basic Shapes', description: 'Identify circles, squares, triangles, and rectangles' },
      { slug: 'simple-addition', name: 'Simple Addition', description: 'Add numbers up to 5' },
      { slug: 'patterns-sorting', name: 'Patterns and Sorting', description: 'Recognize patterns and sort objects' },
      { slug: 'measurement-basics', name: 'Measurement Basics', description: 'Compare sizes: big/small, long/short' }
    ],
    'english-language-arts': [
      { slug: 'letter-recognition', name: 'Letter Recognition', description: 'Identify uppercase and lowercase letters' },
      { slug: 'phonics-sounds', name: 'Letter Sounds', description: 'Learn letter sounds and phonics' },
      { slug: 'sight-words', name: 'Sight Words', description: 'Recognize common sight words' },
      { slug: 'rhyming-words', name: 'Rhyming Words', description: 'Identify and create rhyming words' },
      { slug: 'story-listening', name: 'Story Listening', description: 'Listen to and understand simple stories' }
    ],
    'science': [
      { slug: 'living-nonliving', name: 'Living vs Non-living', description: 'Distinguish between living and non-living things' },
      { slug: 'five-senses', name: 'Five Senses', description: 'Explore the five senses' },
      { slug: 'weather-patterns', name: 'Weather Patterns', description: 'Observe and describe weather' },
      { slug: 'animal-families', name: 'Animal Families', description: 'Learn about different animal families' }
    ],
    'social-studies': [
      { slug: 'community-helpers', name: 'Community Helpers', description: 'Learn about people who help in our community' },
      { slug: 'family-community', name: 'Family and Community', description: 'Understanding family and community roles' },
      { slug: 'rules-safety', name: 'Rules and Safety', description: 'Basic rules and safety practices' }
    ]
  },
  '1': {
    'mathematics': [
      { slug: 'counting-to-100', name: 'Counting to 100', description: 'Count from 1 to 100' },
      { slug: 'addition-within-20', name: 'Addition within 20', description: 'Add numbers within 20' },
      { slug: 'subtraction-within-20', name: 'Subtraction within 20', description: 'Subtract numbers within 20' },
      { slug: 'place-value', name: 'Place Value', description: 'Understand tens and ones' },
      { slug: 'time-money', name: 'Time and Money', description: 'Tell time and count money' },
      { slug: 'measurement-length', name: 'Measurement and Length', description: 'Measure length using units' }
    ],
    'english-language-arts': [
      { slug: 'reading-comprehension', name: 'Reading Comprehension', description: 'Understand simple texts' },
      { slug: 'writing-sentences', name: 'Writing Sentences', description: 'Write complete sentences' },
      { slug: 'vocabulary-building', name: 'Vocabulary Building', description: 'Learn new words and meanings' },
      { slug: 'story-elements', name: 'Story Elements', description: 'Identify characters, setting, and plot' }
    ],
    'science': [
      { slug: 'animal-habitats', name: 'Animal Habitats', description: 'Learn where animals live' },
      { slug: 'plant-parts', name: 'Plant Parts', description: 'Identify parts of plants' },
      { slug: 'seasons-changes', name: 'Seasons and Changes', description: 'Observe seasonal changes' },
      { slug: 'materials-properties', name: 'Materials and Properties', description: 'Explore different materials' }
    ],
    'social-studies': [
      { slug: 'maps-globes', name: 'Maps and Globes', description: 'Introduction to maps and globes' },
      { slug: 'past-present', name: 'Past and Present', description: 'Compare past and present' },
      { slug: 'citizenship', name: 'Citizenship', description: 'Being a good citizen' }
    ]
  },
  '2': {
    'mathematics': [
      { slug: 'two-digit-addition', name: 'Two-Digit Addition', description: 'Add two-digit numbers' },
      { slug: 'two-digit-subtraction', name: 'Two-Digit Subtraction', description: 'Subtract two-digit numbers' },
      { slug: 'skip-counting', name: 'Skip Counting', description: 'Count by 2s, 5s, and 10s' },
      { slug: 'place-value-hundreds', name: 'Place Value to Hundreds', description: 'Understand hundreds, tens, and ones' },
      { slug: 'geometry-2d-3d', name: '2D and 3D Shapes', description: 'Identify 2D and 3D shapes' },
      { slug: 'data-graphs', name: 'Data and Graphs', description: 'Read and create simple graphs' }
    ],
    'english-language-arts': [
      { slug: 'sentence-structure', name: 'Sentence Structure', description: 'Build proper sentences' },
      { slug: 'reading-fluency', name: 'Reading Fluency', description: 'Read with expression and speed' },
      { slug: 'writing-paragraphs', name: 'Writing Paragraphs', description: 'Write simple paragraphs' },
      { slug: 'grammar-basics', name: 'Grammar Basics', description: 'Learn basic grammar rules' }
    ],
    'science': [
      { slug: 'plant-life-cycle', name: 'Plant Life Cycle', description: 'Learn how plants grow and change' },
      { slug: 'animal-life-cycles', name: 'Animal Life Cycles', description: 'Explore animal life cycles' },
      { slug: 'forces-motion', name: 'Forces and Motion', description: 'Understand push, pull, and motion' },
      { slug: 'earth-materials', name: 'Earth Materials', description: 'Explore rocks, soil, and water' }
    ],
    'social-studies': [
      { slug: 'american-symbols', name: 'American Symbols', description: 'Learn about American symbols' },
      { slug: 'communities-change', name: 'Communities Change', description: 'How communities change over time' },
      { slug: 'geography-basics', name: 'Geography Basics', description: 'Basic geography concepts' }
    ]
  },
  '3': {
    'mathematics': [
      { slug: 'multiplication-tables', name: 'Multiplication Tables', description: 'Learn multiplication facts' },
      { slug: 'division-basics', name: 'Division Basics', description: 'Introduction to division' },
      { slug: 'fractions-introduction', name: 'Introduction to Fractions', description: 'Understand basic fractions' },
      { slug: 'area-perimeter', name: 'Area and Perimeter', description: 'Calculate area and perimeter' },
      { slug: 'time-elapsed', name: 'Elapsed Time', description: 'Calculate elapsed time' },
      { slug: 'word-problems', name: 'Word Problems', description: 'Solve multi-step word problems' }
    ],
    'english-language-arts': [
      { slug: 'paragraph-writing', name: 'Paragraph Writing', description: 'Write well-structured paragraphs' },
      { slug: 'reading-strategies', name: 'Reading Strategies', description: 'Use strategies to understand text' },
      { slug: 'poetry-analysis', name: 'Poetry Analysis', description: 'Analyze poems and their meaning' },
      { slug: 'grammar-advanced', name: 'Advanced Grammar', description: 'Complex grammar concepts' }
    ],
    'science': [
      { slug: 'states-of-matter', name: 'States of Matter', description: 'Explore solids, liquids, and gases' },
      { slug: 'weather-climate', name: 'Weather and Climate', description: 'Understand weather patterns' },
      { slug: 'ecosystems', name: 'Ecosystems', description: 'Learn about different ecosystems' },
      { slug: 'simple-machines', name: 'Simple Machines', description: 'Explore levers, pulleys, and wedges' }
    ],
    'social-studies': [
      { slug: 'native-americans', name: 'Native Americans', description: 'Learn about Native American cultures' },
      { slug: 'explorers', name: 'Explorers', description: 'Famous explorers and their journeys' },
      { slug: 'government-basics', name: 'Government Basics', description: 'How government works' }
    ]
  },
  '4': {
    'mathematics': [
      { slug: 'long-division', name: 'Long Division', description: 'Master long division' },
      { slug: 'equivalent-fractions', name: 'Equivalent Fractions', description: 'Find equivalent fractions' },
      { slug: 'decimal-basics', name: 'Decimal Basics', description: 'Introduction to decimals' },
      { slug: 'angles-lines', name: 'Angles and Lines', description: 'Identify angles and line types' },
      { slug: 'multi-step-problems', name: 'Multi-step Problems', description: 'Solve complex word problems' },
      { slug: 'factors-multiples', name: 'Factors and Multiples', description: 'Find factors and multiples' }
    ],
    'english-language-arts': [
      { slug: 'research-skills', name: 'Research Skills', description: 'Learn to research and cite sources' },
      { slug: 'narrative-writing', name: 'Narrative Writing', description: 'Write engaging stories' },
      { slug: 'text-analysis', name: 'Text Analysis', description: 'Analyze different types of texts' },
      { slug: 'vocabulary-context', name: 'Vocabulary in Context', description: 'Use context clues for meaning' }
    ],
    'science': [
      { slug: 'solar-system', name: 'Solar System', description: 'Explore planets and space' },
      { slug: 'energy-forms', name: 'Forms of Energy', description: 'Learn about different energy types' },
      { slug: 'rocks-minerals', name: 'Rocks and Minerals', description: 'Classify rocks and minerals' },
      { slug: 'adaptation-survival', name: 'Adaptation and Survival', description: 'How animals adapt to survive' }
    ],
    'social-studies': [
      { slug: 'state-history', name: 'State History', description: 'Learn about your state\'s history' },
      { slug: 'regions-usa', name: 'Regions of the USA', description: 'Explore different US regions' },
      { slug: 'economics-basics', name: 'Economics Basics', description: 'Supply, demand, and trade' }
    ]
  },
  '5': {
    'mathematics': [
      { slug: 'fractions-basics', name: 'Understanding Fractions', description: 'Master fraction operations' },
      { slug: 'decimals-basics', name: 'Understanding Decimals', description: 'Work with decimal numbers' },
      { slug: 'multiplication-multi-digit', name: 'Multi-digit Multiplication', description: 'Multiply large numbers' },
      { slug: 'geometry-basics', name: 'Geometry Basics', description: 'Advanced geometry concepts' },
      { slug: 'coordinate-plane', name: 'Coordinate Plane', description: 'Plot points on coordinate plane' },
      { slug: 'volume-surface-area', name: 'Volume and Surface Area', description: 'Calculate volume and surface area' }
    ],
    'english-language-arts': [
      { slug: 'essay-writing', name: 'Essay Writing', description: 'Write structured essays' },
      { slug: 'literary-analysis', name: 'Literary Analysis', description: 'Analyze literature and themes' },
      { slug: 'persuasive-writing', name: 'Persuasive Writing', description: 'Write convincing arguments' },
      { slug: 'research-projects', name: 'Research Projects', description: 'Complete research projects' }
    ],
    'science': [
      { slug: 'human-body-systems', name: 'Human Body Systems', description: 'Learn about body systems' },
      { slug: 'chemical-physical-changes', name: 'Chemical and Physical Changes', description: 'Distinguish types of changes' },
      { slug: 'earth-space-systems', name: 'Earth and Space Systems', description: 'Earth\'s place in space' },
      { slug: 'inheritance-traits', name: 'Inheritance and Traits', description: 'How traits are passed down' }
    ],
    'social-studies': [
      { slug: 'american-revolution', name: 'American Revolution', description: 'The founding of America' },
      { slug: 'constitution', name: 'Constitution', description: 'The US Constitution and Bill of Rights' },
      { slug: 'westward-expansion', name: 'Westward Expansion', description: 'America moves west' }
    ]
  }
};

async function createComprehensiveTopics() {
  console.log('🚀 Creating comprehensive topics for all grade-subject combinations...');
  
  try {
    // Connect to the database
    await prisma.$connect();
    
    // Get all grades and subjects
    const grades = await prisma.grade.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    let topicsCreated = 0;
    let topicsSkipped = 0;
    
    // Create topics for each grade-subject combination
    for (const [gradeLevel, gradeTopics] of Object.entries(comprehensiveTopics)) {
      const grade = grades.find(g => g.level === gradeLevel);
      if (!grade) {
        console.log(`⚠️ Grade ${gradeLevel} not found, skipping...`);
        continue;
      }
      
      for (const [subjectSlug, topics] of Object.entries(gradeTopics)) {
        const subject = subjects.find(s => s.slug === subjectSlug);
        if (!subject) {
          console.log(`⚠️ Subject ${subjectSlug} not found, skipping...`);
          continue;
        }
        
        console.log(`📝 Creating topics for Grade ${gradeLevel} - ${subject.name}...`);
        
        for (const topicData of topics) {
          try {
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
                difficulty: getDifficultyForGrade(gradeLevel),
                prerequisites: [],
                learningObjectives: [
                  `Understand ${topicData.name.toLowerCase()}`,
                  `Apply ${topicData.name.toLowerCase()} concepts`,
                  `Solve problems related to ${topicData.name.toLowerCase()}`
                ],
                estimatedDuration: getEstimatedDuration(gradeLevel),
                isActive: true
              }
            });
            
            console.log(`   ✅ Created topic: ${topicData.name}`);
            topicsCreated++;
            
          } catch (error) {
            console.error(`   ❌ Error creating topic ${topicData.slug}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n🎉 Comprehensive topics creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Topics created: ${topicsCreated}`);
    console.log(`   - Topics skipped: ${topicsSkipped}`);
    
    // Final count
    const totalTopics = await prisma.topic.count();
    console.log(`   - Total topics in database: ${totalTopics}`);
    
  } catch (error) {
    console.error('❌ Error creating comprehensive topics:', error);
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
createComprehensiveTopics();