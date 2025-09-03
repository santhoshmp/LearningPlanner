# Mock Data Generation System

The Mock Data Generation System provides realistic, master data-based mock data for the AI Study Planner application. This system generates believable learning patterns, progress records, and user interactions for demonstration and testing purposes.

## Overview

The system consists of two main services:

1. **MockDataGeneratorService** - Generates realistic learning data for individual children
2. **DemoDataSeedingService** - Creates complete demo families with varied learning profiles

## Features

### Realistic Learning Patterns
- **Learning Velocities**: Slow, average, and fast learners with different progression rates
- **Subject Preferences**: Varied engagement levels across different subjects
- **Difficulty Preferences**: Conservative, balanced, or challenging difficulty selections
- **Session Patterns**: Different frequency and consistency levels
- **Help-Seeking Behavior**: Independent, moderate, or frequent help requests

### Master Data Integration
- Uses actual grade levels, subjects, and topics from the master data system
- Generates activities based on real curriculum structure
- Creates resource usage patterns with actual educational resources
- Maintains referential integrity with master data relationships

### Varied User Profiles
- **High Achievers**: Fast learners with challenging preferences and consistent patterns
- **Struggling Learners**: Slower pace with conservative difficulty and frequent help requests
- **STEM-Focused**: Strong performance in math and science subjects
- **Arts-Focused**: Higher engagement in creative and language arts subjects
- **Inconsistent Learners**: Variable performance and engagement patterns
- **Help-Seeking**: Students who frequently request assistance
- **Independent**: Self-directed learners with minimal help requests

## Usage

### Command Line Interface

The system includes a comprehensive CLI for easy data generation:

```bash
# Seed comprehensive demo data with multiple families
npm run demo-data seed --families 5 --children "2-4" --months 12

# Generate data for a single child
npm run demo-data generate-single --child-id "child-123" --profile "high-achiever"

# Clear all existing demo data
npm run demo-data clear

# Show help
npm run demo-data help
```

### CLI Options

- `--families <n>`: Number of demo families to create (default: 3)
- `--children <min-max>`: Children per family range (default: "1-3")
- `--months <n>`: Time range in months for historical data (default: 6)
- `--child-id <id>`: Child ID for single generation
- `--profile <type>`: Learning profile type for single generation

### Learning Profile Types

- `balanced`: Average student with balanced subject preferences
- `high-achiever`: Fast learner, challenging difficulty, consistent
- `struggling`: Slow learner, conservative difficulty, needs help
- `stem-focused`: Strong in math/science, challenging difficulty
- `arts-focused`: Strong in arts/language, creative preferences
- `inconsistent`: Variable performance and engagement
- `help-seeking`: Frequently requests help, moderate performance
- `independent`: Self-directed learner, minimal help requests

## Programmatic Usage

### MockDataGeneratorService

```typescript
import { MockDataGeneratorService, MockDataConfig } from './services/mockDataGeneratorService';

const mockDataService = new MockDataGeneratorService(prisma);

const config: MockDataConfig = {
  childId: 'child-123',
  timeRangeMonths: 6,
  learningVelocity: 'fast',
  subjectPreferences: {
    'mathematics': 0.9,
    'science': 0.8,
    'english-language-arts': 0.6
  },
  difficultyPreference: 'challenging',
  sessionFrequency: 'high',
  consistencyLevel: 'consistent',
  helpSeekingBehavior: 'independent'
};

const mockData = await mockDataService.generateRealisticMockData(config);
```

### DemoDataSeedingService

```typescript
import { DemoDataSeedingService, DemoSeedingConfig } from './services/demoDataSeedingService';

const seedingService = new DemoDataSeedingService(prisma);

const config: DemoSeedingConfig = {
  familyCount: 5,
  childrenPerFamily: { min: 2, max: 4 },
  timeRangeMonths: 12,
  includeVariedProfiles: true,
  generateResourceUsage: true,
  createRealisticProgression: true
};

const result = await seedingService.seedDemoData(config);
```

## Generated Data Structure

The system generates the following types of data:

### Study Plans and Activities
- Realistic study plans based on master data subjects
- Activities linked to actual topics from the curriculum
- Appropriate difficulty levels and estimated durations

### Progress Records
- Realistic scores based on learning velocity and subject engagement
- Multiple attempts with improvement patterns
- Completion status based on performance thresholds
- Time spent calculations with realistic variance

### Content Interactions
- User interactions with educational content
- Viewing patterns, duration, and completion rates
- Different interaction types (view, click, scroll, pause, replay)

### Resource Usage
- Usage of YouTube videos, reading materials, and interactive content
- Preferences based on learning patterns
- Completion rates and user ratings
- Resource discovery patterns

### Help Requests
- Questions and assistance requests based on help-seeking behavior
- Categorized by type (concept, technical, navigation, content)
- Resolution patterns and response times
- Correlation with performance difficulties

### Achievements
- First completion milestones
- Subject mastery achievements
- High performance recognition
- Streak and consistency rewards

## Data Quality Features

### Realistic Patterns
- **Time-based Progression**: Activities spread realistically over time
- **Learning Curves**: Improvement patterns that reflect actual learning
- **Subject Correlations**: Performance relationships between related subjects
- **Seasonal Patterns**: Consideration of school calendar and breaks

### Consistency Checks
- **Referential Integrity**: All relationships maintained with master data
- **Logical Progression**: Prerequisites respected in topic sequences
- **Age Appropriateness**: Content and difficulty matched to grade levels
- **Performance Bounds**: Scores and metrics within realistic ranges

### Variance and Authenticity
- **Individual Differences**: Each child has unique patterns and preferences
- **Random Elements**: Controlled randomness for natural variation
- **Edge Cases**: Inclusion of both high and low performers
- **Real-world Scenarios**: Patterns based on actual educational research

## Testing

The system includes comprehensive tests:

```bash
# Run unit tests
npm test -- mockDataGeneratorService.test.ts
npm test -- demoDataSeedingService.test.ts

# Run integration tests
npm test -- mockDataGeneration.integration.test.ts
```

## Configuration Examples

### High-Performing STEM Student
```typescript
{
  learningVelocity: 'fast',
  subjectPreferences: {
    'mathematics': 0.95,
    'science': 0.90,
    'computer-science': 0.85,
    'english-language-arts': 0.60
  },
  difficultyPreference: 'challenging',
  sessionFrequency: 'high',
  consistencyLevel: 'consistent',
  helpSeekingBehavior: 'independent'
}
```

### Struggling Elementary Student
```typescript
{
  learningVelocity: 'slow',
  subjectPreferences: {
    'mathematics': 0.30,
    'english-language-arts': 0.40,
    'science': 0.35
  },
  difficultyPreference: 'conservative',
  sessionFrequency: 'low',
  consistencyLevel: 'inconsistent',
  helpSeekingBehavior: 'frequent'
}
```

### Arts-Focused Middle School Student
```typescript
{
  learningVelocity: 'average',
  subjectPreferences: {
    'visual-arts': 0.90,
    'music': 0.85,
    'english-language-arts': 0.80,
    'drama-theater': 0.75,
    'mathematics': 0.45,
    'science': 0.50
  },
  difficultyPreference: 'balanced',
  sessionFrequency: 'medium',
  consistencyLevel: 'consistent',
  helpSeekingBehavior: 'moderate'
}
```

## Best Practices

### For Development
- Use smaller datasets (1-2 months, 2-3 families) for quick testing
- Clear demo data between test runs to avoid conflicts
- Use specific learning profiles to test edge cases

### For Demonstrations
- Generate 6-12 months of historical data for rich analytics
- Include 5-10 families with varied profiles for diversity
- Enable all features (resource usage, achievements, etc.)

### For Performance Testing
- Generate larger datasets (50+ families) for load testing
- Use consistent profiles to reduce generation time
- Monitor database performance during bulk operations

## Troubleshooting

### Common Issues

**"Child not found" Error**
- Ensure the child profile exists in the database before generating data
- Check that the child ID matches exactly

**Missing Master Data**
- Run master data seeding first: `npm run master-data seed`
- Verify that subjects and topics exist for the child's grade level

**Database Constraints**
- Ensure foreign key relationships are properly set up
- Check that required fields are not null in generated data

**Performance Issues**
- Reduce time range or family count for faster generation
- Use database transactions for bulk operations
- Monitor memory usage with large datasets

### Debug Mode

Enable detailed logging by setting the log level:

```bash
LOG_LEVEL=debug npm run demo-data seed
```

This will provide detailed information about the generation process, including:
- Learning pattern calculations
- Data generation statistics
- Database operation details
- Error stack traces

## Future Enhancements

### Planned Features
- **Seasonal Patterns**: School year calendar integration
- **Peer Comparisons**: Grade-level performance benchmarks
- **Learning Disabilities**: Specialized learning pattern simulations
- **Multilingual Support**: Content in multiple languages
- **Advanced Analytics**: Machine learning pattern recognition

### Extensibility
The system is designed to be easily extended with:
- New learning profile types
- Additional data generation patterns
- Custom achievement systems
- Integration with external educational APIs
- Advanced statistical modeling

## Contributing

When adding new features to the mock data generation system:

1. **Maintain Realism**: Ensure patterns reflect actual educational research
2. **Preserve Relationships**: Keep referential integrity with master data
3. **Add Tests**: Include unit and integration tests for new features
4. **Document Patterns**: Explain the logic behind new learning patterns
5. **Consider Performance**: Optimize for large-scale data generation

## Support

For issues or questions about the mock data generation system:

1. Check the troubleshooting section above
2. Review the test files for usage examples
3. Examine the CLI help output for available options
4. Consult the service documentation in the source code