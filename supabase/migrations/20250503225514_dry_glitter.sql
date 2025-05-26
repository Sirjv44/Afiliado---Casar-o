/*
  # Initial Schema Setup for Afiliado Casarão

  1. New Tables
    - profiles: User profile information
    - products: Supplement catalog
    - orders: Customer orders
    - order_items: Individual items in orders
    - commissions: Affiliate earnings
    - training_materials: Sales training content
    - notifications: System notifications

  2. Security
    - Enable RLS on all tables
    - Create appropriate access policies
    - Set up automatic commission calculation

  3. Relationships
    - Link profiles to auth.users
    - Connect orders to profiles and products
    - Associate commissions with orders
*/

-- Create profiles table with admin column
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  cpf text,
  address text,
  pix_key text,
  admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  description text,
  category text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE admin = true
  ));

CREATE POLICY "Admin can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE admin = true
  ));

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES profiles(id) NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_address text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_id);

CREATE POLICY "Users can insert own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = affiliate_id);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0
);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE affiliate_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE affiliate_id = auth.uid()
    )
  );

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  affiliate_id uuid REFERENCES profiles(id) NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Enable RLS for commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Create policies for commissions
CREATE POLICY "Users can view own commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_id);

-- Create training_materials table
CREATE TABLE IF NOT EXISTS training_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  content text,
  category text,
  thumbnail text,
  duration text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for training_materials
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;

-- Create policies for training_materials
CREATE POLICY "Anyone can view training materials"
  ON training_materials
  FOR SELECT
  TO authenticated
  USING (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = affiliate_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = affiliate_id);

-- Function to automatically create commissions on order creation
CREATE OR REPLACE FUNCTION create_commission_for_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO commissions (order_id, affiliate_id, amount, status)
  VALUES (NEW.id, NEW.affiliate_id, NEW.total_amount * 0.2, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create commissions automatically
CREATE TRIGGER create_commission_after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_commission_for_order();