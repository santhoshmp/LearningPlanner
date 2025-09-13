const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSimpleTopics() {
  console.log('🚀 Creating additional educational topics...');
  
  try {
    // Get existing data
    const grades = await prisma.gradeLevel.findMany();
    const subjects = await prisma.subject.findMany();
    
    console.log(`Found ${grades.length} grades and ${subjects.length} subjects`);
    
    // Helper functions
    const findGrade = (gradeLevel) => grades.find(g => g.grade === gradeLevel);
    const findSubject = (subjectId) => subjects.find(s => s.id === subjectId);
    
    // Simple topics to create
    const topics = [
      // Kindergarten Math
      { grade: 'K', subject: 'mathematics', name: 'Patterns and Sorting', displayName: 'Patterns and Sorting', description: 'Learning to identify and create patterns' },
      { grade: 'K', subject: 'mathematics', name: 'Measurement Basics', displayName: 'Measurement Basics', description: 'Understanding big, small, long, short' },
      
      // 1st Grade Math
      { grade: '1', subject: 'mathematics', name: 'Place Value', displayName: 'Place Value', description: 'Understanding tens and ones' },
      { grade: '1', subject: 'mathematics', name: 'Time and Money', displayName: 'Time and Money', description: 'Basic time telling and coin recognition' },
      
      // English Language Arts
      { grade: 'K', subject: 'english-language-arts', name: 'Rhyming Words', displayName: 'Rhyming Words', description: 'Identifying and creating rhymes' },
      { grade: '1', subject: 'english-language-arts', name: 'Reading Comprehension', displayName: 'Reading Comprehension', description: 'Understanding simple stories' },
      
      // Science
      { grade: 'K', subject: 'science', name: 'Weather Patterns', displayName: 'Weather Patterns', description: 'Understanding different weather types' },
      { grade: '1', subject: 'science', name: 'Animal Habitats', displayName: 'Animal Habitats', description: 'Where animals live and why' },
      
      // Social Studies
      { grade: 'K', subject: 'social-studies', name: 'Community Helpers', displayName: 'Community Helpers', description: 'People who help in our community' },
      { grade: '1', subject: 'social-studies', name: 'Maps and Globes', displayName: 'Maps and Globes', description: 'Understanding basic geography' }
    ];
    
    let created = 0;
    
    for (const topicData of topics) {
      try {
        const grade = findGrade(topicData.grade);
        const subject = findSubject(topicData.subject);
        
        if (!grade || !subject) {
          console.log(`⚠️ Skipping ${topicData.name}: grade/subject not found`);
          continue;
        }
        
        // Check if exists
        const existing = await prisma.topic.findFirst({
          where: {
            name: topicData.name,
            gradeId: grade.id,
            subjectId: subject.id
          }
        });
        
        if (existing) {
          console.log(`⏭️ ${topicData.name} already exists`);
          continue;
        }
        
        // Create topic
        const topic = await prisma.topic.create({
          data: {
            name: topicData.name,
            displayName: topicData.displayName,
            description: topicData.description,
            gradeId: grade.id,
            subjectId: subject.id,
            difficulty: 'BEGINNER',
            estimatedHours: 1,
            prerequisites: [],
            learningObjectives: [
              `Understand ${topicData.name.toLowerCase()}`,
              `Apply ${topicData.name.toLowerCase()} concepts`
            ],
            skills: [],
            assessmentCriteria: [],
            isActive: true,
            sortOrder: created + 100
          }
        });
        
        console.log(`✅ Created: ${topic.displayName} (${topicData.grade} - ${topicData.subject})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating ${topicData.name}:`, error.message);
      }
    }
    
    // Final summary
    const counts = {
      grades: await prisma.gradeLevel.count(),
      subjects: await prisma.subject.count(),
      topics: await prisma.topic.count(),
      resources: await prisma.educationalResource.count()
    };
    
    console.log(`\n🎉 Created ${created} new topics!`);
    console.log(`📊 Total master data:`);
    console.log(`   - Grades: ${counts.grades}`);
    console.log(`   - Subjects: ${counts.subjects}`);
    console.log(`   - Topics: ${counts.topics}`);
    console.log(`   - Resources: ${counts.resources}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleTopics();