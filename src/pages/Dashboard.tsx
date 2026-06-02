import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { dbService } from '../services/supabase';
import { Patient } from '../types';

const Dashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pData = await dbService.patients.getAll();
        setPatients(pData || []);
      } catch (err) {
        console.error('Dashboard data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats
  const totalPatients = patients.length;
  const measuredPatients = patients.filter(p => p.measurements && Object.keys(p.measurements).length > 0).length;
  const measureRate = totalPatients > 0 ? Math.round((measuredPatients / totalPatients) * 100) : 0;

  // Real growth data based on created_at
  const getMonthlyPatients = () => {
    const monthly = new Array(6).fill(0);
    const now = new Date();
    patients.forEach(p => {
      const pDate = new Date(p.created_at);
      const diffMonths = (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        monthly[5 - diffMonths]++;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthly.map((count, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { 
        name: monthNames[d.getMonth()], 
        patients: count,
        orders: Math.round(count * 0.8) // Mocked order ratio
      };
    });
  };

  const chartData = getMonthlyPatients();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="medical-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-blue-50`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 font-bold text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none mb-2">{title}</h3>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Patients" value={totalPatients.toLocaleString()} icon={Users} trend={totalPatients > 0 ? 12 : 0} color="bg-blue-600" />
        <StatCard title="Active Assessments" value={patients.length.toString()} icon={ShoppingBag} trend={8} color="bg-purple-600" />
        <StatCard title="Measurement Accuracy" value={`${measureRate}%`} icon={Activity} trend={5} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 medical-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Growth Analytics</h4>
            <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Live Real-time Data
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {patients.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs tracking-widest">
                No clinical activity recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 medical-card p-8">
          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Clinical Actions</h4>
          <div className="space-y-6">
            {patients.slice(0, 3).map((patient) => (
              <div key={patient.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 leading-tight">{patient.full_name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Assessment</p>
                </div>
                <span className="text-[10px] font-bold text-slate-300">Just now</span>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center px-4">
                <CheckCircle2 className="w-8 h-8 text-slate-100 mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Queue is currently clear</p>
              </div>
            )}
          </div>
          
          <button className="w-full mt-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold text-xs hover:bg-slate-100 transition-colors">
            Activity History
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
