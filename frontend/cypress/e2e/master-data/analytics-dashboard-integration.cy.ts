describe('Master Data Integration - Analytics Dashboard', () => {
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

    // Mock child profile
    cy.intercept('GET', '/api/children', {
      statusCode: 200,
      body: [
        {
          id: 'child-123',
          name: 'Test Child',
          username: 'testchild',
          age: 8,
          gradeLevel: '3',
          learningStyle: 'VISUAL',
          isActive: true
        }
      ]
    }).as('getChildren');

    // Mock comprehensive analytics data
    cy.intercept('GET', '/api/analytics/comprehensive?childId=child-123*', {
      statusCode: 200,
      body: {
        overview: {
          timeFrame: {
            start: '2024-01-01T00:00:00.000Z',
            end: '2024-01-31T23:59:59.999Z'
          },
          detailedMetrics: {
            basic: {
              totalActivities: 50,
              completedActivities: 40,
              completionRate: 80,
              totalTimeSpent: 1200,
              averageSessionLength: 30
            },
            performance: {
              averageScore: 85,
              highestScore: 98,
              lowestScore: 65,
              scoreImprovement: 15,
              consistencyScore: 0.8
            },
            engagement: {
              streakDays: 7,
              totalSessions: 25,
              averageSessionsPerDay: 1.2,
              peakLearningHours: [14, 15, 16],
              subjectEngagement: {
                math: 0.9,
                science: 0.8,
                english: 0.7
              }
            }
          },
          learningVelocity: {
            velocity: 1.5,
            trend: 'increasing',
            weeklyProgress: [10, 15, 20, 25, 30],
            projectedCompletion: '2024-03-15T00:00:00.000Z'
          },
          masteryIndicators: {
            overallMastery: 0.75,
            subjectMastery: {
              math: 0.85,
              science: 0.70,
              english: 0.65
            },
            skillProgression: [
              { skill: 'arithmetic', level: 0.9 },
              { skill: 'reading', level: 0.7 },
              { skill: 'writing', level: 0.6 }
            ]
          }
        },
        subjectBreakdown: [
          {
            subjectId: 'subject-math',
            subjectName: 'Mathematics',
            overallProgress: 85,
            proficiencyLevel: 'advanced',
            topicsCompleted: 8,
            totalTopics: 10,
            averageScore: 88,
            timeSpent: 480,
            strengthAreas: ['arithmetic', 'algebra'],
            improvementAreas: ['geometry'],
            nextRecommendedTopics: ['fractions', 'decimals'],
            masteryTrend: 'improving'
          },
          {
            subjectId: 'subject-science',
            subjectName: 'Science',
            overallProgress: 70,
            proficiencyLevel: 'intermediate',
            topicsCompleted: 6,
            totalTopics: 10,
            averageScore: 82,
            timeSpent: 360,
            strengthAreas: ['biology'],
            improvementAreas: ['physics', 'chemistry'],
            nextRecommendedTopics: ['atoms', 'molecules'],
            masteryTrend: 'stable'
          },
          {
            subjectId: 'subject-english',
            subjectName: 'English',
            overallProgress: 65,
            proficiencyLevel: 'intermediate',
            topicsCompleted: 5,
            totalTopics: 10,
            averageScore: 78,
            timeSpent: 300,
            strengthAreas: ['reading'],
            improvementAreas: ['writing', 'grammar'],
            nextRecommendedTopics: ['essay-writing', 'punctuation'],
            masteryTrend: 'stable'
          }
        ],
        topicMastery: [
          {
            topicId: 'topic-addition',
            topicName: 'Addition',
            subjectId: 'subject-math',
            masteryLevel: 95,
            attemptsCount: 5,
            averageScore: 92,
            timeSpent: 120,
            lastActivity: '2024-01-30T10:00:00.000Z',
            status: { status: 'mastered' },
            difficultyProgression: [
              { attempt: 1, difficulty: 'beginner', score: 85 },
              { attempt: 2, difficulty: 'intermediate', score: 90 },
              { attempt: 3, difficulty: 'advanced', score: 95 }
            ]
          },
          {
            topicId: 'topic-subtraction',
            topicName: 'Subtraction',
            subjectId: 'subject-math',
            masteryLevel: 88,
            attemptsCount: 4,
            averageScore: 86,
            timeSpent: 100,
            lastActivity: '2024-01-28T14:00:00.000Z',
            status: { status: 'completed' },
            difficultyProgression: [
              { attempt: 1, difficulty: 'beginner', score: 80 },
              { attempt: 2, difficulty: 'intermediate', score: 88 }
            ]
          }
        ],
        skillVisualization: {
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
                { topicId: 'topic-subtraction', topicName: 'Subtraction', masteryLevel: 88, status: 'completed' }
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
                { topicId: 'topic-plants', topicName: 'Plants', masteryLevel: 75, status: 'completed' }
              ],
              trendDirection: 'stable',
              confidenceLevel: 0.7
            }
          ],
          skillRadarChart: [
            { subject: 'Mathematics', proficiency: 85, fullMark: 100 },
            { subject: 'Science', proficiency: 70, fullMark: 100 },
            { subject: 'English', proficiency: 65, fullMark: 100 }
          ],
          achievementBadges: [
            {
              id: 'math-master',
              title: 'Math Master',
              description: 'Completed 10 math activities',
              icon: 'star',
              color: '#FFD700',
              earnedAt: '2024-01-25T00:00:00.000Z',
              category: 'academic',
              points: 50,
              rarity: 'rare'
            }
          ]
        },
        timeSeriesData: [
          { date: '2024-01-01', activitiesCompleted: 2, averageScore: 80, sessionTime: 45, engagementScore: 0.8 },
          { date: '2024-01-02', activitiesCompleted: 3, averageScore: 85, sessionTime: 50, engagementScore: 0.9 },
          { date: '2024-01-03', activitiesCompleted: 1, averageScore: 90, sessionTime: 30, engagementScore: 0.7 },
          { date: '2024-01-04', activitiesCompleted: 4, averageScore: 88, sessionTime: 60, engagementScore: 0.95 },
          { date: '2024-01-05', activitiesCompleted: 2, averageScore: 92, sessionTime: 40, engagementScore: 0.85 }
        ],
        comparativeAnalysis: {
          periodComparison: {
            completionRate: { current: 80, previous: 70, change: 10 },
            averageScore: { current: 85, previous: 80, change: 5 },
            timeSpent: { current: 1200, previous: 1000, change: 200 },
            learningVelocity: { current: 1.5, previous: 1.2, change: 0.3 }
          },
          trends: {
            improving: 3,
            declining: 0,
            stable: 1
          },
          recommendations: [
            'Continue current learning pace',
            'Focus more on geometry topics',
            'Maintain consistent study schedule'
          ]
        }
      }
    }).as('getComprehensiveAnalytics');

    // Login and navigate to analytics dashboard
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('parent@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@login');
    cy.url().should('include', '/dashboard');
    
    // Navigate to analytics dashboard
    cy.get('[data-testid="analytics-menu-item"]').click();
    cy.url().should('include', '/analytics');
  });

  describe('Analytics Dashboard Loading and Display', () => {
    it('should load and display comprehensive analytics data', () => {
      cy.wait('@getComprehensiveAnalytics');
      
      // Should display main dashboard sections
      cy.get('[data-testid="learning-overview-section"]').should('be.visible');
      cy.get('[data-testid="subject-performance-section"]').should('be.visible');
      cy.get('[data-testid="skill-proficiency-section"]').should('be.visible');
      cy.get('[data-testid="progress-timeline-section"]').should('be.visible');
    });

    it('should show loading state initially', () => {
      // Should display loading indicators
      cy.get('[data-testid="analytics-loading"]').should('be.visible');
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      
      cy.wait('@getComprehensiveAnalytics');
      
      // Loading should disappear
      cy.get('[data-testid="analytics-loading"]').should('not.exist');
      cy.get('[data-testid="loading-skeleton"]').should('not.exist');
    });

    it('should display child selector when multiple children exist', () => {
      // Mock multiple children
      cy.intercept('GET', '/api/children', {
        statusCode: 200,
        body: [
          { id: 'child-123', name: 'Child One', age: 8, gradeLevel: '3' },
          { id: 'child-456', name: 'Child Two', age: 10, gradeLevel: '5' }
        ]
      }).as('getMultipleChildren');
      
      cy.visit('/analytics');
      cy.wait('@getMultipleChildren');
      
      // Should show child selector
      cy.get('[data-testid="child-selector"]').should('be.visible');
      cy.get('[data-testid="child-selector"]').should('contain', 'Child One');
    });
  });

  describe('Learning Overview Section', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should display key performance metrics', () => {
      // Should show completion rate
      cy.get('[data-testid="completion-rate-metric"]').should('contain', '80%');
      
      // Should show average score
      cy.get('[data-testid="average-score-metric"]').should('contain', '85');
      
      // Should show total activities
      cy.get('[data-testid="total-activities-metric"]').should('contain', '50');
      
      // Should show completed activities
      cy.get('[data-testid="completed-activities-metric"]').should('contain', '40');
    });

    it('should display learning velocity information', () => {
      // Should show velocity value
      cy.get('[data-testid="learning-velocity-value"]').should('contain', '1.5');
      
      // Should show trend indicator
      cy.get('[data-testid="learning-velocity-trend"]').should('contain', 'increasing');
      cy.get('[data-testid="trend-up-icon"]').should('be.visible');
    });

    it('should show engagement patterns', () => {
      // Should display streak information
      cy.get('[data-testid="streak-days"]').should('contain', '7 days');
      
      // Should show average session length
      cy.get('[data-testid="average-session-length"]').should('contain', '30 min');
      
      // Should display peak learning hours
      cy.get('[data-testid="peak-learning-hours"]').should('contain', '2:00 PM - 4:00 PM');
    });

    it('should display mastery indicators', () => {
      // Should show overall mastery
      cy.get('[data-testid="overall-mastery"]').should('contain', '75%');
      
      // Should show subject mastery breakdown
      cy.get('[data-testid="subject-mastery-math"]').should('contain', '85%');
      cy.get('[data-testid="subject-mastery-science"]').should('contain', '70%');
      cy.get('[data-testid="subject-mastery-english"]').should('contain', '65%');
    });
  });

  describe('Subject Performance Section', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should display subject performance cards', () => {
      // Should show all subjects
      cy.get('[data-testid="subject-card-math"]').should('be.visible');
      cy.get('[data-testid="subject-card-science"]').should('be.visible');
      cy.get('[data-testid="subject-card-english"]').should('be.visible');
      
      // Should display subject names
      cy.get('[data-testid="subject-card-math"]').should('contain', 'Mathematics');
      cy.get('[data-testid="subject-card-science"]').should('contain', 'Science');
      cy.get('[data-testid="subject-card-english"]').should('contain', 'English');
    });

    it('should show progress percentages and proficiency levels', () => {
      // Mathematics
      cy.get('[data-testid="subject-card-math"]').should('contain', '85%');
      cy.get('[data-testid="subject-card-math"]').should('contain', 'advanced');
      
      // Science
      cy.get('[data-testid="subject-card-science"]').should('contain', '70%');
      cy.get('[data-testid="subject-card-science"]').should('contain', 'intermediate');
      
      // English
      cy.get('[data-testid="subject-card-english"]').should('contain', '65%');
      cy.get('[data-testid="subject-card-english"]').should('contain', 'intermediate');
    });

    it('should display topic completion ratios', () => {
      // Should show completed vs total topics
      cy.get('[data-testid="subject-card-math"]').should('contain', '8/10 topics');
      cy.get('[data-testid="subject-card-science"]').should('contain', '6/10 topics');
      cy.get('[data-testid="subject-card-english"]').should('contain', '5/10 topics');
    });

    it('should show average scores and time spent', () => {
      // Mathematics
      cy.get('[data-testid="subject-card-math"]').should('contain', '88 avg score');
      cy.get('[data-testid="subject-card-math"]').should('contain', '480 min');
      
      // Science
      cy.get('[data-testid="subject-card-science"]').should('contain', '82 avg score');
      cy.get('[data-testid="subject-card-science"]').should('contain', '360 min');
    });

    it('should display strength and improvement areas', () => {
      // Mathematics strengths and improvements
      cy.get('[data-testid="subject-card-math"]').should('contain', 'arithmetic');
      cy.get('[data-testid="subject-card-math"]').should('contain', 'algebra');
      cy.get('[data-testid="subject-card-math"]').should('contain', 'geometry');
      
      // Science areas
      cy.get('[data-testid="subject-card-science"]').should('contain', 'biology');
      cy.get('[data-testid="subject-card-science"]').should('contain', 'physics');
      cy.get('[data-testid="subject-card-science"]').should('contain', 'chemistry');
    });

    it('should show mastery trends with visual indicators', () => {
      // Should show trend indicators
      cy.get('[data-testid="subject-card-math"] [data-testid="trend-improving"]').should('be.visible');
      cy.get('[data-testid="subject-card-science"] [data-testid="trend-stable"]').should('be.visible');
      cy.get('[data-testid="subject-card-english"] [data-testid="trend-stable"]').should('be.visible');
    });

    it('should display next recommended topics', () => {
      // Mathematics recommendations
      cy.get('[data-testid="subject-card-math"]').should('contain', 'fractions');
      cy.get('[data-testid="subject-card-math"]').should('contain', 'decimals');
      
      // Science recommendations
      cy.get('[data-testid="subject-card-science"]').should('contain', 'atoms');
      cy.get('[data-testid="subject-card-science"]').should('contain', 'molecules');
    });
  });

  describe('Skill Proficiency Visualization', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should display overall proficiency level', () => {
      cy.get('[data-testid="overall-proficiency-level"]').should('contain', 'intermediate');
    });

    it('should render radar chart for skill visualization', () => {
      // Should display radar chart container
      cy.get('[data-testid="skill-radar-chart"]').should('be.visible');
      
      // Should contain chart data points
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'Mathematics');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'Science');
      cy.get('[data-testid="skill-radar-chart"]').should('contain', 'English');
    });

    it('should display subject proficiency details', () => {
      // Mathematics proficiency
      cy.get('[data-testid="proficiency-math"]').should('contain', 'Mathematics');
      cy.get('[data-testid="proficiency-math"]').should('contain', 'advanced');
      cy.get('[data-testid="proficiency-math"]').should('contain', '85');
      
      // Should show trend direction
      cy.get('[data-testid="proficiency-math"] [data-testid="trend-up"]').should('be.visible');
      
      // Should show confidence level
      cy.get('[data-testid="proficiency-math"]').should('contain', '90% confidence');
    });

    it('should show topic breakdown within subjects', () => {
      // Should display topic mastery levels
      cy.get('[data-testid="proficiency-math"]').should('contain', 'Addition: 95%');
      cy.get('[data-testid="proficiency-math"]').should('contain', 'Subtraction: 88%');
      
      // Should show topic status indicators
      cy.get('[data-testid="topic-addition-status"]').should('contain', 'mastered');
      cy.get('[data-testid="topic-subtraction-status"]').should('contain', 'completed');
    });

    it('should display achievement badges', () => {
      // Should show earned badges
      cy.get('[data-testid="achievement-badges"]').should('be.visible');
      cy.get('[data-testid="badge-math-master"]').should('contain', 'Math Master');
      cy.get('[data-testid="badge-math-master"]').should('contain', 'Completed 10 math activities');
      
      // Should show badge rarity and points
      cy.get('[data-testid="badge-math-master"]').should('contain', 'rare');
      cy.get('[data-testid="badge-math-master"]').should('contain', '50 points');
    });

    it('should show visual proficiency indicators', () => {
      // Should display progress bars for each subject
      cy.get('[data-testid="proficiency-bar-math"]').should('be.visible');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuenow', '85');
      
      cy.get('[data-testid="proficiency-bar-science"]').should('be.visible');
      cy.get('[data-testid="proficiency-bar-science"]').should('have.attr', 'aria-valuenow', '70');
      
      // Should use appropriate colors
      cy.get('[data-testid="proficiency-bar-math"]').should('have.css', 'background-color', 'rgb(76, 175, 80)'); // Green for advanced
      cy.get('[data-testid="proficiency-bar-science"]').should('have.css', 'background-color', 'rgb(255, 152, 0)'); // Orange for intermediate
    });
  });

  describe('Progress Timeline Section', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should render timeline chart', () => {
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
    });

    it('should display time series data points', () => {
      // Should show data for each day
      cy.get('[data-testid="timeline-data-point"]').should('have.length.at.least', 5);
      
      // Should display activities completed
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '2 activities');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '3 activities');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '4 activities');
    });

    it('should show engagement score trends', () => {
      // Should display engagement scores
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '0.8');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '0.9');
      cy.get('[data-testid="progress-timeline-chart"]').should('contain', '0.95');
    });

    it('should allow time frame selection', () => {
      // Should have time frame selector
      cy.get('[data-testid="time-frame-selector"]').should('be.visible');
      
      // Should have options for different periods
      cy.get('[data-testid="time-frame-7days"]').should('be.visible');
      cy.get('[data-testid="time-frame-30days"]').should('be.visible');
      cy.get('[data-testid="time-frame-90days"]').should('be.visible');
      
      // Should update chart when time frame changes
      cy.get('[data-testid="time-frame-7days"]').click();
      cy.wait('@getComprehensiveAnalytics');
    });
  });

  describe('Topic Mastery Details', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should display topic mastery information', () => {
      // Should show topic mastery section
      cy.get('[data-testid="topic-mastery-section"]').should('be.visible');
      
      // Should display individual topics
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', 'Addition');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', 'Subtraction');
    });

    it('should show mastery levels and status', () => {
      // Addition topic
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', '95%');
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', 'mastered');
      
      // Subtraction topic
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', '88%');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', 'completed');
    });

    it('should display attempt counts and scores', () => {
      // Should show number of attempts
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', '5 attempts');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', '4 attempts');
      
      // Should show average scores
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', '92 avg');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', '86 avg');
    });

    it('should show time spent and last activity', () => {
      // Should display time spent
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', '120 min');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', '100 min');
      
      // Should show last activity date
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', 'Jan 30');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', 'Jan 28');
    });

    it('should display difficulty progression', () => {
      // Should show progression through difficulty levels
      cy.get('[data-testid="topic-mastery-addition"]').should('contain', 'beginner → intermediate → advanced');
      cy.get('[data-testid="topic-mastery-subtraction"]').should('contain', 'beginner → intermediate');
    });
  });

  describe('Comparative Analysis Section', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should display period-over-period comparisons', () => {
      // Should show comparison section
      cy.get('[data-testid="comparative-analysis-section"]').should('be.visible');
      
      // Should display metric changes
      cy.get('[data-testid="completion-rate-change"]').should('contain', '+10%');
      cy.get('[data-testid="average-score-change"]').should('contain', '+5');
      cy.get('[data-testid="time-spent-change"]').should('contain', '+200 min');
      cy.get('[data-testid="learning-velocity-change"]').should('contain', '+0.3');
    });

    it('should show trend indicators', () => {
      // Should display trend summary
      cy.get('[data-testid="trends-summary"]').should('contain', '3 improving');
      cy.get('[data-testid="trends-summary"]').should('contain', '0 declining');
      cy.get('[data-testid="trends-summary"]').should('contain', '1 stable');
    });

    it('should display recommendations', () => {
      // Should show personalized recommendations
      cy.get('[data-testid="recommendations-list"]').should('be.visible');
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Continue current learning pace');
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Focus more on geometry topics');
      cy.get('[data-testid="recommendations-list"]').should('contain', 'Maintain consistent study schedule');
    });
  });

  describe('Interactive Features', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should allow drilling down into subject details', () => {
      // Click on math subject card
      cy.get('[data-testid="subject-card-math"]').click();
      
      // Should navigate to detailed subject view
      cy.url().should('include', '/analytics/subject/math');
      
      // Should display detailed math analytics
      cy.get('[data-testid="subject-detail-header"]').should('contain', 'Mathematics Analytics');
    });

    it('should support filtering by time periods', () => {
      // Should have time period filters
      cy.get('[data-testid="time-period-filter"]').should('be.visible');
      
      // Change to last 7 days
      cy.get('[data-testid="time-period-7days"]').click();
      
      // Should update all sections with new data
      cy.wait('@getComprehensiveAnalytics');
      cy.get('[data-testid="learning-overview-section"]').should('be.visible');
    });

    it('should allow exporting analytics data', () => {
      // Should have export button
      cy.get('[data-testid="export-analytics-button"]').should('be.visible');
      
      // Click export
      cy.get('[data-testid="export-analytics-button"]').click();
      
      // Should show export options
      cy.get('[data-testid="export-options-modal"]').should('be.visible');
      cy.get('[data-testid="export-pdf-option"]').should('be.visible');
      cy.get('[data-testid="export-csv-option"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/analytics/comprehensive*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getAnalyticsError');
      
      cy.visit('/analytics');
      cy.wait('@getAnalyticsError');
      
      // Should display error message
      cy.get('[data-testid="analytics-error"]').should('be.visible');
      cy.get('[data-testid="analytics-error"]').should('contain', 'Failed to load analytics data');
      
      // Should show retry button
      cy.get('[data-testid="retry-analytics-button"]').should('be.visible');
    });

    it('should handle empty data states', () => {
      // Mock empty analytics data
      cy.intercept('GET', '/api/analytics/comprehensive*', {
        statusCode: 200,
        body: {
          overview: { detailedMetrics: { basic: { totalActivities: 0 } } },
          subjectBreakdown: [],
          topicMastery: [],
          skillVisualization: { subjectProficiencies: [] },
          timeSeriesData: [],
          comparativeAnalysis: { periodComparison: {} }
        }
      }).as('getEmptyAnalytics');
      
      cy.visit('/analytics');
      cy.wait('@getEmptyAnalytics');
      
      // Should display empty state messages
      cy.get('[data-testid="no-data-message"]').should('be.visible');
      cy.get('[data-testid="no-data-message"]').should('contain', 'No learning data available yet');
      
      // Should suggest creating study plans
      cy.get('[data-testid="create-study-plan-suggestion"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should adapt layout for mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      
      // Cards should stack vertically on mobile
      cy.get('[data-testid="subject-performance-section"]').should('have.css', 'flex-direction', 'column');
      
      // Charts should be responsive
      cy.get('[data-testid="skill-radar-chart"]').should('be.visible');
      cy.get('[data-testid="progress-timeline-chart"]').should('be.visible');
    });

    it('should work well on tablet screens', () => {
      cy.viewport(768, 1024); // iPad
      
      // Should use appropriate grid layout
      cy.get('[data-testid="analytics-grid"]').should('have.css', 'grid-template-columns');
      
      // All sections should be visible
      cy.get('[data-testid="learning-overview-section"]').should('be.visible');
      cy.get('[data-testid="subject-performance-section"]').should('be.visible');
      cy.get('[data-testid="skill-proficiency-section"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.wait('@getComprehensiveAnalytics');
    });

    it('should have proper heading structure', () => {
      // Should have main heading
      cy.get('h1').should('contain', 'Learning Analytics');
      
      // Should have section headings
      cy.get('h2').should('contain', 'Learning Overview');
      cy.get('h2').should('contain', 'Subject Performance');
      cy.get('h2').should('contain', 'Skill Proficiency');
    });

    it('should provide ARIA labels for charts and metrics', () => {
      // Charts should have proper ARIA labels
      cy.get('[data-testid="skill-radar-chart"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="progress-timeline-chart"]').should('have.attr', 'aria-label');
      
      // Progress bars should have proper ARIA attributes
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'role', 'progressbar');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuenow');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuemin');
      cy.get('[data-testid="proficiency-bar-math"]').should('have.attr', 'aria-valuemax');
    });

    it('should support keyboard navigation', () => {
      // Should be able to tab through interactive elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'time-period-filter');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'subject-card-math');
      
      // Should be able to activate with keyboard
      cy.focused().type('{enter}');
      cy.url().should('include', '/analytics/subject/math');
    });

    it('should announce data updates to screen readers', () => {
      // Should have live regions for dynamic content
      cy.get('[data-testid="analytics-live-region"]').should('have.attr', 'aria-live', 'polite');
      
      // Change time period and check announcement
      cy.get('[data-testid="time-period-7days"]').click();
      cy.wait('@getComprehensiveAnalytics');
      
      cy.get('[data-testid="analytics-live-region"]').should('contain', 'Analytics updated for last 7 days');
    });
  });
});