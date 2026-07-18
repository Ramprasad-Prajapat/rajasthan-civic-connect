import { storage } from '../config/firebaseAdmin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Decodes and uploads base64 file payloads to Firebase Storage or Local Disk.
 */
export const uploadBase64ToStorage = async (base64Data, destinationPath) => {
  if (!base64Data || !base64Data.startsWith('data:')) return base64Data || '';
  
  try {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let rawBase64 = base64Data;
    
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }
    
    const buffer = Buffer.from(rawBase64, 'base64');

    // Attempt to use Firebase Storage if available and not mocked
    try {
      const bucket = storage.bucket();
      const file = bucket.file(destinationPath);
      
      await file.save(buffer, {
        metadata: {
          contentType: mimeType
        }
      });

      try {
        await file.makePublic();
      } catch (e) {
        // Catch permission limits silently and allow standard signed/public urls
      }
      
      return `https://storage.googleapis.com/${bucket.name}/${destinationPath}`;
    } catch (firebaseErr) {
      // Firebase Storage failed or is mocked. Fallback to local storage (short link)
      // Replace slashes with dashes to avoid deep folders
      const extension = mimeType.includes('png') ? '.png' : (mimeType.includes('mp4') ? '.mp4' : '.jpg');
      const safeFilename = destinationPath.replace(/\//g, '_') + '_' + Date.now() + extension;
      const localFilePath = path.join(UPLOADS_DIR, safeFilename);
      
      fs.writeFileSync(localFilePath, buffer);
      
      // Return short link
      return `http://localhost:5000/uploads/${safeFilename}`;
    }
  } catch (error) {
    console.error("Local file upload failed:", error);
    return ""; // Return empty string instead of huge base64 to protect DB
  }
};
