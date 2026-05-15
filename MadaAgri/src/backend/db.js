const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'madaagri',

  // Pool + timeouts to prevent requests hanging (fixes 10s API timeouts)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 5000), // ms
  // acquireTimeout is not supported by current mysql2 version; keep pool from hanging via connectTimeout

};


logger.info('[DB Config]', { 
  host: dbConfig.host, 
  port: dbConfig.port, 
  user: dbConfig.user, 
  database: dbConfig.database 
});

const pool = mysql.createPool(dbConfig);

// Test la connexion au démarrage
pool.getConnection()
  .then(conn => {
    logger.info('[DB] Connection pool created successfully');
    conn.release();
  })
  .catch(err => {
    logger.error('[DB] Failed to create connection pool:', { message: err.message, code: err.code });
  });

module.exports = pool;

