# Project Structure & Organization

## Root Directory Structure

├── backend/           # Node.js/Express API server
├── frontend/          # React/Vite client application
├── nginx/             # Nginx reverse proxy configuration
├── .kiro/             # Kiro AI assistant configuration
├── docker-compose.yml # Development environment
├── docker-compose.prod.yml # Production environment
└── DEPLOYMENT.md      # Production deployment guide
```

## Backend Structure (`/backend`)
```
backend/
├── src/
│   ├── controllers/   # Request handlers (currently using routes directly)
│   ├── middleware/    # Express middleware (auth, validation, security)
│   ├── models/        # Data models (using Prisma schema)
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic layer
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions and helpers
│   └── index.ts       # Application entry point
├── prisma/
│   ├── migrations/    # Database migration files
│   ├── schema.prisma  # Database schema definition
│   └── seed.ts        # Database seeding script
├── __tests__/         # Integration tests
├── logs/              # Application logs (Winston)
├── uploads/           # File upload storage
└── scripts/           # Utility scripts (backups, etc.)
```

## Frontend Structure (`/frontend`)
```
frontend/
├── src/
│   ├── components/    # React components organized by feature
│   │   ├── analytics/ # Analytics dashboard components
│   │   ├── auth/      # Authentication components
│   │   ├── child/     # Child profile management
│   │   ├── content/   # Content management components
│   │   ├── layout/    # Layout and navigation components
│   │   ├── profile/   # User profile components
│   │   ├── settings/  # Settings management
│   │   └── studyPlan/ # Study plan components
│   ├── contexts/      # React context providers
│   ├── services/      # API client and external services
│   ├── theme/         # MUI theme configuration
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions and helpers
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── cypress/           # E2E test specifications
├── docs/              # Documentation files
├── scripts/           # Build and test scripts
├── .storybook/        # Storybook configuration
└── public/            # Static assets
```

## Key Architectural Patterns

### Backend Patterns
- **Layered Architecture**: Routes → Services → Database
- **Service Layer**: Business logic separated from route handlers
- **Middleware Pattern**: Authentication, validation, security, monitoring
- **Repository Pattern**: Prisma ORM abstracts database operations
- **Error Handling**: Centralized error handling with Winston logging

### Frontend Patterns
- **Feature-Based Organization**: Components grouped by business domain
- **Container/Presentational**: Smart containers with dumb components
- **Custom Hooks**: Reusable logic extraction
- **Context + Query**: Global state with React Context + TanStack Query
- **Theme System**: Dual themes (parent/child) with MUI + Tailwind

## File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfilePage.tsx`)
- **Services**: camelCase (e.g., `authService.ts`)
- **Types**: camelCase with `.types.ts` suffix
- **Tests**: Same name as file with `.test.ts` or `.spec.ts`
- **Utilities**: camelCase (e.g., `validation.ts`)

## Import/Export Patterns
- **Barrel Exports**: Use `index.ts` files for clean imports
- **Absolute Imports**: Backend uses path mapping (`@/services/*`)
- **Relative Imports**: Frontend uses `@/` alias for src directory
- **Type-Only Imports**: Use `import type` for TypeScript types

## Database Schema Organization
- **User Management**: Users, ChildProfiles, RefreshTokens
- **Learning Content**: StudyPlans, StudyActivities, StudyContent
- **Progress Tracking**: ProgressRecords, Achievements, ContentInteractions
- **Safety & Monitoring**: SecurityLogs, ConversationLogs, ParentalApprovalRequests
- **Settings**: UserSettings, ChildSettings
- **Analytics**: AiUsage, PerformanceMetrics, ErrorLogs

## Testing Structure
- **Unit Tests**: Co-located with source files in `__tests__/` folders
- **Integration Tests**: Backend integration tests in `src/__tests__/integration/`
- **E2E Tests**: Cypress tests organized by user flow in `cypress/e2e/`
- **Component Tests**: React component tests alongside components
- **Accessibility Tests**: Automated a11y testing with axe-core

## Configuration Management
- **Environment Variables**: `.env` files for different environments
- **TypeScript Config**: Separate configs for frontend/backend
- **Build Config**: Vite config for frontend, Docker for deployment
- **Linting**: ESLint configs for consistent code style
- **Database**: Prisma schema as single source of truth