import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary is configured
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (file, folder = 'menu-digital') => {
  try {
    // If Cloudinary is not configured, return null (fallback to local)
    if (!isCloudinaryConfigured()) {
      console.log('⚠️ Cloudinary not configured, using local storage');
      return null;
    }

    // Convert buffer to base64 data URI
    let uploadStr = file;
    if (Buffer.isBuffer(file)) {
      uploadStr = `data:image/jpeg;base64,${file.toString('base64')}`;
    }

    const result = await cloudinary.uploader.upload(uploadStr, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteImage = async (publicId) => {
  try {
    if (!isCloudinaryConfigured() || !publicId) return;
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

/**
 * Upload from file path (for multer)
 * @param {string} filePath - Local file path
 * @param {string} folder - Folder name in Cloudinary
 */
export const uploadFromPath = async (filePath, folder = 'menu-digital') => {
  try {
    if (!isCloudinaryConfigured()) {
      return null;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export default {
  uploadImage,
  uploadFromPath,
  deleteImage,
  isCloudinaryConfigured,
};
