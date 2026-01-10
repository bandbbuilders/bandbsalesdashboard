-- 1) Roles enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('ceo_coo', 'manager', 'executive');
  END IF;
END $$;

-- 2) user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can view their own role'
  ) THEN
    CREATE POLICY "Users can view their own role"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own role row (used during signup/backfill-safe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can insert their own role'
  ) THEN
    CREATE POLICY "Users can insert their own role"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admins (legacy profiles.role) can manage user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('superadmin','admin')
  );
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can manage user roles'
  ) THEN
    CREATE POLICY "Admins can manage user roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 3) has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4) profiles additions for hierarchy
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id uuid NULL,
  ADD COLUMN IF NOT EXISTS salary numeric NULL;

-- 5) Backfill user_roles from profiles.position (non-destructive)
INSERT INTO public.user_roles (user_id, role)
SELECT
  p.user_id,
  CASE
    WHEN p.position = 'CEO/COO' THEN 'ceo_coo'::public.app_role
    WHEN p.position = 'Manager' THEN 'manager'::public.app_role
    WHEN p.position = 'Executive' THEN 'executive'::public.app_role
    ELSE NULL
  END AS role
FROM public.profiles p
WHERE p.user_id IS NOT NULL
  AND p.position IN ('CEO/COO','Manager','Executive')
ON CONFLICT (user_id) DO NOTHING;

-- 6) updated_at trigger for user_roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 7) Index for manager_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);