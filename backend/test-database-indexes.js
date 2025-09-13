const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseIndexes() {
  console.log('🔍 Testing Database Index Performance...\n');

  try {
    // First, let's check if we have test data
    const childCount = await prisma.childProfile.count();
    const studyPlanCount = await prisma.studyPlan.count();
    const progressRecordCount = await prisma.progressRecord.count();
    const learningStreakCount = await prisma.learningStreak.count();

    console.log('📊 Current Data Counts:');
    console.log(`- Children: ${childCount}`);
    console.log(`- Study Plans: ${studyPlanCount}`);
    console.log(`- Progress Records: ${progressRecordCount}`);
    console.log(`- Learning Streaks: ${learningStreakCount}\n`);

    if (childCount === 0) {
      console.log('⚠️  No test data found. Creating sample data for index testing...\n');
      await createTestData();
    }

    // Test 1: Study Plans by Child ID (should use new index)
    console.log('🧪 Test 1: Study Plans by Child ID Query Performance');
    const child = await prisma.childProfile.findFirst();
    if (child) {
      const startTime = Date.now();
      const studyPlans = await prisma.studyPlan.findMany({
        where: { childId: child.id },
        include: {
          activities: {
            include: {
              progressRecords: {
                where: { childId: child.id }
              }
            }
          }
        }
      });
      const endTime = Date.now();
      console.log(`✅ Found ${studyPlans.length} study plans in ${endTime - startTime}ms`);
    }

    // Test 2: Progress Records by Child and Activity (should use existing unique index)
    console.log('\n🧪 Test 2: Progress Records Lookup Performance');
    const activity = await prisma.studyActivity.findFirst();
    if (child && activity) {
      const startTime = Date.now();
      const progressRecord = await prisma.progressRecord.findUnique({
        where: {
          childId_activityId: {
            childId: child.id,
            activityId: activity.id
          }
        }
      });
      const endTime = Date.now();
      console.log(`✅ Progress record lookup completed in ${endTime - startTime}ms`);
    }

    // Test 3: Learning Streaks by Child and Type (should use existing unique index)
    console.log('\n🧪 Test 3: Learning Streaks Query Performance');
    if (child) {
      const startTime = Date.now();
      const streaks = await prisma.learningStreak.findMany({
        where: {
          childId: child.id,
          streakType: 'DAILY'
        }
      });
      const endTime = Date.now();
      console.log(`✅ Found ${streaks.length} daily streaks in ${endTime - startTime}ms`);
    }

    // Test 4: Complex dashboard query (combines all indexes)
    console.log('\n🧪 Test 4: Complex Dashboard Query Performance');
    if (child) {
      const startTime = Date.now();
      
      const [studyPlans, streaks, progressSummary] = await Promise.all([
        // Study plans with progress (uses childId index)
        prisma.studyPlan.findMany({
          where: { childId: child.id },
          include: {
            activities: {
              include: {
                progressRecords: {
                  where: { childId: child.id }
                }
              }
            }
          }
        }),
        
        // Learning streaks (uses childId, streakType index)
        prisma.learningStreak.findMany({
          where: { childId: child.id }
        }),
        
        // Progress summary
        prisma.progressRecord.aggregate({
          where: { childId: child.id },
          _count: { id: true },
          _sum: { timeSpent: true },
          _avg: { score: true }
        })
      ]);
      
      const endTime = Date.now();
      console.log(`✅ Dashboard query completed in ${endTime - startTime}ms`);
      console.log(`   - Study Plans: ${studyPlans.length}`);
      console.log(`   - Streaks: ${streaks.length}`);
      console.log(`   - Total Progress Records: ${progressSummary._count.id || 0}`);
    }

    // Test 5: Verify indexes exist in database
    console.log('\n🧪 Test 5: Verifying Database Indexes');
    await verifyIndexes();

    console.log('\n✅ All index performance tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing database indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestData() {
  // Create a test user and child
  const user = await prisma.user.upsert({
    where: { email: 'test-index@example.com' },
    update: {},
    create: {
      email: 'test-index@example.com',
      passwordHash: 'test-hash',
      firstName: 'Test',
      lastName: 'User'
    }
  });

  const child = await prisma.childProfile.upsert({
    where: { username: 'test-index-child' },
    update: {},
    create: {
      parentId: user.id,
      name: 'Test Child',
      age: 8,
      gradeLevel: '3',
      username: 'test-index-child',
      pinHash: 'test-pin-hash'
    }
  });

  // Create multiple study plans
  for (let i = 1; i <= 3; i++) {
    const studyPlan = await prisma.studyPlan.upsert({
      where: { id: `test-plan-${i}` },
      update: {},
      create: {
        id: `test-plan-${i}`,
        childId: child.id,
        subject: `Subject ${i}`,
        difficulty: 'BEGINNER',
        status: 'ACTIVE'
      }
    });

    // Create activities for each plan
    for (let j = 1; j <= 2; j++) {
      const activity = await prisma.studyActivity.upsert({
        where: { id: `test-activity-${i}-${j}` },
        update: {},
        create: {
          id: `test-activity-${i}-${j}`,
          planId: studyPlan.id,
          title: `Activity ${j} for Plan ${i}`,
          description: `Test activity ${j}`,
          estimatedDuration: 30
        }
      });

      // Create progress records
      await prisma.progressRecord.upsert({
        where: {
          childId_activityId: {
            childId: child.id,
            activityId: activity.id
          }
        },
        update: {},
        create: {
          childId: child.id,
          activityId: activity.id,
          status: j === 1 ? 'COMPLETED' : 'IN_PROGRESS',
          score: j === 1 ? 85 : 0,
          timeSpent: j === 1 ? 25 : 10
        }
      });
    }
  }

  // Create learning streaks
  const streakTypes = ['DAILY', 'WEEKLY', 'ACTIVITY_COMPLETION'];
  for (const streakType of streakTypes) {
    await prisma.learningStreak.upsert({
      where: {
        childId_streakType: {
          childId: child.id,
          streakType: streakType
        }
      },
      update: {},
      create: {
        childId: child.id,
        streakType: streakType,
        currentCount: Math.floor(Math.random() * 10) + 1,
        longestCount: Math.floor(Math.random() * 20) + 5
      }
    });
  }

  console.log('✅ Test data created successfully');
}

async function verifyIndexes() {
  try {
    // Query to check if indexes exist
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (
        (tablename = 'study_plans' AND indexname LIKE '%childId%') OR
        (tablename = 'progress_records' AND indexname LIKE '%childId%') OR
        (tablename = 'learning_streaks' AND indexname LIKE '%childId%')
      )
      ORDER BY tablename, indexname;
    `;

    const indexes = await prisma.$queryRawUnsafe(indexQuery);
    
    console.log('📋 Relevant Database Indexes:');
    if (indexes.length === 0) {
      console.log('⚠️  No relevant indexes found');
    } else {
      indexes.forEach(index => {
        console.log(`   - ${index.tablename}.${index.indexname}`);
      });
    }

    // Check for specific indexes we care about
    const studyPlanChildIndex = indexes.find(idx => 
      idx.tablename === 'study_plans' && idx.indexname.includes('childId')
    );
    
    if (studyPlanChildIndex) {
      console.log('✅ Study plans childId index exists');
    } else {
      console.log('❌ Study plans childId index missing');
    }

    const progressRecordIndex = indexes.find(idx => 
      idx.tablename === 'progress_records' && idx.indexname.includes('childId')
    );
    
    if (progressRecordIndex) {
      console.log('✅ Progress records childId index exists');
    } else {
      console.log('❌ Progress records childId index missing');
    }

    const learningStreakIndex = indexes.find(idx => 
      idx.tablename === 'learning_streaks' && idx.indexname.includes('childId')
    );
    
    if (learningStreakIndex) {
      console.log('✅ Learning streaks childId index exists');
    } else {
      console.log('❌ Learning streaks childId index missing');
    }

  } catch (error) {
    console.error('Error verifying indexes:', error.message);
  }
}

// Run the test
testDatabaseIndexes();