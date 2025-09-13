const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createComprehensiveMasterData() {
  console.log('🚀 Creating comprehensive master data...');
  
  try {
    // Get existing data
    const grades = await prisma.gradeLevel.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    // Create additional topics for each grade/subject combination
    const additionalTopics = [
      // Kindergarten Math
      { grade: 'K', subject: 'mathematics', name: 'Patterns and Sorting', description: 'Learning to identify and create patterns' },
      { grade: 'K', subject: 'mathematics', name: 'Measurement Basics', description: 'Understanding big, small, long, short' },
      
      // 1st Grade Math
      { grade: '1', subject: 'mathematics', name: 'Place Value', description: 'Understanding tens and ones' },
      { grade: '1', subject: 'mathematics', name: 'Time and Money', description: 'Basic time telling and coin recognition' },
      
      // 2nd Grade Math
      { grade: '2', subject: 'mathematics', name: 'Two-Digit Addition', description: 'Adding numbers with regrouping' },
      { grade: '2', subject: 'mathematics', name: 'Skip Counting', description: 'Counting by 2s, 5s, and 10s' },
      
      // 3rd Grade Math
      { grade: '3', subject: 'mathematics', name: 'Multiplication Tables', description: 'Learning multiplication facts' },
      { grade: '3', subject: 'mathematics', name: 'Division Basics', description: 'Introduction to division' },
      
      // 4th Grade Math
      { grade: '4', subject: 'mathematics', name: 'Long Division', description: 'Multi-digit division problems' },
      { grade: '4', subject: 'mathematics', name: 'Equivalent Fractions', description: 'Understanding fraction equivalence' },
      
      // 5th Grade Math
      { grade: '5', subject: 'mathematics', name: 'Fraction Operations', description: 'Adding and subtracting fractions' },
      { grade: '5', subject: 'mathematics', name: 'Geometry Basics', description: 'Angles, triangles, and quadrilaterals' },
      
      // English Language Arts
      { grade: 'K', subject: 'english-language-arts', name: 'Rhyming Words', description: 'Identifying and creating rhymes' },
      { grade: '1', subject: 'english-language-arts', name: 'Reading Comprehension', description: 'Understanding simple stories' },
      { grade: '2', subject: 'english-language-arts', name: 'Sentence Structure', description: 'Building complete sentences' },
      { grade: '3', subject: 'english-language-arts', name: 'Paragraph Writing', description: 'Writing organized paragraphs' },
      { grade: '4', subject: 'english-language-arts', name: 'Research Skills', description: 'Finding and using information' },
      { grade: '5', subject: 'english-language-arts', name: 'Essay Writing', description: 'Writing structured essays' },
      
      // Science
      { grade: 'K', subject: 'science', name: 'Weather Patterns', description: 'Understanding different weather types' },
      { grade: '1', subject: 'science', name: 'Animal Habitats', description: 'Where animals live and why' },
      { grade: '2', subject: 'science', name: 'Plant Life Cycle', description: 'How plants grow and reproduce' },
      { grade: '3', subject: 'science', name: 'States of Matter', description: 'Solid, liquid, and gas' },
      { grade: '4', subject: 'science', name: 'Solar System', description: 'Planets and space exploration' },
      { grade: '5', subject: 'science', name: 'Human Body Systems', description: 'How our body works' },
      
      // Social Studies
      { grade: 'K', subject: 'social-studies', name: 'Community Helpers', description: 'People who help in our community' },
      { grade: '1', subject: 'social-studies', name: 'Maps and Globes', description: 'Understanding basic geography' },
      { grade: '2', subject: 'social-studies', name: 'American Symbols', description: 'Flag, eagle, and other symbols' },
      { grade: '3', subject: 'social-studies', name: 'Native Americans', description: 'First peoples of America' },
      { grade: '4', subject: 'social-studies', name: 'State History', description: 'Learning about your state' },
      { grade: '5', subject: 'social-studies', name: 'American Revolution', description: 'Birth of the United States' }
    ];
    
    let topicsCreated = 0;
    
    for (const topicData of additionalTopics) {
      try {
        // Find the grade and subject
        const grade = grades.find(g => g.grade === topicData.grade);
        const subject = subjects.find(s => s.code === topicData.subject);
        
        if (!grade || !subject) {
          console.log(`⚠️ Skipping topic ${topicData.name}: grade ${topicData.grade} or subject ${topicData.subject} not found`);
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
          console.log(`⏭️ Topic ${topicData.name} already exists`);
          continue;
        }
        
        // Create the topic
        const topic = await prisma.topic.create({
          data: {
            name: topicData.name,
            description: topicData.description,
            code: topicData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            gradeId: grade.id,
            subjectId: subject.id,
            difficulty: 'BEGINNER',
            estimatedDuration: 30,
            prerequisites: [],
            learningObjectives: [
              `Understand ${topicData.name.toLowerCase()}`,
              `Apply ${topicData.name.toLowerCase()} concepts`,
              `Demonstrate mastery of ${topicData.name.toLowerCase()}`
            ],
            isActive: true,
            sortOrder: topicsCreated + 1
          }
        });
        
        console.log(`✅ Created topic: ${topic.name} (${topicData.grade} - ${topicData.subject})`);
        topicsCreated++;
        
      } catch (error) {
        console.error(`❌ Error creating topic ${topicData.name}:`, error.message);
      }
    }
    
    // Create some educational resources
    const resources = [
      {
        title: 'Khan Academy Kids',
        description: 'Free educational app for young learners',
        type: 'INTERACTIVE',
        url: 'https://www.khanacademykids.org/',
        ageMin: 3,
        ageMax: 7
      },
      {
        title: 'Scratch Programming',
        description: 'Visual programming language for kids',
        type: 'INTERACTIVE',
        url: 'https://scratch.mit.edu/',
        ageMin: 8,
        ageMax: 16
      },
      {
        title: 'National Geographic Kids',
        description: 'Educational content about animals and nature',
        type: 'READING',
        url: 'https://kids.nationalgeographic.com/',
        ageMin: 6,
        ageMax: 14
      }
    ];
    
    let resourcesCreated = 0;
    
    for (const resourceData of resources) {
      try {
        const existingResource = await prisma.educationalResource.findFirst({
          where: { title: resourceData.title }
        });
        
        if (existingResource) {
          console.log(`⏭️ Resource ${resourceData.title} already exists`);
          continue;
        }
        
        const resource = await prisma.educationalResource.create({
          data: {
            title: resourceData.title,
            description: resourceData.description,
            type: resourceData.type,
            url: resourceData.url,
            ageMin: resourceData.ageMin,
            ageMax: resourceData.ageMax,
            difficulty: 'BEGINNER',
            isActive: true,
            metadata: {
              source: 'manual',
              quality: 'high',
              lastVerified: new Date().toISOString()
            }
          }
        });
        
        console.log(`✅ Created resource: ${resource.title}`);
        resourcesCreated++;
        
      } catch (error) {
        console.error(`❌ Error creating resource ${resourceData.title}:`, error.message);
      }
    }
    
    // Final summary
    console.log('\n🎉 Master data creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Topics created: ${topicsCreated}`);
    console.log(`   - Resources created: ${resourcesCreated}`);
    
    // Get final counts
    const finalCounts = await Promise.all([
      prisma.gradeLevel.count(),
      prisma.subject.count(),
      prisma.topic.count(),
      prisma.educationalResource.count()
    ]);
    
    console.log(`\n📈 Total master data:`);
    console.log(`   - Grades: ${finalCounts[0]}`);
    console.log(`   - Subjects: ${finalCounts[1]}`);
    console.log(`   - Topics: ${finalCounts[2]}`);
    console.log(`   - Resources: ${finalCounts[3]}`);
    
  } catch (error) {
    console.error('❌ Error creating master data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createComprehensiveMasterData();