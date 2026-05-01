import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Smartphone, 
  ReceiptIndianRupee, 
  Users, 
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const SidebarItem = ({ to, icon: Icon, label, collapsed }: { to: string; icon: any; label: string; collapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
        isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
      )}
    >
      <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-gray-500 group-hover:text-black")} />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-medium whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {label}
        </div>
      )}
    </Link>
  );
};

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F3]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className="flex flex-col border-r border-[#E4E3E0] bg-white h-full relative z-30"
      >
        <div className="p-4 flex items-center justify-between border-bottom h-16">
          {!collapsed && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold tracking-tighter"
            >
              CLOUD ERP
            </motion.h1>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
          <SidebarItem to="/pos" icon={ShoppingCart} label="POS" collapsed={collapsed} />
          <SidebarItem to="/products" icon={Package} label="Products" collapsed={collapsed} />
          <SidebarItem to="/mfs" icon={Smartphone} label="Mobile Banking" collapsed={collapsed} />
          <SidebarItem to="/accounting" icon={ReceiptIndianRupee} label="Accounting" collapsed={collapsed} />
          <SidebarItem to="/hrm" icon={Users} label="HRM" collapsed={collapsed} />
          <SidebarItem to="/settings" icon={SettingsIcon} label="Settings" collapsed={collapsed} />
        </nav>

        <div className="p-3 border-t border-[#E4E3E0]">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="h-16 border-b border-[#E4E3E0] bg-white flex items-center px-8 justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <span className="text-sm font-mono opacity-50 uppercase tracking-widest">System Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-xs uppercase">
              AD
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
