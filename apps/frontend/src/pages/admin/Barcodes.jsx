import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, QrCode, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { barcodesAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Barcodes = () => {
  const [barcodes, setBarcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: '' });

  useEffect(() => {
    fetchBarcodes();
  }, []);

  const fetchBarcodes = async () => {
    try {
      const response = await barcodesAPI.getAll();
      setBarcodes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching barcodes:', error);
      toast.error('Gagal memuat data barcode');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ tableNumber: '' });
    setSelectedBarcode(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openDeleteModal = (barcode) => {
    setSelectedBarcode(barcode);
    setDeleteModalOpen(true);
  };

  const openQRModal = (barcode) => {
    setSelectedBarcode(barcode);
    setQrModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tableNumber.trim()) {
      toast.error('Nomor meja wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      await barcodesAPI.create(formData);
      toast.success('Barcode berhasil dibuat');
      setModalOpen(false);
      resetForm();
      fetchBarcodes();
    } catch (error) {
      console.error('Error creating barcode:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat barcode');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async (barcode) => {
    try {
      await barcodesAPI.regenerate(barcode.id);
      toast.success('QR code berhasil di-regenerate');
      fetchBarcodes();
    } catch (error) {
      console.error('Error regenerating QR:', error);
      toast.error('Gagal regenerate QR code');
    }
  };

  const handleDelete = async () => {
    if (!selectedBarcode) return;

    setSubmitting(true);

    try {
      await barcodesAPI.delete(selectedBarcode.id);
      toast.success('Barcode berhasil dihapus');
      setDeleteModalOpen(false);
      setSelectedBarcode(null);
      fetchBarcodes();
    } catch (error) {
      console.error('Error deleting barcode:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus barcode');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = (barcode, format = 'png') => {
    const modalCanvas = document.querySelector(`#qr-modal-${barcode.id} canvas`);
    const gridCanvas = document.querySelector(`#qr-${barcode.id} canvas`);
    const canvas = modalCanvas || gridCanvas;
    
    if (!canvas) {
      toast.error('QR Code tidak ditemukan');
      return;
    }

    const downloadCanvas = document.createElement('canvas');
    const size = 400;
    downloadCanvas.width = size;
    downloadCanvas.height = size;
    const ctx = downloadCanvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(canvas, 0, 0, size, size);
    
    let mimeType = 'image/png';
    let extension = 'png';
    if (format === 'jpeg' || format === 'jpg') {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    }
    
    const dataUrl = downloadCanvas.toDataURL(mimeType, 0.95);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-meja-${barcode.tableNumber}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`QR Code berhasil didownload`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Barcodes / QR Codes</h1>
          <p className="text-white/35 text-sm font-medium">Kelola QR code untuk setiap meja</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Buat QR Code
        </Button>
      </div>

      {/* Barcodes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="shimmer h-[280px]" />
          ))}
        </div>
      ) : barcodes.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <QrCode className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/70 mb-2">
              Belum ada QR Code
            </h3>
            <p className="text-white/30 mb-5">
              Buat QR code untuk setiap meja di restoran Anda
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Buat QR Code Pertama
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {barcodes.map((barcode) => (
            <Card key={barcode.id}>
              <Card.Body className="text-center">
                {/* QR Code Preview */}
                <div
                  id={`qr-${barcode.id}`}
                  className="bg-white p-4 rounded-xl mb-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => openQRModal(barcode)}
                >
                  <QRCodeCanvas
                    value={barcode.qrValue}
                    size={150}
                    level="M"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>

                {/* Table Number */}
                <h3 className="text-xl font-bold text-white/90 mb-1">
                  Meja {barcode.tableNumber}
                </h3>
                <p className="text-xs text-white/25 mb-4">
                  {formatDate(barcode.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex justify-center space-x-1">
                  <button
                    onClick={() => downloadQR(barcode)}
                    className="p-2.5 text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRegenerate(barcode)}
                    className="p-2.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(barcode)}
                    className="p-2.5 text-danger-400 hover:bg-danger-400/10 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Buat QR Code Baru"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nomor Meja"
            value={formData.tableNumber}
            onChange={(e) => setFormData({ tableNumber: e.target.value })}
            placeholder="Contoh: 1, 2, A1, VIP1"
            required
          />

          <div className="bg-accent-400/10 text-accent-300 p-3 rounded-xl text-sm border border-accent-400/15">
            QR code akan mengarahkan pelanggan ke menu dengan nomor meja yang tertera.
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Buat QR Code
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Detail Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`QR Code Meja ${selectedBarcode?.tableNumber}`}
        size="md"
      >
        {selectedBarcode && (
          <div className="text-center">
            <div id={`qr-modal-${selectedBarcode.id}`} className="bg-white p-6 rounded-xl mb-4 inline-block">
              <QRCodeCanvas
                value={selectedBarcode.qrValue}
                size={250}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-xs text-white/25 mb-4 break-all font-mono">
              {selectedBarcode.qrValue}
            </p>

            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => downloadQR(selectedBarcode, 'png')}>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button variant="secondary" onClick={() => downloadQR(selectedBarcode, 'jpg')}>
                <Download className="w-4 h-4 mr-2" />
                Download JPG
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus QR Code"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-danger-500/15 rounded-full mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-danger-400" />
          </div>
          <p className="text-white/60 mb-6">
            Apakah Anda yakin ingin menghapus QR code untuk{' '}
            <strong className="text-white/90">Meja {selectedBarcode?.tableNumber}</strong>?
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Barcodes;
