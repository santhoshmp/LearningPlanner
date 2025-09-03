# Technology Stack & Build System

## Architecture
- **Type**: Full-stack web application with microservices architecture
- **Deployment**: Docker containerized with Docker Compose orchestration
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and rate limiting
- **Reverse Proxy**: Nginx for load balancing and SSL termination

## Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Prisma with PostgreSQL
- **Authentication**: JWT with refresh tokens, Passport.js for OAuth
- **AI Integration**: Anthropic Claude API, Google Gemini API
- **Email**: SendGrid for transactional emails
- **File Upload**: Multer with Sharp for image processing
- **Security**: Helmet, bcrypt, rate limiting, input validation with Zod/Joi
- **Logging**: Winston with daily rotate file
- **Testing**: Jest with Supertest for integration tests

## Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) with Emotion styling
- **Styling**: Tailwind CSS + MUI theme system
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Charts**: Recharts for analytics visualization
- **Animation**: Framer Motion
- **Testing**: Jest + React Testing Library, Cypress for E2E
- **Accessibility**: Built-in a11y testing with axe-core
- **Storybook**: Component documentation and visual testing

## Development Commands

### Backend
```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Compile TypeScript to JavaScript
npm run start           # Start production server
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio GUI
npm run db:setup        # Initialize database with migrations
```

### Frontend
```bash
# Development
npm run dev             # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm test               # Run Jest unit tests
npm run test:watch     # Run tests in watch mode

# E2E Testing
npm run cypress:open    # Open Cypress GUI
npm run cypress:run     # Run Cypress tests headlessly
npm run test:e2e        # Run full E2E test suite

# Accessibility & Performance
npm run test:a11y       # Run accessibility tests
npm run test:responsive # Run responsive design tests
npm run analyze         # Analyze bundle size

# Storybook
npm run storybook       # Start Storybook dev server
npm run build-storybook # Build Storybook for production
npm run chromatic       # Run visual regression tests
```

### Docker Operations
```bash
# Development
docker-compose up -d              # Start all services
docker-compose logs -f backend    # View backend logs
docker-compose exec backend bash # Access backend container

# Production
docker-compose -f docker-compose.prod.yml up -d        # Deploy production
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Key Dependencies
- **AI APIs**: @anthropic-ai/sdk, @google/generative-ai
- **Authentication**: passport, passport-google-oauth20, passport-apple
- **Security**: helmet, bcrypt, rate-limiter-flexible
- **Validation**: zod (shared), joi (backend), @hookform/resolvers (frontend)
- **File Processing**: multer, sharp
- **Testing**: jest, cypress, @testing-library/react, supertest