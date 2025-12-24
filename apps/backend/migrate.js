import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  try {
    console.log('Creating tables...');
    
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created users table');

    // Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created categories table');

    // Foods table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        description TEXT,
        image VARCHAR(255),
        price INTEGER,
        categories_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created foods table');

    // Barcodes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS barcodes (
        id SERIAL PRIMARY KEY,
        table_number VARCHAR(10),
        image VARCHAR(255),
        qr_value VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created barcodes table');

    // Transactions table
    await pool.query(`
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
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created transactions table');

    // Transaction items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        foods_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
        quantity INTEGER,
        price INTEGER,
        subtotal INTEGER,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
    console.log('✓ Created transaction_items table');

    console.log('\n✅ All tables created successfully!');

    // Create admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (name, email, password, role) 
      VALUES ('Admin', 'admin@menu.com', $1, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    console.log('✓ Admin user created (email: admin@menu.com, password: admin123)');

    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
