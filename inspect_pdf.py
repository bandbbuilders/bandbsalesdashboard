import pdfplumber

try:
    with pdfplumber.open("Apartment Inventory Tower 3.pdf") as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages[:2]): # Check first 2 pages
            print(f"--- Page {i+1} ---")
            text = page.extract_text()
            print(text)
            print("\nTable extraction (if any):")
            tables = page.extract_tables()
            for table in tables:
                print(table)
except Exception as e:
    print(f"Error reading PDF: {e}")
