import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, Utensils, Sparkles } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const ScanQR = () => {
  const navigate = useNavigate();
  const { setTableNumber } = useCart();
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const onScanSuccess = (decodedText) => {
    try {
      const url = new URL(decodedText);
      const tableNumber = url.searchParams.get('table');
      
      if (tableNumber) {
        setTableNumber(tableNumber);
        navigate(`/menu?table=${tableNumber}`);
      } else {
        setTableNumber(decodedText);
        navigate(`/menu?table=${decodedText}`);
      }
    } catch (error) {
      setTableNumber(decodedText);
      navigate(`/menu?table=${decodedText}`);
    }
  };

  const onScanFailure = () => {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-56 h-56 bg-orange-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-12">
        {/* Header */}
        <div className="text-center mb-auto pt-8 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full scale-150" />
            <div className="relative w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto transform rotate-3">
              <Utensils className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mt-6 drop-shadow-lg">
            Menu Digital
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Pesan makanan dengan mudah
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-sm mx-auto animate-slide-up">
          {!scanning ? (
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/50">
              {/* Scan Button */}
              <button
                onClick={() => setScanning(true)}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 mb-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xl font-bold">Scan QR Code</span>
                    <span className="block text-white/80 text-sm">Arahkan kamera ke QR meja</span>
                  </div>
                </div>
              </button>

              {/* Info */}
              <p className="text-center text-gray-500 text-sm mb-6">
                Scan QR code yang tersedia di meja anda untuk mulai memesan
              </p>

              {/* Features */}
              <div className="flex justify-center gap-6 text-center">
                {[
                  { icon: '🍔', label: 'Menu Lengkap' },
                  { icon: '⚡', label: 'Cepat' },
                  { icon: '💳', label: 'Bayar Online' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 border border-white/50">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Scanning...
                </div>
              </div>
              
              <div id="qr-reader" className="rounded-2xl overflow-hidden mb-4" />
              
              <button
                onClick={() => setScanning(false)}
                className="w-full py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Bottom Decoration */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-white/50 text-xs">© Bakso Putra Solo</p>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
