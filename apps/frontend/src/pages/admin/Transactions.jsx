import { useState, useEffect } from 'react';
import { Search, Eye, Receipt, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { transactionsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [completingId, setCompletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll();
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await transactionsAPI.export();
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaksi_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Export berhasil!');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Gagal export data');
    } finally {
      setExporting(false);
    }
  };

  // ── COMPLETE ORDER ──
  const handleCompleteOrder = async (transactionId) => {
    if (completingId === transactionId) return;
    
    setCompletingId(transactionId);

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, paymentStatus: 'completed', completedAt: new Date().toISOString() }
          : t
      )
    );

    if (selectedTransaction?.id === transactionId) {
      setSelectedTransaction((prev) => ({
        ...prev,
        paymentStatus: 'completed',
        completedAt: new Date().toISOString(),
      }));
    }

    try {
      const response = await transactionsAPI.complete(transactionId);

      if (response.data.idempotent) {
        toast.success('Pesanan sudah diselesaikan sebelumnya', { icon: 'ℹ️' });
      } else {
        toast.success('Pesanan berhasil diselesaikan! 🎉');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      fetchTransactions();
      const errorMessage = error.response?.data?.message || 'Gagal menyelesaikan pesanan';
      toast.error(errorMessage);
    } finally {
      setCompletingId(null);
    }
  };

  // ── CANCEL ORDER ──
  const handleCancelOrder = async (transactionId) => {
    if (cancellingId === transactionId) return;

    const confirmed = window.confirm('Apakah kamu yakin ingin membatalkan pesanan ini?');
    if (!confirmed) return;

    setCancellingId(transactionId);

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, paymentStatus: 'cancelled' }
          : t
      )
    );

    if (selectedTransaction?.id === transactionId) {
      setSelectedTransaction((prev) => ({
        ...prev,
        paymentStatus: 'cancelled',
      }));
    }

    try {
      const response = await transactionsAPI.cancel(transactionId);

      if (response.data.idempotent) {
        toast.success('Pesanan sudah dibatalkan sebelumnya', { icon: 'ℹ️' });
      } else {
        toast.success('Pesanan berhasil dibatalkan!');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      fetchTransactions();
      const errorMessage = error.response?.data?.message || 'Gagal membatalkan pesanan';
      toast.error(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const viewDetail = async (transaction) => {
    try {
      const response = await transactionsAPI.getById(transaction.id);
      setSelectedTransaction(response.data.data);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Gagal memuat detail transaksi');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    let cleanDateString = dateString;
    if (typeof dateString === 'string' && dateString.endsWith('Z')) {
      cleanDateString = dateString.slice(0, -1);
    }
    
    const date = new Date(cleanDateString);
    
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return { label: 'Lunas', color: 'text-emerald-400', bg: 'bg-emerald-400/15', border: 'border-emerald-400/20', dot: 'bg-emerald-400' };
      case 'completed':
        return { label: 'Selesai', color: 'text-sky-400', bg: 'bg-sky-400/15', border: 'border-sky-400/20', dot: 'bg-sky-400' };
      case 'pending':
        return { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/15', border: 'border-amber-400/20', dot: 'bg-amber-400' };
      case 'failed':
        return { label: 'Gagal', color: 'text-rose-400', bg: 'bg-rose-400/15', border: 'border-rose-400/20', dot: 'bg-rose-400' };
      case 'expired':
        return { label: 'Expired', color: 'text-rose-400', bg: 'bg-rose-400/15', border: 'border-rose-400/20', dot: 'bg-rose-400' };
      case 'cancelled':
        return { label: 'Dibatalkan', color: 'text-orange-400', bg: 'bg-orange-400/15', border: 'border-orange-400/20', dot: 'bg-orange-400' };
      default:
        return { label: status, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-white/30' };
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.code.toLowerCase().includes(search.toLowerCase()) ||
      transaction.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || transaction.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-white/35 text-sm font-medium">Riwayat transaksi pesanan</p>
        </div>
        <Button 
          onClick={handleExport} 
          loading={exporting}
          variant="secondary"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode atau nama..."
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', 'paid', 'completed', 'pending', 'cancelled', 'expired', 'failed'].map((status) => {
                const config = status !== 'all' ? getStatusConfig(status) : null;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border ${
                      statusFilter === status
                        ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                        : 'bg-white/[0.04] text-white/40 border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : config?.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto scrollbar-dark">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Meja
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={7}>
                      <div className="shimmer h-12" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-white/30" colSpan={7}>
                    <Receipt className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const status = getStatusConfig(transaction.paymentStatus);
                  return (
                    <tr key={transaction.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono text-[13px] font-semibold text-white/60">
                          {transaction.code}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white/80 text-sm">{transaction.name}</p>
                          <p className="text-xs text-white/25">{transaction.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {transaction.tableNumber ? (
                          <span className="px-2.5 py-1 bg-white/[0.06] text-white/50 text-xs font-semibold rounded-lg border border-white/[0.06]">
                            Meja {transaction.tableNumber}
                          </span>
                        ) : (
                          <span className="text-white/15">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-white/80 text-sm">
                        {formatPrice(transaction.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/30">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => viewDetail(transaction)}
                            className="p-2 text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Complete Order Button */}
                          {transaction.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleCompleteOrder(transaction.id)}
                              disabled={completingId === transaction.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/15"
                              title="Selesaikan Pesanan"
                            >
                              {completingId === transaction.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {completingId === transaction.id ? 'Proses...' : 'Selesaikan'}
                              </span>
                            </button>
                          )}

                          {/* Cancel Order Button */}
                          {['pending', 'paid', 'completed'].includes(transaction.paymentStatus) && (
                            <button
                              onClick={() => handleCancelOrder(transaction.id)}
                              disabled={cancellingId === transaction.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger-400/10 text-danger-400 hover:bg-danger-400/20 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-danger-400/15"
                              title="Batalkan Pesanan"
                            >
                              {cancellingId === transaction.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {cancellingId === transaction.id ? 'Proses...' : 'Batalkan'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Transaksi"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/35 mb-0.5">Kode Transaksi</p>
                <p className="font-mono font-semibold text-white/80 text-sm">{selectedTransaction.code}</p>
              </div>
              <div>
                <p className="text-xs text-white/35 mb-0.5">Status</p>
                {(() => {
                  const s = getStatusConfig(selectedTransaction.paymentStatus);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${s.bg} ${s.color} ${s.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-white/35 mb-0.5">Nama Pelanggan</p>
                <p className="font-semibold text-white/80 text-sm">{selectedTransaction.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/35 mb-0.5">No. Telepon</p>
                <p className="font-semibold text-white/80 text-sm">{selectedTransaction.phone}</p>
              </div>
              <div>
                <p className="text-xs text-white/35 mb-0.5">Meja</p>
                <p className="font-semibold text-white/80 text-sm">
                  {selectedTransaction.tableNumber ? `Meja ${selectedTransaction.tableNumber}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/35 mb-0.5">Tanggal</p>
                <p className="font-semibold text-white/80 text-sm">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              {selectedTransaction.completedAt && (
                <div className="col-span-2">
                  <p className="text-xs text-white/35 mb-0.5">Diselesaikan Pada</p>
                  <p className="font-semibold text-sky-400 text-sm">{formatDate(selectedTransaction.completedAt)}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-white/80 mb-3 text-sm">Item Pesanan</h4>
              <div className="bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.06]">
                <table className="w-full">
                  <thead className="border-b border-white/[0.06]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/40">Item</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-white/40">Qty</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-white/40">Harga</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-white/40">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {selectedTransaction.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-white/70">{item.foodName}</td>
                        <td className="px-4 py-3 text-sm text-white/70 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-white/70 text-right">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-white/80 text-right font-semibold">{formatPrice(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-white/[0.06]">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-white/60 text-right">
                        Total
                      </td>
                      <td className="px-4 py-3 text-lg font-bold text-primary-400 text-right">
                        {formatPrice(selectedTransaction.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Info */}
            {selectedTransaction.paymentMethod && (
              <div className="bg-accent-400/10 text-accent-300 p-4 rounded-xl border border-accent-400/15">
                <p className="text-sm">
                  <strong>Metode Pembayaran:</strong> {selectedTransaction.paymentMethod}
                </p>
                {selectedTransaction.externalId && (
                  <p className="text-sm mt-1 text-accent-300/70">
                    <strong>External ID:</strong> {selectedTransaction.externalId}
                  </p>
                )}
              </div>
            )}

            {/* ── Action Buttons in Modal ── */}
            {['pending', 'paid', 'completed'].includes(selectedTransaction.paymentStatus) && (
              <div className="border-t border-white/[0.06] pt-4 space-y-3">
                {/* Complete button — only for paid */}
                {selectedTransaction.paymentStatus === 'paid' && (
                  <button
                    onClick={() => handleCompleteOrder(selectedTransaction.id)}
                    disabled={completingId === selectedTransaction.id}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl py-3 px-6 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-success hover:shadow-lg"
                  >
                    {completingId === selectedTransaction.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Selesaikan Pesanan
                      </>
                    )}
                  </button>
                )}

                {/* Completed info */}
                {selectedTransaction.paymentStatus === 'completed' && (
                  <div className="flex items-center justify-center gap-2 bg-sky-400/10 text-sky-400 rounded-xl py-3 px-6 border border-sky-400/15">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold text-sm">Pesanan telah diselesaikan</span>
                  </div>
                )}

                {/* Cancel button */}
                <button
                  onClick={() => handleCancelOrder(selectedTransaction.id)}
                  disabled={cancellingId === selectedTransaction.id}
                  className="w-full flex items-center justify-center gap-2 bg-danger-400/10 hover:bg-danger-400/20 text-danger-400 rounded-xl py-3 px-6 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-danger-400/15"
                >
                  {cancellingId === selectedTransaction.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Membatalkan...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Batalkan Pesanan
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Cancelled info in Modal */}
            {selectedTransaction.paymentStatus === 'cancelled' && (
              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-center gap-2 bg-orange-400/10 text-orange-400 rounded-xl py-3 px-6 border border-orange-400/15">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Pesanan telah dibatalkan</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
