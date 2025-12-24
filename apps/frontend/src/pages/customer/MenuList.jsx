import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingCart, Utensils, X, Flame, Star, Clock } from 'lucide-react';
import { menuAPI, getImageUrl } from '../../services/api';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

const MenuList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tableNumber: storedTableNumber, setTableNumber, getTotalItems, getTotalPrice, addItem, getItemQuantity, incrementQuantity, decrementQuantity } = useCart();
  
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Check for table number - redirect if missing
  useEffect(() => {
    const tableFromUrl = searchParams.get('table');
    
    if (tableFromUrl) {
      setTableNumber(tableFromUrl);
    } else if (!storedTableNumber) {
      // No table number in URL or storage, redirect to scan page
      toast.error('Silakan scan QR code meja terlebih dahulu');
      navigate('/', { replace: true });
    }
  }, [searchParams, storedTableNumber, setTableNumber, navigate]);

  // Get effective table number
  const tableNumber = searchParams.get('table') || storedTableNumber;

  // Fetch menus and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menusRes, categoriesRes] = await Promise.all([
          menuAPI.getAll({ search, category: selectedCategory }),
          menuAPI.getCategories(),
        ]);
        setMenus(menusRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error('Error fetching menus:', error);
        toast.error('Gagal memuat menu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, selectedCategory]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (e, menu) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(menu);
    toast.success(`${menu.name} ditambahkan`, {
      icon: '🛒',
      duration: 1500,
    });
  };

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {/* Top Bar */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">Menu Digital</h1>
                {tableNumber && (
                  <span className="text-xs text-orange-600 font-medium">Meja {tableNumber}</span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigate('/cart')}
              className="relative w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Mau makan apa hari ini?"
              className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Scroll */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              Semua
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-200'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="px-4 py-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-3 animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-2xl mb-3" />
                <div className="h-4 bg-gray-200 rounded-full mb-2" />
                <div className="h-4 bg-gray-200 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-100 rounded-3xl mx-auto flex items-center justify-center mb-4">
              <Utensils className="w-12 h-12 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Menu tidak ditemukan
            </h3>
            <p className="text-gray-500">Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {menus.map((menu) => {
              const quantity = getItemQuantity(menu.id);
              
              return (
                <Link
                  key={menu.id}
                  to={`/menu/${menu.id}`}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {menu.image ? (
                      <img
                        src={getImageUrl(menu.image)}
                        alt={menu.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {menu.categoryName && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                        {menu.categoryName}
                      </span>
                    )}

                    {/* Quantity Badge */}
                    {quantity > 0 && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">{quantity}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-tight">
                      {menu.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-500 font-bold text-base">
                        {formatPrice(menu.price)}
                      </span>
                      
                      <button
                        onClick={(e) => handleAddToCart(e, menu)}
                        className="w-9 h-9 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200 active:scale-90 transition-transform"
                      >
                        <span className="text-xl font-medium">+</span>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-xl shadow-orange-200 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm opacity-90">{totalItems} item</span>
                <span className="block font-bold text-lg">{formatPrice(totalPrice)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
              <span className="font-semibold">Checkout</span>
              <span className="text-lg">→</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuList;
