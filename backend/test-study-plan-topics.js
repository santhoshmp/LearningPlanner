const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testStudyPlanTopics() {
  console.log('🧪 TESTING STUDY PLAN TOPIC AVAILABILITY');
  console.log('=========================================\n');

  try {
    // Get a parent user
    const parent = await prisma.user.findFirst({
      where: { role: 'PARENT' }
    });

    if (!parent) {
      console.log('❌ No parent user found');
      return;
    }

    // Create a valid JWT token
    const token = jwt.sign(
      { userId: parent.id, role: parent.role }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Test different grade-subject combinations
    const testCombinations = [
      { grade: 'K', subject: 'mathematics' },
      { grade: '4', subject: 'mathematics' },
      { grade: '1', subject: 'english-language-arts' },
      { grade: '5', subject: 'science' },
      { grade: '9', subject: 'social-studies' }
    ];

    for (const combo of testCombinations) {
      console.log(`📝 Testing ${combo.grade} - ${combo.subject}:`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/master-data-simple/topics/by-subject/${combo.grade}/${combo.subject}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const topics = await response.json();
          console.log(`   ✅ Found ${topics.length} topics:`);
          topics.forEach(topic => {
            console.log(`      - ${topic.displayName}`);
          });
        } else {
          console.log(`   ❌ API failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log();
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStudyPlanTopics();