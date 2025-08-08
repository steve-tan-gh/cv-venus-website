-- Insert categories
INSERT INTO categories (name, slug, description) VALUES
('Snacks', 'snacks', 'Delicious snacks and crackers'),
('Biscuits', 'biscuits', 'Sweet and savory biscuits'),
('Drinks', 'drinks', 'Refreshing beverages');

-- Insert brands
INSERT INTO brands (name, slug, description) VALUES
('Garuda Food', 'garuda-food', 'Premium Indonesian snack brand'),
('Mondelez', 'mondelez', 'International confectionery company'),
('Cleo', 'cleo', 'Pure mineral water brand');

-- Insert products
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

-- Create admin user (you'll need to sign up first, then update the role)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@cvvenus.com';
