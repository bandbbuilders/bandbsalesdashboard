-- Allow a sale to be assigned to either an internal (profiles) agent or an external (sales_agents) agent

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS external_agent_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_external_agent_id_fkey'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_external_agent_id_fkey
      FOREIGN KEY (external_agent_id)
      REFERENCES public.sales_agents(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

-- Make agent_id optional so external_agent_id can be used instead
ALTER TABLE public.sales
  ALTER COLUMN agent_id DROP NOT NULL;

-- Ensure at least one agent reference exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_has_agent_chk'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_has_agent_chk
      CHECK (agent_id IS NOT NULL OR external_agent_id IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_external_agent_id ON public.sales(external_agent_id);

-- Optional: keep data clean (cannot have both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sales_one_agent_source_chk'
  ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_one_agent_source_chk
      CHECK (NOT (agent_id IS NOT NULL AND external_agent_id IS NOT NULL));
  END IF;
END $$;
