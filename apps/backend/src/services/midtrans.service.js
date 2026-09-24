import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// ============================================================
// Midtrans Core API v2 — QRIS Only
//
// Uses POST /v2/charge with payment_type: "qris"
// Replaces Xendit Payment Request API
// ============================================================

const MIDTRANS_API_BASE = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

/**
 * Build Basic Auth header from MIDTRANS_SERVER_KEY
 */
const getAuthHeader = () => {
  return `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;
};

/**
 * Check if Midtrans is properly configured (not in mock mode)
 */
const isConfigured = () => {
  return (
    process.env.MIDTRANS_SERVER_KEY &&
    process.env.MIDTRANS_SERVER_KEY !== 'SB-Mid-server-xxxx' &&
    process.env.MIDTRANS_SERVER_KEY.length > 10
  );
};

/**
 * Create QRIS payment via Midtrans Core API v2
 *
 * @param {Object} params
 * @param {string} params.orderId   - Unique order ID (e.g. ORD-xxx)
 * @param {number} params.total     - Gross amount in IDR (integer)
 * @param {string} params.name      - Customer name
 * @param {string} params.phone     - Customer phone
 * @param {Array}  params.items     - Order items [{name, quantity, price}]
 * @returns {Object} { success, orderId, qrCodeUrl, qrString, expiresAt }
 */
export const createQRISPayment = async ({ orderId, total, name, phone, items }) => {
  try {
    // ── Mock mode for development without Midtrans API key ──
    if (!isConfigured()) {
      console.log('⚠️  Midtrans not configured — using mock QRIS payment');

      const mockQrString = `00020101021226680016COM.MIDTRANS.WWW0118ID${orderId}0215MOCK${Date.now()}5204581253033605802ID5913MenuDigital6007Jakarta61051234062070503***6304`;

      return {
        success: true,
        orderId,
        transactionId: `mock-mt-${uuidv4().slice(0, 8)}`,
        qrCodeUrl: null,             // No real URL in mock mode
        qrString: mockQrString,      // Frontend can render this via qrcode.react
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    }

    // ── Production/Sandbox: Call Midtrans Core API v2 ──
    const payload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
      qris: {
        acquirer: 'gopay',
      },
      item_details: items?.map((item) => ({
        id: String(item.foodsId || item.id || ''),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      customer_details: {
        first_name: name,
        phone,
      },
    };

    const response = await fetch(`${MIDTRANS_API_BASE}/v2/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status_code && !['200', '201'].includes(result.status_code)) {
      console.error('Midtrans charge error:', result);
      throw new Error(result.status_message || 'Failed to create QRIS payment');
    }

    // Extract QR code URL and qr_string from response
    const qrCodeAction = result.actions?.find(
      (a) => a.name === 'generate-qr-code' || a.name === 'generate-qr-code-v2'
    );
    const qrCodeUrl = qrCodeAction?.url || null;
    const qrString = result.qr_string || null;

    if (!qrCodeUrl && !qrString) {
      console.error('Midtrans response missing QR data:', JSON.stringify(result, null, 2));
      throw new Error('QRIS QR data not found in Midtrans response');
    }

    return {
      success: true,
      orderId,
      transactionId: result.transaction_id,
      qrCodeUrl,
      qrString,
      expiresAt: result.expiry_time || null,
    };
  } catch (error) {
    console.error('Create QRIS payment error:', error);
    throw new Error(`Gagal membuat pembayaran QRIS: ${error.message}`);
  }
};

/**
 * Verify Midtrans webhook notification signature
 *
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 *
 * @param {Object} notification - Midtrans notification body
 * @returns {boolean} - Is signature valid
 */
export const verifySignature = (notification) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey || !notification.signature_key) {
      console.error('[Midtrans] Missing server key or signature');
      return false;
    }

    const { order_id, status_code, gross_amount, signature_key } = notification;

    const payload = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');

    return expectedSignature === signature_key;
  } catch (error) {
    console.error('[Midtrans] Signature verification error:', error);
    return false;
  }
};

/**
 * Map Midtrans transaction_status to our internal payment status
 *
 * @param {string} midtransStatus - Midtrans transaction_status
 * @returns {string} - Our internal status
 */
export const mapStatus = (midtransStatus) => {
  switch (midtransStatus) {
    case 'settlement':
    case 'capture':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'expire':
      return 'expired';
    case 'cancel':
      return 'cancelled';
    case 'deny':
    case 'failure':
      return 'failed';
    default:
      return 'pending';
  }
};

/**
 * Get transaction status from Midtrans API
 *
 * @param {string} orderId - Our order ID (used as Midtrans order_id)
 * @returns {Object} - { success, status, midtransStatus, amount, paidAt }
 */
export const getTransactionStatus = async (orderId) => {
  try {
    if (!isConfigured()) {
      return {
        success: true,
        status: 'pending',
        midtransStatus: 'pending',
        amount: 0,
        paidAt: null,
      };
    }

    const response = await fetch(`${MIDTRANS_API_BASE}/v2/${encodeURIComponent(orderId)}/status`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
    });

    const result = await response.json();

    if (result.status_code === '404') {
      return {
        success: false,
        status: 'not_found',
      };
    }

    const status = mapStatus(result.transaction_status);

    return {
      success: true,
      status,
      midtransStatus: result.transaction_status,
      amount: parseInt(result.gross_amount) || 0,
      paidAt: result.settlement_time || null,
    };
  } catch (error) {
    console.error('Get Midtrans status error:', error);
    throw new Error(`Failed to get payment status: ${error.message}`);
  }
};

export default {
  createQRISPayment,
  verifySignature,
  mapStatus,
  getTransactionStatus,
};
