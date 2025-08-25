-- Insert sample users with proper UUIDs
INSERT INTO users (id, name, email, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@example.com', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Sales Agent', 'agent@example.com', 'agent'),
('33333333-3333-3333-3333-333333333333', 'Manager User', 'manager@example.com', 'manager');

-- Insert sample customers  
INSERT INTO customers (id, name, contact, email, address) VALUES
('c1111111-1111-1111-1111-111111111111', 'Ahmed Hassan', '+92 300 1234567', 'ahmed@example.com', 'Block A, DHA Phase 2, Karachi'),
('c2222222-2222-2222-2222-222222222222', 'Fatima Sheikh', '+92 301 9876543', 'fatima@example.com', 'Gulshan-e-Iqbal, Karachi'),
('c3333333-3333-3333-3333-333333333333', 'Ali Khan', '+92 333 5555555', 'ali@example.com', 'Model Town, Lahore');

-- Insert sample sales with proper UUIDs
INSERT INTO sales (customer_id, agent_id, unit_number, unit_total_price, status) VALUES
('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'A-101', 5000000, 'active'),
('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'B-205', 4200000, 'active'), 
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'C-301', 6500000, 'completed');