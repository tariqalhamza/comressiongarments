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
  ClipboardCheck,
  Plus,
  Eye,
  Trash2,
  Layers,
  HelpCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import ReportModal from '../components/ReportModal';
import AssessmentSummaryModal from '../components/AssessmentSummaryModal';
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

  // Multiple garments state
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [selectedAsm, setSelectedAsm] = useState<any | null>(null);
  const [isAsmSummaryOpen, setIsAsmSummaryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingOrders(true);
      setLoadingAssessments(true);
      try {
        const [ordersData, assessmentsData] = await Promise.all([
          dbService.orders.getByPatient(patient.id),
          dbService.assessments.getAll()
        ]);
        
        setOrders(ordersData || []);
        
        // Filter assessments for this specific patient
        const pId = patient.id;
        const pName = patient.full_name?.toLowerCase().trim();
        const filteredAsms = (assessmentsData || []).filter((a: any) => 
          a.patient_id === pId || (a.patient_name && a.patient_name.toLowerCase().trim() === pName)
        );
        setAssessments(filteredAsms);
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
      } finally {
        setIsLoadingOrders(false);
        setLoadingAssessments(false);
      }
    };
    fetchData();
  }, [patient.id, patient.full_name]);

  const handleDeleteAssessment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this garment assessment? / کیا آپ اس گارمنٹ اسیسمنٹ کو حذف کرنا چاہتے ہیں؟")) {
      try {
        await dbService.assessments.delete(id);
        setAssessments(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error('Delete assessment failed:', err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        patient={patient} 
      />

      {isAsmSummaryOpen && selectedAsm && (
        <AssessmentSummaryModal
          isOpen={isAsmSummaryOpen}
          onClose={() => {
            setIsAsmSummaryOpen(false);
            setSelectedAsm(null);
          }}
          patient={patient}
          assessmentPayload={selectedAsm}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">Back to Registry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="medical-card p-8 text-center space-y-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
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

          <div className="medical-card p-6 border-l-4 border-l-blue-600 bg-white shadow-sm rounded-2xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Attending Surgeon
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {patient.doctor_name ? patient.doctor_name.charAt(0) : 'D'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{patient.doctor_name || 'N/A'}</p>
                <p className="text-xs text-slate-500">Primary Consultant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="medical-card p-8 bg-white border border-slate-100 shadow-sm rounded-3xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Clinical Data & Assessments</h3>
                <p className="text-slate-500 text-sm mt-1">Reviewing saved diagnostic records</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Enabled
              </div>
            </div>

            {/* Multiple Garments Information Card */}
            <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-100 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-blue-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base">
                    Multiple Garments Support / ملٹیپل گارمنٹس سپورٹ
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    Making multiple customized garments (e.g., Glove, Jacket, Trouser, Chin Binder, Sleeve) for this patient is fully supported! Just click "Add New Garment Type" below. Each garment will be saved as an independent diagnostic record with its own measurements, calibration graph, and printable blueprint.
                  </p>
                  <p className="text-xs text-blue-700 font-bold mt-1 max-w-xl">
                    ایک ہی مریض کے لیے متعدد گارمنٹس (جیسے دستانے، جیکٹ، ٹراؤزر وغیرہ) بنانا بالکل ممکن ہے! بس نیچے دیے گئے بٹن پر کلک کر کے کسی بھی نئے گارمنٹ کی پیمائش اور اسیسمنٹ شروع کریں۔ تمام اسیسمنٹس الگ الگ ریکارڈ کے طور پر یہاں نظر آئیں گی۔
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
                <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>How to begin? Click the setup button:</span>
                </div>
                <button
                  onClick={() => onStartAssessment(patient)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Garment Type / نیا گارمنٹ اور پیمائش جوڑیں</span>
                </button>
              </div>
            </div>

            {/* Saved Garments List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                  Registered Garments ({assessments.length}) / مریض کے حاصل کردہ گارمنٹس
                </h4>
              </div>

              {loadingAssessments ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Sourcing saved garment configurations...</p>
                </div>
              ) : assessments.length === 0 ? (
                <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-650 font-bold">No custom garment forms saved for this patient yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Start by clicking "Add New Garment Type" above to record point measurements.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {assessments.map((asm: any) => (
                    <div 
                      key={asm.id}
                      onClick={() => {
                        setSelectedAsm(asm);
                        setIsAsmSummaryOpen(true);
                      }}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black">
                          {asm.garment_type ? asm.garment_type[0] : 'G'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{asm.garment_type}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(asm.created_at).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>Compr: <strong className="text-slate-700 font-semibold">{asm.compression || 'None'}</strong></span>
                            <span>•</span>
                            <span>Silicone: <strong className="text-slate-700 font-semibold">{asm.silicone_pasting || 'None'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsm(asm);
                            setIsAsmSummaryOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60 transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Blueprint</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteAssessment(asm.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Static diagnostic detail fallback if diagnosis exists */}
            {patient.diagnosis && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                  Primary Diagnosis Information
                </h4>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-405 font-bold uppercase block mb-1">Diagnosis / مرض کی تفصیل</span>
                    <p className="text-slate-800 font-bold text-sm">
                      {patient.diagnosis}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-405 font-bold uppercase block mb-1">Medical Condition</span>
                    <p className="text-slate-700 font-medium text-sm leading-relaxed">
                      {patient.medical_condition || 'No extra secondary condition specified.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
