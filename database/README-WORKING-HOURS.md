# Working Hours Persistence Setup

This document explains how to set up persistent working hours tracking in the database.

## Database Migration Required

To enable persistent working hours tracking, you need to run the database migration script that adds the required fields to the `daily_rosters` table.

### Step 1: Run the Migration Script

You have two options for the migration:

#### Option A: Safe Migration (Recommended)
Execute the safer migration script that handles function recreation more gracefully:

```sql
-- File: database/schema/add-working-hours-fields-safe.sql
```

#### Option B: Direct Migration
If you prefer the direct approach:

```sql
-- File: database/schema/add-working-hours-fields.sql
```

**Note**: The direct migration will drop and recreate the `get_today_roster()` function, which may cause a brief interruption. The safe migration handles this more gracefully.

You can run this script in:
1. **Supabase Dashboard**: Go to SQL Editor and paste the script
2. **psql command line**: `psql -h your-host -U your-user -d your-database -f add-working-hours-fields.sql`
3. **Any PostgreSQL client**: Execute the script directly

### Step 2: Verify the Migration

After running the migration, verify that the new fields were added:

```sql
-- Check if the new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_rosters' 
AND column_name IN ('check_in_time', 'departure_time');

-- Test the new functions
SELECT * FROM get_today_working_hours();
```

### What the Migration Adds

1. **New Database Fields**:
   - `check_in_time`: Timestamp when therapist checked in
   - `departure_time`: Timestamp when therapist departed

2. **New Database Functions**:
   - `update_check_in_time(therapist_uuid)`: Updates check-in time and status
   - `update_departure_time(therapist_uuid)`: Updates departure time and status
   - `get_therapist_working_hours(therapist_uuid, date)`: Gets working hours for specific therapist
   - `get_today_working_hours()`: Gets working hours for all therapists today

3. **Updated Functions**:
   - `get_today_roster()`: Now includes check-in and departure times

### Features Enabled After Migration

- ✅ **Persistent Check-in Times**: Check-in times are saved to database
- ✅ **Persistent Departure Times**: Departure times are saved to database
- ✅ **Working Hours Calculation**: Automatic calculation of hours worked
- ✅ **Data Recovery**: Working hours survive page refreshes and app restarts
- ✅ **Historical Data**: Can query working hours for any date
- ✅ **Real-time Updates**: Working hours update in real-time for active therapists

### Testing the Migration

1. **Check-in a therapist** and verify the time is saved
2. **Depart a therapist** and verify the departure time is saved
3. **Refresh the page** and verify working hours are still displayed
4. **Check the database** directly to see the timestamps

### Troubleshooting

If you encounter issues:

1. **Check database permissions**: Ensure your user has ALTER TABLE permissions
2. **Verify function creation**: Check that all functions were created successfully
3. **Test with simple queries**: Try the basic functions first
4. **Check logs**: Look for any error messages in the application console

### Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the new columns (this will lose data!)
ALTER TABLE daily_rosters 
DROP COLUMN IF EXISTS check_in_time,
DROP COLUMN IF EXISTS departure_time;

-- Drop the new functions
DROP FUNCTION IF EXISTS update_check_in_time(UUID);
DROP FUNCTION IF EXISTS update_departure_time(UUID);
DROP FUNCTION IF EXISTS get_therapist_working_hours(UUID, DATE);
DROP FUNCTION IF EXISTS get_today_working_hours();

-- Restore the original get_today_roster function
-- (You'll need to restore from backup or recreate)
```

## After Migration

Once the migration is complete, the working hours feature will be fully persistent:

- All check-in and departure times will be saved to the database
- Working hours will be calculated and displayed correctly
- Data will survive page refreshes and application restarts
- You can query historical working hours data
