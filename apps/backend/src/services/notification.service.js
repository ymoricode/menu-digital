// ============================================================
// SSE-based Notification Service
// Manages connected admin clients and broadcasts events
// ============================================================

class NotificationService {
  constructor() {
    // Set of connected SSE response objects
    this.clients = new Set();
  }

  /**
   * Register a new SSE client connection
   * @param {Response} res - Express response object
   */
  addClient(res) {
    this.clients.add(res);
    console.log(`[SSE] Client connected. Total: ${this.clients.size}`);

    // Remove client on disconnect
    res.on('close', () => {
      this.clients.delete(res);
      console.log(`[SSE] Client disconnected. Total: ${this.clients.size}`);
    });
  }

  /**
   * Broadcast an event to all connected admin clients
   * @param {string} event - Event name
   * @param {object} data  - Event payload
   */
  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch (err) {
        // Remove broken connections
        this.clients.delete(client);
      }
    }
  }

  /**
   * Send notification for a new transaction (created by customer)
   */
  notifyNewTransaction(transaction) {
    this.broadcast('new_transaction', {
      type: 'new_transaction',
      title: 'Pesanan Baru! 🛎️',
      message: `${transaction.name} — Meja ${transaction.tableNumber || '-'}`,
      total: transaction.total,
      code: transaction.code,
      id: transaction.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send notification when a payment is confirmed (PAID via Xendit)
   */
  notifyPaymentReceived(transaction) {
    this.broadcast('payment_received', {
      type: 'payment_received',
      title: 'Pembayaran Diterima! 💰',
      message: `Transaksi ${transaction.code} telah dibayar`,
      total: transaction.total,
      code: transaction.code,
      id: transaction.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send notification when a payment expires
   */
  notifyPaymentExpired(transaction) {
    this.broadcast('payment_expired', {
      type: 'payment_expired',
      title: 'Pembayaran Expired ⏰',
      message: `Transaksi ${transaction.code} telah kedaluwarsa`,
      code: transaction.code,
      id: transaction.id,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;
