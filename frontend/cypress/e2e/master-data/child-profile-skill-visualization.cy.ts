describe('Master Data Integration - Child Profile Skill Visualization', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-parent-id',
          email: 'parent@example.com',
          firstName: 'Test',
          lastName: 'Parent',
          role: 'PARENT',
        },
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 3600,
      },
    }).as('login');

    // Mock child profile with skill data
    cy.intercept('GET', '/api/children/child-123', {
      statusCode: 200,
      body: {
        id: 'child-123',
        name: 'Test Child',
        username: 'testchild',
        age: 8,
        gradeLevel: '3',
        learningStyle: 'VISUAL',
        skillProfile: {
          overallLevel: 'intermediate',
          lastUpdated: '2024-01-30T10:00:00.000Z'
        },
        isActive: true
      }
    }).as('getChildProfile');

    // Mock skill visualization data
    cy.intercept('GET', '/api/analytics/skill-visualization?childId=child-123', {
      statusCode: 200,
      body: {
        childId: 'child-123',
        overallLevel: 'intermediate',
        subjectProficiencies: [
          {
            subjectId: 'subject-math',
            subjectName: 'Mathematics',
            proficiencyLevel: 'advanced',
            proficiencyScore: 85,
            visualIndicator: {
              type: 'progress-bar',
              value: 85,
              maxValue: 100,
              color: '#4CAF50'
            },
            topicBreakdown: [
              { topicId: 'topic-addition', topicName: 'Addition', masteryLevel: 95, status: 'mastered' },
              { topicId: 'topic-subtraction', topicName: 'Subtraction', masteryLevel: 88, status: 'completed' },
              { topicId: 'topic-multiplication', topicName: 'Multiplication', masteryLevel: 75, status: 'in_progress' },
              { topicId: 'topic-division', topicName: 'Division', masteryLevel: 0, status: 'not_started' }
            ],
            trendDirection: 'up',
            confidenceLevel: 0.9
          },
          {
            subjectId: 'subject-science',
            subjectName: 'Science',
            proficiencyLevel: 'intermediate',
            proficiencyScore: 70,
            visualIndicator: {
              type: 'progress-bar',
              value: 70,
              maxValue: 100,
              color: '#FF9800'
            },
            topicBreakdown: [
              { topicId: 'topic-plants', topicName: 'Plants', masteryLevel: 80, status: 'completed' },
              { topicId: 'topic-animals', topicName: 'Animals', masteryLevel: 65, status: 'in_progress' },
              { topicId: 'topic-weather', topicName: 'Weather', masteryLevel: 0, status: 'not_started' }
            ],
            trendDirection: 'stable',
            confidenceLevel: 0.7
          },
          {
            subjectId: 'subject-english',
            subjectName: 'English',
            proficiencyLevel: 'beginner',
            proficiencyScore: 55,
            visualIndicator: {
              type: 'progress-bar',
              value: 55,
              maxValue: 100,
              color: '#F44336'
            },
            topicBreakdown: [
              { topicId: 'topic-reading', topicName: 'Reading', masteryLevel: 70, status: 'completed' },
              { topicId: 'topic-writing', topicName: 'Writing', masteryLevel: 45, status: 'in_progress' },
              { topicId: 'topic-grammar', topicName: 'Grammar', masteryLevel: 0, status: 'not_started' }
            ],
            trendDirection: 'down',
            confidenceLevel: 0.6
          }
        ],
        skillRadarChart: [
          { subject: 'Mathematics', proficiency: 85, fullMark: 100 },
          { subject: 'Science', proficiency: 70, fullMark: 100 },
          { subject: 'English', proficiency: 55, fullMark: 100 }
        ],
        progressTimeline: [
          { date: '2024-01-01', overallProgress: 50, averageScore: 75 },
          { date: '2024-01-08', overallProgress: 55, averageScore: 78 },
          { date: '2024-01-15', overallProgress: 62, averageScore: 80 },
          { date: '2024-01-22', overallProgress: 68, averageScore: 82 },
          { date: '2024-01-29', overallProgress: 70, averageScore: 83 }
        ],
        achievementBadges: [
          {
            id: 'first-completion',
            title: 'First Steps',
            description: 'Completed your first activity!',
            icon: 'star',
            color: '#4CAF50',
            earnedAt: '2024-01-15T00:00:00.000Z',
            category: 'completion',
            points: 10,
            rarity: 'common'
          },
          {
            id: 'math-streak',
            title: 'Math Streak',
            description: 'Completed 5 math activities in a row!',
            icon: 'trending_up',
            color: '#FF9800',
            earnedAt: '2024-01-25T00:00:00.000Z',
            category: 'streak',
            points: 25,
            rarity: 'uncommon'
          },
          {
            id: 'perfectionist',
            title: 'Perfectionist',
            description: 'Scored 100% on 3 activities!',
            icon: 'star',
            color: '#9C27B0',
            earnedAt: '2024-01-28T00:00:00.000Z',
            category: 'academic',
            points: 50,
            rarity: 'rare'
          }
        ],
        nextMilestones: [
          {
            id: 'math-mastery',
            title: 'Math Master',
            description: 'Complete all Grade 3 math topics',
            progress: 3,
            target: 4,
            estimatedCompletion: '2024-02-15T00:00:00.000Z',
            category: 'academic',
            isCompleted: false
          },
          {
            id: 'science-explorer',
            title: 'Science Explorer',
            description: 'Complete 5 science experiments',
            progress: 2,
            target: 5,
            estimatedCompletion: '2024-02-28T00:00:00.000Z',
            category: 'exploration',
            isCompleted: false
          }
        ]
      }
    }).as('getSkillVisualization');

    // Mock children list
    cy.intercept('GET', '/api/children', {
      statusCode: 200,
      body: [
        {
          id: 'child-123',
          name: 'Test Child',
          username: 'testchild',
          age: 8,
          gradeLevel: '3',
          isActive: true
        }
      ]
    }).as('getChildren');

    // Login and navigate to child profile
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('parent@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@login');
    cy.url().should('include', '/dashboard');
    
    // Navigate to child profile
    cy.get('[data-testid="children-menu-item"]').click();
    cy.get('[data-testid="child-profile-child-123"]').click();
    cy.url().should('include', '/children/child-123');
  });

  describe('Child Profile Loading and Display', () => {
    it('should load and display child profile with skill data', () => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
      
      // Should display child information
      cy.get('[data-testid="child-name"]').should('contain', 'Test Child');
      cy.get('[data-testid="child-age"]').should('contain', '8 years old');
      cy.get('[data-testid="child-grade"]').should('contain', 'Grade 3');
      cy.get('[data-testid="learning-style"]').should('contain', 'Visual');
      
      // Should display overall proficiency level
      cy.get('[data-testid="overall-proficiency"]').should('contain', 'intermediate');
    });

    it('should show loading state for skill visualization', () => {
      // Should display loading indicators
      cy.get('[data-testid="skill-visualization-loading"]').should('be.visible');
      cy.get('[data-testid="proficiency-skeleton"]').should('be.visible');
      
      cy.wait('@getSkillVisualization');
      
      // Loading should disappear
      cy.get('[data-testid="skill-visualization-loading"]').should('not.exist');
      cy.get('[data-testid="proficiency-skeleton"]').should('not.exist');
    });

    it('should display skill visualization sections', () => {
      cy.wait('@getSkillVisualization');
      
      // Should show all main sections
      cy.get('[data-testid="subject-proficiencies-section"]').should('be.visible');
      cy.get('[data-testid="skill-radar-section"]').should('be.visible');
      cy.get('[data-testid="progress-timeline-section"]').should('be.visible');
      cy.get('[data-testid="achievements-section"]').should('be.visible');
      cy.get('[data-testid="milestones-section"]').should('be.visible');
    });
  });

  describe('Subject Proficiencies Display', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should display all subject proficiency cards', () => {
      // Should show subject cards
      cy.get('[data-testid="proficiency-card-math"]').should('be.visible');
      cy.get('[data-testid="proficiency-card-science"]').should('be.visible');
      cy.get('[data-testid="proficiency-card-english"]').should('be.visible');
      
      // Should display subject names
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'Mathematics');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'Science');
      cy.get('[data-testid="proficiency-card-english"]').should('contain', 'English');
    });

    it('should show proficiency levels and scores', () => {
      // Mathematics - Advanced
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'advanced');
      cy.get('[data-testid="proficiency-card-math"]').should('contain', '85');
      
      // Science - Intermediate
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'intermediate');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', '70');
      
      // English - Beginner
      cy.get('[data-testid="proficiency-card-english"]').should('contain', 'beginner');
      cy.get('[data-testid="proficiency-card-english"]').should('contain', '55');
    });

    it('should display visual progress indicators', () => {
      // Should show progress bars with correct values
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuenow', '85');
      cy.get('[data-testid="proficiency-bar-science"]').should('have.attr', 'aria-valuenow', '70');
      cy.get('[data-testid="proficiency-bar-english"]').should('have.attr', 'aria-valuenow', '55');
      
      // Should use appropriate colors based on proficiency level
      cy.get('[data-testid="proficiency-bar-math"]').should('have.css', 'background-color', 'rgb(76, 175, 80)'); // Green for advanced
      cy.get('[data-testid="proficiency-bar-science"]').should('have.css', 'background-color', 'rgb(255, 152, 0)'); // Orange for intermediate
      cy.get('[data-testid="proficiency-bar-english"]').should('have.css', 'background-color', 'rgb(244, 67, 54)'); // Red for beginner
    });

    it('should show trend directions with visual indicators', () => {
      // Mathematics - Improving
      cy.get('[data-testid="proficiency-card-math"] [data-testid="trend-up"]').should('be.visible');
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'improving');
      
      // Science - Stable
      cy.get('[data-testid="proficiency-card-science"] [data-testid="trend-stable"]').should('be.visible');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'stable');
      
      // English - Declining
      cy.get('[data-testid="proficiency-card-english"] [data-testid="trend-down"]').should('be.visible');
      cy.get('[data-testid="proficiency-card-english"]').should('contain', 'needs attention');
    });

    it('should display confidence levels', () => {
      // Should show confidence percentages
      cy.get('[data-testid="proficiency-card-math"]').should('contain', '90% confidence');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', '70% confidence');
      cy.get('[data-testid="proficiency-card-english"]').should('contain', '60% confidence');
    });
  });

  describe('Topic Breakdown Within Subjects', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should show topic mastery levels for each subject', () => {
      // Mathematics topics
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'Addition: 95%');
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'Subtraction: 88%');
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'Multiplication: 75%');
      cy.get('[data-testid="proficiency-card-math"]').should('contain', 'Division: 0%');
      
      // Science topics
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'Plants: 80%');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'Animals: 65%');
      cy.get('[data-testid="proficiency-card-science"]').should('contain', 'Weather: 0%');
    });

    it('should display topic status indicators', () => {
      // Mathematics topic statuses
      cy.get('[data-testid="topic-status-addition"]').should('contain', 'mastered');
      cy.get('[data-testid="topic-status-addition"]').should('have.class', 'status-mastered');
      
      cy.get('[data-testid="topic-status-subtraction"]').should('contain', 'completed');
      cy.get('[data-testid="topic-status-subtraction"]').should('have.class', 'status-completed');
      
      cy.get('[data-testid="topic-status-multiplication"]').should('contain', 'in progress');
      cy.get('[data-testid="topic-status-multiplication"]').should('have.class', 'status-in-progress');
      
      cy.get('[data-testid="topic-status-division"]').should('contain', 'not started');
      cy.get('[data-testid="topic-status-division"]').should('have.class', 'status-not-started');
    });

    it('should allow expanding topic details', () => {
      // Click to expand mathematics topics
      cy.get('[data-testid="expand-math-topics"]').click();
      
      // Should show detailed topic information
      cy.get('[data-testid="topic-detail-addition"]').should('be.visible');
      cy.get('[data-testid="topic-detail-addition"]').should('contain', 'Last practiced: Jan 30');
      cy.get('[data-testid="topic-detail-addition"]').should('contain', '5 attempts');
      cy.get('[data-testid="topic-detail-addition"]').should('contain', '120 minutes');
    });

    it('should show topic progress bars', () => {
      // Expand topics to see progress bars
      cy.get('[data-testid="expand-math-topics"]').click();
      
      // Should display individual topic progress bars
      cy.get('[data-testid="topic-progress-addition"]').should('have.attr', 'aria-valuenow', '95');
      cy.get('[data-testid="topic-progress-subtraction"]').should('have.attr', 'aria-valuenow', '88');
      cy.get('[data-testid="topic-progress-multiplication"]').should('have.attr', 'aria-valuenow', '75');
      cy.get('[data-testid="topic-progress-division"]').should('have.attr', 'aria-valuenow', '0');
    });
  });

  describe('Skill Radar Chart Visualization', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should render radar chart with subject data', () => {
      // Should display radar chart container
      cy.get('[data-testid="skill-radar-chart"]').should('be.visible');
      
      // Should contain subject data points
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'Mathematics');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'Science');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'English');
    });

    it('should show proficiency values on radar chart', () => {
      // Should display proficiency scores
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '85'); // Math
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '70'); // Science
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '55'); // English
    });

    it('should be interactive with hover tooltips', () => {
      // Hover over math data point
      cy.get('[data-testid="radar-point-math"]').trigger('mouseover');
      
      // Should show tooltip with details
      cy.get('[data-testid="radar-tooltip"]').should('be.visible');
      cy.get('[data-testid="radar-tooltip"]').should('contain', 'Mathematics: 85/100');
      cy.get('[data-testid="radar-tooltip"]').should('contain', 'Advanced level');
    });

    it('should allow toggling between different views', () => {
      // Should have view toggle options
      cy.get('[data-testid="radar-view-toggle"]').should('be.visible');
      
      // Switch to percentage view
      cy.get('[data-testid="radar-view-percentage"]').click();
      
      // Should update chart display
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '85%');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '70%');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', '55%');
    });
  });

  describe('Progress Timeline Visualization', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should display progress timeline chart', () => {
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
    });

    it('should show progress data points over time', () => {
      // Should display timeline data
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', 'Jan 1');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', 'Jan 8');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', 'Jan 15');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', 'Jan 22');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', 'Jan 29');
    });

    it('should show progress values and scores', () => {
      // Should display progress percentages
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '50%');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '70%');
      
      // Should display average scores
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '75');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '83');
    });

    it('should be interactive with data point details', () => {
      // Click on a data point
      cy.get('[data-testid="timeline-point-jan-29"]').click();
      
      // Should show detailed information
      cy.get('[data-testid="timeline-detail-modal"]').should('be.visible');
      cy.get('[data-testid="timeline-detail-modal"]').should('contain', 'January 29, 2024');
      cy.get('[data-testid="timeline-detail-modal"]').should('contain', '70% overall progress');
      cy.get('[data-testid="timeline-detail-modal"]').should('contain', '83 average score');
    });

    it('should allow changing timeline period', () => {
      // Should have period selector
      cy.get('[data-testid="timeline-period-selector"]').should('be.visible');
      
      // Change to 3 months view
      cy.get('[data-testid="timeline-3months"]').click();
      
      // Should update chart with more data points
      cy.wait('@getSkillVisualization');
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
    });
  });

  describe('Achievement Badges Display', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should display earned achievement badges', () => {
      // Should show achievements section
      cy.get('[data-testid="achievements-section"]').should('be.visible');
      
      // Should display individual badges
      cy.get('[data-testid="badge-first-completion"]').should('be.visible');
      cy.get('[data-testid="badge-math-streak"]').should('be.visible');
      cy.get('[data-testid="badge-perfectionist"]').should('be.visible');
    });

    it('should show badge details and rarity', () => {
      // First Steps badge
      cy.get('[data-testid="badge-first-completion"]').should('contain', 'First Steps');
      cy.get('[data-testid="badge-first-completion"]').should('contain', 'Completed your first activity!');
      cy.get('[data-testid="badge-first-completion"]').should('contain', 'common');
      cy.get('[data-testid="badge-first-completion"]').should('contain', '10 points');
      
      // Math Streak badge
      cy.get('[data-testid="badge-math-streak"]').should('contain', 'Math Streak');
      cy.get('[data-testid="badge-math-streak"]').should('contain', 'Completed 5 math activities in a row!');
      cy.get('[data-testid="badge-math-streak"]').should('contain', 'uncommon');
      cy.get('[data-testid="badge-math-streak"]').should('contain', '25 points');
      
      // Perfectionist badge
      cy.get('[data-testid="badge-perfectionist"]').should('contain', 'Perfectionist');
      cy.get('[data-testid="badge-perfectionist"]').should('contain', 'Scored 100% on 3 activities!');
      cy.get('[data-testid="badge-perfectionist"]').should('contain', 'rare');
      cy.get('[data-testid="badge-perfectionist"]').should('contain', '50 points');
    });

    it('should show badge earned dates', () => {
      // Should display when badges were earned
      cy.get('[data-testid="badge-first-completion"]').should('contain', 'Earned Jan 15');
      cy.get('[data-testid="badge-math-streak"]').should('contain', 'Earned Jan 25');
      cy.get('[data-testid="badge-perfectionist"]').should('contain', 'Earned Jan 28');
    });

    it('should use appropriate colors and icons for badge rarity', () => {
      // Common badge - green
      cy.get('[data-testid="badge-first-completion"]').should('have.css', 'border-color', 'rgb(76, 175, 80)');
      
      // Uncommon badge - orange
      cy.get('[data-testid="badge-math-streak"]').should('have.css', 'border-color', 'rgb(255, 152, 0)');
      
      // Rare badge - purple
      cy.get('[data-testid="badge-perfectionist"]').should('have.css', 'border-color', 'rgb(156, 39, 176)');
    });

    it('should allow viewing badge details in modal', () => {
      // Click on a badge
      cy.get('[data-testid="badge-perfectionist"]').click();
      
      // Should open badge detail modal
      cy.get('[data-testid="badge-detail-modal"]').should('be.visible');
      cy.get('[data-testid="badge-detail-modal"]').should('contain', 'Perfectionist');
      cy.get('[data-testid="badge-detail-modal"]').should('contain', 'Scored 100% on 3 activities!');
      cy.get('[data-testid="badge-detail-modal"]').should('contain', 'Academic Achievement');
      cy.get('[data-testid="badge-detail-modal"]').should('contain', '50 points earned');
    });
  });

  describe('Next Milestones Display', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should display upcoming milestones', () => {
      // Should show milestones section
      cy.get('[data-testid="milestones-section"]').should('be.visible');
      
      // Should display individual milestones
      cy.get('[data-testid="milestone-math-mastery"]').should('be.visible');
      cy.get('[data-testid="milestone-science-explorer"]').should('be.visible');
    });

    it('should show milestone progress and targets', () => {
      // Math Master milestone
      cy.get('[data-testid="milestone-math-mastery"]').should('contain', 'Math Master');
      cy.get('[data-testid="milestone-math-mastery"]').should('contain', 'Complete all Grade 3 math topics');
      cy.get('[data-testid="milestone-math-mastery"]').should('contain', '3/4 completed');
      
      // Science Explorer milestone
      cy.get('[data-testid="milestone-science-explorer"]').should('contain', 'Science Explorer');
      cy.get('[data-testid="milestone-science-explorer"]').should('contain', 'Complete 5 science experiments');
      cy.get('[data-testid="milestone-science-explorer"]').should('contain', '2/5 completed');
    });

    it('should display milestone progress bars', () => {
      // Should show progress bars with correct values
      cy.get('[data-testid="milestone-progress-math-mastery"]').should('have.attr', 'aria-valuenow', '75'); // 3/4 = 75%
      cy.get('[data-testid="milestone-progress-science-explorer"]').should('have.attr', 'aria-valuenow', '40'); // 2/5 = 40%
    });

    it('should show estimated completion dates', () => {
      // Should display estimated completion
      cy.get('[data-testid="milestone-math-mastery"]').should('contain', 'Est. completion: Feb 15');
      cy.get('[data-testid="milestone-science-explorer"]').should('contain', 'Est. completion: Feb 28');
    });

    it('should categorize milestones appropriately', () => {
      // Should show milestone categories
      cy.get('[data-testid="milestone-math-mastery"]').should('contain', 'Academic');
      cy.get('[data-testid="milestone-science-explorer"]').should('contain', 'Exploration');
    });
  });

  describe('Interactive Features', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should allow drilling down into subject details', () => {
      // Click on mathematics proficiency card
      cy.get('[data-testid="proficiency-card-math"]').click();
      
      // Should navigate to detailed subject view
      cy.url().should('include', '/children/child-123/subjects/math');
      
      // Should display detailed mathematics analytics
      cy.get('[data-testid="subject-detail-header"]').should('contain', 'Mathematics Progress');
    });

    it('should support filtering by time periods', () => {
      // Should have time period filter
      cy.get('[data-testid="time-period-filter"]').should('be.visible');
      
      // Change to last 30 days
      cy.get('[data-testid="time-period-30days"]').click();
      
      // Should update visualizations
      cy.wait('@getSkillVisualization');
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
    });

    it('should allow comparing with grade-level expectations', () => {
      // Should have comparison toggle
      cy.get('[data-testid="grade-comparison-toggle"]').should('be.visible');
      
      // Enable grade-level comparison
      cy.get('[data-testid="grade-comparison-toggle"]').click();
      
      // Should show comparison indicators
      cy.get('[data-testid="grade-comparison-math"]').should('contain', 'Above grade level');
      cy.get('[data-testid="grade-comparison-science"]').should('contain', 'At grade level');
      cy.get('[data-testid="grade-comparison-english"]').should('contain', 'Below grade level');
    });

    it('should provide recommendations based on skill data', () => {
      // Should show recommendations section
      cy.get('[data-testid="recommendations-section"]').should('be.visible');
      
      // Should display personalized recommendations
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Focus on division to complete math mastery');
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Continue science experiments to reach explorer milestone');
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Practice writing skills to improve English proficiency');
    });
  });

  describe('Error Handling', () => {
    it('should handle skill visualization API errors', () => {
      // Mock API error
      cy.intercept('GET', '/api/analytics/skill-visualization*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getSkillVisualizationError');
      
      cy.visit('/children/child-123');
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualizationError');
      
      // Should display error message
      cy.get('[data-testid="skill-visualization-error"]').should('be.visible');
      cy.get('[data-testid="skill-visualization-error"]').should('contain', 'Failed to load skill data');
      
      // Should show retry button
      cy.get('[data-testid="retry-skill-data-button"]').should('be.visible');
    });

    it('should handle empty skill data gracefully', () => {
      // Mock empty skill data
      cy.intercept('GET', '/api/analytics/skill-visualization*', {
        statusCode: 200,
        body: {
          childId: 'child-123',
          overallLevel: 'beginner',
          subjectProficiencies: [],
          skillRadarChart: [],
          progressTimeline: [],
          achievementBadges: [],
          nextMilestones: []
        }
      }).as('getEmptySkillData');
      
      cy.visit('/children/child-123');
      cy.wait('@getChildProfile');
      cy.wait('@getEmptySkillData');
      
      // Should display empty state messages
      cy.get('[data-testid="no-skill-data-message"]').should('be.visible');
      cy.get('[data-testid="no-skill-data-message"]').should('contain', 'No learning progress yet');
      
      // Should suggest starting activities
      cy.get('[data-testid="start-learning-suggestion"]').should('be.visible');
      cy.get('[data-testid="create-study-plan-button"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should adapt layout for mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      
      // Proficiency cards should stack vertically
      cy.get('[data-testid="subject-proficiencies-section"]').should('have.css', 'flex-direction', 'column');
      
      // Charts should be responsive
      cy.get('[data-testid="skill-radar-chart"]').should('be.visible');
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
      
      // Achievement badges should wrap appropriately
      cy.get('[data-testid="achievements-grid"]').should('have.css', 'grid-template-columns');
    });

    it('should work well on tablet screens', () => {
      cy.viewport(768, 1024); // iPad
      
      // Should use appropriate grid layout
      cy.get('[data-testid="skill-visualization-grid"]').should('have.css', 'grid-template-columns');
      
      // All sections should be visible and properly sized
      cy.get('[data-testid="subject-proficiencies-section"]').should('be.visible');
      cy.get('[data-testid="skill-radar-section"]').should('be.visible');
      cy.get('[data-testid="achievements-section"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.wait('@getChildProfile');
      cy.wait('@getSkillVisualization');
    });

    it('should have proper heading structure', () => {
      // Should have main heading
      cy.get('h1').should('contain', 'Test Child - Skill Profile');
      
      // Should have section headings
      cy.get('h2').should('contain', 'Subject Proficiencies');
      cy.get('h2').should('contain', 'Skill Overview');
      cy.get('h2').should('contain', 'Progress Timeline');
      cy.get('h2').should('contain', 'Achievements');
      cy.get('h2').should('contain', 'Next Milestones');
    });

    it('should provide ARIA labels for progress indicators', () => {
      // Progress bars should have proper ARIA attributes
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'role', 'progressbar');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-label', 'Mathematics proficiency: 85 out of 100');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuenow', '85');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuemin', '0');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuemax', '100');
    });

    it('should support keyboard navigation', () => {
      // Should be able to tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'proficiency-card-math');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'proficiency-card-science');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'proficiency-card-english');
      
      // Should be able to activate with keyboard
      cy.focused().type('{enter}');
      cy.url().should('include', '/children/child-123/subjects/english');
    });

    it('should provide screen reader announcements for data updates', () => {
      // Should have live regions for dynamic content
      cy.get('[data-testid="skill-data-live-region"]').should('have.attr', 'aria-live', 'polite');
      
      // Change time period and check announcement
      cy.get('[data-testid="time-period-30days"]').click();
      cy.wait('@getSkillVisualization');
      
      cy.get('[data-testid="skill-data-live-region"]').should('contain', 'Skill data updated for last 30 days');
    });

    it('should provide alternative text for visual elements', () => {
      // Charts should have proper descriptions
      cy.get('[data-testid="skill-radar-chart"]').should('have.attr', 'aria-label', 'Skill proficiency radar chart showing Mathematics at 85%, Science at 70%, and English at 55%');
      
      // Achievement badges should have descriptive labels
      cy.get('[data-testid="badge-perfectionist"]').should('have.attr', 'aria-label', 'Perfectionist badge - rare achievement worth 50 points, earned January 28th');
    });
  });
});