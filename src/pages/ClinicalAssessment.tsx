import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Stethoscope, 
  Hospital, 
  Calendar, 
  Fingerprint, 
  ChevronRight, 
  ChevronLeft,
  Camera,
  ShoppingBag,
  Ruler,
  FileText,
  Download,
  CheckCircle2,
  Plus,
  Upload,
  Layers,
  Sparkles,
  Printer,
  Trash2,
  Activity,
  Save,
  Scissors,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../services/supabase';
import { compressImage } from '../lib/imageUtils';
import { Patient } from '../types';

// --- Types ---
type StepId = 'patient-info' | 'garment-select' | 'garment-type' | 'measurement-drawing' | 'review';

export const GARMENT_FIELDS: Record<string, { id: string; label: string; placeholder: string }[]> = {
  'Face Mask & Chin Binder': [
    { id: 'around_neck', label: 'Around neck', placeholder: 'e.g., 38 cm' },
    { id: 'around_head', label: 'Around head', placeholder: 'e.g., 54 cm' },
    { id: 'around_chin', label: 'Around chin', placeholder: 'e.g., 32 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 12 cm' }
  ],
  'Connecting Sleeves/Arm Sleeve': [
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 42 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'All Jacket': [
    { id: 'neck_around', label: 'Neck around', placeholder: 'e.g., 36 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 8 cm' },
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 44 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 32 cm' },
    { id: 'arm_open_end', label: 'Arm open end', placeholder: 'e.g., 20 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 26 cm' },
    { id: 'arm_close_end', label: 'Arm close end', placeholder: 'e.g., 16 cm' },
    { id: 'arm_total_length', label: 'Arm total length', placeholder: 'e.g., 62 cm' },
    { id: 'chest', label: 'Chest', placeholder: 'e.g., 98 cm' },
    { id: 'diapharm', label: 'Diapharm', placeholder: 'e.g., 85 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 90 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 88 cm' },
    { id: 'total_length', label: 'Total length', placeholder: 'e.g., 70 cm' }
  ],
  'All Gloves/Glove With Sleeve': [
    { id: 'palm', label: 'Palm', placeholder: 'e.g., 20 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'total_len_medal_to_wrist', label: 'Total length medal finger to wrist', placeholder: 'e.g., 18 cm' },
    { id: 'medal_finger', label: 'Medal finger', placeholder: 'e.g., 8 cm' },
    { id: 'left_finger', label: 'Left finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'right_finger', label: 'Right finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'small_finger', label: 'Small finger', placeholder: 'e.g., 6 cm' },
    { id: 'thumb', label: 'Thumb', placeholder: 'e.g., 5.5 cm' },
    { id: 'total_len_medal_to_scar', label: 'Total length medal finger to end of scar', placeholder: 'e.g., 35 cm' }
  ],
  'Belly Binder': [
    { id: 'diaphrarm', label: 'Diaphrarm', placeholder: 'e.g., 82 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 88 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 85 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 54 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 48 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 38 cm' },
    { id: 'len_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'len_waist_to_close_end', label: 'Length waist to close end', placeholder: 'e.g., 35 cm' }
  ],
  'All Trouser': [
    { id: 'diaphrarm', label: 'Diaphrarm', placeholder: 'e.g., 82 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 88 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 85 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 54 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 48 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 38 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 22 cm' },
    { id: 'len_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'len_waist_to_ankle', label: 'Length waist to ankle', placeholder: 'e.g., 95 cm' }
  ],
  'All Leg Sleeves': [
    { id: 'open_end', label: 'Open end', placeholder: 'e.g., 45 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 35 cm' },
    { id: 'close_end', label: 'Close end', placeholder: 'e.g., 22 cm' },
    { id: 'total_length', label: 'Total length', placeholder: 'e.g., 68 cm' }
  ],
  'All Socks': [
    { id: 'feet', label: 'Feet', placeholder: 'e.g., 24 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 22 cm' },
    { id: 'above_ankle_open_end', label: 'Above ankle open end', placeholder: 'e.g., 26 cm' },
    { id: 'close_end', label: 'Close end', placeholder: 'e.g., 20 cm' },
    { id: 'feet_length', label: 'Feet length', placeholder: 'e.g., 25 cm' },
    { id: 'len_heel_to_close_end', label: 'Length heel to close end', placeholder: 'e.g., 18 cm' }
  ]
};

interface PatientInfo {
  id?: string;
  name: string;
  address: string;
  phone: string;
  doctorRef: string;
  hospitalName: string;
  date: string;
  patientId: string;
  notes?: string;
  age?: number;
  gender?: string;
  city?: string;
}

interface GarmentConfig {
  type: string;
  siliconePasting: 'With Silicone' | 'Without Silicone';
  compression: 'Low' | 'Moderate' | 'High';
  subOptions?: Record<string, string>;
}

interface MeasurementPoint {
  id: string;
  label: string;
  value: string;
  x: number; // SVG coordinates for mapping
  y: number;
  startX?: number; // Interactive measurement coordinates
  startY?: number;
  endX?: number;
  endY?: number;
}

// --- Components ---

const SmartDiagram: React.FC<{ 
  measurements: MeasurementPoint[], 
  garmentType: string,
  imageUrl?: string,
  isPrinting?: boolean,
  isAICleanActive?: boolean,
  activeMeasuringId?: string | null,
  onPointSelect?: (x: number, y: number) => void
}> = ({ measurements, garmentType, imageUrl, isPrinting, isAICleanActive, activeMeasuringId, onPointSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const sketchFilterId = `sketch-${garmentType.replace(/\s+/g, '-')}`;
  const aiCleanFilterId = `ai-clean-${garmentType.replace(/\s+/g, '-')}`;
  const gradientId = `grad-${garmentType.replace(/\s+/g, '-')}`;
  const filterId = `filter-${garmentType.replace(/\s+/g, '-')}`;

  const renderDiagramContent = () => {
    switch (garmentType) {
      case 'Face Mask':
        return (
          <g filter={`url(#${filterId})`}>
            <path 
              d="M200,50 C130,50 80,110 80,180 C80,250 120,300 160,330 L160,400 L240,400 L240,330 C280,300 320,250 320,180 C320,110 270,50 200,50 Z" 
              fill={imageUrl ? "none" : `url(#${gradientId})`}
              stroke={imageUrl ? "#2563eb" : "#64748b"} 
              strokeWidth={imageUrl ? "2" : "1.5"}
            />
            {!imageUrl && (
              <>
                <path 
                  d="M200,60 C150,60 100,120 100,180 C100,220 120,250 150,270" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  opacity="0.4"
                />
                <ellipse cx="160" cy="160" rx="15" ry="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
                <ellipse cx="240" cy="160" rx="15" ry="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.5" />
              </>
            )}
          </g>
        );
      case 'Arm Sleeve':
      case 'Gloves with Sleeve':
        return (
          <g filter={`url(#${filterId})`}>
            <path 
              d="M165,50 L145,300 C140,350 145,450 160,480 L240,480 C255,450 260,350 255,300 L235,50 Z" 
              fill={imageUrl ? "none" : `url(#${gradientId})`}
              stroke={imageUrl ? "#2563eb" : "#475569"} 
              strokeWidth={imageUrl ? "2" : "1.5"}
            />
            {!imageUrl && <path d="M175,60 L160,300" fill="none" stroke="white" strokeWidth="2" opacity="0.3" strokeLinecap="round" />}
          </g>
        );
      case 'Leg Garment':
        return (
          <g filter={`url(#${filterId})`}>
            <path 
              d="M140,50 L125,250 C120,350 145,450 165,490 L235,490 C255,450 280,350 275,250 L260,50 Z" 
              fill={imageUrl ? "none" : `url(#${gradientId})`}
              stroke={imageUrl ? "#2563eb" : "#475569"} 
              strokeWidth={imageUrl ? "2" : "1.5"}
            />
            {!imageUrl && <ellipse cx="200" cy="300" rx="40" ry="100" fill="white" opacity="0.2" filter="blur(15px)" />}
          </g>
        );
      case 'Vest':
        return (
          <g filter="drop-shadow(0 15px 25px rgba(0,0,0,0.1))">
            <path 
              d="M120,50 L95,100 L75,180 L75,460 L325,460 L325,180 L305,100 L280,50 Z M150,55 C160,90 240,90 250,55" 
              fill={imageUrl ? "none" : `url(#${gradientId})`}
              stroke={imageUrl ? "#2563eb" : "#334155"} 
              strokeWidth={imageUrl ? "2" : "2"}
            />
            {!imageUrl && <path d="M120,200 L200,210 L280,200" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.3" />}
          </g>
        );
      default: // Gloves
        return (
          <g filter="drop-shadow(0 15px 20px rgba(0,0,0,0.1))">
            <path 
              d="M100,450 L100,350 C100,300 80,280 80,220 L80,100 C80,80 110,80 110,100 L110,200 L140,200 L140,50 C140,30 170,30 170,50 L170,180 L200,180 L200,30 C200,10 230,10 230,30 L230,180 L260,180 L260,60 C260,40 290,40 290,60 L290,180 L310,200 C330,220 330,280 310,320 L310,450 Z" 
              fill={imageUrl ? "none" : "url(#glove-vol-local)"} 
              stroke={imageUrl ? "#2563eb" : "#334155"} 
              strokeWidth={imageUrl ? "2" : "1.5"}
            />
            {!imageUrl && (
              <>
                <defs>
                  <linearGradient id="glove-vol-local" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="30%" stopColor="#f8fafc" />
                    <stop offset="70%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>
                <path 
                  d="M110,350 C110,320 180,320 180,350" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="4" 
                  opacity="0.3" 
                  filter="blur(4px)"
                />
              </>
            )}
          </g>
        );
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeMeasuringId || !onPointSelect || !svgRef.current) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const cursorpt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    onPointSelect(cursorpt.x, cursorpt.y);
  };

  return (
    <div 
      className={cn(
        "relative w-full aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center p-8 overflow-hidden group",
        isPrinting && "bg-white border-0 p-0",
        isAICleanActive && "bg-blue-900/5 ring-4 ring-blue-600/10",
        activeMeasuringId && "cursor-crosshair ring-4 ring-blue-500/20"
      )}
    >
      <svg 
        ref={svgRef}
        viewBox="0 0 400 500" 
        onClick={handleSvgClick}
        className="w-full h-full max-h-[500px] relative z-10 transition-transform duration-700 group-hover:scale-105"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
          </marker>
          <marker id="arrowhead-reverse" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="10 0, 0 3.5, 10 7" fill="#2563eb" />
          </marker>
          <filter id={sketchFilterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 
                                               0.33 0.33 0.33 0 0 
                                               0.33 0.33 0.33 0 0 
                                               0 0 0 1 0" result="gray"/>
            <feComponentTransfer in="gray">
              <feFuncR type="gamma" exponent="0.8" amplitude="1.2" offset="-0.1"/>
              <feFuncG type="gamma" exponent="0.8" amplitude="1.2" offset="-0.1"/>
              <feFuncB type="gamma" exponent="0.8" amplitude="1.2" offset="-0.1"/>
            </feComponentTransfer>
          </filter>

          <filter id={aiCleanFilterId} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 
                                               0.33 0.33 0.33 0 0 
                                               0.33 0.33 0.33 0 0 
                                               0 0 0 1 0" result="gray"/>
            <feComponentTransfer in="gray">
              <feFuncR type="gamma" exponent="0.5" amplitude="1.5" offset="-0.2"/>
              <feFuncG type="gamma" exponent="0.5" amplitude="1.5" offset="-0.2"/>
              <feFuncB type="gamma" exponent="0.5" amplitude="1.5" offset="-0.2"/>
            </feComponentTransfer>
          </filter>

          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <filter id={filterId} ><feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.15"/></filter>
        </defs>

        {imageUrl && (
          <image 
            href={imageUrl} 
            width="400" 
            height="500" 
            crossOrigin="anonymous"
            preserveAspectRatio="xMidYMid slice" 
            style={{ 
              filter: isPrinting ? "none" : (isAICleanActive ? `url(#${aiCleanFilterId})` : `url(#${sketchFilterId})`),
              opacity: isPrinting ? 1 : (isAICleanActive ? 1 : 0.8),
              transition: 'all 0.5s ease-in-out'
            }}
          />
        )}
        {!imageUrl && renderDiagramContent()}
      </svg>
      
      {/* Measurement Arrows and Visual Annotations */}
      <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full pointer-events-none z-15">
        {activeMeasuringId && (
          <text 
            x="200" 
            y="30" 
            textAnchor="middle" 
            className="fill-blue-600 text-[12px] font-black uppercase tracking-widest animate-pulse"
          >
            Click Start and End point on Image
          </text>
        )}
        {measurements.map((m) => {
          if (!m.value && !m.startX) return null;
          
          // If interactive measurement exists, use its points
          const isInteractive = m.startX !== undefined && m.endX !== undefined;
          const x1 = isInteractive ? m.startX! : m.x - 20;
          const y1 = isInteractive ? m.startY! : m.y;
          const x2 = isInteractive ? m.endX! : m.x + 20;
          const y2 = isInteractive ? m.endY! : m.y;

          return (
            <g key={`arrow-${m.id}`} className="animate-in fade-in zoom-in-95 duration-700">
              <line 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke="#2563eb" 
                strokeWidth="2" 
                markerStart="url(#arrowhead-reverse)"
                markerEnd="url(#arrowhead)"
                strokeDasharray="4 2"
                opacity="1"
              />
              <text 
                x={(x1 + x2) / 2} 
                y={(y1 + y2) / 2 - 12} 
                textAnchor="middle" 
                className="fill-blue-600 text-[10px] font-black tracking-tighter"
                style={{ filter: 'drop-shadow(0 1px 2px white)' }}
              >
                {m.value} cm
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Dynamic Measurement Points */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {measurements.map((m) => {
          if (!m.value) return null;
          return (
            <div 
              key={m.id}
              className="absolute flex items-center gap-2 animate-in zoom-in-50 duration-500"
              style={{ left: `${m.x/4}%`, top: `${m.y/5}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-lg shadow-blue-200" />
              <div className="px-2 py-1 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-lg shadow-sm">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-8 right-8">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl",
          isAICleanActive ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-blue-600 text-white shadow-blue-100"
        )}>
          <Activity className="w-3 h-3" />
          {isAICleanActive ? "AI Refined Protocol" : "Smart Sync Active"}
        </div>
      </div>
    </div>
  );
};

interface ClinicalAssessmentProps {
  patientData?: Patient | null;
  onComplete?: () => void;
}

const ClinicalAssessment: React.FC<ClinicalAssessmentProps> = ({ patientData, onComplete }) => {
  const [activeStep, setActiveStep] = useState<StepId>('patient-info');
  const [providedPhotos, setProvidedPhotos] = useState<'yes' | 'no'>('no');
  const [providedPhotosError, setProvidedPhotosError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const countWords = (text: string) => {
    if (!text) return 0;
    const cleanText = text.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  const handleNotesChange = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") {
      setPatient(prev => ({ ...prev, notes: text }));
      return;
    }
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 500) {
      setPatient(prev => ({ ...prev, notes: text }));
    } else {
      const words = text.split(/(\s+)/);
      let wordCountSoFar = 0;
      let limitIndex = 0;
      for (let i = 0; i < words.length; i++) {
        if (words[i].trim() !== '') {
          wordCountSoFar++;
          if (wordCountSoFar > 500) {
            limitIndex = i;
            break;
          }
        }
      }
      const truncated = words.slice(0, limitIndex).join('');
      setPatient(prev => ({ ...prev, notes: truncated }));
    }
  };

  // 1. Patient State
  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    address: '',
    phone: '',
    doctorRef: '',
    hospitalName: '',
    date: new Date().toISOString().split('T')[0],
    patientId: `P-${Math.floor(10000 + Math.random() * 90000)}`,
    notes: '',
    age: 0,
    gender: 'other',
    city: ''
  });

  // Load patient data if provided
  useEffect(() => {
    if (patientData) {
      setPatient({
        id: patientData.id,
        name: patientData.full_name,
        address: patientData.address,
        phone: patientData.phone,
        doctorRef: patientData.doctor_name,
        hospitalName: patientData.hospital || (patientData.clinic_id === 'default' ? 'Medical Center' : patientData.clinic_id),
        date: new Date().toISOString().split('T')[0],
        patientId: patientData.id.includes('temp') ? `P-${Math.floor(10000 + Math.random() * 90000)}` : patientData.id,
        notes: patientData.notes || '',
        age: patientData.age,
        gender: patientData.gender,
        city: patientData.city || ''
      });
      if (patientData.photo_url) {
        setPhotos([patientData.photo_url]);
        setProvidedPhotos('yes');
      } else {
        setProvidedPhotos('no');
      }
      // Skip to garment select if we have patient data already
      setActiveStep('garment-select');
    }
  }, [patientData]);

  // 2. Garment State
  const [garment, setGarment] = useState<GarmentConfig>({
    type: 'All Gloves/Glove With Sleeve',
    siliconePasting: 'Without Silicone',
    compression: 'Moderate',
    subOptions: {}
  });

  // 3. Photos State
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Measurements State - Updated based on garment type
  const getInitialMeasurements = (type: string): MeasurementPoint[] => {
    if (type.includes('Face Mask') || type.includes('Face')) {
      return [
        { id: 'brow', label: 'Brow Circumference', value: '', x: 200, y: 100 },
        { id: 'chin-ear', label: 'Chin to Ear', value: '', x: 140, y: 300 },
        { id: 'neck', label: 'Lower Neck', value: '', x: 200, y: 420 },
      ];
    }
    if ((type.includes('Arm') || type.includes('Sleeve')) && !type.includes('Leg') && !type.includes('Glove') && !type.includes('Gloves')) {
      return [
        { id: 'wrist', label: 'Wrist', value: '', x: 200, y: 400 },
        { id: 'mid-arm', label: 'Mid Arm', value: '', x: 200, y: 250 },
        { id: 'axilla', label: 'Axilla (Upper)', value: '', x: 200, y: 100 },
      ];
    }
    if (type.includes('Leg') || type.includes('Trouser') || type.includes('Socks')) {
      return [
        { id: 'ankle', label: 'Ankle', value: '', x: 200, y: 450 },
        { id: 'calf', label: 'Calf', value: '', x: 200, y: 300 },
        { id: 'thigh', label: 'Thigh (Upper)', value: '', x: 200, y: 150 },
      ];
    }
    if (type.includes('Jacket') || type.includes('Vest') || type.includes('Binder')) {
      return [
        { id: 'neck', label: 'Neck', value: '', x: 200, y: 80 },
        { id: 'chest', label: 'Chest', value: '', x: 200, y: 200 },
        { id: 'waist', label: 'Waist', value: '', x: 200, y: 380 },
      ];
    }
    // Default: 'All Gloves/Glove With Sleeve' (or any other Gloves fallback)
    return [
      { id: 'palm', label: 'Palm', value: '', x: 200, y: 320 },
      { id: 'wrist', label: 'Wrist', value: '', x: 200, y: 400 },
      { id: 'forearm', label: 'Forearm', value: '', x: 200, y: 460 },
      { id: 'thumb', label: 'Thumb', value: '', x: 100, y: 300 },
      { id: 'index', label: 'Index Finger', value: '', x: 110, y: 150 },
      { id: 'middle', label: 'Middle Finger', value: '', x: 170, y: 100 },
    ];
  };

  const renderMeasurementDrawingSvg = () => {
    const fields = GARMENT_FIELDS[garment.type] || [];
    const strokeProps = { stroke: "#2563eb", strokeWidth: "2", fill: "none" };

    const formatVal = (label: string) => {
      const val = garment.subOptions?.[label];
      if (!val) return '—';
      const clean = val.trim();
      if (!clean) return '—';
      if (clean.toLowerCase().endsWith('cm')) return clean;
      return `${clean} cm`;
    };

    switch (garment.type) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline face */}
            <path d="M100,240 Q70,160 130,80 Q190,40 240,110 Q260,150 250,210 Q230,260 170,260 Q130,260 100,240 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            <path d="M110,230 Q140,240 170,230 Q190,200 190,170 Q160,161 140,170 Q110,180 110,230 Z" fill="#bfdbfe" fillOpacity="0.4" />
            {/* Around Head Line (diagonal forehead) */}
            <path d="M130,85 Q190,65 235,115" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
            <circle cx="180" cy="72" r="5" fill="#2563eb" />
            
            {/* Around Chin Line */}
            <path d="M245,150 Q160,245 125,215" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
            
            {/* Around Neck Line */}
            <path d="M125,255 Q165,275 220,245" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />

            {/* Neck Length Line */}
            <path d="M165,225 L165,275" stroke="#dc2626" strokeWidth="2.5" fill="none" />

            {/* Dimension value text placement */}
            <g transform="translate(180, 50)" className="text-[10px] font-black text-blue-600">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#2563eb" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>
            <g transform="translate(225, 205)" className="text-[10px] font-black text-emerald-600">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#10b981" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>
            <g transform="translate(165, 290)" className="text-[10px] font-black text-amber-600">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>
            <g transform="translate(240, 245)" className="text-[10px] font-black text-rose-600">
              <rect x="-60" y="-8" width="120" height="15" rx="4" fill="white" stroke="#dc2626" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-rose-700 font-bold" fontSize="8">Neck Len: {formatVal('Neck length')}</text>
            </g>
          </svg>
        );

      case 'Connecting Sleeves/Arm Sleeve':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline arm */}
            <path d="M50,80 C70,75 130,100 170,120 C220,145 260,180 270,220 C250,230 230,210 200,190 C150,160 90,135 60,140 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            
            {/* Shoulder point */}
            <path d="M55,77 L62,143" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            {/* Arm Pit */}
            <path d="M100,100 L110,147" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            {/* Elbow */}
            <path d="M175,123 L185,160" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3"/>
            {/* Wrist */}
            <path d="M245,165 L255,195" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3"/>
            {/* Arm length */}
            <path d="M58,110 Q150,130 250,180" stroke="#7c3aed" strokeWidth="2.5" fill="none" />

            {/* Labels overlay */}
            <g transform="translate(60, 45)" className="text-[9px] font-bold">
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(105, 75)" className="text-[9px] font-bold">
              <rect x="-50" y="-7" width="100" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(175, 95)" className="text-[9px] font-bold">
              <rect x="-50" y="-7" width="100" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(255, 140)" className="text-[9px] font-bold">
              <rect x="-50" y="-7" width="100" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-bold" fontSize="9">Wrist: {formatVal('Wrist')}</text>
            </g>
            <g transform="translate(160, 225)" className="text-[9px] font-bold">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
          </svg>
        );

      case 'All Jacket':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline Jacket */}
            <path d="M80,60 L220,60 L240,110 L280,180 L250,195 L220,140 L215,250 L85,250 L80,140 L50,195 L20,180 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            
            {/* lines */}
            <line x1="85" y1="110" x2="215" y2="110" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="85" y1="200" x2="215" y2="200" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="220" y1="60" x2="280" y2="180" stroke="#f59e0b" strokeWidth="2" />
            <line x1="150" y1="60" x2="150" y2="250" stroke="#ec4899" strokeWidth="2" />

            {/* overlays */}
            <g transform="translate(150, 20)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Neck: {formatVal('Neck around')}</text>
            </g>
            <g transform="translate(150, 40)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#dc2626" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-red-700 font-bold" fontSize="8">Neck Len: {formatVal('Neck length')}</text>
            </g>
            <g transform="translate(55, 50)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-700 font-bold" fontSize="8">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(55, 140)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-700 font-bold" fontSize="8">Arm Pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(30, 210)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-700 font-bold" fontSize="8">Arm Open: {formatVal('Arm open end')}</text>
            </g>
            <g transform="translate(265, 130)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-700 font-bold" fontSize="8">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(265, 210)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-700 font-bold" fontSize="8">Arm Close: {formatVal('Arm close end')}</text>
            </g>
            <g transform="translate(255, 80)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#8b5cf6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-violet-700 font-bold" fontSize="8">Arm Length: {formatVal('Arm total length')}</text>
            </g>
            <g transform="translate(150, 105)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Chest: {formatVal('Chest')}</text>
            </g>
            <g transform="translate(150, 137)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Diapharm: {formatVal('Diapharm')}</text>
            </g>
            <g transform="translate(150, 170)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>
            <g transform="translate(150, 202)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#e11d48" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-rose-600 font-bold" fontSize="8">Waist: {formatVal('Waist')}</text>
            </g>
            <g transform="translate(150, 235)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.2" width="110" height="13" rx="2" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Total Len: {formatVal('Total length')}</text>
            </g>
          </svg>
        );

      case 'All Gloves/Glove With Sleeve':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline Glove */}
            <path d="M120,280 L120,220 C110,210 90,190 90,150 L90,90 C90,80 110,80 110,95 L110,140 L130,140 L130,70 C130,60 150,60 150,75 L150,130 L170,130 L170,60 C170,50 190,50 190,65 L190,130 L210,130 L210,80 C210,70 230,70 230,85 L230,135 L250,150 L250,280 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            
            {/* lines */}
            <line x1="90" y1="165" x2="250" y2="165" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="120" y1="210" x2="250" y2="210" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="185" y1="210" x2="185" y2="280" stroke="#f59e0b" strokeWidth="2" />
            <line x1="90" y1="140" x2="250" y2="140" stroke="#ec4899" strokeWidth="2" strokeDasharray="3 3" />

            <g transform="translate(170, 155)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Palm: {formatVal('Palm')}</text>
            </g>
            <g transform="translate(185, 195)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Wrist: {formatVal('Wrist')}</text>
            </g>
            <g transform="translate(185, 230)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Finger to Wrist: {formatVal('Total length medal finger to wrist')}</text>
            </g>
            <g transform="translate(185, 265)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Finger to Scar: {formatVal('Total length medal finger to end of scar')}</text>
            </g>
            <g transform="translate(150, 45)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#4f46e5" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-indigo-600 font-bold" fontSize="8">Medal: {formatVal('Medal finger')}</text>
            </g>
            <g transform="translate(110, 65)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#0891b2" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-bold" fontSize="8">Left: {formatVal('Left finger')}</text>
            </g>
            <g transform="translate(210, 75)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#059669" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Right: {formatVal('Right finger')}</text>
            </g>
            <g transform="translate(245, 110)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#db2777" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Small: {formatVal('Small finger')}</text>
            </g>
            <g transform="translate(85, 115)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#ea580c" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-orange-600 font-bold" fontSize="8">Thumb: {formatVal('Thumb')}</text>
            </g>
          </svg>
        );

      case 'Belly Binder':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline waist torso */}
            <path d="M80,50 L220,50 L200,240 L100,240 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            <path d="M85,100 L215,100 L205,190 L95,190 Z" fill="#bfdbfe" fillOpacity="0.5" stroke="#60a5fa" strokeWidth="1.5" />

            <line x1="85" y1="100" x2="215" y2="100" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="95" y1="190" x2="205" y2="190" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="230" y1="100" x2="230" y2="190" stroke="#f59e0b" strokeWidth="2" />

            <g transform="translate(150, 75)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Diaphrarm: {formatVal('Diaphrarm')}</text>
            </g>
            <g transform="translate(150, 115)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>
            <g transform="translate(150, 155)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Waist: {formatVal('Waist')}</text>
            </g>
            <g transform="translate(150, 195)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Open Thigh: {formatVal('Open end thigh')}</text>
            </g>
            <g transform="translate(150, 230)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Close Thigh: {formatVal('Close end thigh')}</text>
            </g>
            <g transform="translate(150, 265)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#0891b2" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-bold" fontSize="8">Knee: {formatVal('Knee')}</text>
            </g>
            <g transform="translate(250, 115)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#ea580c" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-orange-600 font-bold" fontSize="8">Dia to Waist: {formatVal('length diaphragm to waist')}</text>
            </g>
            <g transform="translate(250, 195)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#e11d48" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-rose-600 font-bold" fontSize="8">Waist to Close: {formatVal('Length waist to close end')}</text>
            </g>
          </svg>
        );

      case 'All Trouser':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Pants outline */}
            <path d="M100,40 L200,40 L210,100 L230,260 L180,260 L150,110 L120,260 L70,260 L90,100 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />

            <line x1="100" y1="40" x2="200" y2="40" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="90" y1="85" x2="210" y2="85" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="85" y1="125" x2="145" y2="125" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="150" y1="110" x2="120" y2="260" stroke="#ec4899" strokeWidth="2" />
            <line x1="70" y1="250" x2="120" y2="250" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 3"/>

            <g transform="translate(150, 25)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Diaphrarm: {formatVal('Diaphrarm')}</text>
            </g>
            <g transform="translate(150, 60)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>
            <g transform="translate(150, 95)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Waist: {formatVal('Waist')}</text>
            </g>
            <g transform="translate(100, 135)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Open Thigh: {formatVal('Open end thigh')}</text>
            </g>
            <g transform="translate(100, 175)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Close Thigh: {formatVal('Close end thigh')}</text>
            </g>
            <g transform="translate(100, 215)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#0891b2" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-bold" fontSize="8">Knee: {formatVal('Knee')}</text>
            </g>
            <g transform="translate(100, 255)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#e11d48" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-rose-600 font-bold" fontSize="8">Ankle: {formatVal('Ankle')}</text>
            </g>
            <g transform="translate(235, 60)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#ea580c" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-orange-600 font-bold" fontSize="8">Dia to Waist: {formatVal('length diaphragm to waist')}</text>
            </g>
            <g transform="translate(235, 175)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Waist to Ankle: {formatVal('Length waist to ankle')}</text>
            </g>
          </svg>
        );

      case 'All Leg Sleeves':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Outline thigh-calf-ankle cylinder */}
            <path d="M100,50 L200,50 L180,240 L120,240 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            
            <line x1="100" y1="50" x2="200" y2="50" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="110" y1="140" x2="190" y2="140" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="120" y1="240" x2="180" y2="240" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="220" y1="50" x2="220" y2="240" stroke="#ec4899" strokeWidth="2" />

            <g transform="translate(150, 35)" className="text-[8px] font-bold">
              <rect x="-50" y="-7" width="100" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Open End: {formatVal('Open end')}</text>
            </g>
            <g transform="translate(150, 125)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Knee: {formatVal('Knee')}</text>
            </g>
            <g transform="translate(150, 215)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Close End: {formatVal('Close end')}</text>
            </g>
            <g transform="translate(235, 125)" className="text-[8px] font-bold">
              <rect x="-50" y="-7" width="100" height="13" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Total Len: {formatVal('Total length')}</text>
            </g>
          </svg>
        );

      case 'All Socks':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Socks profile */}
            <path d="M120,40 L190,40 L190,160 L260,210 L230,250 L110,160 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
            
            <line x1="120" y1="160" x2="190" y2="160" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="110" y1="160" x2="230" y2="250" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"/>
            <line x1="120" y1="40" x2="110" y2="160" stroke="#f59e0b" strokeWidth="2" />

            <g transform="translate(155, 30)" className="text-[8px] font-bold">
              <rect x="-60" y="-7" width="120" height="13" rx="3" fill="white" stroke="#da70d6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Open End: {formatVal('Above ankle open end')}</text>
            </g>
            <g transform="translate(155, 75)" className="text-[8px] font-bold">
              <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#ff4500" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-orange-600 font-bold" fontSize="8">Close End: {formatVal('Close end')}</text>
            </g>
            <g transform="translate(155, 145)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Ankle: {formatVal('Ankle')}</text>
            </g>
            <g transform="translate(185, 205)" className="text-[8px] font-bold">
              <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Feet: {formatVal('Feet')}</text>
            </g>
            <g transform="translate(230, 245)" className="text-[8px] font-bold">
              <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Feet Length: {formatVal('Feet length')}</text>
            </g>
            <g transform="translate(80, 100)" className="text-[8px] font-bold">
              <rect x="-60" y="-7" width="120" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Heel to End: {formatVal('Length heel to close end')}</text>
            </g>
          </svg>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border border-slate-100 h-full text-slate-400 font-bold uppercase tracking-widest text-xs">
            No Drawing Visual Available
          </div>
        );
    }
  };

  const [measurements, setMeasurements] = useState<MeasurementPoint[]>(getInitialMeasurements('All Gloves/Glove With Sleeve'));
  const [activeMeasuringId, setActiveMeasuringId] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAICleanActive, setIsAICleanActive] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{ title: string; message: string; type: 'success' | 'info' } | null>(null);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (successNotification) {
      const timer = setTimeout(() => {
        setSuccessNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successNotification]);

  // Update measurements when garment type changes
  useEffect(() => {
    setMeasurements(getInitialMeasurements(garment.type));
    setActiveMeasuringId(null);
  }, [garment.type]);

  const handleAIAnalysis = async () => {
    if (photos.length === 0) {
      alert("Please upload a clinical photo first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get the last photo
      const photoUrl = photos[photos.length - 1];
      
      // Convert Blob URL to Base64
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(blob);
      });

      // Call Backend API
      const aiResponse = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          garmentType: garment.type,
          measurementPoints: measurements
        })
      });

      if (!aiResponse.ok) throw new Error('AI analysis failed');
      
      const data = await aiResponse.json();
      
      // Update measurements with AI suggested values
      setMeasurements(prev => prev.map(m => {
        const aiVal = data.measurements.find((ai: any) => ai.id === m.id);
        return aiVal ? { ...m, value: aiVal.value } : m;
      }));

      setIsAICleanActive(true);
      alert("AI Vision has analyzed the photo and suggested measurements. 'Clean AI Scan' mode activated.");
    } catch (err) {
      console.error(err);
      alert("Failed to perform AI analysis. Please ensure API keys are configured.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePatientChange = (key: keyof PatientInfo, value: any) => {
    setPatient(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files) as File[]) {
        try {
          const compressedBase64 = await compressImage(file);
          setPhotos(prev => [...prev, compressedBase64]);
        } catch (err) {
          console.error("Image compression failed:", err);
        }
      }
    }
  };

  const handleValueChange = (id: string, val: string) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, value: val } : m));
  };

  const handlePointSelect = (x: number, y: number) => {
    if (!activeMeasuringId) return;

    setMeasurements(prev => {
      return prev.map(m => {
        if (m.id === activeMeasuringId) {
          if (clickCount === 0) {
            // First click - start point
            setClickCount(1);
            return { ...m, startX: x, startY: y, endX: x, endY: y };
          } else {
            // Second click - end point, calculate distance
            const dx = x - (m.startX || 0);
            const dy = y - (m.startY || 0);
            const distPx = Math.sqrt(dx * dx + dy * dy);
            // Assuming 400px width represents approx 20cm broad view for hand, 
            // adjust scale based on typical garment size. 1px ~ 0.05cm or scale factor.
            const cmValue = (distPx * 0.045).toFixed(1); 
            
            setClickCount(0);
            setActiveMeasuringId(null);
            return { ...m, endX: x, endY: y, value: cmValue };
          }
        }
        return m;
      });
    });
  };

  const handleManualPrint = () => {
    try {
      // Create a hidden iframe for printing to avoid popup blockers and UI issues
      let printFrame = document.getElementById('print-iframe') as HTMLIFrameElement;
      if (printFrame) {
        document.body.removeChild(printFrame);
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'print-iframe';
      // Set sandbox attributes to allow modals/scripts/same-origin
      printFrame.setAttribute('sandbox', 'allow-modals allow-scripts allow-same-origin allow-popups');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const reportHtml = reportRef.current?.outerHTML || '';
      
      // Clean styles - extract all style and link tags and resolve modern colors
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => {
          if (s.tagName.toLowerCase() === 'style') {
            return `<style>${resolveModernColors(s.innerHTML)}</style>`;
          }
          return s.outerHTML;
        })
        .join('\n');

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      frameDoc.open();
      frameDoc.write(`
        <html>
          <head>
            <title>Clinical Assessment Report</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; background: white; }
            </style>
            ${styles}
            <style>
              @media print {
                body { margin: 0; padding: 15mm; background: white !important; }
                #printable-report { 
                  position: static !important; 
                  opacity: 1 !important; 
                  visibility: visible !important;
                  display: block !important;
                  width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                }
              }
              body { padding: 20px; font-family: sans-serif; }
              #printable-report { opacity: 1 !important; visibility: visible !important; position: static !important; display: block !important; }
            </style>
          </head>
          <body>
            <div style="background: white;">
              ${reportHtml}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  try {
                    window.print();
                  } catch (e) {
                    console.error("Print failed:", e);
                    parent.postMessage("print_failed", "*");
                  }
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      frameDoc.close();
    } catch (err) {
      console.error("Print Error:", err);
      generatePDF();
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);
    
    // Store original styles to restore them later
    const originalStyles = new Map<HTMLStyleElement, string>();
    const styleTags = document.getElementsByTagName('style');
    const originalImageSrcsLocal = new Map<Element, string>();
    
    try {
      // PRE-PROCESS: Accurately resolve oklch and color-mix in the main document's styles
      for (let i = 0; i < styleTags.length; i++) {
        const tag = styleTags[i];
        originalStyles.set(tag, tag.innerHTML);
        tag.innerHTML = resolveModernColors(tag.innerHTML);
      }

      const reportElement = reportRef.current;
      
      // PRE-CONVERT ALL IMAGES TO BASE64 TO BYPASS CORS ISSUES IN HTML2CANVAS
      const allImages = Array.from(reportElement.querySelectorAll('img, image'));
      
      await Promise.all(allImages.map(async (el) => {
        const src = el instanceof HTMLImageElement ? el.src : (el instanceof SVGImageElement ? el.getAttribute('href') : null);
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
        
        try {
          const resp = await fetch(src, { mode: 'cors' });
          if (!resp.ok) throw new Error('Network response was not ok');
          const blob = await resp.blob();
          const b64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          originalImageSrcsLocal.set(el as Element, src);
          if (el instanceof HTMLImageElement) el.src = b64;
          else if (el instanceof SVGImageElement) el.setAttribute('href', b64);
        } catch (e) {
          console.warn("Image pre-conversion failed for:", src, e);
        }
      }));

      // Wait for images
      const images = Array.from(reportElement.getElementsByTagName('img'));
      await Promise.all(images.map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Compile parent document stylesheets (inline style tags AND compiled linked stylesheets from the same origin)
      let parentPageStyles = "";
      try {
        const parentStyleTags = document.getElementsByTagName('style');
        for (let i = 0; i < parentStyleTags.length; i++) {
          try {
            parentPageStyles += parentStyleTags[i].innerHTML + "\n";
          } catch {}
        }
        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const sheet = document.styleSheets[i];
            if (sheet.cssRules) {
              for (let j = 0; j < sheet.cssRules.length; j++) {
                parentPageStyles += sheet.cssRules[j].cssText + "\n";
              }
            }
          } catch (sheetErr) {
            console.warn("Skipping cross-origin or blockaded stylesheet rules parsing:", sheetErr);
          }
        }
      } catch (globalStyleErr) {
        console.warn("Could not compile parent styles synchronously:", globalStyleErr);
      }

      // Pre-resolve color-space rules (oklch, color-mix) in our gathered styles using our optimized processor
      const resolvedParentStyles = resolveModernColors(parentPageStyles);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        backgroundColor: '#ffffff',
        logging: true,
        onclone: (clonedDoc) => {
          // EXTREME SANITIZATION for html2canvas
          // 1. Remove link tags to prevent cross-origin stylesheet parsing and styling latency
          const links = clonedDoc.getElementsByTagName('link');
          for (let i = links.length - 1; i >= 0; i--) {
            if (links[i].rel === 'stylesheet') {
              links[i].parentNode?.removeChild(links[i]);
            }
          }

          // 2. Remove default style tags inside clone to make room for our compiled style
          const cloneStyles = clonedDoc.getElementsByTagName('style');
          for (let i = cloneStyles.length - 1; i >= 0; i--) {
            cloneStyles[i].parentNode?.removeChild(cloneStyles[i]);
          }

          // 3. Inject fully compiled and color-resolved CSS into head so typography and styled blocks render perfectly in production
          const mainStyleTag = clonedDoc.createElement('style');
          mainStyleTag.type = 'text/css';
          mainStyleTag.innerHTML = resolvedParentStyles;
          clonedDoc.head?.appendChild(mainStyleTag);

          // 4. Resolve inline styles
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style) {
              const props = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'outlineColor'];
              props.forEach(prop => {
                const val = (el.style as any)[prop];
                if (val && (val.includes('oklch') || val.includes('color-mix') || val.includes('oklab'))) {
                  (el.style as any)[prop] = resolveModernColors(val);
                }
              });
            }
          }

          const el = clonedDoc.getElementById('printable-report');
          if (el) {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.position = 'relative';
            el.style.display = 'block';
            el.style.width = '210mm';
            el.style.padding = '20mm';
            el.style.margin = '0 auto';
            el.style.backgroundColor = '#ffffff';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgHeightInPdf = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `Assessment_${patient.name ? patient.name.replace(/\s+/g, '_') : 'Clinical'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      if (err?.message?.includes('oklch')) {
        alert("Color rendering error detection. Attempting fallback print mode.");
      } else {
        alert("PDF generator encountered an error. Opening print fallback.");
      }
      handleManualPrint();
    } finally {
      // Restore original sources
      originalImageSrcsLocal.forEach((src: string, el: Element) => {
        if (el instanceof HTMLImageElement) el.src = src;
        else if (el instanceof SVGImageElement) el.setAttribute('href', src);
      });

      // Restore original styles
      originalStyles.forEach((originalCss, tag) => {
        tag.innerHTML = originalCss;
      });
      setIsGenerating(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  const handleSaveAssessment = async () => {
    if (!patient.name) {
      setSuccessNotification({
        title: "Registration Required / رجسٹریشن درکار ہے",
        message: "Please ensure patient name is completed before saving the assessment.",
        type: 'info'
      });
      return;
    }
    setIsSavingAssessment(true);
    try {
      await dbService.assessments.create({
        patient_name: patient.name,
        hospital_name: patient.hospitalName || 'Health Institute',
        doctor_ref: patient.doctorRef || 'N/A',
        garment_type: garment.type,
        silicone_pasting: garment.siliconePasting,
        compression: garment.compression,
        measurements: measurements,
        notes: patient.notes || '',
        sub_options: garment.subOptions || {},
        age: patient.age ? Number(patient.age) : 0,
        gender: patient.gender || 'other',
        city: patient.city || ''
      });
      setIsSavingAssessment(false);
      setSuccessNotification({
        title: "Assessment Saved! / اسیسمنٹ محفوظ ہو گئی",
        message: `Clinical assessment for ${patient.name} has been successfully saved to the Registered Assessments database.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Save assessment failed:', err);
      setIsSavingAssessment(false);
      setSuccessNotification({
        title: "Error / غلطی",
        message: "Failed to persist assessment. Please check live database credentials or network.",
        type: 'info'
      });
    }
  };

  // Helper to accurately convert modern CSS colors to RGB
  const resolveModernColors = (css: string) => {
    if (!css || (!css.includes('oklch') && !css.includes('color-mix') && !css.includes('oklab'))) return css;
    if (typeof document === 'undefined') return css;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return css.replace(/(oklch|oklab|color-mix)\([^)]+\)/g, '#1e293b');
    
    // Cache to prevent repetitive image data calculations on identical colors
    const colorCache = new Map<string, string>();
    
    const result = css.replace(/(oklch\([^)]+\)|oklab\([^)]+\)|color-mix\([^)]+\))/g, (match) => {
      if (colorCache.has(match)) {
        return colorCache.get(match)!;
      }
      try {
        ctx.fillStyle = match;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        const converted = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        colorCache.set(match, converted);
        return converted;
      } catch (e) {
        return '#1e293b';
      }
    });
    
    return result;
  };

  const handleSavePatient = async () => {
    setIsSaving(true);
    try {
      const serializedCondition = `Silicone: ${garment.siliconePasting}, Compression: ${garment.compression}`;
      if (patient.id) {
        // Update existing patient
        await dbService.patients.update(patient.id, {
          diagnosis: garment.type + ' Assessment',
          medical_condition: serializedCondition,
          hospital: patient.hospitalName,
          measurements: measurements,
          notes: patient.notes || '',
          photo_url: photos.length > 0 ? photos[photos.length - 1] : undefined,
          age: patient.age ? Number(patient.age) : 0,
          gender: (patient.gender as any) || 'other',
          city: patient.city || ''
        });
        setIsSaving(false);
        setSuccessNotification({
          title: "Profile Updated! / پروفائل اپڈیٹ ہو گئی",
          message: `Clinical details for ${patient.name} has been successfully updated on their existing profile.`,
          type: 'success'
        });
      } else {
        // Create new patient
        const newPatient = await dbService.patients.create({
          full_name: patient.name,
          phone: patient.phone,
          address: patient.address,
          diagnosis: garment.type + ' Assessment',
          doctor_name: patient.doctorRef,
          hospital: patient.hospitalName,
          medical_condition: serializedCondition,
          clinic_id: 'default',
          age: patient.age ? Number(patient.age) : 0,
          gender: (patient.gender as any) || 'other',
          city: patient.city || '',
          height: 0,
          weight: 0,
          email: '',
          measurements: measurements,
          notes: patient.notes || '',
          photo_url: photos.length > 0 ? photos[photos.length - 1] : undefined
        });
        setIsSaving(false);
        // Update local state with the new patient ID if it returned one
        if (newPatient && newPatient.id) {
          setPatient(prev => ({ ...prev, id: newPatient.id }));
        }
        setSuccessNotification({
          title: "Patient Registered! / مریض رجسٹر ہو گیا",
          message: `${patient.name} is successfully registered and diagnostic details have been persisted.`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
      setSuccessNotification({
        title: "Error saving patient data",
        message: "Failed to persist patient and assessment results. Please check connections.",
        type: 'info'
      });
    }
  };

  const handleSubmitOrder = async () => {
    if (!patient.name) {
      alert("Please ensure patient information is completed before ordering.");
      return;
    }

    setIsOrdering(true);
    try {
      // 1. Ensure patient is saved first
      await handleSavePatient();

      // 2. Create the order
      await dbService.orders.create({
        patient_id: patient.id || 'anonymous',
        patient_name: patient.name,
        doctor_name: patient.doctorRef,
        garment_type: garment.type,
        status: 'In Production',
        config: {
          type: garment.type,
          options: {
            silicone_band: garment.siliconePasting === 'With Silicone',
            toe_option: 'Standard', 
            compression_class: garment.compression 
          }
        },
        measurements: measurements
      });

      setIsOrdering(false);
      alert('Order successfully submitted to production queue!');
      onComplete?.();
    } catch (err) {
      console.error('Order failed:', err);
      setIsOrdering(false);
      alert('Failed to submit order. Please check patient data.');
    }
  };

  const steps = [
    { id: 'patient-info', label: 'Registration', icon: User },
    { id: 'garment-select', label: 'Dr Notes', icon: FileText },
    { id: 'garment-type', label: 'Garment Type', icon: Layers },
    { id: 'measurement-drawing', label: 'Measurement Drawing', icon: Scissors },
    { id: 'review', label: 'Summary', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  return (
    <div className="p-4 sm:p-8 pb-32 animate-in fade-in duration-700 relative">
      {/* Dynamic Success/Info Alerts */}
      <AnimatePresence>
        {successNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] w-full max-w-sm sm:max-w-md px-4 pointer-events-none"
          >
            <div className={cn(
              "p-5 rounded-[2rem] border shadow-2xl backdrop-blur-md flex items-start gap-4 text-left pointer-events-auto",
              successNotification.type === 'success' 
                ? "bg-emerald-50/95 border-emerald-200/60 shadow-emerald-100/30 text-emerald-950" 
                : "bg-blue-50/95 border-blue-200/60 shadow-blue-100/30 text-blue-950"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                successNotification.type === 'success' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
              )}>
                {successNotification.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                ) : (
                  <FileText className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug sm:text-base">
                  {successNotification.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 font-bold mt-1 leading-relaxed">
                  {successNotification.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                    System Auto-Dismissing...
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSuccessNotification(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-xl transition-all shrink-0 self-start"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STEPPER --- */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <button 
                onClick={() => {
                   // Allow jump back but not forward without completion (optional)
                   setActiveStep(step.id as StepId);
                }}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all z-10",
                  activeStep === step.id 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-100 scale-110" 
                    : idx < currentStepIndex 
                      ? "bg-emerald-500 text-white" 
                      : "bg-slate-100 text-slate-400"
                )}
              >
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-3 text-center hidden md:block max-w-[80px] break-words",
                activeStep === step.id ? "text-blue-600" : "text-slate-400"
              )}>
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "absolute h-[2px] w-full top-5 sm:top-6 left-1/2 transition-all duration-500",
                  idx < currentStepIndex ? "bg-emerald-500" : "bg-slate-100"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* --- MAIN FORM --- */}
        <div className="lg:col-span-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="medical-card p-4 sm:p-6 md:p-10 min-h-[500px]"
            >
              {/* STEP 1: PATIENT INFO */}
              {activeStep === 'patient-info' && (
                <div className="space-y-10">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Metadata Registration</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Foundational Clinical Data</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12" 
                          placeholder="Mehmood Khan"
                          value={patient.name}
                          onChange={(e) => handlePatientChange('name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Handset</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12" 
                          placeholder="+92 3XX XXXXXXX"
                          value={patient.phone}
                          onChange={(e) => handlePatientChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Domicile Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                        <textarea 
                          className="medical-input pl-12 pt-4 h-24 resize-none" 
                          placeholder="Street, Sector, City..."
                          value={patient.address}
                          onChange={(e) => handlePatientChange('address', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referring Consultant</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12" 
                          placeholder="Dr. Ahmed"
                          value={patient.doctorRef}
                          onChange={(e) => handlePatientChange('doctorRef', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Institution</label>
                      <div className="relative">
                        <Hospital className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12" 
                          placeholder="Mughal Hospital"
                          value={patient.hospitalName}
                          onChange={(e) => handlePatientChange('hospitalName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="date"
                          className="medical-input pl-12" 
                          value={patient.date}
                          onChange={(e) => handlePatientChange('date', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender / جنس</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <select
                          className="medical-input pl-12 appearance-none bg-white font-bold"
                          value={patient.gender}
                          onChange={(e) => handlePatientChange('gender', e.target.value)}
                        >
                          <option value="male">Male (مرد)</option>
                          <option value="female">Female (عورت)</option>
                          <option value="other">Other (دیگر)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age / عمر</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="number"
                          className="medical-input pl-12 font-bold" 
                          placeholder="e.g. 45"
                          min="0"
                          max="120"
                          value={patient.age || ''}
                          onChange={(e) => handlePatientChange('age', e.target.value ? Number(e.target.value) : '')}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City / شہر</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12 font-bold" 
                          placeholder="e.g. Karachi"
                          value={patient.city || ''}
                          onChange={(e) => handlePatientChange('city', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Patient ID</label>
                      <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          className="medical-input pl-12 bg-slate-50 border-none cursor-not-allowed" 
                          readOnly
                          value={patient.patientId}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Option: Clinical Photos Status Check */}
                  <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50/30 border-2 border-indigo-200/80 space-y-4 shadow-xl shadow-indigo-100/30 mt-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-200">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Clinical Photo Verification Checklist</h3>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none mt-1">Status: Mandatory Requirement Check</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-slate-800 block">
                        Has the patient successfully provided or taken their clinical photos of the affected contracture area? <span className="text-rose-600 font-extrabold text-sm">*</span>
                      </label>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Patient pictures of target burn/contracture are strictly required to compile 3D models before starting product fabrication.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setProvidedPhotos('yes');
                          setProvidedPhotosError(null);
                        }}
                        className={cn(
                          "flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border-2 flex items-center justify-center gap-3 cursor-pointer",
                          providedPhotos === 'yes'
                            ? "bg-emerald-600 border-emerald-700 text-white shadow-lg shadow-emerald-100"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", providedPhotos === 'yes' ? "border-white" : "border-slate-300")}>
                          {providedPhotos === 'yes' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        Yes, Photos Taken
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProvidedPhotos('no');
                          setProvidedPhotosError("Pehley patients ki pics lelen!");
                        }}
                        className={cn(
                          "flex-1 py-4 px-6 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border-2 flex items-center justify-center gap-3 cursor-pointer",
                          providedPhotos === 'no'
                            ? "bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-100"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", providedPhotos === 'no' ? "border-white" : "border-slate-300")}>
                          {providedPhotos === 'no' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        No, Pending Pics
                      </button>
                    </div>

                    {providedPhotos === 'no' && (
                      <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 mt-4 animate-bounce">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">Pehley patients ki pics lelen!</h4>
                          <p className="text-[10px] text-rose-600 font-extrabold mt-1">
                            Clinical photo upload of the target anatomical region is required before the clinical form can advance to the next step.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: DR NOTES */}
              {activeStep === 'garment-select' && (
                <div className="space-y-10">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dr Notes</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure Clinical & Compression Characteristics</p>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Silicone Selection */}
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Silicone Selection
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: 'With Silicone', label: 'With Silicone' },
                          { value: 'Without Silicone', label: 'Without Silicone' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGarment(prev => ({ ...prev, siliconePasting: opt.value as any }))}
                            className={cn(
                              "flex items-center justify-center p-5 rounded-2xl border-2 transition-all font-bold text-center",
                              garment.siliconePasting === opt.value
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-sm">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Compression Selection */}
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Compression
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'Low', label: 'Low', desc: 'Mild' },
                          { value: 'Moderate', label: 'Moderate', desc: 'Optimal' },
                          { value: 'High', label: 'High', desc: 'Firm' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setGarment(prev => ({ ...prev, compression: opt.value as any }))}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center",
                              garment.compression === opt.value
                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-102"
                                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-sm font-black">{opt.label}</span>
                            <span className={cn(
                              "text-[9px] font-medium opacity-70 mt-1",
                              garment.compression === opt.value ? "text-blue-100" : "text-slate-400"
                            )}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Doctor's Notes Textarea with 500-word limit */}
                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Doctor's Notes / Case History
                        </label>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg",
                          countWords(patient.notes || '') > 450 
                            ? "bg-rose-50 text-rose-600" 
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {countWords(patient.notes || '')} / 500 words
                        </span>
                      </div>
                      <div className="relative">
                        <textarea
                          className="w-full min-h-[140px] p-5 rounded-2xl border-2 border-slate-100 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-sm leading-relaxed"
                          placeholder="Write down any patient specific clinical notes, injury background, scar-tissue details, skin fragility, or assessment notes..."
                          value={patient.notes || ''}
                          onChange={(e) => handleNotesChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                      <div className="flex gap-4">
                        <Activity className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">Clinical Selection Summary</h5>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
                            Selections configured for improved custom scar management and therapeutic pressure.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CLINICAL GARMENT */}
              {activeStep === 'garment-type' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-300">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Garment Spec</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configure Custom Bio-Medical Garment Type</p>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-8">
                    {/* Clinical Garment Type Selection */}
                    <div className="space-y-4">
                      <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Clinical Garment Type
                      </label>
                      <select
                        value={garment.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setGarment(prev => ({ 
                            ...prev, 
                            type: newType,
                            subOptions: {} // Reset sub-options on change so they are clean
                          }));
                        }}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all shadow-sm"
                      >
                        <option value="Face Mask & Chin Binder">Face Mask & Chin Binder</option>
                        <option value="Connecting Sleeves/Arm Sleeve">Connecting Sleeves/Arm Sleeve</option>
                        <option value="All Jacket">All Jacket</option>
                        <option value="All Gloves/Glove With Sleeve">All Gloves/Glove With Sleeve</option>
                        <option value="Belly Binder">Belly Binder</option>
                        <option value="All Trouser">All Trouser</option>
                        <option value="All Leg Sleeves">All Leg Sleeves</option>
                        <option value="All Socks">All Socks</option>
                      </select>
                    </div>

                    {/* Dynamic sub-options based on garment type selection in high-contrast grid */}
                    {GARMENT_FIELDS[garment.type] && (
                      <div className="mt-8 space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 text-blue-600">
                            {garment.type} Specifications
                          </h4>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                            Provide precise custom measurements/details for the following parameters
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {GARMENT_FIELDS[garment.type].map(opt => (
                            <div key={opt.id} className="bg-white p-5 rounded-2xl border-2 border-slate-50 shadow-sm hover:border-blue-200 transition-all">
                              <span className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-2">{opt.label}</span>
                              <input
                                type="text"
                                placeholder={opt.placeholder}
                                value={garment.subOptions?.[opt.label] || ''}
                                onChange={(e) => setGarment(prev => ({
                                  ...prev,
                                  subOptions: {
                                    ...prev.subOptions,
                                    [opt.label]: e.target.value
                                  }
                                }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3.5: MEASUREMENT DRAWING */}
              {activeStep === 'measurement-drawing' && (
                <div className="space-y-10 animate-in fade-in duration-300">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Anatomical Measurement Drawing</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 text-blue-600 font-black">Interactive Vector Blueprint Calibration</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Input Panel */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold">ACTIVE DESIGN SPECIFICATIONS</span>
                        <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">{garment.type}</h3>
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                          Verify and fine-tune each coordinate below. The blueprint on the right is fully reactive and displays your physical measurements with live visual overlay calibration tags in real-time.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {(GARMENT_FIELDS[garment.type] || []).map(opt => (
                          <div key={opt.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm focus-within:border-blue-500 hover:border-blue-100 transition-all flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{opt.label}</span>
                              <input
                                type="text"
                                placeholder={opt.placeholder}
                                value={garment.subOptions?.[opt.label] || ''}
                                onChange={(e) => setGarment(prev => ({
                                  ...prev,
                                  subOptions: {
                                    ...prev.subOptions,
                                    [opt.label]: e.target.value
                                  }
                                }))}
                                className="w-full bg-transparent border-none p-0 text-base font-black text-slate-900 focus:ring-0 placeholder:text-slate-200 outline-none"
                              />
                            </div>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-wider">
                              {garment.subOptions?.[opt.label] ? `${garment.subOptions[opt.label]}` : 'PENDING'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Live Vector Illustration Panel */}
                    <div className="lg:col-span-7 flex flex-col items-center animate-in zoom-in-95 duration-500">
                      <div className="w-full bg-white border-2 border-slate-100 rounded-[3rem] p-8 shadow-xl flex flex-col items-center justify-center relative min-h-[400px]">
                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl">
                          <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">LIVE BLUEPRINT CALIBRATION</span>
                        </div>

                        <div className="w-full max-w-[320px] aspect-square flex items-center justify-center p-4">
                          {renderMeasurementDrawingSvg()}
                        </div>

                        <div className="mt-6 text-center">
                          <p className="text-xs font-black text-slate-950 uppercase tracking-wide">
                            Reactive Calibration Graph
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            Calculated relative measurements mapping for production line
                          </p>
                        </div>

                        {/* Live Measurement Ledger Board */}
                        <div className="w-full mt-6 border-t border-slate-100 pt-6">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center mb-4">SPECIFICATION MATRIX SUMMARY</span>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {(GARMENT_FIELDS[garment.type] || []).map(opt => {
                              const rawVal = garment.subOptions?.[opt.label];
                              const cleanedVal = rawVal ? rawVal.toString().replace(/\s*cm\s*$/gi, '') : '';
                              const hasValue = cleanedVal.trim().length > 0;
                              return (
                                <div key={opt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{opt.label}</span>
                                  <span className={`text-xs font-black ${hasValue ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {hasValue ? `${cleanedVal} cm` : '—'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PHOTO UPLOAD */}
              {activeStep === 'photos' && (
                <div className="space-y-10">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Visual Clinical Records</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">High-Resolution Reference Documentation</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-blue-100 transition-all"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all shadow-sm">
                      <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-600" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Drop Patient Photos</h4>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Captures burn area & visual condition</p>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {photos.map((url, i) => (
                        <div key={i} className="group relative aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white">
                          <img src={url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPhotos(prev => prev.filter((_, idx) => idx !== i));
                              }}
                              className="w-10 h-10 bg-red-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SMART MEASUREMENTS */}
              {activeStep === 'measurements' && (
                <div className="space-y-10">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Bio-Matrix Measurements</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 text-blue-600 font-black">Live Diagram Plotting Enabled</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Measurement Points</label>
                        <button 
                          onClick={handleAIAnalysis}
                          disabled={isAnalyzing || photos.length === 0}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            isAICleanActive 
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                              : "bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 disabled:opacity-50"
                          )}
                        >
                          {isAnalyzing ? (
                             <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {isAnalyzing ? 'Refining...' : (isAICleanActive ? 'AI Analysis Finished' : 'AI Scan & Refine')}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {measurements.map(m => (
                          <div key={m.id} className={cn(
                            "group flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border-2 transition-all",
                            activeMeasuringId === m.id ? "border-blue-600 bg-blue-50 shadow-blue-100 shadow-lg" : "border-transparent focus-within:border-blue-100 focus-within:bg-white focus-within:shadow-xl"
                          )}>
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-[9px] text-slate-400 uppercase tracking-widest shrink-0">
                              {m.id.substring(0, 2)}
                            </div>
                            <div className="flex-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{m.label}</label>
                              <div className="relative mt-1">
                                <input 
                                  type="number"
                                  className="w-full bg-transparent border-none p-0 text-base font-black text-slate-900 focus:ring-0 placeholder:text-slate-200"
                                  placeholder="0.0"
                                  value={m.value}
                                  onChange={(e) => handleValueChange(m.id, e.target.value)}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600">CM</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                if (activeMeasuringId === m.id) {
                                  setActiveMeasuringId(null);
                                  setClickCount(0);
                                } else {
                                  setActiveMeasuringId(m.id);
                                  setClickCount(0);
                                }
                              }}
                              className={cn(
                                "p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2",
                                activeMeasuringId === m.id 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-white text-blue-600 hover:bg-blue-50"
                              )}
                              title="Measure on Image"
                            >
                              <Ruler className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase whitespace-nowrap">
                                {activeMeasuringId === m.id ? 'Cancel' : 'Measure on Image'}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sticky top-0">
                      <SmartDiagram 
                        measurements={measurements} 
                        garmentType={garment.type} 
                        imageUrl={photos.length > 0 ? photos[photos.length - 1] : undefined}
                        activeMeasuringId={activeMeasuringId}
                        isAICleanActive={isAICleanActive}
                        onPointSelect={handlePointSelect}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: FINAL REVIEW */}
              {activeStep === 'review' && (
                <div className="space-y-12">
                   <div className="border-l-4 border-emerald-500 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Verification</h2>
                    <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1">Ready for Generation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-blue-50 rounded-[2.5rem] space-y-6">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" /> Patient Info
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] font-black text-blue-300 uppercase">Identity</p>
                          <p className="text-sm font-black text-slate-900">{patient.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-blue-300 uppercase">Institution</p>
                          <p className="text-sm font-black text-slate-900">{patient.hospitalName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                      <div className="p-8 bg-purple-50 rounded-[2.5rem] space-y-6">
                      <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Dr Notes
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] font-black text-purple-300 uppercase">Garment Type</p>
                          <p className="text-sm font-black text-slate-900">{garment.type}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-purple-300 uppercase">Silicone</p>
                          <p className="text-sm font-black text-slate-900">{garment.siliconePasting}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-purple-300 uppercase">Compression</p>
                          <p className="text-sm font-black text-slate-900">{garment.compression}</p>
                        </div>
                        {garment.subOptions && Object.entries(garment.subOptions).filter(([_, v]) => v).length > 0 && (
                          <div className="pt-2 border-t border-purple-100 space-y-2">
                            <p className="text-[8px] font-black text-purple-400 uppercase">Custom Specs</p>
                            <div className="grid grid-cols-1 gap-1 text-[11px] font-bold text-slate-700">
                              {Object.entries(garment.subOptions).map(([key, val]) => val && (
                                <div key={key} className="flex justify-between bg-white/60 px-3 py-1.5 rounded-lg border border-purple-100/50">
                                  <span className="text-slate-500 font-bold uppercase text-[9px]">{key}</span>
                                  <span className="text-slate-900 font-extrabold">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 sm:p-8 bg-emerald-50 rounded-[2.5rem] space-y-4 sm:space-y-6">
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Specification Matrix
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[8px] font-black text-emerald-300 uppercase">Anatomical Parameters</p>
                          <p className="text-sm font-black text-slate-900">
                            {Object.values(garment.subOptions || {}).filter(Boolean).length} / {(GARMENT_FIELDS[garment.type] || []).length} Specified
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-emerald-300 uppercase">Status</p>
                          <p className="text-sm font-black text-emerald-600">Calibration Verified</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-8">
                    <button 
                      onClick={handleSaveAssessment}
                      disabled={isSavingAssessment}
                      className="btn-primary px-5 py-4 sm:px-10 sm:py-6 text-xs sm:text-base flex items-center justify-center gap-2 sm:gap-4 bg-indigo-600 shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto"
                    >
                      {isSavingAssessment ? (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                      )}
                      {isSavingAssessment ? 'SAVING...' : 'SAVE ASSESSMENT'}
                    </button>

                    <button 
                      onClick={handleSavePatient}
                      disabled={isSaving}
                      className="btn-primary px-5 py-4 sm:px-10 sm:py-6 text-xs sm:text-base flex items-center justify-center gap-2 sm:gap-4 bg-blue-600 shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 sm:w-6 sm:h-6" />
                      )}
                      {isSaving ? 'SAVING...' : 'SAVE PATIENT DATA'}
                    </button>

                    <button 
                      onClick={generatePDF}
                      disabled={isGenerating}
                      className="btn-primary px-5 py-4 sm:px-10 sm:py-6 text-xs sm:text-base flex items-center justify-center gap-2 sm:gap-4 bg-slate-900 shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto"
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 sm:w-6 sm:h-6" />
                      )}
                      {isGenerating ? 'GENERATING...' : 'DIRECT DOWNLOAD (PDF)'}
                    </button>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="mt-16 pt-10 border-t border-slate-50 flex items-center justify-between">
                <button 
                  disabled={currentStepIndex === 0}
                  onClick={() => setActiveStep(steps[currentStepIndex - 1].id as StepId)}
                  className="flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Phase
                </button>
                <button 
                  disabled={currentStepIndex === steps.length - 1}
                  onClick={() => {
                    if (activeStep === 'patient-info' && providedPhotos === 'no') {
                      setProvidedPhotosError("Pehley patients ki pics lelen!");
                      alert("Pehley patients ki pics lelen!");
                      return;
                    }
                    setActiveStep(steps[currentStepIndex + 1].id as StepId);
                  }}
                  className="btn-primary px-10 py-4 flex items-center gap-3 disabled:opacity-30"
                >
                  Continue Proceed
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --- HIDDEN PRINTABLE REPORT --- */}
      <div 
        className="fixed top-0 left-[200vw] pointer-events-none opacity-0"
        aria-hidden="true"
      >
        <div 
          ref={reportRef} 
          id="printable-report"
          className="bg-white pdf-safe-zone"
          style={{ width: '210mm', minHeight: '297mm' }}
        >
          <div className="p-10 space-y-12 bg-white pdf-safe-zone">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Clinical Report</h1>
              <div className="mt-4">
                <p className="text-blue-600 font-bold tracking-widest uppercase text-xs">Smart Measurement Technology</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-900">{patient.hospitalName}</p>
              <p className="text-xs font-bold text-slate-400">{patient.date}</p>
              <p className="text-xs font-black text-blue-600 mt-1">ID: {patient.patientId}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Patient Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Name</p><p className="font-black text-slate-900">{patient.name}</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Age</p><p className="font-black text-slate-900">{patient.age ? `${patient.age} years` : 'N/A'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Gender</p><p className="font-black text-slate-900 capitalize">{patient.gender || 'N/A'}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">City</p><p className="font-black text-slate-900 text-sm truncate">{patient.city || 'Karachi'}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p><p className="font-black text-slate-900">{patient.phone}</p></div>
                </div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Doctor</p><p className="font-black text-slate-900">{patient.doctorRef}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Address</p><p className="font-bold text-slate-700 text-xs leading-relaxed">{patient.address}</p></div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Dr Notes & Specifications</h3>
              <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Garment Type</p><p className="font-black text-slate-900 text-sm uppercase">{garment.type}</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Silicone Selection</p><p className="font-black text-blue-600 text-xs">{garment.siliconePasting}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Compression</p><p className="font-black text-emerald-600 uppercase text-xs">{garment.compression}</p></div>
                </div>
                
                {patient.notes ? (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Physician Notes</p>
                    <p className="text-xs font-bold text-slate-700 bg-white p-3 rounded-2xl border border-slate-100 mt-1 whitespace-pre-wrap break-words leading-relaxed max-h-[140px] overflow-y-auto font-mono">
                      {patient.notes}
                    </p>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Physician Notes</p>
                    <p className="text-xs text-slate-400 italic bg-white p-3 rounded-2xl border border-slate-100 mt-1">
                      No additional clinical notes recorded.
                    </p>
                  </div>
                )}

                {garment.subOptions && Object.entries(garment.subOptions).filter(([_, v]) => v).length > 0 && (
                  <div className="pt-3 border-t border-slate-200 mt-2 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Custom Specs</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(garment.subOptions).map(([key, val]) => val && (
                        <div key={key} className="bg-white p-2 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 block font-bold uppercase">{key}</span>
                          <span className="text-[10px] font-black text-slate-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Specification Mapping */}
          <div className="pt-12">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4 mb-8">Anatomical Blueprint Mapping</h3>
            <div className="grid grid-cols-2 gap-12 items-center">
              <div className="bg-slate-50 rounded-[3rem] p-8 border-2 border-slate-100 flex items-center justify-center max-w-[320px] aspect-square mx-auto">
                <div className="w-[240px] h-[240px] flex items-center justify-center">
                  {renderMeasurementDrawingSvg()}
                </div>
              </div>
              <div className="space-y-4">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="text-[10px] font-black uppercase text-slate-400 pb-4">Anatomical LandMark</th>
                      <th className="text-[10px] font-black uppercase text-blue-600 pb-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(garment.subOptions || {}).map(([key, value]) => value && (
                      <tr key={key} className="border-b border-slate-50">
                        <td className="py-3 text-sm font-black text-slate-700">{key}</td>
                        <td className="py-3 text-sm font-black text-slate-900 text-right">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-20 border-t border-slate-100 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Report Generated ON</p>
              <p className="text-sm font-black text-slate-900">{new Date().toLocaleString()}</p>
            </div>
            <div className="w-64 border-t-2 border-slate-900 pt-3 text-center">
              <p className="text-sm font-black text-slate-900 uppercase">{patient.doctorRef || 'Clinical Specialist'}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ClinicalAssessment;
