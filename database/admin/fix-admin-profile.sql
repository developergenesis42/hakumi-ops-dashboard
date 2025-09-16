-- Fix Admin Profile Script
-- This script ensures the admin user has a proper profile

-- First, let's check if the admin user exists in auth.users
SELECT id, email, email_confirmed_at, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@spa.com';

-- Check if the profile exists
SELECT * FROM user_profiles 
WHERE email = 'admin@spa.com';

-- If the profile doesn't exist, create it
-- (Replace the UUID with the actual user ID from the query above)
INSERT INTO user_profiles (
  id,
  email,
  name,
  role,
  created_at,
  updated_at,
  is_active
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', 'Admin'),
  COALESCE(u.raw_user_meta_data->>'role', 'admin'),
  NOW(),
  NOW(),
  true
FROM auth.users u
WHERE u.email = 'admin@spa.com'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the profile was created/updated
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  up.name,
  up.role,
  up.is_active,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'admin@spa.com';
