import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory path (backend/uploads)
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Allowed file extensions and mime types
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4'];
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4',
  'video/mp4',
  'application/octet-stream' // fallback for some browsers uploading m4a
];

// Configure Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique random string + timestamp + clean original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `meeting-${uniqueSuffix}-${cleanName}${ext}`);
  }
});

// File Filter Function
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  const isExtensionValid = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype) || file.mimetype.startsWith('audio/');

  if (isExtensionValid || isMimeTypeValid) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file type '${ext}'. Please upload an MP3, WAV, M4A, or MP4 file.`);
    error.status = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Multer Upload Instance with 100MB Limit
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB in bytes
    files: 1
  }
});

export default upload;
