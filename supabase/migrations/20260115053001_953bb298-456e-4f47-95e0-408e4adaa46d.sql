-- Update Hamna Malik's attendance for today to 10:14 AM (on time)
UPDATE attendance 
SET check_in = '10:14:00', is_late = false, status = 'present' 
WHERE date = '2026-01-15' AND user_name = 'Hamna Malik';

-- Delete the fine for Hamna Malik for today
DELETE FROM fines WHERE date = '2026-01-15' AND user_name = 'Hamna Malik';