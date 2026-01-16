export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string | null
          date: string
          id: string
          is_late: boolean | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_name: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_late?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_name: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_late?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_30_percent: number
          amount_70_percent: number
          created_at: string
          id: string
          notes: string | null
          paid_amount: number | null
          recipient_name: string
          recipient_type: string
          released_30_date: string | null
          released_70_date: string | null
          sale_id: string
          status_30_percent: string
          status_70_percent: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_30_percent: number
          amount_70_percent: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          recipient_name: string
          recipient_type: string
          released_30_date?: string | null
          released_70_date?: string | null
          sale_id: string
          status_30_percent?: string
          status_70_percent?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_30_percent?: number
          amount_70_percent?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          recipient_name?: string
          recipient_type?: string
          released_30_date?: string | null
          released_70_date?: string | null
          sale_id?: string
          status_30_percent?: string
          status_70_percent?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          engagement: number | null
          id: string
          leads: number | null
          platform: string
          reach: number | null
          recorded_at: string
          saves: number | null
          task_id: string | null
        }
        Insert: {
          engagement?: number | null
          id?: string
          leads?: number | null
          platform: string
          reach?: number | null
          recorded_at?: string
          saves?: number | null
          task_id?: string | null
        }
        Update: {
          engagement?: number | null
          id?: string
          leads?: number | null
          platform?: string
          reach?: number | null
          recorded_at?: string
          saves?: number | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_approvals: {
        Row: {
          approver_id: string
          created_at: string
          feedback: string | null
          id: string
          status: string
          task_id: string
          updated_at: string
        }
        Insert: {
          approver_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          approver_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "content_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tasks: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          caption: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          hashtags: string[] | null
          id: string
          platform: string
          priority: string
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string
          priority?: string
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string
          priority?: string
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          subject: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          subject?: string | null
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          subject?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_accounts: {
        Row: {
          created_at: string
          credit_account: string
          debit_account: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_account: string
          debit_account: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_account?: string
          debit_account?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          contact: string
          created_at: string
          email: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_details: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          basic_salary: number | null
          cnic: string | null
          contract_type: string | null
          created_at: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          housing_allowance: number | null
          id: string
          joining_date: string | null
          other_allowances: number | null
          phone_number: string | null
          profile_id: string
          transport_allowance: number | null
          updated_at: string | null
          work_location: string | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          cnic?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          housing_allowance?: number | null
          id?: string
          joining_date?: string | null
          other_allowances?: number | null
          phone_number?: string | null
          profile_id: string
          transport_allowance?: number | null
          updated_at?: string | null
          work_location?: string | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          cnic?: string | null
          contract_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          housing_allowance?: number | null
          id?: string
          joining_date?: string | null
          other_allowances?: number | null
          phone_number?: string | null
          profile_id?: string
          transport_allowance?: number | null
          updated_at?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          document_url: string
          employee_id: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          document_url: string
          employee_id: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          document_url?: string
          employee_id?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_kpis: {
        Row: {
          achieved_value: number | null
          created_at: string | null
          employee_id: string
          id: string
          kpi_id: string
          manager_remarks: string | null
          month: number
          score: number | null
          self_remarks: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          achieved_value?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          kpi_id: string
          manager_remarks?: string | null
          month: number
          score?: number | null
          self_remarks?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          achieved_value?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          kpi_id?: string
          manager_remarks?: string | null
          month?: number
          score?: number | null
          self_remarks?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_kpis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_kpis_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attendance_id: string | null
          created_at: string
          date: string
          id: string
          paid_date: string | null
          reason: string
          status: string
          updated_at: string
          user_name: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attendance_id?: string | null
          created_at?: string
          date: string
          id?: string
          paid_date?: string | null
          reason: string
          status?: string
          updated_at?: string
          user_name: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attendance_id?: string | null
          created_at?: string
          date?: string
          id?: string
          paid_date?: string | null
          reason?: string
          status?: string
          updated_at?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fines_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_scripts: {
        Row: {
          baseline_id: string | null
          created_at: string
          id: string
          prompt: string
          script_content: string
          user_id: string | null
        }
        Insert: {
          baseline_id?: string | null
          created_at?: string
          id?: string
          prompt: string
          script_content: string
          user_id?: string | null
        }
        Update: {
          baseline_id?: string | null
          created_at?: string
          id?: string
          prompt?: string
          script_content?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_scripts_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "script_baselines"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          entries_count: number
          file_name: string
          id: string
          imported_at: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          entries_count?: number
          file_name: string
          id?: string
          imported_at?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          entries_count?: number
          file_name?: string
          id?: string
          imported_at?: string
          total_amount?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          amount: number
          batch_id: string | null
          created_at: string
          credit_account: string
          date: string
          debit_account: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          created_at?: string
          credit_account: string
          date: string
          debit_account: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          created_at?: string
          credit_account?: string
          date?: string
          debit_account?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_definitions: {
        Row: {
          created_at: string | null
          department: string
          description: string | null
          id: string
          kpi_name: string
          target_value: number | null
          unit: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          department: string
          description?: string | null
          id?: string
          kpi_name: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          department?: string
          description?: string | null
          id?: string
          kpi_name?: string
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      lead_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          order_position: number
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          order_position?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          order_position?: number
          updated_at?: string
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: number | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_applications: {
        Row: {
          applied_at: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_remarks: string | null
          start_date: string
          status: string | null
          total_days: number
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_remarks?: string | null
          start_date: string
          status?: string | null
          total_days: number
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_remarks?: string | null
          start_date?: string
          status?: string | null
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_applications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_applications_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          leave_type_id: string
          pending_days: number | null
          total_days: number | null
          updated_at: string | null
          used_days: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          leave_type_id: string
          pending_days?: number | null
          total_days?: number | null
          updated_at?: string | null
          used_days?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          leave_type_id?: string
          pending_days?: number | null
          total_days?: number | null
          updated_at?: string | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          color: string | null
          created_at: string | null
          days_per_year: number | null
          id: string
          is_paid: boolean | null
          name: string
          requires_approval: boolean | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          days_per_year?: number | null
          id?: string
          is_paid?: boolean | null
          name: string
          requires_approval?: boolean | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          days_per_year?: number | null
          id?: string
          is_paid?: boolean | null
          name?: string
          requires_approval?: boolean | null
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          entry_type: string
          id: string
          paid_amount: number | null
          paid_date: string | null
          sale_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          entry_type: string
          id?: string
          paid_amount?: number | null
          paid_date?: string | null
          sale_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          entry_type?: string
          id?: string
          paid_amount?: number | null
          paid_date?: string | null
          sale_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          downpayment_amount: number | null
          downpayment_due_date: string | null
          id: string
          installment_months: number | null
          monthly_installment: number | null
          possession_amount: number | null
          possession_due_date: string | null
          sale_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          downpayment_amount?: number | null
          downpayment_due_date?: string | null
          id?: string
          installment_months?: number | null
          monthly_installment?: number | null
          possession_amount?: number | null
          possession_due_date?: string | null
          sale_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          downpayment_amount?: number | null
          downpayment_due_date?: string | null
          id?: string
          installment_months?: number | null
          monthly_installment?: number | null
          possession_amount?: number | null
          possession_due_date?: string | null
          sale_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          advance_deductions: number | null
          allowances: number | null
          basic_salary: number | null
          bonuses: number | null
          commission: number | null
          created_at: string | null
          employee_id: string
          generated_by: string | null
          gross_salary: number | null
          id: string
          late_deductions: number | null
          leave_deductions: number | null
          month: number
          net_salary: number | null
          notes: string | null
          other_deductions: number | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          total_deductions: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          advance_deductions?: number | null
          allowances?: number | null
          basic_salary?: number | null
          bonuses?: number | null
          commission?: number | null
          created_at?: string | null
          employee_id: string
          generated_by?: string | null
          gross_salary?: number | null
          id?: string
          late_deductions?: number | null
          leave_deductions?: number | null
          month: number
          net_salary?: number | null
          notes?: string | null
          other_deductions?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          total_deductions?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          advance_deductions?: number | null
          allowances?: number | null
          basic_salary?: number | null
          bonuses?: number | null
          commission?: number | null
          created_at?: string | null
          employee_id?: string
          generated_by?: string | null
          gross_salary?: number | null
          id?: string
          late_deductions?: number | null
          leave_deductions?: number | null
          month?: number
          net_salary?: number | null
          notes?: string | null
          other_deductions?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          total_deductions?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          created_at: string | null
          employee_id: string
          goals_next_month: string | null
          id: string
          manager_remarks: string | null
          month: number
          overall_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          self_assessment: string | null
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          goals_next_month?: string | null
          id?: string
          manager_remarks?: string | null
          month: number
          overall_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_assessment?: string | null
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          goals_next_month?: string | null
          id?: string
          manager_remarks?: string | null
          month?: number
          overall_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          self_assessment?: string | null
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          last_seen: string | null
          manager_id: string | null
          position: string | null
          role: string
          salary: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          last_seen?: string | null
          manager_id?: string | null
          position?: string | null
          role: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          last_seen?: string | null
          manager_id?: string | null
          position?: string | null
          role?: string
          salary?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string
          id: string
          lead_id: string | null
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          lead_id?: string | null
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sales: {
        Row: {
          agent_id: string
          created_at: string
          customer_id: string
          id: string
          status: string
          unit_number: string
          unit_total_price: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          unit_number: string
          unit_total_price: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          unit_number?: string
          unit_total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      script_baselines: {
        Row: {
          baseline_content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          baseline_content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          baseline_content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          attachments: Json | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_hr_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "ceo_coo" | "manager" | "executive"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      reminder_type: "call" | "email" | "meeting" | "follow_up" | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ceo_coo", "manager", "executive"],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      reminder_type: ["call", "email", "meeting", "follow_up", "other"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done", "cancelled"],
    },
  },
} as const
