---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Architecture
- **Full-stack TypeScript application** with Express.js backend and React frontend
- **PostgreSQL + Prisma ORM** for data persistence with comprehensive schema migrations
- **Docker containerization** with multi-environment support (dev/prod)
- **AI-powered educational platform** integrating Claude and Gemini APIs
- **Child-safe environment** with comprehensive content filtering and parental controls

## Backend Development Standards
- **TypeScript-first**: All new code must use TypeScript with strict mode
- **Layered architecture**: Routes → Services → Database (avoid business logic in routes)
- **Prisma ORM**: Use Prisma for all database operations, never raw SQL
- **Error handling**: Use centralized error handling with Winston logging
- **Security**: JWT with refresh tokens, rate limiting, input validation with Zod
- **Testing**: Jest for unit tests, Supertest for integration tests

### Backend File Patterns
- Services in `src/services/` handle business logic
- Routes in `src/routes/` handle HTTP requests only
- Middleware in `src/middleware/` for cross-cutting concerns
- Types in `src/types/` for shared TypeScript definitions
- Utils in `src/utils/` for pure helper functions

## Frontend Development Standards
- **React 18 + TypeScript**: Use functional components with hooks
- **MUI + Tailwind**: MUI for components, Tailwind for utility styling
- **Dual themes**: Separate parent/child themes with accessibility compliance
- **TanStack Query**: For all server state management (no Redux)
- **React Hook Form + Zod**: For form handling and validation
- **Component organization**: Group by feature, not by type

### Frontend File Patterns
- Components in `src/components/[feature]/` directories
- Hooks in `src/hooks/` for reusable logic
- Services in `src/services/` for API calls
- Types in `src/types/` for TypeScript definitions
- Utils in `src/utils/` for helper functions

## Database & Prisma Guidelines
- **Schema-first development**: Always update schema.prisma first
- **Migration workflow**: Generate migrations for all schema changes
- **Seeding**: Use seed.ts for development data, separate scripts for production
- **Indexing**: Add database indexes for performance-critical queries
- **Relations**: Use Prisma relations, avoid manual foreign key management

## AI Integration Patterns
- **Claude API**: Primary AI for study plan generation and content creation
- **Gemini API**: Secondary AI for content analysis and recommendations
- **Content safety**: All AI-generated content must pass safety validation
- **Rate limiting**: Implement proper rate limiting for AI API calls
- **Error handling**: Graceful degradation when AI services are unavailable

## Security & Child Safety Requirements
- **Content filtering**: All user-generated and AI content must be filtered
- **Parental controls**: Parents must approve all child interactions
- **Session management**: Secure JWT handling with refresh token rotation
- **Input validation**: Validate all inputs with Zod schemas
- **Logging**: Comprehensive security event logging

## Testing Requirements
- **Unit tests**: Required for all services and utilities
- **Integration tests**: Required for all API endpoints
- **E2E tests**: Required for critical user flows
- **Accessibility tests**: Required for all UI components
- **Visual regression**: Use Storybook + Chromatic for component testing

## Performance Standards
- **Database**: Use indexes, avoid N+1 queries, implement caching
- **Frontend**: Code splitting, lazy loading, optimized images
- **API**: Response caching, rate limiting, request optimization
- **Monitoring**: Performance metrics and error tracking

## Development Commands
```bash
# Backend
npm run dev              # Development with hot reload
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Database GUI
npm test                 # Run all tests

# Frontend  
npm run dev              # Vite dev server
npm run test:e2e         # Cypress E2E tests
npm run storybook        # Component documentation
npm run test:a11y        # Accessibility tests

# Docker
docker-compose up -d     # Start all services
docker-compose logs -f backend  # View logs
```

## Code Quality Standards
- **ESLint + Prettier**: Enforce consistent code formatting
- **TypeScript strict mode**: No any types, proper type definitions
- **Error boundaries**: Implement error boundaries for React components
- **Accessibility**: WCAG 2.1 AA compliance for all UI components
- **Documentation**: JSDoc comments for all public APIs