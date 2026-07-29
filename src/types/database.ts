/**
 * AUTO-GENERATED DATABASE TYPES
 * Derived from Supabase schema and application validations
 * 
 * Usage: import { Database } from '@/types/database'
 */

export const INCOME_SOURCES = ['salary', 'freelance', 'investment', 'gift', 'other'] as const
export type IncomeSource = typeof INCOME_SOURCES[number]

export const INCOME_SOURCE_LABELS: Record<IncomeSource, string> = {
  salary: 'Salário',
  freelance: 'Freelance',
  investment: 'Investimento',
  gift: 'Presente',
  other: 'Outro',
}

export const INCOME_STATUSES = ['scheduled', 'received'] as const
export type IncomeStatus = typeof INCOME_STATUSES[number]

export type Database = {
  public: {
    Tables: {
      income: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          person_id: string | null
          recurring_income_id: string | null
          description: string
          amount: number
          date: string
          source: IncomeSource
          status: IncomeStatus
          scheduled_for: string | null
          received_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          person_id?: string | null
          recurring_income_id?: string | null
          description: string
          amount: number
          date: string
          source?: IncomeSource
          status?: IncomeStatus
          scheduled_for?: string | null
          received_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          person_id?: string | null
          recurring_income_id?: string | null
          description?: string
          amount?: number
          date?: string
          source?: IncomeSource
          status?: IncomeStatus
          scheduled_for?: string | null
          received_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      cards: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string | null
          closing_day: number
          due_day: number
          limit_amount: number | null
          color: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand?: string | null
          closing_day: number
          due_day: number
          limit_amount?: number | null
          color: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand?: string | null
          closing_day?: number
          due_day?: number
          limit_amount?: number | null
          color?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon: string
          color: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      people: {
        Row: {
          id: string
          user_id: string
          name: string
          relationship: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relationship?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          total_amount: number
          installments_count: number
          type: 'credit' | 'debit' | 'pix' | 'cash'
          day_of_month: number
          start_date: string
          end_date: string | null
          next_run_date: string
          last_run_date: string | null
          active: boolean
          card_id: string | null
          category_id: string | null
          person_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          total_amount: number
          installments_count: number
          type: 'credit' | 'debit' | 'pix' | 'cash'
          day_of_month: number
          start_date: string
          end_date?: string | null
          next_run_date: string
          last_run_date?: string | null
          active?: boolean
          card_id?: string | null
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          total_amount?: number
          installments_count?: number
          type?: 'credit' | 'debit' | 'pix' | 'cash'
          day_of_month?: number
          start_date?: string
          end_date?: string | null
          next_run_date?: string
          last_run_date?: string | null
          active?: boolean
          card_id?: string | null
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      recurring_income: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          source: IncomeSource
          day_of_month: number
          start_date: string
          end_date: string | null
          next_run_date: string
          last_run_date: string | null
          active: boolean
          category_id: string | null
          person_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          source: IncomeSource
          day_of_month: number
          start_date: string
          end_date?: string | null
          next_run_date: string
          last_run_date?: string | null
          active?: boolean
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          source?: IncomeSource
          day_of_month?: number
          start_date?: string
          end_date?: string | null
          next_run_date?: string
          last_run_date?: string | null
          active?: boolean
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          total_amount: number
          installments_count: number
          purchase_date: string
          type: 'credit' | 'debit' | 'pix' | 'cash'
          status: 'posted' | 'scheduled' | 'cancelled'
          scheduled_for: string | null
          posted_at: string | null
          cancelled_at: string | null
          schedule_source: 'manual' | 'recurring'
          recurring_transaction_id: string | null
          card_id: string | null
          category_id: string | null
          person_id: string | null
          notes: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          total_amount: number
          installments_count: number
          purchase_date: string
          type: 'credit' | 'debit' | 'pix' | 'cash'
          status?: 'posted' | 'scheduled' | 'cancelled'
          scheduled_for?: string | null
          posted_at?: string | null
          cancelled_at?: string | null
          schedule_source?: 'manual' | 'recurring'
          recurring_transaction_id?: string | null
          card_id?: string | null
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          total_amount?: number
          installments_count?: number
          purchase_date?: string
          type?: 'credit' | 'debit' | 'pix' | 'cash'
          status?: 'posted' | 'scheduled' | 'cancelled'
          scheduled_for?: string | null
          posted_at?: string | null
          cancelled_at?: string | null
          schedule_source?: 'manual' | 'recurring'
          recurring_transaction_id?: string | null
          card_id?: string | null
          category_id?: string | null
          person_id?: string | null
          notes?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      installments: {
        Row: {
          id: string
          transaction_id: string
          number: number
          amount: number
          reference_month: number
          reference_year: number
          paid: boolean
          paid_at: string | null
          reimbursed: boolean
          reimbursed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          number: number
          amount: number
          reference_month: number
          reference_year: number
          paid?: boolean
          paid_at?: string | null
          reimbursed?: boolean
          reimbursed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          number?: number
          amount?: number
          reference_month?: number
          reference_year?: number
          paid?: boolean
          paid_at?: string | null
          reimbursed?: boolean
          reimbursed_at?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: {
      transaction_type: 'credit' | 'debit' | 'pix' | 'cash'
      transaction_status: 'posted' | 'scheduled' | 'cancelled'
      transaction_schedule_source: 'manual' | 'recurring'
    }
  }
}

/**
 * TYPE ALIASES FOR CONVENIENCE
 * Use these in your code instead of Database['public']['Tables']['...']['Row']
 */

export type Card = Database['public']['Tables']['cards']['Row']
export type CardInsert = Database['public']['Tables']['cards']['Insert']
export type CardUpdate = Database['public']['Tables']['cards']['Update']

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Person = Database['public']['Tables']['people']['Row']
export type PersonInsert = Database['public']['Tables']['people']['Insert']
export type PersonUpdate = Database['public']['Tables']['people']['Update']

export type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']
export type RecurringTransactionInsert = Database['public']['Tables']['recurring_transactions']['Insert']
export type RecurringTransactionUpdate = Database['public']['Tables']['recurring_transactions']['Update']

export type RecurringIncome = Database['public']['Tables']['recurring_income']['Row']
export type RecurringIncomeInsert = Database['public']['Tables']['recurring_income']['Insert']
export type RecurringIncomeUpdate = Database['public']['Tables']['recurring_income']['Update']

export type RecurringIncomeWithRelations = RecurringIncome & {
  categories: { id: string; name: string; icon: string; color: string } | null
  people: { id: string; name: string } | null
}

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type Income = Database['public']['Tables']['income']['Row']
export type IncomeInsert = Database['public']['Tables']['income']['Insert']
export type IncomeUpdate = Database['public']['Tables']['income']['Update']

export type Installment = Database['public']['Tables']['installments']['Row']
export type InstallmentInsert = Database['public']['Tables']['installments']['Insert']
export type InstallmentUpdate = Database['public']['Tables']['installments']['Update']
