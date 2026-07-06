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
          id: string
          custom_code: string
          name: string
          current_quantity: number
          selling_price: number
        }
        Insert: {
          id?: string
          custom_code: string
          name: string
          current_quantity?: number
          selling_price: number
        }
        Update: {
          id?: string
          custom_code?: string
          name?: string
          current_quantity?: number
          selling_price?: number
        }
      }
      employees: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          total_billed: number
          total_paid: number
          balance: number
        }
        Insert: {
          id?: string
          name: string
          phone: string
          total_billed?: number
          total_paid?: number
          balance?: number
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          total_billed?: number
          total_paid?: number
          balance?: number
        }
      }
      bishi: {
        Row: {
          id: string
          name: string
          contribution_amount: number
          total_members: number
          started_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          name: string
          contribution_amount: number
          total_members: number
          started_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          contribution_amount?: number
          total_members?: number
          started_at?: string | null
          notes?: string | null
        }
      }
      job_work_inventory: {
        Row: {
          id: string
          custom_code: string
          name: string
          current_quantity: number
          unit: Database["public"]["Enums"]["unit_enum"]
        }
        Insert: {
          id?: string
          custom_code: string
          name: string
          current_quantity?: number
          unit: Database["public"]["Enums"]["unit_enum"]
        }
        Update: {
          id?: string
          custom_code?: string
          name?: string
          current_quantity?: number
          unit?: Database["public"]["Enums"]["unit_enum"]
        }
      }
      expenses: {
        Row: {
          id: string
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          category: Database["public"]["Enums"]["expense_category_enum"]
          description: string | null
          amount: number
          date_time: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
        }
        Insert: {
          id?: string
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          category: Database["public"]["Enums"]["expense_category_enum"]
          description?: string | null
          amount: number
          date_time?: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
        }
        Update: {
          id?: string
          expense_type?: Database["public"]["Enums"]["expense_type_enum"]
          category?: Database["public"]["Enums"]["expense_category_enum"]
          description?: string | null
          amount?: number
          date_time?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
        }
      }
      inventory_ledger: {
        Row: {
          id: string
          inventory_id: string
          quantity_added: number
          cost_price: number
          date_time: string
        }
        Insert: {
          id?: string
          inventory_id: string
          quantity_added: number
          cost_price: number
          date_time?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          quantity_added?: number
          cost_price?: number
          date_time?: string
        }
      }
      transactions: {
        Row: {
          id: string
          bill_number: string
          customer_id: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount: number
          discount_amount: number
          amount_paid: number
          date_time: string
          status: Database["public"]["Enums"]["transaction_status_enum"]
        }
        Insert: {
          id?: string
          bill_number: string
          customer_id?: string | null
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount: number
          discount_amount?: number
          amount_paid: number
          date_time?: string
          status?: Database["public"]["Enums"]["transaction_status_enum"]
        }
        Update: {
          id?: string
          bill_number?: string
          customer_id?: string | null
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          total_amount?: number
          discount_amount?: number
          amount_paid?: number
          date_time?: string
          status?: Database["public"]["Enums"]["transaction_status_enum"]
        }
      }
      customer_payments: {
        Row: {
          id: string
          customer_id: string
          amount_paid: number
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          payment_date: string
          notes: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          amount_paid: number
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
          payment_date?: string
          notes?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          amount_paid?: number
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
          payment_date?: string
          notes?: string | null
        }
      }
      bishi_members: {
        Row: {
          id: string
          bishi_id: string
          name: string
          phone: string | null
          total_contributed: number
          total_redeemed: number
          balance: number
          joined_at: string
        }
        Insert: {
          id?: string
          bishi_id: string
          name: string
          phone?: string | null
          total_contributed?: number
          total_redeemed?: number
          balance?: number
          joined_at?: string
        }
        Update: {
          id?: string
          bishi_id?: string
          name?: string
          phone?: string | null
          total_contributed?: number
          total_redeemed?: number
          balance?: number
          joined_at?: string
        }
      }
      job_work_inventory_purchases: {
        Row: {
          id: string
          job_work_inventory_id: string
          quantity_added: number
          cost_price: number
          date_time: string
          notes: string | null
        }
        Insert: {
          id?: string
          job_work_inventory_id: string
          quantity_added: number
          cost_price: number
          date_time?: string
          notes?: string | null
        }
        Update: {
          id?: string
          job_work_inventory_id?: string
          quantity_added?: number
          cost_price?: number
          date_time?: string
          notes?: string | null
        }
      }
      job_work_inventory_audits: {
        Row: {
          id: string
          job_work_inventory_id: string
          consumed: number
          date_time: string
          notes: string | null
        }
        Insert: {
          id?: string
          job_work_inventory_id: string
          consumed: number
          date_time?: string
          notes?: string | null
        }
        Update: {
          id?: string
          job_work_inventory_id?: string
          consumed?: number
          date_time?: string
          notes?: string | null
        }
      }
      bill_items: {
        Row: {
          id: string
          transaction_id: string
          inventory_id: string
          quantity: number
          price_sold_at: number
          amount: number
        }
        Insert: {
          id?: string
          transaction_id: string
          inventory_id: string
          quantity: number
          price_sold_at: number
          amount: number
        }
        Update: {
          id?: string
          transaction_id?: string
          inventory_id?: string
          quantity?: number
          price_sold_at?: number
          amount?: number
        }
      }
      job_items: {
        Row: {
          id: string
          transaction_id: string
          name: string
          description: string | null
          charge: number
          cloth_provided_by: Database["public"]["Enums"]["cloth_provided_enum"]
          status: Database["public"]["Enums"]["job_status_enum"]
          due_date: string | null
          quantity: number
          amount: number | null
        }
        Insert: {
          id?: string
          transaction_id: string
          name: string
          description?: string | null
          charge: number
          cloth_provided_by: Database["public"]["Enums"]["cloth_provided_enum"]
          status?: Database["public"]["Enums"]["job_status_enum"]
          due_date?: string | null
          quantity?: number
          amount?: number | null
        }
        Update: {
          id?: string
          transaction_id?: string
          name?: string
          description?: string | null
          charge?: number
          cloth_provided_by?: Database["public"]["Enums"]["cloth_provided_enum"]
          status?: Database["public"]["Enums"]["job_status_enum"]
          due_date?: string | null
          quantity?: number
          amount?: number | null
        }
      }
      bishi_ledger: {
        Row: {
          id: string
          bishi_id: string
          bishi_member_id: string
          contribution_amount: number
          notes: string | null
          date_time: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
        }
        Insert: {
          id?: string
          bishi_id: string
          bishi_member_id: string
          contribution_amount: number
          notes?: string | null
          date_time?: string
          payment_mode: Database["public"]["Enums"]["payment_mode_enum"]
        }
        Update: {
          id?: string
          bishi_id?: string
          bishi_member_id?: string
          contribution_amount?: number
          notes?: string | null
          date_time?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode_enum"]
        }
      }
      bishi_sales: {
        Row: {
          id: string
          transaction_id: string
          bishi_id: string
          bishi_member_id: string
          redeemed: number
          date_time: string
        }
        Insert: {
          id?: string
          transaction_id: string
          bishi_id: string
          bishi_member_id: string
          redeemed: number
          date_time?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          bishi_id?: string
          bishi_member_id?: string
          redeemed?: number
          date_time?: string
        }
      }
      bishi_bill_items: {
        Row: {
          id: string
          bill_item_id: string
          bishi_id: string
          bishi_member_id: string
        }
        Insert: {
          id?: string
          bill_item_id: string
          bishi_id: string
          bishi_member_id: string
        }
        Update: {
          id?: string
          bill_item_id?: string
          bishi_id?: string
          bishi_member_id?: string
        }
      }
      job_item_ledger: {
        Row: {
          id: string
          job_item_id: string
          employee_id: string
          work: Database["public"]["Enums"]["job_status_enum"]
          changed_at: string
        }
        Insert: {
          id?: string
          job_item_id: string
          employee_id: string
          work: Database["public"]["Enums"]["job_status_enum"]
          changed_at?: string
        }
        Update: {
          id?: string
          job_item_id?: string
          employee_id?: string
          work?: Database["public"]["Enums"]["job_status_enum"]
          changed_at?: string
        }
      }
      revisions: {
        Row: {
          id: string
          original_transaction_id: string
          revised_transaction_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          original_transaction_id: string
          revised_transaction_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          original_transaction_id?: string
          revised_transaction_id?: string
          reason?: string | null
          created_at?: string
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
      job_status_enum: "ordered" | "preparation" | "cutting" | "stitching" | "finishing" | "ironing" | "complete" | "delivered" | "cancelled"
      unit_enum: "metres" | "pieces"
      expense_type_enum: "capex" | "opex"
      expense_category_enum: "salary" | "electricity" | "grocery" | "maintenance" | "transport" | "advertisement" | "miscellaneous"
      transaction_status_enum: "ACTIVE" | "CANCELLED" | "REVISED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
