import { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, CheckCheck, Trash2, ShoppingBag, CreditCard, Clock } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';

const Navbar = ({ onMenuClick }) => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAllRead, clearAll, connected } = useNotifications();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'new_transaction':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'payment_expired':
        return <Clock className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const timeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Spacer */}
        <div className="flex-1 lg:ml-0" />

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {/* Connection indicator */}
              <span
                className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
                  connected ? 'bg-green-400' : 'bg-gray-300'
                }`}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500">{unreadCount} belum dibaca</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Tandai semua dibaca"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAll()}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus semua"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Belum ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map((notif, index) => (
                      <div
                        key={`${notif.timestamp}-${index}`}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          !notif.read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5 p-2 bg-gray-100 rounded-lg">
                          {getIcon(notif.type)}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          {notif.total && (
                            <p className="text-xs font-semibold text-primary-600 mt-1">
                              {formatPrice(notif.total)}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {timeAgo(notif.timestamp)}
                          </p>
                        </div>
                        {/* Unread dot */}
                        {!notif.read && (
                          <span className="flex-shrink-0 mt-2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email || 'admin@menu.com'}
              </p>
            </div>
            <div className="p-2 bg-primary-100 rounded-full">
              <User className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
