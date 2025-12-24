-- ============================
-- Menu Digital - Database Schema for Supabase
-- ============================

-- 1. Users Table (Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Foods Table (Menu Items)
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    image VARCHAR(255),
    price INTEGER,
    categories_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Barcodes Table (QR Codes for Tables)
CREATE TABLE IF NOT EXISTS barcodes (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10),
    image VARCHAR(255),
    qr_value VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50),
    name VARCHAR(100),
    phone VARCHAR(20),
    external_id VARCHAR(100),
    checkout_link VARCHAR(255),
    barcode_id INTEGER REFERENCES barcodes(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    total INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Transaction Items Table
CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    foods_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
    quantity INTEGER,
    price INTEGER,
    subtotal INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- Create Indexes for Performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_foods_categories ON foods(categories_id);
CREATE INDEX IF NOT EXISTS idx_transactions_barcode ON transactions(barcode_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_food ON transaction_items(foods_id);

-- ============================
-- Insert Default Admin User
-- Password: admin123 (hashed with bcrypt)
-- ============================
INSERT INTO users (name, email, password) 
VALUES (
    'Admin',
    'admin@menu.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) ON CONFLICT (email) DO NOTHING;

-- ============================
-- Insert Default Categories
-- ============================
INSERT INTO categories (name) VALUES 
    ('Makanan'),
    ('Minuman'),
    ('Dessert'),
    ('Snack')
ON CONFLICT DO NOTHING;
