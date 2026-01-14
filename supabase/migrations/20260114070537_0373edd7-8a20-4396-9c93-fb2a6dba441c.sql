-- Add missing columns to employee_details
ALTER TABLE employee_details 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create function to auto-create employee details on profile creation
CREATE OR REPLACE FUNCTION create_employee_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_details (
    profile_id,
    contract_type,
    work_location,
    basic_salary,
    joining_date
  ) VALUES (
    NEW.id,
    'probation',
    'office',
    0,
    CURRENT_DATE
  )
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_employee_on_profile_insert();

-- Backfill existing profiles that don't have employee records
INSERT INTO employee_details (profile_id, contract_type, work_location, basic_salary, joining_date)
SELECT id, 'permanent', 'office', 0, created_at::date
FROM profiles
WHERE id NOT IN (SELECT profile_id FROM employee_details)
ON CONFLICT (profile_id) DO NOTHING;

-- Create function to auto-create leave balances when employee is created
CREATE OR REPLACE FUNCTION create_leave_balances_for_employee()
RETURNS TRIGGER AS $$
DECLARE
  leave_type_record RECORD;
  current_yr INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  FOR leave_type_record IN SELECT id, days_per_year FROM leave_types
  LOOP
    INSERT INTO leave_balances (
      employee_id, leave_type_id, year, 
      total_days, used_days, pending_days
    ) VALUES (
      NEW.id, leave_type_record.id, current_yr,
      COALESCE(leave_type_record.days_per_year, 0), 0, 0
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_employee_created ON employee_details;
CREATE TRIGGER on_employee_created
  AFTER INSERT ON employee_details
  FOR EACH ROW
  EXECUTE FUNCTION create_leave_balances_for_employee();

-- Backfill leave balances for existing employees
INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, pending_days)
SELECT ed.id, lt.id, EXTRACT(YEAR FROM CURRENT_DATE)::INT, COALESCE(lt.days_per_year, 0), 0, 0
FROM employee_details ed
CROSS JOIN leave_types lt
WHERE NOT EXISTS (
  SELECT 1 FROM leave_balances lb 
  WHERE lb.employee_id = ed.id 
  AND lb.leave_type_id = lt.id 
  AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INT
);