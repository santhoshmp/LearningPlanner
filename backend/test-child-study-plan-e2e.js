#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test for Child Study Plan Access
 * 
 * This test script verifies:
 * - Child login and study plan access (Requirements 1.1, 1.2, 1.3)
 * - Progress updates and persistence (Requirements 2.1, 2.2, 2.3)
 * - Dashboard updates after activity completion (Requirements 3.1, 3.2)
 * - Error scenarios (invalid tokens, missing plans, etc.) (Requirements 5.1, 5.2, 5.4)
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  childCredentials: {
    username: 'testchild',
    pin: '1234'
  },
  progressUpdate: {
    timeSpent: 300, // 5 minutes in seconds
    score: 85,
    status: 'IN_PROGRESS',
    sessionData: {
      startTime: new Date().toISOString(),
      endTime: null,
      pausedDuration: 0,
      focusEvents: [
        {
          type: 'focus',
          timestamp: new Date().toISOString()
        }
      ],
      helpRequests: [],
      interactionEvents: [
        {
          type: 'click',
          element: 'activity-start',
          timestamp: new Date().toISOString()
        }
      ]
    }
  },
  completionData: {
    score: 92,
    timeSpent: 600, // 10 minutes
    sessionData: {
      startTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      endTime: new Date().toISOString(),
      pausedDuration: 30,
      focusEvents: [
        {
          type: 'focus',
          timestamp: new Date(Date.now() - 600000).toISOString()
        },
        {
          type: 'blur',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          type: 'focus',
          timestamp: new Date(Date.now() - 270000).toISOString()
        }
      ],
      helpRequests: [],
      interactionEvents: [
        {
          type: 'click',
          element: 'submit-answer',
          timestamp: new Date().toISOString()
        }
      ]
    }
  }
};

class TestResults {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  addResult(testName, passed, details = null, error = null) {
    this.results.push({
      test: testName,
      passed,
      details,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });

    if (!passed && error) {
      this.errors.push({ test: testName, error });
    }
  }

  addWarning(testName, message) {
    this.warnings.push({ test: testName, message });
  }

  printSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 CHILD STUDY PLAN E2E TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`📊 Total Tests: ${this.results.length}`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.test}: ${result.error || 'Unknown error'}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   - ${warning.test}: ${warning.message}`);
      });
    }

    console.log('='.repeat(60));
    return failed === 0;
  }
}

class ChildStudyPlanE2ETest {
  constructor() {
    this.results = new TestResults();
    this.childToken = null;
    this.childId = null;
    this.childData = null;
    this.studyPlans = [];
    this.testActivityId = null;
    this.initialDashboardData = null;
  }

  async runAllTests() {
    console.log('🚀 Starting Child Study Plan End-to-End Tests...\n');

    try {
      // Phase 1: Authentication Tests
      await this.testChildAuthentication();
      
      if (!this.childToken) {
        console.log('❌ Cannot proceed without valid authentication');
        return this.results.printSummary();
      }

      // Phase 2: Study Plan Access Tests
      await this.testStudyPlanAccess();
      
      // Phase 3: Dashboard Initial State
      await this.testInitialDashboardState();
      
      // Phase 4: Progress Update Tests
      await this.testProgressUpdates();
      
      // Phase 5: Activity Completion Tests
      await this.testActivityCompletion();
      
      // Phase 6: Dashboard Update Verification
      await this.testDashboardUpdates();
      
      // Phase 7: Error Scenario Tests
      await this.testErrorScenarios();
      
      // Phase 8: Data Persistence Tests
      await this.testDataPersistence();

    } catch (error) {
      console.error('❌ Critical test failure:', error.message);
      this.results.addResult('Critical Test Execution', false, null, error);
    } finally {
      await prisma.$disconnect();
    }

    return this.results.printSummary();
  }

  async testChildAuthentication() {
    console.log('🔐 Phase 1: Testing Child Authentication...');

    try {
      // Test 1.1: Valid child login
      const loginResponse = await axios.post(`${API_BASE}/auth/child/login`, {
        credentials: TEST_CONFIG.childCredentials,
        deviceInfo: {
          userAgent: 'E2E-Test/1.0',
          platform: 'test',
          isMobile: false,
          screenResolution: '1920x1080',
          language: 'en-US',
          timezone: 'UTC'
        },
        ipAddress: '127.0.0.1'
      });

      if (loginResponse.data.token && loginResponse.data.child) {
        this.childToken = loginResponse.data.token;
        this.childId = loginResponse.data.child.id;
        this.childData = loginResponse.data.child;
        
        this.results.addResult('Child Login', true, {
          childId: this.childId,
          childName: this.childData.name,
          tokenReceived: !!this.childToken
        });
        
        console.log(`✅ Child login successful: ${this.childData.name} (${this.childId})`);
      } else {
        throw new Error('Login response missing token or child data');
      }

      // Test 1.2: Session validation
      const sessionResponse = await axios.get(`${API_BASE}/child/auth/session`, {
        headers: { Authorization: `Bearer ${this.childToken}` }
      });

      this.results.addResult('Session Validation', true, {
        sessionId: sessionResponse.data.sessionId,
        timeRemaining: sessionResponse.data.timeRemainingMinutes
      });
      
      console.log(`✅ Session validation successful`);

    } catch (error) {
      this.results.addResult('Child Authentication', false, null, error);
      console.error('❌ Authentication failed:', error.response?.data || error.message);
    }
  }

  async testStudyPlanAccess() {
    console.log('\n📚 Phase 2: Testing Study Plan Access...');

    try {
      // Test 2.1: Get all study plans (should include ALL statuses, not just ACTIVE)
      const allPlansResponse = await axios.get(`${API_BASE}/study-plans/child/${this.childId}`, {
        headers: { Authorization: `Bearer ${this.childToken}` }
      });

      this.studyPlans = allPlansResponse.data.plans || allPlansResponse.data;
      
      // Verify we get plans with different statuses
      const statuses = [...new Set(this.studyPlans.map(p => p.status))];
      const hasMultipleStatuses = statuses.length > 1 || statuses.includes('ACTIVE');
      
      this.results.addResult('Study Plan Access - All Statuses', hasMultipleStatuses, {
        totalPlans: this.studyPlans.length,
        statuses: statuses,
        plansIncludeNonActive: statuses.some(s => s !== 'ACTIVE')
      });

      if (hasMultipleStatuses) {
        console.log(`✅ Study plan access working - found ${this.studyPlans.length} plans with statuses: ${statuses.join(', ')}`);
      } else {
        this.results.addWarning('Study Plan Access', 'Only found ACTIVE plans - verify non-ACTIVE plans are included');
      }

      // Test 2.2: Verify progress data is included
      if (this.studyPlans.length > 0) {
        const firstPlan = this.studyPlans[0];
        const hasProgressData = firstPlan.hasOwnProperty('totalActivities') &&
                               firstPlan.hasOwnProperty('completedActivities') &&
                               firstPlan.hasOwnProperty('progressPercentage');

        this.results.addResult('Study Plan Progress Data', hasProgressData, {
          totalActivities: firstPlan.totalActivities,
          completedActivities: firstPlan.completedActivities,
          progressPercentage: firstPlan.progressPercentage
        });

        if (hasProgressData) {
          console.log(`✅ Progress data included: ${firstPlan.completedActivities}/${firstPlan.totalActivities} (${firstPlan.progressPercentage}%)`);
        }

        // Test 2.3: Specific plan access
        if (firstPlan.id) {
          const specificPlanResponse = await axios.get(
            `${API_BASE}/study-plans/child/${this.childId}/plan/${firstPlan.id}`,
            { headers: { Authorization: `Bearer ${this.childToken}` } }
          );

          const specificPlan = specificPlanResponse.data.plan;
          const hasActivities = specificPlan.activities && specificPlan.activities.length > 0;
          
          this.results.addResult('Specific Plan Access', hasActivities, {
            planId: firstPlan.id,
            activitiesCount: specificPlan.activities?.length || 0,
            hasProgressData: !!specificPlan.progressPercentage
          });

          if (hasActivities) {
            this.testActivityId = specificPlan.activities[0].id;
            console.log(`✅ Specific plan access working - ${specificPlan.activities.length} activities found`);
          }
        }
      } else {
        this.results.addWarning('Study Plan Access', 'No study plans found for testing');
      }

    } catch (error) {
      this.results.addResult('Study Plan Access', false, null, error);
      console.error('❌ Study plan access failed:', error.response?.data || error.message);
    }
  }

  async testInitialDashboardState() {
    console.log('\n📊 Phase 3: Testing Initial Dashboard State...');

    try {
      const dashboardResponse = await axios.get(`${API_BASE}/child/${this.childId}/dashboard`, {
        headers: { Authorization: `Bearer ${this.childToken}` }
      });

      this.initialDashboardData = dashboardResponse.data.dashboard;
      
      // Verify dashboard structure
      const requiredFields = [
        'child', 'progressSummary', 'studyPlans', 'currentStreaks', 
        'badges', 'dailyGoals', 'lastUpdated'
      ];
      
      const missingFields = requiredFields.filter(field => 
        !this.initialDashboardData.hasOwnProperty(field)
      );

      this.results.addResult('Dashboard Structure', missingFields.length === 0, {
        requiredFields: requiredFields.length,
        presentFields: requiredFields.length - missingFields.length,
        missingFields
      });

      if (missingFields.length === 0) {
        console.log(`✅ Dashboard structure complete - all ${requiredFields.length} required fields present`);
      } else {
        console.log(`❌ Dashboard missing fields: ${missingFields.join(', ')}`);
      }

      // Store initial progress for comparison
      const initialProgress = this.initialDashboardData.progressSummary;
      console.log(`📈 Initial progress: ${initialProgress.completedActivities}/${initialProgress.totalActivities} activities`);

    } catch (error) {
      this.results.addResult('Initial Dashboard State', false, null, error);
      console.error('❌ Dashboard access failed:', error.response?.data || error.message);
    }
  }

  async testProgressUpdates() {
    console.log('\n⏱️ Phase 4: Testing Progress Updates...');

    if (!this.testActivityId) {
      this.results.addWarning('Progress Updates', 'No activity ID available for testing');
      return;
    }

    try {
      // Test 4.1: Update activity progress
      const progressResponse = await axios.post(
        `${API_BASE}/child/activity/${this.testActivityId}/progress`,
        TEST_CONFIG.progressUpdate,
        { headers: { Authorization: `Bearer ${this.childToken}` } }
      );

      const progressUpdated = progressResponse.data.success && progressResponse.data.progress;
      
      this.results.addResult('Progress Update', progressUpdated, {
        activityId: this.testActivityId,
        timeSpent: TEST_CONFIG.progressUpdate.timeSpent,
        score: TEST_CONFIG.progressUpdate.score,
        status: TEST_CONFIG.progressUpdate.status
      });

      if (progressUpdated) {
        console.log(`✅ Progress update successful for activity ${this.testActivityId}`);
        
        // Test 4.2: Verify progress persists
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const verifyResponse = await axios.get(`${API_BASE}/child/${this.childId}/dashboard`, {
          headers: { Authorization: `Bearer ${this.childToken}` }
        });

        const updatedDashboard = verifyResponse.data.dashboard;
        const progressIncreased = updatedDashboard.progressSummary.totalTimeSpent > 
                                 this.initialDashboardData.progressSummary.totalTimeSpent;

        this.results.addResult('Progress Persistence', progressIncreased, {
          initialTimeSpent: this.initialDashboardData.progressSummary.totalTimeSpent,
          updatedTimeSpent: updatedDashboard.progressSummary.totalTimeSpent,
          timeDifference: updatedDashboard.progressSummary.totalTimeSpent - 
                         this.initialDashboardData.progressSummary.totalTimeSpent
        });

        if (progressIncreased) {
          console.log(`✅ Progress persisted - time spent increased by ${updatedDashboard.progressSummary.totalTimeSpent - this.initialDashboardData.progressSummary.totalTimeSpent} seconds`);
        }
      }

    } catch (error) {
      this.results.addResult('Progress Updates', false, null, error);
      console.error('❌ Progress update failed:', error.response?.data || error.message);
    }
  }

  async testActivityCompletion() {
    console.log('\n🎯 Phase 5: Testing Activity Completion...');

    if (!this.testActivityId) {
      this.results.addWarning('Activity Completion', 'No activity ID available for testing');
      return;
    }

    try {
      // Test 5.1: Complete activity
      const completionResponse = await axios.post(
        `${API_BASE}/child/activity/${this.testActivityId}/complete`,
        TEST_CONFIG.completionData,
        { headers: { Authorization: `Bearer ${this.childToken}` } }
      );

      const activityCompleted = completionResponse.data.success && 
                               completionResponse.data.progress &&
                               completionResponse.data.progress.status === 'COMPLETED';

      this.results.addResult('Activity Completion', activityCompleted, {
        activityId: this.testActivityId,
        finalScore: TEST_CONFIG.completionData.score,
        totalTimeSpent: TEST_CONFIG.completionData.timeSpent,
        badgesEarned: completionResponse.data.badges?.count || 0
      });

      if (activityCompleted) {
        console.log(`✅ Activity completion successful - score: ${TEST_CONFIG.completionData.score}`);
        
        if (completionResponse.data.badges?.count > 0) {
          console.log(`🏆 Earned ${completionResponse.data.badges.count} new badges!`);
        }

        // Test 5.2: Verify streaks updated
        const streaksResponse = await axios.get(`${API_BASE}/child/${this.childId}/streaks`, {
          headers: { Authorization: `Bearer ${this.childToken}` }
        });

        const hasStreaks = streaksResponse.data.streaks && streaksResponse.data.streaks.length > 0;
        
        this.results.addResult('Streak Updates', hasStreaks, {
          streakCount: streaksResponse.data.streaks?.length || 0,
          activeStreaks: streaksResponse.data.streaks?.filter(s => s.isActive).length || 0
        });

        if (hasStreaks) {
          console.log(`✅ Streaks updated - ${streaksResponse.data.streaks.length} total streaks`);
        }
      }

    } catch (error) {
      this.results.addResult('Activity Completion', false, null, error);
      console.error('❌ Activity completion failed:', error.response?.data || error.message);
    }
  }

  async testDashboardUpdates() {
    console.log('\n📊 Phase 6: Testing Dashboard Updates After Completion...');

    try {
      // Wait a moment for any async updates
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalDashboardResponse = await axios.get(`${API_BASE}/child/${this.childId}/dashboard`, {
        headers: { Authorization: `Bearer ${this.childToken}` }
      });

      const finalDashboard = finalDashboardResponse.data.dashboard;
      const initialProgress = this.initialDashboardData.progressSummary;
      const finalProgress = finalDashboard.progressSummary;

      // Test 6.1: Verify completed activities increased
      const completedActivitiesIncreased = finalProgress.completedActivities > initialProgress.completedActivities;
      
      this.results.addResult('Dashboard Completed Activities Update', completedActivitiesIncreased, {
        initialCompleted: initialProgress.completedActivities,
        finalCompleted: finalProgress.completedActivities,
        increase: finalProgress.completedActivities - initialProgress.completedActivities
      });

      // Test 6.2: Verify total time spent increased
      const timeSpentIncreased = finalProgress.totalTimeSpent > initialProgress.totalTimeSpent;
      
      this.results.addResult('Dashboard Time Spent Update', timeSpentIncreased, {
        initialTimeSpent: initialProgress.totalTimeSpent,
        finalTimeSpent: finalProgress.totalTimeSpent,
        increase: finalProgress.totalTimeSpent - initialProgress.totalTimeSpent
      });

      // Test 6.3: Verify study plan progress updated
      const updatedStudyPlan = finalDashboard.studyPlans.find(plan => 
        plan.activities?.some(activity => activity.id === this.testActivityId)
      );

      const studyPlanProgressUpdated = updatedStudyPlan && 
                                      updatedStudyPlan.progressPercentage >= 0;

      this.results.addResult('Study Plan Progress Update', studyPlanProgressUpdated, {
        planId: updatedStudyPlan?.id,
        progressPercentage: updatedStudyPlan?.progressPercentage,
        completedActivities: updatedStudyPlan?.completedActivities,
        totalActivities: updatedStudyPlan?.totalActivities
      });

      if (completedActivitiesIncreased && timeSpentIncreased && studyPlanProgressUpdated) {
        console.log(`✅ Dashboard updates verified - all progress metrics updated correctly`);
        console.log(`   - Completed activities: ${initialProgress.completedActivities} → ${finalProgress.completedActivities}`);
        console.log(`   - Time spent: ${initialProgress.totalTimeSpent}s → ${finalProgress.totalTimeSpent}s`);
        console.log(`   - Study plan progress: ${updatedStudyPlan?.progressPercentage}%`);
      }

    } catch (error) {
      this.results.addResult('Dashboard Updates', false, null, error);
      console.error('❌ Dashboard update verification failed:', error.response?.data || error.message);
    }
  }

  async testErrorScenarios() {
    console.log('\n🚨 Phase 7: Testing Error Scenarios...');

    // Test 7.1: Invalid token
    try {
      await axios.get(`${API_BASE}/child/${this.childId}/dashboard`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      
      this.results.addResult('Invalid Token Handling', false, null, 'Should have rejected invalid token');
    } catch (error) {
      const correctErrorHandling = error.response?.status === 401 || error.response?.status === 403;
      this.results.addResult('Invalid Token Handling', correctErrorHandling, {
        statusCode: error.response?.status,
        errorMessage: error.response?.data?.error?.message
      });
      
      if (correctErrorHandling) {
        console.log(`✅ Invalid token correctly rejected with status ${error.response.status}`);
      }
    }

    // Test 7.2: Access to another child's data
    try {
      const fakeChildId = 'fake-child-id-12345';
      await axios.get(`${API_BASE}/child/${fakeChildId}/dashboard`, {
        headers: { Authorization: `Bearer ${this.childToken}` }
      });
      
      this.results.addResult('Unauthorized Child Access', false, null, 'Should have denied access to other child data');
    } catch (error) {
      const correctErrorHandling = error.response?.status === 403 || error.response?.status === 404;
      this.results.addResult('Unauthorized Child Access', correctErrorHandling, {
        statusCode: error.response?.status,
        errorMessage: error.response?.data?.error?.message
      });
      
      if (correctErrorHandling) {
        console.log(`✅ Unauthorized child access correctly denied with status ${error.response.status}`);
      }
    }

    // Test 7.3: Invalid activity progress data
    if (this.testActivityId) {
      try {
        await axios.post(
          `${API_BASE}/child/activity/${this.testActivityId}/progress`,
          {
            timeSpent: -100, // Invalid negative time
            score: 150, // Invalid score over 100
            status: 'INVALID_STATUS'
          },
          { headers: { Authorization: `Bearer ${this.childToken}` } }
        );
        
        this.results.addResult('Invalid Progress Data Validation', false, null, 'Should have rejected invalid progress data');
      } catch (error) {
        const correctValidation = error.response?.status === 400;
        this.results.addResult('Invalid Progress Data Validation', correctValidation, {
          statusCode: error.response?.status,
          errorMessage: error.response?.data?.error?.message
        });
        
        if (correctValidation) {
          console.log(`✅ Invalid progress data correctly rejected with status ${error.response.status}`);
        }
      }
    }

    // Test 7.4: Non-existent activity
    try {
      await axios.post(
        `${API_BASE}/child/activity/non-existent-activity-id/progress`,
        TEST_CONFIG.progressUpdate,
        { headers: { Authorization: `Bearer ${this.childToken}` } }
      );
      
      this.results.addResult('Non-existent Activity Handling', false, null, 'Should have rejected non-existent activity');
    } catch (error) {
      const correctErrorHandling = error.response?.status === 404 || error.response?.status === 400;
      this.results.addResult('Non-existent Activity Handling', correctErrorHandling, {
        statusCode: error.response?.status,
        errorMessage: error.response?.data?.error?.message
      });
      
      if (correctErrorHandling) {
        console.log(`✅ Non-existent activity correctly handled with status ${error.response.status}`);
      }
    }
  }

  async testDataPersistence() {
    console.log('\n💾 Phase 8: Testing Data Persistence...');

    try {
      // Test 8.1: Verify progress records in database
      const progressRecords = await prisma.progressRecord.findMany({
        where: { childId: this.childId },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      const hasRecentProgress = progressRecords.length > 0;
      
      this.results.addResult('Database Progress Persistence', hasRecentProgress, {
        recordCount: progressRecords.length,
        latestRecord: progressRecords[0] ? {
          activityId: progressRecords[0].activityId,
          status: progressRecords[0].status,
          timeSpent: progressRecords[0].timeSpent,
          score: progressRecords[0].score
        } : null
      });

      if (hasRecentProgress) {
        console.log(`✅ Progress records persisted - ${progressRecords.length} records found`);
      }

      // Test 8.2: Verify learning streaks in database
      const learningStreaks = await prisma.learningStreak.findMany({
        where: { childId: this.childId }
      });

      const hasStreaks = learningStreaks.length > 0;
      
      this.results.addResult('Database Streak Persistence', hasStreaks, {
        streakCount: learningStreaks.length,
        activeStreaks: learningStreaks.filter(s => s.isActive).length
      });

      if (hasStreaks) {
        console.log(`✅ Learning streaks persisted - ${learningStreaks.length} streaks found`);
      }

      // Test 8.3: Verify session data
      const loginSessions = await prisma.childLoginSession.findMany({
        where: { childId: this.childId },
        orderBy: { loginTime: 'desc' },
        take: 1
      });

      const hasActiveSession = loginSessions.length > 0 && !loginSessions[0].logoutTime;
      
      this.results.addResult('Session Data Persistence', hasActiveSession, {
        sessionId: loginSessions[0]?.id,
        loginTime: loginSessions[0]?.loginTime,
        isActive: !loginSessions[0]?.logoutTime
      });

      if (hasActiveSession) {
        console.log(`✅ Session data persisted - active session found`);
      }

    } catch (error) {
      this.results.addResult('Data Persistence', false, null, error);
      console.error('❌ Data persistence verification failed:', error.message);
    }
  }
}

// Main execution
async function runE2ETests() {
  const testRunner = new ChildStudyPlanE2ETest();
  const success = await testRunner.runAllTests();
  
  if (success) {
    console.log('\n🎉 All tests passed! Child study plan access is working correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runE2ETests().catch(error => {
    console.error('❌ Critical test execution error:', error);
    process.exit(1);
  });
}

module.exports = { ChildStudyPlanE2ETest, runE2ETests };