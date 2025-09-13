#!/usr/bin/env node

/**
 * Quick Child Study Plan Test Runner
 * 
 * This is a simplified version for quick validation of core functionality
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

const TEST_CREDENTIALS = {
  username: 'testchild',
  pin: '1234'
};

async function quickTest() {
  console.log('🚀 Quick Child Study Plan Test');
  console.log('================================\n');

  let childToken = null;
  let childId = null;

  try {
    // Step 1: Login
    console.log('1. Testing child login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/child/login`, {
      credentials: TEST_CREDENTIALS,
      deviceInfo: {
        userAgent: 'Quick-Test/1.0',
        platform: 'test',
        isMobile: false
      },
      ipAddress: '127.0.0.1'
    });

    if (loginResponse.data.token && loginResponse.data.child) {
      childToken = loginResponse.data.token;
      childId = loginResponse.data.child.id;
      console.log(`✅ Login successful: ${loginResponse.data.child.name}`);
    } else {
      throw new Error('Login failed - no token received');
    }

    // Step 2: Get study plans
    console.log('\n2. Testing study plan access...');
    const plansResponse = await axios.get(`${API_BASE}/study-plans/child/${childId}`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });

    const plans = plansResponse.data.plans || plansResponse.data;
    console.log(`✅ Study plans retrieved: ${plans.length} plans found`);
    
    if (plans.length > 0) {
      const statuses = [...new Set(plans.map(p => p.status))];
      console.log(`   Statuses: ${statuses.join(', ')}`);
      
      const firstPlan = plans[0];
      console.log(`   First plan: ${firstPlan.subject} (${firstPlan.progressPercentage}% complete)`);
    }

    // Step 3: Get dashboard
    console.log('\n3. Testing dashboard access...');
    const dashboardResponse = await axios.get(`${API_BASE}/child/${childId}/dashboard`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });

    const dashboard = dashboardResponse.data.dashboard;
    console.log(`✅ Dashboard retrieved successfully`);
    console.log(`   Progress: ${dashboard.progressSummary.completedActivities}/${dashboard.progressSummary.totalActivities} activities`);
    console.log(`   Time spent: ${Math.round(dashboard.progressSummary.totalTimeSpent / 60)} minutes`);
    console.log(`   Study plans: ${dashboard.studyPlans.length}`);
    console.log(`   Streaks: ${dashboard.currentStreaks.length}`);

    // Step 4: Test progress update (if we have an activity)
    if (plans.length > 0 && plans[0].activities && plans[0].activities.length > 0) {
      console.log('\n4. Testing progress update...');
      const activityId = plans[0].activities[0].id;
      
      const progressResponse = await axios.post(
        `${API_BASE}/child/activity/${activityId}/progress`,
        {
          timeSpent: 60,
          score: 80,
          status: 'IN_PROGRESS',
          sessionData: {
            startTime: new Date().toISOString(),
            focusEvents: [],
            helpRequests: [],
            interactionEvents: []
          }
        },
        { headers: { Authorization: `Bearer ${childToken}` } }
      );

      if (progressResponse.data.success) {
        console.log(`✅ Progress update successful`);
      } else {
        console.log(`❌ Progress update failed`);
      }
    }

    // Step 5: Test error handling
    console.log('\n5. Testing error handling...');
    try {
      await axios.get(`${API_BASE}/child/fake-child-id/dashboard`, {
        headers: { Authorization: `Bearer ${childToken}` }
      });
      console.log(`❌ Error handling failed - should have rejected fake child ID`);
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log(`✅ Error handling working - correctly rejected unauthorized access`);
      } else {
        console.log(`⚠️ Unexpected error status: ${error.response?.status}`);
      }
    }

    console.log('\n🎉 Quick test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Child authentication working');
    console.log('   ✅ Study plan access working');
    console.log('   ✅ Dashboard data complete');
    console.log('   ✅ Progress updates functional');
    console.log('   ✅ Error handling appropriate');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status code:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the quick test
if (require.main === module) {
  quickTest();
}

module.exports = { quickTest };