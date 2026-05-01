import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Settings as SettingsIcon, 
  Smartphone, 
  Globe, 
  Store,
  Save,
  ShieldCheck,
  Bell,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'shop' | 'mfs' | 'woo' | 'firebase'>('shop');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [config, setConfig] = useState({
    shopName: 'My Mobile Hub',
    shopAddress: '123 Tech Street, Dhaka',
    shopPhone: '01711223344',
    bKashRate: 18.5,
    nagadRate: 14.5,
    rocketRate: 18.0,
    wooUrl: '',
    wooKey: '',
    wooSecret: '',
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseProjectId: '',
    firebaseStorageBucket: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as typeof config);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/general');
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrorDetails(null);
    try {
      await setDoc(doc(db, 'settings', 'general'), config);
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus('error');
      setErrorDetails(err instanceof Error ? err.message : String(err));
      // Still call handleFirestoreError for logging
      try {
        handleFirestoreError(err, OperationType.WRITE, 'settings/general');
      } catch (e) {
        // Already handled locally
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 font-mono text-sm animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl relative">
      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-full shadow-2xl font-bold"
          >
            <CheckCircle2 size={20} />
            Settings Updated Successfully
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] max-w-md w-full bg-red-50 border-2 border-red-200 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle size={24} />
                <h4 className="font-bold">Update Failed</h4>
              </div>
              <button onClick={() => setStatus(null)} className="p-1 hover:bg-red-100 rounded-full text-red-400">
                <X size={20} />
              </button>
            </div>
            <div className="bg-white border border-red-100 rounded-xl p-4 overflow-auto max-h-48">
              <p className="text-xs font-mono text-red-900 whitespace-pre-wrap break-all">
                {errorDetails}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 font-mono text-sm">Configure your business logic and integrations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: 'shop', label: 'Shop Information', icon: Store },
            { id: 'mfs', label: 'Commission Rates', icon: Smartphone },
            { id: 'woo', label: 'WooCommerce', icon: Globe },
            { id: 'firebase', label: 'Firebase Config', icon: Server },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === item.id 
                  ? "bg-black text-white shadow-lg" 
                  : "bg-white border border-[#E4E3E0] text-gray-500 hover:border-black/20"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <div className="pt-8 border-t border-[#E4E3E0] mt-8" />
          <div className="px-4 py-3 opacity-40 grayscale pointer-events-none space-y-1">
             <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
               <ShieldCheck size={18} /> Security
             </div>
             <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
               <Bell size={18} /> Notifications
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-[#E4E3E0] shadow-sm overflow-hidden">
          <form onSubmit={handleSave} className="p-8 space-y-6">
            {activeTab === 'shop' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Basic Info</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label-mini block mb-2">Shop Name</label>
                      <input 
                        value={config.shopName}
                        onChange={(e) => setConfig({...config, shopName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2">Address</label>
                      <input 
                        value={config.shopAddress}
                        onChange={(e) => setConfig({...config, shopAddress: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2">Primary Phone</label>
                      <input 
                        value={config.shopPhone}
                        onChange={(e) => setConfig({...config, shopPhone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mfs' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Agent Commission Rates (Per 1000 TK)</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold">B</div>
                        <span className="font-bold text-pink-800">bKash Rate</span>
                      </div>
                      <input 
                        type="number" step="0.1" 
                        value={config.bKashRate}
                        onChange={(e) => setConfig({...config, bKashRate: Number(e.target.value)})}
                        className="w-24 px-3 py-2 text-right font-mono font-bold text-pink-900 bg-white rounded-lg border border-pink-200" 
                      />
                    </div>
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600 font-bold">N</div>
                        <span className="font-bold text-orange-800">Nagad Rate</span>
                      </div>
                      <input 
                        type="number" step="0.1" 
                        value={config.nagadRate}
                        onChange={(e) => setConfig({...config, nagadRate: Number(e.target.value)})}
                        className="w-24 px-3 py-2 text-right font-mono font-bold text-orange-900 bg-white rounded-lg border border-orange-200" 
                      />
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold">R</div>
                        <span className="font-bold text-purple-800">Rocket Rate</span>
                      </div>
                      <input 
                        type="number" step="0.1" 
                        value={config.rocketRate}
                        onChange={(e) => setConfig({...config, rocketRate: Number(e.target.value)})}
                        className="w-24 px-3 py-2 text-right font-mono font-bold text-purple-900 bg-white rounded-lg border border-purple-200" 
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Standard commission is calculated as: (Amount / 1000) * Rate.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'woo' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                 <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">WooCommerce Integration</h3>
                  <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs flex gap-3">
                    <Globe size={16} className="shrink-0" />
                    <p>Connect your online store to sync products and inventory automatically.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label-mini block mb-2">Store URL</label>
                      <input 
                        placeholder="https://example.com"
                        value={config.wooUrl}
                        onChange={(e) => setConfig({...config, wooUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2">Consumer Key</label>
                      <input 
                        type="password"
                        value={config.wooKey}
                        onChange={(e) => setConfig({...config, wooKey: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2">Consumer Secret</label>
                      <input 
                        type="password"
                        value={config.wooSecret}
                        onChange={(e) => setConfig({...config, wooSecret: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'firebase' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                 <div className="space-y-4">
                  <h3 className="font-bold border-b pb-2">Firebase Configuration</h3>
                  <div className="p-4 bg-orange-50 text-orange-800 rounded-xl text-xs flex gap-3">
                    <Database size={16} className="shrink-0" />
                    <p>Configure your Google Firebase project parameters for database and authentication services.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_API_KEY</label>
                      <input 
                        type="password"
                        value={config.firebaseApiKey}
                        onChange={(e) => setConfig({...config, firebaseApiKey: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_AUTH_DOMAIN</label>
                      <input 
                        value={config.firebaseAuthDomain}
                        onChange={(e) => setConfig({...config, firebaseAuthDomain: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_PROJECT_ID</label>
                      <input 
                        value={config.firebaseProjectId}
                        onChange={(e) => setConfig({...config, firebaseProjectId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_STORAGE_BUCKET</label>
                      <input 
                        value={config.firebaseStorageBucket}
                        onChange={(e) => setConfig({...config, firebaseStorageBucket: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div>
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_MESSAGING_SENDER_ID</label>
                      <input 
                        value={config.firebaseMessagingSenderId}
                        onChange={(e) => setConfig({...config, firebaseMessagingSenderId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label-mini block mb-2 font-mono uppercase tracking-widest text-[10px]">VITE_FIREBASE_APP_ID</label>
                      <input 
                        value={config.firebaseAppId}
                        onChange={(e) => setConfig({...config, firebaseAppId: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-8 border-t flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-bold shadow-xl hover:shadow-black/20 hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : <><Save size={18} /> Update Settings</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
