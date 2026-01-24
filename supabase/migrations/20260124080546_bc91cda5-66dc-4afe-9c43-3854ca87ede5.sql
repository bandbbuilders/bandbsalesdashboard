-- Insert Early Leave type with 12 days per year
INSERT INTO public.leave_types (name, days_per_year, is_paid, requires_approval, color)
VALUES ('Early Leave', 12, true, true, '#06B6D4');

-- Update Half Day to have 6 days per year
UPDATE public.leave_types 
SET days_per_year = 6
WHERE name = 'Half Day';