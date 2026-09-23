import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle, XCircle, RefreshCw, ArrowLeft, Home, Sparkles, Receipt, AlertTriangle, Smartphone } from 'lucide-react';
import { transactionsAPI } from '../../services/api';

const QRISPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [status, setStatus] = useState('loading'); // loading, waiting, success, failed, expired, error
  const [transaction, setTransaction] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [checking, setChecking] = useState(false);
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const pollCountRef = useRef(0);

  const MAX_POLLS = 180; // 15 minutes at 5-second intervals

  // ── Get transaction data from navigation state or localStorage ──
  useEffect(() => {
    const txData = location.state?.transaction;
    
    if (txData) {
      setTransaction(txData);
      localStorage.setItem('pendingQRISTransaction', JSON.stringify(txData));
      setStatus('waiting');

      // Calculate countdown from expiresAt
      if (txData.expiresAt) {
        const expiresAt = new Date(txData.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        // Default 15 minutes
        setTimeLeft(15 * 60);
      }
    } else {
      // Try to recover from localStorage
      const stored = localStorage.getItem('pendingQRISTransaction');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTransaction(parsed);
          setStatus('waiting');
          // Don't set countdown from stored data — we'll rely on polling
          setTimeLeft(null);
        } catch {
          setStatus('error');
        }
      } else {
        setStatus('error');
      }
    }

    return () => {
      clearInterval(pollIntervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [location.state]);

  // ── Countdown timer ──
  useEffect(() => {
    if (status !== 'waiting' || timeLeft === null) return;

    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [status, timeLeft !== null]);

  // ── Payment status polling ──
  useEffect(() => {
    if (status !== 'waiting' || !transaction) return;

    const pollStatus = async () => {
      if (pollCountRef.current >= MAX_POLLS) {
        clearInterval(pollIntervalRef.current);
        return;
      }

      pollCountRef.current += 1;

      try {
        const response = await transactionsAPI.checkPaymentStatus(transaction.id);
        const data = response.data.data;

        if (data.paymentStatus === 'paid' || data.paymentStatus === 'completed') {
          setStatus('success');
          setTransaction((prev) => ({ ...prev, ...data }));
          localStorage.removeItem('pendingQRISTransaction');
          localStorage.removeItem('cart');
          clearInterval(pollIntervalRef.current);
          clearInterval(countdownRef.current);
        } else if (data.paymentStatus === 'failed') {
          setStatus('failed');
          clearInterval(pollIntervalRef.current);
          clearInterval(countdownRef.current);
        } else if (data.paymentStatus === 'expired') {
          setStatus('expired');
          clearInterval(pollIntervalRef.current);
          clearInterval(countdownRef.current);
        } else if (data.paymentStatus === 'cancelled') {
          setStatus('failed');
          clearInterval(pollIntervalRef.current);
          clearInterval(countdownRef.current);
        }
      } catch (error) {
        console.error('Poll error:', error);
        // Don't stop polling on network errors — just retry
      }
    };

    // Initial check
    pollStatus();

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(pollStatus, 5000);

    return () => clearInterval(pollIntervalRef.current);
  }, [status, transaction?.id]);

  // ── Manual status check ──
  const handleManualCheck = async () => {
    if (!transaction) return;
    setChecking(true);
    
    try {
      // Use sync endpoint (calls Xendit API) for manual check
      const response = await transactionsAPI.syncPaymentStatus(transaction.external_id || transaction.externalId);
      const data = response.data.data;

      if (data.paymentStatus === 'paid' || data.paymentStatus === 'completed') {
        setStatus('success');
        setTransaction((prev) => ({ ...prev, ...data }));
        localStorage.removeItem('pendingQRISTransaction');
        localStorage.removeItem('cart');
      } else if (data.paymentStatus === 'failed') {
        setStatus('failed');
      } else if (data.paymentStatus === 'expired') {
        setStatus('expired');
      }
    } catch (error) {
      console.error('Manual check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get QR string from transaction data
  const qrString = transaction?.qrString || transaction?.checkout_link || transaction?.checkoutLink;

  // ── LOADING STATE ──
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
        <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Mempersiapkan QRIS</h2>
        <p className="text-gray-500 text-center">Mohon tunggu sebentar...</p>
      </div>
    );
  }

  // ── ERROR STATE (no transaction data) ──
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-gray-200 rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
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

  // ── SUCCESS STATE ──
  if (status === 'success') {
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
                <div className="flex justify-between">
                  <span className="text-gray-500">Pembayaran</span>
                  <span className="text-gray-800 font-medium">QRIS</span>
                </div>
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
  }

  // ── EXPIRED STATE ──
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl scale-150" />
            <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <Clock className="w-20 h-20 text-amber-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">QRIS Kedaluwarsa</h1>
          <p className="text-white/80 text-lg mb-8">
            Waktu pembayaran telah habis
          </p>

          <div className="space-y-3 w-full max-w-sm">
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-white text-orange-600 font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              Pesan Lagi
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
  }

  // ── FAILED STATE ──
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-rose-500 to-pink-500 px-6 py-12">
        <div className="flex flex-col items-center text-center">
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
  }

  // ── WAITING STATE (main QRIS display) ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Pembayaran QRIS</h1>
            <span className="text-sm text-gray-500">Scan untuk membayar</span>
          </div>
          {timeLeft !== null && (
            <div className={`px-4 py-2 rounded-2xl font-mono font-bold text-lg ${
              timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 
              timeLeft < 180 ? 'bg-amber-100 text-amber-600' : 
              'bg-blue-100 text-blue-600'
            }`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 pb-48 max-w-lg mx-auto">
        {/* Order Info */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">No. Pesanan</span>
            <span className="font-mono font-bold text-gray-800">{transaction?.code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Pembayaran</span>
            <span className="text-2xl font-bold text-orange-500">{formatPrice(transaction?.total)}</span>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
          <div className="flex flex-col items-center">
            {/* QRIS Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-full">
                QRIS
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* QR Code */}
            {qrString ? (
              <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-inner">
                <QRCodeSVG
                  value={qrString}
                  size={240}
                  level="M"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 text-center">QR Code tidak tersedia</p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <p className="text-gray-700 font-semibold">
                  Scan menggunakan aplikasi pembayaran
                </p>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                GoPay • DANA • OVO • ShopeePay • LinkAja
                <br />
                Mobile Banking • dan aplikasi lainnya yang mendukung QRIS
              </p>
            </div>
          </div>
        </div>

        {/* Status & Polling */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-gray-600 font-medium">Menunggu Pembayaran</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Otomatis</span>
            </div>
          </div>
        </div>

        {/* Manual Check Button */}
        <button
          onClick={handleManualCheck}
          disabled={checking}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-blue-200 disabled:opacity-70 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-4"
        >
          {checking ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Memeriksa...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Cek Status Pembayaran
            </>
          )}
        </button>

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-100 text-gray-600 rounded-2xl py-4 font-semibold text-base hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

export default QRISPayment;
