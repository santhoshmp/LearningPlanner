#!/usr/bin/env node

/**
 * Child Module Test Runner
 * 
 * Runs comprehensive tests for the child progress module including:
 * - Unit tests for components and services
 * - Integration tests for authentication and progress flows
 * - End-to-end tests for complete user journeys
 * - Accessibility tests for child-friendly interface compliance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: {
    unit: {
      name: 'Unit Tests',
      command: 'npm test -- --testPathPattern="child|badge|progress" --coverage',
      timeout: 300000 // 5 minutes
    },
    integration: {
      name: 'Integration Tests',
      command: 'npm test -- --testPathPattern="integration.*child" --runInBand',
      timeout: 600000 // 10 minutes
    },
    e2e: {
      name: 'End-to-End Tests',
      command: 'npx cypress run --spec "cypress/e2e/child/**/*"',
      timeout: 900000 // 15 minutes
    },
    accessibility: {
      name: 'Accessibility Tests',
      command: 'npx cypress run --spec "cypress/e2e/accessibility/child-interface-a11y.cy.ts"',
      timeout: 300000 // 5 minutes
    }
  },

  // Output directories
  outputDir: 'test-results/child-module',
  coverageDir: 'coverage/child-module',
  
  // Reporting
  reporters: ['console', 'junit', 'html'],
  
  // Parallel execution
  parallel: process.env.CI ? true : false,
  maxWorkers: process.env.CI ? 2 : 4
};

// Utility functions
const utils = {
  // Create output directories
  createDirectories: () => {
    const dirs = [testConfig.outputDir, testConfig.coverageDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  },

  // Log with timestamp
  log: (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m',   // Red
      WARNING: '\x1b[33m', // Yellow
      RESET: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
  },

  // Execute command with timeout and logging
  executeCommand: async (command, options = {}) => {
    const { timeout = 300000, cwd = process.cwd() } = options;
    
    utils.log(`Executing: ${command}`);
    
    try {
      const result = execSync(command, {
        cwd,
        timeout,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        output: error.stdout || error.stderr || ''
      };
    }
  },

  // Check if backend is running
  checkBackend: async () => {
    try {
      const result = await utils.executeCommand('curl -f http://localhost:3001/health', {
        timeout: 5000
      });
      return result.success;
    } catch {
      return false;
    }
  },

  // Start backend if not running
  startBackend: async () => {
    utils.log('Starting backend server...');
    
    // Check if already running
    if (await utils.checkBackend()) {
      utils.log('Backend already running', 'SUCCESS');
      return true;
    }

    // Start backend in background
    const backendProcess = execSync('cd ../backend && npm run dev > /dev/null 2>&1 &', {
      stdio: 'ignore'
    });

    // Wait for backend to start
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      if (await utils.checkBackend()) {
        utils.log('Backend started successfully', 'SUCCESS');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    utils.log('Failed to start backend', 'ERROR');
    return false;
  },

  // Generate test report
  generateReport: (results) => {
    const reportPath = path.join(testConfig.outputDir, 'test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: Object.keys(results).length,
        passed: Object.values(results).filter(r => r.success).length,
        failed: Object.values(results).filter(r => !r.success).length
      },
      results: results,
      coverage: fs.existsSync(testConfig.coverageDir) ? 
        'Coverage report available in ' + testConfig.coverageDir : 
        'No coverage data available'
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    utils.log(`Test report generated: ${reportPath}`, 'SUCCESS');
    
    return report;
  }
};

// Test suite runners
const runners = {
  // Run unit tests
  runUnitTests: async () => {
    utils.log('Running unit tests for child module...', 'INFO');
    
    const result = await utils.executeCommand(testConfig.suites.unit.command, {
      timeout: testConfig.suites.unit.timeout
    });

    if (result.success) {
      utils.log('Unit tests completed successfully', 'SUCCESS');
    } else {
      utils.log('Unit tests failed', 'ERROR');
      console.log(result.output);
    }

    return result;
  },

  // Run integration tests
  runIntegrationTests: async () => {
    utils.log('Running integration tests for child module...', 'INFO');
    
    // Ensure backend is running
    if (!(await utils.startBackend())) {
      return { success: false, error: 'Backend not available' };
    }

    const result = await utils.executeCommand(testConfig.suites.integration.command, {
      timeout: testConfig.suites.integration.timeout
    });

    if (result.success) {
      utils.log('Integration tests completed successfully', 'SUCCESS');
    } else {
      utils.log('Integration tests failed', 'ERROR');
      console.log(result.output);
    }

    return result;
  },

  // Run E2E tests
  runE2ETests: async () => {
    utils.log('Running E2E tests for child module...', 'INFO');
    
    // Ensure backend is running
    if (!(await utils.startBackend())) {
      return { success: false, error: 'Backend not available' };
    }

    // Set up test environment
    await utils.executeCommand('npm run test:setup-child-env');

    const result = await utils.executeCommand(testConfig.suites.e2e.command, {
      timeout: testConfig.suites.e2e.timeout
    });

    if (result.success) {
      utils.log('E2E tests completed successfully', 'SUCCESS');
    } else {
      utils.log('E2E tests failed', 'ERROR');
      console.log(result.output);
    }

    // Clean up test environment
    await utils.executeCommand('npm run test:cleanup-child-env');

    return result;
  },

  // Run accessibility tests
  runAccessibilityTests: async () => {
    utils.log('Running accessibility tests for child interface...', 'INFO');
    
    // Ensure backend is running
    if (!(await utils.startBackend())) {
      return { success: false, error: 'Backend not available' };
    }

    const result = await utils.executeCommand(testConfig.suites.accessibility.command, {
      timeout: testConfig.suites.accessibility.timeout
    });

    if (result.success) {
      utils.log('Accessibility tests completed successfully', 'SUCCESS');
    } else {
      utils.log('Accessibility tests failed', 'ERROR');
      console.log(result.output);
    }

    return result;
  }
};

// Main test runner
const runChildModuleTests = async () => {
  utils.log('Starting Child Module Test Suite', 'INFO');
  utils.log('='.repeat(50), 'INFO');

  // Create output directories
  utils.createDirectories();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const suitesToRun = args.length > 0 ? args : Object.keys(testConfig.suites);

  const results = {};

  // Run specified test suites
  for (const suite of suitesToRun) {
    if (!testConfig.suites[suite]) {
      utils.log(`Unknown test suite: ${suite}`, 'WARNING');
      continue;
    }

    utils.log(`\nRunning ${testConfig.suites[suite].name}...`, 'INFO');
    utils.log('-'.repeat(30), 'INFO');

    const startTime = Date.now();
    
    try {
      let result;
      switch (suite) {
        case 'unit':
          result = await runners.runUnitTests();
          break;
        case 'integration':
          result = await runners.runIntegrationTests();
          break;
        case 'e2e':
          result = await runners.runE2ETests();
          break;
        case 'accessibility':
          result = await runners.runAccessibilityTests();
          break;
        default:
          result = { success: false, error: 'Unknown suite' };
      }

      const duration = Date.now() - startTime;
      result.duration = duration;
      results[suite] = result;

      if (result.success) {
        utils.log(`${testConfig.suites[suite].name} completed in ${duration}ms`, 'SUCCESS');
      } else {
        utils.log(`${testConfig.suites[suite].name} failed after ${duration}ms`, 'ERROR');
      }
    } catch (error) {
      utils.log(`Error running ${suite}: ${error.message}`, 'ERROR');
      results[suite] = { success: false, error: error.message };
    }
  }

  // Generate final report
  utils.log('\nGenerating test report...', 'INFO');
  const report = utils.generateReport(results);

  // Print summary
  utils.log('\n' + '='.repeat(50), 'INFO');
  utils.log('CHILD MODULE TEST SUMMARY', 'INFO');
  utils.log('='.repeat(50), 'INFO');
  utils.log(`Total Suites: ${report.summary.total}`, 'INFO');
  utils.log(`Passed: ${report.summary.passed}`, 'SUCCESS');
  utils.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'ERROR' : 'INFO');

  // Print individual results
  Object.entries(results).forEach(([suite, result]) => {
    const status = result.success ? 'PASS' : 'FAIL';
    const color = result.success ? 'SUCCESS' : 'ERROR';
    utils.log(`${suite}: ${status} (${result.duration}ms)`, color);
  });

  // Exit with appropriate code
  const exitCode = report.summary.failed > 0 ? 1 : 0;
  utils.log(`\nExiting with code ${exitCode}`, exitCode === 0 ? 'SUCCESS' : 'ERROR');
  
  process.exit(exitCode);
};

// Handle script execution
if (require.main === module) {
  runChildModuleTests().catch(error => {
    utils.log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runChildModuleTests,
  testConfig,
  utils,
  runners
};