-- ==========================================
-- 1. One-time Sync: Mark existing sales as Sold
-- ==========================================
UPDATE public.inventory
SET status = 'Sold'
WHERE unit_number IN (
    SELECT unit_number
    FROM public.sales
    WHERE status = 'active'
);

-- ==========================================
-- 2. Automate Future Sales: Create Triggers
-- ==========================================

-- Function to handle new sales
CREATE OR REPLACE FUNCTION public.handle_new_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.inventory
    SET status = 'Sold'
    WHERE unit_number = NEW.unit_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new sales
DROP TRIGGER IF EXISTS on_sale_created ON public.sales;
CREATE TRIGGER on_sale_created
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_sale();

-- Function to handle cancelled/deleted sales
CREATE OR REPLACE FUNCTION public.handle_sale_deleted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.inventory
    SET status = 'Available'
    WHERE unit_number = OLD.unit_number;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for deleted sales
DROP TRIGGER IF EXISTS on_sale_deleted ON public.sales;
CREATE TRIGGER on_sale_deleted
AFTER DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_sale_deleted();
