const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdditionalTopics() {
  console.log('🚀 Creating additional educational topics...');
  
  try {
    // Get existing data
    const grades = await prisma.gradeLevel.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    // Helper function to find grade by grade level
    const findGrade = (gradeLevel) => grades.find(g => g.grade === gradeLevel);
    
    // Helper function to find subject by id
    const findSubject = (subjectId) => subjects.find(s => s.id === subjectId);
    
    // Create additional topics
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
      
      // English Language Arts
      { grade: 'K', subject: 'english-language-arts', name: 'Rhyming Words', description: 'Identifying and creating rhymes' },
      { grade: '1', subject: 'english-language-arts', name: 'Reading Comprehension', description: 'Understanding simple stories' },
      { grade: '2', subject: 'english-language-arts', name: 'Sentence Structure', description: 'Building complete sentences' },
      
      // Science
      { grade: 'K', subject: 'science', name: 'Weather Patterns', description: 'Understanding different weather types' },
      { grade: '1', subject: 'science', name: 'Animal Habitats', description: 'Where animals live and why' },
      { grade: '2', subject: 'science', name: 'Plant Life Cycle', description: 'How plants grow and reproduce' },
      
      // Social Studies
      { grade: 'K', subject: 'social-studies', name: 'Community Helpers', description: 'People who help in our community' },
      { grade: '1', subject: 'social-studies', name: 'Maps and Globes', description: 'Understanding basic geography' },
      { grade: '2', subject: 'social-studies', name: 'American Symbols', description: 'Flag, eagle, and other symbols' }
    ];
    
    let topicsCreated = 0;
    
    for (const topicData of additionalTopics) {
      try {
        // Find the grade and subject
        const grade = findGrade(topicData.grade);
        const subject = findSubject(topicData.subject);
        
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
              `Apply ${topicData.name.toLowerCase()} concepts`
            ],
            isActive: true,
            sortOrder: topicsCreated + 100
          }
        });
        
        console.log(`✅ Created topic: ${topic.name} (${topicData.grade} - ${topicData.subject})`);
        topicsCreated++;
        
      } catch (error) {
        console.error(`❌ Error creating topic ${topicData.name}:`, error.message);
      }
    }
    
    // Get final counts
    const finalCounts = {
      grades: await prisma.gradeLevel.count(),
      subjects: await prisma.subject.count(),
      topics: await prisma.topic.count(),
      resources: await prisma.educationalResource.count()
    };
    
    console.log('\n🎉 Additional topics creation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Topics created: ${topicsCreated}`);
    console.log(`\n📈 Total master data:`);
    console.log(`   - Grades: ${finalCounts.grades}`);
    console.log(`   - Subjects: ${finalCounts.subjects}`);
    console.log(`   - Topics: ${finalCounts.topics}`);
    console.log(`   - Resources: ${finalCounts.resources}`);
    
  } catch (error) {
    console.error('❌ Error creating additional topics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdditionalTopics();