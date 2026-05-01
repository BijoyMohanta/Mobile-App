import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  RefreshCw,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      barcode: formData.get('barcode') as string,
      category: formData.get('category') as string,
      purchase_price: Number(formData.get('purchase_price')),
      selling_price: Number(formData.get('selling_price')),
      stock: Number(formData.get('stock')),
      low_stock_threshold: Number(formData.get('low_stock_threshold')),
      woo_id: formData.get('woo_id') as string,
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setShowModal(false);
      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-500 font-mono text-sm">Manage your inventory and stock levels.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E4E3E0] rounded-lg bg-white text-sm font-medium hover:bg-gray-50 shadow-sm transition-all">
            <RefreshCw size={16} />
            Sync WooCommerce
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E3E0] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E3E0] flex items-center justify-between bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E4E3E0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-black/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
               <Download size={18} />
             </button>
             <button className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
               <Upload size={18} />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 label-mini">Product Detail</th>
                <th className="px-6 py-4 label-mini">SKU / Category</th>
                <th className="px-6 py-4 label-mini text-right">Purchase Price</th>
                <th className="px-6 py-4 label-mini text-right">Selling Price</th>
                <th className="px-6 py-4 label-mini text-center">Stock</th>
                <th className="px-6 py-4 label-mini">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3E0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-mono text-sm">
                    Accessing database...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-mono text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-[#E4E3E0]">
                          <Package size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          {p.barcode && <p className="text-[10px] text-gray-500 font-mono">BC: {p.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono">{p.sku}</p>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm opacity-60">
                      {formatCurrency(p.purchase_price)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold">
                      {formatCurrency(p.selling_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={cn(
                        "inline-flex flex-col items-center",
                        p.stock <= p.low_stock_threshold ? "text-red-500" : "text-gray-700"
                      )}>
                        <span className="font-bold text-sm tracking-tighter">{p.stock}</span>
                        <span className="text-[9px] uppercase font-bold opacity-50">Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingProduct(p); setShowModal(true); }}
                          className="p-2 hover:bg-black hover:text-white rounded-lg transition-colors border border-transparent shadow-sm"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-transparent shadow-sm text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-orange-500" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-sm text-gray-500">Enter product details for inventory management.</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="label-mini block mb-2">Product Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingProduct?.name} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">SKU</label>
                  <input 
                    name="sku" 
                    defaultValue={editingProduct?.sku} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Barcode (Optional)</label>
                  <input 
                    name="barcode" 
                    defaultValue={editingProduct?.barcode} 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Purchase Price</label>
                  <input 
                    name="purchase_price" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingProduct?.purchase_price} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Selling Price</label>
                  <input 
                    name="selling_price" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingProduct?.selling_price} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Current Stock</label>
                  <input 
                    name="stock" 
                    type="number" 
                    defaultValue={editingProduct?.stock} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Low Stock Threshold</label>
                  <input 
                    name="low_stock_threshold" 
                    type="number" 
                    defaultValue={editingProduct?.low_stock_threshold || 5} 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>
                <div>
                  <label className="label-mini block mb-2">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editingProduct?.category} 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                  >
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Audio">Audio</option>
                    <option value="Charger">Charger</option>
                    <option value="Case">Case</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label-mini block mb-2">WooCommerce ID</label>
                  <input 
                    name="woo_id" 
                    defaultValue={editingProduct?.woo_id} 
                    className="w-full px-4 py-3 bg-gray-50 border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm" 
                  />
                </div>

                <div className="col-span-2 pt-6 flex gap-4">
                   <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-8 py-4 border border-[#E4E3E0] rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-colors shadow-xl"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
