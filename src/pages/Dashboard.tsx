import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Sale, Expense, MfsTransaction } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Smartphone,
  AlertTriangle,
  ReceiptIndianRupee
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const StatCard = ({ label, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-[#E4E3E0] shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="label-mini mb-1">{label}</p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

// We'll need cn here too or just use simple classes
import { cn } from '../lib/utils';

import InitializeData from '../components/InitializeData';

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalExpenses: 0,
    lowStockCount: 0,
    mfsCommission: 0,
    activeEmployees: 0
  });

  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [hasData, setHasData] = useState(true);

  const fetchStats = async () => {
    try {
      const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
      if (productsSnap.empty) {
        setHasData(false);
        return;
      }
      setHasData(true);
      
      // Summary stats
      const salesSnap = await getDocs(query(collection(db, 'sales'), limit(100))); // Adjust range
      const income = salesSnap.docs.reduce((acc, d) => acc + d.data().total_amount, 0);
      
      const expensesSnap = await getDocs(query(collection(db, 'expenses')));
      const spending = expensesSnap.docs.reduce((acc, d) => acc + d.data().amount, 0);

      const mfsSnap = await getDocs(query(collection(db, 'mfs_transactions')));
      const commission = mfsSnap.docs.reduce((acc, d) => acc + d.data().commission, 0);

      const lowStockSnap = await getDocs(query(collection(db, 'products'), where('stock', '<=', 5)));

      setStats({
        todaySales: income,
        totalExpenses: spending,
        lowStockCount: lowStockSnap.size,
        mfsCommission: commission,
        activeEmployees: 5
      });

      const recentSalesSnap = await getDocs(query(collection(db, 'sales'), orderBy('created_at', 'desc'), limit(5)));
      setRecentSales(recentSalesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'Dashboard_Summary');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', sales: 4000, commission: 240 },
    { name: 'Tue', sales: 3000, commission: 139 },
    { name: 'Wed', sales: 2000, commission: 980 },
    { name: 'Thu', sales: 2780, commission: 390 },
    { name: 'Fri', sales: 1890, commission: 480 },
    { name: 'Sat', sales: 2390, commission: 380 },
    { name: 'Sun', sales: 3490, commission: 430 },
  ];

  return (
    <div className="space-y-8">
      {!hasData && (
        <InitializeData onComplete={fetchStats} />
      )}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-500 font-mono text-sm">Real-time business performance analytics.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-[#E4E3E0] rounded-lg bg-white text-sm font-medium hover:bg-gray-50">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Today's Sales" 
          value={formatCurrency(stats.todaySales)} 
          subValue="+12% from yesterday"
          icon={TrendingUp} 
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          label="Total Expenses" 
          value={formatCurrency(stats.totalExpenses)} 
          subValue="Monthly focus"
          icon={TrendingDown} 
          color="bg-red-50 text-red-600"
        />
        <StatCard 
          label="Low Stock Items" 
          value={stats.lowStockCount} 
          subValue="Action required"
          icon={Package} 
          color="bg-orange-50 text-orange-600"
        />
        <StatCard 
          label="MFS Commission" 
          value={formatCurrency(stats.mfsCommission)} 
          subValue="bKash/Nagad/Rocket"
          icon={Smartphone} 
          color="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-[#E4E3E0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Weekly Performance</h3>
            <span className="label-mini">Sales vs Commission</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E3E0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                  tickFormatter={(value) => `৳${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E4E3E0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#141414" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E4E3E0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Recent Sales</h3>
            <Link to="/pos" className="text-blue-600 text-xs font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-[#E4E3E0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <ReceiptIndianRupee size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{sale.invoice_no}</p>
                    <p className="label-mini">{sale.payment_method} • Admin</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatCurrency(sale.total_amount)}</p>
                  <p className="text-[10px] text-gray-500 font-mono">2 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
