-- Fix today's (2026-01-15) attendance: mark as on-time for check-ins <= 10:15
UPDATE attendance 
SET is_late = false, status = 'present' 
WHERE date = '2026-01-15' 
  AND check_in IS NOT NULL 
  AND check_in::time <= '10:15:00'::time;

-- Fix yesterday's (2026-01-14) attendance: mark all as on-time
UPDATE attendance 
SET is_late = false, status = 'present' 
WHERE date = '2026-01-14';