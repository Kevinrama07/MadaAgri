const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const pool = require('./db');

const seedTestData = async () => {
  try {
    console.log('[SEED] Starting database seed with test data...');

    // Créer les tables si elles n'existent pas
    console.log('[SEED] Creating tables...');
    
    // Vérifier si les utilisateurs existent déjà
    const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers[0].count;
    
    if (userCount > 0) {
      console.log(`[SEED] Database already contains ${userCount} users. Skipping seed.`);
      process.exit(0);
    }

    // Créer des utilisateurs de test
    const testUsers = [
      {
        email: 'farmer@test.com',
        password: 'password123',
        displayName: 'Jean Agriculteur',
        role: 'farmer',
      },
      {
        email: 'client@test.com',
        password: 'password123',
        displayName: 'Marie Client',
        role: 'client',
      },
      {
        email: 'admin@test.com',
        password: 'password123',
        displayName: 'Admin User',
        role: 'admin',
      },
    ];

    console.log('[SEED] Creating test users...');
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const id = randomUUID();
      
      await pool.query(
        'INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [id, user.email.toLowerCase(), hashedPassword, user.displayName, user.role]
      );
      
      console.log(`[SEED] ✓ Created user: ${user.email} (${user.role})`);
    }

    console.log('[SEED] Test data seed completed successfully!');
    console.log('[SEED] You can now login with:');
    console.log('  - farmer@test.com / password123 (farmer)');
    console.log('  - client@test.com / password123 (client)');
    console.log('  - admin@test.com / password123 (admin)');
    
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error seeding database:', error);
    process.exit(1);
  }
};

seedTestData();
