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

-- Insert sample sales
INSERT INTO sales (id, customer_id, agent_id, unit_number, unit_total_price, status) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'A-101', 5000000, 'active'),
('s2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'B-205', 4200000, 'active'), 
('s3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'C-301', 6500000, 'completed');

-- Insert sample payment plans
INSERT INTO payment_plans (sale_id, downpayment_amount, monthly_installment, installment_months, possession_amount) VALUES
('s1111111-1111-1111-1111-111111111111', 1000000, 120000, 36, 500000),
('s2222222-2222-2222-2222-222222222222', 800000, 100000, 36, 400000),
('s3333333-3333-3333-3333-333333333333', 1500000, 150000, 36, 650000);

-- Insert sample ledger entries
INSERT INTO ledger_entries (sale_id, due_date, entry_type, amount, description, status) VALUES
('s1111111-1111-1111-1111-111111111111', '2024-09-01', 'downpayment', 1000000, 'Down Payment', 'paid'),
('s1111111-1111-1111-1111-111111111111', '2024-10-01', 'installment', 120000, 'Monthly Installment 1', 'pending'),
('s1111111-1111-1111-1111-111111111111', '2024-11-01', 'installment', 120000, 'Monthly Installment 2', 'pending'),
('s2222222-2222-2222-2222-222222222222', '2024-08-15', 'downpayment', 800000, 'Down Payment', 'paid'),
('s2222222-2222-2222-2222-222222222222', '2024-09-15', 'installment', 100000, 'Monthly Installment 1', 'pending'),
('s3333333-3333-3333-3333-333333333333', '2024-01-01', 'downpayment', 1500000, 'Down Payment', 'paid'),
('s3333333-3333-3333-3333-333333333333', '2024-12-01', 'possession', 650000, 'Possession Payment', 'paid');