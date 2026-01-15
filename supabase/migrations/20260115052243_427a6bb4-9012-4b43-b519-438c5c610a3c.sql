-- Update yesterday's attendance check_in to 10:15 (on time)
UPDATE attendance 
SET check_in = '10:15:00', is_late = false, status = 'present' 
WHERE date = '2026-01-14';

-- Delete fines for yesterday's attendance
DELETE FROM fines WHERE date = '2026-01-14';