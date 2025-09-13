const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testFrontendActivityAccess() {
  try {
    console.log('🔍 Testing Frontend Activity Access Issue...');
    
    // Check the activity that frontend is trying to access
    const frontendActivityId = 'cmffmtts70007kih6a5f6fwj8';
    const frontendChildId = 'cmfeccya6000fnjw9k5yo2m0l';
    
    console.log('\n1. Checking frontend activity details...');
    const activity = await prisma.studyActivity.findUnique({
      where: { id: frontendActivityId },
      include: { 
        plan: {
          include: {
            child: true
          }
        }
      }
    });
    
    if (!activity) {
      console.log('❌ Frontend activity not found');
      return;
    }
    
    console.log('✅ Frontend activity found:', activity.title);
    console.log('   Plan ID:', activity.plan.id);
    console.log('   Child ID:', activity.plan.childId);
    console.log('   Child Name:', activity.plan.child.name);
    console.log('   Child Username:', activity.plan.child.username);
    
    // Check if this child can login
    console.log('\n2. Testing login for frontend child...');
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/child/login-legacy`, {
        username: activity.plan.child.username,
        pin: '1234'  // Assuming same PIN
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Frontend child can login');
        const { accessToken } = loginResponse.data;
        
        // Test activity access with correct child
        console.log('\n3. Testing activity access with correct child...');
        
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        };
        
        try {
          const progressResponse = await axios.get(
            `${API_BASE_URL}/api/activities/${frontendActivityId}/progress`,
            { headers }
          );
          console.log('✅ Activity access successful with correct child');
          console.log('   Progress status:', progressResponse.data.progress.status);
        } catch (error) {
          console.log('❌ Activity access failed:', error.response?.data?.error?.message || error.message);
        }
        
      } else {
        console.log('❌ Frontend child login failed');
      }
    } catch (loginError) {
      console.log('❌ Frontend child login error:', loginError.response?.data?.error?.message || loginError.message);
      
      // Check if child exists and is active
      const childCheck = await prisma.childProfile.findUnique({
        where: { id: frontendChildId }
      });
      
      if (childCheck) {
        console.log('   Child exists but login failed');
        console.log('   Child active:', childCheck.isActive);
        console.log('   Child username:', childCheck.username);
      } else {
        console.log('   Child does not exist in database');
      }
    }
    
    // Show solution
    console.log('\n💡 Solution:');
    console.log('   The frontend needs to login as child:', activity.plan.child.username);
    console.log('   Or create activities for the currently logged-in child');
    console.log('   Current test child username: testchild');
    console.log('   Frontend trying to access child:', activity.plan.child.username);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendActivityAccess();