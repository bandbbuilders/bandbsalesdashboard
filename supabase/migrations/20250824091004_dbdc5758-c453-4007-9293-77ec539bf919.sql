-- Insert sample users
INSERT INTO users (id, name, email, role) VALUES 
('1', 'Admin User', 'admin@example.com', 'admin'),
('2', 'Sales Agent', 'agent@example.com', 'agent'),
('3', 'Manager User', 'manager@example.com', 'manager');

-- Insert sample customers  
INSERT INTO customers (id, name, contact, email, address) VALUES
('c1', 'Ahmed Hassan', '+92 300 1234567', 'ahmed@example.com', 'Block A, DHA Phase 2, Karachi'),
('c2', 'Fatima Sheikh', '+92 301 9876543', 'fatima@example.com', 'Gulshan-e-Iqbal, Karachi'),
('c3', 'Ali Khan', '+92 333 5555555', 'ali@example.com', 'Model Town, Lahore');

-- Insert sample sales
INSERT INTO sales (id, customer_id, agent_id, unit_number, unit_total_price, status) VALUES
('s1', 'c1', '2', 'A-101', 5000000, 'active'),
('s2', 'c2', '2', 'B-205', 4200000, 'active'), 
('s3', 'c3', '1', 'C-301', 6500000, 'completed');

-- Insert sample payment plans
INSERT INTO payment_plans (sale_id, downpayment_amount, monthly_installment, installment_months, possession_amount) VALUES
('s1', 1000000, 120000, 36, 500000),
('s2', 800000, 100000, 36, 400000),
('s3', 1500000, 150000, 36, 650000);

-- Insert sample ledger entries
INSERT INTO ledger_entries (sale_id, due_date, entry_type, amount, description, status) VALUES
('s1', '2024-09-01', 'downpayment', 1000000, 'Down Payment', 'paid'),
('s1', '2024-10-01', 'installment', 120000, 'Monthly Installment 1', 'pending'),
('s1', '2024-11-01', 'installment', 120000, 'Monthly Installment 2', 'pending'),
('s2', '2024-08-15', 'downpayment', 800000, 'Down Payment', 'paid'),
('s2', '2024-09-15', 'installment', 100000, 'Monthly Installment 1', 'pending'),
('s3', '2024-01-01', 'downpayment', 1500000, 'Down Payment', 'paid'),
('s3', '2024-12-01', 'possession', 650000, 'Possession Payment', 'paid');