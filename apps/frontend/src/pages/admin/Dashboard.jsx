import { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import { MonthlyRevenueChart, WeeklyRevenueChart, TopProductsChart } from '../../components/charts/RevenueChart';
import toast from 'react-hot-toast';

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Pendapatan',
      value: formatPrice(summary?.totalRevenue),
      icon: DollarSign,
      color: 'bg-green-500',
      trend: '+12%',
    },
    {
      title: 'Transaksi Hari Ini',
      value: summary?.todayTransactions || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      subValue: formatPrice(summary?.todayRevenue),
    },
    {
      title: 'Pending Payment',
      value: summary?.pendingTransactions || 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Produk',
      value: summary?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Selamat datang di panel admin Menu Digital</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <Card.Body className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {stat.trend && (
                  <span className="flex items-center text-sm text-green-600 font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.subValue && (
                <p className="text-sm text-gray-500 mt-1">{stat.subValue}</p>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Pendapatan Bulanan</h3>
              <select className="text-sm border rounded-lg px-3 py-1">
                <option>{new Date().getFullYear()}</option>
              </select>
            </div>
          </Card.Header>
          <Card.Body>
            <MonthlyRevenueChart data={monthlyIncome} />
          </Card.Body>
        </Card>

        {/* Top Products */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">Produk Terlaris</h3>
          </Card.Header>
          <Card.Body>
            <TopProductsChart data={topProducts} />
          </Card.Body>
        </Card>
      </div>

      {/* Weekly Revenue & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">Pendapatan Minggu Ini</h3>
          </Card.Header>
          <Card.Body>
            <WeeklyRevenueChart data={weeklyIncome} />
          </Card.Body>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">Transaksi Terbaru</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y">
              {recentTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Belum ada transaksi
                </div>
              ) : (
                recentTransactions.map((txn) => (
                  <div key={txn.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{txn.code}</p>
                      <p className="text-sm text-gray-500">{txn.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(txn.total)}
                      </p>
                      <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(txn.paymentStatus)}`}>
                        {txn.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
