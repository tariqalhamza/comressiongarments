import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Mail, MapPin, Stethoscope, Loader2, Hospital, Camera, Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { dbService } from '../services/supabase';
import { Patient } from '../types';
import { compressImage } from '../lib/imageUtils';
import { cn } from '../lib/utils';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient?: Patient;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onSuccess, patient }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasProvidedPhotos, setHasProvidedPhotos] = useState<'yes' | 'no'>(patient?.photo_url ? 'yes' : 'no');

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'male',
    phone: '',
    address: '',
    city: '',
    doctor_name: '',
    hospital: '',
    photo_url: ''
  });

  useEffect(() => {
    setErrorMsg(null);
    if (patient) {
      setFormData({
        full_name: patient.full_name || '',
        age: patient.age?.toString() || '',
        gender: (patient as any).gender || 'male',
        phone: patient.phone || '',
        address: patient.address || '',
        city: patient.city || '',
        doctor_name: patient.doctor_name || '',
        hospital: patient.hospital || '',
        photo_url: patient.photo_url || ''
      });
      setHasProvidedPhotos(patient.photo_url ? 'yes' : 'no');
    } else {
      setFormData({
        full_name: '',
        age: '',
        gender: 'male',
        phone: '',
        address: '',
        city: '',
        doctor_name: '',
        hospital: '',
        photo_url: ''
      });
      setHasProvidedPhotos('no');
    }
  }, [patient, isOpen]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        const compressedBase64 = await compressImage(files[0]);
        setFormData(prev => ({ ...prev, photo_url: compressedBase64 }));
        setHasProvidedPhotos('yes');
        setErrorMsg(null);
      } catch (err) {
        console.error("Image compression failed:", err);
        alert("Failed to compress image. Please upload a valid image file.");
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasProvidedPhotos === 'no') {
      setErrorMsg("Pehley patients ki pics lelen!");
      alert("Pehley patients ki pics lelen! Please take patient photos first.");
      return;
    }
    if (!formData.photo_url) {
      setErrorMsg("Error: The patient must upload a picture of the affected (contracture/burn) area; otherwise, the data will not be processed.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const patientData = {
        ...formData,
        age: parseInt(formData.age) || 0,
        height: 0,
        weight: 0,
        email: '',
        diagnosis: 'Patient Registration',
        medical_condition: 'General',
        clinic_id: 'default'
      };
      
      const timeout = setTimeout(() => {
        if (loading) {
          alert('Process is taking longer than expected. Please check your Supabase connection.');
        }
      }, 7000);

      if (patient) {
        await dbService.patients.update(patient.id, patientData);
      } else {
        await dbService.patients.create(patientData);
      }

      clearTimeout(timeout);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving patient:', error);
      const msg = error?.message || 'Unknown error';
      alert(`Failed to save patient: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {patient ? 'Update Patient Record' : 'New Patient Registration'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {patient ? `Editing: ${patient.id.slice(0, 8)}` : 'Clinical Intake Form'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="Ahmed Khan"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
              <input 
                type="number" 
                required
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="45"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+92 300 1234567"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="e.g. Karachi"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mailing Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
              <textarea 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Enter full residential address..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all min-h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital Name</label>
            <div className="relative">
              <Hospital className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                required
                value={formData.hospital}
                onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                placeholder="e.g. Mughal Hospital"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referring Specialist</label>
            <input 
              type="text" 
              required
              value={formData.doctor_name}
              onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
              placeholder="Dr. Malik"
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Highlighted Option: Clinical Photos Status Check */}
          <div className="md:col-span-2 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow shadow-blue-100">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase text-blue-900 tracking-wider">Clinical Photo Verification Status</h3>
                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Verification Mandatory Check</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">
                Has the patient successfully provided/taken their clinical photos of the affected area? <span className="text-rose-600 font-extrabold">*</span>
              </label>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Patient pictures of contracture/burn target are required before starting therapy model creation.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setHasProvidedPhotos('yes');
                  setErrorMsg(null);
                }}
                className={cn(
                  "flex-1 py-3 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border flex items-center justify-center gap-2 cursor-pointer",
                  hasProvidedPhotos === 'yes'
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", hasProvidedPhotos === 'yes' ? "border-white" : "border-slate-300")}>
                  {hasProvidedPhotos === 'yes' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                Yes, Photos Taken
              </button>

              <button
                type="button"
                onClick={() => {
                  setHasProvidedPhotos('no');
                  setErrorMsg("Pehley patients ki pics lelen!");
                }}
                className={cn(
                  "flex-1 py-3 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border flex items-center justify-center gap-2 cursor-pointer",
                  hasProvidedPhotos === 'no'
                    ? "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", hasProvidedPhotos === 'no' ? "border-white" : "border-slate-300")}>
                  {hasProvidedPhotos === 'no' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                No, Pending Pics
              </button>
            </div>

            {hasProvidedPhotos === 'no' && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-2.5 animate-bounce">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-red-950 leading-none">Pehley patients ki pics lelen!</h4>
                  <p className="text-[10px] text-red-600 font-bold mt-1 leading-relaxed">
                    Clinical photographs of the affected contracture area must be compiled before proceeding with clinical registration.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Informational Notice regarding contractual area photo */}
          <div className="md:col-span-2 p-5 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Anatomical Record Required</h4>
              <p className="text-xs font-medium text-amber-700 leading-relaxed">
                <strong className="font-extrabold text-amber-800">NOTE:</strong> You must upload a high-resolution photograph of the affected contracture/burn area (not a personal profile picture). This clinical visual documentation is strictly required to model and fabricate custom biocentric supports.
              </p>
            </div>
          </div>

          {/* Photo upload option widget area */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Contracture / Affected Area Picture <span className="text-rose-500 font-bold">*REQUIRED</span>
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />

            {formData.photo_url ? (
              <div className="relative group rounded-3xl overflow-hidden border border-slate-200 aspect-video md:aspect-[3/1] max-h-[160px] flex items-center justify-center bg-slate-50">
                <img 
                  src={formData.photo_url} 
                  alt="Patient reference" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={handleUploadClick}
                      className="px-4 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                    >
                      <Camera className="w-4 h-4 text-blue-600" />
                      Change Photo
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setFormData(prev => ({ ...prev, photo_url: '' }));
                        setHasProvidedPhotos('no');
                        setErrorMsg("Pehley patients ki pics lelen!");
                      }}
                      className="px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleUploadClick}
                className={cn(
                  "group border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 hover:bg-blue-50/30",
                  (!formData.photo_url) ? "border-rose-300 bg-rose-50/10 animate-pulse" : "border-slate-200 hover:border-blue-400"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:border-blue-200 transition-all">
                  <Camera className={cn("w-5 h-5", (!formData.photo_url) ? "text-rose-500 animate-pulse" : "text-slate-400 group-hover:text-blue-500")} />
                </div>
                <p className="text-xs font-bold text-slate-700">Click to upload affected area photograph</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">REQUIRED: Affected contractual zone image only (No faces)</p>
              </div>
            )}

            {!formData.photo_url && (
              <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-100/70 rounded-2xl text-rose-600 animate-[bounce_1s_ease-in-out_1]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">
                  Warning: Patient must upload a picture of the affected contractual area to proceed with registration.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-100/60 rounded-xl text-red-700 text-xs font-bold border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="md:col-span-2 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>{patient ? 'Save Changes' : 'Register & Create Record'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
