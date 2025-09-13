const { PrismaClient } = require('@prisma/client');

async function testLoggingTables() {
  console.log('🔍 Testing Logging Database Tables...\n');

  const prisma = new PrismaClient();

  try {
    // Test that all logging tables exist and can be accessed
    console.log('Testing StudyPlanAccessLog table...');
    const accessLogCount = await prisma.studyPlanAccessLog.count();
    console.log(`✅ StudyPlanAccessLog table accessible (${accessLogCount} records)`);

    console.log('Testing ProgressUpdateLog table...');
    const progressLogCount = await prisma.progressUpdateLog.count();
    console.log(`✅ ProgressUpdateLog table accessible (${progressLogCount} records)`);

    console.log('Testing DashboardAccessLog table...');
    const dashboardLogCount = await prisma.dashboardAccessLog.count();
    console.log(`✅ DashboardAccessLog table accessible (${dashboardLogCount} records)`);

    console.log('Testing DatabasePerformanceLog table...');
    const performanceLogCount = await prisma.databasePerformanceLog.count();
    console.log(`✅ DatabasePerformanceLog table accessible (${performanceLogCount} records)`);

    // Test inserting sample data
    console.log('\nTesting data insertion...');
    
    const testAccessLog = await prisma.studyPlanAccessLog.create({
      data: {
        childId: 'test-child-123',
        planId: 'test-plan-456',
        action: 'ACCESS_PLANS',
        success: true,
        responseTime: 150,
        userAgent: 'Test-Agent/1.0',
        ipAddress: '127.0.0.1',
        sessionId: 'test-session-789'
      }
    });
    console.log(`✅ StudyPlanAccessLog record created: ${testAccessLog.id}`);

    const testProgressLog = await prisma.progressUpdateLog.create({
      data: {
        childId: 'test-child-123',
        activityId: 'test-activity-789',
        planId: 'test-plan-456',
        action: 'PROGRESS_UPDATE',
        success: true,
        previousStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        scoreChange: 85,
        timeSpent: 300,
        responseTime: 200
      }
    });
    console.log(`✅ ProgressUpdateLog record created: ${testProgressLog.id}`);

    const testDashboardLog = await prisma.dashboardAccessLog.create({
      data: {
        childId: 'test-child-123',
        action: 'DASHBOARD_ACCESS',
        success: true,
        studyPlansCount: 3,
        progressRecordsCount: 15,
        streaksCount: 2,
        badgesCount: 5,
        responseTime: 180,
        cacheHit: false
      }
    });
    console.log(`✅ DashboardAccessLog record created: ${testDashboardLog.id}`);

    const testPerformanceLog = await prisma.databasePerformanceLog.create({
      data: {
        operation: 'get_child_study_plans',
        tableName: 'study_plans',
        queryType: 'SELECT',
        executionTime: 45,
        recordsAffected: 3,
        queryComplexity: 'LOW',
        childId: 'test-child-123'
      }
    });
    console.log(`✅ DatabasePerformanceLog record created: ${testPerformanceLog.id}`);

    // Test querying the data
    console.log('\nTesting data retrieval...');
    
    const recentAccessLogs = await prisma.studyPlanAccessLog.findMany({
      where: { childId: 'test-child-123' },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log(`✅ Retrieved ${recentAccessLogs.length} access logs`);

    const recentProgressLogs = await prisma.progressUpdateLog.findMany({
      where: { childId: 'test-child-123' },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    console.log(`✅ Retrieved ${recentProgressLogs.length} progress logs`);

    // Test analytics queries
    console.log('\nTesting analytics queries...');
    
    const accessStats = await prisma.studyPlanAccessLog.groupBy({
      by: ['action', 'success'],
      _count: true,
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    console.log(`✅ Access statistics: ${accessStats.length} groups`);

    const performanceStats = await prisma.databasePerformanceLog.groupBy({
      by: ['operation', 'queryComplexity'],
      _count: true,
      _avg: {
        executionTime: true
      },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    console.log(`✅ Performance statistics: ${performanceStats.length} groups`);

    console.log('\n🎉 All logging table tests passed!');
    console.log('📊 Logging system is ready for comprehensive monitoring');

  } catch (error) {
    console.error('❌ Logging table test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testLoggingTables().catch(console.error);
}

module.exports = { testLoggingTables };