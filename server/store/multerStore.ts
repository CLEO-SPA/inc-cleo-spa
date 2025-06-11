import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Request } from 'express'; // Ensure Request is imported

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preSeedDir = path.join(__dirname, '..', '..', 'seed', 'pre');
const postSeedDir = path.join(__dirname, '..', '..', 'seed', 'post');

// Create directories if they don't exist
if (!fs.existsSync(preSeedDir)) {
  fs.mkdirSync(preSeedDir, { recursive: true });
}
if (!fs.existsSync(postSeedDir)) {
  fs.mkdirSync(postSeedDir, { recursive: true });
}

const pre_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, preSeedDir);
  },
  filename: function (req, file, cb) {
    // Using file.originalname means if a file with the same name is uploaded, it will be overwritten.
    cb(null, file.originalname);
  },
});

const post_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postSeedDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
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

export const preUpload = multer({ storage: pre_storage, fileFilter: fileFilter });
export const postUpload = multer({ storage: post_storage, fileFilter: fileFilter });
