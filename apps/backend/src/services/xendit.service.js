import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// ============================================================
// Xendit Payment Request API v3 — QRIS Only
//
// Uses POST /payment_requests with channel_code: QRIS
// Replaces the legacy Invoice API v2
// ============================================================

const XENDIT_API_BASE = 'https://api.xendit.co';

/**
 * Build Basic Auth header from XENDIT_SECRET_KEY
 */
const getAuthHeader = () => {
  return `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`;
};

/**
 * Check if Xendit is properly configured (not in mock mode)
 */
const isConfigured = () => {
  return (
    process.env.XENDIT_SECRET_KEY &&
    process.env.XENDIT_SECRET_KEY !== 'xnd_development_xxxx'
  );
};

/**
 * Create QRIS payment request via Xendit Payment Request API v3
 * @param {Object} transaction - Transaction data { code, name, phone, total, items }
 * @returns {Object} - { success, externalId, qrString, paymentRequestId, expiresAt }
 */
export const createQRISPayment = async (transaction) => {
  try {
    const externalId = `TRX-${uuidv4().slice(0, 8).toUpperCase()}`;

    // ── Mock mode for development without actual Xendit API key ──
    if (!isConfigured()) {
      console.log('⚠️ Xendit API key not configured — using mock QRIS payment');

      // Generate a mock QR string (in production, Xendit returns the real one)
      const mockQrString = `00020101021226680016COM.XENDIT.WWW0118ID${externalId}0215MOCK${Date.now()}5204581253033605802ID5913MenuDigital6007Jakarta61051234062070503***6304`;

      return {
        success: true,
        externalId,
        qrString: mockQrString,
        paymentRequestId: `mock-pr-${externalId}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };
    }

    // ── Production: Call Xendit Payment Request API v3 ──
    const response = await fetch(`${XENDIT_API_BASE}/payment_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify({
        reference_id: externalId,
        type: 'PAY',
        country: 'ID',
        currency: 'IDR',
        amount: transaction.total,
        channel_code: 'QRIS',
        channel_properties: {
          success_return_url: `${process.env.FRONTEND_URL}/payment/success?external_id=${externalId}`,
          failure_return_url: `${process.env.FRONTEND_URL}/payment/failed?external_id=${externalId}`,
        },
        description: `Pembayaran QRIS - ${transaction.code}`,
        metadata: {
          order_code: transaction.code,
          customer_name: transaction.name,
          customer_phone: transaction.phone,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Xendit QRIS creation error:', error);
      throw new Error(error.message || 'Failed to create QRIS payment');
    }

    const paymentRequest = await response.json();

    // Extract qr_string from the response
    // Xendit returns it in channel_properties.qr_string or actions
    const qrString =
      paymentRequest.channel_properties?.qr_string ||
      paymentRequest.actions?.find((a) => a.action === 'present_to_customer')?.qr_string ||
      paymentRequest.qr_string ||
      null;

    if (!qrString) {
      console.error('Xendit response missing qr_string:', JSON.stringify(paymentRequest, null, 2));
      throw new Error('QRIS QR string not found in Xendit response');
    }

    return {
      success: true,
      externalId,
      qrString,
      paymentRequestId: paymentRequest.id,
      expiresAt: paymentRequest.channel_properties?.expires_at || null,
    };
  } catch (error) {
    console.error('Create QRIS payment error:', error);
    throw new Error(`Gagal membuat pembayaran QRIS: ${error.message}`);
  }
};

/**
 * Verify Xendit webhook callback token
 * @param {Object} headers - Request headers
 * @returns {boolean} - Is token valid
 */
export const verifyWebhookToken = (headers) => {
  try {
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    const callbackToken = headers['x-callback-token'];

    if (!webhookToken || !callbackToken) {
      console.error('Missing webhook token');
      return false;
    }

    return callbackToken === webhookToken;
  } catch (error) {
    console.error('Verify webhook token error:', error);
    return false;
  }
};

/**
 * Get payment status from Xendit by payment request ID
 * @param {string} paymentRequestId - Xendit payment request ID
 * @returns {Object} - Payment status info
 */
export const getPaymentStatus = async (paymentRequestId) => {
  try {
    if (!isConfigured()) {
      // Mock mode — return pending
      return {
        success: true,
        status: 'PENDING',
        amount: 0,
        paidAt: null,
      };
    }

    const response = await fetch(`${XENDIT_API_BASE}/payment_requests/${paymentRequestId}`, {
      headers: {
        'Authorization': getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get payment status');
    }

    const paymentRequest = await response.json();

    // Map Xendit status to our status
    let status = 'PENDING';
    if (paymentRequest.status === 'SUCCEEDED') {
      status = 'PAID';
    } else if (paymentRequest.status === 'FAILED') {
      status = 'FAILED';
    } else if (paymentRequest.status === 'EXPIRED') {
      status = 'EXPIRED';
    }

    return {
      success: true,
      status,
      xenditStatus: paymentRequest.status,
      amount: paymentRequest.amount,
      paidAt: paymentRequest.updated || null,
    };
  } catch (error) {
    console.error('Get payment status error:', error);
    throw new Error(`Failed to get payment status: ${error.message}`);
  }
};

/**
 * Get payment status by reference ID (our external_id)
 * Uses the list payment requests endpoint with reference_id filter
 * @param {string} referenceId - Our external ID / reference ID
 * @returns {Object} - Payment status info
 */
export const getPaymentByReferenceId = async (referenceId) => {
  try {
    if (!isConfigured()) {
      return {
        success: true,
        status: 'PENDING',
        amount: 0,
        paidAt: null,
        paymentMethod: null,
      };
    }

    const response = await fetch(
      `${XENDIT_API_BASE}/payment_requests?reference_id=${encodeURIComponent(referenceId)}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get payment by reference ID');
    }

    const result = await response.json();
    const paymentRequests = result.data || result;

    if (!paymentRequests || paymentRequests.length === 0) {
      return {
        success: false,
        status: 'NOT_FOUND',
      };
    }

    const pr = paymentRequests[0];

    let status = 'PENDING';
    if (pr.status === 'SUCCEEDED') status = 'PAID';
    else if (pr.status === 'FAILED') status = 'FAILED';
    else if (pr.status === 'EXPIRED') status = 'EXPIRED';

    return {
      success: true,
      status,
      xenditStatus: pr.status,
      amount: pr.amount,
      paidAt: pr.updated || null,
      paymentMethod: 'QRIS',
    };
  } catch (error) {
    console.error('Get payment by reference ID error:', error);
    throw new Error(`Failed to get payment status: ${error.message}`);
  }
};

export default {
  createQRISPayment,
  verifyWebhookToken,
  getPaymentStatus,
  getPaymentByReferenceId,
};
