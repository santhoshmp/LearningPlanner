#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { MasterDataSeedingService } from '../services/masterDataSeedingService';
import { MasterDataService } from '../services/masterDataService';
import { program } from 'commander';
import * as path from 'path';

const prisma = new PrismaClient();
const seedingService = new MasterDataSeedingService(prisma);
const masterDataService = new MasterDataService(prisma);

program
  .name('master-data-cli')
  .description('CLI for managing master data in AI Study Planner')
  .version('1.0.0');

// Seed command
program
  .command('seed')
  .description('Seed the database with master data')
  .option('-c, --clear', 'Clear existing data before seeding')
  .option('-g, --grades <grades>', 'Comma-separated list of grades to include', 'K,1,2,3,4,5,6,7,8,9,10,11,12')
  .option('-s, --subjects <subjects>', 'Comma-separated list of subjects to include', 'math,science,english,social-studies')
  .option('-r, --resources <count>', 'Number of resources per topic', '5')
  .option('--validate', 'Validate resources during seeding', true)
  .action(async (options) => {
    try {
      console.log('Starting master data seeding...');
      
      const config = {
        includeGrades: options.grades.split(','),
        includeSubjects: options.subjects.split(','),
        resourcesPerTopic: parseInt(options.resources),
        validateResources: options.validate,
        clearExisting: options.clear || false
      };

      const result = await seedingService.seedMasterData(config);
      
      if (result.success) {
        console.log('✅ Seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Grades: ${result.summary.grades}`);
        console.log(`   - Subjects: ${result.summary.subjects}`);
        console.log(`   - Topics: ${result.summary.topics}`);
        console.log(`   - Resources: ${result.summary.resources}`);
        console.log(`   - Duration: ${result.duration}ms`);
      } else {
        console.error('❌ Seeding failed:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate master data integrity')
  .option('-f, --fix', 'Attempt to fix validation errors')
  .action(async (options) => {
    try {
      console.log('Validating master data...');
      
      const result = await masterDataService.validateMasterData();
      
      console.log(`📊 Validation Summary:`);
      console.log(`   - Total entities: ${result.summary.totalEntities}`);
      console.log(`   - Valid entities: ${result.summary.validEntities}`);
      console.log(`   - Errors: ${result.summary.errorCount}`);
      console.log(`   - Warnings: ${result.summary.warningCount}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors found:');
        result.errors.forEach(error => {
          console.log(`   - ${error.entity}.${error.field}: ${error.message}`);
          if (error.suggestedFix) {
            console.log(`     💡 Suggestion: ${error.suggestedFix}`);
          }
        });
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.log(`   - ${warning.entity}.${warning.field}: ${warning.message}`);
          if (warning.recommendation) {
            console.log(`     💡 Recommendation: ${warning.recommendation}`);
          }
        });
      }
      
      if (result.isValid) {
        console.log('\n✅ Master data is valid!');
      } else {
        console.log('\n❌ Master data has validation issues');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export master data to a file')
  .option('-o, --output <path>', 'Output file path', `master-data-export-${new Date().toISOString().split('T')[0]}.json`)
  .action(async (options) => {
    try {
      console.log(`Exporting master data to ${options.output}...`);
      
      const result = await seedingService.exportMasterData(options.output);
      
      if (result.success) {
        console.log('✅ Export completed successfully!');
        console.log(`📁 File: ${result.filePath}`);
        console.log(`📊 Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
      } else {
        console.error('❌ Export failed:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      process.exit(1);
    }
  });

// Import command
program
  .command('import')
  .description('Import master data from a file')
  .argument('<file>', 'Input file path')
  .option('-c, --clear', 'Clear existing data before importing')
  .action(async (file, options) => {
    try {
      console.log(`Importing master data from ${file}...`);
      
      const config = {
        includeGrades: [],
        includeSubjects: [],
        resourcesPerTopic: 0,
        validateResources: false,
        clearExisting: options.clear || false
      };
      
      const result = await seedingService.importMasterData(file, config);
      
      if (result.success) {
        console.log('✅ Import completed successfully!');
        console.log(`📊 Entities restored: ${result.entitiesRestored}`);
      } else {
        console.error('❌ Import failed:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  });

// Backup command
program
  .command('backup')
  .description('Create a backup of master data')
  .option('-n, --name <name>', 'Backup name')
  .action(async (options) => {
    try {
      console.log('Creating master data backup...');
      
      const result = await seedingService.createBackup(options.name);
      
      if (result.success) {
        console.log('✅ Backup created successfully!');
        console.log(`📁 File: ${result.filePath}`);
        console.log(`📊 Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
      } else {
        console.error('❌ Backup failed:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Backup failed:', error);
      process.exit(1);
    }
  });

// Restore command
program
  .command('restore')
  .description('Restore master data from a backup')
  .argument('<backup>', 'Backup file path')
  .action(async (backup) => {
    try {
      console.log(`Restoring master data from ${backup}...`);
      
      const result = await seedingService.restoreFromBackup(backup);
      
      if (result.success) {
        console.log('✅ Restore completed successfully!');
        console.log(`📊 Entities restored: ${result.entitiesRestored}`);
      } else {
        console.error('❌ Restore failed:');
        result.errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      process.exit(1);
    }
  });

// List backups command
program
  .command('list-backups')
  .description('List available backups')
  .action(async () => {
    try {
      const backups = await seedingService.listBackups();
      
      if (backups.length === 0) {
        console.log('No backups found');
      } else {
        console.log('📁 Available backups:');
        backups.forEach(backup => {
          console.log(`   - ${backup}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      process.exit(1);
    }
  });

// Sync command
program
  .command('sync')
  .description('Synchronize and validate master data')
  .action(async () => {
    try {
      console.log('Synchronizing master data...');
      
      const result = await masterDataService.synchronizeMasterData();
      
      if (result.success) {
        console.log('✅ Synchronization completed successfully!');
        console.log(`📊 Entities processed: ${result.updatedEntities}`);
      } else {
        console.error('❌ Synchronization failed:');
        result.errors.forEach(error => console.error(`   - ${error.error}`));
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Synchronization failed:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show master data statistics')
  .action(async () => {
    try {
      console.log('📊 Master Data Statistics:');
      
      const [grades, subjects, topics, resources] = await Promise.all([
        prisma.gradeLevel.count({ where: { isActive: true } }),
        prisma.subject.count(),
        prisma.topic.count({ where: { isActive: true } }),
        prisma.topicResource.count({ where: { isActive: true } })
      ]);
      
      console.log(`   - Grades: ${grades}`);
      console.log(`   - Subjects: ${subjects}`);
      console.log(`   - Topics: ${topics}`);
      console.log(`   - Resources: ${resources}`);
      
      // Resource type breakdown
      const resourceTypes = await prisma.topicResource.groupBy({
        by: ['type'],
        where: { isActive: true },
        _count: { type: true }
      });
      
      console.log('\n📊 Resource Types:');
      resourceTypes.forEach(type => {
        console.log(`   - ${type.type}: ${type._count.type}`);
      });
      
      // Subject breakdown
      const subjectStats = await prisma.subject.findMany({
        include: {
          topics: {
            where: { isActive: true },
            include: {
              resources: {
                where: { isActive: true }
              }
            }
          }
        }
      });
      
      console.log('\n📊 Subject Breakdown:');
      subjectStats.forEach(subject => {
        const totalResources = subject.topics.reduce((sum, topic) => sum + topic.resources.length, 0);
        console.log(`   - ${subject.displayName}: ${subject.topics.length} topics, ${totalResources} resources`);
      });
      
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Cleanup
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});