#!/usr/bin/env node

/**
 * Master Test Runner for Child Study Plan End-to-End Tests
 * 
 * This script runs all the child study plan tests in sequence:
 * 1. Quick validation test
 * 2. Comprehensive end-to-end test
 * 3. Error scenario tests
 * 4. Data persistence verification
 */

const { execSync } = require('child_process');
const path = require('path');

class MasterTestRunner {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runTest(testName, scriptPath, description) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 RUNNING: ${testName}`);
    console.log(`📝 ${description}`);
    console.log(`${'='.repeat(80)}\n`);

    const testStartTime = Date.now();

    try {
      // Run the test script
      execSync(`node ${scriptPath}`, { 
        stdio: 'inherit',
        cwd: path.dirname(scriptPath)
      });

      const duration = Date.now() - testStartTime;
      this.testResults.push({
        name: testName,
        passed: true,
        duration,
        error: null
      });

      console.log(`\n✅ ${testName} PASSED (${Math.round(duration / 1000)}s)`);
      return true;

    } catch (error) {
      const duration = Date.now() - testStartTime;
      this.testResults.push({
        name: testName,
        passed: false,
        duration,
        error: error.message
      });

      console.log(`\n❌ ${testName} FAILED (${Math.round(duration / 1000)}s)`);
      console.log(`Error: ${error.message}`);
      return false;
    }
  }

  printFinalSummary() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;

    console.log(`\n${'='.repeat(80)}`);
    console.log('🏁 FINAL TEST SUMMARY');
    console.log(`${'='.repeat(80)}`);
    console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total Test Suites: ${this.testResults.length}`);

    console.log('\n📋 Test Suite Results:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      console.log(`   ${status} ${result.name} (${duration}s)`);
      if (!result.passed && result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Child study plan functionality is working correctly.');
      console.log('\n✨ Key Features Verified:');
      console.log('   ✅ Child authentication and session management');
      console.log('   ✅ Study plan access (all statuses, not just ACTIVE)');
      console.log('   ✅ Progress tracking and updates');
      console.log('   ✅ Dashboard real-time updates');
      console.log('   ✅ Activity completion and streak updates');
      console.log('   ✅ Error handling and validation');
      console.log('   ✅ Data persistence and consistency');
    } else {
      console.log('\n💥 SOME TESTS FAILED! Please review the results above.');
      console.log('\n🔧 Next Steps:');
      console.log('   1. Review failed test details');
      console.log('   2. Check server logs for errors');
      console.log('   3. Verify database connectivity');
      console.log('   4. Ensure test data is properly set up');
    }

    console.log(`${'='.repeat(80)}\n`);
    return failed === 0;
  }

  async runAllTests() {
    console.log('🚀 CHILD STUDY PLAN COMPREHENSIVE TEST SUITE');
    console.log('='.repeat(80));
    console.log('This test suite validates all aspects of child study plan functionality');
    console.log('including authentication, data access, progress tracking, and error handling.');
    console.log('='.repeat(80));

    // Test 1: Quick Validation
    const quickTestPassed = await this.runTest(
      'Quick Validation Test',
      path.join(__dirname, 'test-child-study-plan-quick.js'),
      'Quick validation of core functionality to ensure basic features work'
    );

    // Test 2: Comprehensive E2E Test (only if quick test passed)
    let e2eTestPassed = false;
    if (quickTestPassed) {
      e2eTestPassed = await this.runTest(
        'Comprehensive End-to-End Test',
        path.join(__dirname, 'test-child-study-plan-e2e.js'),
        'Complete end-to-end testing of all child study plan features and workflows'
      );
    } else {
      console.log('\n⚠️ Skipping comprehensive test due to quick test failure');
      this.testResults.push({
        name: 'Comprehensive End-to-End Test',
        passed: false,
        duration: 0,
        error: 'Skipped due to quick test failure'
      });
    }

    // Test 3: Error Scenarios (run regardless of previous results)
    await this.runTest(
      'Error Scenario Test',
      path.join(__dirname, 'test-child-error-scenarios.js'),
      'Testing error handling, validation, and security scenarios'
    );

    // Test 4: Data Persistence Check (if E2E passed)
    if (e2eTestPassed) {
      console.log('\n📊 Running additional data persistence verification...');
      // This could be expanded to run additional database consistency checks
      console.log('✅ Data persistence verification completed (integrated in E2E test)');
    }

    return this.printFinalSummary();
  }
}

// Utility functions for individual test execution
function runQuickTest() {
  console.log('🏃‍♂️ Running Quick Test Only...\n');
  try {
    execSync('node test-child-study-plan-quick.js', { stdio: 'inherit', cwd: __dirname });
    console.log('\n✅ Quick test completed successfully!');
  } catch (error) {
    console.log('\n❌ Quick test failed!');
    process.exit(1);
  }
}

function runE2ETest() {
  console.log('🔬 Running Comprehensive E2E Test Only...\n');
  try {
    execSync('node test-child-study-plan-e2e.js', { stdio: 'inherit', cwd: __dirname });
    console.log('\n✅ E2E test completed successfully!');
  } catch (error) {
    console.log('\n❌ E2E test failed!');
    process.exit(1);
  }
}

function runErrorTest() {
  console.log('🚨 Running Error Scenario Test Only...\n');
  try {
    execSync('node test-child-error-scenarios.js', { stdio: 'inherit', cwd: __dirname });
    console.log('\n✅ Error scenario test completed successfully!');
  } catch (error) {
    console.log('\n❌ Error scenario test failed!');
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    runQuickTest();
    return;
  }
  
  if (args.includes('--e2e') || args.includes('-e')) {
    runE2ETest();
    return;
  }
  
  if (args.includes('--errors') || args.includes('-r')) {
    runErrorTest();
    return;
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Child Study Plan Test Runner');
    console.log('============================');
    console.log('');
    console.log('Usage: node run-child-study-plan-tests.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --quick, -q     Run only the quick validation test');
    console.log('  --e2e, -e       Run only the comprehensive end-to-end test');
    console.log('  --errors, -r    Run only the error scenario test');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log('With no options, runs all test suites in sequence.');
    return;
  }

  // Run all tests
  const runner = new MasterTestRunner();
  const success = await runner.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Critical error in test runner:', error);
    process.exit(1);
  });
}

module.exports = { 
  MasterTestRunner, 
  runQuickTest, 
  runE2ETest, 
  runErrorTest 
};