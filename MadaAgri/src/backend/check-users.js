const pool = require('./db');

const checkUsers = async () => {
  try {
    console.log('[CHECK] Fetching all users...');
    const [rows] = await pool.query('SELECT id, email, display_name, role FROM users');
    console.log('[CHECK] Users in database:');
    rows.forEach(u => {
      console.log(`  - ${u.email} (${u.role}): ${u.display_name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('[CHECK] Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
