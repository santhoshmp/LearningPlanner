const axios = require('axios');

async function testAnalyticsAPI() {
  try {
    console.log('Testing Analytics API...\n');

    // First, let's test if the server is running
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Server is running:', healthResponse.data);

    // Test child ID from our test data
    const childId = 'cme2vgr310005tow0grqsschp';
    
    // Create a simple time frame (last 30 days)
    const timeFrame = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };

    console.log(`Testing with child ID: ${childId}`);
    console.log(`Time frame: ${timeFrame.start} to ${timeFrame.end}\n`);

    // We need to get an auth token first
    console.log('1. Getting auth token...');
    
    // Try to login with test user
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'testparent@example.com',
      password: 'TestPassword123!'
    }).catch(async (error) => {
      if (error.response?.status === 401) {
        console.log('   Test user not found, creating one...');
        
        // Create test user
        const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
          email: 'testparent@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'Parent',
          role: 'parent'
        });
        
        console.log('   ✅ Created test user');
        return registerResponse;
      }
      throw error;
    });

    const token = loginResponse.data.accessToken;
    console.log('   ✅ Got auth token');

    // Test analytics endpoints
    console.log('\n2. Testing analytics endpoints...');

    // Test progress report
    console.log('   Testing progress report...');
    try {
      const progressResponse = await axios.get(`http://localhost:3001/api/analytics/progress/${childId}`, {
        params: timeFrame,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   ✅ Progress report response:');
      console.log('     ', JSON.stringify(progressResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Progress report failed:', error.response?.data || error.message);
    }

    // Test subject performance
    console.log('\n   Testing subject performance...');
    try {
      const subjectResponse = await axios.get(`http://localhost:3001/api/analytics/subjects/${childId}`, {
        params: timeFrame,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   ✅ Subject performance response:');
      console.log('     ', JSON.stringify(subjectResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Subject performance failed:', error.response?.data || error.message);
    }

    // Test performance trends
    console.log('\n   Testing performance trends...');
    try {
      const trendsResponse = await axios.get(`http://localhost:3001/api/analytics/trends/${childId}`, {
        params: timeFrame,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   ✅ Performance trends response:');
      console.log('     ', JSON.stringify(trendsResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Performance trends failed:', error.response?.data || error.message);
    }

    // Test alerts
    console.log('\n   Testing alerts...');
    try {
      const alertsResponse = await axios.get(`http://localhost:3001/api/analytics/alerts/${childId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   ✅ Alerts response:');
      console.log('     ', JSON.stringify(alertsResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Alerts failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Analytics API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAnalyticsAPI();