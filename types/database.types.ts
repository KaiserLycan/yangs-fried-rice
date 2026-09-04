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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      add_on: {
        Row: {
          addon_id: string
          name: string
          price: number
          product_id: string | null
        }
        Insert: {
          addon_id?: string
          name: string
          price: number
          product_id?: string | null
        }
        Update: {
          addon_id?: string
          name?: string
          price?: number
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "add_on_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
        ]
      }
      cart: {
        Row: {
          cart_id: string
          customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          cart_id?: string
          customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      cart_item: {
        Row: {
          cart_id: string | null
          cart_item_id: string
          product_id: string | null
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          cart_id?: string | null
          cart_item_id?: string
          product_id?: string | null
          quantity?: number
          special_instructions?: string | null
        }
        Update: {
          cart_id?: string | null
          cart_item_id?: string
          product_id?: string | null
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["cart_id"]
          },
          {
            foreignKeyName: "cart_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
        ]
      }
      cart_item_add_on: {
        Row: {
          addon_id: string | null
          cart_item_add_on_id: string
          cart_item_id: string | null
        }
        Insert: {
          addon_id?: string | null
          cart_item_add_on_id?: string
          cart_item_id?: string | null
        }
        Update: {
          addon_id?: string | null
          cart_item_add_on_id?: string
          cart_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_add_on_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "add_on"
            referencedColumns: ["addon_id"]
          },
          {
            foreignKeyName: "cart_item_add_on_cart_item_id_fkey"
            columns: ["cart_item_id"]
            isOneToOne: false
            referencedRelation: "cart_item"
            referencedColumns: ["cart_item_id"]
          },
        ]
      }
      categories: {
        Row: {
          category_id: string
          category_name: string
        }
        Insert: {
          category_id?: string
          category_name: string
        }
        Update: {
          category_id?: string
          category_name?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          customer_id: string
          email: string | null
          name: string
          phone_number: string | null
        }
        Insert: {
          customer_id?: string
          email?: string | null
          name: string
          phone_number?: string | null
        }
        Update: {
          customer_id?: string
          email?: string | null
          name?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      customer_address: {
        Row: {
          address_details: string
          address_id: string
          customer_id: string | null
          label: string | null
        }
        Insert: {
          address_details: string
          address_id?: string
          customer_id?: string | null
          label?: string | null
        }
        Update: {
          address_details?: string
          address_id?: string
          customer_id?: string | null
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_address_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      delivery: {
        Row: {
          completed_at: string | null
          delivery_id: string
          delivery_status: string | null
          employee_id: string | null
          estimated_time: string | null
          order_id: string | null
          proof_of_delivery: string | null
          rider_id: string | null
        }
        Insert: {
          completed_at?: string | null
          delivery_id?: string
          delivery_status?: string | null
          employee_id?: string | null
          estimated_time?: string | null
          order_id?: string | null
          proof_of_delivery?: string | null
          rider_id?: string | null
        }
        Update: {
          completed_at?: string | null
          delivery_id?: string
          delivery_status?: string | null
          employee_id?: string | null
          estimated_time?: string | null
          order_id?: string | null
          proof_of_delivery?: string | null
          rider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "delivery_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "delivery_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "rider"
            referencedColumns: ["rider_id"]
          },
        ]
      }
      employee: {
        Row: {
          email: string
          employee_id: string
          last_access_log: string | null
          name: string
          role: string | null
          schedule_shift: string | null
        }
        Insert: {
          email: string
          employee_id?: string
          last_access_log?: string | null
          name: string
          role?: string | null
          schedule_shift?: string | null
        }
        Update: {
          email?: string
          employee_id?: string
          last_access_log?: string | null
          name?: string
          role?: string | null
          schedule_shift?: string | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          created_at: string | null
          customer_id: string | null
          is_read: boolean | null
          message: string
          notification_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          is_read?: boolean | null
          message: string
          notification_id?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          is_read?: boolean | null
          message?: string
          notification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      order: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          delivery_fee: number | null
          employee_id: string | null
          order_id: string
          order_status: string | null
          order_type: string | null
          special_instructions: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_fee?: number | null
          employee_id?: string | null
          order_id?: string
          order_status?: string | null
          order_type?: string | null
          special_instructions?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_fee?: number | null
          employee_id?: string | null
          order_id?: string
          order_status?: string | null
          order_type?: string | null
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "order_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      order_item: {
        Row: {
          order_id: string | null
          order_item_id: string
          product_id: string | null
          quantity: number
          special_instructions: string | null
          subtotal: number
        }
        Insert: {
          order_id?: string | null
          order_item_id?: string
          product_id?: string | null
          quantity?: number
          special_instructions?: string | null
          subtotal: number
        }
        Update: {
          order_id?: string | null
          order_item_id?: string
          product_id?: string | null
          quantity?: number
          special_instructions?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_item_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
        ]
      }
      order_item_add_on: {
        Row: {
          addon_id: string | null
          order_item_add_on_id: string
          order_item_id: string | null
        }
        Insert: {
          addon_id?: string | null
          order_item_add_on_id?: string
          order_item_id?: string | null
        }
        Update: {
          addon_id?: string | null
          order_item_add_on_id?: string
          order_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_add_on_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "add_on"
            referencedColumns: ["addon_id"]
          },
          {
            foreignKeyName: "order_item_add_on_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_item"
            referencedColumns: ["order_item_id"]
          },
        ]
      }
      product: {
        Row: {
          category_id: string | null
          is_available: boolean | null
          product_details: string | null
          product_id: string
          product_name: string
          product_price: number
        }
        Insert: {
          category_id?: string | null
          is_available?: boolean | null
          product_details?: string | null
          product_id?: string
          product_name: string
          product_price: number
        }
        Update: {
          category_id?: string | null
          is_available?: boolean | null
          product_details?: string | null
          product_id?: string
          product_name?: string
          product_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      reports: {
        Row: {
          date_range_end: string | null
          date_range_start: string | null
          generated_at: string | null
          generated_by_employee_id: string | null
          report_id: string
          report_type: string | null
          total_gross_sales: number | null
          total_net_sales: number | null
          total_orders_processed: number | null
        }
        Insert: {
          date_range_end?: string | null
          date_range_start?: string | null
          generated_at?: string | null
          generated_by_employee_id?: string | null
          report_id?: string
          report_type?: string | null
          total_gross_sales?: number | null
          total_net_sales?: number | null
          total_orders_processed?: number | null
        }
        Update: {
          date_range_end?: string | null
          date_range_start?: string | null
          generated_at?: string | null
          generated_by_employee_id?: string | null
          report_id?: string
          report_type?: string | null
          total_gross_sales?: number | null
          total_net_sales?: number | null
          total_orders_processed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_employee_id_fkey"
            columns: ["generated_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      review: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_id: string | null
          order_id: string | null
          rating: number | null
          review_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          order_id?: string | null
          rating?: number | null
          review_id?: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          order_id?: string | null
          rating?: number | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "review_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["order_id"]
          },
        ]
      }
      rider: {
        Row: {
          driver_license_number: string | null
          employee_id: string | null
          license_expiry_date: string | null
          rider_id: string
          vehicle_make_model: string | null
          vehicle_plate_number: string | null
        }
        Insert: {
          driver_license_number?: string | null
          employee_id?: string | null
          license_expiry_date?: string | null
          rider_id?: string
          vehicle_make_model?: string | null
          vehicle_plate_number?: string | null
        }
        Update: {
          driver_license_number?: string | null
          employee_id?: string | null
          license_expiry_date?: string | null
          rider_id?: string
          vehicle_make_model?: string | null
          vehicle_plate_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      transaction: {
        Row: {
          discount_amount: number | null
          discount_id_number: string | null
          discount_type: string | null
          order_id: string | null
          payment_method: string | null
          payment_status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_paid: number | null
          transaction_date: string | null
          transaction_id: string
          transaction_type: string | null
        }
        Insert: {
          discount_amount?: number | null
          discount_id_number?: string | null
          discount_type?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_paid?: number | null
          transaction_date?: string | null
          transaction_id?: string
          transaction_type?: string | null
        }
        Update: {
          discount_amount?: number | null
          discount_id_number?: string | null
          discount_type?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_paid?: number | null
          transaction_date?: string | null
          transaction_id?: string
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["order_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
