import transactionService from '../services/transaction.service.js';
import xenditService from '../services/xendit.service.js';

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
 * Create new transaction (customer checkout)
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

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create transaction',
    });
  }
};

/**
 * Xendit payment callback (webhook)
 */
export const xenditCallback = async (req, res) => {
  try {
    // Verify callback signature
    const isValid = xenditService.verifyCallback(req.headers, req.body);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid callback signature',
      });
    }

    const { external_id, status, payment_method } = req.body;

    if (status === 'PAID') {
      await transactionService.updatePaymentStatus(
        external_id,
        'paid',
        payment_method
      );
    } else if (status === 'EXPIRED') {
      await transactionService.updatePaymentStatus(external_id, 'expired');
    } else if (status === 'FAILED') {
      await transactionService.updatePaymentStatus(external_id, 'failed');
    }

    res.json({
      success: true,
      message: 'Callback processed',
    });
  } catch (error) {
    console.error('Xendit callback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process callback',
    });
  }
};

/**
 * Sync payment status from Xendit (for development without webhook)
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
    
    // If already paid, no need to check
    if (transaction.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Transaction already paid',
        data: transaction,
      });
    }
    
    // Check status from Xendit API
    const xenditStatus = await xenditService.getInvoiceByExternalId(external_id);
    
    if (xenditStatus.status === 'PAID' || xenditStatus.status === 'SETTLED') {
      // Update transaction to paid
      await transactionService.updatePaymentStatus(
        external_id,
        'paid',
        xenditStatus.paymentChannel || xenditStatus.paymentMethod || 'xendit'
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
                          t.paymentStatus === 'expired' ? 'Kadaluarsa' : 'Gagal',
      'Metode Pembayaran': t.paymentMethod || '-',
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

export default {
  getAll,
  getById,
  create,
  xenditCallback,
  getByExternalId,
  syncPaymentStatus,
  exportToExcel,
};
