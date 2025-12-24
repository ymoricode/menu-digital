import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, CreditCard, Shield, Lock, Utensils } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { transactionsAPI, barcodesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, tableNumber, getTotalPrice, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

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

    setLoading(true);

    try {
      let barcodeId = null;
      if (tableNumber) {
        try {
          const barcodeRes = await barcodesAPI.getByTableNumber(tableNumber);
          barcodeId = barcodeRes.data.data?.id;
        } catch (error) {
          console.error('Barcode not found for table:', tableNumber);
        }
      }

      const transactionData = {
        name: formData.name,
        phone: formData.phone,
        barcodeId,
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
      toast.error(error.response?.data?.message || 'Gagal melakukan checkout');
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
            disabled={loading}
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
