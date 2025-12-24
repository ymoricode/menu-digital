import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowRight, RefreshCw, Home, Receipt, Sparkles } from 'lucide-react';
import { transactionsAPI } from '../../services/api';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [transaction, setTransaction] = useState(null);
  const [checkCount, setCheckCount] = useState(0);
  const [checking, setChecking] = useState(false);

  const externalId = searchParams.get('external_id') || localStorage.getItem('lastExternalId');

  const checkStatus = async () => {
    if (!externalId) {
      setStatus('error');
      return;
    }
    
    setChecking(true);
    try {
      // Use sync endpoint to check Xendit API and update database
      const response = await transactionsAPI.syncPaymentStatus(externalId);
      const data = response.data.data;
      
      setTransaction(data);
      
      if (data.paymentStatus === 'paid') {
        setStatus('success');
        localStorage.removeItem('lastExternalId');
        localStorage.removeItem('cart'); // Clear cart on success
      } else if (data.paymentStatus === 'failed' || data.paymentStatus === 'expired') {
        setStatus('failed');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Fallback to getByExternalId if sync fails
      try {
        const response = await transactionsAPI.getByExternalId(externalId);
        const data = response.data.data;
        setTransaction(data);
        
        if (data.paymentStatus === 'paid') {
          setStatus('success');
        } else if (data.paymentStatus === 'failed' || data.paymentStatus === 'expired') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      } catch (fallbackError) {
        setStatus('error');
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // Auto-refresh for pending status every 5 seconds, max 30 times
    const interval = setInterval(() => {
      if (status === 'pending' && checkCount < 30) {
        checkStatus();
        setCheckCount((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [externalId, status, checkCount]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
            <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Memeriksa Pembayaran</h2>
            <p className="text-gray-500 text-center">Mohon tunggu sebentar...</p>
          </div>
        );

      case 'success':
        return (
          <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 px-6 py-12">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150 animate-pulse" />
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <CheckCircle className="w-20 h-20 text-green-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-white/90 font-medium">Pembayaran Berhasil!</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>

              <h1 className="text-4xl font-bold text-white mb-2">Terima Kasih!</h1>
              <p className="text-white/80 text-lg mb-8">Pesanan Anda sedang diproses</p>

              {/* Transaction Card */}
              {transaction && (
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-8">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-500">No. Pesanan</p>
                      <p className="font-bold text-gray-800">{transaction.code}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nama</span>
                      <span className="text-gray-800 font-medium">{transaction.name}</span>
                    </div>
                    {transaction.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Meja</span>
                        <span className="text-gray-800 font-medium">{transaction.tableNumber}</span>
                      </div>
                    )}
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatPrice(transaction.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full max-w-sm bg-white text-green-600 font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              >
                <Home className="w-6 h-6" />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 px-6 py-12">
            <div className="flex flex-col items-center text-center">
              {/* Pending Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150" />
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Clock className="w-20 h-20 text-amber-500 animate-pulse" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">Menunggu Pembayaran</h1>
              <p className="text-white/80 text-lg mb-8">
                Silakan selesaikan pembayaran Anda
              </p>

              {transaction && (
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-8">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">No. Pesanan</span>
                      <span className="text-gray-800 font-medium">{transaction.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">Total</span>
                      <span className="font-bold text-xl text-orange-500">
                        {formatPrice(transaction.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-white/80 text-sm mb-6">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memeriksa status pembayaran...</span>
              </div>

              <div className="space-y-3 w-full max-w-sm">
                {transaction?.checkoutLink && (
                  <a
                    href={transaction.checkoutLink}
                    className="w-full bg-white text-orange-600 font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                  >
                    Lanjutkan Pembayaran
                    <ArrowRight className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-sm"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-500 px-6 py-12">
            <div className="flex flex-col items-center text-center">
              {/* Failed Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150" />
                <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <XCircle className="w-20 h-20 text-red-500" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">Pembayaran Gagal</h1>
              <p className="text-white/80 text-lg mb-8">
                Maaf, pembayaran tidak dapat diproses
              </p>

              {transaction && (
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mb-8">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">No. Pesanan</span>
                      <span className="text-gray-800 font-medium">{transaction.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="text-red-500 font-medium capitalize">
                        {transaction.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 w-full max-w-sm">
                <button
                  onClick={() => navigate('/menu')}
                  className="w-full bg-white text-red-600 font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                >
                  Coba Pesan Lagi
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white/20 text-white font-bold py-4 rounded-2xl backdrop-blur-sm"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
            <div className="w-24 h-24 bg-gray-200 rounded-3xl flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-gray-500 text-center mb-8">
              Tidak dapat memuat informasi pembayaran
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-xl"
            >
              Kembali ke Beranda
            </button>
          </div>
        );
    }
  };

  return renderContent();
};

export default PaymentResult;
