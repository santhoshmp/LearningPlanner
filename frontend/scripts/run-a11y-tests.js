#!/usr/bin/env node

/**
 * This script runs automated accessibility tests on the application.
 * It combines Jest unit tests with axe-core and Storybook accessibility tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_RESULTS_DIR = path.join(__dirname, '../a11y-test-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const RESULTS_FILE = path.join(TEST_RESULTS_DIR, `a11y-test-results-${TIMESTAMP}.json`);

// Ensure results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

console.log('Running accessibility tests...');

// Run Jest tests with accessibility focus
try {
  console.log('\n🧪 Running Jest accessibility tests...');
  execSync('npm test -- -t "accessibility|a11y|should not have any accessibility violations"', { 
    stdio: 'inherit' 
  });
} catch (error) {
  console.error('❌ Jest accessibility tests failed:', error.message);
  process.exitCode = 1;
}

// Run Storybook accessibility tests
try {
  console.log('\n📚 Running Storybook accessibility tests...');
  execSync('npm run test-storybook -- --coverage', { 
    stdio: 'inherit' 
  });
  
  // Copy Storybook a11y results if they exist
  const storybookResultsPath = path.join(__dirname, '../storybook-coverage/a11y-results.json');
  if (fs.existsSync(storybookResultsPath)) {
    const storybookResults = fs.readFileSync(storybookResultsPath);
    fs.writeFileSync(RESULTS_FILE, storybookResults);
    console.log(`\n✅ Accessibility test results saved to ${RESULTS_FILE}`);
  }
} catch (error) {
  console.error('❌ Storybook accessibility tests failed:', error.message);
  process.exitCode = 1;
}

console.log('\n🔍 Accessibility testing complete!');
if (process.exitCode === 1) {
  console.log('❌ Some accessibility tests failed. Please review the output above.');
} else {
  console.log('✅ All accessibility tests passed!');
}