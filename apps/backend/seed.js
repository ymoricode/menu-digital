import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedAdmin() {
  try {
    console.log('Connecting to database...');
    
    // Create password hash
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Delete existing admin user
    await pool.query('DELETE FROM users WHERE email = $1', ['admin@menu.com']);
    console.log('✓ Cleared existing admin user');
    
    // Insert new admin user
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Admin', 'admin@menu.com', hashedPassword, 'admin']
    );
    
    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@menu.com');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedAdmin();
