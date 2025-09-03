const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Comprehensive topic definitions for all grade-subject combinations
const COMPREHENSIVE_TOPICS = {
  // Kindergarten topics
  'K': {
    'mathematics': [
      { name: 'counting-1-10', displayName: 'Counting 1-10', description: 'Learn to count from 1 to 10' },
      { name: 'number-recognition', displayName: 'Number Recognition', description: 'Recognize and write numbers 0-10' },
      { name: 'basic-shapes', displayName: 'Basic Shapes', description: 'Identify circles, squares, triangles, rectangles' },
      { name: 'simple-addition', displayName: 'Simple Addition', description: 'Add numbers up to 5' }
    ],
    'english-language-arts': [
      { name: 'letter-recognition', displayName: 'Letter Recognition', description: 'Recognize uppercase and lowercase letters' },
      { name: 'phonics-sounds', displayName: 'Letter Sounds', description: 'Learn letter sounds and phonics' },
      { name: 'sight-words', displayName: 'Sight Words', description: 'Learn common sight words' }
    ],
    'science': [
      { name: 'living-nonliving', displayName: 'Living vs Non-living', description: 'Distinguish between living and non-living things' },
      { name: 'five-senses', displayName: 'Five Senses', description: 'Explore the five senses' }
    ],
    'social-studies': [
      { name: 'family-community', displayName: 'Family and Community', description: 'Learn about family and community helpers' }
    ],
    'visual-arts': [
      { name: 'colors-shapes', displayName: 'Colors and Shapes', description: 'Explore colors and basic art shapes' }
    ],
    'music': [
      { name: 'rhythm-patterns', displayName: 'Rhythm Patterns', description: 'Learn basic rhythm and musical patterns' }
    ],
    'physical-education': [
      { name: 'basic-movements', displayName: 'Basic Movements', description: 'Practice running, jumping, and coordination' }
    ]
  },
  // Grade 1 topics
  '1': {
    'mathematics': [
      { name: 'counting-to-100', displayName: 'Counting to 100', description: 'Count from 1 to 100' },
      { name: 'addition-within-20', displayName: 'Addition within 20', description: 'Add numbers up to 20' },
      { name: 'subtraction-within-20', displayName: 'Subtraction within 20', description: 'Subtract numbers within 20' }
    ],
    'english-language-arts': [
      { name: 'reading-comprehension', displayName: 'Reading Comprehension', description: 'Understand simple stories and texts' }
    ],
    'science': [
      { name: 'plants-animals', displayName: 'Plants and Animals', description: 'Learn about basic plant and animal characteristics' }
    ],
    'social-studies': [
      { name: 'maps-directions', displayName: 'Maps and Directions', description: 'Basic map skills and directions' }
    ],
    'visual-arts': [
      { name: 'drawing-basics', displayName: 'Drawing Basics', description: 'Learn basic drawing techniques' }
    ],
    'music': [
      { name: 'simple-songs', displayName: 'Simple Songs', description: 'Learn and sing simple songs' }
    ],
    'physical-education': [
      { name: 'sports-basics', displayName: 'Sports Basics', description: 'Introduction to basic sports skills' }
    ]
  }
};

async function seedComprehensiveTopics() {
  console.log('🌱 SEEDING COMPREHENSIVE TOPICS');
  console.log('================================');

  try {
    // Get all grades and subjects
    const grades = await prisma.gradeLevel.findMany({ orderBy: { sortOrder: 'asc' } });
    const subjects = await prisma.subject.findMany({ orderBy: { sortOrder: 'asc' } });

    let totalCreated = 0;

    for (const grade of grades) {
      for (const subject of subjects) {
        // Check if we have predefined topics for this combination
        const gradeTopics = COMPREHENSIVE_TOPICS[grade.grade];
        const subjectTopics = gradeTopics?.[subject.name];

        if (subjectTopics && subjectTopics.length > 0) {
          // Use predefined topics
          for (const topicDef of subjectTopics) {
            const existing = await prisma.topic.findFirst({
              where: {
                name: topicDef.name,
                gradeId: grade.id,
                subjectId: subject.id
              }
            });

            if (!existing) {
              await prisma.topic.create({
                data: {
                  name: topicDef.name,
                  displayName: topicDef.displayName,
                  description: topicDef.description,
                  gradeId: grade.id,
                  subjectId: subject.id,
                  difficulty: 'BEGINNER',
                  estimatedHours: 2,
                  prerequisites: [],
                  learningObjectives: [topicDef.description],
                  skills: ['Basic understanding'],
                  assessmentCriteria: ['Can demonstrate basic knowledge'],
                  sortOrder: 1,
                  isActive: true
                }
              });
              totalCreated++;
              console.log(`✅ Created: ${grade.grade} - ${subject.name} - ${topicDef.displayName}`);
            }
          }
        } else {
          // Create a generic topic for this grade-subject combination
          const genericTopicName = `${subject.name.replace('-', '_')}_basics`;
          const existing = await prisma.topic.findFirst({
            where: {
              name: genericTopicName,
              gradeId: grade.id,
              subjectId: subject.id
            }
          });

          if (!existing) {
            await prisma.topic.create({
              data: {
                name: genericTopicName,
                displayName: `${subject.displayName} Basics`,
                description: `Introduction to ${subject.displayName} for ${grade.displayName}`,
                gradeId: grade.id,
                subjectId: subject.id,
                difficulty: 'BEGINNER',
                estimatedHours: 3,
                prerequisites: [],
                learningObjectives: [`Learn basic ${subject.displayName} concepts`],
                skills: ['Foundational knowledge'],
                assessmentCriteria: ['Can demonstrate basic understanding'],
                sortOrder: 1,
                isActive: true
              }
            });
            totalCreated++;
            console.log(`✅ Created generic: ${grade.grade} - ${subject.name} - ${subject.displayName} Basics`);
          }
        }
      }
    }

    console.log(`\n🎉 Successfully created ${totalCreated} new topics!`);

  } catch (error) {
    console.error('❌ Error seeding topics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedComprehensiveTopics();