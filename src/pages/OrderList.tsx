import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Printer,
  Trash2,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { dbService } from '../services/supabase';

interface OrderListProps {
  onPatientSelect?: (patientId: string) => void;
  onNewOrder?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ onPatientSelect, onNewOrder }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await dbService.orders.getAll();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const patientName = order.patient?.full_name || order.patient_name || 'Unknown Patient';
    return patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           order.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStats = () => {
    return {
      manufacturing: orders.filter(o => o.status === 'In Production').length,
      ready: orders.filter(o => o.status === 'Ready').length,
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading production queue...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Production Queue</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Manage and track garment manufacturing status</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text"
              placeholder="Search ID or Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onNewOrder}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <Package className="w-4 h-4" />
              New Order
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4 text-slate-400" />
              Batch Print
            </button>
          </div>
        </div>
      </div>

      <div className="medical-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">ID</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Referring Doctor</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Garment Type</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center opacity-30">
                    <Package className="w-12 h-12 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {searchQuery ? 'No matching orders found' : 'No Orders in Production'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.map((order) => {
              const patientName = order.patient?.full_name || order.patient_name || 'Patient';
              const date = new Date(order.created_at).toLocaleDateString();
              
              const statusColors: any = {
                'Ready': 'bg-blue-500',
                'In Production': 'bg-indigo-500',
                'Quality Check': 'bg-orange-500',
                'Delivered': 'bg-emerald-500'
              };

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-mono font-black text-slate-900 group-hover:text-blue-600 transition-colors">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900">{patientName}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">Ordered {date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] font-black text-slate-900">{order.doctor_name || order.doctorRef || 'Self-Referral'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">{order.garment_type || order.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", statusColors[order.status] || 'bg-slate-300')} />
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{order.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-slate-300">
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 mr-2">
                        <input 
                          type="checkbox"
                          checked={order.status === 'Ready'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={async (e) => {
                            const newStatus = e.target.checked ? 'Ready' : 'In Production';
                            
                            // Optimistic local update
                            setOrders(prev => prev.map(o => 
                              o.id === order.id ? { ...o, status: newStatus } : o
                            ));

                            try {
                              await dbService.orders.update(order.id, { status: newStatus });
                            } catch (err) {
                              console.error('Update failed:', err);
                              const freshData = await dbService.orders.getAll();
                              setOrders(freshData);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight pointer-events-none">Ready</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.patient_id) onPatientSelect?.(order.patient_id);
                        }}
                        className="p-2 hover:bg-white rounded-lg hover:text-blue-500 transition-all text-slate-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === order.id ? (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2 py-1 animate-in fade-in zoom-in-95 duration-200"
                        >
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Are you sure?</span>
                          <button 
                            onClick={async () => {
                              const orderId = order.id;
                              setConfirmDeleteId(null);
                              
                              // Set local state to show deleting
                              setOrders(prev => prev.map(o => 
                                o.id === orderId ? { ...o, isDeleting: true } : o
                              ));

                              try {
                                await dbService.orders.delete(orderId);
                                setOrders(prev => prev.filter(o => o.id !== orderId));
                              } catch (err) {
                                console.error('Delete failed:', err);
                                const freshData = await dbService.orders.getAll();
                                setOrders(freshData);
                              }
                            }}
                            className="text-[10px] font-black bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                          >
                            YES
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] font-black text-slate-500 hover:text-slate-700"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(order.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all disabled:opacity-50"
                          title="Delete Order"
                          disabled={order.isDeleting}
                        >
                          {order.isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button className="p-2 hover:bg-white rounded-lg hover:text-blue-500 transition-all text-slate-300">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'In Manufacturing', count: stats.manufacturing, icon: Package, color: 'text-blue-500' },
          { label: 'Ready for Pickup', count: stats.ready, icon: Truck, color: 'text-emerald-500' },
        ].map(card => (
          <div key={card.label} className="medical-card p-6 flex items-center justify-between group hover:border-blue-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-2xl font-black text-slate-900">{card.count}</p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-200 group-hover:text-blue-500 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
