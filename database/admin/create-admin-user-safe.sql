-- Safe Admin User Creation Script
-- This script safely creates an admin user, handling existing users gracefully

-- First, let's check if the admin user already exists
SELECT 'Checking existing admin user...' as status;

SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data,
  up.name,
  up.role,
  up.is_active
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'admin@spa.com';

-- Check if admin user already exists
DO $$
DECLARE
  user_exists boolean;
  user_id uuid;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@spa.com') INTO user_exists;
  
  IF NOT user_exists THEN
    -- Create new admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- instance_id
      gen_random_uuid(), -- id
      'authenticated', -- aud
      'authenticated', -- role
      'admin@spa.com', -- email
      crypt('test123', gen_salt('bf')), -- encrypted_password (password: test123)
      NOW(), -- email_confirmed_at
      NULL, -- invited_at
      '', -- confirmation_token
      NULL, -- confirmation_sent_at
      '', -- recovery_token
      NULL, -- recovery_sent_at
      '', -- email_change_token_new
      '', -- email_change
      NULL, -- email_change_sent_at
      NULL, -- last_sign_in_at
      '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
      '{"name": "Admin", "role": "admin"}', -- raw_user_meta_data
      false, -- is_super_admin
      NOW(), -- created_at
      NOW(), -- updated_at
      NULL, -- phone
      NULL, -- phone_confirmed_at
      '', -- phone_change
      '', -- phone_change_token
      NULL, -- phone_change_sent_at
      '', -- email_change_token_current
      0, -- email_change_confirm_status
      NULL, -- banned_until
      '', -- reauthentication_token
      NULL, -- reauthentication_sent_at
      false, -- is_sso_user
      NULL -- deleted_at
    );
    
    RAISE NOTICE 'Admin user created successfully';
  ELSE
    -- Update existing user to ensure it's properly configured
    UPDATE auth.users SET
      email_confirmed_at = NOW(),
      raw_user_meta_data = '{"name": "Admin", "role": "admin"}',
      updated_at = NOW()
    WHERE email = 'admin@spa.com';
    
    RAISE NOTICE 'Admin user updated successfully';
  END IF;
END $$;

-- Create or update the user profile
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
  updated_at = NOW(),
  is_active = true;

-- Verify the user was created/updated successfully
SELECT 'Verification - Admin user status:' as status;

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

-- Test the password (this should return true if password is correct)
SELECT 'Testing password hash...' as status;

SELECT 
  u.email,
  (u.encrypted_password = crypt('test123', u.encrypted_password)) as password_match
FROM auth.users u
WHERE u.email = 'admin@spa.com';

-- Final success message
SELECT 'Admin user setup completed successfully!' as status;
