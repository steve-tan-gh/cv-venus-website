-- First, make sure we have the right extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Now run the main setup script
-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'NvC2ZGJG2Jy0MumJJ8wpjEKrKKo0hVVcy95r0VGS2Wrq0yKn/oQB+RUom3NDmSCOBxXOonYnPi25L9NC7YYI7g==';

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE public.brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status order_status DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table (for persistent cart)
CREATE TABLE public.cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Public read access for products, categories, brands
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view brands" ON brands FOR SELECT USING (true);

-- Admin policies for products, categories, brands
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage brands" ON brands FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert sample data
INSERT INTO categories (name, slug, description) VALUES
('Snacks', 'snacks', 'Delicious snacks and crackers'),
('Biscuits', 'biscuits', 'Sweet and savory biscuits'),
('Drinks', 'drinks', 'Refreshing beverages');

INSERT INTO brands (name, slug, description) VALUES
('Garuda Food', 'garuda-food', 'Premium Indonesian snack brand'),
('Mondelez', 'mondelez', 'International confectionery company'),
('Cleo', 'cleo', 'Pure mineral water brand');

INSERT INTO products (name, slug, description, price, stock, category_id, brand_id, image_url, is_featured) VALUES
-- Snacks
('Garuda Kacang Atom', 'garuda-kacang-atom', 'Crispy peanut snack with original flavor', 15000, 50, 1, 1, '/placeholder.svg?height=300&width=300', true),
('Fullo Wafer Rolls', 'fullo-wafer-rolls', 'Crunchy wafer rolls with chocolate cream', 12000, 30, 1, 1, '/placeholder.svg?height=300&width=300', true),
('Dilan Chocolate Bites', 'dilan-chocolate-bites', 'Rich chocolate bites with premium cocoa', 18000, 25, 1, 2, '/placeholder.svg?height=300&width=300', false),

-- Biscuits
('Oreo Original', 'oreo-original', 'Classic chocolate sandwich cookies', 8000, 100, 2, 2, '/placeholder.svg?height=300&width=300', true),
('Ritz Cheese Crackers', 'ritz-cheese-crackers', 'Buttery crackers with cheese flavor', 10000, 40, 2, 2, '/placeholder.svg?height=300&width=300', false),
('Biskuat Coklat', 'biskuat-coklat', 'Nutritious chocolate biscuits for kids', 6000, 60, 2, 2, '/placeholder.svg?height=300&width=300', true),

-- Drinks
('Cleo Mineral Water 600ml', 'cleo-mineral-water-600ml', 'Pure mineral water in convenient bottle', 3000, 200, 3, 3, '/placeholder.svg?height=300&width=300', false),
('Milo Chocolate Drink', 'milo-chocolate-drink', 'Nutritious chocolate malt drink', 5000, 80, 3, 2, '/placeholder.svg?height=300&width=300', true),
('Teh Pucuk Harum', 'teh-pucuk-harum', 'Refreshing jasmine tea drink', 4000, 120, 3, 1, '/placeholder.svg?height=300&width=300', false);
