import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

// Note: For production, uncomment and use the actual Xendit SDK
// import Xendit from 'xendit-node';
// const xenditClient = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY });

/**
 * Create Xendit Invoice for payment
 * @param {Object} transaction - Transaction data
 * @returns {Object} - Xendit invoice response
 */
export const createInvoice = async (transaction) => {
  try {
    const externalId = `TRX-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // For development/demo without actual Xendit API key
    // In production, use the actual Xendit API
    if (!process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY === 'xnd_development_xxxx') {
      console.log('⚠️ Xendit API key not configured - using mock payment');
      return {
        success: true,
        externalId,
        invoiceUrl: `${process.env.FRONTEND_URL}/payment/success?external_id=${externalId}`,
        invoiceId: `mock-${externalId}`,
      };
    }

    // Production: Use fetch to call Xendit API directly
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: transaction.total,
        description: `Pembayaran Menu Digital - ${transaction.code}`,
        payer_email: transaction.email || 'customer@menudigital.com',
        currency: 'IDR',
        invoice_duration: 86400,
        success_redirect_url: `${process.env.FRONTEND_URL}/payment/success?external_id=${externalId}`,
        failure_redirect_url: `${process.env.FRONTEND_URL}/payment/failed?external_id=${externalId}`,
        customer: {
          given_names: transaction.name,
          mobile_number: transaction.phone,
        },
        items: transaction.items?.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })) || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create invoice');
    }

    const invoice = await response.json();

    return {
      success: true,
      externalId,
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
    };
  } catch (error) {
    console.error('Xendit createInvoice error:', error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
};

/**
 * Verify Xendit webhook callback signature
 * @param {Object} headers - Request headers
 * @param {Object} body - Request body
 * @returns {boolean} - Is signature valid
 */
export const verifyCallback = (headers, body) => {
  try {
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    const callbackToken = headers['x-callback-token'];

    if (!webhookToken || !callbackToken) {
      console.error('Missing webhook token');
      return false;
    }

    return callbackToken === webhookToken;
  } catch (error) {
    console.error('Verify callback error:', error);
    return false;
  }
};

/**
 * Handle successful payment - update transaction status
 * @param {string} externalId - External ID from Xendit
 * @param {string} paymentMethod - Payment method used
 * @returns {Object} - Updated transaction
 */
export const handlePaymentSuccess = async (externalId, paymentMethod = 'xendit') => {
  try {
    return {
      success: true,
      externalId,
      paymentMethod,
      paymentStatus: 'paid',
    };
  } catch (error) {
    console.error('Handle payment success error:', error);
    throw new Error(`Failed to handle payment success: ${error.message}`);
  }
};

/**
 * Get invoice status from Xendit
 * @param {string} invoiceId - Xendit invoice ID
 * @returns {Object} - Invoice status
 */
export const getInvoiceStatus = async (invoiceId) => {
  try {
    if (!process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY === 'xnd_development_xxxx') {
      return {
        success: true,
        status: 'PAID',
        paidAmount: 0,
        paidAt: new Date().toISOString(),
      };
    }

    const response = await fetch(`https://api.xendit.co/v2/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get invoice');
    }

    const invoice = await response.json();

    return {
      success: true,
      status: invoice.status,
      paidAmount: invoice.paid_amount,
      paidAt: invoice.paid_at,
    };
  } catch (error) {
    console.error('Get invoice status error:', error);
    throw new Error(`Failed to get invoice status: ${error.message}`);
  }
};

/**
 * Get invoice status from Xendit by external ID
 * @param {string} externalId - External ID
 * @returns {Object} - Invoice status
 */
export const getInvoiceByExternalId = async (externalId) => {
  try {
    if (!process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET_KEY === 'xnd_development_xxxx') {
      // Mock mode - return paid status after confirmation
      return {
        success: true,
        status: 'PENDING',
        paidAmount: 0,
        paymentMethod: null,
      };
    }

    // Query Xendit API to find invoice by external_id
    const response = await fetch(`https://api.xendit.co/v2/invoices?external_id=${externalId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get invoice');
    }

    const invoices = await response.json();
    
    if (invoices.length === 0) {
      return {
        success: false,
        status: 'NOT_FOUND',
      };
    }

    const invoice = invoices[0];

    return {
      success: true,
      status: invoice.status,
      paidAmount: invoice.paid_amount,
      paidAt: invoice.paid_at,
      paymentMethod: invoice.payment_method,
      paymentChannel: invoice.payment_channel,
    };
  } catch (error) {
    console.error('Get invoice by external ID error:', error);
    throw new Error(`Failed to get invoice status: ${error.message}`);
  }
};

export default {
  createInvoice,
  verifyCallback,
  handlePaymentSuccess,
  getInvoiceStatus,
  getInvoiceByExternalId,
};
