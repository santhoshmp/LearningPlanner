const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testChildLoginAndRefresh() {
  try {
    console.log('🧪 Testing Child Login and Token Refresh...\n');

    // Step 1: Child Login
    console.log('1. Attempting child login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/child/login-legacy`, {
      username: 'tim',
      pin: '1234'
    });

    console.log('✅ Child login successful!');
    console.log('Child ID:', loginResponse.data.child.id);
    console.log('Child Name:', loginResponse.data.child.name);
    console.log('Access Token Length:', loginResponse.data.accessToken.length);
    console.log('Refresh Token Length:', loginResponse.data.refreshToken.length);

    const { accessToken, refreshToken } = loginResponse.data;

    // Step 2: Wait a moment then test token refresh
    console.log('\n2. Testing token refresh...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });

    console.log('✅ Token refresh successful!');
    console.log('New Access Token Length:', refreshResponse.data.accessToken.length);
    console.log('New Refresh Token Length:', refreshResponse.data.refreshToken.length);
    console.log('User Role:', refreshResponse.data.user.role);
    console.log('User Name:', refreshResponse.data.user.name);

    // Step 3: Test API call with refreshed token
    console.log('\n3. Testing API call with refreshed token...');
    const apiResponse = await axios.get(`${API_BASE_URL}/child-profiles`, {
      headers: {
        'Authorization': `Bearer ${refreshResponse.data.accessToken}`
      }
    });

    console.log('✅ API call with refreshed token successful!');
    console.log('Number of profiles returned:', apiResponse.data.length);

    console.log('\n🎉 All tests passed! Child login and refresh working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

testChildLoginAndRefresh();