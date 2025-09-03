const axios = require('axios');

async function testChildAuthEndpoint() {
  try {
    console.log('Testing child authentication endpoint...');
    
    // Test with invalid credentials (should return 401)
    try {
      const response = await axios.post('http://localhost:5000/api/auth/child/login-legacy', {
        username: 'nonexistent',
        pin: '0000'
      });
      console.log('❌ Expected 401 but got:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid credentials correctly rejected (401)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test endpoint availability
    try {
      const response = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Backend is responding:', response.status);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testChildAuthEndpoint();