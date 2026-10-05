import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Receipt, Download, CheckCircle2, XCircle, Loader2, ChevronDown, TrendingUp, AlertTriangle, Clock, DollarSign, Filter } from 'lucide-react';
import { transactionsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

// ── Status group definitions (UI-only, no DB changes) ──
const STATUS_GROUPS = {
  all: {
    label: 'Semua',
    statuses: null, // all
  },
  active: {
    label: 'Aktif',
    statuses: ['pending', 'paid'],
  },
  completed: {
    label: 'Selesai',
    statuses: ['completed'],
  },
  problematic: {
    label: 'Bermasalah',
    statuses: ['expired', 'failed', 'cancelled'],
  },
};

// ── Individual status config (presentation only) ──
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  paid: {
    label: 'Lunas',
    color: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    dot: 'bg-blue-500',
  },
  expired: {
    label: 'Expired',
    color: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    dot: 'bg-red-500',
  },
  failed: {
    label: 'Gagal',
    color: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    dot: 'bg-red-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20',
    dot: 'bg-gray-400',
  },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState('all');
  const [detailStatusFilter, setDetailStatusFilter] = useState('all');
  const [showDetailFilter, setShowDetailFilter] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.detail-filter-dropdown')) {
        setShowDetailFilter(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
      
      // Create blob and download
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

  // ── COMPLETE ORDER (idempotent, double-click safe) ──
  const handleCompleteOrder = async (transactionId) => {
    // Prevent double-click: if already completing this ID, bail out
    if (completingId === transactionId) return;
    
    setCompletingId(transactionId);

    // Optimistic UI: immediately update list
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? { ...t, paymentStatus: 'completed', completedAt: new Date().toISOString() }
          : t
      )
    );

    // Also update the detail modal if it's showing this transaction
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
      // Revert optimistic update on failure
      console.error('Error completing order:', error);
      
      // Refetch to get the actual state
      fetchTransactions();
      
      const errorMessage = error.response?.data?.message || 'Gagal menyelesaikan pesanan';
      toast.error(errorMessage);
    } finally {
      setCompletingId(null);
    }
  };

  // ── CANCEL ORDER (with confirmation, idempotent) ──
  const handleCancelOrder = async (transactionId) => {
    if (cancellingId === transactionId) return;

    // Confirmation dialog
    const confirmed = window.confirm('Apakah kamu yakin ingin membatalkan pesanan ini?');
    if (!confirmed) return;

    setCancellingId(transactionId);

    // Optimistic UI
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
    
    // Database stores local time but with UTC suffix, remove the Z and parse as local
    let cleanDateString = dateString;
    if (typeof dateString === 'string' && dateString.endsWith('Z')) {
      cleanDateString = dateString.slice(0, -1); // Remove 'Z' suffix
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

  // ── Computed: summary stats from existing data ──
  const summary = useMemo(() => {
    const total = transactions.length;
    const activeStatuses = STATUS_GROUPS.active.statuses;
    const problematicStatuses = STATUS_GROUPS.problematic.statuses;
    
    const active = transactions.filter((t) => activeStatuses.includes(t.paymentStatus)).length;
    const completed = transactions.filter((t) => t.paymentStatus === 'completed').length;
    const problematic = transactions.filter((t) => problematicStatuses.includes(t.paymentStatus)).length;
    
    // Revenue = sum of paid + completed transactions
    const revenue = transactions
      .filter((t) => ['paid', 'completed'].includes(t.paymentStatus))
      .reduce((sum, t) => sum + (t.total || 0), 0);

    return { total, active, completed, problematic, revenue };
  }, [transactions]);

  // ── Filtered transactions ──
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter — code, name, phone
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        transaction.code.toLowerCase().includes(q) ||
        transaction.name.toLowerCase().includes(q) ||
        (transaction.phone && transaction.phone.toLowerCase().includes(q));

      // Group filter (Semua / Aktif / Selesai / Bermasalah)
      const groupStatuses = STATUS_GROUPS[groupFilter]?.statuses;
      const matchesGroup = !groupStatuses || groupStatuses.includes(transaction.paymentStatus);

      // Detail status dropdown
      const matchesDetail = detailStatusFilter === 'all' || transaction.paymentStatus === detailStatusFilter;

      return matchesSearch && matchesGroup && matchesDetail;
    });
  }, [transactions, search, groupFilter, detailStatusFilter]);

  // ── Available detail statuses for current group ──
  const availableDetailStatuses = useMemo(() => {
    const groupStatuses = STATUS_GROUPS[groupFilter]?.statuses;
    if (!groupStatuses) {
      // "Semua" → show all statuses that exist in data
      return [...new Set(transactions.map((t) => t.paymentStatus))];
    }
    return groupStatuses;
  }, [groupFilter, transactions]);

  // Reset detail filter when switching group
  useEffect(() => {
    setDetailStatusFilter('all');
  }, [groupFilter]);

  // ── Group filter tab counts ──
  const groupCounts = useMemo(() => ({
    all: transactions.length,
    active: transactions.filter((t) => STATUS_GROUPS.active.statuses.includes(t.paymentStatus)).length,
    completed: transactions.filter((t) => STATUS_GROUPS.completed.statuses.includes(t.paymentStatus)).length,
    problematic: transactions.filter((t) => STATUS_GROUPS.problematic.statuses.includes(t.paymentStatus)).length,
  }), [transactions]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola dan pantau semua transaksi pesanan</p>
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

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Transactions */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-primary-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Total Transaksi</p>
              <p className="text-lg font-bold text-gray-900 truncate">{summary.total}</p>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Pendapatan</p>
              <p className="text-lg font-bold text-gray-900 truncate">{formatPrice(summary.revenue)}</p>
            </div>
          </div>

          {/* Active */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Aktif</p>
              <p className="text-lg font-bold text-gray-900">{summary.active}</p>
            </div>
          </div>

          {/* Problematic */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Bermasalah</p>
              <p className="text-lg font-bold text-gray-900">{summary.problematic}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <Card.Body className="py-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Group filter tabs */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg w-fit">
              {Object.entries(STATUS_GROUPS).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => setGroupFilter(key)}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    groupFilter === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {group.label}
                  <span className={`ml-1.5 text-xs ${
                    groupFilter === key ? 'text-primary-500' : 'text-gray-400'
                  }`}>
                    {groupCounts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Row 2: Search + detail filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode, pelanggan, atau nomor telepon..."
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Detail status dropdown */}
              <div className="relative detail-filter-dropdown">
                <button
                  onClick={() => setShowDetailFilter(!showDetailFilter)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm border rounded-lg transition-colors ${
                    detailStatusFilter !== 'all'
                      ? 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>
                    {detailStatusFilter === 'all'
                      ? 'Status Detail'
                      : getStatusConfig(detailStatusFilter).label}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetailFilter ? 'rotate-180' : ''}`} />
                </button>

                {showDetailFilter && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-fade-in">
                    <button
                      onClick={() => { setDetailStatusFilter('all'); setShowDetailFilter(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        detailStatusFilter === 'all' ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
                      }`}
                    >
                      Semua Status
                    </button>
                    {availableDetailStatuses.map((status) => {
                      const config = getStatusConfig(status);
                      return (
                        <button
                          key={status}
                          onClick={() => { setDetailStatusFilter(status); setShowDetailFilter(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                            detailStatusFilter === status ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Meja
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4" colSpan={7}>
                      <div className="animate-pulse h-10 bg-gray-100 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td className="px-5 py-16 text-center text-gray-400" colSpan={7}>
                    <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="font-medium text-gray-500">Tidak ada transaksi ditemukan</p>
                    <p className="text-sm mt-1">Coba ubah filter atau kata pencarian</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const statusCfg = getStatusConfig(transaction.paymentStatus);
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {transaction.code}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{transaction.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{transaction.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {transaction.tableNumber ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded border border-gray-200">
                            Meja {transaction.tableNumber}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900 text-sm">{formatPrice(transaction.total)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => viewDetail(transaction)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* ── Complete Order Button ── */}
                          {transaction.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleCompleteOrder(transaction.id)}
                              disabled={completingId === transaction.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                          {/* ── Cancel Order Button ── */}
                          {['pending', 'paid'].includes(transaction.paymentStatus) && (
                            <button
                              onClick={() => handleCancelOrder(transaction.id)}
                              disabled={cancellingId === transaction.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Batalkan Pesanan"
                            >
                              {cancellingId === transaction.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span className="hidden sm:inline">
                                {cancellingId === transaction.id ? 'Batal...' : 'Batalkan'}
                              </span>
                            </button>
                          )}

                          {/* Show completed badge inline */}
                          {transaction.paymentStatus === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Selesai</span>
                            </span>
                          )}

                          {/* Show cancelled badge inline */}
                          {transaction.paymentStatus === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Dibatalkan</span>
                            </span>
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

        {/* Table footer with count */}
        {!loading && filteredTransactions.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>
        )}
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
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Kode Transaksi</p>
                <p className="font-mono font-semibold mt-1">{selectedTransaction.code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Status</p>
                <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusConfig(selectedTransaction.paymentStatus).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(selectedTransaction.paymentStatus).dot}`} />
                  {getStatusConfig(selectedTransaction.paymentStatus).label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Nama Pelanggan</p>
                <p className="font-medium mt-1">{selectedTransaction.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">No. Telepon</p>
                <p className="font-medium mt-1">{selectedTransaction.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Meja</p>
                <p className="font-medium mt-1">
                  {selectedTransaction.tableNumber ? `Meja ${selectedTransaction.tableNumber}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Tanggal</p>
                <p className="font-medium mt-1">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              {selectedTransaction.completedAt && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Diselesaikan Pada</p>
                  <p className="font-medium text-blue-600 mt-1">{formatDate(selectedTransaction.completedAt)}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Item Pesanan</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTransaction.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.foodName}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatPrice(item.price)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatPrice(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        Total
                      </td>
                      <td className="px-4 py-3 text-lg font-bold text-primary-500 text-right">
                        {formatPrice(selectedTransaction.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Info */}
            {selectedTransaction.paymentMethod && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Metode Pembayaran:</strong> {selectedTransaction.paymentMethod}
                </p>
                {selectedTransaction.externalId && (
                  <p className="text-sm mt-1">
                    <strong>External ID:</strong> {selectedTransaction.externalId}
                  </p>
                )}
              </div>
            )}

            {/* ── Action Buttons in Modal ── */}
            {['pending', 'paid'].includes(selectedTransaction.paymentStatus) && (
              <div className="border-t pt-4 space-y-3">
                {/* Complete button — only for paid */}
                {selectedTransaction.paymentStatus === 'paid' && (
                  <button
                    onClick={() => handleCompleteOrder(selectedTransaction.id)}
                    disabled={completingId === selectedTransaction.id}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 px-6 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
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

                {/* Cancel button — for pending & paid */}
                <button
                  onClick={() => handleCancelOrder(selectedTransaction.id)}
                  disabled={cancellingId === selectedTransaction.id}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl py-3 px-6 font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
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

            {/* Completed info in Modal */}
            {selectedTransaction.paymentStatus === 'completed' && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 rounded-xl py-3 px-6">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Pesanan telah diselesaikan</span>
                </div>
              </div>
            )}

            {/* Cancelled info in Modal */}
            {selectedTransaction.paymentStatus === 'cancelled' && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-center gap-2 bg-orange-50 text-orange-700 rounded-xl py-3 px-6">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Pesanan telah dibatalkan</span>
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
