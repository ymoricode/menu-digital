import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Utensils, Heart, Share2 } from 'lucide-react';
import { menuAPI, getImageUrl } from '../../services/api';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

const MenuDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, getItemQuantity, getTotalItems, getTotalPrice } = useCart();
  
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await menuAPI.getById(id);
        setMenu(response.data.data);
      } catch (error) {
        console.error('Error fetching menu:', error);
        toast.error('Gagal memuat detail menu');
        navigate('/menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [id, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(menu);
    }
    toast.success(`${quantity}x ${menu.name} ditambahkan`, {
      icon: '✅',
    });
    navigate('/cart');
  };

  const totalItems = getTotalItems();
  const cartQuantity = menu ? getItemQuantity(menu.id) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-3xl mx-auto flex items-center justify-center mb-4">
            <Utensils className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Menu tidak ditemukan</h3>
          <button
            onClick={() => navigate('/menu')}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-2xl"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-[45vh] bg-gradient-to-br from-gray-100 to-gray-200">
        {menu.image && (
          <img
            src={getImageUrl(menu.image)}
            alt={menu.name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {!menu.image && (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="w-24 h-24 text-gray-300" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          
          <div className="flex gap-2">
            <button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <Heart className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-6 h-6 text-gray-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Badge */}
        {menu.categoryName && (
          <div className="absolute bottom-4 left-4">
            <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-700 shadow-lg">
              {menu.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Content Card */}
      <div className="relative -mt-8 bg-white rounded-t-[2rem] min-h-[55vh] pb-36">
        <div className="px-6 pt-8">
          {/* Handle Bar */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

          {/* Title & Price */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {menu.name}
            </h1>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-500">
                {formatPrice(menu.price)}
              </span>
              {cartQuantity > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {cartQuantity} di keranjang
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {menu.description && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Deskripsi
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {menu.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="bg-gray-50 rounded-3xl p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">
              Jumlah Pesanan
            </h3>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
              >
                <Minus className="w-6 h-6 text-gray-600" />
              </button>
              
              <div className="w-20 text-center">
                <span className="text-4xl font-bold text-gray-800">{quantity}</span>
              </div>
              
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-gray-500">Total Harga</span>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(menu.price * quantity)}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-200 active:scale-[0.98] transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          Tambah ke Keranjang
        </button>
      </div>
    </div>
  );
};

export default MenuDetail;
