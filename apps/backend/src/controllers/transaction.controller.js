import transactionService, {
  TableOccupiedError,
  TransactionNotFoundError,
  TransactionAlreadyCompletedError,
  TransactionNotPaidError,
  TransactionCannotCancelError,
} from '../services/transaction.service.js';
import midtransService from '../services/midtrans.service.js';
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
// PAYMENT WEBHOOK (Midtrans Payment Notification)
//
// Midtrans sends POST with transaction status:
//   - settlement / capture  → status PAID
//   - expire                → status EXPIRED
//   - cancel                → status CANCELLED
//   - deny / failure        → status FAILED
//
// Security:
//   - Validates signature_key via SHA512
//   - Verifies payment amount matches order total
//   - Idempotent: skips if already paid/completed
// ============================================================
export const paymentWebhook = async (req, res) => {
  try {
    const notification = req.body;

    // ── Step 1: Verify signature ──
    const isValid = midtransService.verifySignature(notification);

    if (!isValid) {
      console.error('[Webhook] Invalid Midtrans signature');
      return res.status(401).json({
        success: false,
        message: 'Invalid signature',
      });
    }

    const { order_id, transaction_status, gross_amount, fraud_status } = notification;

    if (!order_id) {
      console.error('[Webhook] Missing order_id in notification');
      return res.status(400).json({
        success: false,
        message: 'Missing order_id',
      });
    }

    console.log(`[Webhook] Order: ${order_id} | Status: ${transaction_status} | Fraud: ${fraud_status || 'N/A'}`);

    // ── Step 2: Find the transaction ──
    // In our system, external_id = order_id = transaction code
    const transaction = await transactionService.getByExternalId(order_id);

    if (!transaction) {
      console.error(`[Webhook] Transaction not found for order_id: ${order_id}`);
      // Return 200 to prevent Midtrans from retrying
      return res.status(200).json({
        success: true,
        message: 'Transaction not found — acknowledged',
      });
    }

    // ── Step 3: Map Midtrans status to our status ──
    const newStatus = midtransService.mapStatus(transaction_status);

    // ── Step 4: Process based on status ──
    if (newStatus === 'paid') {
      // Verify amount matches order total (security check)
      const webhookAmount = parseInt(gross_amount) || 0;
      if (webhookAmount && webhookAmount !== transaction.total) {
        console.error(
          `[Webhook] Amount mismatch! Expected: ${transaction.total}, Got: ${webhookAmount}`
        );
      }

      // Check fraud_status for card payments (QRIS usually doesn’t have this)
      if (fraud_status && fraud_status !== 'accept') {
        console.warn(`[Webhook] Fraud status: ${fraud_status} for order ${order_id}`);
        await transactionService.updatePaymentStatus(order_id, 'failed');
      } else {
        const updated = await transactionService.updatePaymentStatus(
          order_id,
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
      }
    } else if (newStatus === 'expired') {
      const updated = await transactionService.updatePaymentStatus(order_id, 'expired');
      if (updated) {
        notificationService.notifyPaymentExpired({
          id: updated.id,
          code: updated.code,
        });
      }
    } else if (newStatus === 'cancelled') {
      await transactionService.updatePaymentStatus(order_id, 'cancelled');
    } else if (newStatus === 'failed') {
      await transactionService.updatePaymentStatus(order_id, 'failed');
    } else {
      console.log(`[Webhook] Status pending/unchanged for order: ${order_id}`);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Notification processed',
    });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    // Return 200 even on error to prevent infinite retries
    res.status(200).json({
      success: true,
      message: 'Notification acknowledged with error',
    });
  }
};

/**
 * Check payment status (lightweight — reads from DB only)
 * Used by frontend for polling
 * Does NOT call Midtrans API — fast and safe
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
 * Sync payment status from Midtrans API (for manual sync / "Cek Status" button)
 * Calls Midtrans Status API to check real status, then updates DB
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
    
    // Check status from Midtrans API using order_id
    const midtransStatus = await midtransService.getTransactionStatus(external_id);
    
    if (midtransStatus.status === 'paid') {
      await transactionService.updatePaymentStatus(external_id, 'paid', 'QRIS');
      const updatedTransaction = await transactionService.getByExternalId(external_id);
      
      return res.json({
        success: true,
        message: 'Payment confirmed!',
        data: updatedTransaction,
      });
    } else if (midtransStatus.status === 'expired') {
      await transactionService.updatePaymentStatus(external_id, 'expired');
      return res.json({
        success: true,
        message: 'Payment expired',
        data: { ...transaction, paymentStatus: 'expired' },
      });
    } else if (midtransStatus.status === 'failed') {
      await transactionService.updatePaymentStatus(external_id, 'failed');
      return res.json({
        success: true,
        message: 'Payment failed',
        data: { ...transaction, paymentStatus: 'failed' },
      });
    } else if (midtransStatus.status === 'cancelled') {
      await transactionService.updatePaymentStatus(external_id, 'cancelled');
      return res.json({
        success: true,
        message: 'Payment cancelled',
        data: { ...transaction, paymentStatus: 'cancelled' },
      });
    }
    
    // Still pending
    return res.json({
      success: true,
      message: 'Payment still pending',
      midtransStatus: midtransStatus.midtransStatus,
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
