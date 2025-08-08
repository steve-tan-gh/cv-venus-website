import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  address?: string
  role: "user" | "admin"
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  price: number
  stock: number
  category_id: number
  brand_id: number
  image_url?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  categories?: Category
  brands?: Brand
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo_url?: string
  description?: string
  created_at: string
}

export interface Order {
  id: number
  user_id: string
  total_amount: number
  status: "pending" | "packed" | "shipped" | "delivered" | "cancelled"
  shipping_address: string
  shipping_phone: string
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  profiles?: Profile
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  price: number
  created_at: string
  products?: Product
}

export interface CartItem {
  id: number
  user_id: string
  product_id: number
  quantity: number
  created_at: string
  updated_at: string
  products?: Product
}
