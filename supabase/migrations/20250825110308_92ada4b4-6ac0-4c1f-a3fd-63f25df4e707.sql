-- Insert payment plans with actual sale IDs
INSERT INTO payment_plans (sale_id, downpayment_amount, monthly_installment, installment_months, possession_amount) VALUES
('4fb34c06-fca8-419a-8cff-07f2b554d5a9', 1000000, 120000, 36, 500000),
('11f249d3-9122-40ae-a1d6-43e4f8fcc82e', 800000, 100000, 36, 400000),
('4c1e152b-af7d-4851-9923-38c703134bbb', 1500000, 150000, 36, 650000);

-- Insert ledger entries with actual sale IDs
INSERT INTO ledger_entries (sale_id, due_date, entry_type, amount, description, status) VALUES
('4fb34c06-fca8-419a-8cff-07f2b554d5a9', '2024-09-01', 'downpayment', 1000000, 'Down Payment', 'paid'),
('4fb34c06-fca8-419a-8cff-07f2b554d5a9', '2024-10-01', 'installment', 120000, 'Monthly Installment 1', 'pending'),
('4fb34c06-fca8-419a-8cff-07f2b554d5a9', '2024-11-01', 'installment', 120000, 'Monthly Installment 2', 'pending'),
('11f249d3-9122-40ae-a1d6-43e4f8fcc82e', '2024-08-15', 'downpayment', 800000, 'Down Payment', 'paid'),
('11f249d3-9122-40ae-a1d6-43e4f8fcc82e', '2024-09-15', 'installment', 100000, 'Monthly Installment 1', 'pending'),
('4c1e152b-af7d-4851-9923-38c703134bbb', '2024-01-01', 'downpayment', 1500000, 'Down Payment', 'paid'),
('4c1e152b-af7d-4851-9923-38c703134bbb', '2024-12-01', 'possession', 650000, 'Possession Payment', 'paid');