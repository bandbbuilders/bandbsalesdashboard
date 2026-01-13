-- HR Module Database Schema

-- Employee profiles extension for HR data
CREATE TABLE public.employee_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cnic text,
  date_of_birth date,
  joining_date date,
  contract_type text DEFAULT 'permanent', -- permanent, contract, probation
  work_location text DEFAULT 'office', -- office, site, hybrid
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  bank_name text,
  bank_account_number text,
  bank_branch text,
  basic_salary numeric DEFAULT 0,
  housing_allowance numeric DEFAULT 0,
  transport_allowance numeric DEFAULT 0,
  other_allowances numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Employee documents storage references
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL, -- cnic, offer_letter, nda, experience_letter, other
  document_name text NOT NULL,
  document_url text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Leave types configuration
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  days_per_year integer DEFAULT 0,
  is_paid boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Insert default leave types
INSERT INTO public.leave_types (name, days_per_year, is_paid, color) VALUES
  ('Casual Leave', 12, true, '#10B981'),
  ('Sick Leave', 10, true, '#EF4444'),
  ('Annual Leave', 14, true, '#3B82F6'),
  ('Half Day', 0, true, '#F59E0B'),
  ('Official Duty', 0, true, '#8B5CF6'),
  ('Unpaid Leave', 0, false, '#6B7280');

-- Leave applications
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  leave_type_id uuid REFERENCES public.leave_types(id) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days numeric NOT NULL,
  reason text,
  status text DEFAULT 'pending', -- pending, approved, rejected, cancelled
  applied_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  reviewer_remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Leave balances per employee per year
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  leave_type_id uuid REFERENCES public.leave_types(id) NOT NULL,
  year integer NOT NULL,
  total_days numeric DEFAULT 0,
  used_days numeric DEFAULT 0,
  pending_days numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- Payroll records
CREATE TABLE public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  basic_salary numeric DEFAULT 0,
  allowances numeric DEFAULT 0,
  bonuses numeric DEFAULT 0,
  commission numeric DEFAULT 0,
  gross_salary numeric DEFAULT 0,
  late_deductions numeric DEFAULT 0,
  leave_deductions numeric DEFAULT 0,
  advance_deductions numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,
  total_deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  payment_status text DEFAULT 'pending', -- pending, paid
  payment_date date,
  payment_method text,
  notes text,
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- KPI definitions per role/department
CREATE TABLE public.kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  kpi_name text NOT NULL,
  description text,
  target_value numeric,
  unit text, -- percentage, count, currency
  weight numeric DEFAULT 1, -- weight for scoring
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default KPIs
INSERT INTO public.kpi_definitions (department, kpi_name, description, target_value, unit, weight) VALUES
  ('Sales', 'Leads Generated', 'Number of new leads per month', 50, 'count', 1),
  ('Sales', 'Deals Closed', 'Number of sales closed per month', 5, 'count', 2),
  ('Sales', 'Revenue Generated', 'Total revenue from sales', 5000000, 'currency', 3),
  ('Marketing', 'Social Media Reach', 'Total reach across platforms', 100000, 'count', 1),
  ('Marketing', 'Leads from Campaigns', 'Leads generated from marketing', 30, 'count', 2),
  ('Marketing', 'Engagement Rate', 'Average engagement percentage', 5, 'percentage', 1),
  ('Operations', 'Projects Completed', 'Number of milestones achieved', 10, 'count', 2),
  ('Operations', 'On-Time Delivery', 'Percentage of on-time deliveries', 90, 'percentage', 2),
  ('HR', 'Hiring Turnaround', 'Days to fill positions', 30, 'count', 1),
  ('HR', 'Employee Satisfaction', 'Satisfaction score percentage', 80, 'percentage', 2),
  ('Accounting', 'Invoice Processing', 'Invoices processed per month', 100, 'count', 1),
  ('Accounting', 'Report Accuracy', 'Accuracy percentage', 99, 'percentage', 2);

-- Employee KPI scores
CREATE TABLE public.employee_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  kpi_id uuid REFERENCES public.kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  achieved_value numeric DEFAULT 0,
  score numeric DEFAULT 0, -- calculated score out of 100
  manager_remarks text,
  self_remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, kpi_id, month, year)
);

-- Monthly performance summary
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employee_details(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  overall_score numeric DEFAULT 0,
  manager_remarks text,
  self_assessment text,
  goals_next_month text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  status text DEFAULT 'pending', -- pending, completed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, month, year)
);

-- Enable RLS
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies (HR department only access for most)
-- Employee details - HR can manage all, employees can view their own
CREATE POLICY "HR can manage employee details" ON public.employee_details
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own details" ON public.employee_details
  FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Employee documents
CREATE POLICY "HR can manage documents" ON public.employee_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own documents" ON public.employee_documents
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Leave types - everyone can view
CREATE POLICY "Everyone can view leave types" ON public.leave_types
  FOR SELECT USING (true);

CREATE POLICY "HR can manage leave types" ON public.leave_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

-- Leave applications
CREATE POLICY "HR can manage leave applications" ON public.leave_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can manage own leave applications" ON public.leave_applications
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Leave balances
CREATE POLICY "HR can manage leave balances" ON public.leave_balances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own balances" ON public.leave_balances
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Payroll - HR only
CREATE POLICY "HR can manage payroll" ON public.payroll
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own payroll" ON public.payroll
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- KPI definitions - everyone can view
CREATE POLICY "Everyone can view KPI definitions" ON public.kpi_definitions
  FOR SELECT USING (true);

CREATE POLICY "HR can manage KPI definitions" ON public.kpi_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

-- Employee KPIs
CREATE POLICY "HR can manage employee KPIs" ON public.employee_kpis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own KPIs" ON public.employee_kpis
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Performance reviews
CREATE POLICY "HR can manage performance reviews" ON public.performance_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "Employees can view own performance" ON public.performance_reviews
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employee_details 
      WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Create storage bucket for HR documents
INSERT INTO storage.buckets (id, name, public) VALUES ('hr-documents', 'hr-documents', false);

-- Storage policies for HR documents
CREATE POLICY "HR can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'hr-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "HR can view all HR documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'hr-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

CREATE POLICY "HR can delete documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'hr-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND department = 'HR'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_employee_details_updated_at
  BEFORE UPDATE ON public.employee_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_applications_updated_at
  BEFORE UPDATE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_kpis_updated_at
  BEFORE UPDATE ON public.employee_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
  BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();