#!/usr/bin/env node

/**
 * Test script for child dashboard API endpoint
 * Tests the complete dashboard data retrieval functionality
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testChildDashboardAPI() {
  console.log('🧪 Testing Child Dashboard API...\n');

  try {
    // Step 1: Find an existing child profile
    console.log('1. Finding existing child profile...');
    const childProfile = await prisma.childProfile.findFirst({
      where: {
        isActive: true
      },
      include: {
        parent: true
      }
    });

    if (!childProfile) {
      console.log('❌ No child profile found. Please create a child profile first.');
      return;
    }

    console.log(`✅ Found child: ${childProfile.name} (ID: ${childProfile.id})`);

    // Step 2: Get child's JWT token (simulate login)
    console.log('\n2. Getting child authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/child/login`, {
      credentials: {
        username: childProfile.username,
        pin: '1234' // Default test PIN
      },
      deviceInfo: {
        userAgent: 'Test-Agent/1.0',
        platform: 'test',
        isMobile: false,
        screenResolution: '1920x1080',
        language: 'en-US',
        timezone: 'UTC'
      },
      ipAddress: '127.0.0.1'
    });

    if (!loginResponse.data.token) {
      console.log('❌ Failed to get authentication token');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Authentication token obtained');

    // Step 3: Test dashboard API endpoint
    console.log('\n3. Testing dashboard API endpoint...');
    const dashboardResponse = await axios.get(
      `${API_BASE_URL}/api/child/${childProfile.id}/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (dashboardResponse.status !== 200) {
      console.log(`❌ Dashboard API returned status: ${dashboardResponse.status}`);
      return;
    }

    const dashboardData = dashboardResponse.data.dashboard;
    console.log('✅ Dashboard API endpoint working');

    // Step 4: Validate dashboard data structure
    console.log('\n4. Validating dashboard data structure...');
    
    // Check required fields
    const requiredFields = [
      'child',
      'progressSummary', 
      'studyPlans',
      'currentStreaks',
      'badges',
      'dailyGoals',
      'lastUpdated'
    ];

    let validationPassed = true;
    for (const field of requiredFields) {
      if (!dashboardData.hasOwnProperty(field)) {
        console.log(`❌ Missing required field: ${field}`);
        validationPassed = false;
      }
    }

    if (validationPassed) {
      console.log('✅ All required fields present');
    }

    // Step 5: Validate child data
    console.log('\n5. Validating child data...');
    const childData = dashboardData.child;
    if (childData.id && childData.name) {
      console.log(`✅ Child data: ${childData.name} (${childData.id})`);
      if (childData.age) console.log(`   Age: ${childData.age}`);
      if (childData.grade) console.log(`   Grade: ${childData.grade}`);
    } else {
      console.log('❌ Invalid child data structure');
    }

    // Step 6: Validate study plans data
    console.log('\n6. Validating study plans data...');
    const studyPlans = dashboardData.studyPlans;
    console.log(`✅ Found ${studyPlans.length} study plans`);
    
    if (studyPlans.length > 0) {
      const plan = studyPlans[0];
      console.log(`   Plan: ${plan.subject} (${plan.status})`);
      console.log(`   Progress: ${plan.progressPercentage}% (${plan.completedActivities}/${plan.totalActivities})`);
      console.log(`   Time spent: ${Math.round(plan.totalTimeSpent / 60)} minutes`);
      
      // Check if all plans have required progress fields
      const hasProgressData = studyPlans.every(p => 
        typeof p.totalActivities === 'number' &&
        typeof p.completedActivities === 'number' &&
        typeof p.progressPercentage === 'number'
      );
      
      if (hasProgressData) {
        console.log('✅ All study plans have complete progress data');
      } else {
        console.log('❌ Some study plans missing progress data');
      }
    }

    // Step 7: Validate progress summary
    console.log('\n7. Validating progress summary...');
    const progressSummary = dashboardData.progressSummary;
    console.log(`   Total activities: ${progressSummary.totalActivities}`);
    console.log(`   Completed: ${progressSummary.completedActivities}`);
    console.log(`   Average score: ${progressSummary.averageScore}`);
    console.log(`   Time spent: ${Math.round(progressSummary.totalTimeSpent / 60)} minutes`);

    // Step 8: Validate streaks data
    console.log('\n8. Validating streaks data...');
    const streaks = dashboardData.currentStreaks;
    console.log(`✅ Found ${streaks.length} streak records`);
    
    if (streaks.length > 0) {
      streaks.forEach(streak => {
        console.log(`   ${streak.type}: ${streak.currentCount} (longest: ${streak.longestCount})`);
      });
    }

    // Step 9: Validate badges data
    console.log('\n9. Validating badges data...');
    const badges = dashboardData.badges;
    console.log(`   Recent badges: ${badges.recent.length}`);
    console.log(`   Next to earn: ${badges.nextToEarn.length}`);

    // Step 10: Validate daily goals
    console.log('\n10. Validating daily goals...');
    const dailyGoals = dashboardData.dailyGoals;
    console.log(`   Activities: ${dailyGoals.activitiesCompleted}/${dailyGoals.activitiesTarget} (${dailyGoals.activitiesProgress}%)`);
    console.log(`   Time: ${Math.round(dailyGoals.timeSpent / 60)}/${Math.round(dailyGoals.timeTarget / 60)} min (${dailyGoals.timeProgress}%)`);
    console.log(`   Streak: ${dailyGoals.currentStreak}/${dailyGoals.streakTarget} days (${dailyGoals.streakProgress}%)`);

    console.log('\n🎉 Child Dashboard API test completed successfully!');
    console.log('\n📊 Dashboard Data Summary:');
    console.log(`   - Child: ${childData.name}`);
    console.log(`   - Study Plans: ${studyPlans.length} (showing ALL plans, not just ACTIVE)`);
    console.log(`   - Progress: ${progressSummary.completedActivities}/${progressSummary.totalActivities} activities`);
    console.log(`   - Streaks: ${streaks.length} active streaks`);
    console.log(`   - Badges: ${badges.recent.length} recent, ${badges.nextToEarn.length} next to earn`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testChildDashboardAPI();
}

module.exports = { testChildDashboardAPI };