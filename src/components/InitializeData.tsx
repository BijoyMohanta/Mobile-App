import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sparkles } from 'lucide-react';

const InitializeData = ({ onComplete }: { onComplete: () => void }) => {
  const [loading, setLoading] = useState(false);

  const seed = async () => {
    setLoading(true);
    try {
      // 1. Products
      const products = [
        { name: 'iPhone 15 Pro Max', sku: 'IP15PM-256', purchase_price: 135000, selling_price: 145000, stock: 10, low_stock_threshold: 2, category: 'Mobile Phone' },
        { name: 'Samsung Galaxy S24 Ultra', sku: 'S24U-512', purchase_price: 125000, selling_price: 138000, stock: 5, low_stock_threshold: 1, category: 'Mobile Phone' },
        { name: 'AirPods Pro (2nd Gen)', sku: 'APP2', purchase_price: 22000, selling_price: 26500, stock: 15, low_stock_threshold: 3, category: 'Audio' },
        { name: '20W USB-C Power Adapter', sku: 'ADP-20W', purchase_price: 1800, selling_price: 2500, stock: 50, low_stock_threshold: 5, category: 'Charger' },
        { name: 'Silicone Case for iPhone 15', sku: 'CASE-IP15', purchase_price: 1200, selling_price: 2200, stock: 3, low_stock_threshold: 5, category: 'Case' },
      ];

      for (const p of products) {
        await addDoc(collection(db, 'products'), p);
      }

      // 2. Employees
      const employees = [
        { name: 'Rahat Islam', phone: '01712345678', role: 'Manager', salary_type: 'Monthly', base_salary: 35000, commission_rate: 1 },
        { name: 'Fatima Zohra', phone: '01887654321', role: 'Sales Executive', salary_type: 'Commission', base_salary: 12000, commission_rate: 3 },
      ];

      for (const e of employees) {
        await addDoc(collection(db, 'employees'), e);
      }

      onComplete();
    } catch (err) {
      console.error(err);
      alert('Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
          <Sparkles size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Welcome to Cloud ERP</h2>
          <p className="opacity-90 max-w-sm">It looks like your database is empty. Would you like to seed some sample products and staff members to get started?</p>
        </div>
      </div>
      <button 
        onClick={seed}
        disabled={loading}
        className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold shadow-lg hover:shadow-white/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? 'Initializing...' : 'Seed Sample Data'}
      </button>
    </div>
  );
};

export default InitializeData;
