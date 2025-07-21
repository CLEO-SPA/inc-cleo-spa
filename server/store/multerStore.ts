import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Request } from 'express';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, '..', '..', 'seed', 'temp'); // Temporary directory

// Create temp directory if it doesn't exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Common storage configuration for temporary saving
const temp_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir); // Save all uploads to the temp directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent collisions
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('[Multer Filter] Processing file:', file.originalname, 'MIME type:', file.mimetype);
  if (file.mimetype === 'text/csv') {
    console.log('[Multer Filter] Accepted file:', file.originalname);
    cb(null, true);
  } else {
    console.log('[Multer Filter] Rejected file:', file.originalname, 'due to incorrect MIME type:', file.mimetype);
    cb(new Error('Invalid file type. Only .csv files are allowed. Received: ' + file.mimetype));
  }
};

export const preUpload = multer({ storage: temp_storage, fileFilter: fileFilter });
export const postUpload = multer({ storage: temp_storage, fileFilter: fileFilter });

export const preSeedDir = path.join(__dirname, '..', '..', 'seed', 'pre');
export const postSeedDir = path.join(__dirname, '..', '..', 'seed', 'post');

// Ensure base pre and post seed directories exist
if (!fs.existsSync(preSeedDir)) {
  fs.mkdirSync(preSeedDir, { recursive: true });
}
if (!fs.existsSync(postSeedDir)) {
  fs.mkdirSync(postSeedDir, { recursive: true });
}
