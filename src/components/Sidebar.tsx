import React from 'react';
import { 
  Settings, 
  LogOut,
  PlusCircle,
  ChevronLeft,
  ClipboardCheck,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../services/authStore';
import { motion, AnimatePresence } from 'motion/react';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onNavigate, isOpen, onToggle }) => {
  const { profile, user, signOut } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com'].includes(user?.email?.toLowerCase().trim() || '');
  const isAdmin = profile?.role === 'admin' || isSuperEmail;

  const menuItems = [
    { id: 'registration', label: 'Registration', icon: UserPlus },
    { id: 'assessment', label: 'Clinical Assessment', icon: PlusCircle },
    { id: 'registered-assessments', label: 'Registered Assessments', icon: ClipboardCheck },
    ...(isAdmin ? [{ id: 'settings', label: 'Settings & Accounts', icon: Settings }] : []),
  ];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside 
          initial={{ width: 0, opacity: 0, x: -100 }}
          animate={{ width: 288, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-screen flex flex-col bg-white border-r border-slate-100 fixed lg:sticky top-0 left-0 bottom-0 overflow-hidden z-45 whitespace-nowrap shadow-xl lg:shadow-none"
        >
          <div className="p-6 h-full flex flex-col min-w-[288px]">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src={logoImg} 
                    alt="OVERPLAST Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="font-black text-xl tracking-tight text-slate-900 leading-none">OVERPLAST</h1>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-tight block mt-1">Medical Compression<br/>Measurement System</span>
                </div>
              </div>
              <button 
                onClick={onToggle}
                className="p-2 hover:bg-slate-50 rounded-xl lg:hidden text-slate-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "nav-item cursor-pointer",
                    activeSection === item.id && "nav-item-active"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-3xl mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current System Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">Cloud Connected</span>
                </div>
              </div>
              
              <button 
                onClick={() => signOut()}
                className="flex items-center justify-center gap-2.5 w-full px-4 py-3.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 rounded-2xl border border-red-100/60 transition-all font-black text-xs shadow-sm hover:shadow active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                <span>Sign Out / لاگ آؤٹ</span>
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
