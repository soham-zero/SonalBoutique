export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: number
          custom_code: string
          name: string
          current_quantity: number
          selling_price: number
        }
        Insert: {
          id?: number
          custom_code: string
          name: string
          current_quantity?: number
          selling_price: number
        }
        Update: {
          id?: number
          custom_code?: string
          name?: string
          current_quantity?: number
          selling_price?: number
        }
      }
      inventory_ledger: {
        Row: {
          id: number
          inventory_id: number
          quantity_added: number
          cost_price: number
          date_time: string
        }
        Insert: {
          id?: number
          inventory_id: number
          quantity_added: number
          cost_price: number
          date_time?: string
        }
        Update: {
          id?: number
          inventory_id?: number
          quantity_added?: number
          cost_price?: number
          date_time?: string
        }
      }
      transactions: {
        Row: {
          id: number
          transaction_number: number
          customer_name: string | null
          customer_phone: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount: number
          discount_amount: number
          amount_paid: number
          date_time: string
        }
        Insert: {
          id?: number
          transaction_number?: number
          customer_name?: string | null
          customer_phone?: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount: number
          discount_amount?: number
          amount_paid: number
          date_time?: string
        }
        Update: {
          id?: number
          transaction_number?: number
          customer_name?: string | null
          customer_phone?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount?: number
          discount_amount?: number
          amount_paid?: number
          date_time?: string
        }
      }
      bill_items: {
        Row: {
          id: number
          transaction_id: number
          inventory_id: number
          quantity: number
          price_sold_at: number
          discount: number
          amount: number
        }
        Insert: {
          id?: number
          transaction_id: number
          inventory_id: number
          quantity: number
          price_sold_at: number
          discount?: number
          amount: number
        }
        Update: {
          id?: number
          transaction_id?: number
          inventory_id?: number
          quantity?: number
          price_sold_at?: number
          discount?: number
          amount?: number
        }
      }
      job_items: {
        Row: {
          id: number
          transaction_id: number
          charge: number
          cloth_provided_by: Database["public"]["Enums"]["cloth_provided_enum"]
          status: Database["public"]["Enums"]["job_status_enum"]
          due_date: string | null
        }
        Insert: {
          id?: number
          transaction_id: number
          charge: number
          cloth_provided_by: Database["public"]["Enums"]["cloth_provided_enum"]
          status?: Database["public"]["Enums"]["job_status_enum"]
          due_date?: string | null
        }
        Update: {
          id?: number
          transaction_id?: number
          charge?: number
          cloth_provided_by?: Database["public"]["Enums"]["cloth_provided_enum"]
          status?: Database["public"]["Enums"]["job_status_enum"]
          due_date?: string | null
        }
      }
      job_item_ledger: {
        Row: {
          id: number
          job_item_id: number
          employee_id: number | null
          employee_name: string
          work: Database["public"]["Enums"]["job_status_enum"]
          changed_at: string
        }
        Insert: {
          id?: number
          job_item_id: number
          employee_id?: number | null
          employee_name: string
          work: Database["public"]["Enums"]["job_status_enum"]
          changed_at?: string
        }
        Update: {
          id?: number
          job_item_id?: number
          employee_id?: number | null
          employee_name?: string
          work?: Database["public"]["Enums"]["job_status_enum"]
          changed_at?: string
        }
      }
      employees: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      job_work_inventory: {
        Row: {
          id: number
          custom_code: string
          name: string
          current_quantity: number
          unit: Database["public"]["Enums"]["unit_enum"]
        }
        Insert: {
          id?: number
          custom_code: string
          name: string
          current_quantity?: number
          unit: Database["public"]["Enums"]["unit_enum"]
        }
        Update: {
          id?: number
          custom_code?: string
          name?: string
          current_quantity?: number
          unit?: Database["public"]["Enums"]["unit_enum"]
        }
      }
      job_work_inventory_purchases: {
        Row: {
          id: number
          job_work_inventory_id: number
          quantity_added: number
          cost_price: number
          date_time: string
          notes: string | null
        }
        Insert: {
          id?: number
          job_work_inventory_id: number
          quantity_added: number
          cost_price: number
          date_time?: string
          notes?: string | null
        }
        Update: {
          id?: number
          job_work_inventory_id?: number
          quantity_added?: number
          cost_price?: number
          date_time?: string
          notes?: string | null
        }
      }
      job_work_inventory_audits: {
        Row: {
          id: number
          job_work_inventory_id: number
          previous_quantity: number
          current_quantity: number
          consumed: number
          date_time: string
          notes: string | null
        }
        Insert: {
          id?: number
          job_work_inventory_id: number
          previous_quantity: number
          current_quantity: number
          consumed: number
          date_time?: string
          notes?: string | null
        }
        Update: {
          id?: number
          job_work_inventory_id?: number
          previous_quantity?: number
          current_quantity?: number
          consumed?: number
          date_time?: string
          notes?: string | null
        }
      }
      expenses: {
        Row: {
          id: number
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          category: Database["public"]["Enums"]["expense_category_enum"]
          description: string | null
          amount: number
          date_time: string
        }
        Insert: {
          id?: number
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          category: Database["public"]["Enums"]["expense_category_enum"]
          description?: string | null
          amount: number
          date_time?: string
        }
        Update: {
          id?: number
          expense_type?: Database["public"]["Enums"]["expense_type_enum"]
          category?: Database["public"]["Enums"]["expense_category_enum"]
          description?: string | null
          amount?: number
          date_time?: string
        }
      }
      customers: {
        Row: {
          id: number
          name: string
          phone: string
          total_billed: number
          total_paid: number
          balance: number
        }
        Insert: {
          id?: number
          name: string
          phone: string
          total_billed?: number
          total_paid?: number
          balance?: number
        }
        Update: {
          id?: number
          name?: string
          phone?: string
          total_billed?: number
          total_paid?: number
          balance?: number
        }
      }
      customer_balance_ledger: {
        Row: {
          id: number
          customer_id: number
          transaction_id: number | null
          amount_billed: number
          amount_paid: number
          due: number
          date_time: string
        }
        Insert: {
          id?: number
          customer_id: number
          transaction_id?: number | null
          amount_billed: number
          amount_paid: number
          due: number
          date_time?: string
        }
        Update: {
          id?: number
          customer_id?: number
          transaction_id?: number | null
          amount_billed?: number
          amount_paid?: number
          due?: number
          date_time?: string
        }
      }
      bishi: {
        Row: {
          id: number
          name: string
          contribution_amount: number
          total_members: number
          started_at: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          name: string
          contribution_amount: number
          total_members: number
          started_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          name?: string
          contribution_amount?: number
          total_members?: number
          started_at?: string | null
          notes?: string | null
        }
      }
      bishi_members: {
        Row: {
          id: number
          bishi_id: number
          name: string
          phone: string | null
          total_contributed: number
          total_redeemed: number
          balance: number
          last_updated: string | null
          joined_at: string
        }
        Insert: {
          id?: number
          bishi_id: number
          name: string
          phone?: string | null
          total_contributed?: number
          total_redeemed?: number
          balance?: number
          last_updated?: string | null
          joined_at?: string
        }
        Update: {
          id?: number
          bishi_id?: number
          name?: string
          phone?: string | null
          total_contributed?: number
          total_redeemed?: number
          balance?: number
          last_updated?: string | null
          joined_at?: string
        }
      }
      bishi_ledger: {
        Row: {
          id: number
          bishi_id: number
          bishi_member_id: number
          contribution_amount: number
          notes: string | null
          date_time: string
        }
        Insert: {
          id?: number
          bishi_id: number
          bishi_member_id: number
          contribution_amount: number
          notes?: string | null
          date_time?: string
        }
        Update: {
          id?: number
          bishi_id?: number
          bishi_member_id?: number
          contribution_amount?: number
          notes?: string | null
          date_time?: string
        }
      }
      bishi_sales: {
        Row: {
          id: number
          transaction_id: number
          bishi_id: number
          bishi_member_id: number
          redeemed: number
          date_time: string
        }
        Insert: {
          id?: number
          transaction_id: number
          bishi_id: number
          bishi_member_id: number
          redeemed: number
          date_time?: string
        }
        Update: {
          id?: number
          transaction_id?: number
          bishi_id?: number
          bishi_member_id?: number
          redeemed?: number
          date_time?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_mode_enum: "cash" | "upi" | "split" | "credit" | "debit"
      cloth_provided_enum: "customer" | "boutique"
      job_status_enum: "ordered" | "preparation" | "cutting" | "stitching" | "finishing" | "ironing" | "complete"
      unit_enum: "metres" | "pieces"
      expense_type_enum: "capex" | "opex"
      expense_category_enum: "salary" | "electricity" | "grocery" | "maintenance" | "transport" | "advertisement" | "miscellaneous"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
