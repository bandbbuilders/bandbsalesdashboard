import pandas as pd
import json

try:
    df = pd.read_excel("Tower 3 Inventory Sheet.xlsx")
    print("Columns:", df.columns.tolist())
    # Convert first 5 rows to json records
    print(df.head().to_json(orient='records', date_format='iso'))
except Exception as e:
    print(f"Error reading excel: {e}")
