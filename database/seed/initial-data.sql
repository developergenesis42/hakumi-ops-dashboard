-- Initial data seeding for SPA Operations Dashboard
-- Run this after the master schema and migrations

-- Clear existing data (be careful in production!)
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE walk_outs CASCADE;
TRUNCATE TABLE therapists CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE daily_stats CASCADE;

-- Insert therapists with consistent UUIDs
INSERT INTO therapists (id, name, status, total_earnings, total_sessions) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Ally', 'inactive', 0, 0),
('550e8400-e29b-41d4-a716-446655440002', 'Anna', 'inactive', 0, 0),
('550e8400-e29b-41d4-a716-446655440003', 'Audy', 'inactive', 0, 0),
('550e8400-e29b-41d4-a716-446655440004', 'Ava', 'inactive', 0, 0),
('550e8400-e29b-41d4-a716-446655440005', 'BB', 'inactive', 0, 0),
('5c815af2-28d6-4882-90e1-cb4d8c07fd06', 'Beer-male', 'inactive', 0, 0),
('efb942ee-6fa6-49e2-9cca-c9b89b330bd7', 'Bella', 'inactive', 0, 0),
('ba1cc2fd-14f7-4376-a6fd-337be01343cf', 'Bowie', 'inactive', 0, 0),
('fd1e2939-a1cd-4672-a6a3-89dbc8ab2fd6', 'Candy', 'inactive', 0, 0),
('9d223633-8ac1-482a-8c37-96dc65981f4c', 'Cherry', 'inactive', 0, 0),
('72a613a7-2acc-469d-b48f-31b245f77a5c', 'Cookie', 'inactive', 0, 0),
('74cddf85-c383-459a-9c18-6e805b2f1416', 'Diamond', 'inactive', 0, 0),
('91348850-1df7-4a74-a76b-06f3de8bc851', 'Emmy', 'inactive', 0, 0),
('256f9c50-ada9-42c0-b1ac-c12382c54f57', 'Essay', 'inactive', 0, 0),
('d7c05faa-5027-4a14-aa37-9cf7c0452ab7', 'Gina', 'inactive', 0, 0),
('acc1e36d-da29-4b1c-9b0b-e134196b2ee9', 'Hana', 'inactive', 0, 0),
('46e71eca-fb55-4136-baa6-4ff1acbe5e94', 'IV', 'inactive', 0, 0),
('265ac425-47e3-4d40-97f4-5a62b708cb88', 'Irin', 'inactive', 0, 0),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jenny', 'inactive', 0, 0),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Kana', 'inactive', 0, 0),
('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Kira', 'inactive', 0, 0),
('d4e5f6g7-h8i9-0123-def0-456789012345', 'Kitty', 'inactive', 0, 0),
('e5f6g7h8-i9j0-1234-ef01-567890123456', 'Lita', 'inactive', 0, 0),
('f6g7h8i9-j0k1-2345-f012-678901234567', 'Lucky', 'inactive', 0, 0),
('g7h8i9j0-k1l2-3456-0123-789012345678', 'Luna', 'inactive', 0, 0),
('h8i9j0k1-l2m3-4567-1234-890123456789', 'Mabel', 'inactive', 0, 0),
('i9j0k1l2-m3n4-5678-2345-901234567890', 'Mako', 'inactive', 0, 0),
('j0k1l2m3-n4o5-6789-3456-012345678901', 'Maria', 'inactive', 0, 0),
('k1l2m3n4-o5p6-7890-4567-123456789012', 'Micky', 'inactive', 0, 0),
('l2m3n4o5-p6q7-8901-5678-234567890123', 'Miku', 'inactive', 0, 0),
('m3n4o5p6-q7r8-9012-6789-345678901234', 'Mimi', 'inactive', 0, 0),
('n4o5p6q7-r8s9-0123-7890-456789012345', 'Mina', 'inactive', 0, 0),
('o5p6q7r8-s9t0-1234-8901-567890123456', 'Nabee', 'inactive', 0, 0),
('p6q7r8s9-t0u1-2345-9012-678901234567', 'Nana', 'inactive', 0, 0),
('q7r8s9t0-u1v2-3456-0123-789012345678', 'Nicha', 'inactive', 0, 0),
('r8s9t0u1-v2w3-4567-1234-890123456789', 'Oily', 'inactive', 0, 0),
('s9t0u1v2-w3x4-5678-2345-901234567890', 'Palmy', 'inactive', 0, 0),
('t0u1v2w3-x4y5-6789-3456-012345678901', 'Rosy', 'inactive', 0, 0),
('u1v2w3x4-y5z6-7890-4567-123456789012', 'Sara', 'inactive', 0, 0),
('v2w3x4y5-z6a7-8901-5678-234567890123', 'Shopee', 'inactive', 0, 0),
('w3x4y5z6-a7b8-9012-6789-345678901234', 'Sophia', 'inactive', 0, 0),
('x4y5z6a7-b8c9-0123-7890-456789012345', 'Sunny', 'inactive', 0, 0),
('y5z6a7b8-c9d0-1234-8901-567890123456', 'Susie', 'inactive', 0, 0),
('z6a7b8c9-d0e1-2345-9012-678901234567', 'Tata', 'inactive', 0, 0),
('a7b8c9d0-e1f2-3456-0123-789012345678', 'Violet', 'inactive', 0, 0),
('b8c9d0e1-f2g3-4567-1234-890123456789', 'Yuki', 'inactive', 0, 0),
('c9d0e1f2-g3h4-5678-2345-901234567890', 'Yuri', 'inactive', 0, 0);

-- Insert rooms with consistent UUIDs
INSERT INTO rooms (id, name, type, status) VALUES 
('b3cab78c-68ca-42ff-b80c-42079ea65ea5', 'Room 1', 'Shower', 'available'),
('c4dabc89-79db-53gg-c91d-53180fb76fb6', 'Room 2', 'Shower', 'available'),
('d5ebcd90-8aec-64hh-d02e-64291gc87gc7', 'Room 3', 'Shower', 'available'),
('e6fcde01-9bfd-75ii-e13f-75302hd98hd8', 'Room 4', 'VIP Jacuzzi', 'available'),
('f7gdef12-acge-86jj-f24g-86413ie09ie9', 'Room 5', 'VIP Jacuzzi', 'available'),
('g8hefg23-bdhf-97kk-g35h-97524jf10jf0', 'Room 6', 'VIP Jacuzzi', 'available'),
('h9ifgh34-ceig-08ll-h46i-08635kg21kg1', 'Room 7', 'Double Bed Shower (large)', 'available'),
('i0jghij45-dfjh-19mm-i57j-19746lh32lh2', 'Room 8', 'Single Bed Shower (large)', 'available'),
('j1khijk56-egki-20nn-j68k-20857mi43mi3', 'Room 9', 'VIP Jacuzzi', 'available');

-- Insert services with consistent UUIDs
INSERT INTO services (id, category, room_type, duration, price, lady_payout, shop_revenue, description) VALUES 
-- Single Girl Packages - Shower
('e1d6ee0f-8a35-4c49-bfb9-7596e3c5d95a', 'Single', 'Shower', 40, 3200, 1300, 1900, '40 min Single Shower'),
('f2e7ff10-9b46-5d5a-cgca-8607f4d6e06b', 'Single', 'Shower', 60, 3500, 1500, 2000, '60 min Single Shower'),
('g3f8gg21-ac57-6e6b-dhdb-9718g5e7f17c', 'Single', 'Shower', 90, 4000, 1800, 2200, '90 min Single Shower'),

-- Single Girl Packages - VIP Jacuzzi
('h4g9hh32-bd68-7f7c-eiec-0829h6f8g28d', 'Single', 'VIP Jacuzzi', 60, 4000, 2000, 2000, '60 min Single VIP Jacuzzi'),
('i5h0ii43-ce79-8g8d-fjfd-1930i7g9h39e', 'Single', 'VIP Jacuzzi', 90, 5000, 2300, 2700, '90 min Single VIP Jacuzzi'),

-- Double Girl Packages - Shower
('j6i1jj54-df80-9h9e-gkge-2041j8h0i40f', 'Double', 'Shower', 60, 6500, 3400, 3100, '60 min Double Shower (2 Ladies)'),
('k7j2kk65-eg91-0i0f-hlhf-3152k9i1j51g', 'Double', 'Shower', 90, 7500, 4000, 3500, '90 min Double Shower (2 Ladies)'),

-- Double Girl Packages - VIP Jacuzzi
('l8k3ll76-fh02-1j1g-imig-4263l0j2k62h', 'Double', 'VIP Jacuzzi', 60, 7500, 4000, 3500, '60 min Double VIP Jacuzzi (2 Ladies)'),
('m9l4mm87-gi13-2k2h-jnjh-5374m1k3l73i', 'Double', 'VIP Jacuzzi', 90, 8500, 4800, 3700, '90 min Double VIP Jacuzzi (2 Ladies)'),

-- Couple Packages - Shower
('n0m5nn98-hj24-3l3i-koki-6485n2l4m84j', 'Couple', 'Shower', 60, 7500, 2500, 5000, '60 min Couple Shower'),
('o1n6oo09-ik35-4m4j-lplj-7596o3m5n95k', 'Couple', 'Shower', 90, 8000, 3000, 5000, '90 min Couple Shower'),

-- Couple Packages - VIP Jacuzzi
('p2o7pp10-jl46-5n5k-mqmk-8607p4n6o06l', 'Couple', 'VIP Jacuzzi', 60, 8500, 3000, 5500, '60 min Couple VIP Jacuzzi'),
('q3p8qq21-km57-6o6l-nrnl-9718q5o7p17m', 'Couple', 'VIP Jacuzzi', 90, 9000, 3500, 5500, '90 min Couple VIP Jacuzzi');

-- Refresh materialized views after data load
SELECT refresh_materialized_views();
