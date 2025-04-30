import session from 'express-session';
import pool from '../config/database.js';
import connectPgSimple from 'connect-pg-simple';

const PGStore = connectPgSimple(session);

const sessionStore = new PGStore({
  pool: pool,
  tableName: 'sessions',
  createTableIfMissing: true,
});

export default sessionStore;
