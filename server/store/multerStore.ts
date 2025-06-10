import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

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

const filter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

export const preUpload = multer({ storage: pre_storage, fileFilter: filter });
export const postUpload = multer({ storage: post_storage, fileFilter: filter });
