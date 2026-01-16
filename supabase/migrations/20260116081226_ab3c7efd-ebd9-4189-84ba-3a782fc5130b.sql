-- Allow reminders to be created without a lead_id
ALTER TABLE public.reminders ALTER COLUMN lead_id DROP NOT NULL;