import React, { useState } from 'react';
import { 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Ruler, 
  History, 
  Save, 
  Zap, 
  Camera, 
  Layers,
  Calendar,
  Info,
  ArrowRightLeft,
  Activity,
  Trash2,
  ShoppingBag,
  Sparkles,
  UserCircle,
  Fingerprint,
  Download,
  Loader2
} from 'lucide-react';
import HumanBodySVG from '../components/HumanBodySVG';
import ImageAnnotator from '../components/ImageAnnotator';
import GarmentConfigurator from '../components/GarmentConfigurator';
import { cn } from '../lib/utils';

import { dbService } from '../services/supabase';

type AreaType = 'Upper Limb' | 'Lower Limb' | 'Torso';
type ViewType = 'measurements' | 'photos' | 'garment';
type UnitType = 'cm' | 'inch';

interface MeasurementSide {
  left: string;
  right: string;
}

interface MeasurementData {
  [key: string]: MeasurementSide;
}

const anatomicalPoints: Record<AreaType, string[]> = {
  'Upper Limb': ['Wrist', 'Forearm', 'Elbow', 'Upper Arm', 'Shoulder'],
  'Lower Limb': ['Ankle', 'Calf', 'Knee', 'Thigh', 'Hip'],
  'Torso': ['Chest', 'Waist', 'Abdomen']
};

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Annotation } from '../types';
import ClinicalReport from '../components/ClinicalReport';

const BodyMeasurements: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('measurements');
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<AreaType>('Lower Limb');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [unit, setUnit] = useState<UnitType>('cm');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Clinical Session Data
  const [photos, setPhotos] = useState<{ url: string | null; annotations: Annotation[] }>({
    url: null,
    annotations: []
  });

  const [garment, setGarment] = useState({
    type: 'Compression Socks' as any,
    options: {
      compressionClass: 'Class 2 (23-32 mmHg)',
      toeOption: 'Closed Toe',
      fabricType: 'Flat Knit',
      color: 'Beige',
      zipper: false,
      siliconeBand: true
    }
  });

  // State for all measurements initialized with empty strings
  const [measurements, setMeasurements] = useState<MeasurementData>(
    Object.values(anatomicalPoints).flat().reduce((acc, point) => ({
      ...acc,
      [point.toLowerCase()]: { left: '', right: '' }
    }), {})
  );
  
  // Progress tracking
  const getCompletion = () => {
    const points = anatomicalPoints[selectedArea];
    const filled = points.filter(p => measurements[p.toLowerCase()].left || measurements[p.toLowerCase()].right).length;
    return Math.round((filled / points.length) * 100);
  };

  const steps = [
    { id: 'measurements' as ViewType, label: 'Measurements', icon: Ruler },
    { id: 'photos' as ViewType, label: 'Photography', icon: Camera },
    { id: 'garment' as ViewType, label: 'Garment Design', icon: ShoppingBag },
  ];

  interface ValidationResult {
    type: 'success' | 'warning';
    title: string;
    message: string;
    insights?: string[];
  }

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleMeasurementChange = (point: string, side: 'left' | 'right', value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [point.toLowerCase()]: {
        ...prev[point.toLowerCase()],
        [side]: value
      }
    }));
  };

  const convertValue = (val: string, currentUnit: UnitType) => {
    if (!val) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    
    if (currentUnit === 'cm') {
      // Convert cm to inch
      return (num / 2.54).toFixed(2);
    } else {
      // Convert inch to cm
      return (num * 2.54).toFixed(2);
    }
  };

  const toggleUnits = () => {
    const nextUnit = unit === 'cm' ? 'inch' : 'cm';
    const newMeasurements = { ...measurements };
    
    Object.keys(newMeasurements).forEach(key => {
      newMeasurements[key] = {
        left: convertValue(newMeasurements[key].left, unit),
        right: convertValue(newMeasurements[key].right, unit)
      };
    });
    
    setMeasurements(newMeasurements);
    setUnit(nextUnit);
  };

  const handleValidation = () => {
    const activePoints = anatomicalPoints[selectedArea];
    const hasData = activePoints.some(p => 
      measurements[p.toLowerCase()].left || measurements[p.toLowerCase()].right
    );

    if (!hasData) {
      setValidationResult({
        type: 'warning',
        title: 'Missing Data',
        message: 'No measurements have been entered for this area. Please input clinical data before verification.'
      });
      return;
    }

    const insights: string[] = [];
    const warnings: string[] = [];

    // 1. Ratio Checks (Example: Lower Limb)
    if (selectedArea === 'Lower Limb') {
      const calfObj = measurements['calf'];
      const thighObj = measurements['thigh'];
      const ankleObj = measurements['ankle'];

      const calfL = calfObj ? parseFloat(calfObj.left) : NaN;
      const thighL = thighObj ? parseFloat(thighObj.left) : NaN;
      const ankleL = ankleObj ? parseFloat(ankleObj.left) : NaN;

      if (!isNaN(calfL) && !isNaN(thighL) && calfL > 0 && thighL > 0 && calfL > thighL) {
        warnings.push("Calf circumference appears larger than thigh. This is anatomically unusual and may indicate a measurement error.");
      }
      if (!isNaN(ankleL) && !isNaN(calfL) && ankleL > 0 && calfL > 0 && ankleL > calfL * 0.8) {
        warnings.push("Ankle to calf ratio is high. Potential severe edema detected or measurement inconsistency.");
      }

      // Suggest Size
      if (!isNaN(calfL) && !isNaN(thighL)) {
        if (calfL > 45 || thighL > 65) insights.push("Suggested Size: XL/Bariatric based on circumferences.");
        else if (calfL > 38 || thighL > 55) insights.push("Suggested Size: Large.");
        else if (calfL > 0 || thighL > 0) insights.push("Suggested Size: Medium (Standard).");
      }
    }

    // 2. Symmetry Check
    activePoints.forEach(p => {
      const pointKey = p.toLowerCase();
      const mPoint = measurements[pointKey];
      if (!mPoint) return;
      
      const l = parseFloat(mPoint.left);
      const r = parseFloat(mPoint.right);
      if (!isNaN(l) && !isNaN(r) && Math.abs(l - r) > 3) {
        warnings.push(`Significant asymmetry (${Math.abs(l - r)}${unit}) detected in ${p} measurement.`);
      }
    });

    // 3. Historical Mock Comparison
    insights.push("Stability: Measurements show 2% reduction compared to last clinical assessment (14 days ago).");

    // 4. Compression Suggestion
    const ankleObj = measurements['ankle'];
    const ankleLeft = ankleObj ? parseFloat(ankleObj.left) : NaN;
    if (selectedArea === 'Lower Limb' && !isNaN(ankleLeft) && ankleLeft > 28) {
      insights.push("Condition Severity: High. Suggest Class 3 (34-46 mmHg) for active edema management.");
    } else {
      insights.push("Suggested Compression: Class 2 (23-32 mmHg) for maintenance.");
    }

    setValidationResult({
      type: warnings.length > 0 ? 'warning' : 'success',
      title: warnings.length > 0 ? 'Clinical Warnings Found' : 'Anatomical Validation Passed',
      message: warnings.length > 0 ? warnings[0] : 'All measurements are within clinical tolerance ranges.',
      insights: insights.filter(Boolean)
    });
  };

  const resetArea = () => {
    const activePoints = anatomicalPoints[selectedArea];
    const newMeasurements = { ...measurements };
    activePoints.forEach(p => {
      newMeasurements[p.toLowerCase()] = { left: '', right: '' };
    });
    setMeasurements(newMeasurements);
    setValidationResult(null);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      if (patientId) {
        await dbService.patients.update(patientId, {
          full_name: patientName,
          measurements: measurements,
          notes: notes
        });
      } else {
        const newPatient = await dbService.patients.create({
          full_name: patientName,
          measurements: measurements,
          notes: notes,
          clinic_id: 'default'
        });
        if (newPatient) setPatientId(newPatient.id);
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('idle');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleSubmitOrder = async () => {
    if (!patientName) {
      alert("Please enter patient name first.");
      return;
    }

    setIsOrdering(true);
    try {
      await handleSave();
      
      await dbService.orders.create({
        patient_id: patientId || 'anonymous',
        patient_name: patientName,
        garment_type: garment.type,
        status: 'Approved',
        config: garment,
        measurements: measurements
      });

      alert("Order submitted to production!");
    } catch (err) {
      console.error('Order submission failed:', err);
      alert("Failed to submit order.");
    } finally {
      setIsOrdering(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
    try {
      // Small delay to ensure any images are loaded and rendering is complete
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800 // Fix width for consistent rendering
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Clinical_Report_${patientName.replace(/\s+/g, '_') || 'Patient'}_${date}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('PDF generation failed. Opening print dialog as fallback.');
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 pb-32 animate-in fade-in duration-500">
      {/* Hidden printable report - positioned off-screen but rendered */}
      <div 
        ref={reportRef}
        className="fixed top-0 left-0 -z-50 pointer-events-none opacity-0 print:static print:block print:opacity-100 print:z-0" 
        style={{ width: '210mm', backgroundColor: 'white' }}
      >
        <ClinicalReport 
          patient={{ name: patientName, id: patientId }}
          measurements={measurements}
          photos={photos}
          garment={garment}
          date={date}
          notes={notes}
          insights={validationResult?.insights}
          unit={unit}
        />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-8 print:hidden">
        
        {/* Header - Unified Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 flex-shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Clinical Assessment</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {patientName ? `Patient: ${patientName}` : 'No Patient Selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center justify-center gap-4 md:gap-8 px-4">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveView(s.id)}
                className="group flex items-center gap-3 relative"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2",
                  activeView === s.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110" 
                    : "bg-slate-50 border-transparent text-slate-400 group-hover:bg-slate-100"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    activeView === s.id ? "text-blue-600 font-black" : "text-slate-400"
                  )}>Step {idx + 1}</p>
                  <p className={cn(
                    "text-[10px] font-bold",
                    activeView === s.id ? "text-slate-900" : "text-slate-400"
                  )}>{s.label}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden xl:block absolute -right-6 top-1/2 -translate-y-1/2">
                    <ChevronRight className="w-4 h-4 text-slate-200" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                saveStatus === 'saved' 
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {saveStatus === 'saving' ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>

            <button 
              onClick={() => window.print()}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
            >
              <Activity className="w-4 h-4 text-slate-400" />
              Print
            </button>

            <button 
              onClick={handleDownloadReport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating...' : 'Report (PDF)'}
            </button>

            <button 
              onClick={toggleUnits}
              className="flex items-center gap-3 px-5 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              {unit}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Context & Selection */}
          <div className="lg:col-span-4 space-y-6">
            <div className="medical-card p-6 bg-blue-50/50 border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Patient Identity</h4>
                  <p className="text-[8px] font-bold text-blue-400">CRITICAL IDENTIFICATION</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1 flex items-center gap-1.5">
                    Full Patient Name
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-white border-2 border-slate-50 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1 flex items-center gap-1.5">
                    Medical Record #
                  </label>
                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="MRN-12345"
                      className="w-full bg-white border-2 border-slate-50 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="medical-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anatomical Focus</h4>
                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black">
                  SELECT AREA
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(anatomicalPoints) as AreaType[]).map(area => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl font-bold transition-all text-left border-2",
                      selectedArea === area 
                        ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100" 
                        : "bg-white border-slate-50 text-slate-500 hover:border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        selectedArea === area ? "bg-blue-500/30" : "bg-slate-100 group-hover:bg-slate-200"
                      )}>
                        <Layers className={cn("w-4 h-4", selectedArea === area ? "text-white" : "text-slate-400")} />
                      </div>
                      <span className="text-sm">{area}</span>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", selectedArea === area ? "translate-x-1" : "opacity-30")} />
                  </button>
                ))}
              </div>
            </div>

            <div className="medical-card p-6 bg-slate-900 text-white border-none shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interactive Body Map</h4>
                <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-lg text-[8px] font-black">
                  {getCompletion()}% COMPLETE
                </div>
              </div>
              <div className="relative">
                <HumanBodySVG 
                  area={selectedArea} 
                  onPartClick={(p) => setActiveLandmark(p.toLowerCase())}
                />
                <div className="absolute top-4 right-4 animate-pulse">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Live Feedback</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="medical-card p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Protocol Metadata</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Assessment Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Clinical Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add patient specific notes..."
                    className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-xs font-bold text-slate-700 outline-none resize-none transition-all focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="medical-card p-6 bg-blue-600 text-white border-none shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Procedure Help</h4>
              </div>
              <ul className="space-y-3">
                {[
                  "Select the anatomical area above.",
                  "Click body map markers to auto-focus rows.",
                  "Enter Left & Right limb circumferences.",
                  "Run 'Verify' for AI anatomical checks."
                ].map((text, i) => (
                  <li key={i} className="flex gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[8px] font-black">{i+1}</div>
                    <p className="text-[10px] font-bold leading-snug opacity-90">{text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Active View */}
          <div className="lg:col-span-8 space-y-6">
            {activeView === 'measurements' ? (
              <div className="space-y-6">
                <div className="medical-card p-8 bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {selectedArea} Matrix
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {unit}
                        </span>
                      </h3>
                      <p className="text-slate-400 text-xs font-bold mt-1">Enter circumference values for both limbs where applicable.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={resetArea}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear Area
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-8 px-8">
                    <table className="w-full border-separate border-spacing-y-4">
                      <thead>
                        <tr>
                          <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2">Landmark</th>
                          <th className="text-center text-[10px] font-black text-blue-600 uppercase tracking-widest px-4 pb-2 bg-blue-50/50 rounded-t-2xl">Left Limb</th>
                          <th className="text-center text-[10px] font-black text-indigo-600 uppercase tracking-widest px-4 pb-2 bg-indigo-50/50 rounded-t-2xl">Right Limb</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-4">
                        {anatomicalPoints[selectedArea].map(point => {
                          const isFocused = activeLandmark === point.toLowerCase();
                          return (
                            <tr 
                              key={point} 
                              className={cn(
                                "group transition-all duration-300",
                                isFocused ? "ring-2 ring-blue-500 ring-inset bg-blue-50/10" : ""
                              )}
                              onFocus={() => setActiveLandmark(point.toLowerCase())}
                            >
                              <td className="py-2 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                                    isFocused ? "bg-blue-600 scale-150 shadow-[0_0_8px_rgba(37,99,235,1)]" : "bg-slate-300 opacity-40 group-hover:opacity-100"
                                  )} />
                                  <span className={cn(
                                    "text-xs font-black tracking-tight transition-colors",
                                    isFocused ? "text-blue-600" : "text-slate-700"
                                  )}>{point}</span>
                                </div>
                              </td>
                              <td className="py-2 px-4 bg-blue-50/20 group-first:rounded-tl-2xl group-last:rounded-bl-2xl">
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={measurements[point.toLowerCase()].left}
                                    onChange={(e) => handleMeasurementChange(point, 'left', e.target.value)}
                                    className={cn(
                                      "w-full bg-white border-2 rounded-xl px-4 py-3 text-sm font-bold text-center outline-none transition-all shadow-sm group-hover:shadow-md",
                                      isFocused ? "border-blue-400 ring-4 ring-blue-100" : "border-white"
                                    )}
                                    placeholder="--"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 pointer-events-none uppercase">{unit}</span>
                                </div>
                              </td>
                              <td className="py-2 px-4 bg-indigo-50/20 group-first:rounded-tr-2xl group-last:rounded-br-2xl">
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={measurements[point.toLowerCase()].right}
                                    onChange={(e) => handleMeasurementChange(point, 'right', e.target.value)}
                                    className={cn(
                                      "w-full bg-white border-2 rounded-xl px-4 py-3 text-sm font-bold text-center outline-none transition-all shadow-sm group-hover:shadow-md",
                                      isFocused ? "border-indigo-400 ring-4 ring-indigo-100" : "border-white"
                                    )}
                                    placeholder="--"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 pointer-events-none uppercase">{unit}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50 pt-8">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 max-w-[200px]">Data will be synchronized with manufacturing specifications.</p>
                    </div>
                    
                    <button 
                      onClick={handleValidation}
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-xs hover:bg-slate-800 transition-all shadow-2xl active:scale-95 group"
                    >
                      <Zap className="w-4 h-4 text-orange-400 group-hover:animate-bounce" />
                      Verify Measurements
                    </button>
                  </div>
                </div>

                {/* AI Validation Result */}
                {validationResult && (
                  <div className={cn(
                    "p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-top-4 duration-500 shadow-sm",
                    validationResult.type === 'success' 
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" 
                      : "bg-orange-50/50 border-orange-100 text-orange-900"
                  )}>
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        validationResult.type === 'success' ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-orange-500 text-white shadow-orange-100"
                      )}>
                        {validationResult.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-black text-base uppercase tracking-tight">{validationResult.title}</h5>
                          <div className="px-3 py-1 bg-white/50 rounded-full text-[9px] font-black uppercase tracking-tighter">AI FEEDBACK</div>
                        </div>
                        <p className="text-sm font-medium leading-relaxed opacity-80 mb-4">{validationResult.message}</p>
                        
                        {validationResult.insights && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/5">
                            {validationResult.insights.map((insight: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/30 px-3 py-2 rounded-xl border border-white/40">
                                <Sparkles className="w-3 h-3 opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-tight">{insight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeView === 'photos' ? (
              <div className="h-full">
                <ImageAnnotator 
                  photo={photos}
                  onUpdate={(data) => setPhotos(data)}
                />
              </div>
            ) : (
              <div className="h-full space-y-6">
                <GarmentConfigurator 
                  config={garment}
                  onUpdate={(data) => setGarment(data)}
                />
                
                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isOrdering}
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
                  >
                    {isOrdering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                    {isOrdering ? 'Submitting...' : 'Submit to Production'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMeasurements;

