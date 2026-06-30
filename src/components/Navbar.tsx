import React from 'react';
import { Bell, Search, User, Plus, Menu, ChevronRight, Shield, Database, LogOut } from 'lucide-react';
import { useAuthStore } from '../services/authStore';
import { motion } from 'motion/react';
import { isDemo } from '../services/supabase';

interface NavbarProps {
  title: string;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar, isSidebarOpen }) => {
  const { user, profile, signOut } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com'].includes(user?.email?.toLowerCase().trim() || '');
  const isAdmin = profile?.role === 'admin' || isSuperEmail;
  const displayRole = isAdmin ? 'Administrator' : profile?.role === 'technician' ? 'Technician' : 'Therapist';

  return (
    <header className="h-20 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-slate-100 sticky top-0 z-10 select-none">
      <div className="flex items-center gap-4 min-w-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSidebar}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors shrink-0"
        >
          {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </motion.button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 md:gap-6 min-w-0">
          <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">{title}</h2>
          {isDemo ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-[8px] sm:text-[9px] font-black tracking-widest uppercase shrink-0">
              <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 animate-pulse animate-duration-1000" />
              DEMO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] sm:text-[9px] font-black tracking-widest uppercase shrink-0">
              <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
              LIVE
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <div className="relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients, orders..." 
            className="w-80 pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 border-l border-slate-100 pl-2 sm:pl-6">
          <button className="w-10 h-10 rounded-xl hover:bg-slate-50 items-center justify-center text-slate-400 relative hidden sm:flex shrink-0">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none">
                {profile?.full_name || user?.email?.split('@')[0] || 'Medical Staff'}
              </p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                {displayRole}
              </p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center border-2 border-white shadow-sm overflow-hidden hidden sm:flex shrink-0">
              <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            {/* Prominent High Visibility Sign Out Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                signOut();
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 transition-all font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-sm shrink-0"
              title="Sign Out / لاگ آؤٹ"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
