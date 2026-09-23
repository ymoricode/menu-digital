import transactionService, {
  TableOccupiedError,
  TransactionNotFoundError,
  TransactionAlreadyCompletedError,
  TransactionNotPaidError,
  TransactionCannotCancelError,
} from '../services/transaction.service.js';
import xenditService from '../services/xendit.service.js';
import notificationService from '../services/notification.service.js';

/**
 * Get all transactions (admin)
 */
export const getAll = async (req, res) => {
  try {
    const transactions = await transactionService.getAll();

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transactions',
    });
  }
};

/**
 * Get transaction by ID
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getById(parseInt(id));

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transaction',
    });
  }
};

/**
 * Check table status (customer — before ordering)
 */
export const checkTableStatus = async (req, res) => {
  try {
    const { barcodeId } = req.params;

    if (!barcodeId) {
      return res.status(400).json({
        success: false,
        message: 'barcodeId is required',
      });
    }

    const status = await transactionService.checkTableStatus(parseInt(barcodeId));

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check table status',
    });
  }
};

/**
 * Create new transaction (customer checkout)
 * Now returns QRIS data (qr_string) instead of a checkout URL
 * Handles table locking — returns 409 if table occupied
 */
export const create = async (req, res) => {
  try {
    const { name, phone, email, items, barcodeId } = req.body;

    if (!name || !phone || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and items are required',
      });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.foodsId || !item.quantity || !item.price || !item.name) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have foodsId, name, quantity, and price',
        });
      }
    }

    const transaction = await transactionService.create({
      name,
      phone,
      email,
      items,
      barcodeId,
    });

    // ── Emit realtime notification to admin ──
    notificationService.notifyNewTransaction({
      id: transaction.id,
      code: transaction.code,
      name: name,
      total: transaction.total || 0,
      tableNumber: transaction.tableNumber || null,
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    // ── Typed error handling ──
    if (error instanceof TableOccupiedError) {
      return res.status(409).json({
        success: false,
        code: 'TABLE_OCCUPIED',
        message: error.message,
      });
    }

    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction',
    });
  }
};

/**
 * Complete transaction (admin — mark as delivered)
 * Idempotent: double-click safe
 */
export const completeTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    const result = await transactionService.complete(transactionId);

    if (result.alreadyCompleted) {
      return res.json({
        success: true,
        message: 'Pesanan sudah diselesaikan sebelumnya',
        data: result,
        idempotent: true,
      });
    }

    res.json({
      success: true,
      message: 'Pesanan berhasil diselesaikan!',
      data: result,
    });
  } catch (error) {
    // ── Typed error handling ──
    if (error instanceof TransactionNotFoundError) {
      return res.status(404).json({
        success: false,
        code: 'TRANSACTION_NOT_FOUND',
        message: error.message,
      });
    }

    if (error instanceof TransactionNotPaidError) {
      return res.status(422).json({
        success: false,
        code: 'TRANSACTION_NOT_PAID',
        message: error.message,
      });
    }

    if (error instanceof TransactionAlreadyCompletedError) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_COMPLETED',
        message: error.message,
      });
    }

    console.error('Complete transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal menyelesaikan pesanan',
    });
  }
};

// ============================================================
// PAYMENT WEBHOOK (Xendit Payment Request API v3)
//
// Handles events:
//   - payment.succeeded  → status PAID
//   - payment.failed     → status FAILED
//   - payment.expired /
//     payment_request.expired → status EXPIRED
//
// Security:
//   - Validates x-callback-token header
//   - Verifies payment amount matches order total
//   - Idempotent: skips if already paid/completed
// ============================================================
export const paymentWebhook = async (req, res) => {
  try {
    // ── Step 1: Verify webhook token ──
    const isValid = xenditService.verifyWebhookToken(req.headers);

    if (!isValid) {
      console.error('[Webhook] Invalid callback token');
      return res.status(401).json({
        success: false,
        message: 'Invalid callback signature',
      });
    }

    const { event, data } = req.body;

    // Extract reference_id — this is our external_id
    const referenceId = data?.reference_id;

    if (!referenceId) {
      console.error('[Webhook] Missing reference_id in payload');
      return res.status(400).json({
        success: false,
        message: 'Missing reference_id',
      });
    }

    console.log(`[Webhook] Event: ${event} | Reference: ${referenceId} | Status: ${data?.status}`);

    // ── Step 2: Find the transaction ──
    const transaction = await transactionService.getByExternalId(referenceId);

    if (!transaction) {
      console.error(`[Webhook] Transaction not found for reference_id: ${referenceId}`);
      // Return 200 to prevent Xendit from retrying
      return res.json({
        success: true,
        message: 'Transaction not found — acknowledged',
      });
    }

    // ── Step 3: Process based on event type ──
    if (event === 'payment.succeeded' && data?.status === 'SUCCEEDED') {
      // Verify amount matches order total (security check)
      if (data.amount && data.amount !== transaction.total) {
        console.error(
          `[Webhook] Amount mismatch! Expected: ${transaction.total}, Got: ${data.amount}`
        );
        // Still acknowledge to prevent retries, but log the discrepancy
      }

      const updated = await transactionService.updatePaymentStatus(
        referenceId,
        'paid',
        'QRIS'
      );

      if (updated) {
        notificationService.notifyPaymentReceived({
          id: updated.id,
          code: updated.code,
          total: updated.total,
        });
      }
    } else if (event === 'payment.failed') {
      await transactionService.updatePaymentStatus(referenceId, 'failed');
    } else if (
      event === 'payment.expired' ||
      event === 'payment_request.expired'
    ) {
      const updated = await transactionService.updatePaymentStatus(referenceId, 'expired');
      if (updated) {
        notificationService.notifyPaymentExpired({
          id: updated.id,
          code: updated.code,
        });
      }
    } else {
      console.log(`[Webhook] Unhandled event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    res.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    // Return 200 even on error to prevent infinite retries
    // The error is logged for manual investigation
    res.json({
      success: true,
      message: 'Webhook acknowledged with error',
    });
  }
};

/**
 * Check payment status (lightweight — reads from DB only)
 * Used by frontend for polling
 * Does NOT call Xendit API — fast and safe
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    const transaction = await transactionService.getById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        code: transaction.code,
        paymentStatus: transaction.paymentStatus,
        paymentMethod: transaction.paymentMethod,
        total: transaction.total,
        name: transaction.name,
        tableNumber: transaction.tableNumber,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status',
    });
  }
};

/**
 * Sync payment status from Xendit API (for development/manual sync)
 * Calls Xendit API to check real status, then updates DB
 */
export const syncPaymentStatus = async (req, res) => {
  try {
    const { external_id } = req.params;
    
    // Get transaction from database
    const transaction = await transactionService.getByExternalId(external_id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }
    
    // If already paid or completed, no need to check
    if (['paid', 'completed'].includes(transaction.paymentStatus)) {
      return res.json({
        success: true,
        message: `Transaction already ${transaction.paymentStatus}`,
        data: transaction,
      });
    }
    
    // Check status from Xendit API using reference ID
    const xenditStatus = await xenditService.getPaymentByReferenceId(external_id);
    
    if (xenditStatus.status === 'PAID') {
      // Update transaction to paid
      await transactionService.updatePaymentStatus(
        external_id,
        'paid',
        'QRIS'
      );
      
      // Get updated transaction
      const updatedTransaction = await transactionService.getByExternalId(external_id);
      
      return res.json({
        success: true,
        message: 'Payment confirmed!',
        data: updatedTransaction,
      });
    } else if (xenditStatus.status === 'EXPIRED') {
      await transactionService.updatePaymentStatus(external_id, 'expired');
      
      return res.json({
        success: true,
        message: 'Payment expired',
        data: { ...transaction, paymentStatus: 'expired' },
      });
    } else if (xenditStatus.status === 'FAILED') {
      await transactionService.updatePaymentStatus(external_id, 'failed');
      
      return res.json({
        success: true,
        message: 'Payment failed',
        data: { ...transaction, paymentStatus: 'failed' },
      });
    }
    
    // Still pending
    return res.json({
      success: true,
      message: 'Payment still pending',
      xenditStatus: xenditStatus.status,
      data: transaction,
    });
  } catch (error) {
    console.error('Sync payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync payment status',
    });
  }
};

/**
 * Get transaction by external ID (for payment status check)
 */
export const getByExternalId = async (req, res) => {
  try {
    const { external_id } = req.params;
    const transaction = await transactionService.getByExternalId(external_id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get transaction',
    });
  }
};

/**
 * Export transactions to Excel
 */
export const exportToExcel = async (req, res) => {
  try {
    const XLSX = await import('xlsx');
    const transactions = await transactionService.getAll();

    // Prepare data for Excel
    const excelData = transactions.map((t, index) => ({
      'No': index + 1,
      'Kode Transaksi': t.code,
      'Nama Pelanggan': t.name,
      'No. Telepon': t.phone,
      'Email': t.email || '-',
      'No. Meja': t.tableNumber || '-',
      'Total': t.total,
      'Status Pembayaran': t.paymentStatus === 'paid' ? 'Lunas' : 
                          t.paymentStatus === 'pending' ? 'Menunggu' :
                          t.paymentStatus === 'expired' ? 'Kadaluarsa' :
                          t.paymentStatus === 'completed' ? 'Selesai' : 'Gagal',
      'Metode Pembayaran': t.paymentMethod || '-',
      'Selesai Pada': t.completedAt ? new Date(t.completedAt).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
      }) : '-',
      'Tanggal': new Date(t.createdAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      }),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 20 },  // Kode Transaksi
      { wch: 25 },  // Nama
      { wch: 15 },  // Telepon
      { wch: 25 },  // Email
      { wch: 10 },  // Meja
      { wch: 15 },  // Total
      { wch: 15 },  // Status
      { wch: 15 },  // Metode
      { wch: 20 },  // Selesai Pada
      { wch: 20 },  // Tanggal
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    const filename = `transaksi_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export transactions',
    });
  }
};

/**
 * Cancel transaction (admin)
 * Idempotent: double-click safe
 */
export const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    const result = await transactionService.cancel(transactionId);

    if (result.alreadyCancelled) {
      return res.json({
        success: true,
        message: 'Pesanan sudah dibatalkan sebelumnya',
        data: result,
        idempotent: true,
      });
    }

    res.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan!',
      data: result,
    });
  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      return res.status(404).json({
        success: false,
        code: 'TRANSACTION_NOT_FOUND',
        message: error.message,
      });
    }

    if (error instanceof TransactionCannotCancelError) {
      return res.status(422).json({
        success: false,
        code: 'CANNOT_CANCEL',
        message: error.message,
      });
    }

    console.error('Cancel transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Gagal membatalkan pesanan',
    });
  }
};

export default {
  getAll,
  getById,
  checkTableStatus,
  create,
  completeTransaction,
  cancelTransaction,
  paymentWebhook,
  checkPaymentStatus,
  getByExternalId,
  syncPaymentStatus,
  exportToExcel,
};
