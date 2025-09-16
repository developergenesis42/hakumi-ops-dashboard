# 🏖️ SPA Operations Dashboard

A comprehensive React-based dashboard for managing day-to-day operations at spa facilities, featuring real-time session tracking, therapist management, financial reporting, and complete workflow automation.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=SPA+Operations+Dashboard)

## ✨ Features

### 🎯 **Core Operations**
- **Roster Management** - Daily therapist scheduling and attendance tracking
- **Session Management** - Complete session lifecycle from creation to completion
- **Real-time Dashboard** - Live updates of therapist status, room availability, and financial metrics
- **Walk-out Tracking** - Customer no-show and walk-out management with reason tracking
- **Financial Reporting** - Comprehensive revenue, payout, and expense calculations

### 💼 **Business Features**
- **Multi-therapist Sessions** - Support for single, double, and couple sessions
- **Dynamic Pricing** - Service packages with configurable pricing and payouts
- **Discount Management** - Flexible discount application with validation
- **Expense Tracking** - Individual therapist expense management
- **Receipt Generation** - Automated receipt printing and reprinting
- **Data Export** - CSV export for financial and attendance data

### 🛡️ **Security & Reliability**
- **Authentication** - Secure login with Supabase Auth integration
- **CSRF Protection** - Built-in CSRF token management
- **Data Persistence** - Local storage with Supabase backend sync
- **Error Handling** - Comprehensive error boundaries and recovery
- **Undo Functionality** - Action reversal with database impact warnings

### 📱 **User Experience**
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Accessibility** - WCAG compliant with keyboard navigation
- **Dark Theme** - Professional terminal-inspired interface
- **Real-time Updates** - Live data synchronization across sessions
- **Performance Monitoring** - Web Vitals tracking and optimization

## 🚀 Quick Start

**For detailed setup instructions, see the [Complete Setup Guide](docs/SETUP.md)**

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Modern web browser

### Quick Setup
```bash
# Clone and install
git clone <repository-url>
cd spa-ops-dashboard-dev
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development
npm run dev
# Open http://localhost:5173
# Login: admin@spa.com / test123
```

**Next Steps**: Follow the [Complete Setup Guide](docs/SETUP.md) for database configuration and production deployment.

## 📋 System Requirements

### **Development**
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Production**
- Node.js 18+ with npm
- Supabase PostgreSQL database
- Web server (nginx, Apache, or CDN)
- HTTPS certificate (recommended)

### **Browser Support**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🏗️ Architecture

### **Frontend Stack**
- **React 19** - UI framework with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend-as-a-Service integration

### **Key Components**
```
src/
├── components/          # UI components
│   ├── auth/           # Authentication components
│   ├── session/        # Session management
│   ├── roster/         # Roster management
│   └── ui/             # Reusable UI elements
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── context/            # React context providers
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

### **Data Flow**
1. **Authentication** → Supabase Auth
2. **Data Management** → Local state + Supabase sync
3. **Real-time Updates** → WebSocket connections
4. **Persistence** → LocalStorage + Database backup

## 📚 Documentation

### **Setup & Configuration**
- [🚀 Quick Start Guide](docs/SETUP.md) - Get up and running quickly
- [🗄️ Database Setup](database/README.md) - Complete database configuration
- [🖨️ PrintNode Setup](docs/PRINTNODE_SETUP.md) - Receipt printing integration

### **Development**
- [🏗️ Architecture Guide](docs/ARCHITECTURE.md) - System design and patterns
- [🧪 Testing Guide](docs/TESTING.md) - Testing strategies and E2E tests
- [📝 API Documentation](docs/API.md) - Services, hooks, and data structures
- [🎨 Component Documentation](docs/COMPONENTS.md) - Component library and usage

### **User Guides**
- [👥 User Manual](docs/USER_GUIDE.md) - Complete user workflow guide
- [❓ FAQ](docs/FAQ.md) - Frequently asked questions and troubleshooting

### **Deployment & Operations**
- [🚀 Production Deployment](docs/DEPLOYMENT.md) - Production setup guide
- [📝 Development Guide](docs/DEVELOPMENT.md) - Coding standards and contribution guidelines
- [📊 Changelog](docs/CHANGELOG.md) - Version history and breaking changes

## 🧪 Testing

### **Test Coverage**
- **Unit Tests** - Jest + React Testing Library
- **E2E Tests** - Playwright with comprehensive workflow coverage
- **Integration Tests** - API and database integration
- **Performance Tests** - Web Vitals and load testing

### **Running Tests**
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage

# All tests
npm run test:all
```

### **Test Suites**
- **Authentication** - Login, logout, session management
- **Roster Management** - Therapist scheduling and validation
- **Session Workflows** - Complete session lifecycle
- **Financial Operations** - Revenue, payouts, and expenses
- **Error Handling** - Network failures and edge cases
- **Performance** - Load times and accessibility

## 📊 Performance

### **Metrics**
- **First Contentful Paint** < 2.5s
- **Largest Contentful Paint** < 4.0s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 5.0s

### **Optimizations**
- **Code Splitting** - Route-based lazy loading
- **Image Optimization** - WebP format with fallbacks
- **Bundle Analysis** - Tree shaking and minification
- **Caching** - Service worker and HTTP caching

## 🔒 Security

### **Authentication**
- **Supabase Auth** - Secure JWT-based authentication
- **CSRF Protection** - Built-in CSRF token validation
- **Session Management** - Automatic session refresh and expiration

### **Data Protection**
- **Row Level Security** - Database-level access control
- **Input Validation** - Client and server-side validation
- **XSS Protection** - Content Security Policy headers
- **HTTPS** - Encrypted data transmission

## 🚀 Deployment

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Production**
```bash
npm run build        # Create production build
npm run preview      # Test production build locally
# Deploy dist/ folder to your hosting provider
```

### **Environment Variables**
```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
VITE_APP_ENV=production
VITE_SENTRY_DSN=your_sentry_dsn
```

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### **Code Standards**
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting (if configured)
- **Conventional Commits** - Standardized commit messages

### **Testing Requirements**
- All new features must include tests
- E2E tests for user workflows
- Unit tests for business logic
- Performance tests for critical paths

## 📈 Roadmap

### **Current Version** (v1.0.0)
- ✅ Core spa operations management
- ✅ Real-time dashboard
- ✅ Financial reporting
- ✅ Multi-platform support

### **Upcoming Features**
- 🔄 **Advanced Analytics** - Detailed reporting and insights
- 🔄 **Mobile App** - Native mobile application
- 🔄 **Multi-location Support** - Chain management features
- 🔄 **API Integration** - Third-party service integrations
- 🔄 **Advanced Scheduling** - Automated scheduling algorithms

## 🆘 Support

### **Documentation**
- Check the [docs/](docs/) directory for detailed guides
- Review [FAQ](docs/FAQ.md) for common questions
- See [Troubleshooting](docs/TROUBLESHOOTING.md) for issues

### **Getting Help**
- **Issues** - Report bugs via GitHub Issues
- **Discussions** - Ask questions in GitHub Discussions
- **Email** - Contact support team

### **Common Issues**
- **Authentication Problems** - See [Authentication Troubleshooting](docs/AUTHENTICATION_TROUBLESHOOTING.md)
- **Database Issues** - Check [Database Setup](database/README.md)
- **Build Problems** - Verify Node.js and npm versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure and authentication
- **React Team** - Frontend framework
- **Tailwind CSS** - Styling framework
- **Playwright** - E2E testing framework
- **Vite** - Build tool and development server

---

**Built with ❤️ for spa operations management**

*For detailed setup instructions, see the [Setup Guide](docs/SETUP.md)*