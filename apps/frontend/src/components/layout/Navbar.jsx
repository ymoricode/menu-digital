import { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const initials = (user?.name || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-[72px] px-4 md:px-8">
        {/* Left: Mobile menu */}
        <button
          onClick={onMenuClick}
          className="p-2.5 text-white/50 hover:text-white/80 hover:bg-white/[0.06] rounded-xl lg:hidden transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-xl transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full shadow-glow-sm" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-white/[0.08]" />

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white/90 leading-tight">
                {user?.name || 'Admin'}
              </p>
              <p className="text-[11px] text-white/35 leading-tight">
                {user?.email || 'admin@menu.com'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow-sm">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
