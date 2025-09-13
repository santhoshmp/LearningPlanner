const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test credentials
const CHILD_CREDENTIALS = {
  username: 'testchild',
  pin: '1234'
};

async function testChildStudyPlanEndpoint() {
  console.log('🧪 TESTING CHILD STUDY PLAN ENDPOINT');
  console.log('=====================================\n');
  console.log('Starting test...');

  try {
    // 1. Login as child
    console.log('🔐 Logging in as child...');
    const loginResponse = await axios.post(`${API_BASE}/auth/child/login-legacy`, {
      username: CHILD_CREDENTIALS.username,
      pin: CHILD_CREDENTIALS.pin
    });

    const childToken = loginResponse.data.accessToken;
    const childId = loginResponse.data.child.id;
    console.log('✅ Child login successful');
    console.log('Child ID:', childId);
    console.log('Child Name:', loginResponse.data.child.name);

    // 2. Get all study plans for the child
    console.log('\n📚 Getting all study plans for child...');
    const allPlansResponse = await axios.get(`${API_BASE}/study-plans/child/${childId}`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    
    console.log('✅ All study plans retrieved successfully');
    console.log('Response structure:', JSON.stringify(allPlansResponse.data, null, 2));
    
    const studyPlans = allPlansResponse.data.plans || allPlansResponse.data;
    console.log('Number of plans:', studyPlans.length);
    
    if (studyPlans.length === 0) {
      console.log('⚠️ No study plans found for this child');
      return;
    }

    // 3. Test the specific plan endpoint
    const firstPlan = studyPlans[0];
    console.log('\n🎯 Testing specific plan endpoint...');
    console.log('Plan ID:', firstPlan.id);
    console.log('Plan Status:', firstPlan.status);

    try {
      const specificPlanResponse = await axios.get(`${API_BASE}/study-plans/child/${childId}/plan/${firstPlan.id}`, {
        headers: { Authorization: `Bearer ${childToken}` }
      });
      
      console.log('✅ Specific study plan retrieved successfully');
      console.log('Plan subject:', specificPlanResponse.data.plan.subject);
      console.log('Activities count:', specificPlanResponse.data.plan.activities?.length || 0);
      console.log('Objectives count:', specificPlanResponse.data.plan.objectives?.length || 0);
      console.log('Progress percentage:', specificPlanResponse.data.plan.progressPercentage);
      console.log('Total time spent:', specificPlanResponse.data.plan.totalTimeSpent, 'minutes');
      console.log('In progress activities:', specificPlanResponse.data.plan.inProgressActivities);
      
    } catch (specificError) {
      console.error('❌ Specific plan endpoint failed:', specificError.response?.data || specificError.message);
      console.log('Status code:', specificError.response?.status);
      
      // Debug information
      console.log('\n🔍 Debug Information:');
      console.log('Requested URL:', `${API_BASE}/study-plans/child/${childId}/plan/${firstPlan.id}`);
      console.log('Child ID from token:', childId);
      console.log('Plan ID:', firstPlan.id);
      console.log('Plan status:', firstPlan.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testChildStudyPlanEndpoint().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});