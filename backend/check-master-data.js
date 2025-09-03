const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMasterData() {
  console.log('=== CHECKING MASTER DATA ===\n');

  // Check grades
  const grades = await prisma.gradeLevel.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log('📚 GRADES:');
  grades.forEach(grade => {
    console.log(`  - ${grade.grade}: ${grade.displayName}`);
  });
  console.log(`Total grades: ${grades.length}\n`);

  // Check subjects
  const subjects = await prisma.subject.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  console.log('📖 SUBJECTS:');
  subjects.forEach(subject => {
    console.log(`  - ${subject.name}: ${subject.displayName} (${subject.category})`);
  });
  console.log(`Total subjects: ${subjects.length}\n`);

  // Check topics
  const topics = await prisma.topic.findMany({
    include: {
      grade: true,
      subject: true
    },
    orderBy: { sortOrder: 'asc' }
  });
  console.log('📝 TOPICS:');
  topics.forEach(topic => {
    console.log(`  - ${topic.name}: ${topic.displayName} (${topic.grade.grade} - ${topic.subject.name})`);
  });
  console.log(`Total topics: ${topics.length}\n`);

  // Check resources
  const resources = await prisma.topicResource.findMany({
    include: {
      topic: {
        include: {
          grade: true,
          subject: true
        }
      }
    }
  });
  console.log('🔗 RESOURCES:');
  resources.forEach(resource => {
    console.log(`  - ${resource.title}: ${resource.resourceType} (${resource.topic.grade.grade} - ${resource.topic.subject.name})`);
  });
  console.log(`Total resources: ${resources.length}\n`);

  await prisma.$disconnect();
}

checkMasterData().catch(console.error);