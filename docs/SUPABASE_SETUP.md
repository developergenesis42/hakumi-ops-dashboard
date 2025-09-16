# 🚀 Supabase Integration Setup Guide

This guide will help you set up Supabase for your SPA Operations Dashboard.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+ installed
3. **Git**: For version control

## 🛠️ Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `spa-ops-dashboard`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2. Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

### 3. Set Up Environment Variables

1. Create a `.env.local` file in your project root:
```bash
# Copy the example file
cp .env.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database/schema/supabase-schema.sql` from this project
3. Paste it into the SQL editor
4. Click **Run** to execute the schema

This will create:
- ✅ All necessary tables (therapists, rooms, services, sessions, walk_outs, daily_stats)
- ✅ Initial data (47 therapists, 9 rooms, 13 services)
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Triggers for automatic timestamps

### 5. Verify Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `therapists` (47 rows)
   - `rooms` (9 rows)
   - `services` (13 rows)
   - `sessions` (0 rows - will be populated during use)
   - `walk_outs` (0 rows - will be populated during use)
   - `daily_stats` (0 rows - will be populated during use)

### 6. Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:5173`
3. The app should now load data from Supabase instead of mock data
4. Check the browser console for any connection errors

## 🔧 Configuration Options

### Row Level Security (RLS)

The current setup allows public access to all tables. For production, you should:

1. **Enable Authentication**: Add user authentication
2. **Restrict Access**: Create proper RLS policies
3. **Use Service Role**: For server-side operations

### Real-time Features

The app includes real-time subscriptions for:
- ✅ Therapist status updates
- ✅ Session changes
- ✅ Room availability

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (production) | No |

## 🚨 Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env.local` file exists
   - Verify the variable names are correct
   - Restart your development server

2. **"Failed to connect to database"**
   - Verify your Supabase URL and key are correct
   - Check if your Supabase project is active
   - Ensure the database schema has been created

3. **"No data showing"**
   - Check if the initial data was inserted
   - Verify RLS policies allow access
   - Check browser console for errors

### Debug Mode

Add this to your `.env.local` for debugging:
```env
VITE_DEBUG_SUPABASE=true
```

## 📊 Database Schema Overview

### Tables Created

1. **therapists**: Staff management
2. **rooms**: Room availability and types
3. **services**: Service packages and pricing
4. **sessions**: Active and completed sessions
5. **walk_outs**: Customer departures
6. **daily_stats**: Daily performance metrics

### Key Features

- ✅ **UUID Primary Keys**: Secure, unique identifiers
- ✅ **Automatic Timestamps**: Created/updated timestamps
- ✅ **Data Validation**: Check constraints for data integrity
- ✅ **Performance Indexes**: Optimized queries
- ✅ **Real-time Updates**: Live data synchronization

## 🔄 Migration from Mock Data

The app will automatically:
1. **Load from Supabase**: Instead of mock data
2. **Sync Changes**: Real-time updates across sessions
3. **Persist Data**: All changes saved to database
4. **Maintain State**: Data persists between app restarts

## 🎉 Next Steps

After setup, you can:

1. **Customize Data**: Modify therapists, rooms, or services
2. **Add Authentication**: Implement user login system
3. **Deploy**: Deploy to production with environment variables
4. **Monitor**: Use Supabase dashboard to monitor usage
5. **Backup**: Set up automated backups in Supabase

## 📞 Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the browser console for errors
3. Verify your environment variables
4. Check the Supabase dashboard for project status

---

**🎯 You're all set!** Your SPA Operations Dashboard now has a robust, scalable database backend with real-time capabilities.
