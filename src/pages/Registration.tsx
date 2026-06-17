import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Hospital, 
  Stethoscope, 
  Search, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Play,
  X,
  UserPlus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  FolderOpen,
  FileText,
  Camera,
  UploadCloud,
  AlertTriangle,
  Pencil,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient } from '../types';
import { dbService } from '../services/supabase';
import { cn } from '../lib/utils';
import { compressImage } from '../lib/imageUtils';
import AssessmentSummaryModal from '../components/AssessmentSummaryModal';

interface RegistrationProps {
  onStartAssessment: (patient: Patient) => void;
  onPatientSelect?: (patient: Patient) => void;
  onViewSavedAssessment?: (patientName: string) => void;
}

const Registration: React.FC<RegistrationProps> = ({ 
  onStartAssessment, 
  onPatientSelect, 
  onViewSavedAssessment 
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [savedAssessments, setSavedAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Inline Form Toggle State - Defaults to open so the user immediately sees it, or closed with a clear button
  const [showForm, setShowForm] = useState(false);

  // Custom Patient Deletion Confirmation modal state
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // States for viewing the full Assessment Summary direct modal
  const [selectedPatientForSummary, setSelectedPatientForSummary] = useState<Patient | null>(null);
  const [selectedAssessmentForSummary, setSelectedAssessmentForSummary] = useState<any | null>(null);

  // Edit Patient modal states
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    age: '',
    gender: 'male',
    doctorName: '',
    registrationDate: '',
    hospitalName: '',
    doctorNotes: '',
    affectedArea: '',
    photoUrl: ''
  });

  const startEditingPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setEditFormData({
      fullName: patient.full_name || '',
      phone: patient.phone || '',
      address: patient.address || '',
      age: patient.age ? patient.age.toString() : '',
      gender: patient.gender || 'male',
      doctorName: patient.doctor_name || '',
      registrationDate: patient.created_at ? patient.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      hospitalName: patient.hospital || '',
      doctorNotes: patient.notes || '',
      affectedArea: patient.medical_condition !== 'General' ? (patient.medical_condition || '') : '',
      photoUrl: patient.photo_url || ''
    });
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditUploadClick = () => {
    if (editFileInputRef.current) {
      editFileInputRef.current.click();
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      try {
        setSubmitting(true);
        const compressedBase64 = await compressImage(file);
        setEditFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
      } catch (err) {
        console.error("Image compression failed:", err);
        alert("Failed to process image. Please choose another valid image file.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientToEdit) return;

    const nameTrim = editFormData.fullName.trim();
    const phoneTrim = editFormData.phone.trim();
    const addressTrim = editFormData.address.trim();
    const drTrim = editFormData.doctorName.trim();
    const hospitalTrim = editFormData.hospitalName.trim();
    const ageNum = parseInt(editFormData.age) || 0;

    if (!nameTrim || !phoneTrim || !addressTrim || !drTrim || !hospitalTrim || !editFormData.age) {
      alert("Please fill all 8 required fields / تمام آٹھویں فیلڈز لازمی پُر کریں۔");
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updatedPayload: Partial<Patient> = {
        full_name: nameTrim,
        phone: phoneTrim,
        address: addressTrim,
        age: ageNum,
        gender: editFormData.gender as 'male' | 'female' | 'other',
        doctor_name: drTrim,
        hospital: hospitalTrim,
        notes: editFormData.doctorNotes.trim(),
        created_at: new Date(editFormData.registrationDate).toISOString(),
        medical_condition: editFormData.affectedArea.trim() || 'General',
        photo_url: editFormData.photoUrl || '',
      };

      await dbService.patients.update(patientToEdit.id, updatedPayload);
      
      // Update local state list
      setPatients(prev => prev.map(p => p.id === patientToEdit.id ? { ...p, ...updatedPayload } : p));
      setSuccessMsg(`Patient record for "${nameTrim}" updated successfully! / مریض کی معلومات کامیابی سے اپ ڈیٹ ہو گئیں۔`);
      setPatientToEdit(null);
    } catch (err: any) {
      console.error("Failed to update patient:", err);
      alert(err?.message || "Failed to update patient record. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // File input reference for picture uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State containing exact requested fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    age: '',
    gender: 'male',
    doctorName: '',
    registrationDate: new Date().toISOString().split('T')[0],
    hospitalName: '',
    doctorNotes: '',
    affectedArea: '',
    photoUrl: ''
  });

  // Load registered patients
  const fetchRecentPatients = async () => {
    try {
      setLoading(true);
      const [patientsData, assessmentsData] = await Promise.all([
        dbService.patients.getAll(),
        dbService.assessments.getAll()
      ]);
      setPatients(patientsData || []);
      setSavedAssessments(assessmentsData || []);
    } catch (err) {
      console.error('Failed to load patients list or assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentPatients();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
       const file = files[0];
       try {
         setSubmitting(true);
         const compressedBase64 = await compressImage(file);
         setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
         setErrorMsg(null);
       } catch (err) {
         console.error("Image compression failed:", err);
         setErrorMsg("Failed to process image. Please choose another valid image file.");
       } finally {
         setSubmitting(false);
       }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const nameTrim = formData.fullName.trim();
    const phoneTrim = formData.phone.trim();
    const addressTrim = formData.address.trim();
    const drTrim = formData.doctorName.trim();
    const hospitalTrim = formData.hospitalName.trim();
    const ageNum = parseInt(formData.age) || 0;

    if (!nameTrim || !phoneTrim || !addressTrim || !drTrim || !hospitalTrim || !formData.age) {
      setErrorMsg("Please fill all 8 required fields / تمام آٹھویں فیلڈز لازمی پُر کریں۔");
      return;
    }

    setSubmitting(true);
    try {
      const newPatientPayload: Partial<Patient> = {
        full_name: nameTrim,
        phone: phoneTrim,
        address: addressTrim,
        age: ageNum,
        gender: formData.gender as 'male' | 'female' | 'other',
        doctor_name: drTrim,
        hospital: hospitalTrim,
        notes: formData.doctorNotes.trim(),
        created_at: new Date(formData.registrationDate).toISOString(),
        diagnosis: 'Patient Intake Registration',
        medical_condition: formData.affectedArea.trim() || 'General',
        photo_url: formData.photoUrl || '',
        clinic_id: 'default'
      };

      await dbService.patients.create(newPatientPayload);
      
      setSuccessMsg(`Patient "${nameTrim}" registered successfully and added below!`);
      
      // Reset form variables (retain default date)
      setFormData({
        fullName: '',
        phone: '',
        address: '',
        age: '',
        gender: 'male',
        doctorName: '',
        registrationDate: new Date().toISOString().split('T')[0],
        hospitalName: '',
        doctorNotes: '',
        affectedArea: '',
        photoUrl: ''
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Collapse form automatically
      setShowForm(false);

      // Reload list dynamically
      await fetchRecentPatients();
    } catch (err: any) {
      console.error('Error in patient registration:', err);
      setErrorMsg(err?.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await dbService.patients.delete(patientToDelete.id);
      setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
      setSuccessMsg(`Patient record for "${patientToDelete.full_name}" deleted successfully.`);
      setPatientToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete patient:', err);
      setErrorMsg(err?.message || 'Delete failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter patients based on search
  const filteredPatients = patients.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(search) ||
      (p.phone || '').toLowerCase().includes(search) ||
      (p.doctor_name || '').toLowerCase().includes(search) ||
      (p.hospital || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 rounded-[2rem] text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black tracking-widest uppercase mb-1">
            Intake Enrollment Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
            PATIENT REGISTRATION PORTAL
          </h1>
          <p className="text-xs text-slate-300 font-semibold max-w-2xl leading-relaxed">
            Register patients by entering their foundational data. Once added below, you can perform precision digital diagnostics, custom compression mapping, and garment sizing drawings directly.
          </p>
        </div>

        {/* Toggle Form Trigger Button */}
        <button
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setShowForm(prev => !prev);
          }}
          className={cn(
            "px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2.5 shrink-0 self-start md:self-center bg-blue-600 hover:bg-blue-500 hover:scale-[1.02] text-white",
            showForm && "bg-slate-700 hover:bg-slate-600 text-white"
          )}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              CLOSE REGISTRATION FORM
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              + REGISTER NEW PATIENT
            </>
          )}
        </button>
      </div>

      {/* Dynamic Success & Error Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-black leading-relaxed">
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-700 p-1 font-bold">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs font-black leading-relaxed">
              {errorMsg}
            </div>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400 hover:text-rose-700 p-1 font-bold">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COLLAPSIBLE FORM CONTAINER (Inline Accordion) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="overflow-hidden bg-white rounded-3xl border border-slate-150 shadow-md"
          >
            <div className="p-6 sm:p-8 space-y-6">
              <div className="border-l-4 border-blue-600 pl-4 mb-4">
                <h3 className="text-md sm:text-lg font-black text-slate-900 uppercase">
                  Add Patient Details / نبا مریض کا اندراج
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  Complete all 8 medical metadata registration parameters
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* 1. Full Name */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Full Name / مکمل نام <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Mahmood Khan"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 2. Phone / Mob No */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Mob No / موبائل نمبر <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel"
                        required
                        placeholder="e.g. +92 321 4567890"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="medical-input pl-12 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 3. Age */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Age / عمر <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      max="120"
                      placeholder="e.g. 35"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="medical-input px-4 font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* 4. Gender */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Gender / جنس <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="medical-input px-4 bg-white font-bold text-slate-800"
                    >
                      <option value="male">Male (مرد)</option>
                      <option value="female">Female (عورت)</option>
                      <option value="other">Other (دیگر)</option>
                    </select>
                  </div>

                  {/* 5. Registration Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Registration Date / تاریخِ اندراج <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        required
                        value={formData.registrationDate}
                        onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                        className="medical-input pl-12 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 6. Dr Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Dr Name / ڈاکٹر کا نام <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Dr. Ahmed"
                        value={formData.doctorName}
                        onChange={(e) => handleInputChange('doctorName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 7. Hospital Name */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Hospital Name / ہسپتال کا نام <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hospital className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Mayo Hospital"
                        value={formData.hospitalName}
                        onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 8. Address */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Address / گھر کا پتہ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        required
                        placeholder="e.g. House No 42, Street 3, Lahore, Pakistan"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="medical-input pl-12 pt-4 h-18 resize-none font-bold text-slate-800"
                      />
                    </div>
                  </div>

                   {/* 8.2 Affected Area Picture Upload (Auto-optimized) */}
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                      <span>Upload Picture of Affected Area / متاثرہ جگہ کی تصویر</span>
                      <span className="text-emerald-600 font-mono text-[9px] lowercase font-bold">Auto-optimized / سائز خود کار طریقے سے درست ہوگا</span>
                    </label>
                    
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {formData.photoUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video md:aspect-[3/1] max-h-[140px] flex items-center justify-center bg-slate-50/50 group">
                        <img 
                          src={formData.photoUrl} 
                          alt="Affected Area" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-all duration-200">
                          <button
                            type="button"
                            onClick={handleUploadClick}
                            className="px-3.5 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            Change Pic
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="px-3.5 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={handleUploadClick}
                        className="group border-2 border-dashed border-slate-200 hover:border-blue-400/80 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/40 hover:bg-blue-50/20 cursor-pointer transition-all duration-250"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">
                          Click to select / upload image (<span className="text-emerald-600">Any Size Allowed</span>)
                        </span>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1 text-center">
                          متاثرہ حصے کی تصویر اپ لوڈ کریں (تصویر خود بخود بہتر ہو جائے گی)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 9. Doctor's Notes / Case History */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Doctor's Notes / Case History / ڈاکٹر کے نوٹس اور ہسٹری
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        placeholder="e.g. Patient has stage 1 lymphedema in left lower limb / مریض کی بائیں پنڈلی میں سوجن ہے۔"
                        value={formData.doctorNotes}
                        onChange={(e) => handleInputChange('doctorNotes', e.target.value)}
                        className="medical-input pl-12 pt-4 h-18 resize-none font-bold text-slate-800"
                      />
                    </div>
                  </div>

                </div>

                {/* Form Action Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    {submitting ? "SAVING..." : "SAVE & REGISTER RECORD"}
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER LIST OF REGISTERED PATIENTS DIRECTLY BELOW */}
      {!showForm && (
        <div className="space-y-6">
        
        {/* List Header and Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-t border-slate-200/80 pt-8">
          <div className="border-l-4 border-slate-900 pl-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              REGISTERED PATIENT DATABASE / رجسٹرڈ مریض
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
              Live Enrollment Directory & Actions Launcher
            </p>
          </div>

          {/* Quick Search Widget */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by patient name, phone, doctor or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="medical-input pl-12 text-xs font-bold" 
            />
          </div>
        </div>

        {/* Database Grid */}
        {loading ? (
          <div className="medical-card p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-black uppercase tracking-widest">Loading clinical database files...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="medical-card p-12 flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <FolderOpen className="w-6 h-6 text-slate-300" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">No Patient Records found / کوئی مریض نہیں ملا</span>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                Provide search filters or click "+ REGISTER NEW PATIENT" above to fill in the 8 clinical parameters and enroll an instant diagnostic candidate.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patientItem) => (
              <div 
                key={patientItem.id} 
                onClick={() => {
                  if (onPatientSelect) {
                    onPatientSelect(patientItem);
                  }
                }}
                className="bg-white rounded-[2rem] border border-slate-150 p-6 flex flex-col justify-between hover:shadow-lg hover:border-blue-400/60 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden cursor-pointer"
              >
                {/* Decorative Side Gradient for registered feel */}
                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-slate-800" />

                <div className="space-y-4 pl-2">
                  {/* Card Title Header with Name & Primary Actions */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">PATIENT PROFILE / معلومات مریض</span>
                      <h4 className="font-black text-slate-950 text-xl tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                        {patientItem.full_name}
                      </h4>
                    </div>

                    {/* Card Actions (Edit & Delete) */}
                    <div className="flex items-center gap-1 shrink-0 z-10">
                      {/* Edit action */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingPatient(patientItem);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete action */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(patientItem);
                        }}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fully displayed requested fields list */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      const matchedAssessment = savedAssessments.find(
                        asm => {
                          if (asm.patient_id && asm.patient_id !== 'anonymous') {
                            return asm.patient_id === patientItem.id;
                          }
                          const asmTime = new Date(asm.created_at).getTime();
                          const patientTime = new Date(patientItem.created_at).getTime();
                          return (
                            asm.patient_name.toLowerCase().trim() === patientItem.full_name.toLowerCase().trim() &&
                            asmTime >= patientTime - 60000
                          );
                        }
                      );
                      setSelectedPatientForSummary(patientItem);
                      setSelectedAssessmentForSummary(matchedAssessment || null);
                    }}
                    className="grid grid-cols-2 gap-3.5 text-[11px] text-slate-900 font-extrabold bg-gradient-to-br from-slate-100 to-blue-50 shadow-sm hover:from-blue-100/50 hover:to-indigo-50 rounded-2xl p-4 border-2 border-slate-300 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-350 relative"
                    title="Click here to view this patient's assessment summary with pictures & drawings"
                  >
                    
                    {/* Phone / Mobile No */}
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Mob No / موبائل</span>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black font-mono text-[11px] md:text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span>{patientItem.phone || 'None'}</span>
                      </div>
                    </div>

                    {/* Age & Gender */}
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Age & Gender</span>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black uppercase text-[11px] md:text-xs">
                        <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-black text-[9px] capitalize">{patientItem.gender}</span>
                        <span>•</span>
                        <span>{patientItem.age} Yrs</span>
                      </div>
                    </div>

                    {/* Doctor Name */}
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Doctor name / ڈاکٹر</span>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black text-[11px] md:text-xs truncate">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">{patientItem.doctor_name || 'No referral'}</span>
                      </div>
                    </div>

                    {/* Hospital Name */}
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Hospital / ہسپتال</span>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black text-[11px] md:text-xs truncate">
                        <Hospital className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span className="truncate">{patientItem.hospital || 'Not declared'}</span>
                      </div>
                    </div>

                    {/* Registration Date */}
                    <div className="space-y-1 col-span-2 border-t-2 border-slate-300 pt-2.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Date / تاریخ</span>
                      <div className="flex items-center gap-1.5 text-slate-950 font-black font-mono text-[11px] md:text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                        <span>
                          {new Date(patientItem.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Physical Address */}
                    <div className="space-y-1 col-span-2 border-t-2 border-slate-300 pt-2.5">
                      <span className="block text-[9px] font-black text-slate-800 uppercase tracking-widest">Address / پتہ</span>
                      <div className="flex items-start gap-1.5 text-slate-950 font-black leading-relaxed text-[11px] md:text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{patientItem.address || 'No location address registered'}</span>
                      </div>
                    </div>

                    {/* Affected Area (Anatomical Site) */}
                    {patientItem.medical_condition && patientItem.medical_condition !== 'General' && (
                      <div className="space-y-1 col-span-2 border-t-2 border-slate-300 pt-2.5">
                        <span className="block text-[9px] font-black text-amber-900 uppercase tracking-widest">Affected Area / متاثرہ جگہ</span>
                        <div className="flex items-center gap-1.5 text-slate-950 font-black text-[11px] md:text-xs mt-1">
                          <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>{patientItem.medical_condition}</span>
                        </div>
                      </div>
                    )}

                    {/* Affected Area Photo */}
                    {patientItem.photo_url && (
                      <div className="space-y-1.5 col-span-2 border-t-2 border-slate-300 pt-2.5">
                        <span className="block text-[9px] font-black text-amber-900 uppercase tracking-widest">Affected Area Picture / متاثرہ حصہ کی تصویر</span>
                        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 aspect-video max-h-[120px] mt-1 flex items-center justify-center bg-slate-50 shadow-inner">
                          <img 
                            src={patientItem.photo_url} 
                            alt={`${patientItem.full_name} affected area`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}

                    {/* Doctor's Notes / Case History */}
                    {patientItem.notes && (
                      <div className="space-y-1 col-span-2 border-t-2 border-slate-300 pt-2.5">
                        <span className="block text-[9px] font-black text-amber-900 uppercase tracking-widest">Doctor's Notes / Case History</span>
                        <div className="flex items-start gap-1.5 bg-amber-50 p-2.5 rounded-2xl border-2 border-amber-300 text-slate-950 font-black leading-normal text-[11px] md:text-xs mt-1 break-words w-full">
                          <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>{patientItem.notes}</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer Clinical Assessment Launcher */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between pl-2">
                  {(() => {
                    const matchedAssessment = savedAssessments.find(
                      asm => {
                        if (asm.patient_id && asm.patient_id !== 'anonymous') {
                          return asm.patient_id === patientItem.id;
                        }
                        const asmTime = new Date(asm.created_at).getTime();
                        const patientTime = new Date(patientItem.created_at).getTime();
                        return (
                          asm.patient_name.toLowerCase().trim() === patientItem.full_name.toLowerCase().trim() &&
                          asmTime >= patientTime - 60000
                        );
                      }
                    );
                    const isAssessmentSaved = !!matchedAssessment;

                    if (isAssessmentSaved) {
                      return (
                        <>
                          {/* Left side green status completed indicator */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewSavedAssessment) {
                                onViewSavedAssessment(patientItem.full_name);
                              }
                            }}
                            className="flex items-center gap-1.5 py-2 px-3.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm shadow-emerald-100/30"
                            title="View completed assessment report / رپورٹ دیکھیں"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
                            <span>Assessment Completed (جائزہ مکمل ہے)</span>
                          </button>

                          {/* Right side Assess Again button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartAssessment(patientItem);
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-amber-50 hover:bg-amber-600 border border-amber-200 hover:border-amber-500 text-amber-700 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm shadow-amber-100/20 group-hover:bg-amber-100"
                            title="Assess Again / دوبارہ ٹیسٹ شروع کریں"
                          >
                            <RefreshCw className="w-3 h-3 text-amber-500 hover:text-white group-hover:rotate-180 transition-transform duration-500" />
                            <span>Assess Again (دوبارہ ٹیسٹ)</span>
                          </button>
                        </>
                      );
                    } else {
                      return (
                        <>
                          {/* Empty left side divider to push button to the right info block */}
                          <div className="hidden sm:block text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Status: Pending Assessment
                          </div>

                          {/* Default start assessment launcher */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartAssessment(patientItem);
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-blue-50 group-hover:bg-blue-600 hover:scale-[1.03] group-hover:text-white text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Start Assessment (ٹیسٹ شروع کریں)
                          </button>
                        </>
                      );
                    }
                  })()}
                </div>

              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Dynamic custom delete confirmation modal */}
      <AnimatePresence>
        {patientToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPatientToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Modal card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-150 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Delete Patient Record?
                  </h3>
                  <p className="text-[11px] font-black text-rose-600 tracking-wider uppercase">
                    مریض کا ریکارڈ ڈیلیٹ کریں؟
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  Are you sure you want to delete the record for patient <span className="text-slate-900 font-black">"{patientToDelete.full_name}"</span>? This will permanently remove their records from the clinical directory.
                </p>
                <div className="h-px bg-slate-200/60 my-2" />
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed text-right font-bold" dir="rtl">
                  کیا آپ واقعی مریض <span className="font-black text-slate-800">"{patientToDelete.full_name}"</span> کا ریکارڈ ڈیلیٹ کرنا چاہتے ہیں؟ اس سے ان کے تمام ریکارڈز ہمیشہ کے لیے ختم ہو جائیں گے۔
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPatientToDelete(null)}
                  className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Cancel / منسوخ کریں
                </button>

                <button
                  type="button"
                  onClick={confirmDeletePatient}
                  disabled={submitting}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-100 cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {submitting ? "DELETING..." : "YES, DELETE / ہاں، ڈیلیٹ کریں"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Patient details modal */}
      <AnimatePresence>
        {patientToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPatientToEdit(null)}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
            />
            
            {/* Modal card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-150 shadow-2xl relative z-10 space-y-6 my-8 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900 uppercase">
                      Edit Patient Details / مریض کی معلومات تبدیل کریں
                    </h3>
                    <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase">
                      Update parameters for "{patientToEdit.full_name}"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPatientToEdit(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Full Name / مکمل نام <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={editFormData.fullName}
                        onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Mob No / موبائل نمبر <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel"
                        required
                        value={editFormData.phone}
                        onChange={(e) => handleEditInputChange('phone', e.target.value)}
                        className="medical-input pl-12 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Age / عمر <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={editFormData.age}
                      onChange={(e) => handleEditInputChange('age', e.target.value)}
                      className="medical-input px-4 font-mono font-bold text-slate-800"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Gender / جنس <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => handleEditInputChange('gender', e.target.value)}
                      className="medical-input px-4 bg-white font-bold text-slate-800"
                    >
                      <option value="male">Male (مرد)</option>
                      <option value="female">Female (عورت)</option>
                      <option value="other">Other (دیگر)</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Registration Date / تاریخِ اندراج <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="date"
                        required
                        value={editFormData.registrationDate}
                        onChange={(e) => handleEditInputChange('registrationDate', e.target.value)}
                        className="medical-input pl-12 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Doctor Name / ڈاکٹر کا نام <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={editFormData.doctorName}
                        onChange={(e) => handleEditInputChange('doctorName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Hospital */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Hospital / ہسپتال <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <Hospital className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={editFormData.hospitalName}
                        onChange={(e) => handleEditInputChange('hospitalName', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Residential Address / رہائشی پتہ <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        required
                        value={editFormData.address}
                        onChange={(e) => handleEditInputChange('address', e.target.value)}
                        className="medical-input pl-12 font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Affected Area Photo */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                      <span>Upload Picture of Affected Area / متاثرہ حصے کی تصویر</span>
                      <span className="text-emerald-600 font-mono text-[9px] lowercase font-bold">Auto-optimized / سائز خود کار طریقے سے درست ہوگا</span>
                    </label>
                    <input 
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {editFormData.photoUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video max-h-[140px] flex items-center justify-center bg-slate-50/50 group">
                        <img 
                          src={editFormData.photoUrl} 
                          alt="Affected Area" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-all duration-200">
                          <button
                            type="button"
                            onClick={handleEditUploadClick}
                            className="px-3.5 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-blue-600" />
                            Change Pic
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFormData(prev => ({ ...prev, photoUrl: '' }))}
                            className="px-3.5 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={handleEditUploadClick}
                        className="group border-2 border-dashed border-slate-200 hover:border-blue-400/80 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/40 hover:bg-blue-50/20 cursor-pointer transition-all duration-250 text-center"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform mx-auto">
                          <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-tight">
                          Click to select / upload image (<span className="text-emerald-600">Any Size Allowed</span>)
                        </span>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1 text-center">
                          متاثرہ حصے کی تصویر اپ لوڈ کریں (تصویر خود بخود بہتر ہو جائے گی)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Doctor Notes */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-start">
                      Doctor's Notes / Case History / ڈاکٹر کے نوٹس اور ہسٹری
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                      <textarea 
                        value={editFormData.doctorNotes}
                        onChange={(e) => handleEditInputChange('doctorNotes', e.target.value)}
                        placeholder="e.g. Clinical history, severity, secondary conditions etc."
                        className="medical-input pl-12 pt-4 h-24 resize-none font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPatientToEdit(null)}
                    className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Cancel / منسوخ کریں
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {submitting ? "SAVING..." : "UPDATE PATIENT / ریکارڈ محفوظ کریں"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedPatientForSummary && (
        <AssessmentSummaryModal
          isOpen={!!selectedPatientForSummary}
          onClose={() => {
            setSelectedPatientForSummary(null);
            setSelectedAssessmentForSummary(null);
          }}
          patient={selectedPatientForSummary}
          assessmentPayload={selectedAssessmentForSummary}
          onStartAssessment={onStartAssessment ? () => onStartAssessment(selectedPatientForSummary) : undefined}
        />
      )}

    </div>
  );
};

export default Registration;
