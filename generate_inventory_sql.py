import pandas as pd
import json

def get_floor(unit_no):
    if not isinstance(unit_no, str): return 'Unknown'
    if 'LG' in unit_no: return 'Lower Ground'
    if 'GF' in unit_no: return 'Ground Floor'
    if 'FF' in unit_no or 'F1' in unit_no: return 'First Floor'
    if 'SF' in unit_no or 'F2' in unit_no: return 'Second Floor'
    if 'TF' in unit_no or 'F3' in unit_no: return 'Third Floor'
    if 'F4' in unit_no: return 'Fourth Floor'
    if 'F5' in unit_no: return 'Fifth Floor'
    if 'F6' in unit_no: return 'Sixth Floor'
    if 'PH' in unit_no: return 'Penthouse'
    return 'Other'

def get_status(row):
    status_code = str(row.get('Status', '')).strip().upper()
    purchaser = str(row.get('Purchased by / Hold by', '')).strip()
    
    if purchaser and purchaser.lower() != 'nan':
        return 'Sold' # Assume sold if purchaser exists
    
    if status_code == 'A': return 'Available'
    if status_code == 'S': return 'Sold'
    if status_code == 'R': return 'Reserved'
    if status_code == 'H': return 'Reserved' # Hold
    
    return 'Available' # Default

def get_type(category):
    cat = str(category).lower()
    if 'shop' in cat: return 'Shop'
    if 'apartment' in cat: return 'Apartment'
    if 'office' in cat: return 'Office'
    return 'Shop' # Default or based on unit?

try:
    df = pd.read_excel("Tower 3 Inventory Sheet.xlsx")
    
    sqls = []
    sqls.append("TRUNCATE TABLE public.inventory;") # Optional: Clear old data? Maybe dangerous. Let's append instead or use ON CONFLICT.
    
    for index, row in df.iterrows():
        unit_no = row['Unit No.']
        if pd.isna(unit_no) or "SHOPS" in str(unit_no) or "APARTMENTS" in str(unit_no):
            continue
            
        unit_no = str(unit_no).strip()
        floor = get_floor(unit_no)
        status = get_status(row)
        size = f"{row['Area']} sq ft" if pd.notna(row['Area']) else "0 sq ft"
        type_val = get_type(row['Category'])
        price = 0 # No price column
        
        # Escape single quotes
        unit_no_sql = unit_no.replace("'", "''")
        floor_sql = floor.replace("'", "''")
        
        sql = f"INSERT INTO public.inventory (unit_number, floor, status, size, type, price) VALUES ('{unit_no_sql}', '{floor_sql}', '{status}', '{size}', '{type_val}', {price}) ON CONFLICT (unit_number) DO UPDATE SET status = EXCLUDED.status, updated_at = now();"
        sqls.append(sql)

    with open("seed_inventory.sql", "w") as f:
        f.write("\n".join(sqls))
        
    print(f"Generated {len(sqls)} insert statements.")

except Exception as e:
    print(f"Error: {e}")
