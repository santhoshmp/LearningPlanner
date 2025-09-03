const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAnalyticsTestData() {
  try {
    console.log('Creating analytics test data...\n');

    // First, let's check if we have any users and children
    const users = await prisma.user.findMany({
      include: {
        children: true
      }
    });

    if (users.length === 0) {
      console.log('No users found. Creating test user and child...');
      
      // Create a test parent user
      const testUser = await prisma.user.create({
        data: {
          email: 'testparent@example.com',
          firstName: 'Test',
          lastName: 'Parent',
          role: 'PARENT',
          passwordHash: '$2b$10$example.hash.for.testing',
          isEmailVerified: true
        }
      });

      // Create a test child
      const testChild = await prisma.childProfile.create({
        data: {
          name: 'John',
          age: 11,
          gradeLevel: '5',
          username: 'johndoe123',
          pinHash: '$2b$10$example.pin.hash',
          parentId: testUser.id,
          learningStyle: 'VISUAL',
          preferences: {},
          skillProfile: {}
        }
      });

      console.log(`✅ Created test user: ${testUser.email}`);
      console.log(`✅ Created test child: ${testChild.name} (ID: ${testChild.id})`);
    }

    // Get the first child for creating test data
    const child = await prisma.childProfile.findFirst();
    if (!child) {
      throw new Error('No child profile found');
    }

    console.log(`Using child: ${child.name} (ID: ${child.id})`);

    // Create some study plans
    console.log('\n1. Creating study plans...');
    
    const studyPlans = [
      {
        childId: child.id,
        subject: 'Mathematics',
        difficulty: 'INTERMEDIATE',
        status: 'ACTIVE',
        objectives: [
          { id: 'obj_1', description: 'Master fractions and decimals', completed: false },
          { id: 'obj_2', description: 'Understand multiplication and division', completed: true }
        ],
        estimatedDuration: 30
      },
      {
        childId: child.id,
        subject: 'Science',
        difficulty: 'INTERMEDIATE',
        status: 'ACTIVE',
        objectives: [
          { id: 'obj_1', description: 'Learn about ecosystems', completed: false },
          { id: 'obj_2', description: 'Understand human body systems', completed: false }
        ],
        estimatedDuration: 25
      },
      {
        childId: child.id,
        subject: 'English',
        difficulty: 'INTERMEDIATE',
        status: 'COMPLETED',
        objectives: [
          { id: 'obj_1', description: 'Improve reading comprehension', completed: true },
          { id: 'obj_2', description: 'Practice creative writing', completed: true }
        ],
        estimatedDuration: 35
      }
    ];

    for (const planData of studyPlans) {
      const plan = await prisma.studyPlan.create({
        data: planData
      });
      console.log(`  ✅ Created ${planData.subject} study plan (ID: ${plan.id})`);
    }

    // Create study activities
    console.log('\n2. Creating study activities...');
    
    const plans = await prisma.studyPlan.findMany({
      where: { childId: child.id }
    });

    const activities = [];
    for (const plan of plans) {
      const planActivities = [
        {
          planId: plan.id,
          title: `${plan.subject} Activity 1`,
          description: `Interactive ${plan.subject.toLowerCase()} learning activity`,
          content: {
            type: 'interactive',
            data: {
              instructions: `Learn ${plan.subject.toLowerCase()} concepts`,
              difficulty: plan.difficulty.toLowerCase()
            }
          },
          estimatedDuration: 20,
          difficulty: 2,
          prerequisites: [],
          completionCriteria: {
            type: 'completion',
            threshold: 80
          }
        },
        {
          planId: plan.id,
          title: `${plan.subject} Activity 2`,
          description: `${plan.subject} practice problems`,
          content: {
            type: 'quiz',
            data: {
              instructions: `Practice ${plan.subject.toLowerCase()} problems`,
              difficulty: plan.difficulty.toLowerCase()
            }
          },
          estimatedDuration: 15,
          difficulty: 2,
          prerequisites: [],
          completionCriteria: {
            type: 'completion',
            threshold: 80
          }
        }
      ];

      for (const activityData of planActivities) {
        const activity = await prisma.studyActivity.create({
          data: activityData
        });
        activities.push(activity);
        console.log(`  ✅ Created activity: ${activity.title} (ID: ${activity.id})`);
      }
    }

    // Create progress records
    console.log('\n3. Creating progress records...');
    
    const progressData = [];
    const now = new Date();
    
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const daysAgo = Math.floor(Math.random() * 30); // Random day in last 30 days
      const completedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const isCompleted = Math.random() > 0.3; // 70% completion rate
      const score = isCompleted ? Math.floor(Math.random() * 40) + 60 : null; // 60-100 score range
      const timeSpent = Math.floor(Math.random() * 20) + 10; // 10-30 minutes
      
      const progressRecord = await prisma.progressRecord.create({
        data: {
          childId: child.id,
          activityId: activity.id,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          score: score,
          timeSpent: timeSpent,
          attempts: Math.floor(Math.random() * 3) + 1,
          completedAt: isCompleted ? completedAt : null,
          updatedAt: completedAt
        }
      });
      
      progressData.push(progressRecord);
      console.log(`  ✅ Created progress record for ${activity.title}: ${progressRecord.status} (Score: ${score || 'N/A'})`);
    }

    // Create some help requests
    console.log('\n4. Creating help requests...');
    
    const helpRequests = [
      {
        childId: child.id,
        activityId: activities[0].id,
        question: "I don't understand how to solve this fraction problem",
        response: "Let me help you break down fractions step by step...",
        isResolved: true
      },
      {
        childId: child.id,
        activityId: activities[1].id,
        question: "What is the difference between multiplication and division?",
        response: "Great question! Multiplication and division are opposite operations...",
        isResolved: true
      },
      {
        childId: child.id,
        activityId: activities[2].id,
        question: "Can you explain photosynthesis?",
        response: "Photosynthesis is how plants make their own food using sunlight...",
        isResolved: true
      }
    ];

    for (const helpData of helpRequests) {
      const helpRequest = await prisma.helpRequest.create({
        data: helpData
      });
      console.log(`  ✅ Created help request: "${helpRequest.question.substring(0, 50)}..."`);
    }

    // Create achievement records
    console.log('\n5. Creating achievement records...');
    
    const achievements = [
      {
        childId: child.id,
        type: 'STREAK',
        title: '7-Day Streak',
        description: 'Completed activities for 7 consecutive days',
        earnedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        childId: child.id,
        type: 'BADGE',
        title: 'Perfect Score',
        description: 'Achieved 100% on a Mathematics activity',
        earnedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        childId: child.id,
        type: 'MILESTONE',
        title: 'English Expert',
        description: 'Completed all English activities with high scores',
        earnedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ];

    for (const achievementData of achievements) {
      const achievement = await prisma.achievement.create({
        data: achievementData
      });
      console.log(`  ✅ Created achievement: ${achievement.title}`);
    }

    console.log('\n🎉 Analytics test data creation completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Child: ${child.name} (ID: ${child.id})`);
    console.log(`   - Study Plans: ${studyPlans.length}`);
    console.log(`   - Activities: ${activities.length}`);
    console.log(`   - Progress Records: ${progressData.length}`);
    console.log(`   - Help Requests: ${helpRequests.length}`);
    console.log(`   - Achievements: ${achievements.length}`);
    
    console.log('\n🔗 You can now test the analytics dashboard with real data!');
    console.log(`   Child ID to use: ${child.id}`);

  } catch (error) {
    console.error('❌ Error creating analytics test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAnalyticsTestData();