const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
};

async function setup() {
  try {
    console.log('[DB Setup] Connecting to MySQL...');
    const conn = await mysql.createConnection(dbConfig);
    console.log('[DB Setup] ✅ Connected!');
    
    console.log('[DB Setup] Reading schema...');
    const schema = fs.readFileSync('./database/madaagri.sql', 'utf8');
    const queries = schema.split(';').map(q => q.trim()).filter(q => q.length > 0);
    
    console.log(`[DB Setup] Executing ${queries.length} queries...`);
    let successCount = 0;
    for (const query of queries) {
      try {
        await conn.query(query);
        successCount++;
      } catch (e) {
        // Log error but continue
        console.log(`[DB Setup] ⚠️  Query failed (usually OK for IF NOT EXISTS):`, e.code);
      }
    }
    
    console.log(`[DB Setup] ✅ Database setup complete! (${successCount}/${queries.length} successful)`);
    await conn.end();
  } catch (err) {
    console.error('[DB Setup] ❌ Error:', err.message);
    process.exit(1);
  }
}

setup();