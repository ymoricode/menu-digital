import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  QrCode,
  Receipt,
  LogOut,
  X,
  ChefHat,
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Products',
    path: '/admin/products',
    icon: UtensilsCrossed,
  },
  {
    name: 'Categories',
    path: '/admin/categories',
    icon: Tags,
  },
  {
    name: 'Barcodes',
    path: '/admin/barcodes',
    icon: QrCode,
  },
  {
    name: 'Transactions',
    path: '/admin/transactions',
    icon: Receipt,
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-[260px] flex flex-col
        bg-surface-200/80 backdrop-blur-xl border-r border-white/[0.06]
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      {/* ── Brand ── */}
      <div className="flex items-center justify-between h-[72px] px-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow-sm">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white tracking-tight">
              Menu Digital
            </span>
            <span className="block text-[10px] font-medium text-white/30 uppercase tracking-[0.15em]">
              Admin Panel
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded-lg lg:hidden transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={{ animationDelay: `${index * 50}ms` }}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 animate-slide-right ${
                isActive
                  ? 'bg-primary-500/15 text-primary-400 shadow-[inset_0_0_0_1px_rgba(236,117,28,0.15)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-white/40 group-hover:text-white/60'
                  }`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-glow-sm" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Logout ── */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 rounded-xl text-[14px] font-medium
            text-white/40 hover:text-danger-400 hover:bg-danger-500/10
            transition-all duration-300 group"
        >
          <div className="p-1.5 rounded-lg text-white/30 group-hover:text-danger-400 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
