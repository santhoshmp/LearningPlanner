const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testProgressUpdateFix() {
  try {
    console.log('🔧 Testing Progress Update Fix...');
    
    // Step 1: Login as child
    console.log('\n1. Authenticating as child "tim"...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/child/login-legacy`, {
      username: 'tim',
      pin: '1234'
    });
    
    const { accessToken, child } = loginResponse.data;
    console.log('✅ Authenticated as:', child.name);
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get an activity to test
    const activityId = 'cmffmtts70007kih6a5f6fwj8'; // Number Recognition Practice
    
    // Step 3: Start the activity
    console.log('\n2. Starting activity...');
    try {
      const startResponse = await axios.post(
        `${API_BASE_URL}/api/activities/${activityId}/start`,
        {},
        { headers }
      );
      console.log('✅ Activity started successfully');
    } catch (error) {
      console.log('ℹ️ Activity already started or error:', error.response?.data?.error?.message);
    }
    
    // Step 4: Test progress update with correct data
    console.log('\n3. Testing progress update...');
    
    const progressData = {
      status: 'IN_PROGRESS',
      timeSpent: 5 // 5 minutes
    };
    
    try {
      const updateResponse = await axios.put(
        `${API_BASE_URL}/api/activities/${activityId}/progress`,
        progressData,
        { headers }
      );
      
      console.log('✅ Progress update successful!');
      console.log('   Status:', updateResponse.data.progress.status);
      console.log('   Time spent:', updateResponse.data.progress.timeSpent, 'minutes');
      console.log('   Updated at:', updateResponse.data.progress.updatedAt);
      
    } catch (error) {
      console.log('❌ Progress update failed:', error.response?.data?.error?.message || error.message);
      if (error.response?.data) {
        console.log('   Full error:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // Step 5: Test with invalid data to make sure validation works
    console.log('\n4. Testing with invalid status...');
    
    try {
      await axios.put(
        `${API_BASE_URL}/api/activities/${activityId}/progress`,
        {
          status: 'INVALID_STATUS',
          timeSpent: 10
        },
        { headers }
      );
      console.log('❌ Should have failed with invalid status');
    } catch (error) {
      console.log('✅ Correctly rejected invalid status');
    }
    
    // Step 6: Complete the activity
    console.log('\n5. Testing activity completion...');
    
    try {
      const completeResponse = await axios.put(
        `${API_BASE_URL}/api/activities/${activityId}/progress`,
        {
          status: 'COMPLETED',
          timeSpent: 15,
          score: 85
        },
        { headers }
      );
      
      console.log('✅ Activity completion successful!');
      console.log('   Status:', completeResponse.data.progress.status);
      console.log('   Score:', completeResponse.data.progress.score);
      console.log('   Completed at:', completeResponse.data.progress.completedAt);
      
    } catch (error) {
      console.log('❌ Activity completion failed:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n🎉 Progress update fix test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProgressUpdateFix();