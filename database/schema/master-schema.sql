-- SPA Operations Dashboard Database Schema - OPTIMIZED VERSION
-- Run this in your Supabase SQL editor to create the optimized database structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For array operations

-- Create optimized therapists table
CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'available', 'in-session', 'departed')),
    total_earnings DECIMAL(10,2) DEFAULT 0 CHECK (total_earnings >= 0),
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for data integrity
    CONSTRAINT therapists_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create optimized rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Shower', 'VIP Jacuzzi', 'Double Bed Shower (large)', 'Single Bed Shower (large)')),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for data integrity
    CONSTRAINT rooms_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT rooms_name_unique UNIQUE (name)
);

-- Create optimized services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('Single', 'Double', 'Couple')),
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('Shower', 'VIP Jacuzzi', 'Double Bed Shower (large)', 'Single Bed Shower (large)')),
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 480), -- Max 8 hours
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    lady_payout DECIMAL(10,2) NOT NULL CHECK (lady_payout >= 0),
    shop_revenue DECIMAL(10,2) NOT NULL CHECK (shop_revenue >= 0),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for business logic
    CONSTRAINT services_payout_valid CHECK (lady_payout + shop_revenue <= price),
    CONSTRAINT services_description_not_empty CHECK (LENGTH(TRIM(description)) > 0)
);

-- Create optimized sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    therapist_ids UUID[] NOT NULL CHECK (array_length(therapist_ids, 1) > 0),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    prep_start_time TIMESTAMP WITH TIME ZONE,
    session_start_time TIMESTAMP WITH TIME ZONE,
    is_in_prep_phase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for business logic
    CONSTRAINT sessions_time_valid CHECK (end_time > start_time),
    CONSTRAINT sessions_discount_valid CHECK (discount < total_price),
    CONSTRAINT sessions_prep_time_valid CHECK (
        prep_start_time IS NULL OR 
        (prep_start_time >= start_time AND prep_start_time <= end_time)
    ),
    CONSTRAINT sessions_session_time_valid CHECK (
        session_start_time IS NULL OR 
        (session_start_time >= start_time AND session_start_time <= end_time)
    )
);

-- Create optimized walk_outs table
CREATE TABLE walk_outs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    therapist_ids UUID[] NOT NULL CHECK (array_length(therapist_ids, 1) > 0),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    count INTEGER CHECK (count > 0),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimized daily_stats table
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_slips INTEGER DEFAULT 0 CHECK (total_slips >= 0),
    total_revenue DECIMAL(10,2) DEFAULT 0 CHECK (total_revenue >= 0),
    total_payouts DECIMAL(10,2) DEFAULT 0 CHECK (total_payouts >= 0),
    total_discounts DECIMAL(10,2) DEFAULT 0 CHECK (total_discounts >= 0),
    shop_revenue DECIMAL(10,2) DEFAULT 0 CHECK (shop_revenue >= 0),
    walk_out_count INTEGER DEFAULT 0 CHECK (walk_out_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints for business logic
    CONSTRAINT daily_stats_revenue_valid CHECK (total_payouts + shop_revenue <= total_revenue)
);

-- ===========================================
-- PERFORMANCE OPTIMIZATIONS
-- ===========================================

-- Single column indexes (already exist, but optimized)
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(status);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sessions_status_time ON sessions(status, start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_room_status ON sessions(room_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_service_room ON sessions(service_id, room_id);
CREATE INDEX IF NOT EXISTS idx_therapists_status_earnings ON therapists(status, total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_services_category_room ON services(category, room_type);
CREATE INDEX IF NOT EXISTS idx_walk_outs_timestamp ON walk_outs(timestamp);
CREATE INDEX IF NOT EXISTS idx_walk_outs_session ON walk_outs(session_id);

-- GIN indexes for array operations (therapist_ids)
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_ids ON sessions USING GIN (therapist_ids);
CREATE INDEX IF NOT EXISTS idx_walk_outs_therapist_ids ON walk_outs USING GIN (therapist_ids);

-- Partial indexes for active sessions (most common queries)
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(start_time, end_time) 
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_therapists_available ON therapists(id, name) 
    WHERE status = 'available';

-- Indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_sessions_date_range ON sessions(start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date_range ON daily_stats(date, total_revenue);

-- ===========================================
-- TRIGGERS AND FUNCTIONS
-- ===========================================

-- Optimized updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_therapists_updated_at 
    BEFORE UPDATE ON therapists 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_walk_outs_updated_at 
    BEFORE UPDATE ON walk_outs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at 
    BEFORE UPDATE ON daily_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ===========================================

-- Materialized view for therapist performance stats
CREATE MATERIALIZED VIEW therapist_performance AS
SELECT 
    t.id,
    t.name,
    t.status,
    t.total_earnings,
    t.total_sessions,
    COALESCE(AVG(s.total_price), 0) as avg_session_value,
    COALESCE(COUNT(s.id), 0) as active_sessions_count,
    COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_sessions
FROM therapists t
LEFT JOIN sessions s ON t.id = ANY(s.therapist_ids)
GROUP BY t.id, t.name, t.status, t.total_earnings, t.total_sessions;

-- Create unique index for concurrent refresh (required)
CREATE UNIQUE INDEX IF NOT EXISTS idx_therapist_performance_id ON therapist_performance(id);
-- Create additional indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_therapist_performance_status ON therapist_performance(status);
CREATE INDEX IF NOT EXISTS idx_therapist_performance_earnings ON therapist_performance(total_earnings DESC);

-- Materialized view for room utilization
CREATE MATERIALIZED VIEW room_utilization AS
SELECT 
    r.id,
    r.name,
    r.type,
    r.status,
    COALESCE(COUNT(s.id), 0) as total_sessions,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600), 0) as total_hours_used,
    COALESCE(AVG(EXTRACT(EPOCH FROM (s.end_time - s.start_time))/3600), 0) as avg_session_duration_hours
FROM rooms r
LEFT JOIN sessions s ON r.id = s.room_id AND s.status = 'completed'
GROUP BY r.id, r.name, r.type, r.status;

-- Create unique index for concurrent refresh (required)
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_utilization_id ON room_utilization(id);
-- Create additional indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_room_utilization_type ON room_utilization(type);
CREATE INDEX IF NOT EXISTS idx_room_utilization_sessions ON room_utilization(total_sessions DESC);

-- ===========================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ===========================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY therapist_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY room_utilization;
END;
$$ LANGUAGE plpgsql;

-- Alternative function for non-concurrent refresh (if needed)
CREATE OR REPLACE FUNCTION refresh_materialized_views_simple()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW therapist_performance;
    REFRESH MATERIALIZED VIEW room_utilization;
END;
$$ LANGUAGE plpgsql;

-- Function to get available therapists
CREATE OR REPLACE FUNCTION get_available_therapists()
RETURNS TABLE (
    id UUID,
    name VARCHAR(50),
    total_earnings DECIMAL(10,2),
    total_sessions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.total_earnings, t.total_sessions
    FROM therapists t
    WHERE t.status = 'available'
    ORDER BY t.total_sessions ASC, t.total_earnings ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get available rooms by type
CREATE OR REPLACE FUNCTION get_available_rooms(room_type_param VARCHAR(50))
RETURNS TABLE (
    id UUID,
    name VARCHAR(50),
    type VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.name, r.type
    FROM rooms r
    WHERE r.status = 'available' 
    AND r.type = room_type_param
    ORDER BY r.name;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- INSERT INITIAL DATA
-- ===========================================

-- Insert therapists
INSERT INTO therapists (name) VALUES 
('Ally'), ('Anna'), ('Audy'), ('Ava'), ('BB'), ('Beer-male'), ('Bella'), ('Bowie'), ('Candy'), ('Cherry'),
('Cookie'), ('Diamond'), ('Emmy'), ('Essay'), ('Gina'), ('Hana'), ('IV'), ('Irin'), ('Jenny'), ('Kana'),
('Kira'), ('Kitty'), ('Lita'), ('Lucky'), ('Luna'), ('Mabel'), ('Mako'), ('Maria'), ('Micky'), ('Miku'),
('Mimi'), ('Mina'), ('Nabee'), ('Nana'), ('Nicha'), ('Oily'), ('Palmy'), ('Rosy'), ('Sara'), ('Shopee'),
('Sophia'), ('Sunny'), ('Susie'), ('Tata'), ('Violet'), ('Yuki'), ('Yuri');

-- Insert rooms
INSERT INTO rooms (name, type) VALUES 
('Room 1', 'Shower'), ('Room 2', 'Shower'), ('Room 3', 'Shower'),
('Room 4', 'VIP Jacuzzi'), ('Room 5', 'VIP Jacuzzi'), ('Room 6', 'VIP Jacuzzi'), ('Room 9', 'VIP Jacuzzi'),
('Room 7', 'Double Bed Shower (large)'), ('Room 8', 'Single Bed Shower (large)');

-- Insert services
INSERT INTO services (category, room_type, duration, price, lady_payout, shop_revenue, description) VALUES 
-- Single Girl Packages - Shower
('Single', 'Shower', 40, 3200, 1300, 1900, '40 min Single Shower'),
('Single', 'Shower', 60, 3500, 1500, 2000, '60 min Single Shower'),
('Single', 'Shower', 90, 4000, 1800, 2200, '90 min Single Shower'),

-- Single Girl Packages - VIP Jacuzzi
('Single', 'VIP Jacuzzi', 60, 4000, 2000, 2000, '60 min Single VIP Jacuzzi'),
('Single', 'VIP Jacuzzi', 90, 5000, 2300, 2700, '90 min Single VIP Jacuzzi'),

-- Double Girl Packages - Shower
('Double', 'Shower', 60, 6500, 3400, 3100, '60 min Double Shower (2 Ladies)'),
('Double', 'Shower', 90, 7500, 4000, 3500, '90 min Double Shower (2 Ladies)'),

-- Double Girl Packages - VIP Jacuzzi
('Double', 'VIP Jacuzzi', 60, 7500, 4000, 3500, '60 min Double VIP Jacuzzi (2 Ladies)'),
('Double', 'VIP Jacuzzi', 90, 8500, 4800, 3700, '90 min Double VIP Jacuzzi (2 Ladies)'),

-- Couple Packages - Shower
('Couple', 'Shower', 60, 7500, 2500, 5000, '60 min Couple Shower'),
('Couple', 'Shower', 90, 8000, 3000, 5000, '90 min Couple Shower'),

-- Couple Packages - VIP Jacuzzi
('Couple', 'VIP Jacuzzi', 60, 8500, 3000, 5500, '60 min Couple VIP Jacuzzi'),
('Couple', 'VIP Jacuzzi', 90, 9000, 3500, 5500, '90 min Couple VIP Jacuzzi');

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable Row Level Security
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create optimized policies
CREATE POLICY "Allow all operations on therapists" ON therapists FOR ALL USING (true);
CREATE POLICY "Allow all operations on rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all operations on services" ON services FOR ALL USING (true);
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on walk_outs" ON walk_outs FOR ALL USING (true);
CREATE POLICY "Allow all operations on daily_stats" ON daily_stats FOR ALL USING (true);

-- ===========================================
-- MAINTENANCE AND MONITORING
-- ===========================================

-- Create function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views after initial data load
SELECT refresh_materialized_views();
