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
const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('[SQLiteService] Error opening SQLite database:', err.message);
  } else {
    console.log('[SQLiteService] Connected to the SQLite database for seed status.');
    initializeDatabase();
  }
});

const initializeDatabase = () => {
  db.serialize(() => {
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
        } else {
          console.log('[SQLiteService] Table active_seed_files is ready.');
        }
      }
    );
  });
};

export const logSeededFile = (
  tableName: string,
  dataType: 'pre' | 'post',
  fileNameWithoutExtension: string,
  fileContentHash: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO active_seed_files (table_name, data_type, file_name, file_content_hash, last_seeded_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(table_name, data_type) DO UPDATE SET
        file_name = excluded.file_name,
        file_content_hash = excluded.file_content_hash,
        last_seeded_at = CURRENT_TIMESTAMP
    `;
    db.run(sql, [tableName, dataType, fileNameWithoutExtension, fileContentHash], function (err) {
      if (err) {
        console.error('[SQLiteService] Error logging seeded file:', err.message);
        reject(err);
      } else {
        console.log(
          `[SQLiteService] Logged: ${dataType}/${tableName}/${fileNameWithoutExtension} (Hash: ${fileContentHash.substring(
            0,
            7
          )})`
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

export const getActiveSeedInfo = (tableName: string, dataType: 'pre' | 'post'): Promise<ActiveSeedInfo | null> => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT file_name, file_content_hash
      FROM active_seed_files
      WHERE table_name = ? AND data_type = ?
    `;
    db.get(sql, [tableName, dataType], (err, row: ActiveSeedInfo) => {
      if (err) {
        console.error('[SQLiteService] Error getting active seed info:', err.message);
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
};

export const clearActiveSeedInfo = (tableName: string, dataType: 'pre' | 'post'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
            DELETE FROM active_seed_files
            WHERE table_name = ? AND data_type = ?
        `;
    db.run(sql, [tableName, dataType], function (err) {
      if (err) {
        console.error('[SQLiteService] Error clearing active seed info:', err.message);
        reject(err);
      } else {
        console.log(`[SQLiteService] Cleared active seed info for ${dataType}/${tableName}`);
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
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => {
      console.error(`[SQLiteService] Error hashing file ${filePath}:`, err);
      reject(err);
    });
  });
};

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('[SQLiteService] Error closing SQLite database:', err.message);
    } else {
      console.log('[SQLiteService] SQLite database connection closed.');
    }
    process.exit(err ? 1 : 0);
  });
});
