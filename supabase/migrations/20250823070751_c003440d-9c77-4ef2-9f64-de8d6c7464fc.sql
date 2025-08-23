-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users/agents table (for agents, admins, etc.)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agent', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  unit_number TEXT NOT NULL,
  unit_total_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment plans table
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  downpayment_amount DECIMAL(12,2),
  downpayment_due_date DATE,
  monthly_installment DECIMAL(12,2),
  installment_months INTEGER,
  possession_amount DECIMAL(12,2),
  possession_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ledger entries table
CREATE TABLE public.ledger_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('downpayment', 'installment', 'possession', 'custom')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Users can view all customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Users can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Users can delete customers" ON public.customers FOR DELETE USING (true);

-- Create policies for users
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update users" ON public.users FOR UPDATE USING (true);

-- Create policies for sales
CREATE POLICY "Users can view all sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Users can insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Users can delete sales" ON public.sales FOR DELETE USING (true);

-- Create policies for payment plans
CREATE POLICY "Users can view payment plans" ON public.payment_plans FOR SELECT USING (true);
CREATE POLICY "Users can insert payment plans" ON public.payment_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update payment plans" ON public.payment_plans FOR UPDATE USING (true);
CREATE POLICY "Users can delete payment plans" ON public.payment_plans FOR DELETE USING (true);

-- Create policies for ledger entries
CREATE POLICY "Users can view ledger entries" ON public.ledger_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert ledger entries" ON public.ledger_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ledger entries" ON public.ledger_entries FOR UPDATE USING (true);
CREATE POLICY "Users can delete ledger entries" ON public.ledger_entries FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON public.ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_agent_id ON public.sales(agent_id);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_payment_plans_sale_id ON public.payment_plans(sale_id);
CREATE INDEX idx_ledger_entries_sale_id ON public.ledger_entries(sale_id);
CREATE INDEX idx_ledger_entries_due_date ON public.ledger_entries(due_date);
CREATE INDEX idx_ledger_entries_status ON public.ledger_entries(status);