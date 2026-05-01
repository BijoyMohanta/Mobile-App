import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Employee, Payroll } from '../types';
import { 
  Users, 
  Plus, 
  Calendar, 
  Smartphone, 
  UserPlus,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const HRM = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snap) => {
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'employees'));

    const unsubPayroll = onSnapshot(query(collection(db, 'payroll'), orderBy('year', 'desc')), (snap) => {
      setPayroll(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'payroll'));
    
    setLoading(false);
    return () => { unsubEmployees(); unsubPayroll(); };
  }, []);

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'employees'), {
        name: formData.get('name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        salary_type: formData.get('salary_type'),
        base_salary: Number(formData.get('base_salary')),
        commission_rate: Number(formData.get('commission_rate')) || 0,
      });
      setShowEmployeeModal(false);
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'employees');
    }
  };

  const handleProcessPayroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeId = formData.get('employee_id') as string;
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const base_paid = Number(formData.get('base_paid'));
    const bonus = Number(formData.get('bonus'));
    const deductions = Number(formData.get('deductions'));
    const net_payable = base_paid + bonus - deductions;

    try {
      await addDoc(collection(db, 'payroll'), {
        employee_id: employeeId,
        month: formData.get('month'),
        year: Number(formData.get('year')),
        base_paid,
        bonus,
        deductions,
        net_payable,
        status: 'Unpaid',
        created_at: serverTimestamp()
      });
      setShowPayrollModal(false);
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, 'payroll');
    }
  };

  const markAsPaid = async (payrollId: string) => {
    try {
      await updateDoc(doc(db, 'payroll', payrollId), {
        status: 'Paid',
        paid_at: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `payroll/${payrollId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Human Resources</h1>
          <p className="text-gray-500 font-mono text-sm">Staff management & payroll system.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPayrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#E4E3E0] rounded-lg bg-white text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <Calendar size={16} />
            Generate Payroll
          </button>
          <button 
            onClick={() => setShowEmployeeModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
          >
            <UserPlus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staff List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E4E3E0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E3E0] bg-gray-50/50">
              <h3 className="font-bold text-sm">Active Employees ({employees.length})</h3>
            </div>
            <div className="divide-y divide-[#E4E3E0]">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.role} • {emp.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block mb-1">
                      {emp.salary_type}
                    </p>
                    <p className="font-bold text-sm">{formatCurrency(emp.base_salary)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E3E0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E3E0] bg-gray-50/50">
              <h3 className="font-bold text-sm">Payroll History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 label-mini">Month / Staff</th>
                    <th className="px-6 py-4 label-mini text-right">Net Payable</th>
                    <th className="px-6 py-4 label-mini text-center">Status</th>
                    <th className="px-6 py-4 label-mini">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E3E0]">
                  {payroll.map((p) => {
                    const emp = employees.find(e => e.id === p.employee_id);
                    return (
                      <tr key={p.id}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm">{p.month} {p.year}</p>
                          <p className="text-xs text-gray-500">{emp?.name || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-sm">{formatCurrency(p.net_payable)}</p>
                          <p className="text-[10px] text-gray-400">Bonus: {formatCurrency(p.bonus)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                            p.status === 'Paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {p.status === 'Unpaid' && (
                            <button 
                              onClick={() => markAsPaid(p.id)}
                              className="text-xs font-bold text-blue-600 hover:underline"
                            >
                              Pay Now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Attendance Widget */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Quick Statistics
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="label-mini mb-1">Total Monthly Liability</p>
                <p className="text-2xl font-bold tracking-tight">৳ 124,500</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="label-mini mb-1 text-green-700">Salary Paid (This Month)</p>
                <p className="text-2xl font-bold tracking-tight text-green-700">৳ 85,000</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="label-mini mb-1 text-orange-700">Due/Unpaid</p>
                <p className="text-2xl font-bold tracking-tight text-orange-700">৳ 39,500</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E4E3E0] shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-gray-400" />
              Recruitment Status
            </h3>
            <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <Users className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm font-medium text-gray-500">No open positions</p>
              <button className="text-blue-600 text-xs font-bold mt-2 hover:underline">Create Posting</button>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Register Staff</h3>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="label-mini block mb-2">Full Name</label>
                <input name="name" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-mini block mb-2">Phone</label>
                  <input name="phone" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
                <div>
                  <label className="label-mini block mb-2">Position / Role</label>
                  <input name="role" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="label-mini block mb-2">Salary Type</label>
                  <select name="salary_type" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                    <option value="Commission">Commission</option>
                  </select>
                </div>
                <div>
                  <label className="label-mini block mb-2">Base Salary</label>
                  <input name="base_salary" type="number" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div>
                <label className="label-mini block mb-2">Commission Rate (%)</label>
                <input name="commission_rate" type="number" step="0.1" defaultValue="0" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Register Staff</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Process Payroll</h3>
            <form onSubmit={handleProcessPayroll} className="space-y-4">
              <div>
                <label className="label-mini block mb-2">Employee</label>
                <select name="employee_id" required className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="label-mini block mb-2">Month</label>
                  <select name="month" className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5">
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-mini block mb-2">Year</label>
                  <input name="year" type="number" defaultValue={new Date().getFullYear()} className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label-mini block mb-2">Base Paid</label>
                  <input name="base_paid" type="number" required className="w-full px-2 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" />
                </div>
                <div>
                  <label className="label-mini block mb-2">Bonus</label>
                  <input name="bonus" type="number" defaultValue="0" className="w-full px-2 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" />
                </div>
                <div>
                  <label className="label-mini block mb-2">Deduct</label>
                  <input name="deductions" type="number" defaultValue="0" className="w-full px-2 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPayrollModal(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold">Process</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HRM;
