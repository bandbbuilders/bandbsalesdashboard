export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'manager' | 'ceo_coo' | 'executive';
  name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  cnic?: string;
}

export interface Sale {
  id: string;
  customer_id: string;
  customer: Customer;
  agent_id: string;
  agent: User;
  unit_number: string;
  unit_total_price: number;
  status: 'active' | 'completed' | 'defaulted';
  created_at: string;
  updated_at: string;
  payment_plan: PaymentPlan;
}

export interface PaymentPlan {
  downpayment_amount?: number;
  downpayment_due_date?: string;
  monthly_installment: number;
  installment_months: number;
  possession_amount?: number;
  possession_due_date?: string;
}

export interface LedgerEntry {
  id: string;
  sale_id: string;
  due_date: string;
  entry_type: 'downpayment' | 'installment' | 'possession';
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_amount: number;
  paid_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  ledger_entry_id: string;
  sale_id: string;
  agent_id: string;
  due_date: string;
  reminder_date: string;
  is_sent: boolean;
  is_snoozed: boolean;
  snooze_until?: string;
  created_at: string;
}

export interface DashboardStats {
  total_sales_value: number;
  receivables_3_months: number;
  receivables_6_months: number;
  receivables_1_year: number;
  receivables_total: number;
  collections_made: number;
  pending_amount: number;
  overdue_amount: number;
  total_payment_pending: number;
  active_sales_count: number;
  completed_sales_count: number;
}