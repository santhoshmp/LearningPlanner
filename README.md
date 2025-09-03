# AI Study Planner 🎓

A comprehensive educational platform designed for children and their parents, featuring AI-powered study plans, interactive learning activities, and robust parental controls to create a safe and effective learning environment.

## 🌟 Features

### For Parents
- **AI-Powered Study Plans** - Generate personalized learning paths using Claude (Anthropic) and Gemini AI
- **Comprehensive Analytics** - Detailed progress tracking and performance insights
- **Parental Controls** - Full oversight and control over content and interactions
- **Content Safety** - Advanced content monitoring and approval workflows
- **Multi-Child Management** - Manage multiple children's learning profiles

### For Children
- **Interactive Learning** - Engaging educational activities and content
- **Gamification** - Achievement system with badges, milestones, and streaks
- **Child-Safe Environment** - Age-appropriate content with safety ratings
- **Progress Tracking** - Visual progress indicators and celebration animations
- **Mobile Optimized** - Responsive design for tablets and mobile devices

### Technical Features
- **Social Authentication** - OAuth integration with Google, Apple, and Instagram
- **Real-time Updates** - Live progress tracking and notifications
- **Accessibility** - WCAG compliant with screen reader support
- **Performance Optimized** - Lazy loading and mobile battery optimization
- **Comprehensive Testing** - Unit, integration, and E2E test coverage

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management
- **AI Integration**: Anthropic Claude API, Google Gemini API
- **Authentication**: JWT with refresh tokens, Passport.js for OAuth
- **Security**: Helmet, bcrypt, rate limiting, input validation

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) with Emotion styling
- **Styling**: Tailwind CSS + MUI theme system
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library, Cypress for E2E

### Infrastructure
- **Containerization**: Docker with Docker Compose
- **Reverse Proxy**: Nginx for load balancing and SSL
- **Deployment**: Production-ready Docker configurations
- **Monitoring**: Comprehensive logging with Winston

## 📁 Project Structure

```
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── routes/    # API route definitions
│   │   ├── services/  # Business logic layer
│   │   ├── middleware/# Express middleware
│   │   ├── utils/     # Utility functions
│   │   └── types/     # TypeScript definitions
│   ├── prisma/        # Database schema and migrations
│   └── __tests__/     # Backend tests
├── frontend/          # React/Vite client application
│   ├── src/
│   │   ├── components/# React components by feature
│   │   ├── services/  # API client services
│   │   ├── hooks/     # Custom React hooks
│   │   ├── utils/     # Frontend utilities
│   │   └── types/     # TypeScript definitions
│   └── cypress/       # E2E tests
├── nginx/             # Nginx configuration
└── .kiro/             # AI assistant specifications
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Docker and Docker Compose (optional)

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/santhoshmp/LearningPlanner.git
cd LearningPlanner
```

2. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database and API keys

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

3. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Development Setup

#### Option 1: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

#### Option 2: Manual Setup
```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Database Setup
```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run db:seed
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
```

### Frontend Tests
```bash
cd frontend
npm test                # Unit tests
npm run test:e2e        # E2E tests with Cypress
npm run test:a11y       # Accessibility tests
```

### Full Test Suite
```bash
# Run comprehensive validation
npm run test:all
```

## 📊 Key Components

### AI Integration
- **Claude API**: Advanced natural language processing for study plan generation
- **Gemini API**: Content analysis and educational recommendations
- **Content Safety**: Automated content filtering and safety ratings

### Authentication System
- **Multi-role Support**: Parents and children with different access levels
- **Social Login**: Google, Apple, Instagram OAuth integration
- **Session Management**: Secure JWT tokens with refresh mechanism

### Analytics Dashboard
- **Progress Tracking**: Real-time learning progress visualization
- **Performance Metrics**: Detailed analytics for parents
- **Learning Insights**: AI-powered recommendations for improvement

### Child Safety Features
- **Content Filtering**: Age-appropriate content with safety ratings
- **Parental Approval**: Workflow for content and activity approval
- **Session Monitoring**: Real-time monitoring of child activities

## 🔧 Development Commands

### Backend
```bash
npm run dev              # Development server
npm run build           # Production build
npm run start           # Production server
npm test               # Run tests
npm run prisma:studio   # Database GUI
```

### Frontend
```bash
npm run dev             # Development server
npm run build          # Production build
npm run preview        # Preview build
npm run storybook      # Component documentation
```

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Ensure accessibility compliance
- Update documentation as needed

## 📝 API Documentation

The API documentation is available at:
- Development: `http://localhost:3001/api/docs`
- Production: See deployment documentation

Key API endpoints:
- `/api/auth` - Authentication and user management
- `/api/study-plans` - AI-powered study plan generation
- `/api/analytics` - Progress tracking and analytics
- `/api/content` - Educational content management

## 🔒 Security Features

- **Input Validation**: Comprehensive validation with Zod/Joi
- **Rate Limiting**: API rate limiting and DDoS protection
- **Content Safety**: Multi-layer content filtering
- **Secure Headers**: Helmet.js security headers
- **Session Security**: Secure JWT implementation

## 📱 Mobile Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimization**: Touch-friendly interfaces
- **Battery Optimization**: Efficient animations and lazy loading
- **Offline Support**: Progressive Web App features

## 🎯 Roadmap

- [ ] Advanced AI tutoring features
- [ ] Collaborative learning tools
- [ ] Extended language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic Claude** for AI-powered content generation
- **Google Gemini** for educational content analysis
- **Material-UI** for the component library
- **Prisma** for database management
- **The open-source community** for the amazing tools and libraries

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API documentation

---

**Built with ❤️ for better education**