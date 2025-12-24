import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate QR Code as PNG file
 * @param {string} data - Data to encode in QR
 * @param {string} filename - Output filename (without extension)
 * @returns {Object} - File path and QR data
 */
export const generateQRCode = async (data, filename) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/qrcodes');
    
    // Create directory if not exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${filename}.png`);
    
    await QRCode.toFile(filePath, data, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return {
      success: true,
      filePath: `/uploads/qrcodes/${filename}.png`,
      qrValue: data,
    };
  } catch (error) {
    console.error('Generate QR Code error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate QR Code as base64 string
 * @param {string} data - Data to encode in QR
 * @returns {string} - Base64 encoded QR code image
 */
export const generateQRCodeBase64 = async (data) => {
  try {
    const qrBase64 = await QRCode.toDataURL(data, {
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return qrBase64;
  } catch (error) {
    console.error('Generate QR Code Base64 error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

export default {
  generateQRCode,
  generateQRCodeBase64,
};
