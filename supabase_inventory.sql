-- Create inventory table
CREATE TABLE public.inventory (
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
CREATE POLICY "Allow read access to all authenticated users"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

-- Allow write access to authenticated users (admin/manager logic can be added later if needed)
CREATE POLICY "Allow write access to authenticated users"
  ON public.inventory FOR ALL
  TO authenticated
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;

-- Insert dummy data
INSERT INTO public.inventory (unit_number, floor, status, size, type, price)
VALUES 
  ('BT3A-LG-001', 'Lower Ground', 'Available', '450 sq ft', 'Shop', 4500000),
  ('BT3A-LG-002', 'Lower Ground', 'Sold', '500 sq ft', 'Shop', 5000000),
  ('BT3A-GF-001', 'Ground Floor', 'Available', '600 sq ft', 'Shop', 7500000),
  ('BT3A-GF-002', 'Ground Floor', 'Reserved', '650 sq ft', 'Shop', 8000000),
  ('BT3A-1BED-F101', 'First Floor', 'Available', '660 sq ft', 'Apartment', 6600000),
  ('BT3A-1BED-F102', 'First Floor', 'Sold', '700 sq ft', 'Apartment', 7000000),
  ('BT3A-2BED-S201', 'Second Floor', 'Available', '1200 sq ft', 'Apartment', 12000000),
  ('BT3A-OFF-001', 'Third Floor', 'Available', '800 sq ft', 'Office', 9000000)
ON CONFLICT (unit_number) DO NOTHING;
