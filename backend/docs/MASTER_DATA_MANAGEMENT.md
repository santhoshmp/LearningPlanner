# Master Data Management System

This document describes the comprehensive master data management system for the AI Study Planner application.

## Overview

The Master Data Management System provides a centralized, consistent foundation for all educational content in the application. It includes:

- **Grade Levels**: Standardized grade levels from K-12 with age mappings
- **Subjects**: Core academic subjects with hierarchical organization
- **Topics**: Detailed topic definitions for each grade-subject combination
- **Resources**: Multimedia educational resources (videos, articles, worksheets)

## Architecture

### Core Services

1. **MasterDataService**: Core service for retrieving and managing master data with Redis caching
2. **ResourceDiscoveryService**: Advanced resource recommendation and discovery engine
3. **MasterDataSeedingService**: Comprehensive seeding, migration, and backup utilities

### Data Flow

```
Master Data Files → Seeding Service → Database → Master Data Service → Frontend Components
                                   ↓
                              Redis Cache ← Resource Discovery Service
```

## CLI Usage

The master data CLI provides comprehensive management capabilities:

### Basic Commands

```bash
# Seed the database with master data
npm run master-data seed

# Seed with specific options
npm run master-data seed --clear --grades "K,1,2,3" --subjects "math,science"

# Validate master data integrity
npm run master-data validate

# Show statistics
npm run master-data stats
```

### Backup and Restore

```bash
# Create a backup
npm run master-data backup --name "pre-update-backup"

# List available backups
npm run master-data list-backups

# Restore from backup
npm run master-data restore backups/master-data-backup-2024-01-15.json

# Export to custom location
npm run master-data export --output /path/to/export.json

# Import from file
npm run master-data import /path/to/import.json --clear
```

### Synchronization

```bash
# Synchronize and validate all master data
npm run master-data sync
```

## Service Usage

### Master Data Service

```typescript
import { MasterDataService } from '../services/masterDataService';

const masterDataService = new MasterDataService(prisma);

// Get all grades with caching
const grades = await masterDataService.getAllGrades();

// Get subjects for a specific grade
const subjects = await masterDataService.getSubjectsByGrade('5');

// Get topics with resources
const topics = await masterDataService.getTopicsBySubject('5', 'math');

// Validate data integrity
const validation = await masterDataService.validateMasterData();
```

### Resource Discovery Service

```typescript
import { ResourceDiscoveryService } from '../services/resourceDiscoveryService';

const discoveryService = new ResourceDiscoveryService(prisma);

// Get personalized recommendations
const recommendations = await discoveryService.getResourceRecommendations(
  childId, 
  topicId, 
  10
);

// Filter resources
const resources = await discoveryService.getResourcesByFilters({
  grade: '5',
  subject: 'math',
  resourceType: ResourceType.VIDEO,
  difficulty: DifficultyLevel.BEGINNER
});

// Track resource usage
await discoveryService.trackResourceUsage(
  childId, 
  resourceId, 
  'complete', 
  25
);
```

### Seeding Service

```typescript
import { MasterDataSeedingService } from '../services/masterDataSeedingService';

const seedingService = new MasterDataSeedingService(prisma);

// Seed with custom configuration
const result = await seedingService.seedMasterData({
  includeGrades: ['K', '1', '2', '3', '4', '5'],
  includeSubjects: ['math', 'science', 'english'],
  resourcesPerTopic: 5,
  validateResources: true,
  clearExisting: false
});

// Create backup
const backup = await seedingService.createBackup('pre-migration');

// Migrate data structure
const migration = await seedingService.migrateMasterDataStructure('1.0', '1.1');
```

## Data Structure

### Grade Levels

```typescript
interface MasterDataGradeLevel {
  id: string;
  grade: string;           // 'K', '1', '2', ..., '12'
  displayName: string;     // 'Kindergarten', 'Grade 1', etc.
  ageMin: number;          // Minimum age
  ageMax: number;          // Maximum age
  ageTypical: number;      // Typical age
  educationalLevel: EducationalLevel;
  sortOrder: number;
  isActive: boolean;
}
```

### Subjects

```typescript
interface MasterDataSubject {
  id: string;
  name: string;            // 'math', 'science', etc.
  displayName: string;     // 'Mathematics', 'Science', etc.
  description: string;
  icon: string;            // Icon identifier
  color: string;           // Hex color code
  category: SubjectCategory;
  gradeAvailability: string[];
  estimatedHoursPerGrade: Record<string, number>;
  isCore: boolean;
  sortOrder: number;
}
```

### Topics

```typescript
interface MasterDataTopic {
  id: string;
  name: string;
  displayName: string;
  description: string;
  gradeId: string;
  subjectId: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  skills: string[];
  sortOrder: number;
  isActive: boolean;
}
```

### Resources

```typescript
interface MasterDataResource {
  id: string;
  topicId: string;
  type: ResourceType;      // VIDEO, ARTICLE, WORKSHEET, etc.
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;       // Minutes
  difficulty: DifficultyLevel;
  safetyRating: SafetyRating;
  source: string;          // 'Khan Academy', 'YouTube', etc.
  tags: string[];
  metadata: any;           // Type-specific metadata
  lastValidated: Date;
  validationStatus: ValidationStatus;
  isActive: boolean;
  sortOrder: number;
}
```

## Caching Strategy

The system implements multi-level caching for optimal performance:

### Cache Keys

- `masterdata:grades:all` - All grade levels
- `masterdata:subjects:all` - All subjects
- `masterdata:subjects-by-grade:{grade}` - Subjects for specific grade
- `masterdata:topics:{grade}-{subject}` - Topics for grade/subject
- `resource-discovery:recommendations:{childId}-{topicId}` - Personalized recommendations

### Cache TTL

- Grades: 2 hours (rarely change)
- Subjects: 1 hour (occasionally updated)
- Topics: 30 minutes (more dynamic)
- Resources: 15 minutes (frequently updated)
- Recommendations: 30 minutes (personalized)

### Cache Invalidation

```typescript
// Invalidate specific cache patterns
await masterDataService.clearCache('grades');
await masterDataService.clearCache('subjects-by-grade:5');

// Invalidate all master data caches
await masterDataService.invalidateAllCaches();
```

## Validation System

The system includes comprehensive validation:

### Validation Types

1. **Data Integrity**: Required fields, format validation
2. **Referential Integrity**: Foreign key relationships
3. **Business Rules**: Age ranges, prerequisites, etc.
4. **Resource Availability**: URL validation, content safety

### Validation Levels

- **Critical**: Data corruption, missing required fields
- **High**: Invalid references, broken constraints
- **Medium**: Data quality issues, inconsistencies
- **Low**: Formatting issues, recommendations

### Running Validation

```bash
# Validate all master data
npm run master-data validate

# Validate with auto-fix (where possible)
npm run master-data validate --fix
```

## Migration System

### Version Management

The system supports versioned migrations for master data structure changes:

```typescript
// Migrate from version 1.0 to 1.1
const result = await seedingService.migrateMasterDataStructure('1.0', '1.1');
```

### Migration Process

1. **Backup**: Automatic backup before migration
2. **Validation**: Pre-migration data validation
3. **Transform**: Apply version-specific transformations
4. **Verify**: Post-migration validation
5. **Rollback**: Automatic rollback on failure

## Backup and Recovery

### Automatic Backups

- Pre-migration backups
- Scheduled daily backups (configurable)
- Pre-seeding backups

### Manual Backups

```bash
# Create named backup
npm run master-data backup --name "before-curriculum-update"

# Export to specific location
npm run master-data export --output /backups/master-data-$(date +%Y%m%d).json
```

### Recovery

```bash
# List available backups
npm run master-data list-backups

# Restore from backup
npm run master-data restore backups/master-data-backup-20240115.json
```

## Performance Optimization

### Database Indexing

Key indexes for optimal query performance:

```sql
-- Topic resources by topic and type
CREATE INDEX idx_topic_resources_topic_type ON topic_resources(topic_id, type);

-- Resource usage by child and timestamp
CREATE INDEX idx_resource_usage_child_time ON resource_usage(child_id, timestamp);

-- Grade-subject relationships
CREATE INDEX idx_grade_subject_grade ON grade_subjects(grade_id);
```

### Query Optimization

- Use of database transactions for consistency
- Batch operations for bulk updates
- Efficient joins with proper indexing
- Pagination for large result sets

### Caching Strategy

- Redis caching for frequently accessed data
- Cache warming on application startup
- Intelligent cache invalidation
- Compression for large cached objects

## Monitoring and Maintenance

### Health Checks

```typescript
// Check master data health
const validation = await masterDataService.performIntegrityCheck();

// Check cache performance
const cacheStats = await masterDataService.getCacheStats();
```

### Maintenance Tasks

1. **Daily**: Resource URL validation
2. **Weekly**: Full data integrity check
3. **Monthly**: Cache performance analysis
4. **Quarterly**: Data structure optimization

### Alerts and Notifications

- Validation failures
- Resource availability issues
- Cache performance degradation
- Migration failures

## Best Practices

### Data Management

1. **Always backup** before major changes
2. **Validate data** after imports/migrations
3. **Use transactions** for related updates
4. **Monitor cache performance** regularly

### Development

1. **Test with realistic data** volumes
2. **Use proper error handling** in all operations
3. **Log important operations** for debugging
4. **Follow naming conventions** for consistency

### Production

1. **Schedule regular backups**
2. **Monitor validation status**
3. **Track resource usage patterns**
4. **Plan for data growth**

## Troubleshooting

### Common Issues

1. **Cache misses**: Check Redis connection and TTL settings
2. **Validation failures**: Review data integrity and business rules
3. **Migration failures**: Check backup availability and rollback procedures
4. **Performance issues**: Analyze query patterns and indexing

### Debug Commands

```bash
# Check system status
npm run master-data stats

# Validate data integrity
npm run master-data validate

# Clear all caches
npm run master-data sync

# Export current state for analysis
npm run master-data export --output debug-export.json
```

## Future Enhancements

### Planned Features

1. **Multi-language support** for international curricula
2. **Custom curriculum** creation and management
3. **AI-powered content** recommendation improvements
4. **Real-time collaboration** for content curation
5. **Advanced analytics** for usage patterns

### Scalability Improvements

1. **Horizontal scaling** for cache layer
2. **Database sharding** for large datasets
3. **CDN integration** for multimedia resources
4. **Microservice architecture** for specialized functions