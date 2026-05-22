const pool = require('./db');

async function runMigration() {
  try {
    console.log('Starting migration 003: Schema fixes and indexes...');

    // 1. Fix notifications table: user_id and actor_id should be VARCHAR(36) to match UUID users
    const [notifCols] = await pool.query(
      'SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?, ?)',
      ['madaagri', 'notifications', 'user_id', 'actor_id']
    );
    
    for (const col of notifCols) {
      if (col.DATA_TYPE === 'int') {
        await pool.query(`ALTER TABLE notifications MODIFY COLUMN ${col.COLUMN_NAME} VARCHAR(36)`);
        console.log(`Fixed notifications.${col.COLUMN_NAME}: INT -> VARCHAR(36)`);
      }
    }

    // 2. Fix notification_preferences.user_id
    const [notifPrefCols] = await pool.query(
      'SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['madaagri', 'notification_preferences', 'user_id']
    );
    if (notifPrefCols.length > 0 && notifPrefCols[0].DATA_TYPE === 'int') {
      await pool.query('ALTER TABLE notification_preferences MODIFY COLUMN user_id VARCHAR(36)');
      console.log('Fixed notification_preferences.user_id: INT -> VARCHAR(36)');
    }

    // 3. Fix land_parcels.user_id
    const [parcelCols] = await pool.query(
      'SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['madaagri', 'land_parcels', 'user_id']
    );
    if (parcelCols.length > 0 && parcelCols[0].DATA_TYPE === 'int') {
      await pool.query('ALTER TABLE land_parcels MODIFY COLUMN user_id VARCHAR(36)');
      console.log('Fixed land_parcels.user_id: INT -> VARCHAR(36)');
    }

    // 4. Fix crop_analysis_results.user_id
    const [cropCols] = await pool.query(
      'SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['madaagri', 'crop_analysis_results', 'user_id']
    );
    if (cropCols.length > 0 && cropCols[0].DATA_TYPE === 'int') {
      await pool.query('ALTER TABLE crop_analysis_results MODIFY COLUMN user_id VARCHAR(36)');
      console.log('Fixed crop_analysis_results.user_id: INT -> VARCHAR(36)');
    }

    // 5. Add missing indexes on follows table
    const followIndexes = [
      { name: 'idx_follower_id', column: 'follower_id' },
      { name: 'idx_followee_id', column: 'followee_id' }
    ];

    for (const idx of followIndexes) {
      const [existing] = await pool.query(
        'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
        ['madaagri', 'follows', idx.name]
      );
      if (existing.length === 0) {
        await pool.query(`ALTER TABLE follows ADD INDEX ${idx.name} (${idx.column})`);
        console.log(`Added index: follows.${idx.name}`);
      }
    }

    // 6. Add missing indexes on collaboration_invitations table
    const collabIndexes = [
      { name: 'idx_sender_id', column: 'sender_id' },
      { name: 'idx_recipient_id', column: 'recipient_id' },
      { name: 'idx_status', column: 'status' }
    ];

    for (const idx of collabIndexes) {
      const [existing] = await pool.query(
        'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
        ['madaagri', 'collaboration_invitations', idx.name]
      );
      if (existing.length === 0) {
        await pool.query(`ALTER TABLE collaboration_invitations ADD INDEX ${idx.name} (${idx.column})`);
        console.log(`Added index: collaboration_invitations.${idx.name}`);
      }
    }

    // 7. Add index on messages table for conversation lookups
    const [msgIdx] = await pool.query(
      'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
      ['madaagri', 'messages', 'idx_conversation_id']
    );
    if (msgIdx.length === 0) {
      await pool.query('ALTER TABLE messages ADD INDEX idx_conversation_id (conversation_id)');
      console.log('Added index: messages.idx_conversation_id');
    }

    // 8. Add index on posts table for author lookups
    const [postIdx] = await pool.query(
      'SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
      ['madaagri', 'posts', 'idx_author_id']
    );
    if (postIdx.length === 0) {
      await pool.query('ALTER TABLE posts ADD INDEX idx_author_id (author_id)');
      console.log('Added index: posts.idx_author_id');
    }

    console.log('Migration 003 completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
