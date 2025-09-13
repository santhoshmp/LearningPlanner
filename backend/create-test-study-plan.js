const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestStudyPlan() {
  try {
    console.log('🎯 Creating test study plan and activities...');
    
    // Find the test child
    const childProfile = await prisma.childProfile.findFirst({
      where: { username: 'testchild' }
    });
    
    if (!childProfile) {
      console.log('❌ No test child found');
      return;
    }
    
    console.log('✅ Test child found:', childProfile.name);
    
    // Create a test study plan
    const studyPlan = await prisma.studyPlan.create({
      data: {
        childId: childProfile.id,
        subject: 'Mathematics',
        difficulty: 'INTERMEDIATE',
        objectives: JSON.stringify([
          {
            id: 'obj_1',
            description: 'Master basic arithmetic operations',
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Understand fractions and decimals',
            completed: false
          }
        ]),
        status: 'ACTIVE',
        estimatedDuration: 60
      }
    });
    
    console.log('✅ Study plan created:', studyPlan.id);
    
    // Create test activities
    const activities = [
      {
        title: 'Addition Practice',
        description: 'Practice basic addition problems',
        content: JSON.stringify({
          type: 'quiz',
          data: {
            instructions: 'Solve the following addition problems',
            difficulty: 'intermediate',
            questions: [
              { question: '15 + 27 = ?', answer: '42' },
              { question: '34 + 18 = ?', answer: '52' }
            ]
          }
        }),
        estimatedDuration: 20,
        difficulty: 2,
        prerequisites: JSON.stringify([]),
        completionCriteria: JSON.stringify({
          type: 'completion',
          threshold: 80
        })
      },
      {
        title: 'Subtraction Challenge',
        description: 'Practice subtraction with larger numbers',
        content: JSON.stringify({
          type: 'interactive',
          data: {
            instructions: 'Solve these subtraction problems step by step',
            difficulty: 'intermediate',
            exercises: [
              { problem: '85 - 37', solution: '48' },
              { problem: '92 - 46', solution: '46' }
            ]
          }
        }),
        estimatedDuration: 25,
        difficulty: 2,
        prerequisites: JSON.stringify([]),
        completionCriteria: JSON.stringify({
          type: 'completion',
          threshold: 75
        })
      },
      {
        title: 'Fraction Basics',
        description: 'Introduction to fractions and their representations',
        content: JSON.stringify({
          type: 'text',
          data: {
            instructions: 'Learn about fractions through visual examples',
            difficulty: 'intermediate',
            content: 'A fraction represents a part of a whole...',
            visualAids: ['fraction-circles.png', 'fraction-bars.png']
          }
        }),
        estimatedDuration: 15,
        difficulty: 2,
        prerequisites: JSON.stringify([]),
        completionCriteria: JSON.stringify({
          type: 'completion',
          threshold: 70
        })
      }
    ];
    
    const createdActivities = [];
    for (const activityData of activities) {
      const activity = await prisma.studyActivity.create({
        data: {
          planId: studyPlan.id,
          ...activityData
        }
      });
      createdActivities.push(activity);
      console.log('✅ Activity created:', activity.title, '(ID:', activity.id + ')');
    }
    
    console.log('\n🎉 Test study plan setup completed!');
    console.log('Study Plan ID:', studyPlan.id);
    console.log('Activities created:', createdActivities.length);
    console.log('Child ID:', childProfile.id);
    
    return {
      studyPlan,
      activities: createdActivities,
      child: childProfile
    };
    
  } catch (error) {
    console.error('❌ Failed to create test study plan:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createTestStudyPlan();