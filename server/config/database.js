import pg from 'pg';
import 'dotenv/config';
import { parseConnectionString } from '../utils/dbConnectionParser.js';

// Determine database configuration method - connection string or individual parameters
const connectionString = process.env.DATABASE_URL;
let dbConfig = {};

if (connectionString) {
  // Use connection string if available
  dbConfig = parseConnectionString(connectionString);
} else {
  // Fall back to individual parameters
  dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  };
}

// Create the connection pool
const pool = new pg.Pool({
  ...dbConfig,
  max: dbConfig.maxConnections || parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
});

const oldQuery = pool.query;
pool.query = function (...args) {
  const [sql, params] = args;
  console.log(`EXECUTING QUERY |`, sql, params);
  return oldQuery.apply(pool, args);
};

export default pool;
