import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storeDir = path.join(__dirname, '..', '..', 'seed');
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

const dbPath = path.join(storeDir, 'seed_status.db');

let db: sqlite3.Database;
// This promise will resolve when the database is connected and initialized.
let dbReadyPromise: Promise<void> | null = null;

const initializeDatabase = (): Promise<void> => {
  // This function should only be called once.
  if (dbReadyPromise) {
    return dbReadyPromise;
  }

  dbReadyPromise = new Promise((resolve, reject) => {
    const verboseSqlite = sqlite3.verbose();
    db = new verboseSqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('[SQLiteService] Error opening SQLite database:', err.message);
        dbReadyPromise = null; // Allow retry on next call
        return reject(err);
      }
      console.log('[SQLiteService] Connected to the SQLite database for seed status.');

      db.run(
        `
        CREATE TABLE IF NOT EXISTS active_seed_files (
          table_name TEXT NOT NULL,
          data_type TEXT NOT NULL, -- 'pre' or 'post'
          file_name TEXT NOT NULL, -- Name of the file without .csv extension
          file_content_hash TEXT NOT NULL,
          last_seeded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (table_name, data_type)
        )
      `,
        (err) => {
          if (err) {
            console.error('[SQLiteService] Error creating active_seed_files table:', err.message);
            dbReadyPromise = null; // Allow retry
            return reject(err);
          }
          console.log('[SQLiteService] Table active_seed_files is ready.');
          resolve();
        }
      );
    });
  });
  return dbReadyPromise;
};

// This function ensures the DB is ready before any operation.
const getDb = (): Promise<sqlite3.Database> => {
  if (!dbReadyPromise) {
    initializeDatabase();
  }
  // The non-null assertion is safe because initializeDatabase() creates the promise.
  return dbReadyPromise!.then(() => db);
};

export const logSeededFile = async (
  tableName: string,
  dataType: 'pre' | 'post' | 'merged',
  fileNameWithoutExtension: string,
  fileContentHash: string
): Promise<void> => {
  const dbInstance = await getDb();
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO active_seed_files (table_name, data_type, file_name, file_content_hash, last_seeded_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(table_name, data_type) DO UPDATE SET
        file_name = excluded.file_name,
        file_content_hash = excluded.file_content_hash,
        last_seeded_at = CURRENT_TIMESTAMP
    `;
    dbInstance.run(sql, [tableName, dataType, fileNameWithoutExtension, fileContentHash], function (err) {
      if (err) {
        console.error('[SQLiteService] Error logging seeded file:', err.message);
        reject(err);
      } else {
        const shortHash = fileContentHash.substring(0, 7);
        console.log(
          `[SQLiteService] Logged: ${dataType}/${tableName}/${fileNameWithoutExtension} (Hash: ${shortHash})`
        );
        resolve();
      }
    });
  });
};

interface ActiveSeedInfo {
  file_name: string;
  file_content_hash: string;
}

export const getActiveSeedInfo = async (
  tableName: string,
  dataType: 'pre' | 'post' | 'merged'
): Promise<ActiveSeedInfo | null> => {
  const dbInstance = await getDb();
  return new Promise((resolve, reject) => {
    const sql = `SELECT file_name, file_content_hash FROM active_seed_files WHERE table_name = ? AND data_type = ?`;
    dbInstance.get(sql, [tableName, dataType], (err, row: ActiveSeedInfo) => {
      if (err) {
        console.error('[SQLiteService] Error getting active seed info:', err.message);
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

export const clearActiveSeedInfo = async (tableName: string, dataType: 'pre' | 'post' | 'merged'): Promise<void> => {
  const dbInstance = await getDb();
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM active_seed_files WHERE table_name = ? AND data_type = ?`;
    dbInstance.run(sql, [tableName, dataType], function (err) {
      if (err) {
        console.error('[SQLiteService] Error clearing active seed info:', err.message);
        reject(err);
      } else {
        console.log(`[SQLiteService] Cleared active seed info for ${dataType}/${tableName}.`);
        resolve();
      }
    });
  });
};

export const calculateFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`[SQLiteService] File not found for hashing: ${filePath}`));
    }
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`[SQLiteService] Error reading file ${filePath}:`, err);
        return reject(err);
      }
      // Normalize line endings to LF (\n) to ensure consistent hashing across platforms.
      const normalizedData = data.replace(/\r\n/g, '\n');
      const hash = crypto.createHash('sha256').update(normalizedData).digest('hex');
      resolve(hash);
    });
  });
};

process.on('SIGINT', () => {
  if (db) {
    db.close((err) => {
      if (err) {
        return console.error('[SQLiteService] Error closing the database connection:', err.message);
      }
      console.log('[SQLiteService] Closed the database connection.');
    });
  }
});
