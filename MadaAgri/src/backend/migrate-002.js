const pool = require('./db');

async function runMigration() {
  try {
    const columns = [
      'language VARCHAR(10) DEFAULT \'fr\'',
      'timezone VARCHAR(50) DEFAULT \'Indian/Antananarivo\'',
      'date_format VARCHAR(20) DEFAULT \'DD/MM/YYYY\'',
      'privacy_settings JSON',
      'notification_settings JSON',
      'two_factor_secret VARCHAR(255) DEFAULT NULL',
      'two_factor_enabled BOOLEAN DEFAULT FALSE',
      'token_version VARCHAR(36) DEFAULT NULL'
    ];

    for (const colDef of columns) {
      const colName = colDef.split(' ')[0];
      
      const [rows] = await pool.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        ['madaagri', 'users', colName]
      );

      if (rows.length === 0) {
        await pool.query(`ALTER TABLE users ADD COLUMN ${colDef}`);
        console.log(`Added column: ${colName}`);
      } else {
        console.log(`Column already exists: ${colName}`);
      }
    }

    console.log('Migration 002 completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
