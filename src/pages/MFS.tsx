import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MfsTransaction } from '../types';
import { 
  Smartphone, 
  Plus, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Settings as SettingsIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

const MFS = () => {
  const [transactions, setTransactions] = useState<MfsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rates, setRates] = useState({
    bKash: { 'Cash Out': 18.5, 'Send Money': 5.0, 'Cash In': 4.0 },
    Nagad: { 'Cash Out': 14.5, 'Send Money': 0.0, 'Cash In': 2.0 },
    Rocket: { 'Cash Out': 18.0, 'Send Money': 5.0, 'Cash In': 4.5 },
  });

  const [balances, setBalances] = useState({ bKash: 0, Nagad: 0, Rocket: 0 });
  const [commissions, setCommissions] = useState({ bKash: 0, Nagad: 0, Rocket: 0 });

  useEffect(() => {
    // Fetch rates from settings
    const fetchRates = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRates({
            bKash: { 'Cash Out': data.bKashRate || 18.5, 'Send Money': 5.0, 'Cash In': 4.0 },
            Nagad: { 'Cash Out': data.nagadRate || 14.5, 'Send Money': 0.0, 'Cash In': 2.0 },
            Rocket: { 'Cash Out': data.rocketRate || 18.0, 'Send Money': 5.0, 'Cash In': 4.5 },
          });
        }
      } catch (err) {
        console.error('Failed to fetch custom rates:', err);
      }
    };
    fetchRates();

    const unsub = onSnapshot(
      query(collection(db, 'mfs_transactions'), orderBy('created_at', 'desc')), 
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MfsTransaction));
        setTransactions(data);
        
        const newBalances = { bKash: 0, Nagad: 0, Rocket: 0 };
        const newComms = { bKash: 0, Nagad: 0, Rocket: 0 };
        
        data.forEach(t => {
          if (t.type === 'Cash In') newBalances[t.provider] -= t.amount;
          else newBalances[t.provider] += t.amount;
          newComms[t.provider] += t.commission || 0;
        });
        
        setBalances(newBalances);
        setCommissions(newComms);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'mfs_transactions');
      }
    );
    return () => unsub();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const provider = formData.get('provider') as keyof typeof rates;
    const type = formData.get('type') as keyof typeof rates['bKash'];
    const amount = Number(formData.get('amount'));
    
    const rate = rates[provider][type];
    const commission = (amount / 1000) * rate;

    try {
      await addDoc(collection(db, 'mfs_transactions'), {
        provider,
        type,
        amount,
        commission,
        transaction_id: formData.get('transaction_id'),
        customer_phone: formData.get('customer_phone'),
        user_id: 'admin',
        created_at: serverTimestamp()
      });
      setShowForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'mfs_transactions');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mobile Banking</h1>
          <p className="text-gray-500 font-mono text-sm">Agent banking & commission tracking.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/settings"
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E3E0] rounded-lg bg-white text-sm font-medium hover:bg-gray-50 shadow-sm transition-all"
          >
            <SettingsIcon size={16} />
            Config Rates
          </Link>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            New Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['bKash', 'Nagad', 'Rocket'].map((provider) => (
          <div key={provider} className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm relative overflow-hidden">
             <div className={cn(
               "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full",
               provider === 'bKash' ? "bg-pink-600" : provider === 'Nagad' ? "bg-orange-600" : "bg-purple-600"
             )} />
             <div className="flex justify-between items-start mb-6">
               <div className={cn(
                 "p-3 rounded-xl",
                 provider === 'bKash' ? "bg-pink-50 text-pink-600" : provider === 'Nagad' ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
               )}>
                 <Smartphone size={24} />
               </div>
               <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 bg-gray-100 rounded-lg">
                 Agent Wallet
               </span>
             </div>
             <div className="mb-4">
               <h3 className="text-2xl font-bold tracking-tighter">{provider}</h3>
               <p className="label-mini opacity-60">Current Balance</p>
               <p className="text-3xl font-bold tracking-tight mt-1">
                 {formatCurrency(balances[provider as keyof typeof balances])}
               </p>
             </div>
             <div className="pt-4 border-t border-[#E4E3E0] flex justify-between items-center">
               <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Commission Earned</p>
                  <p className="font-bold text-green-600">{formatCurrency(commissions[provider as keyof typeof commissions])}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Total Transferred</p>
                  <p className="font-medium text-xs opacity-60">৳ 1.2M</p>
               </div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E3E0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E3E0] flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <History size={18} />
            Transaction Logs
          </h3>
          <div className="flex gap-2">
             <span className="text-xs text-gray-500 font-mono">Real-time sync enabled</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 label-mini">Provider</th>
                <th className="px-6 py-4 label-mini">Transaction ID / Phone</th>
                <th className="px-6 py-4 label-mini">Type</th>
                <th className="px-6 py-4 label-mini text-right">Amount</th>
                <th className="px-6 py-4 label-mini text-right text-green-600">Commission</th>
                <th className="px-6 py-4 label-mini">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0]">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-mono text-sm">Accessing logs...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-mono text-sm">No transactions found.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-2 h-2 rounded-full",
                           t.provider === 'bKash' ? "bg-pink-500" : t.provider === 'Nagad' ? "bg-orange-500" : "bg-purple-500"
                         )} />
                         <span className="font-bold text-sm">{t.provider}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono">{t.transaction_id || '---'}</p>
                      <p className="text-[10px] text-gray-500">{t.customer_phone || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                        t.type === 'Cash Out' ? "bg-blue-50 text-blue-600" : t.type === 'Cash In' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      )}>
                        {t.type === 'Cash In' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {t.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-green-600 font-bold">
                      +{formatCurrency(t.commission)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono opacity-50">
                      {t.created_at?.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">New MFS Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="label-mini block mb-2">Provider</label>
                <select name="provider" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                </select>
              </div>
              <div>
                <label className="label-mini block mb-2">Transaction Type</label>
                <select name="type" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                  <option value="Cash Out">Cash Out</option>
                  <option value="Cash In">Cash In</option>
                  <option value="Send Money">Send Money</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mini block mb-2">Amount (TK)</label>
                  <input name="amount" type="number" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="label-mini block mb-2">Transaction ID</label>
                  <input name="transaction_id" placeholder="T-XXXXX" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="label-mini block mb-2">Customer Phone</label>
                <input name="customer_phone" placeholder="017XXXXXXXX" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Log Transaction</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MFS;
