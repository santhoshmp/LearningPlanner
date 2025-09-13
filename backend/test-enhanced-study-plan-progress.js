const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test credentials
const CHILD_CREDENTIALS = {
  username: 'testchild',
  pin: '1234'
};

async function testEnhancedStudyPlanProgress() {
  console.log('🧪 TESTING ENHANCED STUDY PLAN PROGRESS');
  console.log('=======================================\n');

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

    // 2. Get all study plans and verify enhanced progress data
    console.log('\n📚 Testing enhanced progress data...');
    const allPlansResponse = await axios.get(`${API_BASE}/study-plans/child/${childId}`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    
    const plans = allPlansResponse.data.plans;
    console.log('✅ Study plans retrieved successfully');
    console.log('Number of plans:', plans.length);

    if (plans.length > 0) {
      // Test both completed and incomplete plans
      const completedPlan = plans.find(p => p.completedActivities > 0) || plans[0];
      const incompletePlan = plans.find(p => p.completedActivities === 0);
      
      console.log('\n🔍 Testing completed plan:');
      const firstPlan = completedPlan;
      console.log('\n🔍 Verifying enhanced progress fields:');
      console.log('Plan ID:', firstPlan.id);
      console.log('Status:', firstPlan.status);
      
      // Check for enhanced progress fields
      const requiredFields = [
        'totalActivities',
        'completedActivities', 
        'progressPercentage',
        'totalTimeSpent',
        'inProgressActivities'
      ];
      
      let allFieldsPresent = true;
      requiredFields.forEach(field => {
        if (firstPlan.hasOwnProperty(field)) {
          console.log(`✅ ${field}: ${firstPlan[field]}`);
        } else {
          console.log(`❌ Missing field: ${field}`);
          allFieldsPresent = false;
        }
      });
      
      if (allFieldsPresent) {
        console.log('\n✅ All enhanced progress fields are present!');
        
        // Verify progress calculation logic
        const expectedCompleted = firstPlan.activities.filter(activity => 
          activity.progressRecords.some(record => record.status === 'COMPLETED')
        ).length;
        
        const expectedInProgress = firstPlan.activities.filter(activity => 
          activity.progressRecords.some(record => record.status === 'IN_PROGRESS')
        ).length;
        
        const expectedTotalTime = firstPlan.activities.reduce((total, activity) => {
          const activityTime = activity.progressRecords.reduce((actTotal, record) => {
            return actTotal + (record.timeSpent || 0);
          }, 0);
          return total + activityTime;
        }, 0);
        
        console.log('\n🧮 Verifying calculation accuracy:');
        console.log(`Expected completed: ${expectedCompleted}, Actual: ${firstPlan.completedActivities}`);
        console.log(`Expected in progress: ${expectedInProgress}, Actual: ${firstPlan.inProgressActivities}`);
        console.log(`Expected total time: ${expectedTotalTime}, Actual: ${firstPlan.totalTimeSpent}`);
        
        if (firstPlan.completedActivities === expectedCompleted &&
            firstPlan.inProgressActivities === expectedInProgress &&
            firstPlan.totalTimeSpent === expectedTotalTime) {
          console.log('✅ Progress calculations are accurate!');
        } else {
          console.log('❌ Progress calculation mismatch');
        }
        
        // Test specific plan endpoint
        console.log('\n🎯 Testing specific plan endpoint...');
        const specificPlanResponse = await axios.get(`${API_BASE}/study-plans/child/${childId}/plan/${firstPlan.id}`, {
          headers: { Authorization: `Bearer ${childToken}` }
        });
        
        const specificPlan = specificPlanResponse.data.plan;
        console.log('✅ Specific plan retrieved successfully');
        
        // Verify same enhanced fields are present
        const specificPlanFieldsPresent = requiredFields.every(field => 
          specificPlan.hasOwnProperty(field)
        );
        
        if (specificPlanFieldsPresent) {
          console.log('✅ Specific plan endpoint has all enhanced fields');
        } else {
          console.log('❌ Specific plan endpoint missing enhanced fields');
        }
        
      } else {
        console.log('\n❌ Some enhanced progress fields are missing');
      }
      
      // Test activities ordering
      console.log('\n📋 Verifying activities are ordered by creation date...');
      if (firstPlan.activities.length > 1) {
        let isOrdered = true;
        for (let i = 1; i < firstPlan.activities.length; i++) {
          const prevDate = new Date(firstPlan.activities[i-1].createdAt);
          const currDate = new Date(firstPlan.activities[i].createdAt);
          if (prevDate > currDate) {
            isOrdered = false;
            break;
          }
        }
        
        if (isOrdered) {
          console.log('✅ Activities are properly ordered by creation date');
        } else {
          console.log('❌ Activities are not properly ordered');
        }
      } else {
        console.log('ℹ️ Only one activity, ordering cannot be verified');
      }
      
      // Test incomplete plan if available
      if (incompletePlan) {
        console.log('\n🔍 Testing incomplete plan:');
        console.log('Plan ID:', incompletePlan.id);
        console.log('Status:', incompletePlan.status);
        console.log('Progress percentage:', incompletePlan.progressPercentage);
        console.log('Total time spent:', incompletePlan.totalTimeSpent);
        console.log('Completed activities:', incompletePlan.completedActivities);
        
        if (incompletePlan.progressPercentage === 0 && 
            incompletePlan.totalTimeSpent === 0 && 
            incompletePlan.completedActivities === 0) {
          console.log('✅ Incomplete plan calculations are correct');
        } else {
          console.log('❌ Incomplete plan calculations may be incorrect');
        }
      }
      
    } else {
      console.log('⚠️ No study plans found for testing');
    }

    console.log('\n🎉 Enhanced study plan progress test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.log('Status code:', error.response.status);
    }
  }
}

testEnhancedStudyPlanProgress().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});