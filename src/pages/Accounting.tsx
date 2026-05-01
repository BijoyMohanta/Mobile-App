import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Expense, Sale } from '../types';
import { 
  Receipt, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon,
  Filter,
  Download
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Accounting = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    const unsubExpenses = onSnapshot(
      query(collection(db, 'expenses'), orderBy('expense_date', 'desc')), 
      (snap) => {
        setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'expenses');
      }
    );
    const fetchSales = async () => {
      try {
        const snap = await getDocs(collection(db, 'sales'));
        setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
    };
    fetchSales();
    setLoading(false);
    return () => unsubExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'expenses'), {
        category: formData.get('category'),
        amount: Number(formData.get('amount')),
        note: formData.get('note'),
        expense_date: formData.get('expense_date'),
        created_at: serverTimestamp()
      });
      setShowExpenseModal(false);
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'expenses');
    }
  };

  const totalSales = sales.reduce((acc, s) => acc + s.total_amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const expenseByCategory = expenses.reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  }));

  const COLORS = ['#141414', '#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-gray-500 font-mono text-sm">Financial reports & expense tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E4E3E0] rounded-lg bg-white text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
            <Download size={16} />
            Export P&L
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            Record Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
          <p className="label-mini mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(totalSales)}</h3>
            <span className="text-green-600 text-[10px] font-bold">+5.4%</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp size={14} className="text-green-500" />
            <span>Based on {sales.length} sales</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
          <p className="label-mini mb-1">Total Expenses</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(totalExpenses)}</h3>
            <span className="text-red-600 text-[10px] font-bold">+2.1%</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <TrendingDown size={14} className="text-red-500" />
            <span>Inclusive of payroll</span>
          </div>
        </div>
        <div className="bg-black p-6 rounded-2xl text-white shadow-xl shadow-black/10">
          <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Net Profit</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(netProfit)}</h3>
            <span className={cn(
              "text-[10px] font-bold",
              netProfit >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {netProfit >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs opacity-60">
            <PieIcon size={14} />
            <span>Profitability: {((netProfit / (totalSales || 1)) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
          <h3 className="font-bold mb-6">Expense Distribution</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No expense data</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {pieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-xs font-medium">{item.name}</span>
                <span className="text-[10px] font-mono opacity-50 ml-auto">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E3E0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#E4E3E0] flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-sm">Recent Expenses</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">See All</button>
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
             <table className="w-full text-left border-collapse">
               <tbody className="divide-y divide-[#E4E3E0]">
                 {expenses.map((e) => (
                   <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                       <p className="font-bold text-xs">{e.category}</p>
                       <p className="text-[10px] text-gray-500">{e.expense_date}</p>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <p className="font-bold text-sm">{formatCurrency(e.amount)}</p>
                       <p className="text-[10px] text-gray-400 italic truncate max-w-[150px]">{e.note || '---'}</p>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Record New Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="label-mini block mb-2">Category</label>
                <select name="category" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Internet">Internet</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label-mini block mb-2">Amount (TK)</label>
                <input name="amount" type="number" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div>
                <label className="label-mini block mb-2">Expense Date</label>
                <input name="expense_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div>
                <label className="label-mini block mb-2">Note / Description</label>
                <textarea name="note" rows={2} className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Record</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
