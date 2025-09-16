# SPA Operations Dashboard Database

This directory contains all database-related files for the SPA Operations Dashboard.

## Structure

```
database/
├── README.md                    # This file
├── schema/
│   └── master-schema.sql       # Complete database schema with optimizations
├── migrations/
│   └── 001-add-expenses-table.sql  # Database migrations
├── seed/
│   └── initial-data.sql        # Initial data seeding
├── functions/
│   └── roster-functions.sql    # Custom database functions
├── admin/
│   ├── create-admin-user-safe.sql
│   └── fix-admin-profile.sql
└── troubleshooting/
    └── troubleshoot-auth.sql
```

## Setup Instructions

### 1. Initial Setup
Run the master schema first:
```sql
-- In Supabase SQL Editor
\i database/schema/master-schema.sql
```

### 2. Apply Migrations
Apply any migrations in order:
```sql
-- In Supabase SQL Editor
\i database/migrations/001-add-expenses-table.sql
```

### 3. Seed Initial Data
Load initial data:
```sql
-- In Supabase SQL Editor
\i database/seed/initial-data.sql
```

## Database Schema

### Core Tables
- **therapists**: Staff members and their status
- **rooms**: Available rooms and their types
- **services**: Service packages and pricing
- **sessions**: Active and completed sessions
- **walk_outs**: Walk-out transactions
- **daily_stats**: Daily performance metrics
- **expenses**: Staff expenses tracking

### Key Features
- **UUID Primary Keys**: All tables use UUID for better distributed system support
- **Row Level Security**: Enabled on all tables
- **Optimized Indexes**: Comprehensive indexing for performance
- **Materialized Views**: Pre-computed views for complex queries
- **Triggers**: Automatic timestamp updates
- **Constraints**: Data integrity and business logic validation

### Performance Optimizations
- Composite indexes for common query patterns
- GIN indexes for array operations
- Partial indexes for active records
- Materialized views for complex aggregations
- Concurrent refresh capabilities

## Functions

### Roster Functions
Located in `functions/roster-functions.sql`:
- Functions for roster management
- Daily roster operations
- Persistence utilities

### Utility Functions
- `refresh_materialized_views()`: Refresh all materialized views
- `get_available_therapists()`: Get available staff
- `get_available_rooms(room_type)`: Get available rooms by type
- `analyze_table_stats()`: Database performance analysis

## Maintenance

### Regular Tasks
1. **Refresh Materialized Views**: Run `SELECT refresh_materialized_views();`
2. **Analyze Performance**: Run `SELECT * FROM analyze_table_stats();`
3. **Monitor Index Usage**: Check query performance in Supabase dashboard

### Backup
- Use Supabase's built-in backup features
- Export critical data regularly
- Test restore procedures

## Troubleshooting

### Common Issues
1. **Authentication Problems**: See `troubleshooting/troubleshoot-auth.sql`
2. **Admin User Issues**: See `admin/` directory
3. **Performance Issues**: Check materialized view refresh status

### Monitoring
- Monitor query performance in Supabase dashboard
- Check table sizes and index usage
- Review slow query logs

## Security

- All tables have Row Level Security enabled
- Policies allow all operations (adjust for production)
- UUIDs prevent enumeration attacks
- Input validation through CHECK constraints

## Development

### Adding New Tables
1. Create migration file in `migrations/`
2. Update this README
3. Test with sample data
4. Update application code

### Modifying Schema
1. Create new migration file
2. Test thoroughly
3. Update documentation
4. Coordinate with application updates

## Production Considerations

- Review and tighten RLS policies
- Set up proper monitoring
- Configure automated backups
- Test disaster recovery procedures
- Monitor performance metrics