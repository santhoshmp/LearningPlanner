#!/usr/bin/env node

/**
 * This script runs visual regression tests using Storybook and Chromatic.
 * It can be used in CI/CD pipelines or locally for development.
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const STORYBOOK_BUILD_DIR = path.join(__dirname, '../storybook-static');
const CHROMATIC_PROJECT_TOKEN = process.env.CHROMATIC_PROJECT_TOKEN;

// Ensure we have a project token
if (!CHROMATIC_PROJECT_TOKEN) {
  console.error('Error: CHROMATIC_PROJECT_TOKEN environment variable is not set.');
  console.error('Please set it before running this script.');
  process.exit(1);
}

// Build Storybook
console.log('Building Storybook...');
try {
  execSync('npm run build-storybook', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to build Storybook:', error);
  process.exit(1);
}

// Run Chromatic
console.log('Running Chromatic visual tests...');
try {
  execSync(`npx chromatic --project-token=${CHROMATIC_PROJECT_TOKEN} --storybook-build-dir=${STORYBOOK_BUILD_DIR} --exit-zero-on-changes`, 
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('Chromatic test failed:', error);
  process.exit(1);
}

console.log('Visual regression tests completed successfully!');