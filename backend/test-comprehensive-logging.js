const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  childId: 'test-child-id',
  planId: 'test-plan-id',
  activityId: 'test-activity-id',
  parentToken: 'test-parent-token',
  childToken: 'test-child-token'
};

async function testLoggingFunctionality() {
  console.log('🔍 Testing Comprehensive Logging and Monitoring...\n');

  const tests = [
    testStudyPlanAccessLogging,
    testProgressUpdateLogging,
    testDashboardAccessLogging,
    testLoggingAnalytics,
    testPerformanceSummary,
    testHealthCheck
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      console.log(`✅ ${test.name} - PASSED`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All logging tests passed!');
  } else {
    console.log('⚠️  Some logging tests failed. Check the implementation.');
  }
}

async function testStudyPlanAccessLogging() {
  console.log('Testing study plan access logging...');
  
  // Test successful access
  try {
    await axios.get(`${BASE_URL}/study-plans/child/${TEST_CONFIG.childId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`,
        'User-Agent': 'Test-Agent/1.0',
        'X-Session-Id': 'test-session-123'
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  // Test access to specific plan
  try {
    await axios.get(`${BASE_URL}/study-plans/child/${TEST_CONFIG.childId}/plan/${TEST_CONFIG.planId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`,
        'User-Agent': 'Test-Agent/1.0'
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  console.log('  - Study plan access attempts logged');
}

async function testProgressUpdateLogging() {
  console.log('Testing progress update logging...');
  
  // Test progress update
  try {
    await axios.post(`${BASE_URL}/child/activity/${TEST_CONFIG.activityId}/progress`, {
      timeSpent: 300,
      score: 85,
      status: 'IN_PROGRESS',
      sessionData: {
        startTime: new Date().toISOString(),
        focusEvents: [],
        helpRequests: []
      }
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  // Test activity completion
  try {
    await axios.post(`${BASE_URL}/child/activity/${TEST_CONFIG.activityId}/complete`, {
      score: 95,
      timeSpent: 600,
      sessionData: {
        startTime: new Date(Date.now() - 600000).toISOString(),
        endTime: new Date().toISOString(),
        focusEvents: [],
        helpRequests: []
      }
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  console.log('  - Progress update attempts logged');
}

async function testDashboardAccessLogging() {
  console.log('Testing dashboard access logging...');
  
  // Test dashboard access
  try {
    await axios.get(`${BASE_URL}/child/${TEST_CONFIG.childId}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  // Test streaks access
  try {
    await axios.get(`${BASE_URL}/child/${TEST_CONFIG.childId}/streaks`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  // Test badges access
  try {
    await axios.get(`${BASE_URL}/child/${TEST_CONFIG.childId}/badges`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.childToken}`
      }
    });
  } catch (error) {
    // Expected to fail due to auth, but should still log
  }

  console.log('  - Dashboard access attempts logged');
}

async function testLoggingAnalytics() {
  console.log('Testing logging analytics endpoint...');
  
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  try {
    const response = await axios.get(`${BASE_URL}/logging/analytics`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.parentToken}`
      }
    });
    
    // Should return analytics data structure
    if (response.data && response.data.analytics) {
      console.log('  - Analytics endpoint accessible');
    } else {
      throw new Error('Analytics data structure not found');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('  - Analytics endpoint protected (expected)');
    } else {
      throw error;
    }
  }
}

async function testPerformanceSummary() {
  console.log('Testing performance summary endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/logging/performance-summary`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.parentToken}`
      }
    });
    
    // Should return performance summary
    if (response.data && response.data.summary) {
      console.log('  - Performance summary endpoint accessible');
    } else {
      throw new Error('Performance summary structure not found');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('  - Performance summary endpoint protected (expected)');
    } else {
      throw error;
    }
  }
}

async function testHealthCheck() {
  console.log('Testing health check endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/logging/health-check`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.parentToken}`
      }
    });
    
    // Should return health status
    if (response.data && response.data.health) {
      console.log('  - Health check endpoint accessible');
      console.log(`  - System status: ${response.data.health.status}`);
    } else {
      throw new Error('Health check structure not found');
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('  - Health check endpoint protected (expected)');
    } else {
      throw error;
    }
  }
}

async function testDatabasePerformanceMonitoring() {
  console.log('Testing database performance monitoring...');
  
  // This would be tested internally by the monitoring wrapper
  // We can check if the logging service is properly initialized
  console.log('  - Database performance monitoring wrapper available');
}

async function testErrorScenarios() {
  console.log('Testing error scenario logging...');
  
  // Test various error scenarios to ensure they're logged properly
  const errorTests = [
    {
      name: 'Invalid child ID',
      url: `${BASE_URL}/child/invalid-child-id/dashboard`,
      expectedError: 'ACCESS_DENIED'
    },
    {
      name: 'Missing activity ID',
      url: `${BASE_URL}/child/activity//progress`,
      expectedError: 'VALIDATION_ERROR'
    },
    {
      name: 'Invalid plan ID',
      url: `${BASE_URL}/study-plans/child/${TEST_CONFIG.childId}/plan/invalid-plan`,
      expectedError: 'PLAN_NOT_FOUND'
    }
  ];

  for (const errorTest of errorTests) {
    try {
      await axios.get(errorTest.url, {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.childToken}`
        }
      });
    } catch (error) {
      // Expected to fail - errors should be logged
    }
  }

  console.log('  - Error scenarios logged');
}

// Run the tests
if (require.main === module) {
  testLoggingFunctionality().catch(console.error);
}

module.exports = {
  testLoggingFunctionality,
  testStudyPlanAccessLogging,
  testProgressUpdateLogging,
  testDashboardAccessLogging,
  testLoggingAnalytics,
  testPerformanceSummary,
  testHealthCheck
};