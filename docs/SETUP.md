# 🚀 Setup Guide

Complete setup guide for the SPA Operations Dashboard, covering development, production, and deployment environments.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Database Configuration](#database-configuration)
- [Environment Configuration](#environment-configuration)
- [Production Setup](#production-setup)
- [Deployment Options](#deployment-options)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

**Operating System**
- macOS 10.15+ (Catalina or later)
- Windows 10+ (version 1903 or later)
- Linux (Ubuntu 18.04+, CentOS 7+, or equivalent)

**Software Requirements**
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** 2.30.0 or higher
- **Modern Web Browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Development Tools** (Optional but recommended)
- **VS Code** with recommended extensions
- **Postman** for API testing
- **Supabase CLI** for database management

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check Git version
git --version   # Should be 2.30.0 or higher
```

## 🛠️ Development Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd spa-ops-dashboard-dev

# Verify the project structure
ls -la
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Set Up Supabase

#### Option A: Using Supabase Dashboard (Recommended for beginners)

1. **Create a Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for a free account
   - Create a new project

2. **Get Your Project Credentials**
   - Go to Settings → API
   - Copy your Project URL and anon/public key

3. **Set Up the Database**
   - Go to the SQL Editor in your Supabase dashboard
   - Follow the [Database Setup Guide](../database/README.md)

#### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Start local Supabase (optional)
supabase start

# Link to your remote project
supabase link --project-ref your-project-ref
```

### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the environment file
nano .env.local  # or use your preferred editor
```

**Required Environment Variables**:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
VITE_APP_ENV=development
VITE_APP_NAME="SPA Operations Dashboard"

# Optional: Sentry Error Tracking
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Debug Configuration
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### 5. Set Up the Database

Follow the detailed [Database Setup Guide](../database/README.md) to:

1. **Run Core Schema Scripts**
   ```sql
   -- Run in Supabase SQL Editor in this order:
   -- 1. schema/supabase-schema.sql
   -- 2. schema/user-profiles-schema-safe.sql
   -- 3. schema/roster-persistence-schema-safe.sql
   ```

2. **Create Admin User**
   ```sql
   -- Run: admin/create-admin-user-safe.sql
   ```

3. **Verify Setup**
   ```sql
   -- Run: troubleshooting/troubleshoot-auth.sql
   ```

### 6. Start the Development Server

```bash
# Start the development server
npm run dev

# The application will be available at:
# http://localhost:5173
```

### 7. Verify the Setup

1. **Open the Application**
   - Navigate to http://localhost:5173
   - You should see the login screen

2. **Test Authentication**
   - Use the test credentials: `admin@spa.com` / `test123`
   - You should be redirected to the roster setup page

3. **Test Database Connection**
   - Try adding a therapist to the roster
   - Check if data persists after refresh

## 🗄️ Database Configuration

### Database Schema Overview

The application uses the following main tables:

- **therapists** - Therapist information and status
- **rooms** - Room availability and types
- **services** - Service packages and pricing
- **sessions** - Session records and history
- **walk_outs** - Walk-out and no-show tracking
- **daily_stats** - Daily summary statistics
- **user_profiles** - User authentication profiles
- **daily_rosters** - Daily roster persistence

### Database Setup Scripts

**Core Schema** (`database/schema/supabase-schema.sql`)
```sql
-- Creates main application tables
-- Includes RLS policies and triggers
-- Populates initial data
```

**User Profiles** (`database/schema/user-profiles-schema-safe.sql`)
```sql
-- Creates user authentication tables
-- Handles automatic profile creation
-- Manages sign-in tracking
```

**Roster Persistence** (`database/schema/roster-persistence-schema-safe.sql`)
```sql
-- Creates daily roster functionality
-- Handles roster state persistence
-- Includes roster management functions
```

### Database Functions

**Roster Management Functions**:
```sql
-- Get today's roster
SELECT get_today_roster();

-- Add therapist to roster
SELECT add_to_today_roster('therapist-id');

-- Remove therapist from roster
SELECT remove_from_today_roster('therapist-id');

-- Clear entire roster
SELECT clear_today_roster();
```

### Row Level Security (RLS)

All tables implement Row Level Security policies:

- **User Isolation** - Users can only access their own data
- **Admin Access** - Admins have full access to all data
- **Public Read Access** - Some tables allow public read access for basic data

## ⚙️ Environment Configuration

### Development Environment

**`.env.local`** (for local development):
```bash
# Supabase (Development)
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Application
VITE_APP_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# Optional
VITE_SENTRY_DSN=your_dev_sentry_dsn
```

### Production Environment

**`.env.production`** (for production builds):
```bash
# Supabase (Production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key

# Application
VITE_APP_ENV=production
VITE_DEBUG=false
VITE_LOG_LEVEL=error

# Monitoring
VITE_SENTRY_DSN=your_prod_sentry_dsn
```

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_APP_ENV` | ❌ | Application environment | `development`, `production` |
| `VITE_DEBUG` | ❌ | Enable debug mode | `true`, `false` |
| `VITE_LOG_LEVEL` | ❌ | Logging level | `debug`, `info`, `warn`, `error` |
| `VITE_SENTRY_DSN` | ❌ | Sentry error tracking | `https://abc123@sentry.io/123` |

## 🚀 Production Setup

### 1. Build the Application

```bash
# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Verify build
ls -la dist/
```

### 2. Test Production Build

```bash
# Preview production build locally
npm run preview

# Test at http://localhost:4173
```

### 3. Configure Production Database

1. **Set Up Production Supabase Project**
   - Create a new Supabase project for production
   - Run all database setup scripts
   - Create production admin user

2. **Configure RLS Policies**
   - Verify all RLS policies are properly configured
   - Test user isolation and admin access

3. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up performance monitoring
   - Enable database monitoring

### 4. Security Checklist

- [ ] **Environment Variables** - Use production credentials
- [ ] **Database Security** - RLS policies enabled
- [ ] **Authentication** - Strong admin passwords
- [ ] **HTTPS** - SSL certificate configured
- [ ] **CORS** - Proper CORS settings
- [ ] **Rate Limiting** - API rate limits configured

## 🌐 Deployment Options

### Option 1: Static Hosting (Recommended)

**Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Netlify**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables in Netlify dashboard
```

**GitHub Pages**:
```bash
# Build the project
npm run build

# Deploy to GitHub Pages
npx gh-pages -d dist
```

### Option 2: VPS/Dedicated Server

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/spa-dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://your-supabase-url.supabase.co;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Docker Deployment**:
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Container Orchestration

**Docker Compose**:
```yaml
version: '3.8'
services:
  spa-dashboard:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
```

## 🔧 Development Tools Setup

### VS Code Configuration

**Recommended Extensions**:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase",
    "ms-playwright.playwright"
  ]
}
```

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Git Configuration

**Pre-commit Hooks**:
```bash
# Install husky for git hooks
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

## 🧪 Testing Setup

### Unit Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### E2E Testing

```bash
# Install Playwright browsers
npm run test:e2e:install

# Run E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run specific test suites
npm run test:e2e:auth
npm run test:e2e:sessions
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Node.js Version Issues

**Problem**: `npm install` fails with version errors

**Solution**:
```bash
# Check Node.js version
node --version

# Install correct version using nvm
nvm install 18
nvm use 18

# Clear npm cache
npm cache clean --force
```

#### 2. Supabase Connection Issues

**Problem**: Application can't connect to Supabase

**Solutions**:
- Verify environment variables are correct
- Check Supabase project status
- Verify RLS policies are configured
- Test database connection manually

```bash
# Test Supabase connection
curl -X GET \
  "${VITE_SUPABASE_URL}/rest/v1/therapists" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}"
```

#### 3. Database Setup Issues

**Problem**: Database scripts fail to run

**Solutions**:
- Run scripts in the correct order
- Check for existing objects
- Use `-safe.sql` versions
- Run troubleshooting script

```sql
-- Run this to diagnose issues
\i database/troubleshooting/troubleshoot-auth.sql
```

#### 4. Build Issues

**Problem**: Production build fails

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Verify environment variables
echo $VITE_SUPABASE_URL
```

#### 5. Authentication Issues

**Problem**: Can't log in with test credentials

**Solutions**:
- Verify admin user exists in database
- Check user profile table
- Run admin user creation script
- Verify RLS policies

```sql
-- Check if admin user exists
SELECT * FROM auth.users WHERE email = 'admin@spa.com';

-- Check user profile
SELECT * FROM user_profiles WHERE email = 'admin@spa.com';
```

### Getting Help

1. **Check Documentation**
   - Review this setup guide
   - Check [API Documentation](API.md)
   - Review [Database README](../database/README.md)

2. **Run Diagnostic Scripts**
   ```sql
   -- Database diagnostics
   \i database/troubleshooting/troubleshoot-auth.sql
   ```

3. **Check Logs**
   - Browser console for client errors
   - Supabase logs for server errors
   - Application logs for runtime errors

4. **Community Support**
   - GitHub Issues for bug reports
   - GitHub Discussions for questions
   - Supabase Community for database issues

---

**Next Steps**: After completing the setup, check out the [User Guide](USER_GUIDE.md) to learn how to use the application effectively.
