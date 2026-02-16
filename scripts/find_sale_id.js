const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ujxorwgjxybkgmzlmxmd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeG9yd2dqeHlia2dtemxteG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MzIxMzgsImV4cCI6MjA3MTUwODEzOH0.4sJBEisTk_wITsDDqEoZOKUlboXqc6eQlWUVGly1G8A";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function findSaleId() {
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .ilike('name', '%Syed Fawad Hussain%')
        .single();

    if (customerError) {
        console.error('Error finding customer:', customerError);
        return;
    }

    if (!customer) {
        console.log('Customer not found');
        return;
    }

    console.log(`Found Customer: ${customer.name} (${customer.id})`);

    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('id, unit_number')
        .eq('customer_id', customer.id)
        .single();

    if (saleError) {
        console.error('Error finding sale:', saleError);
        return;
    }

    if (!sale) {
        console.log('Sale not found for customer');
        return;
    }

    console.log(`Found Sale ID: ${sale.id} for Unit: ${sale.unit_number}`);
}

findSaleId();
