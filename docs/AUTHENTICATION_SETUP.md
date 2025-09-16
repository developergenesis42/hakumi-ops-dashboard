# Authentication Setup Guide

This guide will help you set up proper authentication for the SPA Operations Dashboard using Supabase Auth.

## 🚀 **Quick Start**

### 1. **Database Setup**

First, you need to set up the user profiles table in your Supabase database:

```sql
-- Run this SQL in your Supabase SQL Editor
-- (Copy the contents of database/schema/user-profiles-schema-safe.sql)
```

The schema includes:
- `user_profiles` table with role-based access
- Automatic user profile creation on signup
- Row Level Security (RLS) policies
- User permission functions

### 2. **Environment Variables**

Make sure your `.env.local` file includes:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Security Configuration
VITE_CSRF_PROTECTION=true
VITE_DEBUG_MODE=false
```

### 3. **Supabase Auth Configuration**

In your Supabase dashboard:

1. **Enable Email Authentication**:
   - Go to Authentication > Settings
   - Enable "Enable email confirmations"
   - Set your site URL (e.g., `http://localhost:5174` for development)

2. **Configure Email Templates** (Optional):
   - Customize signup, login, and password reset emails
   - Go to Authentication > Email Templates

3. **Set up RLS Policies**:
   - The SQL schema includes all necessary RLS policies
   - Users can only access their own data unless they're admins/managers

## 🔐 **Authentication Features**

### **User Roles**
- **Admin**: Full access to all features and user management
- **Manager**: Access to reports and staff management
- **Staff**: Basic operational access

### **Authentication Flow**
1. **Login**: Email/password authentication
2. **Signup**: Registration with role selection
3. **Password Reset**: Email-based password recovery
4. **Session Management**: Automatic token refresh
5. **Route Protection**: Role-based access control

### **Security Features**
- ✅ CSRF Protection
- ✅ Input Validation
- ✅ XSS Prevention
- ✅ Role-based Access Control
- ✅ Session Management
- ✅ Secure Password Requirements

## 👥 **User Management**

### **Creating the First Admin User**

1. **Via Signup Form**:
   - Go to the application
   - Click "Sign up"
   - Select "Admin" role
   - Complete registration

2. **Via Database** (if needed):
   ```sql
   -- Insert admin user directly (replace with your details)
   INSERT INTO auth.users (
     id,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     raw_user_meta_data
   ) VALUES (
     uuid_generate_v4(),
     'admin@yourspa.com',
     crypt('your_password', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '{"name": "Admin User", "role": "admin"}'::jsonb
   );
   ```

### **Managing Users**

- **Admins** can view and manage all users
- **Managers** can view staff profiles
- **Staff** can only view their own profile

## 🛡️ **Route Protection**

### **Protected Routes**
All main application routes are now protected:
- Roster Setup
- Daily Operations
- End of Day Summary

### **Role-Based Access**
```typescript
// Example: Admin-only route
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Example: Manager or Admin access
<ProtectedRoute requiredRoles={['admin', 'manager']}>
  <ReportsPanel />
</ProtectedRoute>
```


## 🔧 **Development**

### **Testing Authentication**

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the flow**:
   - Visit `http://localhost:5174`
   - You should see the login form
   - Create a new account or sign in
   - Test role-based access

### **Authentication State**

The authentication state is managed by the `AuthContext`:
```typescript
const { 
  user,           // Current user info
  isAuthenticated, // Boolean auth status
  loading,        // Loading state
  signIn,         // Sign in function
  signOut,        // Sign out function
  hasRole,        // Check user role
} = useAuth();
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Missing Supabase environment variables"**:
   - Check your `.env.local` file
   - Ensure variables are prefixed with `VITE_`

2. **"Failed to create user profile"**:
   - Check if the `user_profiles` table exists
   - Verify RLS policies are set up correctly

3. **"Access Denied" errors**:
   - Check user roles in the database
   - Verify RLS policies allow the operation

4. **Authentication not working**:
   - Check Supabase Auth settings
   - Verify email confirmation is configured
   - Check browser console for errors

### **Debug Mode**

Enable debug mode to see detailed authentication logs:
```bash
VITE_DEBUG_MODE=true
```

## 📱 **User Interface**

### **Login Form**
- Email/password validation
- Real-time error feedback
- Password reset option
- Signup link

### **Signup Form**
- Full name, email, role selection
- Strong password requirements
- Password confirmation
- Role-based registration

### **User Menu**
- User avatar and info
- Role display
- Profile settings
- Sign out option

## 🔒 **Security Best Practices**

1. **Password Requirements**:
   - Minimum 8 characters
   - Uppercase, lowercase, and number required

2. **Session Management**:
   - Automatic token refresh
   - Secure session storage
   - Logout on inactivity

3. **Input Validation**:
   - All forms have client-side validation
   - Server-side validation via RLS
   - XSS prevention

4. **Role-Based Access**:
   - Principle of least privilege
   - Granular permissions
   - Audit trail ready

## 🎯 **Next Steps**

1. **Set up your first admin user**
2. **Configure email templates** (optional)
3. **Test the authentication flow**
4. **Customize user roles** if needed
5. **Set up monitoring** for authentication events

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Check the database schema
4. Review the authentication logs

The authentication system is now fully integrated and ready for production use! 🎉
