-- Update Zain Sarwar's role to ceo_coo
UPDATE public.user_roles 
SET role = 'ceo_coo', updated_at = now()
WHERE user_id = 'fab190bd-3c71-43e8-9385-3ec66044e501';