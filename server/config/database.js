import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
  ssl: {
    rejectUnauthorized: true,
  },
  //   ssl: false,
});

const oldQuery = pool.query;
pool.query = function (...args) {
  const [sql, params] = args;
  console.log(`EXECUTING QUERY |`, sql, params);
  return oldQuery.apply(pool, args);
};

export default pool;
