-- Authentication Troubleshooting Script
-- Run this script to diagnose and fix authentication issues

-- Step 1: Check if required extensions are enabled
SELECT 'Checking extensions...' as step;

SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- If extensions are missing, enable them:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Check if user_profiles table exists and has correct structure
SELECT 'Checking user_profiles table...' as step;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if RLS is enabled and policies exist
SELECT 'Checking RLS policies...' as step;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Step 4: Check if triggers exist
SELECT 'Checking triggers...' as step;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- Step 5: Check existing admin user
SELECT 'Checking existing admin user...' as step;

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data,
  u.encrypted_password IS NOT NULL as has_password,
  up.name,
  up.role,
  up.is_active,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'admin@spa.com';

-- Step 6: Check all users in auth.users
SELECT 'All users in auth.users...' as step;

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Step 7: Check all user profiles
SELECT 'All user profiles...' as step;

SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Step 8: Test authentication functions
SELECT 'Testing authentication functions...' as step;

-- Test if we can query user profiles (this tests RLS)
SELECT 
  'RLS test - can query profiles' as test_name,
  COUNT(*) as profile_count
FROM user_profiles;

-- Step 9: Check for any error logs or issues
SELECT 'Checking for potential issues...' as step;

-- Check if there are any users without profiles
SELECT 
  'Users without profiles' as issue_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- Check if there are any profiles without users
SELECT 
  'Profiles without users' as issue_type,
  COUNT(*) as count
FROM user_profiles up
LEFT JOIN auth.users u ON up.id = u.id
WHERE u.id IS NULL;

-- Check for inactive users
SELECT 
  'Inactive user profiles' as issue_type,
  COUNT(*) as count
FROM user_profiles
WHERE is_active = false;
