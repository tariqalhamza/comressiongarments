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
type StepId = 'garment-select' | 'garment-type' | 'measurement-drawing' | 'review';

export const GARMENT_FIELDS: Record<string, { id: string; label: string; placeholder: string }[]> = {
  'Face Mask & Chin Binder': [
    { id: 'around_neck', label: 'Around neck', placeholder: 'e.g., 38 cm' },
    { id: 'around_head', label: 'Around head', placeholder: 'e.g., 54 cm' },
    { id: 'around_chin', label: 'Around chin', placeholder: 'e.g., 32 cm' },
    { id: 'neck_length', label: 'Neck length', placeholder: 'e.g., 12 cm' }
  ],
  'Connecting Sleeves': [
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 42 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Right Hand': [
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Left Hand': [
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Wrist', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
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
    { id: 'total_len_medal_to_wrist', label: 'Total length middle finger to wrist', placeholder: 'e.g., 18 cm' },
    { id: 'thumb', label: 'Thumb', placeholder: 'e.g., 5.5 cm' },
    { id: 'thumb_width', label: 'Thumb width', placeholder: 'e.g., 2.2 cm' },
    { id: 'index_finger', label: 'Index finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'index_finger_width', label: 'Index finger width', placeholder: 'e.g., 2.0 cm' },
    { id: 'middle_finger', label: 'Middle finger', placeholder: 'e.g., 8 cm' },
    { id: 'middle_finger_width', label: 'Middle finger width', placeholder: 'e.g., 2.1 cm' },
    { id: 'ring_finger', label: 'Ring finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'ring_finger_width', label: 'Ring finger width', placeholder: 'e.g., 2.0 cm' },
    { id: 'little_finger', label: 'Little finger', placeholder: 'e.g., 6 cm' },
    { id: 'little_finger_width', label: 'Little finger width', placeholder: 'e.g., 1.8 cm' },
    { id: 'total_len_medal_to_scar', label: 'Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' }
  ],
  'Belly Binder': [
    { id: 'diaphrarm', label: 'Diaphrom', placeholder: 'e.g., 51 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 53 cm' },
    { id: 'waist', label: 'West (Waist)', placeholder: 'e.g., 54 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 58 cm' },
    { id: 'open_end_thigh', label: 'Open End', placeholder: 'e.g., 35 cm' },
    { id: 'close_end_thigh', label: 'Close End (Leg end)', placeholder: 'e.g., 25 cm' },
    { id: 'len_diaphragm_to_waist', label: 'Length Diaphrom to West', placeholder: 'e.g., 18 cm' },
    { id: 'len_waist_to_close_end', label: 'Short Length', placeholder: 'e.g., 44 cm' }
  ],
  'All Trouser': [
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 38.5 in / 98 cm' },
    { id: 'waist', label: 'West (Waist)', placeholder: 'e.g., 38.5 in / 98 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 41 in / 104 cm' },
    { id: 'crotch_round', label: 'Round (Crotch)', placeholder: 'e.g., 28 in / 71 cm' },
    { id: 'thigh_1', label: 'Thigh I', placeholder: 'e.g., 22 in / 56 cm' },
    { id: 'thigh_2', label: 'Thigh II', placeholder: 'e.g., 21.5 in / 55 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 16.5 in / 42 cm' },
    { id: 'calf', label: 'Calf', placeholder: 'e.g., 15.5 in / 39 cm' },
    { id: 'bottom_leg_end', label: 'Bottom', placeholder: 'e.g., 9.5 in / 24 cm' },
    { id: 'crotch_depth', label: 'Crotch Depth', placeholder: 'e.g., 11.5 in / 29 cm' },
    { id: 'inside_length', label: 'Inseam (Inside Length)', placeholder: 'e.g., 28 in / 71 cm' },
    { id: 'total_length', label: 'Total Length', placeholder: 'e.g., 36 in / 91 cm' }
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
  const [activeStep, setActiveStep] = useState<StepId>('garment-select');
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
    subOptions: { 'Hand Selection': 'Right Hand Glove' }
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
      let val = garment.subOptions?.[label];
      
      // Fallback mappings for backwards compatibility
      if (!val) {
        if (label === 'Middle finger') val = garment.subOptions?.['Medal finger'];
        else if (label === 'Index finger') val = garment.subOptions?.['Left finger'];
        else if (label === 'Ring finger') val = garment.subOptions?.['Right finger'];
        else if (label === 'Little finger') val = garment.subOptions?.['Small finger'];
        else if (label === 'Total length middle finger to wrist') val = garment.subOptions?.['Total length medal finger to wrist'];
        else if (label === 'Total length middle finger to end of scar') val = garment.subOptions?.['Total length medal finger to end of scar'];
        // Belly Binder mappings
        else if (label === 'Diaphrom' || label === 'Diaphrarm') val = garment.subOptions?.['Diaphrom'] || garment.subOptions?.['Diaphrarm'] || garment.subOptions?.['Belly'];
        else if (label === 'West (Waist)' || label === 'Waist' || label === 'West') val = garment.subOptions?.['West (Waist)'] || garment.subOptions?.['Waist'] || garment.subOptions?.['West'] || garment.subOptions?.['waist'] || garment.subOptions?.['waist'];
        else if (label === 'Open End' || label === 'Open end thigh') val = garment.subOptions?.['Open End'] || garment.subOptions?.['Open end thigh'];
        else if (label === 'Close End (Leg end)' || label === 'Close end thigh') val = garment.subOptions?.['Close End (Leg end)'] || garment.subOptions?.['Close end thigh'];
        else if (label === 'Length Diaphrom to West' || label === 'length diaphragm to waist') val = garment.subOptions?.['Length Diaphrom to West'] || garment.subOptions?.['length diaphragm to waist'];
        else if (label === 'Short Length' || label === 'Length waist to close end') val = garment.subOptions?.['Short Length'] || garment.subOptions?.['Length waist to close end'];
        // All Trouser backwards compatibility fallbacks
        else if (label === 'Belly') val = garment.subOptions?.['Belly'] || garment.subOptions?.['Diaphrarm'] || garment.subOptions?.['Diaphrom'] || garment.subOptions?.['diaphrarm'];
        else if (label === 'Hips') val = garment.subOptions?.['Hips'] || garment.subOptions?.['hips'];
        else if (label === 'Round (Crotch)' || label === 'Round') val = garment.subOptions?.['Round (Crotch)'] || garment.subOptions?.['Round'] || garment.subOptions?.['Open end thigh'] || garment.subOptions?.['open_end_thigh'];
        else if (label === 'Thigh I') val = garment.subOptions?.['Thigh I'] || garment.subOptions?.['Close end thigh'] || garment.subOptions?.['close_end_thigh'];
        else if (label === 'Thigh II') val = garment.subOptions?.['Thigh II'];
        else if (label === 'Knee') val = garment.subOptions?.['Knee'] || garment.subOptions?.['knee'];
        else if (label === 'Calf') val = garment.subOptions?.['Calf'] || garment.subOptions?.['calf'];
        else if (label === 'Bottom') val = garment.subOptions?.['Bottom'] || garment.subOptions?.['Ankle'] || garment.subOptions?.['ankle'];
        else if (label === 'Crotch Depth') val = garment.subOptions?.['Crotch Depth'] || garment.subOptions?.['length diaphragm to waist'] || garment.subOptions?.['len_diaphragm_to_waist'];
        else if (label === 'Inseam (Inside Length)' || label === 'Inseam') val = garment.subOptions?.['Inseam (Inside Length)'] || garment.subOptions?.['Inseam'] || garment.subOptions?.['inside_length'];
        else if (label === 'Total Length') val = garment.subOptions?.['Total Length'] || garment.subOptions?.['Length waist to ankle'] || garment.subOptions?.['len_waist_to_ankle'] || garment.subOptions?.['total_length'];
      }

      if (!val) return '—';
      const clean = val.toString().trim();
      if (!clean) return '—';
      if (clean.toLowerCase().endsWith('cm')) return clean;
      return `${clean} cm`;
    };

    switch (garment.type) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[320px]" style={{ minHeight: '260px' }}>
            <defs>
              <marker id="arrow-blue-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-emerald-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-rose-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
              </marker>
            </defs>

            {/* Outer Ellipse Head Outline - Blue styled */}
            <ellipse cx="150" cy="155" rx="72" ry="92" fill="#f0f7ff" stroke="#3b82f6" strokeWidth="2.5" />

            {/* Inner Face Opening (dashed, showing eyes and facial features inside) */}
            <ellipse cx="150" cy="160" rx="46" ry="62" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Eyes and Nose indicators */}
            <line x1="134" y1="145" x2="142" y2="145" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="158" y1="145" x2="166" y2="145" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <path d="M150,152 L150,165 L146,165" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Forehead/Head Strap (Horizontal band that wraps and extends beyond the head left and right, identical to the pencil sketch) */}
            <path d="M62,110 Q150,95 238,110 L236,124 Q150,111 64,124 Z" fill="#bfdbfe" fillOpacity="0.70" stroke="#2563eb" strokeWidth="2" />

            {/* Chin Strap Wrap (represented as a vertical/diagonal chin strap outline) */}
            <path d="M98,140 Q150,252 202,140" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="4 4" />

            {/* Vertical alignment / measurement line exactly through the center (with arrowheads representing crown-to-chin height) */}
            <line x1="150" y1="102" x2="150" y2="218" stroke="#10b981" strokeWidth="2.5" markerStart="url(#arrow-emerald-cl)" markerEnd="url(#arrow-emerald-cl)" />

            {/* Neck area at the bottom */}
            <path d="M125,245 Q150,255 175,245 L175,270 Q150,280 125,270 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="150" y1="242" x2="150" y2="273" stroke="#dc2626" strokeWidth="2.5" markerStart="url(#arrow-rose-cl)" markerEnd="url(#arrow-rose-cl)" />

            {/* Dimension value text tags matching the color guidelines */}
            {/* 1. Around Head (Forehead Strap) */}
            <g transform="translate(150, 60)" className="text-[10px] font-black text-blue-600">
              <rect x="-60" y="-8" width="120" height="16" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>

            {/* 2. Around Chin */}
            <g transform="translate(50, 195)" className="text-[10px] font-black text-emerald-600">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>

            {/* 3. Around Neck */}
            <g transform="translate(250, 195)" className="text-[10px] font-black text-amber-600">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>

            {/* 4. Neck Length */}
            <g transform="translate(150, 305)" className="text-[10px] font-black text-rose-600">
              <rect x="-55" y="-8" width="110" height="16" rx="4" fill="white" stroke="#dc2626" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-rose-700 font-bold" fontSize="9">Neck Len: {formatVal('Neck length')}</text>
            </g>
          </svg>
        );

      case 'Connecting Sleeves':
      case 'Connecting Sleeves/Arm Sleeve':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Torso Back View Background */}
            <ellipse cx="150" cy="45" rx="16" ry="20" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 142,60 L 142,85 C 145,88 155,88 158,85 L 158,60 Z" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 130,85 C 95,90 70,105 60,115 L 75,280 L 225,280 L 240,115 C 230,105 205,90 170,85 Z" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />

            {/* Bolero garment outline (collar scoop, sleeves, back connector band) */}
            <path 
              d="M 120,90 C 130,105 170,105 180,90 C 210,95 225,103 235,115 C 248,155 258,205 252,260 L 238,258 C 232,205 218,155 205,145 C 180,132 120,132 95,145 C 82,155 68,205 62,258 L 48,260 C 42,205 52,155 65,115 C 75,103 90,95 120,90 Z" 
              fill="#eff6ff" 
              fillOpacity="0.85"
              stroke="#2563eb" 
              strokeWidth="2" 
            />

            {/* Measurement lines */}
            {/* 1. Shoulder indicator */}
            <line x1="65" y1="115" x2="235" y2="115" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="65" cy="115" r="3.5" fill="#2563eb" />
            <circle cx="235" cy="115" r="3.5" fill="#2563eb" />

            {/* 2. Arm Pit loop on left sleeve */}
            <ellipse cx="79" cy="131" rx="15" ry="5" transform="rotate(-40, 79, 131)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 3. Elbow loop on left sleeve */}
            <ellipse cx="66" cy="182" rx="11" ry="4" transform="rotate(-40, 66, 182)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 4. Wrist loop on left sleeve */}
            <ellipse cx="55" cy="259" rx="8" ry="3" transform="rotate(-40, 55, 259)" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 5. Total arm length path along left sleeve-edge */}
            <path d="M 65,115 Q 52,185 48,260" stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="3 3" fill="none" />

            {/* Labels overlay */}
            <g transform="translate(150, 65)" className="text-[9px] font-bold">
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(150, 155)" className="text-[9px] font-bold">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(132, 122)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(122, 185)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(112, 255)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-bold" fontSize="9">Wrist: {formatVal('Wrist')}</text>
            </g>
          </svg>
        );

      case 'Arm sleeve Right Hand':
      case 'Arm sleeve Left Hand':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Cylinder sleeve body */}
            <polygon points="190,85 78,175 102,205 230,135" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />

            {/* Upper arm opening (Arm pit) */}
            <ellipse cx="210" cy="110" rx="26" ry="12" transform="rotate(56, 210, 110)" fill="#eff6ff" stroke="#10b981" strokeWidth="2" />

            {/* Elbow loop */}
            <ellipse cx="149" cy="148" rx="20" ry="10" transform="rotate(56, 149, 148)" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />

            {/* Wrist opening (Wrist loop) */}
            <ellipse cx="90" cy="190" rx="16" ry="8" transform="rotate(56, 90, 190)" fill="#dbeafe" stroke="#ec4899" strokeWidth="2" />

            {/* Total length parallel arrow indicator */}
            <line x1="175" y1="75" x2="55" y2="155" stroke="#7c3aed" strokeWidth="2" />
            
            {/* Arrowhead top-right */}
            <path d="M 163,77 L 175,75 L 173,87" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Arrowhead bottom-left */}
            <path d="M 67,153 L 55,155 L 57,143" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Labels overlay */}
            <g transform="translate(100, 95)" className="text-[9px] font-bold">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(245, 100)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(185, 175)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(75, 235)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-bold" fontSize="9">Wrist: {formatVal('Wrist')}</text>
            </g>
          </svg>
        );

      case 'All Jacket':
        return (
          <svg viewBox="0 0 320 320" className="w-full h-full max-h-[320px]" style={{ minHeight: '260px' }}>
            {/* Outline Jacket matching the precise handwritten design */}
            {/* Combined smooth polygon for body and sleeves to make it a seamless filled cloth illustration */}
            <path d="M 134,80 Q 150,86 166,80 L 200,80 L 250,140 L 280,195 L 268,201 L 238,148 L 195,115 L 195,245 L 105,245 L 105,115 L 62,148 L 32,201 L 20,195 L 50,140 L 100,80 Z" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />

            {/* Neck sleeve collar indicator loop */}
            <ellipse cx="150" cy="79" rx="16" ry="5" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />

            {/* Horizontal Guide lines across jacket body for Chest, Diapharm, Belly, Waist */}
            <line x1="105" y1="125" x2="195" y2="125" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="158" x2="195" y2="158" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="191" x2="195" y2="191" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="224" x2="195" y2="224" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Vertical Total Length double arrow Indicator on left margin of body */}
            <line x1="93" y1="80" x2="93" y2="245" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M 89,87 L 93,80 L 97,87" stroke="#4f46e5" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 89,238 L 93,245 L 97,238" stroke="#4f46e5" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Shoulder L-to-R double arrow indicator above top seam */}
            <line x1="100" y1="65" x2="200" y2="65" stroke="#7c3aed" strokeWidth="1.5" />
            <path d="M 107,61 L 100,65 L 107,69" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 193,61 L 200,65 L 193,69" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* LEFT SLEEVE MEASUREMENTS (Viewer's Left): Arm Pit, Arm Open, Elbow, Arm Close */}
            {/* Loops on sleeve */}
            <ellipse cx="102" cy="100" rx="14" ry="5.5" transform="rotate(-50, 102, 100)" fill="none" stroke="#2563eb" strokeWidth="1.5" />
            <ellipse cx="88" cy="115" rx="13" ry="5" transform="rotate(-50, 88, 115)" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
            <ellipse cx="56" cy="144" rx="12" ry="4.5" transform="rotate(-50, 56, 144)" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
            <ellipse cx="25" cy="198" rx="10" ry="4" transform="rotate(-50, 25, 198)" fill="#dbeafe" stroke="#ec4899" strokeWidth="1.5" />

            {/* RIGHT SLEEVE MEASUREMENTS (Viewer's Right): Arm total length parallel arrow */}
            <line x1="210" y1="67" x2="293" y2="183" stroke="#8b5cf6" strokeWidth="1.5" />
            <path d="M 218,65 L 210,67 L 216,75" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 287,175 L 293,183 L 285,185" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Overlays / Badges matching exactly the handwritten sketch positions */}
            <g transform="translate(150, 22)" className="text-[8px] font-bold">
              <rect x="-60" y="-6.5" width="120" height="13" rx="2" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Neck Around: {formatVal('Neck around')}</text>
            </g>
            <g transform="translate(150, 39)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#dc2626" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-red-700 font-bold" fontSize="8">Neck Len: {formatVal('Neck length')}</text>
            </g>
            <g transform="translate(150, 56)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-700 font-bold" fontSize="8">Shoulder: {formatVal('Shoulder')}</text>
            </g>

            {/* Torso horizontal levels: Chest, Diapharm, Belly, Waist */}
            <g transform="translate(150, 125)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="8">Chest: {formatVal('Chest')}</text>
            </g>
            <g transform="translate(150, 158)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Diapharm: {formatVal('Diapharm')}</text>
            </g>
            <g transform="translate(150, 191)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>
            <g transform="translate(150, 224)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#e11d48" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-rose-600 font-bold" fontSize="8">Waist: {formatVal('Waist')}</text>
            </g>
            <g transform="translate(150, 262)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.2" width="110" height="13" rx="2" fill="white" stroke="#4f46e5" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-indigo-600 font-bold" fontSize="8">Total Length: {formatVal('Total length')}</text>
            </g>

            {/* Left sleeve loops overlays */}
            <g transform="translate(38, 93)" className="text-[7.5px] font-bold">
              <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-blue-700 font-bold" fontSize="7.5">Arm Pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(32, 114)" className="text-[7.5px] font-bold">
              <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#06b6d4" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-cyan-700 font-bold" fontSize="7.5">Arm Open: {formatVal('Arm open end')}</text>
            </g>
            <g transform="translate(30, 142)" className="text-[7.5px] font-bold">
              <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#d97706" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-amber-700 font-bold" fontSize="7.5">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(42, 230)" className="text-[7.5px] font-bold">
              <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-pink-700 font-bold" fontSize="7.5">Wrist: {formatVal('Arm close end')}</text>
            </g>

            {/* Right sleeve arm length overlay badge */}
            <g transform="translate(265, 128)" className="text-[7.5px] font-bold">
              <rect x="-55" y="-5.5" width="110" height="11" rx="1.5" fill="white" stroke="#8b5cf6" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-violet-700 font-bold" fontSize="7.5">Arm Length: {formatVal('Arm total length')}</text>
            </g>
          </svg>
        );

      case 'All Gloves/Glove With Sleeve':
        const handSelectionVal = garment.subOptions?.[ 'Hand Selection' ] || 'Right Hand Glove';
        const isLeftHand = handSelectionVal === 'Left Hand Glove';
        const xThumb = isLeftHand ? 277 : 43;
        const xLeftFinger = isLeftHand ? 209 : 111;
        const xMiddleFinger = isLeftHand ? 172 : 148;
        const xRightFinger = isLeftHand ? 139 : 181;
        const xSmallFinger = isLeftHand ? 110 : 210;

        return (
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]" style={{ minHeight: '300px' }}>
            <defs>
              <marker id="arrow-blue-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-emerald-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
              </marker>
              <marker id="arrow-purple-cl" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
              </marker>
            </defs>

            {/* Hand Selection Badge Indicator */}
            <g transform="translate(160, 18)">
              <rect x="-70" y="-10" width="140" height="20" rx="10" fill="#1e293b" />
              <text y="3" textAnchor="middle" className="fill-white font-extrabold text-[9px]" letterSpacing="0.5">
                {handSelectionVal.toUpperCase()}
              </text>
            </g>

            {/* Flipped group for hand outline if Left Hand Glove is selected */}
            <g transform={isLeftHand ? "translate(320, 0) scale(-1, 1)" : ""}>
              {/* Detailed Outline Glove (Spread Hand + Sleeve) */}
              <path 
                d="M 115,360 C 115,330 111,290 111,265 C 111,245 90,230 85,215 C 75,195 45,190 35,178 C 22,166 32,150 48,158 C 68,168 85,172 98,178 L 102,90 Q 112,70 122,90 L 125,152 Q 128,156 131,152 L 138,58 Q 148,38 158,58 L 159,152 Q 162,156 165,152 L 171,70 Q 181,50 191,70 L 191,155 Q 194,159 197,155 L 202,102 Q 210,88 218,102 C 221,142 216,245 199,275 C 197,300 195,330 195,360 Q 155,370 115,360 Z" 
                fill="#f8fafc" 
                stroke="#1e293b" 
                strokeWidth="2.5" 
                strokeLinejoin="round" 
                strokeLinecap="round" 
              />
              
              {/* Internal Circumference lines at measurement joints */}
              {/* 1. Palm */}
              <path d="M 100,215 Q 150,220 200,215" stroke="#2563eb" strokeWidth="2.5" fill="none" />
              {/* 2. Wrist */}
              <path d="M 112,285 Q 155,288 198,285" stroke="#10b981" strokeWidth="2.5" fill="none" />
              {/* 3. Bottom Sleeve */}
              <path d="M 115,360 Q 155,363 195,360" stroke="#7c3aed" strokeWidth="2" fill="none" strokeDasharray="3 1" />

              {/* Finger Joint Lines (Bands across spread fingers - 3D loop style) */}
              {/* Middle finger loop */}
              <path d="M 137,100 Q 145,103 153,100" stroke="#4f46e5" strokeWidth="2.5" fill="none" />
              <path d="M 137,100 Q 145,97 153,100" stroke="#4f46e5" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

              {/* Index finger loop */}
              <path d="M 104,120 Q 111,123 118,120" stroke="#0891b2" strokeWidth="2.5" fill="none" />
              <path d="M 104,120 Q 111,117 118,120" stroke="#0891b2" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

              {/* Ring finger loop */}
              <path d="M 169,110 Q 177,113 185,110" stroke="#059669" strokeWidth="2.5" fill="none" />
              <path d="M 169,110 Q 177,107 185,110" stroke="#059669" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

              {/* Little finger loop */}
              <path d="M 199,132 Q 206,134 213,132" stroke="#db2777" strokeWidth="2.5" fill="none" />
              <path d="M 199,132 Q 206,130 213,132" stroke="#db2777" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

              {/* Thumb loop */}
              <path d="M 33,171 Q 43,165 52,154" stroke="#ea580c" strokeWidth="2.5" fill="none" />
              <path d="M 33,171 Q 41,176 52,154" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />
            </g>

            {/* vertical side measurement rulers */}
            {/* Height Line 1: Finger-to-wrist (Left Margin) */}
            <line x1="35" y1="48" x2="148" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="35" y1="275" x2="111" y2="275" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="35" y1="48" x2="35" y2="275" stroke="#d97706" strokeWidth="1.5" markerStart="url(#arrow-amber-cl)" markerEnd="url(#arrow-amber-cl)" />

            {/* Height Line 2: Finger-to-scar-end (Right Margin) */}
            <line x1="180" y1="48" x2="285" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="195" y1="360" x2="285" y2="360" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="285" y1="48" x2="285" y2="360" stroke="#7c3aed" strokeWidth="1.5" markerStart="url(#arrow-purple-cl)" markerEnd="url(#arrow-purple-cl)" />

            {/* Readable Badges Overlay (Outside Flipped Group to Prevent text mirroring) */}
            {/* 1. Palm */}
            <g transform="translate(155, 245)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="8">Palm: {formatVal('Palm')}</text>
            </g>

            {/* 2. Wrist */}
            <g transform="translate(155, 312)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Wrist: {formatVal('Wrist')}</text>
            </g>

            {/* 3. Thumb */}
            <g transform={`translate(${xThumb}, 195)`} className="text-[8px] font-bold">
              <rect x="-56" y="-7" width="112" height="14" rx="3" fill="white" stroke="#ea580c" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Thumb: {formatVal('Thumb')} | W: {formatVal('Thumb width')}</text>
            </g>

            {/* 4. Index Finger / Left */}
            <g transform={`translate(${xLeftFinger}, 100)`} className="text-[8px] font-bold">
              <rect x="-58" y="-7" width="116" height="14" rx="3" fill="white" stroke="#0891b2" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="8">Index: {formatVal('Index finger')} | W: {formatVal('Index finger width')}</text>
            </g>
            
            {/* 5. Middle Finger / Medal */}
            <g transform={`translate(${xMiddleFinger}, 62)`} className="text-[8px] font-bold">
              <rect x="-60" y="-7" width="120" height="14" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-indigo-600 font-extrabold" fontSize="8">Middle: {formatVal('Middle finger')} | W: {formatVal('Middle finger width')}</text>
            </g>

            {/* 6. Ring Finger / Right */}
            <g transform={`translate(${xRightFinger}, 105)`} className="text-[8px] font-bold">
              <rect x="-58" y="-7" width="116" height="14" rx="3" fill="white" stroke="#059669" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Ring: {formatVal('Ring finger')} | W: {formatVal('Ring finger width')}</text>
            </g>

            {/* 7. Small Finger */}
            <g transform={`translate(${xSmallFinger}, 145)`} className="text-[8px] font-bold">
              <rect x="-56" y="-7" width="112" height="14" rx="3" fill="white" stroke="#db2777" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="8">Little: {formatVal('Little finger')} | W: {formatVal('Little finger width')}</text>
            </g>

            {/* 8. Total Length (Finger to Wrist) Left Margin Badge */}
            <g transform="translate(35, 166)" className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#d97706" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="8">To Wrist</text>
              <text y="8" textAnchor="middle" className="fill-amber-700 font-black" fontSize="8">{formatVal('Total length middle finger to wrist')}</text>
            </g>

            {/* 9. Total Length (Finger to Scar) Right Margin Badge */}
            <g transform="translate(285, 204)" className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="8">To Scar</text>
              <text y="8" textAnchor="middle" className="fill-purple-700 font-black" fontSize="7">{formatVal('Total length middle finger to end of scar')}</text>
            </g>
          </svg>
        );

      case 'Belly Binder':
        return (
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]" style={{ minHeight: '300px' }}>
            <defs>
              <marker id="arrow-orange-bb" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
              </marker>
              <marker id="arrow-rose-bb" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
              </marker>
            </defs>

            {/* Back shading layer for 3D outline realism */}
            <path 
              d="M 90,50 Q 160,53 230,50 C 238,90 244,130 248,170 C 252,210 253,235 251,250 L 236,325 Q 203,327 170,325 L 170,240 Q 160,238 150,240 L 150,325 Q 117,327 84,325 L 69,250 C 67,235 68,210 72,170 C 76,130 82,90 90,50 Z" 
              fill="#ebdcc9" 
              opacity="0.15"
            />

            {/* Main Garment Silhouette Shorts/Compression Girdle */}
            <path 
              d="M 90,50 Q 160,53 230,50 C 238,90 244,130 248,170 C 252,210 253,235 251,250 L 236,325 Q 203,327 170,325 L 170,240 Q 160,238 150,240 L 150,325 Q 117,327 84,325 L 69,250 C 67,235 68,210 72,170 C 76,130 82,90 90,50 Z" 
              fill="#fdfaf6" 
              stroke="#b1967c" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
            />

            {/* Waist rib band */}
            <path d="M 90,50 Q 160,53 230,50" stroke="#b1967c" strokeWidth="3" fill="none" />
            <path d="M 92,64 Q 160,67 228,64" stroke="#d5c3b2" strokeWidth="1.5" fill="none" />

            {/* Crotch opening gap (dark contrast circle/ellipse from standard compression shorts) */}
            <ellipse cx="160" cy="235" rx="11" ry="14" fill="#0f172a" />

            {/* Middle Front Zipper track and elements */}
            <line x1="160" y1="64" x2="160" y2="221" stroke="#8c735d" strokeWidth="2.5" />
            <line x1="158.5" y1="64" x2="158.5" y2="221" stroke="#f6f2eb" strokeWidth="0.5" />
            
            {/* Zipper Pull Slider */}
            <rect x="157.5" y="75" width="5" height="11" rx="1.5" fill="#fdfaf6" stroke="#5d4c3e" strokeWidth="1.2" />
            <circle cx="160" cy="83" r="1.5" fill="#5d4c3e" />

            {/* Bottom Leg Hems */}
            <path d="M 84,325 Q 117,327 150,325" stroke="#b1967c" strokeWidth="2.5" fill="none" />
            <path d="M 170,325 Q 203,327 236,325" stroke="#b1967c" strokeWidth="2.5" fill="none" />

            {/* Internal Circumference Measurement Guides (Dashed bands) */}
            {/* 1. Diaphragm line */}
            <path d="M 91,56 Q 160,59 229,56" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 2. Belly line */}
            <path d="M 80,110 Q 160,114 240,110" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 3. Waist line */}
            <path d="M 73,175 Q 160,179 247,175" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* Hips line */}
            <path d="M 75,215 Q 160,219 245,215" stroke="#0891b2" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 4. Open end thigh (Upper Thigh) */}
            <path d="M 71,260 Q 110,262 149,260" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 5. Close end thigh (Lower Thigh) */}
            <path d="M 80,300 Q 115,302 149,300" stroke="#db2777" strokeWidth="2" strokeDasharray="3 2" fill="none" />

            {/* Vertical Height Measurement Rulers */}
            {/* Right Height: Diaphragm to Waist */}
            <line x1="247" y1="175" x2="275" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="230" y1="50" x2="275" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="270" y1="50" x2="270" y2="175" stroke="#ea580c" strokeWidth="1.5" markerStart="url(#arrow-orange-bb)" markerEnd="url(#arrow-orange-bb)" />

            {/* Left Height: Waist to Close end thigh */}
            <line x1="73" y1="175" x2="45" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="80" y1="300" x2="45" y2="300" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="175" x2="50" y2="300" stroke="#e11d48" strokeWidth="1.5" markerStart="url(#arrow-rose-bb)" markerEnd="url(#arrow-rose-bb)" />

            {/* Overlay Badges for measurements */}
            {/* 1. Diaphragm Badge */}
            <g transform="translate(160, 42)" className="text-[8px] font-bold">
              <rect x="-48" y="-7" width="96" height="14" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="8">Diaphrom: {formatVal('Diaphrom')}</text>
            </g>

            {/* 2. Belly Badge */}
            <g transform="translate(160, 110)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>

            {/* 3. Waist Badge */}
            <g transform="translate(160, 175)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">West: {formatVal('West (Waist)')}</text>
            </g>

            {/* 3.5. Hips Badge */}
            <g transform="translate(160, 215)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#0891b2" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="8">Hips: {formatVal('Hips')}</text>
            </g>

            {/* 4. Open end thigh Badge */}
            <g transform="translate(110, 260)" className="text-[8px] font-bold">
              <rect x="-48" y="-7" width="96" height="14" rx="4" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="8">Open End: {formatVal('Open End')}</text>
            </g>

            {/* 5. Close end thigh Badge */}
            <g transform="translate(110, 300)" className="text-[8px] font-bold">
              <rect x="-50" y="-7" width="100" height="14" rx="4" fill="white" stroke="#db2777" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="8">Close End: {formatVal('Close End (Leg end)')}</text>
            </g>

            {/* 7. Diaphragm to Waist Length Badge */}
            <g transform="translate(280, 112)" className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#ea580c" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Dia-West</text>
              <text y="8" textAnchor="middle" className="fill-orange-700 font-black" fontSize="7">{formatVal('Length Diaphrom to West')}</text>
            </g>

            {/* 8. Waist to Close Length Badge */}
            <g transform="translate(40, 237)" className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#e11d48" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-rose-600 font-extrabold" fontSize="8">Short-Len</text>
              <text y="8" textAnchor="middle" className="fill-rose-700 font-black" fontSize="7">{formatVal('Short Length')}</text>
            </g>
          </svg>
        );

      case 'All Trouser':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            {/* Pants outline */}
            <path d="M 90,40 L 210,40 L 215,90 L 235,260 L 185,260 L 150,110 L 115,260 L 65,260 L 85,90 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />

            {/* Belly guideline at top */}
            <line x1="90" y1="40" x2="210" y2="40" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3"/>
            
            {/* West guideline */}
            <line x1="88" y1="60" x2="212" y2="60" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3"/>
            
            {/* Hips guideline */}
            <line x1="86" y1="85" x2="214" y2="85" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="3 3"/>

            {/* Ellipses for Round/Thighs/Knee/Calf/Bottom on both legs to match hand drawn sketch */}
            {/* 1. Round (Groin level y=110) */}
            <ellipse cx="102" cy="115" rx="16" ry="5" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="198" cy="115" rx="16" ry="5" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* 2. Thigh I (y=145) */}
            <ellipse cx="98" cy="145" rx="18" ry="5" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="202" cy="145" rx="18" ry="5" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* 3. Thigh II (y=175) */}
            <ellipse cx="92" cy="175" rx="19" ry="5" stroke="#ec4899" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="208" cy="175" rx="19" ry="5" stroke="#ec4899" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* 4. Knee (y=205) */}
            <ellipse cx="85" cy="205" rx="18" ry="5" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="215" cy="205" rx="18" ry="5" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* 5. Calf (y=232) */}
            <ellipse cx="78" cy="232" rx="18" ry="5" stroke="#84cc16" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="222" cy="232" rx="18" ry="5" stroke="#84cc16" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* 6. Bottom (y=260) */}
            <line x1="65" y1="260" x2="115" y2="260" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="185" y1="260" x2="235" y2="260" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="2 2" />

            {/* Height Rule: Crotch Depth (Waist x=150, rise to y=110) */}
            <line x1="150" y1="40" x2="150" y2="110" stroke="#eab308" strokeWidth="1.5" />
            {/* Mini arrows for Crotch Depth */}
            <path d="M 147,45 L 150,40 L 153,45" stroke="#eab308" strokeWidth="1.5" fill="none" />
            <path d="M 147,105 L 150,110 L 153,105" stroke="#eab308" strokeWidth="1.5" fill="none" />

            {/* Height Rule: Inseam (Crotch rise level y=110 down to bottom opening level y=260) */}
            <line x1="150" y1="110" x2="150" y2="260" stroke="#ea580c" strokeWidth="1.5" />
            {/* Mini arrows for Inseam */}
            <path d="M 147,115 L 150,110 L 153,115" stroke="#ea580c" strokeWidth="1.5" fill="none" />
            <path d="M 147,255 L 150,260 L 153,255" stroke="#ea580c" strokeWidth="1.5" fill="none" />

            {/* Height Rule: Total Length (Far right ruler from y=40 to y=260) */}
            <line x1="270" y1="40" x2="270" y2="260" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="265" y1="40" x2="275" y2="40" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="265" y1="260" x2="275" y2="260" stroke="#2563eb" strokeWidth="1.5" />
            {/* Arrow tips for Total Length */}
            <path d="M 267,45 L 270,40 L 273,45" stroke="#2563eb" strokeWidth="1.5" fill="none" />
            <path d="M 267,255 L 270,260 L 273,255" stroke="#2563eb" strokeWidth="1.5" fill="none" />

            {/* Badges on the right / center: Vertical Heights */}
            <g transform="translate(182, 53)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#eab308" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-yellow-600 font-extrabold" fontSize="7">Crotch: {formatVal('Crotch Depth')}</text>
            </g>

            <g transform="translate(150, 185)" className="text-[7px] font-bold">
              <rect x="-35" y="-6" width="70" height="12" rx="3" fill="white" stroke="#ea580c" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="7">Inseam: {formatVal('Inseam (Inside Length)')}</text>
            </g>

            <g transform="translate(265, 145)" className="text-[7px] font-bold">
              <rect x="-35" y="-14" width="70" height="24" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.2" />
              <text y="-4" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="7">Total Length</text>
              <text y="6" textAnchor="middle" className="fill-blue-700 font-black" fontSize="7">{formatVal('Total Length')}</text>
            </g>

            {/* Badges on the Top: Torso Girths */}
            <g transform="translate(150, 25)" className="text-[7px] font-bold">
              <rect x="-36" y="-6" width="72" height="12" rx="3" fill="white" stroke="#2563eb" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="7">Belly: {formatVal('Belly')}</text>
            </g>

            <g transform="translate(105, 52)" className="text-[7px] font-bold">
              <rect x="-36" y="-6" width="72" height="12" rx="3" fill="white" stroke="#10b981" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="7">West: {formatVal('West (Waist)')}</text>
            </g>

            <g transform="translate(105, 75)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#0891b2" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="7">Hips: {formatVal('Hips')}</text>
            </g>

            {/* Circumference Badges on the Left Side pointing to guiding ellipses */}
            {/* 1. Round (Crotch Round / Seat length) */}
            <g transform="translate(40, 115)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="7">Round: {formatVal('Round (Crotch)')}</text>
            </g>
            <path d="M 68,115 L 86,115" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="1 1" />

            {/* 2. Thigh I */}
            <g transform="translate(40, 145)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#7c3aed" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="7">Thigh I: {formatVal('Thigh I')}</text>
            </g>
            <path d="M 68,145 L 80,145" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="1 1" />

            {/* 3. Thigh II */}
            <g transform="translate(40, 175)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#ec4899" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="7">Thigh II: {formatVal('Thigh II')}</text>
            </g>
            <path d="M 68,175 L 74,175" stroke="#ec4899" strokeWidth="0.8" strokeDasharray="1 1" />

            {/* 4. Knee */}
            <g transform="translate(40, 205)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="7">Knee: {formatVal('Knee')}</text>
            </g>
            <path d="M 68,205 L 68,205" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="1 1" />

            {/* 5. Calf */}
            <g transform="translate(40, 232)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#84cc16" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-lime-600 font-extrabold" fontSize="7">Calf: {formatVal('Calf')}</text>
            </g>
            <path d="M 68,232 L 64,232" stroke="#84cc16" strokeWidth="0.8" strokeDasharray="1 1" />

            {/* 6. Bottom */}
            <g transform="translate(40, 260)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#e11d48" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-rose-600 font-extrabold" fontSize="7">Bottom: {formatVal('Bottom')}</text>
            </g>
            <path d="M 68,260 L 65,260" stroke="#e11d48" strokeWidth="0.8" strokeDasharray="1 1" />
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
    { id: 'garment-select', label: 'Configure Clinical & Compression', icon: FileText },
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


              {/* STEP 2: DR NOTES */}
              {activeStep === 'garment-select' && (
                <div className="space-y-10">
                  <div className="border-l-4 border-blue-600 pl-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configure Clinical & Compression</h2>
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
                            subOptions: newType === 'All Gloves/Glove With Sleeve' 
                              ? { 'Hand Selection': 'Right Hand Glove' } 
                              : {} // Reset sub-options on change so they are clean
                          }));
                        }}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all shadow-sm"
                      >
                        <option value="Face Mask & Chin Binder">Face Mask & Chin Binder</option>
                        <option value="Connecting Sleeves">Connecting Sleeves</option>
                        <option value="Arm sleeve Right Hand">Arm sleeve Right Hand</option>
                        <option value="Arm sleeve Left Hand">Arm sleeve Left Hand</option>
                        <option value="All Jacket">All Jacket</option>
                        <option value="All Gloves/Glove With Sleeve">All Gloves/Glove With Sleeve</option>
                        <option value="Belly Binder">Belly Binder</option>
                        <option value="All Trouser">All Trouser</option>
                        <option value="All Leg Sleeves">All Leg Sleeves</option>
                        <option value="All Socks">All Socks</option>
                      </select>
                    </div>

                    {/* Glove Hand Selection - Right Hand / Left Hand Option */}
                    {garment.type === 'All Gloves/Glove With Sleeve' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-blue-600" />
                          Glove Hand Option (دستانہ ہاتھ کا انتخاب)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { value: 'Right Hand Glove', label: 'Right Hand Glove', native: 'Right Hand (سیدھا ہاتھ)' },
                            { value: 'Left Hand Glove', label: 'Left Hand Glove', native: 'Left Hand (الٹا ہاتھ)' }
                          ].map(opt => {
                            const isSelected = (garment.subOptions?.['Hand Selection'] || 'Right Hand Glove') === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setGarment(prev => ({
                                  ...prev,
                                  subOptions: {
                                    ...(prev.subOptions || {}),
                                    'Hand Selection': opt.value
                                  }
                                }))}
                                className={cn(
                                  "flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all text-center cursor-pointer",
                                  isSelected
                                    ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-102"
                                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span className="text-sm font-black">{opt.label}</span>
                                <span className={cn(
                                  "text-[10px] font-medium opacity-80 mt-1",
                                  isSelected ? "text-blue-100" : "text-slate-400"
                                )}>{opt.native}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

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

                      {/* Premium Garment Color Selection */}
                      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold">
                          GARMENT COLOR SELECTION
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: 'Beige / Skin', label: 'Beige / Skin', colorHex: '#e6c8a2' },
                            { value: 'Black Color', label: 'Black Color', colorHex: '#1e293b' },
                            { value: 'Brown / Cocoa', label: 'Brown / Cocoa', colorHex: '#7c2d12' },
                            { value: 'Pink Color', label: 'Pink Color', colorHex: '#f472b6' },
                            { value: 'Off-White / Cream', label: 'Off-White / Cream', colorHex: '#fafafa' }
                          ].map(col => {
                            const isSelected = garment.subOptions?.['Color'] === col.value;
                            return (
                              <button
                                key={col.value}
                                type="button"
                                onClick={() => setGarment(prev => ({
                                  ...prev,
                                  subOptions: {
                                    ...prev.subOptions,
                                    'Color': col.value
                                  }
                                }))}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-semibold cursor-pointer",
                                  isSelected 
                                    ? "bg-slate-900 border-slate-900 text-white shadow-md scale-102" 
                                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                                )}
                              >
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" 
                                  style={{ backgroundColor: col.colorHex }}
                                />
                                {col.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes Space */}
                      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold flex justify-between items-center">
                          <span>MEASUREMENT NOTES</span>
                          <span className="text-[9px] text-slate-400 font-normal">({countWords(patient.notes || '')}/500 words)</span>
                        </label>
                        <textarea
                          placeholder="Write down any special measurements instructions, scar particulars, or physical condition details here..."
                          value={patient.notes || ''}
                          onChange={(e) => handleNotesChange(e.target.value)}
                          rows={4}
                          className="w-full text-sm font-semibold p-4 rounded-xl border border-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50/50 text-slate-800 placeholder:text-slate-300"
                        />
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
                        <FileText className="w-3 h-3" /> Clinical & Compression
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
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Clinical & Compression Specifications</h3>
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
