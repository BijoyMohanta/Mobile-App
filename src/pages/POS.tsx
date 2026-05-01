import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Sale, SaleItem } from '../types';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Smartphone,
  CreditCard,
  Banknote,
  Printer,
  Barcode
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<(Product & { cartQuantity: number })[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Rocket'>('Cash');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev;
        return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(p => p.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.id === productId) {
        const newQty = Math.max(1, Math.min(p.stock, p.cartQuantity + delta));
        return { ...p, cartQuantity: newQty };
      }
      return p;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.cartQuantity), 0);
  const total = subtotal - discount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      
      // 1. Create Sale
      const saleRef = await addDoc(collection(db, 'sales'), {
        invoice_no: invoiceNo,
        total_amount: total,
        discount,
        tax: 0,
        payment_method: paymentMethod,
        user_id: 'admin',
        created_at: serverTimestamp()
      });

      // 2. Create Sale Items & Update Stock
      for (const item of cart) {
        await addDoc(collection(db, `sales/${saleRef.id}/items`), {
          product_id: item.id,
          quantity: item.cartQuantity,
          price: item.selling_price,
          cost: item.purchase_price,
          subtotal: item.selling_price * item.cartQuantity
        });

        // Decrement stock
        const productRef = doc(db, 'products', item.id);
        await updateDoc(productRef, {
          stock: increment(-item.cartQuantity)
        });
      }

      // 3. If MFS, log commission (Simple logic for now, using default rates)
      if (paymentMethod !== 'Cash') {
        const rates: any = { bKash: 18.5, Nagad: 14.5, Rocket: 18.0 };
        const comm = (total / 1000) * rates[paymentMethod];
        
        await addDoc(collection(db, 'mfs_transactions'), {
          provider: paymentMethod,
          type: 'Cash Out', // Assuming POS payment is treated as shop agent cash out
          amount: total,
          commission: comm,
          transaction_id: `T-${invoiceNo}`,
          user_id: 'admin',
          created_at: serverTimestamp()
        });
      }

      setCheckoutSuccess(invoiceNo);
      setCart([]);
      setDiscount(0);
      
      // Refresh products (simple way)
      const q = query(collection(db, 'products'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sales/POS_checkout');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Product Browser */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products by name, SKU or scan barcode..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E4E3E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Try to add first match if exactly one match or exact SKU/Barcode
                    if (filteredProducts.length > 0) {
                      addToCart(filteredProducts[0]);
                      setSearch('');
                    }
                  }
                }}
              />
            </div>
            <button className="p-3 bg-white border border-[#E4E3E0] rounded-xl hover:bg-gray-50 transition-colors">
              <Barcode size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "flex flex-col text-left bg-white p-4 rounded-xl border border-[#E4E3E0] hover:border-black transition-all hover:shadow-md h-full group",
                    product.stock <= 0 && "opacity-50 cursor-not-allowed grayscale"
                  )}
                >
                  <div className="flex-1">
                    <p className="label-mini mb-1">{product.category}</p>
                    <h4 className="font-bold text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono mb-1">SKU: {product.sku}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-end">
                    <span className="font-bold text-lg">{formatCurrency(product.selling_price)}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      product.stock > 5 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {product.stock} left
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-full lg:w-96 flex flex-col bg-white border border-[#E4E3E0] rounded-2xl shadow-xl overflow-hidden shrink-0">
          <div className="p-6 border-b border-[#E4E3E0] flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart size={18} />
              Current Order
            </h3>
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
              {cart.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold truncate">{item.name}</h4>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{formatCurrency(item.selling_price)}/pc</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-gray-100 text-gray-600"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-gray-100 text-gray-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-[#E4E3E0] space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Discount</span>
                  <input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-16 bg-white border border-gray-200 rounded px-1 py-0.5 text-right text-xs"
                  />
                </div>
                <span className="font-medium text-red-500">-{formatCurrency(discount)}</span>
              </div>
              <div className="pt-3 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl tracking-tighter">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="label-mini">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Cash', icon: Banknote },
                  { id: 'bKash', icon: Smartphone },
                  { id: 'Nagad', icon: Smartphone },
                  { id: 'Rocket', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                      paymentMethod === method.id 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    )}
                  >
                    <method.icon size={14} />
                    {method.id}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:grayscale"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <CreditCard size={20} />
                  Proceed to Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {checkoutSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Printer size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Receipt Ready</h3>
                <p className="text-gray-500 text-sm">Invoice {checkoutSuccess} generated successfully.</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print Invoice
                </button>
                <button 
                  onClick={() => setCheckoutSuccess(null)}
                  className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-600"
                >
                  New Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
