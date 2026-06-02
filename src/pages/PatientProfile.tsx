import React, { useEffect, useState } from 'react';
import { 
  User, 
  ArrowLeft, 
  Calendar, 
  Activity, 
  Stethoscope, 
  MapPin, 
  Phone,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import ReportModal from '../components/ReportModal';
import { dbService } from '../services/supabase';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onStartAssessment: (patient: Patient) => void;
  onViewOrder?: (orderId: string) => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patient, onBack, onStartAssessment, onViewOrder }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await dbService.orders.getByPatient(patient.id);
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch patient orders:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [patient.id]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        patient={patient} 
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Back to Registry</span>
        </button>
        
        <button 
          onClick={() => onStartAssessment(patient)}
          className="btn-primary flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          New Clinical Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="medical-card p-8 text-center space-y-6">
            <div className="mx-auto w-32 h-32 bg-slate-100 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
              {patient.photo_url ? (
                <img src={patient.photo_url} alt={patient.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-300" />
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{patient.full_name}</h2>
              <p className="text-slate-500 font-medium">Patient ID: {patient.id.slice(0, 8)}</p>
            </div>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-2xl bg-blue-50/50">
                <span className="block text-blue-600 font-bold text-lg">{patient.age}</span>
                <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Age</span>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-50">
                <span className="block text-slate-600 font-bold text-lg capitalize">{patient.gender ? patient.gender.charAt(0) : 'O'}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Gender</span>
              </div>
            </div>

            <div className="space-y-4 pt-6 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium">{patient.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium leading-relaxed">{patient.address}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <span className="text-sm font-medium leading-relaxed">City: {patient.city || 'Karachi'}</span>
              </div>
            </div>
          </div>

          <div className="medical-card p-6 border-l-4 border-l-blue-600">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Attending Physician
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {patient.doctor_name[3]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{patient.doctor_name}</p>
                <p className="text-xs text-slate-500">Primary Consultant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="medical-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Clinical Data & Assessments</h3>
                <p className="text-slate-500 text-sm mt-1">Reviewing saved diagnostic records</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Enabled
              </div>
            </div>

            <div className="space-y-6">
              {/* Latest Assessment */}
              <div className="p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-blue-200 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">
                        {patient.diagnosis || 'No diagnosis recorded'}
                      </h4>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Last Modified: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    COMPLETED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Medical Condition</span>
                    <p className="text-slate-700 font-medium text-sm">
                      {patient.medical_condition || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Garment Specifications</span>
                    <p className="text-slate-700 font-medium text-sm">
                      {patient.diagnosis?.includes('Assessment') ? 'Precision Compression Gear' : 'Not specified'}
                    </p>
                  </div>
                </div>

                {patient.notes && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Doctor's Clinical Notes</span>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words italic">
                      "{patient.notes}"
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end">
                  <button 
                    onClick={() => setIsReportOpen(true)}
                    className="text-blue-600 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    View Full Report
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
