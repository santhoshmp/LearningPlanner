#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { DemoDataSeedingService, DemoSeedingConfig } from '../services/demoDataSeedingService';
import { MockDataGeneratorService, MockDataConfig } from '../services/mockDataGeneratorService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface CliOptions {
  command: 'seed' | 'clear' | 'generate-single' | 'help';
  familyCount?: number;
  childrenPerFamily?: string; // "min-max" format
  timeRangeMonths?: number;
  childId?: string;
  profile?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = { command: 'help' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case 'seed':
        options.command = 'seed';
        break;
      case 'clear':
        options.command = 'clear';
        break;
      case 'generate-single':
        options.command = 'generate-single';
        break;
      case '--families':
        options.familyCount = parseInt(args[++i]) || 3;
        break;
      case '--children':
        options.childrenPerFamily = args[++i] || '1-3';
        break;
      case '--months':
        options.timeRangeMonths = parseInt(args[++i]) || 6;
        break;
      case '--child-id':
        options.childId = args[++i];
        break;
      case '--profile':
        options.profile = args[++i] || 'balanced';
        break;
      case '--help':
      case '-h':
        options.command = 'help';
        break;
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Demo Data CLI - Generate realistic mock data for AI Study Planner

USAGE:
  npm run demo-data <command> [options]

COMMANDS:
  seed              Seed comprehensive demo data with multiple families
  clear             Clear all existing demo data
  generate-single   Generate data for a single child
  help              Show this help message

OPTIONS:
  --families <n>        Number of demo families to create (default: 3)
  --children <min-max>  Children per family range (default: "1-3")
  --months <n>          Time range in months for historical data (default: 6)
  --child-id <id>       Child ID for single generation
  --profile <type>      Learning profile type for single generation
                        (balanced, high-achiever, struggling, stem-focused, arts-focused)

EXAMPLES:
  npm run demo-data seed --families 5 --children "2-4" --months 12
  npm run demo-data generate-single --child-id "child-123" --profile "high-achiever"
  npm run demo-data clear

LEARNING PROFILES:
  balanced          Average student with balanced subject preferences
  high-achiever     Fast learner, challenging difficulty, consistent
  struggling        Slow learner, conservative difficulty, needs help
  stem-focused      Strong in math/science, challenging difficulty
  arts-focused      Strong in arts/language, creative preferences
  inconsistent      Variable performance and engagement
  help-seeking      Frequently requests help, moderate performance
  independent       Self-directed learner, minimal help requests
`);
}

/**
 * Seed comprehensive demo data
 */
async function seedDemoData(options: CliOptions) {
  try {
    console.log('🌱 Starting demo data seeding...');
    
    const [min, max] = (options.childrenPerFamily || '1-3').split('-').map(n => parseInt(n));
    
    const config: DemoSeedingConfig = {
      familyCount: options.familyCount || 3,
      childrenPerFamily: { min: min || 1, max: max || 3 },
      timeRangeMonths: options.timeRangeMonths || 6,
      includeVariedProfiles: true,
      generateResourceUsage: true,
      createRealisticProgression: true
    };

    const seedingService = new DemoDataSeedingService(prisma);
    const result = await seedingService.seedDemoData(config);

    if (result.success) {
      console.log('✅ Demo data seeding completed successfully!');
      console.log(`
📊 SUMMARY:
  Families created: ${result.familiesCreated}
  Children created: ${result.childrenCreated}
  Progress records: ${result.progressRecordsCreated}
  Content interactions: ${result.contentInteractionsCreated}
  Resource usage records: ${result.resourceUsageCreated}
  
  Subjects covered: ${result.summary.subjectsCovered.join(', ')}
  Grades covered: ${result.summary.gradesCovered.join(', ')}
  
  Duration: ${(result.duration / 1000).toFixed(2)}s
`);
    } else {
      console.log('❌ Demo data seeding completed with errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

/**
 * Clear existing demo data
 */
async function clearDemoData() {
  try {
    console.log('🧹 Clearing existing demo data...');
    
    const seedingService = new DemoDataSeedingService(prisma);
    await seedingService.clearDemoData();
    
    console.log('✅ Demo data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    process.exit(1);
  }
}

/**
 * Generate data for a single child
 */
async function generateSingleChild(options: CliOptions) {
  try {
    if (!options.childId) {
      console.error('❌ Child ID is required for single generation. Use --child-id <id>');
      process.exit(1);
    }

    console.log(`🎯 Generating mock data for child: ${options.childId}`);

    // Check if child exists
    const child = await prisma.childProfile.findUnique({
      where: { id: options.childId },
      select: { gradeLevel: true, firstName: true }
    });

    if (!child) {
      console.error(`❌ Child not found: ${options.childId}`);
      process.exit(1);
    }

    // Generate learning profile based on specified type
    const profile = generateLearningProfile(options.childId, options.profile || 'balanced', options.timeRangeMonths || 6);

    const mockDataService = new MockDataGeneratorService(prisma);
    const mockData = await mockDataService.generateRealisticMockData(profile);

    console.log(`✅ Generated mock data for ${child.firstName}:`);
    console.log(`  Progress records: ${mockData.progressRecords.length}`);
    console.log(`  Content interactions: ${mockData.contentInteractions.length}`);
    console.log(`  Resource usage: ${mockData.resourceUsage.length}`);
    console.log(`  Help requests: ${mockData.helpRequests.length}`);
    console.log(`  Achievements: ${mockData.achievements.length}`);

  } catch (error) {
    console.error('❌ Error generating single child data:', error);
    process.exit(1);
  }
}

/**
 * Generate learning profile based on type
 */
function generateLearningProfile(childId: string, profileType: string, timeRangeMonths: number): MockDataConfig {
  const baseConfig: MockDataConfig = {
    childId,
    timeRangeMonths,
    learningVelocity: 'average',
    subjectPreferences: {
      'mathematics': 0.5,
      'english-language-arts': 0.5,
      'science': 0.5,
      'social-studies': 0.5,
      'visual-arts': 0.5,
      'music': 0.5,
      'physical-education': 0.5
    },
    difficultyPreference: 'balanced',
    sessionFrequency: 'medium',
    consistencyLevel: 'moderate',
    helpSeekingBehavior: 'moderate'
  };

  switch (profileType) {
    case 'high-achiever':
      return {
        ...baseConfig,
        learningVelocity: 'fast',
        difficultyPreference: 'challenging',
        sessionFrequency: 'high',
        consistencyLevel: 'consistent',
        helpSeekingBehavior: 'independent',
        subjectPreferences: Object.fromEntries(
          Object.keys(baseConfig.subjectPreferences).map(key => [key, 0.8])
        )
      };

    case 'struggling':
      return {
        ...baseConfig,
        learningVelocity: 'slow',
        difficultyPreference: 'conservative',
        sessionFrequency: 'low',
        consistencyLevel: 'inconsistent',
        helpSeekingBehavior: 'frequent',
        subjectPreferences: Object.fromEntries(
          Object.keys(baseConfig.subjectPreferences).map(key => [key, 0.3])
        )
      };

    case 'stem-focused':
      return {
        ...baseConfig,
        learningVelocity: 'fast',
        difficultyPreference: 'challenging',
        sessionFrequency: 'high',
        consistencyLevel: 'consistent',
        subjectPreferences: {
          ...baseConfig.subjectPreferences,
          'mathematics': 0.9,
          'science': 0.9,
          'computer-science': 0.8
        }
      };

    case 'arts-focused':
      return {
        ...baseConfig,
        learningVelocity: 'average',
        difficultyPreference: 'balanced',
        sessionFrequency: 'medium',
        consistencyLevel: 'consistent',
        subjectPreferences: {
          ...baseConfig.subjectPreferences,
          'visual-arts': 0.9,
          'music': 0.9,
          'english-language-arts': 0.8,
          'drama-theater': 0.8
        }
      };

    case 'inconsistent':
      return {
        ...baseConfig,
        learningVelocity: 'average',
        consistencyLevel: 'inconsistent',
        subjectPreferences: Object.fromEntries(
          Object.keys(baseConfig.subjectPreferences).map(key => [key, Math.random()])
        )
      };

    case 'help-seeking':
      return {
        ...baseConfig,
        learningVelocity: 'slow',
        helpSeekingBehavior: 'frequent',
        difficultyPreference: 'conservative'
      };

    case 'independent':
      return {
        ...baseConfig,
        learningVelocity: 'fast',
        helpSeekingBehavior: 'independent',
        difficultyPreference: 'challenging',
        consistencyLevel: 'consistent'
      };

    default: // balanced
      return baseConfig;
  }
}

/**
 * Main CLI function
 */
async function main() {
  const options = parseArgs();

  try {
    switch (options.command) {
      case 'seed':
        await seedDemoData(options);
        break;
      case 'clear':
        await clearDemoData();
        break;
      case 'generate-single':
        await generateSingleChild(options);
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

export { main, parseArgs, generateLearningProfile };