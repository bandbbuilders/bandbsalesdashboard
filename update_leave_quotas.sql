-- SQL Script to Update Leave Quotas
-- ---------------------------------
-- This script sets Annual Leave to 18 days (Paid Leaves) 
-- and Sick Leave to 10 days (Medical Leaves).

-- 1. Update master configurations in leave_types
UPDATE public.leave_types 
SET days_per_year = 18 
WHERE name = 'Annual Leave';

UPDATE public.leave_types 
SET days_per_year = 10 
WHERE name = 'Sick Leave';

-- 2. Update existing balances for the current year (2026)
UPDATE public.leave_balances
SET total_days = 18
WHERE leave_type_id IN (SELECT id FROM public.leave_types WHERE name = 'Annual Leave')
AND year = 2026;

UPDATE public.leave_balances
SET total_days = 10
WHERE leave_type_id IN (SELECT id FROM public.leave_types WHERE name = 'Sick Leave')
AND year = 2026;

-- 3. (Optional) If you want to rename them for clarity in the DB:
-- UPDATE public.leave_types SET name = 'Paid Leave' WHERE name = 'Annual Leave';
-- UPDATE public.leave_types SET name = 'Medical Leave' WHERE name = 'Sick Leave';
