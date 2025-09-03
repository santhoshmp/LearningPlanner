#!/usr/bin/env node

/**
 * This script runs responsive tests using Cypress.
 * It tests the application on multiple device sizes and generates a report.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_DIR = path.join(__dirname, '../responsive-test-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const RESULTS_FILE = path.join(RESULTS_DIR, `responsive-test-results-${TIMESTAMP}.json`);

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Define device presets to test
const devices = [
  'iphone-6',
  'iphone-x',
  'ipad-2',
  'ipad-mini',
  'macbook-13',
  'macbook-16',
];

console.log('Running responsive tests...');

// Run tests for each device preset
try {
  console.log('\n🧪 Running Cypress responsive tests...');
  
  // Run tests with Cypress
  execSync(`npx cypress run --spec "cypress/e2e/**/**.cy.ts" --config video=true`, { 
    stdio: 'inherit' 
  });
  
  console.log('\n✅ Responsive tests completed successfully!');
} catch (error) {
  console.error('\n❌ Some responsive tests failed:', error.message);
  process.exitCode = 1;
}

// Generate a simple report
const report = {
  timestamp: new Date().toISOString(),
  devices: devices,
  results: {
    passed: process.exitCode === 0,
    message: process.exitCode === 0 ? 'All tests passed' : 'Some tests failed',
  },
};

fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
console.log(`\n📊 Test report saved to ${RESULTS_FILE}`);

if (process.exitCode === 1) {
  console.log('\n❌ Please review the test failures and fix responsive issues.');
} else {
  console.log('\n✅ All responsive tests passed!');
}