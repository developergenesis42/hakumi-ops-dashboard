-- Create only the functions needed for roster persistence
-- The daily_rosters table already exists

-- Create or replace functions
CREATE OR REPLACE FUNCTION get_today_roster()
RETURNS TABLE (
    id UUID,
    therapist_id UUID,
    therapist_name VARCHAR(50),
    status VARCHAR(20),
    total_earnings DECIMAL(10,2),
    total_sessions INTEGER,
    current_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        dr.therapist_id,
        t.name as therapist_name,
        dr.status,
        dr.total_earnings,
        dr.total_sessions,
        dr.current_session_id,
        dr.created_at,
        dr.updated_at
    FROM daily_rosters dr
    JOIN therapists t ON dr.therapist_id = t.id
    WHERE dr.date = CURRENT_DATE
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_to_today_roster(therapist_uuid UUID)
RETURNS UUID AS $$
DECLARE
    roster_id UUID;
BEGIN
    INSERT INTO daily_rosters (therapist_id, date, status)
    VALUES (therapist_uuid, CURRENT_DATE, 'inactive')
    ON CONFLICT (therapist_id, date) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING id INTO roster_id;
    
    RETURN roster_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION remove_from_today_roster(therapist_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM daily_rosters 
    WHERE therapist_id = therapist_uuid 
    AND date = CURRENT_DATE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clear_today_roster()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM daily_rosters WHERE date = CURRENT_DATE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_roster_for_date(target_date DATE)
RETURNS TABLE (
    id UUID,
    therapist_id UUID,
    therapist_name VARCHAR(50),
    status VARCHAR(20),
    total_earnings DECIMAL(10,2),
    total_sessions INTEGER,
    current_session_id UUID,
    check_in_time TIMESTAMP WITH TIME ZONE,
    departure_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id,
        dr.therapist_id,
        t.name as therapist_name,
        dr.status,
        dr.total_earnings,
        dr.total_sessions,
        dr.current_session_id,
        dr.check_in_time,
        dr.departure_time,
        dr.created_at,
        dr.updated_at
    FROM daily_rosters dr
    JOIN therapists t ON dr.therapist_id = t.id
    WHERE dr.date = target_date
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;
