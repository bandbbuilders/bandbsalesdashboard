-- Fix Zain Sarwar's profile to reflect COO position correctly
UPDATE profiles 
SET department = 'Management', 
    position = 'CEO/COO'
WHERE user_id = 'fab190bd-3c71-43e8-9385-3ec66044e501';