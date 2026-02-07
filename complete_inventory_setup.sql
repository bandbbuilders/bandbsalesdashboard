
-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number text UNIQUE NOT NULL,
  floor text NOT NULL,
  status text NOT NULL DEFAULT 'Available',
  size text NOT NULL,
  type text NOT NULL,
  price numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.inventory;
CREATE POLICY "Allow read access to all authenticated users"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

-- Allow write access to authenticated users
DROP POLICY IF EXISTS "Allow write access to authenticated users" ON public.inventory;
CREATE POLICY "Allow write access to authenticated users"
  ON public.inventory FOR ALL
  TO authenticated
  USING (true);

-- Enable realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.inventory;

-- Truncate to refresh data
TRUNCATE TABLE public.inventory;

INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG01-BF', 'Lower Ground', 'Available', '140.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG02-BF', 'Lower Ground', 'Available', '236.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG03-BF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG04-BF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG05-BF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG06-BF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG07-BF', 'Lower Ground', 'Available', '290.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG08-GF', 'Lower Ground', 'Available', '255.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG09-GF', 'Lower Ground', 'Available', '195.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG10-GF', 'Lower Ground', 'Available', '195.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG11-GF', 'Lower Ground', 'Available', '195.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG12-GF', 'Lower Ground', 'Available', '195.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG13-GF', 'Lower Ground', 'Available', '217.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG14-GF', 'Lower Ground', 'Available', '140.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG15-GF', 'Lower Ground', 'Available', '158.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG16-GF', 'Lower Ground', 'Available', '188.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG17-GF', 'Lower Ground', 'Available', '178.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG18-GF', 'Lower Ground', 'Available', '178.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG19-GF', 'Lower Ground', 'Available', '178.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG20-GF', 'Lower Ground', 'Available', '178.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG21-GF', 'Lower Ground', 'Available', '255.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG22-CF', 'Lower Ground', 'Available', '290.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG23-CF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG24-CF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG25-CF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG26-CF', 'Lower Ground', 'Available', '205.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-LG27-CF', 'Lower Ground', 'Available', '235.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G01-BF', 'Other', 'Available', '188.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G02-BF', 'Other', 'Available', '208.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G03-BF', 'Other', 'Available', '208.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G04-BF', 'Other', 'Available', '208.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G05-BF', 'Other', 'Available', '208.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G06-BF', 'Other', 'Available', '208.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G07-BF', 'Other', 'Available', '298.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G08-GF', 'Ground Floor', 'Available', '288.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G09-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G10-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G11-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G12-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G13-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G14-GF', 'Ground Floor', 'Available', '188.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G15-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G16-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G17-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G18-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G19-GF', 'Ground Floor', 'Available', '203.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G20-GF', 'Ground Floor', 'Available', '305.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G21-CF', 'Other', 'Available', '305.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G22-CF', 'Other', 'Available', '210.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G23-CF', 'Other', 'Available', '210.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G24-CF', 'Other', 'Available', '210.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G25-CF', 'Other', 'Available', '210.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3S-G26-CF', 'Other', 'Available', '210.0 sq ft', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F101', 'First Floor', 'Sold', '660 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F102', 'First Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F103', 'First Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F104', 'First Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F105', 'First Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F106', 'First Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F107', 'First Floor', 'Sold', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F108', 'First Floor', 'Sold', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F109', 'First Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F110', 'First Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F111', 'First Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F112', 'First Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F113', 'First Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F201', 'Second Floor', 'Available', '660 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F202', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F203', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F204', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F205', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F206', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F207', 'Second Floor', 'Sold', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F208', 'Second Floor', 'Sold', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F209', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F210', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F211', 'Second Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F212', 'Second Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F213', 'Second Floor', 'Sold', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F301', 'Third Floor', 'Sold', '660 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F302', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F303', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F304', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F305', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F306', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F307', 'Third Floor', 'Sold', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F308', 'Third Floor', 'Available', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F309', 'Third Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F310', 'Third Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F311', 'Third Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F312', 'Third Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F313', 'Third Floor', 'Sold', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F401', 'Fourth Floor', 'Sold', '660 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F402', 'Fourth Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F403', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F404', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F405', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F406', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F407', 'Fourth Floor', 'Available', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F408', 'Fourth Floor', 'Available', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F409', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F410', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F411', 'Fourth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F412', 'Fourth Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F413', 'Fourth Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F501', 'Fifth Floor', 'Available', '660 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F502', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F503', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F504', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F505', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F506', 'Fifth Floor', 'Sold', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F507', 'Fifth Floor', 'Available', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-2BED-F508', 'Fifth Floor', 'Available', '1100 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F509', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F510', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F511', 'Fifth Floor', 'Available', '610 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F512', 'Fifth Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();
INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('BT3A-1BED-F513', 'Fifth Floor', 'Available', '510 sq ft', 'Apartment', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();