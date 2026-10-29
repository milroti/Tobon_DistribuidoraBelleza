/**
 * Tipos TypeScript generados a partir del esquema de Supabase.
 * Corresponden a las migraciones 001–005.
 *
 * Nota: Cuando el CLI de Supabase esté disponible, se puede regenerar con:
 *   npx supabase gen types typescript --project-id kzpqsgszrdcgsksckdvq > lib/types/database.ts
 */

// ─── Enums ───────────────────────────────────────────────────
export type UserRole = "admin" | "vendor";

export type PaymentMethod = "cash" | "transfer" | "card";

export type SaleStatus = "completed" | "voided";

export type AuditAction =
  | "product_created"
  | "product_updated"
  | "product_deactivated"
  | "stock_adjusted"
  | "sale_completed"
  | "sale_voided"
  | "customer_created"
  | "customer_updated"
  | "customer_deleted"
  | "price_changed"
  | "user_login"
  | "user_logout";

// ─── Row types (lo que devuelve un SELECT) ───────────────────
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  category_id: string | null;
  brand: string | null;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  cedula: string;
  phone: string;
  email: string | null;
  consent_at: string;
  consent_ip: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  receipt_number: number;
  seller_id: string;
  customer_id: string | null;
  payment_method: PaymentMethod;
  subtotal: number;
  total: number;
  status: SaleStatus;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface InventoryAdjustment {
  id: string;
  product_id: string;
  adjusted_by: string;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Insert types (campos requeridos al crear) ───────────────
export type ProfileInsert = Omit<Profile, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type CategoryInsert = Omit<Category, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at" | "stock"> & {
  id?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
};

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at" | "is_active"> & {
  id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SaleInsert = Omit<Sale, "id" | "created_at" | "status" | "voided_by" | "voided_at" | "void_reason"> & {
  id?: string;
  status?: SaleStatus;
  created_at?: string;
};

export type SaleItemInsert = Omit<SaleItem, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type InventoryAdjustmentInsert = Omit<InventoryAdjustment, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type AuditLogInsert = Omit<AuditLog, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// ─── Update types (todos opcionales excepto id) ──────────────
export type ProfileUpdate = Partial<Omit<Profile, "id">>;
export type CategoryUpdate = Partial<Omit<Category, "id">>;
export type ProductUpdate = Partial<Omit<Product, "id">>;
export type CustomerUpdate = Partial<Omit<Customer, "id">>;
export type SaleUpdate = Partial<Omit<Sale, "id">>;

// ─── Return types de funciones RPC ───────────────────────────
export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface SalesByHour {
  hour: number;
  sale_count: number;
  total_amount: number;
}

export interface SalesByDay {
  sale_date: string;
  sale_count: number;
  total_amount: number;
}

export interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  sale_count: number;
  total_amount: number;
}

export interface AverageTicket {
  avg_ticket: number;
  total_sales: number;
  total_revenue: number;
}

// ─── Supabase Database type (para tipado del cliente) ────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      sales: {
        Row: Sale;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      sale_items: {
        Row: SaleItem;
        Insert: SaleItemInsert;
        Update: Partial<Omit<SaleItem, "id">>;
      };
      inventory_adjustments: {
        Row: InventoryAdjustment;
        Insert: InventoryAdjustmentInsert;
        Update: Partial<Omit<InventoryAdjustment, "id">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      top_products: {
        Args: { p_from: string; p_to: string; p_limit?: number };
        Returns: TopProduct[];
      };
      sales_by_hour: {
        Args: { p_from: string; p_to: string };
        Returns: SalesByHour[];
      };
      sales_by_day: {
        Args: { p_from: string; p_to: string };
        Returns: SalesByDay[];
      };
      seller_performance: {
        Args: { p_from: string; p_to: string };
        Returns: SellerPerformance[];
      };
      average_ticket: {
        Args: { p_from: string; p_to: string };
        Returns: AverageTicket[];
      };
      get_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      payment_method: PaymentMethod;
      sale_status: SaleStatus;
      audit_action: AuditAction;
    };
  };
}
