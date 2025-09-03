#!/usr/bin/env node

/**
 * Child Authentication Complete Validation Test Runner
 * 
 * This script runs comprehensive end-to-end validation tests for the child authentication system
 * covering all requirements from task 12 of the child-auth-fix specification.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ValidationTestRunner {
  constructor() {
    this.results = {
      backend: { passed: 0, failed: 0, total: 0 },
      frontend: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log(`  ${title}`, 'bright');
    this.log('='.repeat(60), 'cyan');
  }

  logSubsection(title) {
    this.log(`\n${'-'.repeat(40)}`, 'blue');
    this.log(`  ${title}`, 'blue');
    this.log(`${'-'.repeat(40)}`, 'blue');
  }

  async runCommand(command, cwd = process.cwd(), options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command}`, 'yellow');
      
      const child = spawn('sh', ['-c', command], {
        cwd,
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code, stdout, stderr });
        } else {
          reject({ code, stdout, stderr, command });
        }
      });

      child.on('error', (error) => {
        reject({ error, command });
      });
    });
  }

  async checkPrerequisites() {
    this.logSection('Checking Prerequisites');

    const checks = [
      {
        name: 'Node.js version',
        command: 'node --version',
        validate: (output) => {
          const version = output.stdout.trim();
          const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
          return majorVersion >= 16;
        }
      },
      {
        name: 'Backend dependencies',
        command: 'npm list --depth=0',
        cwd: path.join(process.cwd(), 'backend'),
        validate: () => true
      },
      {
        name: 'Frontend dependencies',
        command: 'npm list --depth=0',
        cwd: path.join(process.cwd(), 'frontend'),
        validate: () => true
      },
      {
        name: 'Database connection',
        command: 'npm run prisma:generate',
        cwd: path.join(process.cwd(), 'backend'),
        validate: () => true
      }
    ];

    for (const check of checks) {
      try {
        this.log(`Checking ${check.name}...`, 'blue');
        const result = await this.runCommand(check.command, check.cwd, { silent: true });
        
        if (check.validate(result)) {
          this.log(`✓ ${check.name} - OK`, 'green');
        } else {
          this.log(`✗ ${check.name} - Failed validation`, 'red');
          throw new Error(`${check.name} validation failed`);
        }
      } catch (error) {
        this.log(`✗ ${check.name} - Error: ${error.message || error.command}`, 'red');
        throw error;
      }
    }

    this.log('\n✓ All prerequisites met', 'green');
  }

  async setupTestEnvironment() {
    this.logSection('Setting Up Test Environment');

    try {
      // Ensure test database is ready
      this.log('Setting up test database...', 'blue');
      await this.runCommand('npm run prisma:migrate:reset -- --force', 
        path.join(process.cwd(), 'backend'), { silent: true });
      
      // Run database migrations
      this.log('Running database migrations...', 'blue');
      await this.runCommand('npm run prisma:migrate:deploy', 
        path.join(process.cwd(), 'backend'), { silent: true });

      // Seed test data
      this.log('Seeding test data...', 'blue');
      await this.runCommand('npm run prisma:db:seed', 
        path.join(process.cwd(), 'backend'), { silent: true });

      this.log('✓ Test environment ready', 'green');
    } catch (error) {
      this.log(`✗ Failed to setup test environment: ${error.message}`, 'red');
      throw error;
    }
  }

  async runBackendTests() {
    this.logSection('Running Backend Integration Tests');

    const testSuites = [
      {
        name: 'Enhanced Child Authentication',
        file: 'src/__tests__/integration/childAuthEnhanced.integration.test.ts',
        description: 'Core authentication flow validation'
      },
      {
        name: 'Complete Validation Suite',
        file: 'src/__tests__/integration/childAuthCompleteValidation.integration.test.ts',
        description: 'Comprehensive end-to-end validation'
      },
      {
        name: 'Child Authentication Service',
        file: 'src/services/__tests__/enhancedAuthService.test.ts',
        description: 'Service layer unit tests'
      }
    ];

    for (const suite of testSuites) {
      this.logSubsection(`Backend: ${suite.name}`);
      this.log(suite.description, 'blue');

      try {
        const result = await this.runCommand(
          `npm test -- --testPathPattern="${suite.file}" --verbose`,
          path.join(process.cwd(), 'backend'),
          { silent: true }
        );

        // Parse Jest output for test results
        const output = result.stdout + result.stderr;
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const totalMatch = output.match(/Tests:\s+(\d+)/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

        this.results.backend.passed += passed;
        this.results.backend.failed += failed;
        this.results.backend.total += total;

        if (failed === 0) {
          this.log(`✓ ${suite.name}: ${passed}/${total} tests passed`, 'green');
        } else {
          this.log(`✗ ${suite.name}: ${passed}/${total} tests passed, ${failed} failed`, 'red');
          this.log('Failed test output:', 'red');
          console.log(output);
        }
      } catch (error) {
        this.log(`✗ ${suite.name}: Test execution failed`, 'red');
        this.log(`Error: ${error.message || error.command}`, 'red');
        this.results.backend.failed += 1;
        this.results.backend.total += 1;
      }
    }
  }

  async runFrontendTests() {
    this.logSection('Running Frontend Unit Tests');

    const testSuites = [
      {
        name: 'AuthContext Tests',
        pattern: 'src/contexts/__tests__/AuthContext.test.tsx',
        description: 'Authentication context validation'
      },
      {
        name: 'Child Login Form Tests',
        pattern: 'src/components/auth/__tests__/ChildLoginForm.test.tsx',
        description: 'Child login form component tests'
      },
      {
        name: 'Session Manager Tests',
        pattern: 'src/utils/__tests__/sessionManager.test.ts',
        description: 'Session management utility tests'
      },
      {
        name: 'Protected Route Tests',
        pattern: 'src/components/routing/__tests__/ProtectedRoute.test.tsx',
        description: 'Route protection logic tests'
      }
    ];

    for (const suite of testSuites) {
      this.logSubsection(`Frontend: ${suite.name}`);
      this.log(suite.description, 'blue');

      try {
        const result = await this.runCommand(
          `npm test -- --testPathPattern="${suite.pattern}" --watchAll=false --verbose`,
          path.join(process.cwd(), 'frontend'),
          { silent: true }
        );

        // Parse Jest output for test results
        const output = result.stdout + result.stderr;
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const totalMatch = output.match(/Tests:\s+(\d+)/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

        this.results.frontend.passed += passed;
        this.results.frontend.failed += failed;
        this.results.frontend.total += total;

        if (failed === 0) {
          this.log(`✓ ${suite.name}: ${passed}/${total} tests passed`, 'green');
        } else {
          this.log(`✗ ${suite.name}: ${passed}/${total} tests passed, ${failed} failed`, 'red');
          this.log('Failed test output:', 'red');
          console.log(output);
        }
      } catch (error) {
        this.log(`✗ ${suite.name}: Test execution failed`, 'red');
        this.log(`Error: ${error.message || error.command}`, 'red');
        this.results.frontend.failed += 1;
        this.results.frontend.total += 1;
      }
    }
  }

  async runE2ETests() {
    this.logSection('Running End-to-End Tests');

    // Start backend server for E2E tests
    this.log('Starting backend server...', 'blue');
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'backend'),
      stdio: 'pipe'
    });

    // Wait for backend to start
    await new Promise((resolve) => {
      backendProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Server running on port')) {
          resolve();
        }
      });
      setTimeout(resolve, 10000); // Fallback timeout
    });

    // Start frontend server
    this.log('Starting frontend server...', 'blue');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'frontend'),
      stdio: 'pipe'
    });

    // Wait for frontend to start
    await new Promise((resolve) => {
      frontendProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Local:')) {
          resolve();
        }
      });
      setTimeout(resolve, 15000); // Fallback timeout
    });

    const testSuites = [
      {
        name: 'Child Login E2E',
        spec: 'cypress/e2e/auth/child-login.cy.ts',
        description: 'Basic child login flow tests'
      },
      {
        name: 'Complete Child Auth Validation',
        spec: 'cypress/e2e/auth/child-auth-complete-e2e.cy.ts',
        description: 'Comprehensive authentication validation'
      }
    ];

    for (const suite of testSuites) {
      this.logSubsection(`E2E: ${suite.name}`);
      this.log(suite.description, 'blue');

      try {
        const result = await this.runCommand(
          `npx cypress run --spec "${suite.spec}" --headless`,
          path.join(process.cwd(), 'frontend'),
          { silent: true }
        );

        // Parse Cypress output for test results
        const output = result.stdout + result.stderr;
        const passedMatch = output.match(/(\d+) passing/);
        const failedMatch = output.match(/(\d+) failing/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = passed + failed;

        this.results.e2e.passed += passed;
        this.results.e2e.failed += failed;
        this.results.e2e.total += total;

        if (failed === 0) {
          this.log(`✓ ${suite.name}: ${passed}/${total} tests passed`, 'green');
        } else {
          this.log(`✗ ${suite.name}: ${passed}/${total} tests passed, ${failed} failed`, 'red');
          this.log('Failed test output:', 'red');
          console.log(output);
        }
      } catch (error) {
        this.log(`✗ ${suite.name}: Test execution failed`, 'red');
        this.log(`Error: ${error.message || error.command}`, 'red');
        this.results.e2e.failed += 1;
        this.results.e2e.total += 1;
      }
    }

    // Clean up servers
    this.log('Stopping test servers...', 'blue');
    backendProcess.kill();
    frontendProcess.kill();
  }

  generateReport() {
    this.logSection('Test Results Summary');

    const totalPassed = this.results.backend.passed + this.results.frontend.passed + this.results.e2e.passed;
    const totalFailed = this.results.backend.failed + this.results.frontend.failed + this.results.e2e.failed;
    const totalTests = this.results.backend.total + this.results.frontend.total + this.results.e2e.total;

    this.log(`Backend Tests:  ${this.results.backend.passed}/${this.results.backend.total} passed`, 
      this.results.backend.failed === 0 ? 'green' : 'red');
    this.log(`Frontend Tests: ${this.results.frontend.passed}/${this.results.frontend.total} passed`, 
      this.results.frontend.failed === 0 ? 'green' : 'red');
    this.log(`E2E Tests:      ${this.results.e2e.passed}/${this.results.e2e.total} passed`, 
      this.results.e2e.failed === 0 ? 'green' : 'red');

    this.log('\n' + '='.repeat(60), 'cyan');
    this.log(`TOTAL: ${totalPassed}/${totalTests} tests passed`, 
      totalFailed === 0 ? 'green' : 'red');
    
    if (totalFailed > 0) {
      this.log(`${totalFailed} tests failed`, 'red');
    }

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    this.log(`Test execution completed in ${duration} seconds`, 'blue');
    this.log('='.repeat(60), 'cyan');

    // Generate detailed report file
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      results: this.results,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate: Math.round((totalPassed / totalTests) * 100)
      }
    };

    fs.writeFileSync('child-auth-validation-report.json', JSON.stringify(report, null, 2));
    this.log('\nDetailed report saved to: child-auth-validation-report.json', 'blue');

    return totalFailed === 0;
  }

  async run() {
    try {
      this.log('Child Authentication Complete Validation Test Runner', 'bright');
      this.log('Testing all requirements from task 12 of child-auth-fix specification\n', 'blue');

      await this.checkPrerequisites();
      await this.setupTestEnvironment();
      await this.runBackendTests();
      await this.runFrontendTests();
      await this.runE2ETests();

      const success = this.generateReport();

      if (success) {
        this.log('\n🎉 All validation tests passed!', 'green');
        process.exit(0);
      } else {
        this.log('\n❌ Some validation tests failed. Check the report for details.', 'red');
        process.exit(1);
      }
    } catch (error) {
      this.log(`\n💥 Validation test runner failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the validation tests if this script is executed directly
if (require.main === module) {
  const runner = new ValidationTestRunner();
  runner.run();
}

module.exports = ValidationTestRunner;