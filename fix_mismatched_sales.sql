-- =================================================================
-- Fix Mismatched Sales Records
-- This script manually updates the status of units that have partial 
-- name mismatches between the Sales and Inventory tables.
-- =================================================================

-- 1. Fix Apartments with extra hyphen (e.g., "BT3A-1BED-F-104" -> "BT3A-1BED-F104")
UPDATE public.inventory
SET status = 'Sold'
WHERE unit_number IN (
    SELECT REPLACE(unit_number, '-F-', '-F')
    FROM public.sales
    WHERE unit_number LIKE '%-F-%' AND status = 'active'
);

-- 2. Fix Shops (Manual Mapping based on inspection)

-- Match "BT3S-BFS-G-02" to "BT3S-G02-BF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-G02-BF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-BFS-G-02' AND status = 'active');

-- Match "BT3S-SHOP-G-05" to "BT3S-G05-BF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-G05-BF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-SHOP-G-05' AND status = 'active');

-- Match "BT3S-SHOP-LG-12" to "BT3S-LG12-GF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-LG12-GF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-SHOP-LG-12' AND status = 'active');

-- Match "BT3S-SHOP-G-10" to "BT3S-G10-GF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-G10-GF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-SHOP-G-10' AND status = 'active');

-- Match "BT3S-SHOP-G-11" to "BT3S-G11-GF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-G11-GF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-SHOP-G-11' AND status = 'active');

-- Match "BT3S-SHOP-G-04" to "BT3S-G04-BF"
UPDATE public.inventory 
SET status = 'Sold' 
WHERE unit_number = 'BT3S-G04-BF' 
AND EXISTS (SELECT 1 FROM sales WHERE unit_number = 'BT3S-SHOP-G-04' AND status = 'active');
