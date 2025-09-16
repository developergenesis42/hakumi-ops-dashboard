# Authentication Troubleshooting Guide

## Issue: Cannot log in with admin@spa.com

This guide will help you resolve the authentication issues with the admin@spa.com account.

## 🔧 **Step-by-Step Solution**

### **Step 1: Set Up Environment Variables**

Create a `.env.local` file in your project root with the following content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Security Configuration
VITE_CSRF_PROTECTION=true
VITE_DEBUG_MODE=true
```

**To get your Supabase credentials:**
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Replace the placeholder values in `.env.local`

### **Step 2: Run Database Setup Scripts**

Execute these SQL scripts in your Supabase SQL Editor in the following order:

#### **2.1: Run the User Profiles Schema**
```sql
-- Copy and paste the contents of database/schema/user-profiles-schema-safe.sql
-- This sets up the user_profiles table and RLS policies
```

#### **2.2: Run the Troubleshooting Script**
```sql
-- Copy and paste the contents of database/troubleshooting/troubleshoot-auth.sql
-- This will diagnose any existing issues
```

#### **2.3: Create the Admin User**
```sql
-- Copy and paste the contents of database/admin/create-admin-user-safe.sql
-- This creates the admin@spa.com user with password: test123
```

### **Step 3: Verify the Setup**

After running the scripts, verify the setup by running this query in Supabase SQL Editor:

```sql
-- Verify admin user exists and is properly configured
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data,
  up.name,
  up.role,
  up.is_active,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'admin@spa.com';
```

**Expected Result:**
- User should exist in both `auth.users` and `user_profiles` tables
- `email_confirmed_at` should not be NULL
- `role` should be 'admin'
- `is_active` should be true

### **Step 4: Test the Authentication**

#### **4.1: Start the Development Server**
```bash
npm run dev
```

#### **4.2: Test Login**
1. Navigate to `http://localhost:5174`
2. Try logging in with:
   - **Email:** `admin@spa.com`
   - **Password:** `test123`

#### **4.3: Use the Debug Component (Optional)**
If login still fails, you can add the AuthDebugger component to help diagnose issues:

```tsx
// Add this to your main App component temporarily
import AuthDebugger from './components/auth/AuthDebugger';

// Add state for debugger
const [showDebugger, setShowDebugger] = useState(false);

// Add debug button
<button onClick={() => setShowDebugger(true)}>
  Debug Auth
</button>

// Add debugger component
<AuthDebugger 
  isOpen={showDebugger} 
  onClose={() => setShowDebugger(false)} 
/>
```

## 🚨 **Common Issues and Solutions**

### **Issue 1: "Missing Supabase environment variables"**
**Solution:** Ensure `.env.local` file exists with correct Supabase credentials.

### **Issue 2: "Invalid login credentials"**
**Possible Causes:**
- User doesn't exist in database
- Password hash is incorrect
- Email confirmation required

**Solutions:**
1. Run the `database/admin/create-admin-user-safe.sql` script
2. Check if `email_confirmed_at` is not NULL
3. Verify password is 'test123'

### **Issue 3: "Failed to fetch user profile"**
**Possible Causes:**
- User profile doesn't exist
- RLS policies blocking access
- Database connection issues

**Solutions:**
1. Run the `database/schema/user-profiles-schema-safe.sql` script
2. Check RLS policies are correctly set up
3. Verify database connection

### **Issue 4: "Access Denied" or RLS errors**
**Solution:** Ensure RLS policies allow the user to access their profile:

```sql
-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### **Issue 5: User exists but profile is missing**
**Solution:** Manually create the profile:

```sql
-- Get the user ID first
SELECT id FROM auth.users WHERE email = 'admin@spa.com';

-- Then create the profile (replace USER_ID with actual ID)
INSERT INTO user_profiles (
  id,
  email,
  name,
  role,
  created_at,
  updated_at,
  is_active
) VALUES (
  'USER_ID',
  'admin@spa.com',
  'Admin',
  'admin',
  NOW(),
  NOW(),
  true
);
```

## 🔍 **Debugging Steps**

### **1. Check Browser Console**
Look for any JavaScript errors or network failures.

### **2. Check Supabase Logs**
Go to Supabase Dashboard > Logs to see authentication events.

### **3. Test Database Connection**
Run this query to test basic connectivity:

```sql
SELECT 'Database connection test' as status, NOW() as timestamp;
```

### **4. Test User Profile Query**
```sql
SELECT COUNT(*) as profile_count FROM user_profiles;
```

### **5. Test Authentication Query**
```sql
SELECT COUNT(*) as user_count FROM auth.users;
```

## 📋 **Verification Checklist**

- [ ] `.env.local` file exists with correct Supabase credentials
- [ ] `user_profiles` table exists with correct schema
- [ ] RLS policies are enabled and configured
- [ ] Admin user exists in `auth.users` table
- [ ] Admin user profile exists in `user_profiles` table
- [ ] User's `email_confirmed_at` is not NULL
- [ ] User's `role` is set to 'admin'
- [ ] User's `is_active` is set to true
- [ ] Development server starts without errors
- [ ] Login form appears correctly
- [ ] Login with admin@spa.com and test123 works

## 🆘 **If All Else Fails**

### **Alternative: Create User via Supabase Dashboard**

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user"
3. Enter:
   - Email: `admin@spa.com`
   - Password: `test123`
   - Auto Confirm User: ✅ (checked)
4. Save the user
5. The user profile should be created automatically via the trigger

### **Alternative: Use Signup Form**

1. Go to the application
2. Click "Sign up"
3. Create a new admin account
4. Use that account instead

## 📞 **Getting Help**

If you're still having issues:

1. Check the browser console for errors
2. Check Supabase logs for authentication events
3. Run the troubleshooting SQL script and share the results
4. Verify all environment variables are correct
5. Ensure your Supabase project is properly configured

The authentication system should work once all these steps are completed correctly.
