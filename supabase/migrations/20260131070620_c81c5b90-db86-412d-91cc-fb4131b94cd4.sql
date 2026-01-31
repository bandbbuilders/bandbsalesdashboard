-- Update Half Day balances to 6 days
UPDATE leave_balances lb
SET total_days = 6
FROM leave_types lt
WHERE lb.leave_type_id = lt.id 
  AND lt.name = 'Half Day' 
  AND lb.year = 2026
  AND (lb.total_days IS NULL OR lb.total_days = 0);

-- Initialize Early Leave balances for all employees (12 days per year)
INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, pending_days)
SELECT ed.id, lt.id, 2026, 12, 0, 0
FROM employee_details ed
CROSS JOIN leave_types lt
WHERE lt.name = 'Early Leave'
  AND NOT EXISTS (
    SELECT 1 FROM leave_balances lb 
    WHERE lb.employee_id = ed.id 
      AND lb.leave_type_id = lt.id 
      AND lb.year = 2026
  );