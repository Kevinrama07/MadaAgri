const logger = require('../utils/logger');

/**
 * Run database migrations on server startup
 * This ensures new columns and tables are created if they don't exist
 */
async function runMigrations(pool) {
  try {
    logger.info('[Migrations] Starting database migrations...');

    // Migration 1: Add polygon_coordinates column to land_parcels if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE land_parcels 
        ADD COLUMN polygon_coordinates JSON DEFAULT NULL
      `);
      logger.info('[Migrations] ✅ Added polygon_coordinates column to land_parcels');
    } catch (err) {
      // Column already exists - this is OK
      if (err.code === 'ER_DUP_FIELDNAME') {
        logger.info('[Migrations] ℹ️  polygon_coordinates column already exists');
      } else {
        throw err;
      }
    }

    logger.info('[Migrations] ✅ All database migrations completed successfully');
  } catch (err) {
    logger.error('[Migrations] ❌ Migration error:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState
    });
    // Don't exit - migrations are not critical for startup
    // But log so admins can see what needs to be fixed
  }
}

module.exports = { runMigrations };
