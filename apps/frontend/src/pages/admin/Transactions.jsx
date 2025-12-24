import { useState, useEffect } from 'react';
import { Search, Eye, Receipt, Download } from 'lucide-react';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Lunas';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Gagal';
      case 'expired':
        return 'Expired';
      default:
        return status;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500">Riwayat transaksi pesanan</p>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode atau nama..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex space-x-2">
              {['all', 'paid', 'pending', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Semua' : getStatusLabel(status)}
                </button>
              ))}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={7}>
                      <div className="animate-pulse h-12 bg-gray-200 rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-500" colSpan={7}>
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {transaction.code}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.name}</p>
                        <p className="text-sm text-gray-500">{transaction.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.tableNumber ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          Meja {transaction.tableNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatPrice(transaction.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.paymentStatus)}`}>
                        {getStatusLabel(transaction.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => viewDetail(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                <p className="text-sm text-gray-500">Kode Transaksi</p>
                <p className="font-mono font-medium">{selectedTransaction.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTransaction.paymentStatus)}`}>
                  {getStatusLabel(selectedTransaction.paymentStatus)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nama Pelanggan</p>
                <p className="font-medium">{selectedTransaction.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">No. Telepon</p>
                <p className="font-medium">{selectedTransaction.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Meja</p>
                <p className="font-medium">
                  {selectedTransaction.tableNumber ? `Meja ${selectedTransaction.tableNumber}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tanggal</p>
                <p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transactions;
