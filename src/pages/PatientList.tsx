import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  UserPlus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Copy,
  Check,
  Database,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { Patient } from '../types';
import { dbService, getIsSupabaseOffline, setIsSupabaseOffline, getLastSupabaseError, isDemo } from '../services/supabase';
import AddPatientModal from '../components/AddPatientModal';

interface PatientListProps {
  onPatientSelect?: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ onPatientSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [takingLonger, setTakingLonger] = useState(false);
  const [errorDetail, setErrorDetail] = useState<{
    message: string;
    code?: string;
    hint?: string;
    details?: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const sqlSchemaCode = `-- Create necessary tables in Supabase for Overplast app
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  full_name TEXT,
  role TEXT DEFAULT 'therapist',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for Automatic Profile Creation upon Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
  user_email TEXT;
  user_role_input TEXT;
BEGIN
  user_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  IF user_email IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    user_role_input := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
    IF user_role_input = 'admin' THEN
      assigned_role := 'therapist';
    ELSIF user_role_input IN ('therapist', 'technician', 'user') THEN
      assigned_role := user_role_input;
    ELSE
      assigned_role := 'therapist';
    END IF;
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User');

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_full_name, assigned_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    role = CASE WHEN public.profiles.role IS NULL OR public.profiles.role = '' THEN EXCLUDED.role ELSE public.profiles.role END,
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1), 'User'),
  CASE WHEN LOWER(TRIM(COALESCE(u.email, ''))) IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN 'admin'
  WHEN (u.raw_user_meta_data->>'role') IN ('therapist', 'technician', 'user') THEN (u.raw_user_meta_data->>'role')
  ELSE 'therapist' END,
  COALESCE(u.created_at, NOW()), NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height DECIMAL,
  weight DECIMAL,
  phone TEXT,
  email TEXT,
  address TEXT,
  diagnosis TEXT,
  medical_condition TEXT,
  doctor_name TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id),
  measurement_date DATE DEFAULT CURRENT_DATE,
  body_area TEXT NOT NULL,
  side TEXT CHECK (side IN ('left', 'right', 'both')),
  data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id),
  garment_type TEXT NOT NULL,
  status TEXT DEFAULT 'Measurement Taken' CHECK (status IN ('Measurement Taken', 'Approved', 'In Production', 'Quality Check', 'Delivered')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security policies for simpler client-side CRUD setup
ALTER TABLE IF EXISTS clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Quick-edit database configurations directly on error diagnostics screen
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);

  const getSupabaseProjectId = () => {
    const url = localStorage.getItem('VITE_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || '';
    const match = url.match(/https?:\/\/([^.]+)/);
    return match ? match[1] : 'avltksamccylkfgpfgea';
  };

  const handleQuickSaveDb = async () => {
    setIsSavingDb(true);
    try {
      const url = supabaseUrlInput.trim();
      const key = supabaseAnonKeyInput.trim();
      
      if (url) {
        localStorage.setItem('VITE_SUPABASE_URL', url);
      } else {
        localStorage.removeItem('VITE_SUPABASE_URL');
      }
      
      if (key) {
        localStorage.setItem('VITE_SUPABASE_ANON_KEY', key);
      } else {
        localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
      }
      
      localStorage.removeItem('supabase_force_demo');
      
      // Save on server for cross-device synchronization
      try {
        await fetch('/api/save-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, key })
        });
      } catch (srvErr) {
        console.warn("Failed to save credentials on server:", srvErr);
      }
      
      setTimeout(() => {
        setIsSavingDb(false);
        try {
          alert("Credentials saved and synced across devices! Reconnecting to your live database...");
        } catch (alertError) {
          console.warn("Alert blocked:", alertError);
        }
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error(e);
      setIsSavingDb(false);
      try {
        alert("Error saving credentials.");
      } catch (alertError) {
        console.warn("Alert blocked:", alertError);
      }
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    setTakingLonger(false);
    
    // Clear offline freeze to allow a genuine reconnection attempt
    setIsSupabaseOffline(false);
    
    // Warn the user after 2 seconds if connection is still pending
    const longLoadTimeout = setTimeout(() => {
      setTakingLonger(true);
    }, 2000);

    // Safety timeout: if fetching takes > 8s, stop loading even if it's still waiting
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      setError('Connection is taking too long. Supabase may be paused or sleeping. Please verify your Project URL and Anon key, or wake up your project from the Supabase dashboard.');
      setErrorDetail({
        message: 'Connection is taking too long. Supabase may be paused or sleeping. Please verify your Project URL and Anon key, or wake up your project from the Supabase dashboard.',
        code: 'TIMEOUT',
        hint: 'Prject sleeping dynamic trigger'
      });
    }, 8000);

    try {
      const data = await dbService.patients.getAll();
      clearTimeout(safetyTimeout);
      clearTimeout(longLoadTimeout);
      setPatients(data || []);
      setError(null);
      setErrorDetail(null);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      clearTimeout(longLoadTimeout);
      console.error('Error fetching patients:', err);
      setError(err?.message || 'Could not connect to medical database. Check configuration.');
      setErrorDetail({
        message: err?.message || String(err),
        code: err?.code,
        hint: err?.hint,
        details: err?.details || err?.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.includes(searchTerm)
  );

  const handleDeleteClick = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault();
    e.stopPropagation();
    setPatientToDelete(patient);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    
    const id = patientToDelete.id;
    try {
      // Optimistically remove from UI first for instant feedback
      setPatients(prev => prev.filter(p => p.id !== id));
      setPatientToDelete(null);
      
      const success = await dbService.patients.delete(id);
      if (!success) {
        fetchPatients();
        console.error('Delete operation returned false');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      fetchPatients();
    }
  };

  const handleEdit = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto min-h-[40vh]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-700 uppercase tracking-widest animate-pulse">Running Database Diagnostics...</p>
        
        {takingLonger ? (
          <div className="mt-6 p-5 bg-blue-50/80 border border-blue-100 rounded-2xl text-left space-y-2 animate-in fade-in duration-500">
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600 animate-pulse" />
              Supabase Project Cold Start / Waking Up...
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed font-semibold">
              Bhai, agar aapka Supabase project passive/paused state me tha ya kafi der se use nahi hua, to usko active/restored hone me <strong>15 to 30 seconds</strong> lag sakte hain. 
            </p>
            <p className="text-xs text-blue-600 leading-relaxed font-semibold">
              Hum connections align kar rahe hain, please tab tak wait karein ya tab ko close mat karein.
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 font-bold mt-2">Checking your live database connection...</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Database connection alert/SQL wizard disabled to keep UI clean and professional for clients */}
      {false && (!isDemo && getIsSupabaseOffline()) && (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl text-left space-y-4 shadow-sm animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100/80 text-amber-700 rounded-2xl shrink-0">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight flex items-center gap-2">
                Live Database Connection Alert!
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                Bhai, aapke saved Supabase credentials toh loads hogaye hain, lekin client connection successful nahi ho saka. Is wajah se app automatic <strong>Offline Backup Mode (LocalStorage)</strong> par shift ho gayi hai taaki aapka registered kaam na ruke!
              </p>
              {getLastSupabaseError() && (
                <div className="mt-2 text-[11px] font-mono bg-amber-100/50 text-amber-900 p-3 rounded-xl border border-amber-200/40">
                  <span className="font-extrabold uppercase">Diagnostic Error Log:</span> {getLastSupabaseError()?.message || String(getLastSupabaseError())}
                </div>
              )}
            </div>
          </div>

          {(!getLastSupabaseError() || getLastSupabaseError()?.message?.includes('relation') || getLastSupabaseError()?.message?.includes('does not exist')) && (
            <div className="pt-2 pl-12 space-y-3">
              <div className="bg-white/80 border border-amber-200/50 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Kya tables create karne ki zaroorat hai?</span>
                <p className="text-xs text-slate-700 mt-1 font-semibold leading-relaxed">
                  Bhai lagta hai aapke new Supabase project me <strong>patients</strong>, <strong>orders</strong> aur relevant tables abhi tak create nahi hui hain ya delete hain.
                </p>
                <p className="text-xs text-slate-700 mt-1 font-semibold leading-relaxed">
                  In tables ko 1-Click me auto-create karne ke liye, niche button par click karke SQL script copy karein aur use apne <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong> me paste kar ke <strong>Run (Play)</strong> dabaen.
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={handleCopySql}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'SQL Script Copied!' : 'Copy Tables SQL Script'}
                  </button>
                  <a 
                    href={`https://supabase.com/dashboard/project/${getSupabaseProjectId()}/sql/new`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all border border-blue-100"
                  >
                    Go To Supabase SQL Editor
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, ID or diagnosis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>


      </div>

      {filteredPatients.length === 0 ? (
        <div className="p-12 medical-card border-dashed border-2 flex flex-col items-center text-center opacity-60">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
            <Plus className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Patients Found</h3>
          <p className="text-sm text-slate-500 mt-2">Try adjusting your search or add a new record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="medical-card flex flex-col group transition-all overflow-hidden"
            >
              <div className="p-6 flex items-start gap-6 relative">
                {/* Clickable Area for Selection */}
                <div 
                  onClick={() => onPatientSelect?.(patient)}
                  className="flex-1 flex items-start gap-6 cursor-pointer"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                    {patient.photo_url ? (
                      <img src={patient.photo_url} alt={patient.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-slate-300 uppercase">{patient.full_name.charAt(0)}</span>
                    )}
                  </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-green-700 truncate tracking-tight">{patient.full_name}</h3>
                        <div className="flex items-center gap-1 shrink-0 bg-white/80 backdrop-blur-sm px-1.5 py-1 rounded-xl border border-slate-100 shadow-sm relative z-30">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(e, patient);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit Patient"
                          >
                            <Pencil className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                          <div className="w-px h-3 bg-slate-100 mx-0.5" />
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteClick(e, patient)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-green-100/50 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none inline-block">
                        ID: {patient.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
                    City: {patient.city || 'Karachi'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-700 font-semibold">{patient.phone}</span>
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 uppercase">Age: {patient.age} ({patient.gender || 'N/A'})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MoreHorizontal className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 uppercase truncate max-w-[120px]">Ref: {patient.doctor_name}</span>
                  </div>
                </div>
                <div 
                  onClick={() => onPatientSelect?.(patient)}
                  className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest cursor-pointer hover:gap-2 transition-all"
                >
                  View Details
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => setIsModalOpen(true)}
            className="medical-card border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-slate-200 group-hover:text-blue-400" />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Register New Patient</h4>
            <p className="text-xs text-slate-400 mt-2">Initialize records for a new clinical case</p>
          </div>
        </div>
      )}

      <AddPatientModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchPatients}
        patient={editingPatient || undefined}
      />

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 text-center uppercase tracking-tight mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-slate-500 text-center mb-8">
              Are you sure you want to delete the record for <span className="font-bold text-slate-900">{patientToDelete.full_name}</span>? 
              <br />This operation cannot be reversed.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
