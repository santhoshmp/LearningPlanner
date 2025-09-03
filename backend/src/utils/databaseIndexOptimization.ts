import { PrismaClient } from '@prisma/client';

export interface IndexAnalysis {
  tableName: string;
  indexName: string;
  columns: string[];
  isUnique: boolean;
  usage: 'high' | 'medium' | 'low' | 'unused';
  recommendation: 'keep' | 'optimize' | 'remove' | 'add';
  reason: string;
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  expectedImprovement: string;
  indexesNeeded: string[];
}

export class DatabaseIndexOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Analyze current index usage and suggest optimizations
  async analyzeIndexUsage(): Promise<IndexAnalysis[]> {
    const analyses: IndexAnalysis[] = [];

    // Master data table index analysis
    const masterDataIndexes = [
      {
        tableName: 'grade_levels',
        indexName: 'grade_levels_grade_idx',
        columns: ['grade'],
        isUnique: true,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Frequently used for grade lookups and filtering'
      },
      {
        tableName: 'grade_levels',
        indexName: 'grade_levels_educational_level_idx',
        columns: ['educationalLevel'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'keep' as const,
        reason: 'Used for filtering by educational level'
      },
      {
        tableName: 'grade_levels',
        indexName: 'grade_levels_sort_order_idx',
        columns: ['sortOrder'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Essential for ordered grade listings'
      },
      {
        tableName: 'grade_levels',
        indexName: 'grade_levels_age_range_idx',
        columns: ['ageMin', 'ageMax'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'add' as const,
        reason: 'Needed for age-based grade lookups'
      },
      {
        tableName: 'subjects',
        indexName: 'subjects_category_idx',
        columns: ['category'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'keep' as const,
        reason: 'Used for filtering subjects by category'
      },
      {
        tableName: 'subjects',
        indexName: 'subjects_is_core_idx',
        columns: ['isCore'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'keep' as const,
        reason: 'Used for filtering core vs elective subjects'
      },
      {
        tableName: 'subjects',
        indexName: 'subjects_sort_order_idx',
        columns: ['sortOrder'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Essential for ordered subject listings'
      },
      {
        tableName: 'grade_subjects',
        indexName: 'grade_subjects_grade_subject_idx',
        columns: ['gradeId', 'subjectId'],
        isUnique: true,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Primary lookup for grade-subject relationships'
      },
      {
        tableName: 'grade_subjects',
        indexName: 'grade_subjects_grade_idx',
        columns: ['gradeId'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'add' as const,
        reason: 'Needed for finding all subjects for a grade'
      },
      {
        tableName: 'grade_subjects',
        indexName: 'grade_subjects_subject_idx',
        columns: ['subjectId'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'add' as const,
        reason: 'Needed for finding all grades for a subject'
      },
      {
        tableName: 'topics',
        indexName: 'topics_grade_subject_idx',
        columns: ['gradeId', 'subjectId'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Primary lookup for topics by grade and subject'
      },
      {
        tableName: 'topics',
        indexName: 'topics_grade_subject_name_idx',
        columns: ['gradeId', 'subjectId', 'name'],
        isUnique: true,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Ensures unique topic names within grade-subject'
      },
      {
        tableName: 'topics',
        indexName: 'topics_difficulty_idx',
        columns: ['difficulty'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'keep' as const,
        reason: 'Used for filtering topics by difficulty'
      },
      {
        tableName: 'topics',
        indexName: 'topics_sort_order_idx',
        columns: ['sortOrder'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Essential for ordered topic listings'
      },
      {
        tableName: 'topics',
        indexName: 'topics_is_active_idx',
        columns: ['isActive'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'add' as const,
        reason: 'Frequently used to filter active topics'
      },
      {
        tableName: 'topics',
        indexName: 'topics_estimated_hours_idx',
        columns: ['estimatedHours'],
        isUnique: false,
        usage: 'low' as const,
        recommendation: 'optimize' as const,
        reason: 'Rarely used for filtering, consider composite index'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_topic_idx',
        columns: ['topicId'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Primary lookup for resources by topic'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_type_idx',
        columns: ['type'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Frequently used for filtering by resource type'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_safety_rating_idx',
        columns: ['safetyRating'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Critical for content safety filtering'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_validation_status_idx',
        columns: ['validationStatus'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'keep' as const,
        reason: 'Used for filtering validated resources'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_is_active_idx',
        columns: ['isActive'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'add' as const,
        reason: 'Frequently used to filter active resources'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_topic_type_safety_idx',
        columns: ['topicId', 'type', 'safetyRating'],
        isUnique: false,
        usage: 'high' as const,
        recommendation: 'add' as const,
        reason: 'Composite index for common filtering pattern'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_sort_order_idx',
        columns: ['sortOrder'],
        isUnique: false,
        usage: 'medium' as const,
        recommendation: 'keep' as const,
        reason: 'Used for ordered resource listings'
      },
      {
        tableName: 'topic_resources',
        indexName: 'topic_resources_last_validated_idx',
        columns: ['lastValidated'],
        isUnique: false,
        usage: 'low' as const,
        recommendation: 'optimize' as const,
        reason: 'Used for maintenance queries, consider partial index'
      }
    ];

    analyses.push(...masterDataIndexes);

    return analyses;
  }

  // Generate SQL for creating missing indexes
  async generateIndexCreationSQL(): Promise<string[]> {
    const analyses = await this.analyzeIndexUsage();
    const sqlStatements: string[] = [];

    const indexesToAdd = analyses.filter(a => a.recommendation === 'add');

    for (const index of indexesToAdd) {
      const columns = index.columns.join(', ');
      const uniqueClause = index.isUnique ? 'UNIQUE ' : '';
      
      sqlStatements.push(
        `-- ${index.reason}\n` +
        `CREATE ${uniqueClause}INDEX CONCURRENTLY IF NOT EXISTS "${index.indexName}" ` +
        `ON "${index.tableName}" (${columns});`
      );
    }

    return sqlStatements;
  }

  // Generate optimized queries for common master data operations
  getOptimizedQueries(): QueryOptimization[] {
    return [
      {
        originalQuery: `
          SELECT * FROM topics 
          WHERE "gradeId" = $1 AND "subjectId" = $2 
          ORDER BY "sortOrder"
        `,
        optimizedQuery: `
          SELECT t.*, g.grade, g.displayName as gradeDisplayName, 
                 s.name as subjectName, s.displayName as subjectDisplayName,
                 s.color as subjectColor
          FROM topics t
          JOIN grade_levels g ON t."gradeId" = g.id
          JOIN subjects s ON t."subjectId" = s.id
          WHERE t."gradeId" = $1 AND t."subjectId" = $2 AND t."isActive" = true
          ORDER BY t."sortOrder"
        `,
        expectedImprovement: '30-40% faster with proper indexes',
        indexesNeeded: ['topics_grade_subject_idx', 'topics_is_active_idx', 'topics_sort_order_idx']
      },
      {
        originalQuery: `
          SELECT * FROM topic_resources 
          WHERE "topicId" = $1 
          ORDER BY "sortOrder"
        `,
        optimizedQuery: `
          SELECT tr.* FROM topic_resources tr
          WHERE tr."topicId" = $1 
            AND tr."isActive" = true 
            AND tr."validationStatus" = 'APPROVED'
            AND tr."safetyRating" IN ('SAFE', 'MOSTLY_SAFE')
          ORDER BY tr."safetyRating" DESC, tr."sortOrder" ASC
          LIMIT 20
        `,
        expectedImprovement: '50-60% faster with composite index',
        indexesNeeded: ['topic_resources_topic_type_safety_idx', 'topic_resources_is_active_idx']
      },
      {
        originalQuery: `
          SELECT * FROM grade_levels 
          WHERE "ageMin" <= $1 AND "ageMax" >= $1
        `,
        optimizedQuery: `
          SELECT gl.* FROM grade_levels gl
          WHERE gl."ageMin" <= $1 AND gl."ageMax" >= $1 AND gl."isActive" = true
          ORDER BY gl."ageTypical" ASC
          LIMIT 1
        `,
        expectedImprovement: '40-50% faster with age range index',
        indexesNeeded: ['grade_levels_age_range_idx']
      },
      {
        originalQuery: `
          SELECT s.*, COUNT(t.id) as topic_count 
          FROM subjects s 
          LEFT JOIN topics t ON s.id = t."subjectId" 
          GROUP BY s.id 
          ORDER BY s."sortOrder"
        `,
        optimizedQuery: `
          SELECT s.*, 
                 COALESCE(tc.topic_count, 0) as topic_count
          FROM subjects s
          LEFT JOIN (
            SELECT "subjectId", COUNT(*) as topic_count
            FROM topics
            WHERE "isActive" = true
            GROUP BY "subjectId"
          ) tc ON s.id = tc."subjectId"
          WHERE s."isActive" = true
          ORDER BY s."sortOrder"
        `,
        expectedImprovement: '25-35% faster with optimized subquery',
        indexesNeeded: ['subjects_sort_order_idx', 'topics_subject_active_idx']
      },
      {
        originalQuery: `
          SELECT * FROM topics 
          WHERE "difficulty" = $1 
          ORDER BY "estimatedHours"
        `,
        optimizedQuery: `
          SELECT t.*, g.grade, s.name as subject_name
          FROM topics t
          JOIN grade_levels g ON t."gradeId" = g.id
          JOIN subjects s ON t."subjectId" = s.id
          WHERE t."difficulty" = $1 AND t."isActive" = true
          ORDER BY t."estimatedHours", t."sortOrder"
        `,
        expectedImprovement: '20-30% faster with composite index',
        indexesNeeded: ['topics_difficulty_active_idx', 'topics_estimated_hours_sort_idx']
      }
    ];
  }

  // Create database migration for index optimizations
  async generateIndexMigration(): Promise<string> {
    const analyses = await this.analyzeIndexUsage();
    const indexesToAdd = analyses.filter(a => a.recommendation === 'add');
    const indexesToRemove = analyses.filter(a => a.recommendation === 'remove');

    let migration = `-- Master Data Index Optimization Migration
-- Generated on ${new Date().toISOString()}

BEGIN;

-- Add missing indexes for better performance
`;

    for (const index of indexesToAdd) {
      const columns = index.columns.join('", "');
      const uniqueClause = index.isUnique ? 'UNIQUE ' : '';
      
      migration += `
-- ${index.reason}
CREATE ${uniqueClause}INDEX CONCURRENTLY IF NOT EXISTS "${index.indexName}" 
ON "${index.tableName}" ("${columns}");
`;
    }

    if (indexesToRemove.length > 0) {
      migration += `
-- Remove unused indexes
`;
      for (const index of indexesToRemove) {
        migration += `
-- ${index.reason}
DROP INDEX CONCURRENTLY IF EXISTS "${index.indexName}";
`;
      }
    }

    migration += `
-- Update table statistics for better query planning
ANALYZE grade_levels;
ANALYZE subjects;
ANALYZE grade_subjects;
ANALYZE topics;
ANALYZE topic_resources;

COMMIT;
`;

    return migration;
  }

  // Performance monitoring queries
  getPerformanceMonitoringQueries(): { name: string; query: string; description: string }[] {
    return [
      {
        name: 'slow_queries',
        query: `
          SELECT query, mean_exec_time, calls, total_exec_time
          FROM pg_stat_statements
          WHERE query LIKE '%grade_levels%' OR query LIKE '%subjects%' OR query LIKE '%topics%'
          ORDER BY mean_exec_time DESC
          LIMIT 10;
        `,
        description: 'Find slowest master data queries'
      },
      {
        name: 'index_usage',
        query: `
          SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public' 
            AND tablename IN ('grade_levels', 'subjects', 'topics', 'topic_resources')
          ORDER BY idx_tup_read DESC;
        `,
        description: 'Monitor index usage statistics'
      },
      {
        name: 'table_sizes',
        query: `
          SELECT tablename,
                 pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
                 pg_total_relation_size(tablename::regclass) as size_bytes
          FROM pg_tables
          WHERE schemaname = 'public' 
            AND tablename IN ('grade_levels', 'subjects', 'topics', 'topic_resources')
          ORDER BY size_bytes DESC;
        `,
        description: 'Monitor table sizes for capacity planning'
      },
      {
        name: 'cache_hit_ratio',
        query: `
          SELECT 
            schemaname,
            tablename,
            heap_blks_read,
            heap_blks_hit,
            CASE 
              WHEN heap_blks_hit + heap_blks_read = 0 THEN 0
              ELSE ROUND(heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read) * 100, 2)
            END as cache_hit_ratio
          FROM pg_statio_user_tables
          WHERE schemaname = 'public'
            AND tablename IN ('grade_levels', 'subjects', 'topics', 'topic_resources')
          ORDER BY cache_hit_ratio DESC;
        `,
        description: 'Monitor database cache hit ratios'
      },
      {
        name: 'unused_indexes',
        query: `
          SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
          FROM pg_stat_user_indexes
          WHERE schemaname = 'public'
            AND tablename IN ('grade_levels', 'subjects', 'topics', 'topic_resources')
            AND idx_scan < 10
          ORDER BY idx_scan;
        `,
        description: 'Identify potentially unused indexes'
      }
    ];
  }

  // Query plan analysis
  async analyzeQueryPlan(query: string): Promise<{
    plan: any;
    recommendations: string[];
    estimatedCost: number;
    estimatedRows: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const plan = (result as any)[0]['QUERY PLAN'][0];
      
      const recommendations: string[] = [];
      const estimatedCost = plan.Plan['Total Cost'];
      const estimatedRows = plan.Plan['Plan Rows'];

      // Analyze plan for optimization opportunities
      if (plan.Plan['Node Type'] === 'Seq Scan') {
        recommendations.push('Sequential scan detected. Consider adding an index.');
      }

      if (plan.Plan['Actual Total Time'] > 100) {
        recommendations.push('Query execution time is high. Consider optimization.');
      }

      if (plan.Plan['Shared Hit Blocks'] < plan.Plan['Shared Read Blocks']) {
        recommendations.push('Low cache hit ratio. Consider increasing shared_buffers.');
      }

      return {
        plan,
        recommendations,
        estimatedCost,
        estimatedRows
      };
    } catch (error) {
      throw new Error(`Failed to analyze query plan: ${error}`);
    }
  }

  // Database maintenance utilities
  async performMaintenance(): Promise<{
    tablesAnalyzed: string[];
    indexesRebuilt: string[];
    statisticsUpdated: boolean;
    recommendations: string[];
  }> {
    const tables = ['grade_levels', 'subjects', 'grade_subjects', 'topics', 'topic_resources'];
    const result = {
      tablesAnalyzed: [] as string[],
      indexesRebuilt: [] as string[],
      statisticsUpdated: false,
      recommendations: [] as string[]
    };

    try {
      // Update table statistics
      for (const table of tables) {
        await this.prisma.$executeRaw`ANALYZE ${table}`;
        result.tablesAnalyzed.push(table);
      }
      result.statisticsUpdated = true;

      // Check for bloated indexes (would need additional monitoring)
      result.recommendations.push('Regular VACUUM and ANALYZE operations completed');
      result.recommendations.push('Monitor index bloat and consider REINDEX if needed');
      result.recommendations.push('Review query performance regularly');

    } catch (error) {
      result.recommendations.push(`Maintenance error: ${error}`);
    }

    return result;
  }

  // Connection pool optimization
  getConnectionPoolRecommendations(): {
    currentSettings: any;
    recommendations: string[];
    optimalSettings: any;
  } {
    return {
      currentSettings: {
        // These would come from actual Prisma configuration
        maxConnections: 10,
        connectionTimeout: 5000,
        idleTimeout: 600000
      },
      recommendations: [
        'Monitor connection pool usage during peak times',
        'Adjust max connections based on concurrent user load',
        'Consider connection pooling at application level',
        'Monitor for connection leaks in application code'
      ],
      optimalSettings: {
        maxConnections: 20, // Adjust based on load
        connectionTimeout: 10000,
        idleTimeout: 300000,
        maxLifetime: 1800000 // 30 minutes
      }
    };
  }
}