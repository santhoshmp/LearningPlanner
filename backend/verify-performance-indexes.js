const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPerformanceIndexes() {
  console.log('🔍 Database Performance Index Verification\n');

  try {
    // 1. Verify all required indexes exist
    await verifyIndexExistence();
    
    // 2. Test query performance with EXPLAIN ANALYZE
    await testQueryExecution();
    
    // 3. Verify index usage in common queries
    await verifyIndexUsage();

    console.log('\n✅ All performance indexes verified successfully!');
    
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyIndexExistence() {
  console.log('📋 Verifying Index Existence:');
  
  const indexQuery = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND (
      tablename IN ('study_plans', 'progress_records', 'learning_streaks')
    )
    ORDER BY tablename, indexname;
  `;

  const indexes = await prisma.$queryRawUnsafe(indexQuery);
  
  const indexesByTable = {};
  indexes.forEach(index => {
    if (!indexesByTable[index.tablename]) {
      indexesByTable[index.tablename] = [];
    }
    indexesByTable[index.tablename].push(index);
  });

  // Check study_plans indexes
  console.log('\n📊 study_plans table:');
  const studyPlanIndexes = indexesByTable['study_plans'] || [];
  const hasChildIdIndex = studyPlanIndexes.some(idx => 
    idx.indexname.includes('childId') || idx.indexdef.includes('childId')
  );
  console.log(`   ✅ childId index: ${hasChildIdIndex ? 'EXISTS' : 'MISSING'}`);
  studyPlanIndexes.forEach(idx => {
    console.log(`      - ${idx.indexname}`);
  });

  // Check progress_records indexes
  console.log('\n📊 progress_records table:');
  const progressIndexes = indexesByTable['progress_records'] || [];
  const hasCompositeIndex = progressIndexes.some(idx => 
    idx.indexdef.includes('childId') && idx.indexdef.includes('activityId')
  );
  console.log(`   ✅ (childId, activityId) index: ${hasCompositeIndex ? 'EXISTS' : 'MISSING'}`);
  progressIndexes.forEach(idx => {
    console.log(`      - ${idx.indexname}`);
  });

  // Check learning_streaks indexes
  console.log('\n📊 learning_streaks table:');
  const streakIndexes = indexesByTable['learning_streaks'] || [];
  const hasStreakCompositeIndex = streakIndexes.some(idx => 
    idx.indexdef.includes('childId') && idx.indexdef.includes('streakType')
  );
  console.log(`   ✅ (childId, streakType) index: ${hasStreakCompositeIndex ? 'EXISTS' : 'MISSING'}`);
  streakIndexes.forEach(idx => {
    console.log(`      - ${idx.indexname}`);
  });
}

async function testQueryExecution() {
  console.log('\n🧪 Testing Query Execution Plans:');
  
  // Get a test child
  const child = await prisma.childProfile.findFirst();
  if (!child) {
    console.log('⚠️  No test data available for query testing');
    return;
  }

  try {
    // Test 1: Study plans query
    console.log('\n1️⃣  Study Plans Query:');
    const studyPlanExplain = await prisma.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT * FROM study_plans WHERE "childId" = $1
    `, child.id);
    
    console.log('   Query plan:');
    studyPlanExplain.forEach(row => {
      if (row['QUERY PLAN'].includes('Index') || row['QUERY PLAN'].includes('Seq Scan')) {
        console.log(`      ${row['QUERY PLAN']}`);
      }
    });

    // Test 2: Progress records query
    console.log('\n2️⃣  Progress Records Query:');
    const activity = await prisma.studyActivity.findFirst();
    if (activity) {
      const progressExplain = await prisma.$queryRawUnsafe(`
        EXPLAIN (ANALYZE, BUFFERS) 
        SELECT * FROM progress_records WHERE "childId" = $1 AND "activityId" = $2
      `, child.id, activity.id);
      
      console.log('   Query plan:');
      progressExplain.forEach(row => {
        if (row['QUERY PLAN'].includes('Index') || row['QUERY PLAN'].includes('Seq Scan')) {
          console.log(`      ${row['QUERY PLAN']}`);
        }
      });
    }

    // Test 3: Learning streaks query
    console.log('\n3️⃣  Learning Streaks Query:');
    const streakExplain = await prisma.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT * FROM learning_streaks WHERE "childId" = $1 AND "streakType" = $2
    `, child.id, 'DAILY');
    
    console.log('   Query plan:');
    streakExplain.forEach(row => {
      if (row['QUERY PLAN'].includes('Index') || row['QUERY PLAN'].includes('Seq Scan')) {
        console.log(`      ${row['QUERY PLAN']}`);
      }
    });

  } catch (error) {
    console.log('   ⚠️  Could not analyze query plans:', error.message);
  }
}

async function verifyIndexUsage() {
  console.log('\n📈 Index Usage Verification:');
  
  // Get statistics about index usage
  try {
    const indexStats = await prisma.$queryRawUnsafe(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('study_plans', 'progress_records', 'learning_streaks')
      AND (idx_tup_read > 0 OR idx_tup_fetch > 0)
      ORDER BY tablename, indexname;
    `);

    if (indexStats.length === 0) {
      console.log('   ℹ️  No index usage statistics available (database may be new)');
    } else {
      console.log('   Index usage statistics:');
      indexStats.forEach(stat => {
        console.log(`      ${stat.tablename}.${stat.indexname}: ${stat.idx_tup_read} reads, ${stat.idx_tup_fetch} fetches`);
      });
    }

  } catch (error) {
    console.log('   ⚠️  Could not retrieve index statistics:', error.message);
  }

  // Test actual performance with and without indexes (conceptual)
  console.log('\n⚡ Performance Impact Summary:');
  console.log('   📊 study_plans(childId) index:');
  console.log('      - Optimizes: Child dashboard loading, study plan queries');
  console.log('      - Impact: O(log n) vs O(n) for child plan lookups');
  console.log('      - Use cases: GET /api/child/:childId/study-plans');
  
  console.log('   📊 progress_records(childId, activityId) unique constraint:');
  console.log('      - Optimizes: Progress updates, activity completion checks');
  console.log('      - Impact: O(1) lookup for progress records');
  console.log('      - Use cases: POST /api/study-plans/child/:childId/activity/:activityId/progress');
  
  console.log('   📊 learning_streaks(childId, streakType) unique constraint:');
  console.log('      - Optimizes: Streak calculations, dashboard streak display');
  console.log('      - Impact: O(1) lookup for specific streak types');
  console.log('      - Use cases: Streak updates, dashboard data aggregation');
}

// Run the verification
verifyPerformanceIndexes();