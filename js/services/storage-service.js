// ============================================
// 📁 Storage Service (Firebase Storage)
// ============================================

import { storage } from '../config/firebase-config.js';
import {
  ref, uploadBytesResumable, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

import state from '../core/state.js';
import logger from '../utils/logger.js';

class StorageService {
  async uploadFile(file, path, onProgress = null) {
    if (!file) throw new Error('No file provided');

    const uid = state.get('user')?.uid;
    if (!uid) throw new Error('Not authenticated');

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File 5 MB se bada nahi hona chahiye');
    }

    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storagePath = `${path}/${uid}/${filename}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: { uploadedBy: uid }
      });

      task.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress, snapshot);
        },
        (error) => {
          logger.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve({
              url,
              path: storagePath,
              name: file.name,
              size: file.size,
              type: file.type
            });
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  async deleteFile(path) {
    try {
      await deleteObject(ref(storage, path));
      return true;
    } catch (e) {
      return false;
    }
  }

  validateImage(file) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowed.includes(file.type)) {
      return { valid: false, error: 'Sirf JPG, PNG, WEBP allowed' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: '5 MB se chhota file choose karo' };
    }
    return { valid: true };
  }
}

const storageService = new StorageService();
export default storageService;