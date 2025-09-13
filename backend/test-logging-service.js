const { studyPlanLoggingService } = require('./dist/services/studyPlanLoggingService');

async function testLoggingService() {
  console.log('🔍 Testing Study Plan Logging Service...\n');

  try {
    // Test study plan access logging
    console.log('Testing study plan access logging...');
    await studyPlanLoggingService.logStudyPlanAccess({
      childId: 'test-child-123',
      planId: 'test-plan-456',
      action: 'ACCESS_PLANS',
      success: true,
      responseTime: 150,
      userAgent: 'Test-Agent/1.0',
      ipAddress: '127.0.0.1',
      sessionId: 'test-session-789'
    });
    console.log('✅ Study plan access logged successfully');

    // Test progress update logging
    console.log('Testing progress update logging...');
    await studyPlanLoggingService.logProgressUpdate({
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
    });
    console.log('✅ Progress update logged successfully');

    // Test dashboard access logging
    console.log('Testing dashboard access logging...');
    await studyPlanLoggingService.logDashboardAccess({
      childId: 'test-child-123',
      action: 'DASHBOARD_ACCESS',
      success: true,
      dataReturned: {
        studyPlansCount: 3,
        progressRecordsCount: 15,
        streaksCount: 2,
        badgesCount: 5
      },
      responseTime: 180,
      cacheHit: false
    });
    console.log('✅ Dashboard access logged successfully');

    // Test database performance logging
    console.log('Testing database performance logging...');
    await studyPlanLoggingService.logDatabasePerformance({
      operation: 'get_child_study_plans',
      table: 'study_plans',
      queryType: 'SELECT',
      executionTime: 45,
      recordsAffected: 3,
      queryComplexity: 'LOW',
      childId: 'test-child-123'
    });
    console.log('✅ Database performance logged successfully');

    // Test database operation monitoring wrapper
    console.log('Testing database operation monitoring wrapper...');
    const result = await studyPlanLoggingService.monitorDatabaseOperation(
      'test_operation',
      'test_table',
      'SELECT',
      async () => {
        // Simulate database operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 'test-result', data: 'test-data' };
      },
      { childId: 'test-child-123' }
    );
    console.log('✅ Database operation monitoring wrapper works');
    console.log(`   Result: ${JSON.stringify(result)}`);

    console.log('\n🎉 All logging service tests passed!');

  } catch (error) {
    console.error('❌ Logging service test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testLoggingService().catch(console.error);
}

module.exports = { testLoggingService };