const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3001/api';

// Test credentials
const PARENT_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

const CHILD_CREDENTIALS = {
  username: 'testchild',
  pin: '1234'
};

let parentToken = null;
let childToken = null;
let childId = null;

async function testParentLogin() {
  console.log('\n🔐 Testing Parent Login...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, PARENT_CREDENTIALS);
    parentToken = response.data.accessToken; // Changed from token to accessToken
    console.log('✅ Parent login successful');
    console.log('Parent ID:', response.data.user.id);
    console.log('Token received:', parentToken ? 'Yes' : 'No');
    return response.data.user;
  } catch (error) {
    console.error('❌ Parent login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testChildLogin() {
  console.log('\n🧒 Testing Child Login...');
  try {
    const loginData = {
      credentials: {
        username: CHILD_CREDENTIALS.username,
        pin: CHILD_CREDENTIALS.pin
      },
      deviceInfo: {
        userAgent: 'Test Browser',
        platform: 'Test Platform',
        isMobile: false,
        screenResolution: '1920x1080',
        timezone: 'America/New_York',
        language: 'en-US'
      },
      ipAddress: '127.0.0.1'
    };
    
    const response = await axios.post(`${API_BASE}/auth/child/login-legacy`, {
      username: CHILD_CREDENTIALS.username,
      pin: CHILD_CREDENTIALS.pin
    });
    childToken = response.data.accessToken; // Changed from token to accessToken
    childId = response.data.child.id;
    console.log('✅ Child login successful');
    console.log('Child ID:', childId);
    console.log('Child Name:', response.data.child.name);
    return response.data.child;
  } catch (error) {
    console.error('❌ Child login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testChildDashboard() {
  console.log('\n📊 Testing Child Dashboard...');
  try {
    const response = await axios.get(`${API_BASE}/child/${childId}/dashboard`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    console.log('✅ Child dashboard loaded successfully');
    console.log('Dashboard data keys:', Object.keys(response.data));
    return response.data;
  } catch (error) {
    console.error('❌ Child dashboard failed:', error.response?.data || error.message);
    return null;
  }
}

async function testChildProgress() {
  console.log('\n📈 Testing Child Progress...');
  try {
    const response = await axios.get(`${API_BASE}/child/${childId}/progress`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    console.log('✅ Child progress loaded successfully');
    console.log('Progress data:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Child progress failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetExistingStudyPlans() {
  console.log('\n📚 Testing Get Existing Study Plans...');
  try {
    const response = await axios.get(`${API_BASE}/study-plans?childId=${childId}`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    console.log('✅ Existing study plans loaded successfully');
    console.log('Number of study plans:', response.data.studyPlans?.length || response.data.length || 0);
    return response.data;
  } catch (error) {
    console.error('❌ Get existing study plans failed:', error.response?.data || error.message);
    return null;
  }
}

async function testStudyPlanGeneration() {
  console.log('\n📚 Testing Study Plan Generation...');
  try {
    const studyPlanData = {
      subject: 'Mathematics',
      grade: '3rd Grade',
      duration: 30,
      difficulty: 'BEGINNER',
      learningObjectives: ['Basic addition', 'Basic subtraction'],
      childId: childId
    };
    
    const response = await axios.post(`${API_BASE}/study-plans`, studyPlanData, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    console.log('✅ Study plan generated successfully');
    console.log('Study plan ID:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Study plan generation failed:', error.response?.data || error.message);
    
    // Try alternative endpoint
    try {
      console.log('Trying alternative study plan endpoint...');
      const response2 = await axios.post(`${API_BASE}/claude/generate-plan`, {
        subject: 'Mathematics',
        grade: '3rd Grade',
        duration: 30,
        difficulty: 'BEGINNER',
        learningObjectives: ['Basic addition', 'Basic subtraction'],
        childId: childId
      }, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });
      console.log('✅ Study plan generated successfully (alternative endpoint)');
      console.log('Study plan ID:', response2.data.id);
      return response2.data;
    } catch (error2) {
      console.error('❌ Alternative study plan generation also failed:', error2.response?.data || error2.message);
      return null;
    }
  }
}

async function testChildStudyPlans() {
  console.log('\n📖 Testing Child Study Plans Access...');
  try {
    const response = await axios.get(`${API_BASE}/study-plans/child/${childId}`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    console.log('✅ Child study plans loaded successfully');
    console.log('Number of study plans:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('❌ Child study plans failed:', error.response?.data || error.message);
    return null;
  }
}

async function testActivityCompletion() {
  console.log('\n🎯 Testing Activity Completion...');
  try {
    // First get study plans to find an activity
    const studyPlans = await axios.get(`${API_BASE}/study-plans/child/${childId}`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    
    if (studyPlans.data.length > 0) {
      const firstPlan = studyPlans.data[0];
      if (firstPlan.activities && firstPlan.activities.length > 0) {
        const activityId = firstPlan.activities[0].id;
        
        const completionData = {
          score: 85,
          timeSpent: 900, // 15 minutes in seconds
          sessionData: {
            startTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
            endTime: new Date().toISOString(),
            pausedDuration: 0,
            focusEvents: [],
            difficultyAdjustments: [],
            helpRequests: [],
            interactionEvents: []
          }
        };
        
        const response = await axios.post(`${API_BASE}/child/activity/${activityId}/complete`, completionData, {
          headers: { Authorization: `Bearer ${childToken}` }
        });
        console.log('✅ Activity completion recorded successfully');
        return response.data;
      }
    }
    console.log('⚠️ No activities found to complete');
    return null;
  } catch (error) {
    console.error('❌ Activity completion failed:', error.response?.data || error.message);
    return null;
  }
}

async function testParentAnalytics() {
  console.log('\n📊 Testing Parent Analytics...');
  try {
    // Try different analytics endpoints
    const endpoints = [
      `/analytics/child/${childId}`,
      `/analytics/${childId}`,
      `/analytics?childId=${childId}`,
      `/child-profiles/${childId}/analytics`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint}`, {
          headers: { Authorization: `Bearer ${parentToken}` }
        });
        console.log(`✅ Parent analytics loaded successfully from ${endpoint}`);
        console.log('Analytics data keys:', Object.keys(response.data));
        return response.data;
      } catch (err) {
        console.log(`❌ Failed ${endpoint}:`, err.response?.status || err.message);
      }
    }
    
    console.log('❌ All analytics endpoints failed');
    return null;
  } catch (error) {
    console.error('❌ Parent analytics failed:', error.response?.data || error.message);
    return null;
  }
}

async function testChildBadges() {
  console.log('\n🏆 Testing Child Badges...');
  try {
    const response = await axios.get(`${API_BASE}/child/${childId}/badges`, {
      headers: { Authorization: `Bearer ${childToken}` }
    });
    console.log('✅ Child badges loaded successfully');
    console.log('Number of badges:', response.data.badges?.length || 0);
    return response.data;
  } catch (error) {
    console.error('❌ Child badges failed:', error.response?.data || error.message);
    return null;
  }
}

async function testParentChildProfiles() {
  console.log('\n👨‍👩‍👧‍👦 Testing Parent Child Profiles Access...');
  try {
    const response = await axios.get(`${API_BASE}/child-profiles`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    console.log('✅ Parent child profiles loaded successfully');
    console.log('Number of child profiles:', response.data.childProfiles?.length || response.data.children?.length || response.data.length || 0);
    console.log('Response structure:', Object.keys(response.data));
    console.log('Child profiles data:', response.data.childProfiles || response.data.children || response.data);
    return response.data.childProfiles || response.data.children || response.data;
  } catch (error) {
    console.error('❌ Parent child profiles failed:', error.response?.data || error.message);
    return null;
  }
}

async function testContentSafety() {
  console.log('\n🛡️ Testing Content Safety...');
  try {
    const testContent = {
      content: "Let's learn about addition with fun examples!",
      childId: childId,
      contentType: 'text'
    };
    
    const response = await axios.post(`${API_BASE}/content-safety/check`, testContent, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    console.log('✅ Content safety check successful');
    console.log('Safety rating:', response.data.safetyRating);
    return response.data;
  } catch (error) {
    console.error('❌ Content safety check failed:', error.response?.data || error.message);
    
    // Try alternative endpoint
    try {
      const response2 = await axios.post(`${API_BASE}/content-safety/validate`, testContent, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });
      console.log('✅ Content safety validation successful (alternative endpoint)');
      return response2.data;
    } catch (error2) {
      console.error('❌ Alternative content safety check also failed:', error2.response?.data || error2.message);
      return null;
    }
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive AI Study Planner Test');
  console.log('='.repeat(50));
  
  // Test parent login
  const parent = await testParentLogin();
  if (!parent) return;
  
  // Test parent functionalities first
  await testParentChildProfiles();
  
  // Get a child ID from parent's children for testing
  try {
    const childProfiles = await axios.get(`${API_BASE}/child-profiles`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    
    const children = childProfiles.data.childProfiles || childProfiles.data.children || childProfiles.data;
    if (children && children.length > 0) {
      childId = children[0].id;
      console.log('\n📋 Using child ID for testing:', childId);
      console.log('Child name:', children[0].name);
      
      await testGetExistingStudyPlans();
      await testStudyPlanGeneration();
      await testParentAnalytics();
      await testContentSafety();
    } else {
      console.log('\n⚠️ No child profiles found for parent');
    }
  } catch (error) {
    console.log('\n⚠️ Could not get child profiles:', error.response?.data?.error?.message || error.message);
  }
  
  // Test child login
  const child = await testChildLogin();
  if (child) {
    // Test child functionalities
    await testChildDashboard();
    await testChildProgress();
    await testChildStudyPlans();
    await testChildBadges();
    
    // Test activity completion (this will update data that parent can see)
    await testActivityCompletion();
    
    // Test parent analytics again to see if updates are reflected
    console.log('\n🔄 Re-testing Parent Analytics to verify updates...');
    await testParentAnalytics();
  } else {
    console.log('\n⚠️ Child login failed, skipping child-specific tests');
    console.log('Testing parent view of child data instead...');
  }
  
  console.log('\n✨ Comprehensive test completed!');
  console.log('='.repeat(50));
}

// Run the test
runComprehensiveTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());