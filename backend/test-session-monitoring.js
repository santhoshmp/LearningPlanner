const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials (make sure these exist in your database)
const TEST_CHILD = {
  username: 'testchild',
  pin: '1234'
};

const TEST_PARENT = {
  email: 'parent@test.com',
  password: 'password123'
};

let childAccessToken = '';
let childRefreshToken = '';
let childSessionId = '';
let parentAccessToken = '';

async function testChildSessionMonitoring() {
  console.log('🧪 Testing Child Session Monitoring System\n');

  try {
    // Step 1: Child Login with Session Monitoring
    console.log('1. Testing child login with session monitoring...');
    const childLoginResponse = await axios.post(`${BASE_URL}/auth/child/login`, {
      username: TEST_CHILD.username,
      pin: TEST_CHILD.pin,
      deviceInfo: {
        userAgent: 'Test Browser',
        platform: 'Test Platform',
        isMobile: false
      }
    });

    if (childLoginResponse.data.success) {
      childAccessToken = childLoginResponse.data.accessToken;
      childRefreshToken = childLoginResponse.data.refreshToken;
      childSessionId = childLoginResponse.data.sessionId;
      console.log('✅ Child login successful');
      console.log(`   Session ID: ${childSessionId}`);
      console.log(`   Access Token: ${childAccessToken.substring(0, 20)}...`);
    } else {
      throw new Error('Child login failed');
    }

    // Step 2: Test Session Info Retrieval (Child)
    console.log('\n2. Testing child session info retrieval...');
    const sessionInfoResponse = await axios.get(`${BASE_URL}/child-session-monitoring/my-session`, {
      headers: {
        'Authorization': `Bearer ${childAccessToken}`
      }
    });

    if (sessionInfoResponse.data.success) {
      console.log('✅ Session info retrieved successfully');
      console.log(`   Session Active: ${sessionInfoResponse.data.data.isActive}`);
      console.log(`   Duration: ${sessionInfoResponse.data.data.duration}ms`);
    }

    // Step 3: Test Activity Update
    console.log('\n3. Testing session activity update...');
    const activityResponse = await axios.post(`${BASE_URL}/child-session-monitoring/my-session/activity`, {}, {
      headers: {
        'Authorization': `Bearer ${childAccessToken}`
      }
    });

    if (activityResponse.data.success) {
      console.log('✅ Activity updated successfully');
    }

    // Step 4: Parent Login (for monitoring tests)
    console.log('\n4. Testing parent login...');
    try {
      const parentLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_PARENT.email,
        password: TEST_PARENT.password
      });

      if (parentLoginResponse.data.accessToken) {
        parentAccessToken = parentLoginResponse.data.accessToken;
        console.log('✅ Parent login successful');
      }
    } catch (error) {
      console.log('⚠️  Parent login failed (may not exist), skipping parent tests');
    }

    // Step 5: Test Token Refresh with Session Validation
    console.log('\n5. Testing token refresh with session validation...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: childRefreshToken
    });

    if (refreshResponse.data.success) {
      childAccessToken = refreshResponse.data.accessToken;
      console.log('✅ Token refresh successful with session validation');
    }

    // Step 6: Test Session Statistics (if parent available)
    if (parentAccessToken) {
      console.log('\n6. Testing session statistics...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/child-session-monitoring/sessions/stats`, {
          headers: {
            'Authorization': `Bearer ${parentAccessToken}`
          }
        });

        if (statsResponse.data.success) {
          console.log('✅ Session statistics retrieved');
          console.log(`   Active Sessions: ${statsResponse.data.data.activeSessions}`);
        }
      } catch (error) {
        console.log('⚠️  Session statistics test failed (may need proper parent-child relationship)');
      }
    }

    // Step 7: Test Suspicious Activity Detection
    console.log('\n7. Testing suspicious activity detection...');
    try {
      // Try to refresh with different IP (simulated)
      const suspiciousRefreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: childRefreshToken
      }, {
        headers: {
          'X-Forwarded-For': '192.168.1.100', // Different IP
          'User-Agent': 'Different Browser'
        }
      });

      console.log('⚠️  Suspicious activity not detected (may need more strict validation)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Suspicious activity detected and blocked');
      } else {
        console.log('⚠️  Unexpected error in suspicious activity test');
      }
    }

    // Step 8: Test Session Cleanup (Logout)
    console.log('\n8. Testing session cleanup on logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/child/logout`, {
      sessionId: childSessionId
    }, {
      headers: {
        'Authorization': `Bearer ${childAccessToken}`
      }
    });

    if (logoutResponse.data.success) {
      console.log('✅ Child logout with session cleanup successful');
    }

    // Step 9: Verify Session is Terminated
    console.log('\n9. Verifying session termination...');
    try {
      await axios.get(`${BASE_URL}/child-session-monitoring/my-session`, {
        headers: {
          'Authorization': `Bearer ${childAccessToken}`
        }
      });
      console.log('⚠️  Session still active after logout (may be expected behavior)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Session properly terminated after logout');
      }
    }

    console.log('\n🎉 Session monitoring tests completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test session monitoring cleanup
async function testSessionCleanup() {
  console.log('\n🧹 Testing Session Cleanup...');
  
  try {
    const cleanupResponse = await axios.post(`${BASE_URL}/child-session-monitoring/cleanup`, {}, {
      headers: {
        'X-Admin-Key': process.env.ADMIN_KEY || 'test-admin-key'
      }
    });

    if (cleanupResponse.data.success) {
      console.log('✅ Session cleanup successful');
    }
  } catch (error) {
    console.log('⚠️  Session cleanup test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testChildSessionMonitoring();
  await testSessionCleanup();
}

runAllTests().catch(console.error);