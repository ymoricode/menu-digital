import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, CreditCard, Shield, Lock, Utensils, AlertTriangle, RefreshCw } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { transactionsAPI, barcodesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, tableNumber, getTotalPrice, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [checkingTable, setCheckingTable] = useState(false);
  const [tableOccupied, setTableOccupied] = useState(false);
  const [barcodeId, setBarcodeId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  // ── Check table status on mount ──
  useEffect(() => {
    if (tableNumber) {
      checkTableAvailability();
    }
  }, [tableNumber]);

  const checkTableAvailability = async () => {
    if (!tableNumber) return;

    setCheckingTable(true);
    try {
      // First, get barcodeId by table number
      const barcodeRes = await barcodesAPI.getByTableNumber(tableNumber);
      const barcode = barcodeRes.data.data;
      
      if (!barcode) {
        setCheckingTable(false);
        return;
      }

      setBarcodeId(barcode.id);

      // Then check if the table is occupied
      const statusRes = await transactionsAPI.checkTableStatus(barcode.id);
      const status = statusRes.data.data;

      if (status.isOccupied) {
        setTableOccupied(true);
      } else {
        setTableOccupied(false);
      }
    } catch (error) {
      console.error('Error checking table status:', error);
      // Don't block checkout on status-check failure — let the backend's
      // FOR UPDATE lock handle it as the ultimate guard
      setTableOccupied(false);
    } finally {
      setCheckingTable(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor tidak valid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    // Double-check: prevent submit if table is known to be occupied
    if (tableOccupied) {
      toast.error('Meja sedang digunakan. Silakan tunggu.');
      return;
    }

    setLoading(true);

    try {
      // Resolve barcodeId if not already set
      let resolvedBarcodeId = barcodeId;
      if (tableNumber && !resolvedBarcodeId) {
        try {
          const barcodeRes = await barcodesAPI.getByTableNumber(tableNumber);
          resolvedBarcodeId = barcodeRes.data.data?.id;
        } catch (error) {
          console.error('Barcode not found for table:', tableNumber);
        }
      }

      const transactionData = {
        name: formData.name,
        phone: formData.phone,
        barcodeId: resolvedBarcodeId,
        items: items.map((item) => ({
          foodsId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await transactionsAPI.create(transactionData);
      const { checkoutLink, externalId } = response.data.data;

      localStorage.setItem('lastExternalId', externalId);
      clearCart();

      if (checkoutLink) {
        window.location.href = checkoutLink;
      } else {
        toast.error('Gagal mendapatkan link pembayaran');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);

      // ── Handle TABLE_OCCUPIED from backend (409 Conflict) ──
      if (error.response?.status === 409 && error.response?.data?.code === 'TABLE_OCCUPIED') {
        setTableOccupied(true);
        toast.error('Meja sedang digunakan oleh pesanan lain');
      } else {
        toast.error(error.response?.data?.message || 'Gagal melakukan checkout');
      }
      
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const inputClass = (field) => `
    w-full pl-14 pr-4 py-5 text-lg
    bg-gray-50 rounded-2xl
    border-2 transition-all duration-200
    ${errors[field] 
      ? 'border-red-300 bg-red-50' 
      : focusedField === field 
        ? 'border-orange-400 bg-white shadow-lg shadow-orange-100' 
        : 'border-transparent'
    }
    focus:outline-none
  `;

  // ── TABLE OCCUPIED BLOCKING UI ──
  if (tableOccupied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              ⚠️ Meja Sedang Digunakan
            </h1>

            <p className="text-gray-500 mb-2 text-lg">
              Meja <span className="font-bold text-orange-500">{tableNumber}</span> sedang diproses untuk pesanan lain.
            </p>

            <p className="text-gray-400 mb-8 text-sm">
              Silakan tunggu sampai pesanan sebelumnya selesai, atau hubungi kasir untuk bantuan.
            </p>

            {/* Retry Button */}
            <button
              onClick={() => {
                setTableOccupied(false);
                checkTableAvailability();
              }}
              disabled={checkingTable}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-orange-200 disabled:opacity-50 active:scale-[0.98] transition-all mb-4"
            >
              {checkingTable ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Cek Ulang Ketersediaan
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-2xl py-4 font-semibold text-base hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state while checking table ──
  if (checkingTable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Memeriksa ketersediaan meja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <span className="text-sm text-gray-500">Lengkapi data pemesanan</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 pb-48">
        {/* Order Summary Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Utensils className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Ringkasan Pesanan</h2>
              {tableNumber && (
                <span className="text-orange-500 text-sm font-medium">Meja {tableNumber}</span>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} <span className="text-gray-400">x{item.quantity}</span>
                </span>
                <span className="text-gray-800 font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-xl text-orange-500">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Informasi Pemesan
          </h2>
          
          <div className="space-y-4">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400">
                <User className="w-full h-full" />
              </div>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nama lengkap"
                className={inputClass('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 ml-2">{errors.name}</p>
              )}
            </div>

            {/* Phone Input */}
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400">
                <Phone className="w-full h-full" />
              </div>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                placeholder="08123456789"
                className={inputClass('phone')}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 ml-2">{errors.phone}</p>
              )}
            </div>

          </div>
        </div>

        {/* Payment Method Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Xendit Payment</h3>
              <p className="text-sm text-gray-500">Berbagai metode pembayaran</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Pembayaran aman & terenkripsi</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Payment */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 rounded-t-3xl shadow-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-sm text-gray-500">Total Pembayaran</span>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Aman</span>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || tableOccupied}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                <span>Bayar Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
