#!/usr/bin/env node

import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { MasterDataService } from '../services/masterDataService';
import { MasterDataHealthService } from '../services/masterDataHealthService';
import { DatabaseIndexOptimizer } from '../utils/databaseIndexOptimization';
import { redisService } from '../services/redisService';

const program = new Command();
const prisma = new PrismaClient();
const masterDataService = new MasterDataService(prisma);
const healthService = new MasterDataHealthService(prisma);
const indexOptimizer = new DatabaseIndexOptimizer(prisma);

// CLI configuration
program
  .name('master-data-maintenance')
  .description('Master Data System Maintenance and Monitoring CLI')
  .version('1.0.0');

// Health check commands
const healthCommand = program
  .command('health')
  .description('Health monitoring commands');

healthCommand
  .command('check')
  .description('Perform comprehensive health check')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      console.log('🔍 Performing health check...\n');
      
      const systemStatus = await healthService.getSystemStatus();
      
      console.log(`Overall Status: ${getStatusEmoji(systemStatus.overall)} ${systemStatus.overall.toUpperCase()}\n`);
      
      console.log('Component Status:');
      systemStatus.components.forEach(component => {
        console.log(`  ${getStatusEmoji(component.status)} ${component.component}: ${component.message}`);
        if (options.verbose && component.details) {
          console.log(`    Response Time: ${component.responseTime}ms`);
          console.log(`    Details: ${JSON.stringify(component.details, null, 2)}`);
        }
      });
      
      if (systemStatus.issues.length > 0) {
        console.log('\n⚠️  Data Quality Issues:');
        systemStatus.issues.forEach(issue => {
          console.log(`  ${getSeverityEmoji(issue.severity)} ${issue.entity}: ${issue.message}`);
        });
      }
      
      if (options.verbose) {
        console.log('\n📊 System Metrics:');
        console.log(`  Database: ${systemStatus.metrics.masterData.totalGrades} grades, ${systemStatus.metrics.masterData.totalSubjects} subjects, ${systemStatus.metrics.masterData.totalTopics} topics`);
        console.log(`  Cache: ${systemStatus.metrics.cache.totalKeys} keys, ${systemStatus.metrics.cache.hitRate.toFixed(1)}% hit rate`);
        console.log(`  Resources: ${systemStatus.metrics.masterData.activeResources}/${systemStatus.metrics.masterData.totalResources} active`);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    }
  });

healthCommand
  .command('status')
  .description('Show current system status')
  .action(async () => {
    try {
      const metrics = await healthService.collectSystemMetrics();
      
      console.log('📊 System Status Dashboard\n');
      
      console.log('Master Data:');
      console.log(`  Grades: ${metrics.masterData.totalGrades}`);
      console.log(`  Subjects: ${metrics.masterData.totalSubjects}`);
      console.log(`  Topics: ${metrics.masterData.totalTopics}`);
      console.log(`  Resources: ${metrics.masterData.activeResources}/${metrics.masterData.totalResources} active`);
      console.log(`  Validated: ${metrics.masterData.validatedResources} resources`);
      
      console.log('\nDatabase:');
      console.log(`  Connections: ${metrics.database.connectionCount}`);
      console.log(`  Active Queries: ${metrics.database.activeQueries}`);
      
      console.log('\nCache:');
      console.log(`  Keys: ${metrics.cache.totalKeys}`);
      console.log(`  Memory: ${metrics.cache.memoryUsage}`);
      console.log(`  Hit Rate: ${metrics.cache.hitRate.toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Failed to get system status:', error);
      process.exit(1);
    }
  });

// Cache management commands
const cacheCommand = program
  .command('cache')
  .description('Cache management commands');

cacheCommand
  .command('stats')
  .description('Show cache statistics')
  .action(async () => {
    try {
      const stats = await masterDataService.getCacheStats();
      
      console.log('📈 Cache Statistics\n');
      console.log(`Total Keys: ${stats.totalKeys}`);
      console.log(`Memory Usage: ${stats.memoryUsage}`);
      console.log(`Hit Rate: ${stats.hitRate.toFixed(1)}%`);
      console.log(`Miss Rate: ${stats.missRate.toFixed(1)}%`);
      
      if (stats.keysByType) {
        console.log('\nKeys by Type:');
        Object.entries(stats.keysByType).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to get cache statistics:', error);
      process.exit(1);
    }
  });

cacheCommand
  .command('warmup')
  .description('Warm up cache with frequently accessed data')
  .action(async () => {
    try {
      console.log('🔥 Warming up cache...');
      
      const result = await masterDataService.warmupCache();
      
      console.log(`✅ Cache warmup completed in ${result.duration}ms`);
      console.log(`Warmed keys: ${result.warmedKeys.length}`);
      
      if (result.errors.length > 0) {
        console.log('\n⚠️  Errors during warmup:');
        result.errors.forEach(error => {
          console.log(`  ${error.key}: ${error.error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
      process.exit(1);
    }
  });

cacheCommand
  .command('clear')
  .description('Clear cache')
  .option('-p, --pattern <pattern>', 'Clear specific pattern')
  .option('-t, --type <type>', 'Clear specific type (grade, subject, topic, resource)')
  .option('--all', 'Clear all cache')
  .action(async (options) => {
    try {
      if (options.all) {
        console.log('🧹 Clearing all cache...');
        await masterDataService.clearCache();
      } else if (options.pattern) {
        console.log(`🧹 Clearing cache pattern: ${options.pattern}`);
        await masterDataService.clearCache(options.pattern);
      } else if (options.type) {
        console.log(`🧹 Clearing ${options.type} cache...`);
        switch (options.type) {
          case 'grade':
            await masterDataService.invalidateGradeCache();
            break;
          case 'subject':
            await masterDataService.invalidateSubjectCache();
            break;
          case 'topic':
            await masterDataService.invalidateTopicCache();
            break;
          case 'resource':
            await masterDataService.invalidateResourceCache();
            break;
          default:
            console.error('❌ Invalid cache type. Use: grade, subject, topic, or resource');
            process.exit(1);
        }
      } else {
        console.error('❌ Please specify --all, --pattern, or --type');
        process.exit(1);
      }
      
      console.log('✅ Cache cleared successfully');
      
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
      process.exit(1);
    }
  });

// Data quality commands
const dataCommand = program
  .command('data')
  .description('Data quality and validation commands');

dataCommand
  .command('validate')
  .description('Validate master data integrity')
  .option('-f, --fix', 'Attempt to fix issues automatically')
  .action(async (options) => {
    try {
      console.log('🔍 Validating master data...\n');
      
      const issues = await healthService.performDataQualityCheck();
      
      if (issues.length === 0) {
        console.log('✅ No data quality issues found');
        return;
      }
      
      console.log(`Found ${issues.length} data quality issues:\n`);
      
      const groupedIssues = groupBy(issues, 'severity');
      
      ['critical', 'high', 'medium', 'low'].forEach(severity => {
        const severityIssues = groupedIssues[severity] || [];
        if (severityIssues.length > 0) {
          console.log(`${getSeverityEmoji(severity as any)} ${severity.toUpperCase()} (${severityIssues.length}):`);
          severityIssues.forEach(issue => {
            console.log(`  ${issue.entity} (${issue.entityId}): ${issue.message}`);
            console.log(`    Fix: ${issue.suggestedFix}`);
          });
          console.log();
        }
      });
      
      if (options.fix) {
        console.log('🔧 Auto-fix is not implemented yet. Please fix issues manually.');
      }
      
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      process.exit(1);
    }
  });

dataCommand
  .command('cleanup')
  .description('Clean up orphaned and invalid data')
  .option('--dry-run', 'Show what would be cleaned up without making changes')
  .action(async (options) => {
    try {
      console.log('🧹 Starting data cleanup...\n');
      
      if (options.dryRun) {
        console.log('🔍 DRY RUN - No changes will be made\n');
      }
      
      // This would implement actual cleanup logic
      console.log('Data cleanup functionality is not implemented yet.');
      
    } catch (error) {
      console.error('❌ Data cleanup failed:', error);
      process.exit(1);
    }
  });

// Resource monitoring commands
const resourceCommand = program
  .command('resources')
  .description('Resource monitoring and validation commands');

resourceCommand
  .command('check')
  .description('Check resource availability')
  .option('-b, --batch-size <size>', 'Batch size for checking', '50')
  .action(async (options) => {
    try {
      const batchSize = parseInt(options.batchSize);
      console.log(`🔗 Checking resource availability (batch size: ${batchSize})...\n`);
      
      const results = await healthService.checkResourceAvailability(batchSize);
      
      if (results.length === 0) {
        console.log('ℹ️  No resources to check');
        return;
      }
      
      const summary = {
        available: results.filter(r => r.status === 'available').length,
        unavailable: results.filter(r => r.status === 'unavailable').length,
        moved: results.filter(r => r.status === 'moved').length,
        restricted: results.filter(r => r.status === 'restricted').length,
        timeout: results.filter(r => r.status === 'timeout').length
      };
      
      console.log('📊 Resource Check Summary:');
      console.log(`  ✅ Available: ${summary.available}`);
      console.log(`  ❌ Unavailable: ${summary.unavailable}`);
      console.log(`  🔄 Moved: ${summary.moved}`);
      console.log(`  🚫 Restricted: ${summary.restricted}`);
      console.log(`  ⏱️  Timeout: ${summary.timeout}`);
      
      const problematicResources = results.filter(r => r.status !== 'available');
      if (problematicResources.length > 0) {
        console.log('\n⚠️  Problematic Resources:');
        problematicResources.forEach(resource => {
          console.log(`  ${getResourceStatusEmoji(resource.status)} ${resource.url}`);
          if (resource.errorMessage) {
            console.log(`    Error: ${resource.errorMessage}`);
          }
          if (resource.redirectUrl) {
            console.log(`    Redirects to: ${resource.redirectUrl}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Resource check failed:', error);
      process.exit(1);
    }
  });

resourceCommand
  .command('status')
  .description('Show resource status summary')
  .action(async () => {
    try {
      const results = healthService.getResourceCheckResults();
      
      if (results.length === 0) {
        console.log('ℹ️  No resource check results available');
        return;
      }
      
      console.log('📊 Resource Status Summary\n');
      
      const statusCounts = results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${getResourceStatusEmoji(status as any)} ${status}: ${count}`);
      });
      
      const recentChecks = results.filter(r => 
        Date.now() - r.lastChecked.getTime() < 24 * 60 * 60 * 1000
      );
      
      console.log(`\nChecked in last 24 hours: ${recentChecks.length}/${results.length}`);
      
    } catch (error) {
      console.error('❌ Failed to get resource status:', error);
      process.exit(1);
    }
  });

// Database optimization commands
const dbCommand = program
  .command('database')
  .description('Database optimization and maintenance commands');

dbCommand
  .command('analyze')
  .description('Analyze database performance and suggest optimizations')
  .action(async () => {
    try {
      console.log('🔍 Analyzing database performance...\n');
      
      const [indexAnalysis, queryOptimizations] = await Promise.all([
        indexOptimizer.analyzeIndexUsage(),
        indexOptimizer.getOptimizedQueries()
      ]);
      
      console.log('📊 Index Analysis:');
      const indexesByRecommendation = groupBy(indexAnalysis, 'recommendation');
      
      ['add', 'keep', 'optimize', 'remove'].forEach(recommendation => {
        const indexes = indexesByRecommendation[recommendation] || [];
        if (indexes.length > 0) {
          console.log(`\n${getRecommendationEmoji(recommendation)} ${recommendation.toUpperCase()} (${indexes.length}):`);
          indexes.forEach(index => {
            console.log(`  ${index.tableName}.${index.indexName}: ${index.reason}`);
          });
        }
      });
      
      if (queryOptimizations.length > 0) {
        console.log('\n🚀 Query Optimizations Available:');
        queryOptimizations.forEach((opt, i) => {
          console.log(`\n${i + 1}. Expected improvement: ${opt.expectedImprovement}`);
          console.log(`   Indexes needed: ${opt.indexesNeeded.join(', ')}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Database analysis failed:', error);
      process.exit(1);
    }
  });

dbCommand
  .command('maintenance')
  .description('Perform database maintenance tasks')
  .action(async () => {
    try {
      console.log('🔧 Performing database maintenance...\n');
      
      const result = await indexOptimizer.performMaintenance();
      
      console.log('✅ Database maintenance completed:');
      console.log(`  Tables analyzed: ${result.tablesAnalyzed.length}`);
      console.log(`  Indexes rebuilt: ${result.indexesRebuilt.length}`);
      console.log(`  Statistics updated: ${result.statisticsUpdated ? 'Yes' : 'No'}`);
      
      if (result.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Database maintenance failed:', error);
      process.exit(1);
    }
  });

dbCommand
  .command('migration')
  .description('Generate database optimization migration')
  .option('-o, --output <file>', 'Output file for migration')
  .action(async (options) => {
    try {
      console.log('📝 Generating database optimization migration...\n');
      
      const migration = await indexOptimizer.generateIndexMigration();
      
      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, migration);
        console.log(`✅ Migration saved to: ${options.output}`);
      } else {
        console.log('Generated Migration:');
        console.log('='.repeat(50));
        console.log(migration);
        console.log('='.repeat(50));
      }
      
    } catch (error) {
      console.error('❌ Migration generation failed:', error);
      process.exit(1);
    }
  });

// Performance monitoring commands
const perfCommand = program
  .command('performance')
  .description('Performance monitoring commands');

perfCommand
  .command('report')
  .description('Generate performance report')
  .option('-t, --timeframe <minutes>', 'Timeframe in minutes', '60')
  .action(async (options) => {
    try {
      const timeframeMs = parseInt(options.timeframe) * 60000;
      console.log(`📊 Generating performance report (${options.timeframe} minutes)...\n`);
      
      const report = await masterDataService.getPerformanceReport(timeframeMs);
      
      console.log('Performance Summary:');
      console.log(`  Total Operations: ${report.totalOperations}`);
      console.log(`  Average Response Time: ${report.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Cache Hit Rate: ${(report.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`  Error Rate: ${(report.errorRate * 100).toFixed(2)}%`);
      
      if (report.slowestOperations.length > 0) {
        console.log('\n🐌 Slowest Operations:');
        report.slowestOperations.slice(0, 5).forEach((op, i) => {
          console.log(`  ${i + 1}. ${op.operationType}: ${op.duration}ms`);
        });
      }
      
      if (report.mostFrequentOperations.length > 0) {
        console.log('\n🔥 Most Frequent Operations:');
        report.mostFrequentOperations.slice(0, 5).forEach((op, i) => {
          console.log(`  ${i + 1}. ${op.operation}: ${op.count} calls (${op.avgDuration.toFixed(2)}ms avg)`);
        });
      }
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Performance report generation failed:', error);
      process.exit(1);
    }
  });

perfCommand
  .command('alerts')
  .description('Show active performance alerts')
  .action(async () => {
    try {
      const alerts = await masterDataService.getActiveAlerts();
      
      if (alerts.length === 0) {
        console.log('✅ No active performance alerts');
        return;
      }
      
      console.log(`⚠️  Active Performance Alerts (${alerts.length}):\n`);
      
      alerts.forEach((alert, i) => {
        console.log(`${i + 1}. ${getSeverityEmoji(alert.severity)} ${alert.type.toUpperCase()}`);
        console.log(`   ${alert.message}`);
        console.log(`   Time: ${alert.timestamp.toLocaleString()}`);
        console.log();
      });
      
    } catch (error) {
      console.error('❌ Failed to get performance alerts:', error);
      process.exit(1);
    }
  });

// Maintenance task commands
const maintenanceCommand = program
  .command('maintenance')
  .description('Maintenance task management commands');

maintenanceCommand
  .command('list')
  .description('List maintenance tasks')
  .option('-s, --status <status>', 'Filter by status (pending, running, completed, failed)')
  .action(async (options) => {
    try {
      const tasks = healthService.getMaintenanceTasks(options.status);
      
      if (tasks.length === 0) {
        console.log('ℹ️  No maintenance tasks found');
        return;
      }
      
      console.log(`📋 Maintenance Tasks (${tasks.length}):\n`);
      
      tasks.forEach((task, i) => {
        console.log(`${i + 1}. ${getTaskStatusEmoji(task.status)} ${task.type} (${task.priority})`);
        console.log(`   ${task.description}`);
        console.log(`   Scheduled: ${task.scheduledAt.toLocaleString()}`);
        if (task.completedAt) {
          console.log(`   Completed: ${task.completedAt.toLocaleString()}`);
        }
        if (task.errorMessage) {
          console.log(`   Error: ${task.errorMessage}`);
        }
        console.log();
      });
      
    } catch (error) {
      console.error('❌ Failed to list maintenance tasks:', error);
      process.exit(1);
    }
  });

maintenanceCommand
  .command('schedule')
  .description('Schedule a maintenance task')
  .requiredOption('-t, --type <type>', 'Task type (data_cleanup, cache_refresh, index_rebuild, statistics_update, resource_validation)')
  .requiredOption('-d, --description <description>', 'Task description')
  .option('-p, --priority <priority>', 'Task priority (low, medium, high, critical)', 'medium')
  .action(async (options) => {
    try {
      console.log('📅 Scheduling maintenance task...\n');
      
      const taskId = await healthService.scheduleMaintenanceTask({
        type: options.type,
        priority: options.priority,
        description: options.description,
        scheduledAt: new Date()
      });
      
      console.log(`✅ Task scheduled successfully`);
      console.log(`Task ID: ${taskId}`);
      
    } catch (error) {
      console.error('❌ Failed to schedule maintenance task:', error);
      process.exit(1);
    }
  });

// Utility functions
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '❌';
    default: return '❓';
  }
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🟠';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

function getResourceStatusEmoji(status: string): string {
  switch (status) {
    case 'available': return '✅';
    case 'unavailable': return '❌';
    case 'moved': return '🔄';
    case 'restricted': return '🚫';
    case 'timeout': return '⏱️';
    default: return '❓';
  }
}

function getRecommendationEmoji(recommendation: string): string {
  switch (recommendation) {
    case 'add': return '➕';
    case 'keep': return '✅';
    case 'optimize': return '🔧';
    case 'remove': return '➖';
    default: return '❓';
  }
}

function getTaskStatusEmoji(status: string): string {
  switch (status) {
    case 'pending': return '⏳';
    case 'running': return '🔄';
    case 'completed': return '✅';
    case 'failed': return '❌';
    default: return '❓';
  }
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  await redisService.disconnect();
  process.exit(0);
});

// Parse command line arguments
program.parse();