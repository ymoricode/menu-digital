import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Utensils } from 'lucide-react';
import { getImageUrl } from '../../services/api';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const {
    items,
    tableNumber,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();

  // Check for table number - redirect if missing
  useEffect(() => {
    if (!tableNumber) {
      toast.error('Silakan scan QR code meja terlebih dahulu');
      navigate('/', { replace: true });
    }
  }, [tableNumber, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Keranjang</h1>
            {totalItems > 0 && (
              <span className="text-sm text-gray-500">{totalItems} item</span>
            )}
          </div>
          
          {items.length > 0 ? (
            <button
              onClick={clearCart}
              className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </div>

      {/* Table Number Banner */}
      {tableNumber && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-white/80 text-sm">Pesanan untuk</span>
            <p className="text-white font-bold text-lg">Meja {tableNumber}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 pb-64">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-16 h-16 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Keranjang Kosong
            </h3>
            <p className="text-gray-500 text-center mb-8 max-w-xs">
              Belum ada menu yang ditambahkan. Yuk pilih menu favoritmu!
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-200 active:scale-95 transition-transform"
            >
              Lihat Menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 shadow-sm flex gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image */}
                <div className="w-24 h-24 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-orange-500 font-bold text-lg">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementQuantity(item.id)}
                        className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <Minus className="w-5 h-5 text-gray-600" />
                      </button>
                      <span className="w-10 text-center font-bold text-lg text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => incrementQuantity(item.id)}
                        className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 active:scale-90 transition-transform"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom Summary */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 rounded-t-3xl shadow-2xl">
          <div className="px-6 py-6">
            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal ({totalItems} item)</span>
                <span className="text-gray-800 font-medium">{formatPrice(totalPrice)}</span>
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between">
                <span className="font-bold text-gray-800 text-lg">Total</span>
                <span className="font-bold text-2xl text-orange-500">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-transform"
            >
              Lanjut ke Pembayaran
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
