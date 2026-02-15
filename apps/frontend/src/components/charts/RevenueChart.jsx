import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/* ── Dark Glass Tooltip ── */
const DarkTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-surface !rounded-xl !border-white/[0.1] px-4 py-3 shadow-glass">
      <p className="text-white/50 text-xs font-medium mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-white font-bold text-sm">
          {formatter ? formatter(entry.value, entry.name) : entry.value}
        </p>
      ))}
    </div>
  );
};

/* ── Monthly Revenue Chart ── */
export const MonthlyRevenueChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: monthNames[item.month - 1],
    revenue: item.total,
    orders: item.count,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec751c" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ec751c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            content={<DarkTooltip formatter={(val) => formatCurrency(val)} />}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#ec751c"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: '#ec751c',
              stroke: '#0b0f1a',
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ── Weekly Revenue Chart ── */
export const WeeklyRevenueChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: dayNames[item.day] || item.date,
    revenue: item.total,
    orders: item.count,
  }));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="30%">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<DarkTooltip formatter={(val) => formatCurrency(val)} />}
          />
          <Bar
            dataKey="revenue"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ── Top Products Chart ── */
export const TopProductsChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
    sold: item.totalSold,
    revenue: item.totalRevenue,
  }));

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
          <defs>
            <linearGradient id="topBarGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec751c" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f5b978" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="rgba(255,255,255,0.2)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            content={
              <DarkTooltip
                formatter={(val, name) =>
                  name === 'revenue' ? formatCurrency(val) : `${val} terjual`
                }
              />
            }
          />
          <Bar
            dataKey="sold"
            fill="url(#topBarGradient)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default {
  MonthlyRevenueChart,
  WeeklyRevenueChart,
  TopProductsChart,
};
