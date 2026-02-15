import { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Package,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Zap,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { MonthlyRevenueChart, WeeklyRevenueChart, TopProductsChart } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

/* ─── Helpers ─── */
const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price || 0);

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'paid':
      return { label: 'Lunas', color: 'text-emerald-400', bg: 'bg-emerald-400/15', dot: 'bg-emerald-400' };
    case 'completed':
      return { label: 'Selesai', color: 'text-sky-400', bg: 'bg-sky-400/15', dot: 'bg-sky-400' };
    case 'pending':
      return { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-400/15', dot: 'bg-amber-400' };
    case 'failed':
    case 'expired':
      return { label: status === 'failed' ? 'Gagal' : 'Expired', color: 'text-rose-400', bg: 'bg-rose-400/15', dot: 'bg-rose-400' };
    case 'cancelled':
      return { label: 'Dibatalkan', color: 'text-orange-400', bg: 'bg-orange-400/15', dot: 'bg-orange-400' };
    default:
      return { label: status, color: 'text-white/40', bg: 'bg-white/5', dot: 'bg-white/30' };
  }
};

/* ─── Shimmer Loading ─── */
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Greeting shimmer */}
    <div className="space-y-2">
      <div className="shimmer h-8 w-64" />
      <div className="shimmer h-5 w-96" />
    </div>
    {/* KPI shimmer */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="shimmer h-[140px]" />
      ))}
    </div>
    {/* Charts shimmer */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 shimmer h-[380px]" />
      <div className="shimmer h-[380px]" />
    </div>
  </div>
);

/* ─── KPI Metric Card ─── */
const MetricCard = ({ title, value, icon: Icon, gradient, trend, subValue, delay = 0 }) => (
  <div
    className="metric-card group animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Glow orb */}
    <div
      className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${gradient}`}
    />

    <div className="relative">
      {/* Icon + Trend */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${gradient} bg-opacity-20`}
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))`,
          }}
        >
          <Icon className="w-5 h-5 text-white/70" />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-[13px] font-medium text-white/40 mb-1">{title}</p>

      {/* Value */}
      <p className="text-2xl font-bold text-white tracking-tight animate-count-up">
        {value}
      </p>

      {/* Sub-value */}
      {subValue && (
        <p className="text-[13px] text-white/30 mt-1">{subValue}</p>
      )}
    </div>
  </div>
);

/* ─── Section Header ─── */
const SectionHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-1">
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="w-4 h-4 text-primary-400" />}
      <h3 className="text-[15px] font-bold text-white/80">{title}</h3>
    </div>
    {action}
  </div>
);

/* ─── Main Dashboard ─── */
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);
  const [weeklyIncome, setWeeklyIncome] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, topRes, monthlyRes, weeklyRes, recentRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getTopProducts(5),
        dashboardAPI.getMonthlyIncome(),
        dashboardAPI.getWeeklyIncome(),
        dashboardAPI.getRecentTransactions(5),
      ]);

      setSummary(summaryRes.data.data);
      setTopProducts(topRes.data.data || []);
      setMonthlyIncome(monthlyRes.data.data || []);
      setWeeklyIncome(weeklyRes.data.data || []);
      setRecentTransactions(recentRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const stats = [
    {
      title: 'Total Pendapatan',
      value: formatPrice(summary?.totalRevenue),
      icon: DollarSign,
      gradient: 'bg-emerald-500',
      trend: '+12%',
    },
    {
      title: 'Transaksi Hari Ini',
      value: summary?.todayTransactions || 0,
      icon: ShoppingBag,
      gradient: 'bg-sky-500',
      subValue: formatPrice(summary?.todayRevenue),
    },
    {
      title: 'Pending Payment',
      value: summary?.pendingTransactions || 0,
      icon: Clock,
      gradient: 'bg-amber-500',
    },
    {
      title: 'Total Produk',
      value: summary?.totalProducts || 0,
      icon: Package,
      gradient: 'bg-violet-500',
    },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Greeting ── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {greeting} 👋
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
            <div className="status-dot-live" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>
        <p className="text-[15px] text-white/35 font-medium">
          Pantau performa restoran kamu secara real-time
        </p>
      </div>

      {/* ── KPI Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <MetricCard key={index} {...stat} delay={index * 80} />
        ))}
      </div>

      {/* ── Revenue Chart + Top Products ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Monthly Revenue — spans 2 cols */}
        <div className="xl:col-span-2 glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <SectionHeader
            icon={TrendingUp}
            title="Pendapatan Bulanan"
            action={
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[12px] font-medium text-white/40">
                {new Date().getFullYear()}
              </div>
            }
          />
          <MonthlyRevenueChart data={monthlyIncome} />
        </div>

        {/* Top Products */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '280ms' }}>
          <SectionHeader icon={Zap} title="Produk Terlaris" />
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-56">
              <div className="text-center">
                <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/25">Belum ada data</p>
              </div>
            </div>
          ) : (
            <TopProductsChart data={topProducts} />
          )}
        </div>
      </div>

      {/* ── Weekly Revenue + Activity Feed ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Revenue */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '360ms' }}>
          <SectionHeader icon={Activity} title="Pendapatan Minggu Ini" />
          <WeeklyRevenueChart data={weeklyIncome} />
        </div>

        {/* Activity Feed — reimagined from plain table */}
        <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '440ms' }}>
          <SectionHeader
            icon={ArrowRight}
            title="Aktivitas Terbaru"
            action={
              <a
                href="/admin/transactions"
                className="text-[12px] font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                Lihat Semua →
              </a>
            }
          />

          {recentTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-56">
              <div className="text-center">
                <Activity className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/25">Belum ada transaksi</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 mt-3">
              {recentTransactions.map((txn, index) => {
                const status = getStatusConfig(txn.paymentStatus);
                return (
                  <div
                    key={txn.id}
                    className="group flex items-center gap-4 p-3 -mx-1 rounded-xl hover:bg-white/[0.03] transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${500 + index * 60}ms` }}
                  >
                    {/* Timeline dot */}
                    <div className="relative flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${status.dot} ring-4 ring-surface`} />
                      {index < recentTransactions.length - 1 && (
                        <div className="w-px h-8 bg-white/[0.06] mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-bold text-white/80 truncate">
                          {txn.name}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/25 font-mono">{txn.code}</p>
                    </div>

                    {/* Amount + Time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-bold text-white/80">
                        {formatPrice(txn.total)}
                      </p>
                      <p className="text-[11px] text-white/20 mt-0.5">
                        {formatTime(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
