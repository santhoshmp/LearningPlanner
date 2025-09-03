const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAnalyticsEndpoints() {
  console.log('🔍 Testing Analytics Endpoints');
  console.log('='.repeat(40));
  
  try {
    // Get parent token
    const parentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    const parentToken = parentLogin.data.accessToken;
    console.log('✅ Parent logged in');
    
    // Get child token
    const childLogin = await axios.post(`${API_BASE}/auth/child/login-legacy`, {
      username: 'testchild',
      pin: '1234'
    });
    const childToken = childLogin.data.accessToken;
    const childId = childLogin.data.child.id;
    console.log('✅ Child logged in');
    
    // Test analytics endpoints that should work
    const endpointsToTest = [
      {
        name: 'Progress Report (Parent)',
        url: `/analytics/progress/${childId}`,
        token: parentToken,
        method: 'GET'
      },
      {
        name: 'Progress Report (Child)',
        url: `/analytics/progress/${childId}`,
        token: childToken,
        method: 'GET'
      },
      {
        name: 'Performance Trends (Parent)',
        url: `/analytics/trends/${childId}`,
        token: parentToken,
        method: 'GET'
      },
      {
        name: 'Subject Performance (Parent)',
        url: `/analytics/subjects/${childId}`,
        token: parentToken,
        method: 'GET'
      },
      {
        name: 'Real-time Analytics (Child)',
        url: `/analytics/realtime/${childId}`,
        token: childToken,
        method: 'GET'
      },
      {
        name: 'Dashboard Analytics (Parent)',
        url: `/analytics/dashboard/${childId}`,
        token: parentToken,
        method: 'GET'
      }
    ];
    
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`\\n🧪 Testing ${endpoint.name}...`);
        const response = await axios({
          method: endpoint.method,
          url: `${API_BASE}${endpoint.url}`,
          headers: { Authorization: `Bearer ${endpoint.token}` }
        });
        console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
        console.log(`   Response keys:`, Object.keys(response.data));
      } catch (error) {
        console.log(`❌ ${endpoint.name}: FAILED (${error.response?.status || 'Network Error'})`);
        if (error.response?.data) {
          console.log(`   Error:`, error.response.data.error || error.response.data);
        }
      }
    }
    
    console.log('\\n📊 Analytics Endpoints Test Complete');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.response?.data || error.message);
  }
}

testAnalyticsEndpoints();