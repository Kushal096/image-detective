import multer from 'multer';
import { env } from '../config/env.js';

/**
 * In-memory multipart upload handler. Images are processed and discarded — we
 * never write player uploads to disk. Size and mime are bounded up-front; deep
 * content validation happens in the image processor (magic-byte decode).
 */
const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: env.uploads.maxBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (env.uploads.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new MulterImageError('Unsupported file type'));
    }
  },
}).single('image');

export class MulterImageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MulterImageError';
    this.status = 415;
  }
}
