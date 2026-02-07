import pandas as pd
import pdfplumber
import re

# --- Helper Functions ---
def clean_text(text):
    if not text: return ""
    return str(text).strip().replace("'", "''")

def get_shop_floor(unit_no):
    unit_no = str(unit_no).upper()
    if 'LG' in unit_no: return 'Lower Ground'
    if 'GF' in unit_no: return 'Ground Floor'
    return 'Other'

def get_apt_floor(unit_no):
    unit_no = str(unit_no).upper()
    if 'F1' in unit_no: return 'First Floor'
    if 'F2' in unit_no: return 'Second Floor'
    if 'F3' in unit_no: return 'Third Floor'
    if 'F4' in unit_no: return 'Fourth Floor'
    if 'F5' in unit_no: return 'Fifth Floor'
    return 'Other'

def get_shop_status(row):
    status_code = str(row.get('Status', '')).strip().upper()
    purchaser = str(row.get('Purchased by / Hold by', '')).strip()
    if purchaser and purchaser.lower() != 'nan': return 'Sold'
    if status_code == 'A': return 'Available'
    if status_code == 'S': return 'Sold'
    return 'Available'

def clean_size(size_str):
    if not size_str: return "0 sq ft"
    # Remove 'sqft', commas, spacing
    val = str(size_str).lower().replace('sqft', '').replace(',', '').strip()
    return f"{val} sq ft"

# --- Main Execution ---
sqls = []

# 1. Setup Table Schema
sqls.append("""
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
""")

# 2. Parse Excel (Shops)
try:
    print("Processing Excel...")
    df = pd.read_excel("Tower 3 Inventory Sheet.xlsx")
    for _, row in df.iterrows():
        unit_no = row['Unit No.']
        if pd.isna(unit_no) or "SHOPS" in str(unit_no) or "APARTMENTS" in str(unit_no): continue
        
        unit_clean = clean_text(unit_no)
        floor = get_shop_floor(unit_clean)
        status = get_shop_status(row)
        size = f"{row['Area']} sq ft" if pd.notna(row['Area']) else "0 sq ft"
        
        sql = f"INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('{unit_clean}', '{floor}', '{status}', '{size}', 'Shop', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();"
        sqls.append(sql)
except Exception as e:
    print(f"Excel Error: {e}")

# 3. Parse PDF (Apartments)
try:
    print("Processing PDF...")
    with pdfplumber.open("Apartment Inventory Tower 3.pdf") as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                # Assume headers are row 0: Unit No., Category, Area, Status...
                for row in table[1:]: # Skip header
                    if not row or len(row) < 4: continue
                    unit_no = row[0]
                    category = row[1]
                    area = row[2]
                    status_raw = row[3]
                    
                    if not unit_no or 'Unit No' in str(unit_no) or 'Floor' in str(unit_no): continue

                    unit_clean = clean_text(unit_no)
                    floor = get_apt_floor(unit_clean)
                    size = clean_size(area)
                    
                    status = 'Available'
                    if 'SOLD' in str(status_raw).upper(): status = 'Sold'
                    
                    # Category is usually "Apartment (1 Bed)" etc.
                    type_val = "Apartment"
                    
                    sql = f"INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('{unit_clean}', '{floor}', '{status}', '{size}', '{type_val}', 0) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();"
                    sqls.append(sql)

except Exception as e:
    print(f"PDF Error: {e}")

# 4. Write Output
with open("complete_inventory_setup.sql", "w") as f:
    f.write("\n".join(sqls))

print(f"Generated {len(sqls)} SQL statements (including setup).")
