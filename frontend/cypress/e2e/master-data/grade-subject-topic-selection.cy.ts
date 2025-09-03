describe('Master Data Integration - Grade, Subject, and Topic Selection', () => {
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

    // Mock master data API calls
    cy.intercept('GET', '/api/master-data/grades', {
      statusCode: 200,
      body: [
        {
          id: 'grade-k',
          grade: 'K',
          displayName: 'Kindergarten',
          ageMin: 5,
          ageMax: 6,
          ageTypical: 5,
          educationalLevel: 'elementary',
          isActive: true
        },
        {
          id: 'grade-1',
          grade: '1',
          displayName: 'Grade 1',
          ageMin: 6,
          ageMax: 7,
          ageTypical: 6,
          educationalLevel: 'elementary',
          isActive: true
        },
        {
          id: 'grade-3',
          grade: '3',
          displayName: 'Grade 3',
          ageMin: 8,
          ageMax: 9,
          ageTypical: 8,
          educationalLevel: 'elementary',
          isActive: true
        }
      ]
    }).as('getGrades');

    cy.intercept('GET', '/api/master-data/subjects?grade=3', {
      statusCode: 200,
      body: [
        {
          id: 'subject-math',
          name: 'math',
          displayName: 'Mathematics',
          description: 'Mathematical concepts and problem solving',
          icon: '🔢',
          color: '#2196F3',
          category: 'core',
          isCore: true,
          sortOrder: 1
        },
        {
          id: 'subject-science',
          name: 'science',
          displayName: 'Science',
          description: 'Scientific exploration and discovery',
          icon: '🔬',
          color: '#4CAF50',
          category: 'core',
          isCore: true,
          sortOrder: 2
        },
        {
          id: 'subject-art',
          name: 'art',
          displayName: 'Art',
          description: 'Creative expression and artistic skills',
          icon: '🎨',
          color: '#FF9800',
          category: 'elective',
          isCore: false,
          sortOrder: 3
        }
      ]
    }).as('getSubjectsByGrade');

    cy.intercept('GET', '/api/master-data/topics?grade=3&subject=subject-math', {
      statusCode: 200,
      body: [
        {
          id: 'topic-addition',
          name: 'addition',
          displayName: 'Basic Addition',
          description: 'Learn to add numbers',
          difficulty: 'beginner',
          estimatedHours: 2,
          prerequisites: [],
          learningObjectives: ['Add single digits', 'Add double digits'],
          skills: ['arithmetic', 'number-sense'],
          isActive: true
        },
        {
          id: 'topic-subtraction',
          name: 'subtraction',
          displayName: 'Basic Subtraction',
          description: 'Learn to subtract numbers',
          difficulty: 'beginner',
          estimatedHours: 2,
          prerequisites: ['addition'],
          learningObjectives: ['Subtract single digits', 'Subtract double digits'],
          skills: ['arithmetic', 'number-sense'],
          isActive: true
        },
        {
          id: 'topic-multiplication',
          name: 'multiplication',
          displayName: 'Multiplication Tables',
          description: 'Learn multiplication tables',
          difficulty: 'intermediate',
          estimatedHours: 4,
          prerequisites: ['addition'],
          learningObjectives: ['Memorize times tables', 'Understand multiplication concept'],
          skills: ['arithmetic', 'memorization', 'pattern-recognition'],
          isActive: true
        }
      ]
    }).as('getTopicsBySubject');

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

    // Mock study plan creation
    cy.intercept('POST', '/api/study-plans', {
      statusCode: 201,
      body: {
        id: 'plan-123',
        title: 'Math Study Plan',
        description: 'Comprehensive math learning plan',
        childId: 'child-123',
        subject: 'math',
        gradeLevel: '3',
        selectedTopics: ['topic-addition', 'topic-subtraction'],
        estimatedDuration: 4,
        isActive: true
      }
    }).as('createStudyPlan');

    // Login and navigate to study plan creation
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('parent@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.wait('@login');
    cy.url().should('include', '/dashboard');
    
    // Navigate to study plan creation
    cy.get('[data-testid="create-study-plan-button"]').click();
    cy.url().should('include', '/study-plans/create');
  });

  describe('Grade Selection Workflow', () => {
    it('should load and display available grades', () => {
      cy.wait('@getGrades');
      
      // Grade selector should be visible
      cy.get('[data-testid="grade-selector"]').should('be.visible');
      
      // Click to open grade dropdown
      cy.get('[data-testid="grade-selector"]').click();
      
      // Should display all available grades
      cy.get('[data-testid="grade-option-K"]').should('contain', 'Kindergarten');
      cy.get('[data-testid="grade-option-1"]').should('contain', 'Grade 1');
      cy.get('[data-testid="grade-option-3"]').should('contain', 'Grade 3');
    });

    it('should show age ranges when enabled', () => {
      cy.wait('@getGrades');
      
      // Enable age range display
      cy.get('[data-testid="show-age-range-toggle"]').click();
      
      // Open grade dropdown
      cy.get('[data-testid="grade-selector"]').click();
      
      // Should display age ranges
      cy.get('[data-testid="grade-option-K"]').should('contain', 'Ages 5-6');
      cy.get('[data-testid="grade-option-3"]').should('contain', 'Ages 8-9');
    });

    it('should select grade and trigger subject loading', () => {
      cy.wait('@getGrades');
      
      // Select Grade 3
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      
      // Should trigger subjects API call
      cy.wait('@getSubjectsByGrade');
      
      // Subject selector should become enabled
      cy.get('[data-testid="subject-selector"]').should('not.be.disabled');
    });

    it('should handle grade selection errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '/api/master-data/grades', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getGradesError');
      
      cy.visit('/study-plans/create');
      cy.wait('@getGradesError');
      
      // Should display error message
      cy.get('[data-testid="grade-selector-error"]')
        .should('be.visible')
        .and('contain', 'Failed to load grade levels');
      
      // Should show retry option
      cy.get('[data-testid="retry-grades-button"]').should('be.visible');
    });
  });

  describe('Subject Selection Workflow', () => {
    beforeEach(() => {
      // Pre-select Grade 3
      cy.wait('@getGrades');
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      cy.wait('@getSubjectsByGrade');
    });

    it('should display subjects for selected grade', () => {
      // Subject selector should be enabled
      cy.get('[data-testid="subject-selector"]').should('not.be.disabled');
      
      // Open subject dropdown
      cy.get('[data-testid="subject-selector"]').click();
      
      // Should display grade-appropriate subjects
      cy.get('[data-testid="subject-option-math"]').should('contain', 'Mathematics');
      cy.get('[data-testid="subject-option-science"]').should('contain', 'Science');
      cy.get('[data-testid="subject-option-art"]').should('contain', 'Art');
    });

    it('should show subject icons and colors', () => {
      cy.get('[data-testid="subject-selector"]').click();
      
      // Should display subject icons
      cy.get('[data-testid="subject-option-math"]').should('contain', '🔢');
      cy.get('[data-testid="subject-option-science"]').should('contain', '🔬');
      cy.get('[data-testid="subject-option-art"]').should('contain', '🎨');
      
      // Should display core subject indicators
      cy.get('[data-testid="subject-option-math"]').should('contain', 'Core');
      cy.get('[data-testid="subject-option-science"]').should('contain', 'Core');
      cy.get('[data-testid="subject-option-art"]').should('not.contain', 'Core');
    });

    it('should filter to core subjects only when enabled', () => {
      // Enable core subjects only filter
      cy.get('[data-testid="core-subjects-only-toggle"]').click();
      
      // Open subject dropdown
      cy.get('[data-testid="subject-selector"]').click();
      
      // Should only show core subjects
      cy.get('[data-testid="subject-option-math"]').should('be.visible');
      cy.get('[data-testid="subject-option-science"]').should('be.visible');
      cy.get('[data-testid="subject-option-art"]').should('not.exist');
    });

    it('should select subject and trigger topic loading', () => {
      // Select Mathematics
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      
      // Should trigger topics API call
      cy.wait('@getTopicsBySubject');
      
      // Topic selector should become visible
      cy.get('[data-testid="topic-selector"]').should('be.visible');
    });

    it('should support multiple subject selection', () => {
      // Enable multiple selection
      cy.get('[data-testid="multiple-subjects-toggle"]').click();
      
      // Select multiple subjects
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.get('[data-testid="subject-option-science"]').click();
      
      // Should display selection count
      cy.get('[data-testid="subject-selector"]').should('contain', '2 subjects selected');
    });
  });

  describe('Topic Selection Workflow', () => {
    beforeEach(() => {
      // Pre-select Grade 3 and Math
      cy.wait('@getGrades');
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      cy.wait('@getSubjectsByGrade');
      
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.wait('@getTopicsBySubject');
    });

    it('should display topics for selected grade and subject', () => {
      // Topic selector should be visible
      cy.get('[data-testid="topic-selector"]').should('be.visible');
      
      // Should display topic selection header
      cy.get('[data-testid="topic-selection-header"]').should('contain', 'Select Topics');
      
      // Should display available topics
      cy.get('[data-testid="topic-addition"]').should('contain', 'Basic Addition');
      cy.get('[data-testid="topic-subtraction"]').should('contain', 'Basic Subtraction');
      cy.get('[data-testid="topic-multiplication"]').should('contain', 'Multiplication Tables');
    });

    it('should show topic difficulty levels and estimated hours', () => {
      // Should display difficulty indicators
      cy.get('[data-testid="topic-addition"]').should('contain', '🟢 beginner');
      cy.get('[data-testid="topic-multiplication"]').should('contain', '🟡 intermediate');
      
      // Should display estimated hours
      cy.get('[data-testid="topic-addition"]').should('contain', '2h');
      cy.get('[data-testid="topic-multiplication"]').should('contain', '4h');
    });

    it('should show learning objectives and skills', () => {
      // Should display learning objectives
      cy.get('[data-testid="topic-addition"]').should('contain', 'Add single digits');
      cy.get('[data-testid="topic-addition"]').should('contain', 'Add double digits');
      
      // Should display skills
      cy.get('[data-testid="topic-addition"]').should('contain', 'arithmetic');
      cy.get('[data-testid="topic-addition"]').should('contain', 'number-sense');
    });

    it('should allow topic selection and show progress', () => {
      // Initially no topics selected
      cy.get('[data-testid="selection-count"]').should('contain', '0/3 selected');
      
      // Select first topic
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      
      // Should update selection count
      cy.get('[data-testid="selection-count"]').should('contain', '1/3 selected');
      
      // Should update progress bar
      cy.get('[data-testid="selection-progress"]').should('have.attr', 'aria-valuenow', '33');
      
      // Select second topic
      cy.get('[data-testid="topic-subtraction-checkbox"]').click();
      
      // Should update counts
      cy.get('[data-testid="selection-count"]').should('contain', '2/3 selected');
      cy.get('[data-testid="selection-progress"]').should('have.attr', 'aria-valuenow', '67');
    });

    it('should show selected topics summary', () => {
      // Select topics
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="topic-subtraction-checkbox"]').click();
      
      // Should display selected topics summary
      cy.get('[data-testid="selected-topics-summary"]').should('be.visible');
      cy.get('[data-testid="selected-topics-summary"]').should('contain', 'Selected Topics (2)');
      
      // Should show selected topic chips
      cy.get('[data-testid="selected-topic-chip-addition"]').should('contain', 'Basic Addition');
      cy.get('[data-testid="selected-topic-chip-subtraction"]').should('contain', 'Basic Subtraction');
    });

    it('should allow removing topics from selection', () => {
      // Select topics
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="topic-subtraction-checkbox"]').click();
      
      // Remove topic from summary
      cy.get('[data-testid="selected-topic-chip-addition"] [data-testid="remove-topic"]').click();
      
      // Should update selection
      cy.get('[data-testid="selection-count"]').should('contain', '1/3 selected');
      cy.get('[data-testid="topic-addition-checkbox"]').should('not.be.checked');
      cy.get('[data-testid="selected-topic-chip-addition"]').should('not.exist');
    });

    it('should support select all functionality', () => {
      // Click select all
      cy.get('[data-testid="select-all-button"]').click();
      
      // Should select all topics
      cy.get('[data-testid="selection-count"]').should('contain', '3/3 selected');
      cy.get('[data-testid="topic-addition-checkbox"]').should('be.checked');
      cy.get('[data-testid="topic-subtraction-checkbox"]').should('be.checked');
      cy.get('[data-testid="topic-multiplication-checkbox"]').should('be.checked');
      
      // Button should change to deselect all
      cy.get('[data-testid="select-all-button"]').should('contain', 'Deselect All');
    });

    it('should group topics by difficulty when enabled', () => {
      // Enable grouping by difficulty
      cy.get('[data-testid="group-by-difficulty-toggle"]').click();
      
      // Should display difficulty groups
      cy.get('[data-testid="beginner-topics-group"]').should('be.visible');
      cy.get('[data-testid="intermediate-topics-group"]').should('be.visible');
      
      // Should show group progress
      cy.get('[data-testid="beginner-topics-group"]').should('contain', '0/2 selected');
      cy.get('[data-testid="intermediate-topics-group"]').should('contain', '0/1 selected');
    });

    it('should enforce maximum selection limits', () => {
      // Set max selections to 2
      cy.get('[data-testid="max-selections-input"]').clear().type('2');
      
      // Select two topics
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="topic-subtraction-checkbox"]').click();
      
      // Third topic should be disabled
      cy.get('[data-testid="topic-multiplication-checkbox"]').should('be.disabled');
      
      // Should show max limit indicator
      cy.get('[data-testid="max-limit-indicator"]').should('contain', 'Max: 2');
    });
  });

  describe('Complete Study Plan Creation Workflow', () => {
    it('should create study plan with selected master data', () => {
      // Complete the full workflow
      cy.wait('@getGrades');
      
      // Select grade
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      cy.wait('@getSubjectsByGrade');
      
      // Select subject
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.wait('@getTopicsBySubject');
      
      // Select topics
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="topic-subtraction-checkbox"]').click();
      
      // Fill in study plan details
      cy.get('[data-testid="plan-title-input"]').type('Math Study Plan');
      cy.get('[data-testid="plan-description-input"]').type('Comprehensive math learning plan');
      
      // Select child
      cy.get('[data-testid="child-selector"]').click();
      cy.get('[data-testid="child-option-123"]').click();
      
      // Submit study plan
      cy.get('[data-testid="create-plan-button"]').click();
      
      // Should call create API with correct data
      cy.wait('@createStudyPlan').then((interception) => {
        expect(interception.request.body).to.deep.include({
          title: 'Math Study Plan',
          description: 'Comprehensive math learning plan',
          childId: 'child-123',
          subject: 'math',
          gradeLevel: '3',
          selectedTopics: ['topic-addition', 'topic-subtraction']
        });
      });
      
      // Should redirect to study plan details
      cy.url().should('include', '/study-plans/plan-123');
      
      // Should show success message
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .and('contain', 'Study plan created successfully');
    });

    it('should validate required fields before submission', () => {
      // Try to submit without required fields
      cy.get('[data-testid="create-plan-button"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="grade-error"]').should('contain', 'Grade is required');
      cy.get('[data-testid="subject-error"]').should('contain', 'Subject is required');
      cy.get('[data-testid="topics-error"]').should('contain', 'At least one topic is required');
      cy.get('[data-testid="child-error"]').should('contain', 'Child is required');
      
      // Should not submit
      cy.get('@createStudyPlan').should('not.have.been.called');
    });

    it('should handle API errors during study plan creation', () => {
      // Mock API error
      cy.intercept('POST', '/api/study-plans', {
        statusCode: 400,
        body: { error: 'Invalid study plan data' }
      }).as('createStudyPlanError');
      
      // Complete form
      cy.wait('@getGrades');
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      cy.wait('@getSubjectsByGrade');
      
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.wait('@getTopicsBySubject');
      
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="plan-title-input"]').type('Test Plan');
      cy.get('[data-testid="child-selector"]').click();
      cy.get('[data-testid="child-option-123"]').click();
      
      // Submit and handle error
      cy.get('[data-testid="create-plan-button"]').click();
      cy.wait('@createStudyPlanError');
      
      // Should show error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Failed to create study plan');
      
      // Should allow retry
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Responsive Behavior', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport(375, 667); // iPhone SE
      
      // All selectors should be accessible
      cy.wait('@getGrades');
      cy.get('[data-testid="grade-selector"]').should('be.visible');
      
      // Dropdowns should work on mobile
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').should('be.visible').click();
      cy.wait('@getSubjectsByGrade');
      
      // Topic selection should be usable on mobile
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.wait('@getTopicsBySubject');
      
      // Topic checkboxes should be touch-friendly
      cy.get('[data-testid="topic-addition-checkbox"]').click();
      cy.get('[data-testid="topic-addition-checkbox"]').should('be.checked');
    });

    it('should adapt layout for tablet screens', () => {
      cy.viewport(768, 1024); // iPad
      
      // Layout should adapt for tablet
      cy.get('[data-testid="form-container"]').should('have.css', 'max-width');
      
      // Topic selection should use appropriate layout
      cy.wait('@getGrades');
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      cy.wait('@getSubjectsByGrade');
      
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      cy.wait('@getTopicsBySubject');
      
      // Topics should be displayed in appropriate grid
      cy.get('[data-testid="topics-grid"]').should('have.css', 'grid-template-columns');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.wait('@getGrades');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'grade-selector');
      
      // Use keyboard to open dropdown
      cy.focused().type('{enter}');
      cy.get('[data-testid="grade-option-3"]').should('be.visible');
      
      // Navigate with arrow keys
      cy.focused().type('{downarrow}');
      cy.focused().type('{enter}');
      
      cy.wait('@getSubjectsByGrade');
      
      // Continue tabbing to next field
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'subject-selector');
    });

    it('should have proper ARIA labels and descriptions', () => {
      cy.wait('@getGrades');
      
      // Check ARIA labels
      cy.get('[data-testid="grade-selector"]').should('have.attr', 'aria-label', 'Select grade level');
      cy.get('[data-testid="subject-selector"]').should('have.attr', 'aria-label', 'Select subject');
      
      // Check form validation ARIA
      cy.get('[data-testid="create-plan-button"]').click();
      cy.get('[data-testid="grade-selector"]').should('have.attr', 'aria-invalid', 'true');
      cy.get('[data-testid="grade-selector"]').should('have.attr', 'aria-describedby');
    });

    it('should announce selection changes to screen readers', () => {
      cy.wait('@getGrades');
      
      // Select grade and check announcements
      cy.get('[data-testid="grade-selector"]').click();
      cy.get('[data-testid="grade-option-3"]').click();
      
      // Should have live region updates
      cy.get('[data-testid="selection-announcements"]')
        .should('contain', 'Grade 3 selected')
        .and('have.attr', 'aria-live', 'polite');
      
      cy.wait('@getSubjectsByGrade');
      
      // Subject selection announcement
      cy.get('[data-testid="subject-selector"]').click();
      cy.get('[data-testid="subject-option-math"]').click();
      
      cy.get('[data-testid="selection-announcements"]')
        .should('contain', 'Mathematics selected');
    });
  });
});