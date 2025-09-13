const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testActivitiesEndpoint() {
  try {
    console.log('🧪 Testing Activities Endpoint...');
    
    // Step 1: Authenticate as child to get token
    console.log('\n1. Authenticating as child...');
    
    const childProfile = await prisma.childProfile.findFirst({
      where: { username: 'testchild' }
    });
    
    if (!childProfile) {
      console.log('❌ No test child found');
      return;
    }
    
    // Login as child using legacy endpoint
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/child/login-legacy`, {
      username: 'testchild',
      pin: '1234'
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Child login failed');
      return;
    }
    
    const { accessToken, child } = loginResponse.data;
    console.log('✅ Child authenticated:', child.name);
    console.log('Token:', accessToken.substring(0, 20) + '...');
    
    // Step 2: Find an activity to test
    console.log('\n2. Finding test activity...');
    
    const studyPlan = await prisma.studyPlan.findFirst({
      where: { childId: child.id },
      include: { activities: true }
    });
    
    if (!studyPlan || studyPlan.activities.length === 0) {
      console.log('❌ No study plan or activities found for child');
      return;
    }
    
    const testActivity = studyPlan.activities[0];
    console.log('✅ Test activity found:', testActivity.title);
    console.log('Activity ID:', testActivity.id);
    
    // Step 3: Test activity endpoints
    console.log('\n3. Testing activity endpoints...');
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Test get activity progress
    try {
      console.log('\n3a. Testing GET /activities/:id/progress');
      const progressResponse = await axios.get(
        `${API_BASE_URL}/api/activities/${testActivity.id}/progress`,
        { headers }
      );
      console.log('✅ Progress endpoint working');
      console.log('Progress status:', progressResponse.data.progress.status);
    } catch (error) {
      console.log('❌ Progress endpoint failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Test start activity
    try {
      console.log('\n3b. Testing POST /activities/:id/start');
      const startResponse = await axios.post(
        `${API_BASE_URL}/api/activities/${testActivity.id}/start`,
        {},
        { headers }
      );
      console.log('✅ Start endpoint working');
      console.log('Activity started:', startResponse.data.activity.title);
    } catch (error) {
      console.log('❌ Start endpoint failed:', error.response?.data?.error?.message || error.message);
    }
    
    // Test get activity details
    try {
      console.log('\n3c. Testing GET /activities/:id');
      const activityResponse = await axios.get(
        `${API_BASE_URL}/api/activities/${testActivity.id}`,
        { headers }
      );
      console.log('✅ Activity details endpoint working');
      console.log('Activity title:', activityResponse.data.activity.title);
    } catch (error) {
      console.log('❌ Activity details endpoint failed:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n✅ Activities endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testActivitiesEndpoint();