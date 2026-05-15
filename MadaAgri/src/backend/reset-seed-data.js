const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const pool = require('./db');

const resetAndSeed = async () => {
  try {
    console.log('[RESET] Deleting all users...');
    await pool.query('DELETE FROM users');
    console.log('[RESET] Users deleted');

    const testUsers = [
      {
        email: 'client@test.com',
        password: 'password123',
        displayName: 'Test Client',
        role: 'client',
      },
      {
        email: 'farmer@test.com',
        password: 'password123',
        displayName: 'Test Farmer',
        role: 'farmer',
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        displayName: 'Test Admin',
        role: 'admin',
      },
    ];

    console.log('[SEED] Creating fresh test users...');
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const id = randomUUID();
      
      await pool.query(
        'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [id, user.email.toLowerCase(), hashedPassword, user.displayName, user.role]
      );
      
      console.log(`[SEED] ✓ Created user: ${user.email}`);
    }

    console.log('[SEED] ✅ Test data reset and seeded successfully!');
    console.log('[SEED] Login credentials:');
    console.log('  Email: client@test.com, Password: password123 (Client)');
    console.log('  Email: farmer@test.com, Password: password123 (Farmer)');
    
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error.message);
    process.exit(1);
  }
};

resetAndSeed();
