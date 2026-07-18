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
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';
import { useAuthStore } from '../services/authStore';

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
    { id: 'open_end', label: 'Open End', placeholder: 'e.g., 18 cm' },
    { id: 'close_end', label: 'Close End', placeholder: 'e.g., 14 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Right Hand': [
    { id: 'arm_pit', label: 'Open End', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Close End', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Arm sleeve Left Hand': [
    { id: 'arm_pit', label: 'Open End', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'wrist', label: 'Close End', placeholder: 'e.g., 16 cm' },
    { id: 'total_arm_length', label: 'Total arm length', placeholder: 'e.g., 60 cm' }
  ],
  'Connecting Sleeves/Arm Sleeve': [
    { id: 'shoulder', label: 'Shoulder', placeholder: 'e.g., 42 cm' },
    { id: 'arm_pit', label: 'Arm pit', placeholder: 'e.g., 28 cm' },
    { id: 'elbow', label: 'Elbow', placeholder: 'e.g., 24 cm' },
    { id: 'open_end', label: 'Open End', placeholder: 'e.g., 18 cm' },
    { id: 'close_end', label: 'Close End', placeholder: 'e.g., 14 cm' },
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
    { id: 'thumb', label: 'Thumb', placeholder: 'e.g., 5.5 cm' },
    { id: 'index_finger', label: 'Index finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'middle_finger', label: 'Middle finger', placeholder: 'e.g., 8 cm' },
    { id: 'ring_finger', label: 'Ring finger', placeholder: 'e.g., 7.5 cm' },
    { id: 'little_finger', label: 'Little finger', placeholder: 'e.g., 6 cm' },
    { id: 'total_len_medal_to_scar', label: 'Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' }
  ],
  'Belly Binder': [
    { id: 'diaphrarm', label: 'Diaphrom', placeholder: 'e.g., 51 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 53 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 54 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 58 cm' },
    { id: 'open_end_thigh', label: 'Open End', placeholder: 'e.g., 35 cm' },
    { id: 'close_end_thigh', label: 'Close End (Leg end)', placeholder: 'e.g., 25 cm' },
    { id: 'len_diaphragm_to_waist', label: 'Length Diaphrom to Waist', placeholder: 'e.g., 18 cm' },
    { id: 'len_waist_to_close_end', label: 'Waist to Close End', placeholder: 'e.g., 44 cm' }
  ],
  'All Trouser': [
    { id: 'diaphrarm', label: 'Diaphrarm', placeholder: 'e.g., 96 cm' },
    { id: 'belly', label: 'Belly', placeholder: 'e.g., 98 cm' },
    { id: 'waist', label: 'Waist', placeholder: 'e.g., 98 cm' },
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 104 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 56 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 46 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 42 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 25 cm' },
    { id: 'len_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'len_waist_to_ankle', label: 'Length waist to ankle', placeholder: 'e.g., 86 cm' },
    { id: 'total_length', label: 'Total Length', placeholder: 'e.g., 91 cm' }
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
  ],
  'Body Shaper': [
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
    { id: 'hips', label: 'Hips', placeholder: 'e.g., 104 cm' },
    { id: 'open_end_thigh', label: 'Open end thigh', placeholder: 'e.g., 56 cm' },
    { id: 'close_end_thigh', label: 'Close end thigh', placeholder: 'e.g., 46 cm' },
    { id: 'knee', label: 'Knee', placeholder: 'e.g., 42 cm' },
    { id: 'ankle', label: 'Ankle', placeholder: 'e.g., 25 cm' },
    { id: 'length_diaphragm_to_waist', label: 'length diaphragm to waist', placeholder: 'e.g., 20 cm' },
    { id: 'length_waist_to_ankle', label: 'Length waist to ankle', placeholder: 'e.g., 86 cm' },
    { id: 'total_length', label: 'Total Length', placeholder: 'e.g., 91 cm' }
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
  const { user, profile } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com'].includes(user?.email?.toLowerCase().trim() || '');
  const isAdmin = profile?.role === 'admin' || isSuperEmail;

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

  const handleGarmentNotesChange = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") {
      setGarmentNotes(text);
      return;
    }
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount <= 500) {
      setGarmentNotes(text);
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
      setGarmentNotes(truncated);
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
  const [garmentNotes, setGarmentNotes] = useState('');
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
    if (type.includes('Body Shaper')) {
      return [
        { id: 'neck', label: 'Neck around', value: '', x: 150, y: 55 },
        { id: 'chest', label: 'Chest', value: '', x: 150, y: 110 },
        { id: 'waist', label: 'Waist', value: '', x: 150, y: 175 },
        { id: 'hips', label: 'Hips', value: '', x: 150, y: 220 },
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
      let lookupLabel = label;
      const handSelectionVal = garment.subOptions?.['Hand Selection'] || 'Right Hand Glove';
      if (garment.type === 'All Gloves/Glove With Sleeve' && handSelectionVal === 'Both Hand Glove') {
        const prefix = activeBothHandView === 'Left' ? 'Left Hand ' : 'Right Hand ';
        lookupLabel = `${prefix}${label}`;
      }
      let val = garment.subOptions?.[lookupLabel];
      
      // Fallback mappings for backwards compatibility
      if (!val) {
        if (label === 'Open End' || label === 'Open end') val = garment.subOptions?.['Open End'] || garment.subOptions?.['Open end'] || garment.subOptions?.['Arm pit'] || garment.subOptions?.['arm_pit'];
        else if (label === 'Close End' || label === 'Close end') val = garment.subOptions?.['Close End'] || garment.subOptions?.['Close end'] || garment.subOptions?.['Wrist'] || garment.subOptions?.['wrist'];
        else if (label === 'Arm pit' || label === 'Arm Pit') val = garment.subOptions?.['Arm pit'] || garment.subOptions?.['Arm Pit'] || garment.subOptions?.['Open End'] || garment.subOptions?.['Open end'];
        else if (label === 'Wrist') val = garment.subOptions?.['Wrist'] || garment.subOptions?.['Close End'] || garment.subOptions?.['Close end'];
        else if (label === 'Middle finger') val = garment.subOptions?.['Medal finger'];
        else if (label === 'Index finger') val = garment.subOptions?.['Left finger'];
        else if (label === 'Ring finger') val = garment.subOptions?.['Right finger'];
        else if (label === 'Little finger') val = garment.subOptions?.['Small finger'];
        else if (label === 'Total length middle finger to wrist') val = garment.subOptions?.['Total length medal finger to wrist'];
        else if (label === 'Total length middle finger to end of scar') val = garment.subOptions?.['Total length medal finger to end of scar'];
        // Belly Binder mappings
        else if (label === 'Diaphrom' || label === 'Diaphrarm') val = garment.subOptions?.['Diaphrom'] || garment.subOptions?.['Diaphrarm'] || garment.subOptions?.['Belly'];
        else if (label === 'West (Waist)' || label === 'Waist' || label === 'West') val = garment.subOptions?.['Waist'] || garment.subOptions?.['West (Waist)'] || garment.subOptions?.['West'] || garment.subOptions?.['waist'];
        else if (label === 'Open End' || label === 'Open end thigh') val = garment.subOptions?.['Open End'] || garment.subOptions?.['Open end thigh'];
        else if (label === 'Close End (Leg end)' || label === 'Close end thigh') val = garment.subOptions?.['Close End (Leg end)'] || garment.subOptions?.['Close end thigh'];
        else if (label === 'Length Diaphrom to West' || label === 'Length Diaphrom to Waist' || label === 'length diaphragm to waist') val = garment.subOptions?.['Length Diaphrom to Waist'] || garment.subOptions?.['Length Diaphrom to West'] || garment.subOptions?.['length diaphragm to waist'];
        else if (label === 'Short Length' || label === 'Length waist to close end' || label === 'Waist to Close End') val = garment.subOptions?.['Waist to Close End'] || garment.subOptions?.['Short Length'] || garment.subOptions?.['Length waist to close end'];
        else if (label === 'Length waist to ankle') val = garment.subOptions?.['Length waist to ankle'] || garment.subOptions?.['len_waist_to_ankle'];
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
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[640px]" style={{ minHeight: '400px' }}>
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[600px]" style={{ minHeight: '400px' }}>
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

            {/* 3. Open End loop on left sleeve (between Arm pit and Elbow) */}
            <ellipse cx="72.5" cy="156.5" rx="13" ry="4" transform="rotate(-40, 72.5, 156.5)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 4. Elbow loop on left sleeve */}
            <ellipse cx="66" cy="182" rx="11" ry="4" transform="rotate(-40, 66, 182)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 5. Close End loop on left sleeve */}
            <ellipse cx="55" cy="259" rx="8" ry="3" transform="rotate(-40, 55, 259)" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 6. Total arm length path along left sleeve-edge */}
            <path d="M 65,115 Q 52,185 48,260" stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="3 3" fill="none" />

            {/* Labels overlay */}
            <g transform="translate(150, 60)" className="text-[9px] font-bold">
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(150, 290)" className="text-[9px] font-bold">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(132, 122)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(127, 153.5)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Open End: {formatVal('Open End')}</text>
            </g>
            <g transform="translate(122, 185)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(102, 265)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-bold" fontSize="9">Close End: {formatVal('Close End')}</text>
            </g>
          </svg>
        );

      case 'Arm sleeve Right Hand':
      case 'Arm sleeve Left Hand':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[600px]" style={{ minHeight: '400px' }}>
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
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Open End: {formatVal('Open End')}</text>
            </g>
            <g transform="translate(185, 175)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(75, 235)" className="text-[9px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-bold" fontSize="9">Close End: {formatVal('Close End')}</text>
            </g>
          </svg>
        );

      case 'All Jacket':
        return (
          <svg viewBox="0 0 320 320" className="w-full h-full max-h-[640px]" style={{ minHeight: '400px' }}>
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
              <text y="2.2" textAnchor="middle" className="fill-pink-700 font-bold" fontSize="7.5">Close End: {formatVal('Arm close end')}</text>
            </g>

            {/* Right sleeve arm length overlay badge */}
            <g transform="translate(265, 128)" className="text-[7.5px] font-bold">
              <rect x="-55" y="-5.5" width="110" height="11" rx="1.5" fill="white" stroke="#8b5cf6" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-violet-700 font-bold" fontSize="7.5">Arm Length: {formatVal('Arm total length')}</text>
            </g>
          </svg>
        );

      case 'All Gloves/Glove With Sleeve':
        const handSelectionVal = garment.subOptions?.['Hand Selection'] || 'Right Hand Glove';
        const isBoth = handSelectionVal === 'Both Hand Glove';
        const activeHand = isBoth ? activeBothHandView : (handSelectionVal === 'Left Hand Glove' ? 'Left' : 'Right');
        const isLeftHand = activeHand === 'Left';
        const xThumb = isLeftHand ? 277 : 43;
        const xLeftFinger = isLeftHand ? 209 : 111;
        const xMiddleFinger = isLeftHand ? 172 : 148;
        const xRightFinger = isLeftHand ? 139 : 181;
        const xSmallFinger = isLeftHand ? 110 : 210;

        return (
          <div className="flex flex-col items-center w-full">
            {isBoth && (
              <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveBothHandView('Right')}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeBothHandView === 'Right'
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Right Hand View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBothHandView('Left')}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeBothHandView === 'Left'
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Left Hand View
                </button>
              </div>
            )}
            <svg viewBox="0 0 320 380" className="w-full h-full max-h-[760px]" style={{ minHeight: '480px' }}>
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
              <rect x="-70" y="-10" width="140" height="20" rx="10" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" />
              <text y="3.5" textAnchor="middle" fill="#1e293b" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
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

              {/* vertical side measurement rulers (Moved inside flipped group for perfect coordinates alignment on both views) */}
              {/* Height Line 2: Finger-to-scar-end (Right Margin in Right View, Left Margin in Left View) */}
              <line x1="180" y1="48" x2="285" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="195" y1="360" x2="285" y2="360" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="285" y1="48" x2="285" y2="360" stroke="#7c3aed" strokeWidth="1.5" markerStart="url(#arrow-purple-cl)" markerEnd="url(#arrow-purple-cl)" />
            </g>

            {/* Readable Badges Overlay (Outside Flipped Group to Prevent text mirroring, with coordinates swapped dynamically) */}
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
              <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#ea580c" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Thumb: {formatVal('Thumb')}</text>
            </g>

            {/* 4. Index Finger / Left */}
            <g transform={`translate(${xLeftFinger}, 100)`} className="text-[8px] font-bold">
              <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#0891b2" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="8">Index: {formatVal('Index finger')}</text>
            </g>
            
            {/* 5. Middle Finger / Medal */}
            <g transform={`translate(${xMiddleFinger}, 62)`} className="text-[8px] font-bold">
              <rect x="-34" y="-7" width="68" height="14" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-indigo-600 font-extrabold" fontSize="8">Middle: {formatVal('Middle finger')}</text>
            </g>

            {/* 6. Ring Finger / Right */}
            <g transform={`translate(${xRightFinger}, 105)`} className="text-[8px] font-bold">
              <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#059669" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Ring: {formatVal('Ring finger')}</text>
            </g>

            {/* 7. Small Finger */}
            <g transform={`translate(${xSmallFinger}, 145)`} className="text-[8px] font-bold">
              <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#db2777" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="8">Little: {formatVal('Little finger')}</text>
            </g>

            {/* 9. Total Length (Finger to Scar) Badge - dynamically positioned left/right margins based on view */}
            <g transform={`translate(${isLeftHand ? 35 : 285}, 204)`} className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="8">To Scar</text>
              <text y="8" textAnchor="middle" className="fill-purple-700 font-black" fontSize="7">{formatVal('Total length middle finger to end of scar')}</text>
            </g>
          </svg>
          </div>
        );

      case 'Belly Binder':
        return (
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[760px]" style={{ minHeight: '480px' }}>
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
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Waist: {formatVal('Waist')}</text>
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
              <text y="-2" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Dia-Waist</text>
              <text y="8" textAnchor="middle" className="fill-orange-700 font-black" fontSize="7">{formatVal('Length Diaphrom to Waist')}</text>
            </g>

            {/* 8. Waist to Close Length Badge */}
            <g transform="translate(40, 237)" className="text-[8px] font-bold">
              <rect x="-26" y="-12" width="52" height="24" rx="4" fill="white" stroke="#e11d48" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-rose-600 font-extrabold" fontSize="8">Wst-Close</text>
              <text y="8" textAnchor="middle" className="fill-rose-700 font-black" fontSize="7">{formatVal('Waist to Close End')}</text>
            </g>
          </svg>
        );

      case 'All Trouser':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[640px]" style={{ minHeight: '400px', overflow: 'visible' }} overflow="visible">
            {/* Pants outline but shifted down to allow y=20 Diaphrarm */}
            <path d="M 90,50 L 210,50 L 215,100 L 235,270 L 185,270 L 150,120 L 115,270 L 65,270 L 85,100 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />

            {/* Diaphrarm guideline (upper line) */}
            <line x1="92" y1="20" x2="208" y2="20" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="3 3"/>

            {/* Belly guideline at top of trouser */}
            <line x1="90" y1="50" x2="210" y2="50" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3"/>
            
            {/* West guideline */}
            <line x1="88" y1="70" x2="212" y2="70" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3"/>
            
            {/* Hips guideline */}
            <line x1="86" y1="95" x2="214" y2="95" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="3 3"/>

            {/* Ellipses for Thighs, Knee, Ankle, Bottom */}
            {/* Open end thigh (y=125) */}
            <ellipse cx="102" cy="125" rx="16" ry="5" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="198" cy="125" rx="16" ry="5" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* Close end thigh (y=170) */}
            <ellipse cx="94" cy="170" rx="18" ry="5" stroke="#ec4899" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="206" cy="170" rx="18" ry="5" stroke="#ec4899" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* Knee (y=215) */}
            <ellipse cx="85" cy="215" rx="18" ry="5" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="215" cy="215" rx="18" ry="5" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* Ankle (y=245) */}
            <ellipse cx="78" cy="245" rx="17" ry="5" stroke="#84cc16" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
            <ellipse cx="222" cy="245" rx="17" ry="5" stroke="#84cc16" strokeWidth="1.5" fill="none" strokeDasharray="2 2" />

            {/* Height Rule: length diaphragm to waist (diaphrarm y=20 to waist y=70) */}
            <line x1="62" y1="20" x2="62" y2="70" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M 59,25 L 62,20 L 65,25" stroke="#4f46e5" strokeWidth="1.5" fill="none" />
            <path d="M 59,65 L 62,70 L 65,65" stroke="#4f46e5" strokeWidth="1.5" fill="none" />

            {/* Height Rule: Length waist to ankle (waist y=70 to ankle y=245) */}
            <line x1="20" y1="70" x2="20" y2="245" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="15" y1="70" x2="25" y2="70" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="15" y1="245" x2="25" y2="245" stroke="#06b6d4" strokeWidth="1.5" />
            <path d="M 17,75 L 20,70 L 23,75" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
            <path d="M 17,240 L 20,245 L 23,240" stroke="#06b6d4" strokeWidth="1.5" fill="none" />

            {/* Height Rule: Total Length (Far right ruler from y=50 to y=270) */}
            <line x1="275" y1="50" x2="275" y2="270" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="270" y1="50" x2="280" y2="50" stroke="#2563eb" strokeWidth="1.5" />
            <line x1="270" y1="270" x2="280" y2="270" stroke="#2563eb" strokeWidth="1.5" />
            <path d="M 272,55 L 275,50 L 278,55" stroke="#2563eb" strokeWidth="1.5" fill="none" />
            <path d="M 272,265 L 275,270 L 278,265" stroke="#2563eb" strokeWidth="1.5" fill="none" />

            {/* Badges on Total Length & Waist to Ankle */}
            <g transform="translate(268, 155)" className="text-[7px] font-bold">
              <rect x="-35" y="-14" width="70" height="24" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.2" />
              <text y="-4" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="7">Total Length</text>
              <text y="6" textAnchor="middle" className="fill-blue-700 font-black" fontSize="7">{formatVal('Total Length')}</text>
            </g>

            <g transform="translate(20, 54)" className="text-[7px] font-bold">
              <rect x="-42" y="-14" width="84" height="24" rx="4" fill="white" stroke="#06b6d4" strokeWidth="1.2" />
              <text y="-4" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="6.5">Waist to Ankle</text>
              <text y="6" textAnchor="middle" className="fill-cyan-700 font-black" fontSize="6.5">{formatVal('Length waist to ankle')}</text>
            </g>

            {/* Badges on the Top & Center */}
            <g transform="translate(150, 10)" className="text-[7px] font-bold">
              <rect x="-38" y="-6" width="76" height="12" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-indigo-600 font-extrabold" fontSize="7">Diaphrarm: {formatVal('Diaphrarm')}</text>
            </g>

            <g transform="translate(150, 36)" className="text-[7px] font-bold">
              <rect x="-36" y="-6" width="72" height="12" rx="3" fill="white" stroke="#2563eb" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="7">Belly: {formatVal('Belly')}</text>
            </g>

            <g transform="translate(105, 62)" className="text-[7px] font-bold">
              <rect x="-36" y="-6" width="72" height="12" rx="3" fill="white" stroke="#10b981" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="7">Waist: {formatVal('Waist')}</text>
            </g>

            <g transform="translate(105, 87)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#0891b2" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="7">Hips: {formatVal('Hips')}</text>
            </g>

            <g transform="translate(58, 10)" className="text-[7px] font-bold">
              <rect x="-51" y="-6" width="102" height="12" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-indigo-700 font-black" fontSize="6">Diaphragm to Waist: {formatVal('length diaphragm to waist')}</text>
            </g>

            {/* Circumference Badges on the Left Side pointing to guiding ellipses */}
            {/* Open end thigh */}
            <g transform="translate(56, 125)" className="text-[7px] font-bold">
              <rect x="-48" y="-6" width="96" height="12" rx="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="6.5">Open end thigh: {formatVal('Open end thigh')}</text>
            </g>

            {/* Close end thigh */}
            <g transform="translate(56, 170)" className="text-[7px] font-bold">
              <rect x="-48" y="-6" width="96" height="12" rx="3" fill="white" stroke="#ec4899" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="6.5">Close end thigh: {formatVal('Close end thigh')}</text>
            </g>

            {/* Knee */}
            <g transform="translate(42, 215)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="7">Knee: {formatVal('Knee')}</text>
            </g>

            {/* Ankle */}
            <g transform="translate(42, 245)" className="text-[7px] font-bold">
              <rect x="-28" y="-6" width="56" height="12" rx="3" fill="white" stroke="#84cc16" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-lime-600 font-extrabold" fontSize="7">Ankle: {formatVal('Ankle')}</text>
            </g>
          </svg>
        );

      case 'All Leg Sleeves':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[600px]" style={{ minHeight: '400px' }}>
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[600px]" style={{ minHeight: '400px' }}>
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

      case 'Body Shaper':
        return (
          <svg viewBox="0 0 320 395" className="w-full h-full max-h-[640px]" style={{ minHeight: '400px' }}>
            <defs>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
              </marker>
              <marker id="arrow-teal" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
              </marker>
              <marker id="arrow-indigo" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
              </marker>
              <marker id="arrow-darkblue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e3a8a" />
              </marker>
            </defs>

            {/* Outline of the Body Shaper */}
            <path d="M 140,65 L 95,65 L 25,160 L 40,166 L 122,95 L 122,190 L 110,355 L 138,355 L 160,230 L 182,355 L 210,355 L 198,190 L 198,95 L 280,166 L 295,160 L 225,65 Z" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round" />

            {/* Zipper down the center */}
            <line x1="160" y1="95" x2="160" y2="230" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.8" />
            <circle cx="160" cy="95" r="3" fill="#2563eb" />

            {/* Neck collar ellipse */}
            <ellipse cx="160" cy="65" rx="20" ry="4" fill="#e0f2fe" stroke="#2563eb" strokeWidth="1.2" />

            {/* Left Hand / Arm Measurement indicators on the actual drawing */}
            <ellipse cx="104" cy="100" rx="6" ry="7" transform="rotate(-30, 104, 100)" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="81" cy="122" rx="6" ry="7" transform="rotate(-30, 81, 122)" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="58" cy="140" rx="6" ry="7" transform="rotate(-30, 58, 140)" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="33" cy="162" rx="6" ry="8" transform="rotate(-30, 33, 162)" fill="none" stroke="#ec4899" strokeWidth="1.2" />

            {/* Right Sleeve Arm Length annotation */}
            <path d="M 235,60 L 305,150" fill="none" stroke="#a855f7" strokeWidth="1.2" marker-start="url(#arrow-purple)" marker-end="url(#arrow-purple)" />

            {/* Legs Measurement Indicator Loops */}
            {/* Open end thigh (orange) */}
            <ellipse cx="123" cy="255" rx="11" ry="2" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="197" cy="255" rx="11" ry="2" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2 1" />

            {/* Close end thigh (pink) */}
            <ellipse cx="123" cy="285" rx="10" ry="2" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="197" cy="285" rx="10" ry="2" fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 1" />

            {/* Knee (cyan) */}
            <ellipse cx="123" cy="315" rx="10" ry="1.8" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="197" cy="315" rx="10" ry="1.8" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 1" />

            {/* Ankle (green) */}
            <ellipse cx="124" cy="350" rx="9" ry="1.8" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />
            <ellipse cx="196" cy="350" rx="9" ry="1.8" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />

            {/* Left Body Total Length line from Waist to Ankle */}
            <path d="M 92,190 L 92,350" fill="none" stroke="#06b6d4" strokeWidth="1.2" marker-start="url(#arrow-teal)" marker-end="url(#arrow-teal)" />

            {/* Right Diaph to Waist vertical line (Y=130 to Y=180) */}
            <path d="M 212,130 L 212,180" fill="none" stroke="#4f46e5" strokeWidth="1.2" marker-start="url(#arrow-indigo)" marker-end="url(#arrow-indigo)" />

            {/* Right Body Total Length line from Underarm to Ankle */}
            <path d="M 248,95 L 248,350" fill="none" stroke="#1e3a8a" strokeWidth="1.2" marker-start="url(#arrow-darkblue)" marker-end="url(#arrow-darkblue)" />

            {/* Top Stack (Neck & Shoulder labels) */}
            <g transform="translate(160, 10)" className="text-[7.5px] font-bold">
              <rect x="-42" y="-6" width="84" height="12" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-600 font-bold">Neck Around: {formatVal('Neck around')}</text>
            </g>
            <g transform="translate(160, 24)" className="text-[7.5px] font-bold">
              <rect x="-42" y="-6" width="84" height="12" rx="3" fill="white" stroke="#ef4444" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-red-500 font-bold">Neck Len: {formatVal('Neck length')}</text>
            </g>
            <g transform="translate(160, 38)" className="text-[7.5px] font-bold">
              <rect x="-42" y="-6" width="84" height="12" rx="3" fill="white" stroke="#a855f7" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold">Shoulder: {formatVal('Shoulder')}</text>
              <line x1="-30" y1="11" x2="30" y2="11" stroke="#a855f7" strokeWidth="0.8" marker-start="url(#arrow-purple)" marker-end="url(#arrow-purple)" />
            </g>

            {/* Front Center Stack on Torso (Chest, Diapharm, Belly, Waist, Hips) */}
            <g transform="translate(160, 105)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#10b981" strokeWidth="0.6" />
              <text y="2" textAnchor="middle" className="fill-emerald-600 font-black">Chest: {formatVal('Chest')}</text>
            </g>
            <g transform="translate(160, 130)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#f97316" strokeWidth="0.6" />
              <text y="2" textAnchor="middle" className="fill-orange-600 font-black">Diapharm: {formatVal('Diapharm')}</text>
            </g>
            <g transform="translate(160, 155)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.6" />
              <text y="2" textAnchor="middle" className="fill-blue-600 font-black">Belly: {formatVal('Belly')}</text>
            </g>
            <g transform="translate(160, 180)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#ef4444" strokeWidth="0.6" />
              <text y="2" textAnchor="middle" className="fill-red-600 font-black">Waist: {formatVal('Waist')}</text>
            </g>
            <g transform="translate(160, 205)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="0.6" />
              <text y="2" textAnchor="middle" className="fill-cyan-600 font-black">Hips: {formatVal('Hips')}</text>
              <line x1="-20" y1="8" x2="20" y2="8" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="1.5 1" />
            </g>

            {/* Left Column Flanking Labels */}
            <g transform="translate(36, 100)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-blue-600 font-bold">Arm Pit: {formatVal('Arm pit')}</text>
              <path d="M 40,0 L 112,-5" stroke="#2563eb" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 120)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-cyan-600 font-bold">Arm Open: {formatVal('Arm open end')}</text>
              <path d="M 40,0 L 45,2" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 140)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#f97316" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-orange-600 font-bold">Elbow: {formatVal('Elbow')}</text>
              <path d="M 40,0 L 22,0" stroke="#f97316" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 165)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-pink-600 font-bold">Close End: {formatVal('Arm close end')}</text>
              <path d="M -40,0 L -3,-3" stroke="#ec4899" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 205)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-cyan-600 font-bold">Waist to Ankle: {formatVal('Length waist to ankle')}</text>
              <path d="M 40,0 L 56,0" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
 
            <g transform="translate(36, 255)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#f97316" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-orange-600 font-bold">Open end thigh: {formatVal('Open end thigh')}</text>
              <path d="M 40,0 L 87,0" stroke="#f97316" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 285)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-pink-600 font-bold">Close end thigh: {formatVal('Close end thigh')}</text>
              <path d="M 40,0 L 87,0" stroke="#ec4899" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 315)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#06b6d4" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-cyan-600 font-bold">Knee: {formatVal('Knee')}</text>
              <path d="M 40,0 L 87,0" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(36, 350)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-emerald-600 font-bold">Ankle: {formatVal('Ankle')}</text>
              <path d="M 40,0 L 88,0" stroke="#10b981" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>

            {/* Right Column Flanking Labels */}
            <g transform="translate(288, 130)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#a855f7" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-purple-600 font-bold">Arm Length: {formatVal('Arm total length')}</text>
              <path d="M -40,0 L -22,0" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(288, 180)" className="text-[7px] font-bold">
              <rect x="-48" y="-6" width="96" height="12" rx="3" fill="white" stroke="#4f46e5" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-indigo-600 font-bold">Diaphragm to Waist: {formatVal('length diaphragm to waist')}</text>
              <path d="M -48,0 L -76,0" stroke="#4f46e5" strokeWidth="0.5" strokeDasharray="1.5 1" opacity="0.6" />
            </g>
            <g transform="translate(288, 285)" className="text-[7px] font-bold">
              <rect x="-40" y="-6" width="80" height="12" rx="3" fill="white" stroke="#1e3a8a" strokeWidth="0.5" />
              <text y="2" textAnchor="middle" className="fill-blue-900 font-bold">Total Length: {formatVal('Total Length')}</text>
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
  const [activeBothHandView, setActiveBothHandView] = useState<'Right' | 'Left'>('Right');
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

  const triggerDownloadDrawing = (imageBlob: Blob | null) => {
    if (imageBlob) {
      try {
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(imageBlob);
        downloadLink.download = `${(patient.name || 'Patient').replace(/\s+/g, '_')}_drawing.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (downloadErr) {
        console.error("Auto-download failed:", downloadErr);
        alert("Failed to download drawing / ڈاؤن لوڈ نہیں ہو سکا۔");
      }
    } else {
      alert("Drawing generation failed / نقشہ نہیں بن سکا۔");
    }
  };

  const handleDownloadDrawing = () => {
    try {
      const container = 
        document.getElementById('measurement-drawing-container') ||
        document.getElementById('measurement-drawing-container-review-photo') ||
        document.getElementById('measurement-drawing-container-review-no-photo');
      const svgElement = container?.querySelector('svg');
      if (!svgElement) {
        alert("Could not load drawing element. / نقشہ نہیں ملا۔");
        return;
      }

      let processedSvgString = new XMLSerializer().serializeToString(svgElement);

      const viewBox = svgElement.getAttribute('viewBox')?.split(/\s+/) || [];
      const viewWidth = viewBox[2] ? viewBox[2] : '400';
      const viewHeight = viewBox[3] ? viewBox[3] : '400';

      // Ensure that standalone SVG contains the correct XML elements, namespaces, width, and height attributes
      if (processedSvgString.includes('<svg')) {
        const rootEnd = processedSvgString.indexOf('>');
        let rootTag = processedSvgString.slice(0, rootEnd);
        
        // Remove any existing width or height attributes to prevent duplication
        rootTag = rootTag.replace(/\s(width|height)="[^"]*"/g, '');
        
        if (!rootTag.includes('xmlns=')) {
          rootTag = rootTag.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // Inject absolute width and height attributes (Mandatory for browsers to load SVG images correctly into Canvas)
        rootTag = rootTag.replace('<svg', `<svg width="${viewWidth}" height="${viewHeight}"`);
        
        processedSvgString = rootTag + processedSvgString.slice(rootEnd);
      }

      // Map Tailwind fill and font classes to direct XML attributes for accurate canvas export
      const classMap: { [key: string]: string } = {
        'fill-red-700': 'fill="#b91c1c"',
        'fill-purple-700': 'fill="#7e22ce"',
        'fill-emerald-600': 'fill="#10b981"',
        'fill-emerald-700': 'fill="#047857"',
        'fill-amber-600': 'fill="#d97706"',
        'fill-amber-700': 'fill="#b55309"',
        'fill-blue-600': 'fill="#2563eb"',
        'fill-blue-700': 'fill="#1d4ed8"',
        'fill-rose-600': 'fill="#e11d48"',
        'fill-rose-700': 'fill="#be123c"',
        'fill-indigo-600': 'fill="#4f46e5"',
        'fill-indigo-700': 'fill="#4338ca"',
        'fill-cyan-600': 'fill="#0891b2"',
        'fill-cyan-700': 'fill="#0e7490"',
        'fill-pink-600': 'fill="#db2777"',
        'fill-pink-700': 'fill="#be185d"',
        'fill-purple-600': 'fill="#9333ea"',
        'fill-orange-600': 'fill="#ea580c"',
        'fill-orange-700': 'fill="#c2410c"',
        'fill-violet-700': 'fill="#6d28d9"',
        'fill-[#1e293b]': 'fill="#1e293b"',
        'fill-lime-600': 'fill="#65a30d"',
        'font-bold': 'font-weight="bold"',
        'font-extrabold': 'font-weight="800"',
        'font-black': 'font-weight="950"'
      };

      processedSvgString = processedSvgString.replace(/class="([^"]+)"/g, (match, classValues) => {
        const classes = classValues.split(/\s+/);
        let attributes: string[] = [];
        let otherClasses: string[] = [];
        
        classes.forEach((cls: string) => {
          if (classMap[cls]) {
            attributes.push(classMap[cls]);
          } else {
            otherClasses.push(cls);
          }
        });
        
        if (otherClasses.length > 0) {
          attributes.push(`class="${otherClasses.join(' ')}"`);
        }
        
        return attributes.join(' ');
      });

      // Standardize fonts on text tags inside the drawing using a CSS style override inside the SVG to avoid duplicate 'font-family' XML attribute syntax errors
      if (processedSvgString.includes('</svg>')) {
        processedSvgString = processedSvgString.replace('</svg>', '<style>text { font-family: system-ui, -apple-system, sans-serif !important; }</style></svg>');
      }

      // Calculate dynamic wrapped lines and footer height
      let wrappedLines: string[] = [];
      let footerHeight = 0;
      
      if (garmentNotes) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          const originalWidth = parseFloat(viewWidth);
          const maxWidth = originalWidth - 48; // unscaled container margin boundary
          
          tempCtx.font = "bold 16px system-ui, -apple-system, sans-serif";
          
          const paragraphs = garmentNotes.split('\n');
          for (const paragraph of paragraphs) {
            const words = paragraph.split(/\s+/);
            let currentLine = '';
            
            for (let n = 0; n < words.length; n++) {
              const word = words[n];
              if (!word) continue;
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const metrics = tempCtx.measureText(testLine);
              if (metrics.width > maxWidth) {
                if (currentLine) {
                  wrappedLines.push(currentLine);
                  currentLine = word;
                } else {
                  wrappedLines.push(testLine);
                  currentLine = '';
                }
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              wrappedLines.push(currentLine);
            }
          }
          
          const unscaledWrappedHeight = 35 + 25 + (wrappedLines.length * 24) + 25;
          footerHeight = Math.max(110, unscaledWrappedHeight);
        } else {
          footerHeight = 110;
        }
      }

      // Create Blob URL for better Unicode/Arabic character support and high performance
      const svgBlob = new Blob([processedSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const originalWidth = parseFloat(viewWidth);
          const originalHeight = parseFloat(viewHeight);
          
          const headerHeight = 145; // Shorter header height with Hospital removed
          const scale = 2; // double size for crisp printing / sharing
          
          canvas.width = originalWidth * scale;
          canvas.height = (originalHeight + headerHeight + footerHeight) * scale;
          
          const context = canvas.getContext('2d');
          if (context) {
            // Fill background white
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw header background block
            context.fillStyle = '#f8fafc';
            context.fillRect(0, 0, canvas.width, headerHeight * scale);
            
            // Blue thin bar at top
            context.fillStyle = '#3b82f6';
            context.fillRect(0, 0, canvas.width, 6 * scale);
            
            // Header divider line (low light-gray accent)
            context.strokeStyle = '#e2e8f0';
            context.lineWidth = 1 * scale;
            context.beginPath();
            context.moveTo(0, headerHeight * scale);
            context.lineTo(canvas.width, headerHeight * scale);
            context.stroke();
            
            // Draw Patient Details in Left region
            context.fillStyle = '#1e293b';
            context.font = `bold ${16 * scale}px system-ui, -apple-system, sans-serif`;
            const patientNameStr = patient.name ? patient.name.trim() : 'N/A';
            context.fillText(`👤 Patient / مریض: ${patientNameStr}`, 24 * scale, 35 * scale);
            
            context.fillStyle = '#475569';
            context.font = `bold ${12 * scale}px system-ui, -apple-system, sans-serif`;
            const fileIdStr = patient.patientId || patient.id || 'N/A';
            context.fillText(`🆔 File ID / فائل آئی ڈی: ${fileIdStr}`, 24 * scale, 75 * scale);

            const addressStr = patient.address ? patient.address.trim() : 'N/A';
            context.fillText(`📍 Address / پتہ: ${addressStr}`, 24 * scale, 115 * scale);
            
            // Draw Date on Right region
            context.fillStyle = '#2563eb';
            context.textAlign = 'right';
            context.font = `bold ${12 * scale}px system-ui, -apple-system, sans-serif`;
            const dateStr = `📅 Date / تاریخ: ${new Date(patient.date || Date.now()).toLocaleDateString()}`;
            context.fillText(dateStr, canvas.width - (24 * scale), 35 * scale);

            context.fillStyle = '#475569';
            const ageStr = `🎂 Age / عمر: ${patient.age ? `${patient.age} Yrs` : 'N/A'}`;
            context.fillText(ageStr, canvas.width - (24 * scale), 75 * scale);

            const genderStr = `⚥ Gender / جنس: ${patient.gender || 'N/A'}`;
            context.fillText(genderStr, canvas.width - (24 * scale), 115 * scale);
            
            // Reset text alignment for rendering standard drawing
            context.textAlign = 'left';
            
            // Draw the actual drawing SVG starting below the header
            context.drawImage(image, 0, headerHeight * scale, originalWidth * scale, originalHeight * scale);
            
            // Draw Measurement Note / پیمائش کا نوٹ inside canvas footer if present
            if (footerHeight > 0) {
              const footerY = (headerHeight + originalHeight) * scale;
              
              // Fill footer background block
              context.fillStyle = '#f8fafc';
              context.fillRect(0, footerY, canvas.width, footerHeight * scale);
              
              // Top border for footer
              context.strokeStyle = '#e2e8f0';
              context.lineWidth = 1 * scale;
              context.beginPath();
              context.moveTo(0, footerY);
              context.lineTo(canvas.width, footerY);
              context.stroke();
              
              // Draw label (soft blue accent or dark label)
              context.fillStyle = '#3b82f6';
              context.font = `bold ${18 * scale}px system-ui, -apple-system, sans-serif`;
              context.fillText("📝 Measurement Note / پیمائش کا نوٹ:", 24 * scale, footerY + 30 * scale);
              
              // Draw note text wrapping
              context.fillStyle = '#1e293b';
              context.font = `bold ${16 * scale}px system-ui, -apple-system, sans-serif`;
              
              const textX = 24 * scale;
              const textY = footerY + 60 * scale;
              let currentY = textY;
              const lineHeight = 24 * scale;
              
              for (const line of wrappedLines) {
                context.fillText(line, textX, currentY);
                currentY += lineHeight;
              }
            }
            
            canvas.toBlob((blob) => {
              triggerDownloadDrawing(blob);
              URL.revokeObjectURL(svgUrl);
            }, 'image/png');
          } else {
            triggerDownloadDrawing(null);
            URL.revokeObjectURL(svgUrl);
          }
        } catch (err) {
          console.error("Canvas error", err);
          triggerDownloadDrawing(null);
          URL.revokeObjectURL(svgUrl);
        }
      };
      
      image.onerror = (err) => {
        console.warn("SVG loaded via Blob failed (falling back to Data URL Base64)...", err);
        try {
          // Robust Unicode-safe Base64 conversion
          const svgBase64 = btoa(
            encodeURIComponent(processedSvgString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
              return String.fromCharCode(parseInt(p1, 16));
            })
          );
          const fallbackUrl = `data:image/svg+xml;base64,${svgBase64}`;
          
          const fallbackImage = new Image();
          fallbackImage.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const originalWidth = parseFloat(viewWidth);
              const originalHeight = parseFloat(viewHeight);
              const headerHeight = 145; // Shorter header height with Hospital removed
              const scale = 2;
              
              canvas.width = originalWidth * scale;
              canvas.height = (originalHeight + headerHeight + footerHeight) * scale;
              
              const context = canvas.getContext('2d');
              if (context) {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                context.fillStyle = '#f8fafc';
                context.fillRect(0, 0, canvas.width, headerHeight * scale);
                
                context.fillStyle = '#3b82f6';
                context.fillRect(0, 0, canvas.width, 6 * scale);
                
                context.strokeStyle = '#e2e8f0';
                context.lineWidth = 1 * scale;
                context.beginPath();
                context.moveTo(0, headerHeight * scale);
                context.lineTo(canvas.width, headerHeight * scale);
                context.stroke();
                
                context.fillStyle = '#1e293b';
                context.font = `bold ${16 * scale}px system-ui, -apple-system, sans-serif`;
                const patientNameStr = patient.name ? patient.name.trim() : 'N/A';
                context.fillText(`👤 Patient / مریض: ${patientNameStr}`, 24 * scale, 35 * scale);
                
                context.fillStyle = '#475569';
                context.font = `bold ${12 * scale}px system-ui, -apple-system, sans-serif`;
                const fileIdStr = patient.patientId || patient.id || 'N/A';
                context.fillText(`🆔 File ID / فائل آئی ڈی: ${fileIdStr}`, 24 * scale, 75 * scale);

                const addressStr = patient.address ? patient.address.trim() : 'N/A';
                context.fillText(`📍 Address / پتہ: ${addressStr}`, 24 * scale, 115 * scale);
                
                context.fillStyle = '#2563eb';
                context.textAlign = 'right';
                context.font = `bold ${12 * scale}px system-ui, -apple-system, sans-serif`;
                const dateStr = `📅 Date / تاریخ: ${new Date(patient.date || Date.now()).toLocaleDateString()}`;
                context.fillText(dateStr, canvas.width - (24 * scale), 35 * scale);

                context.fillStyle = '#475569';
                const ageStr = `🎂 Age / عمر: ${patient.age ? `${patient.age} Yrs` : 'N/A'}`;
                context.fillText(ageStr, canvas.width - (24 * scale), 75 * scale);

                const genderStr = `⚥ Gender / جنس: ${patient.gender || 'N/A'}`;
                context.fillText(genderStr, canvas.width - (24 * scale), 115 * scale);
                
                context.textAlign = 'left';
                context.drawImage(fallbackImage, 0, headerHeight * scale, originalWidth * scale, originalHeight * scale);
                
                // Draw Measurement Note / پیمائش کا نوٹ inside canvas footer if present
                if (footerHeight > 0) {
                  const footerY = (headerHeight + originalHeight) * scale;
                  
                  // Fill footer background block
                  context.fillStyle = '#f8fafc';
                  context.fillRect(0, footerY, canvas.width, footerHeight * scale);
                  
                  // Top border for footer
                  context.strokeStyle = '#e2e8f0';
                  context.lineWidth = 1 * scale;
                  context.beginPath();
                  context.moveTo(0, footerY);
                  context.lineTo(canvas.width, footerY);
                  context.stroke();
                  
                  // Draw label (soft blue accent or dark label)
                  context.fillStyle = '#3b82f6';
                  context.font = `bold ${18 * scale}px system-ui, -apple-system, sans-serif`;
                  context.fillText("📝 Measurement Note / پیمائش کا نوٹ:", 24 * scale, footerY + 30 * scale);
                  
                  // Draw note text wrapping
                  context.fillStyle = '#1e293b';
                  context.font = `bold ${16 * scale}px system-ui, -apple-system, sans-serif`;
                  
                  const textX = 24 * scale;
                  const textY = footerY + 60 * scale;
                  let currentY = textY;
                  const lineHeight = 24 * scale;
                  
                  for (const line of wrappedLines) {
                    context.fillText(line, textX, currentY);
                    currentY += lineHeight;
                  }
                }
                
                canvas.toBlob((blob) => {
                  triggerDownloadDrawing(blob);
                }, 'image/png');
              } else {
                triggerDownloadDrawing(null);
              }
            } catch (canvasErr) {
              console.error("Fallback canvas processing error", canvasErr);
              triggerDownloadDrawing(null);
            }
          };
          
          fallbackImage.onerror = (fbErr) => {
            console.error("All SVG image loading methods failed.", fbErr);
            triggerDownloadDrawing(null);
          };
          
          fallbackImage.src = fallbackUrl;
        } catch (fallBackCreateError) {
          console.error("Failed to construct fallback data URL content", fallBackCreateError);
          triggerDownloadDrawing(null);
        }
        URL.revokeObjectURL(svgUrl);
      };
      
      image.src = svgUrl;
    } catch (err) {
      console.error("Download drawing failure", err);
      triggerDownloadDrawing(null);
    }
  };

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
            el.style.width = '794px';
            el.style.padding = '40px';
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

      const margin = 5; // 5mm margin to keep it breathing inside 1 page
      const pdfWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pdfHeight = pdf.internal.pageSize.getHeight() - (margin * 2);
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      let finalWidth = pdfWidth;
      let finalHeight = (canvasHeight * pdfWidth) / canvasWidth;
      
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = (canvasWidth * pdfHeight) / canvasHeight;
      }

      const xOffset = margin + (pdfWidth - finalWidth) / 2;
      const yOffset = margin + (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');
      
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

  const downloadImageSecurely = async (url: string, filename: string) => {
    try {
      let blob: Blob;
      if (url.startsWith('data:')) {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: mime });
      } else {
        const response = await fetch(url, { referrerPolicy: 'no-referrer' });
        blob = await response.blob();
      }
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      console.warn("Secure download helper failed, falling back to traditional download:", err);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.target = '_blank';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleWhatsAppShare = async () => {
    if (!patient.name) {
      alert("Please ensure patient name is completed before sharing.");
      return;
    }

    let messageText = `🩺 *CLINICAL ASSESSMENT SUMMARY / خلاصہ طبی معائنہ*\n\n`;
    messageText += `*👤 PATIENT DETAILS / معلومات مریض* (🟢 *GREEN COLOR GROUP*)\n`;
    messageText += `🟢 File ID: *${patient.patientId || 'N/A'}*\n`;
    messageText += `🟢 Name / نام: *${patient.name || 'N/A'}*\n`;
    if (patient.phone) {
      messageText += `🟢 Mob No / موبائل: *${patient.phone}*\n`;
    }
    messageText += `🟢 Age / Gender: *${patient.age > 0 ? `${patient.age} Yrs` : 'N/A'} / ${patient.gender || 'N/A'}*\n`;
    messageText += `🟢 Date / تاریخ: *${patient.date || new Date().toLocaleDateString()}*\n`;
    if (patient.address) {
      messageText += `🔵 *ADDRESS / پتہ* (🔵 *BLUE COLOR GROUP*)\n`;
      messageText += `🔵 Address / پتہ: *${patient.address}*\n`;
    }
    messageText += `\n`;

    messageText += `*📦 GARMENT CONFIGURATION / گارمنٹ کنفیگریشن*\n`;
    messageText += `• Garment Type: *${garment.type === 'All Gloves/Glove With Sleeve' ? 'Gloves' : (garment.type || 'N/A')}*\n`;
    messageText += `• Silicone Option: *${garment.siliconePasting || 'N/A'}*\n`;
    messageText += `• Compression Force: *${garment.compression || 'N/A'}*\n`;
    messageText += `\n`;

    // Add normal measurements if they exist and are filled
    const activeMeasurements = measurements.filter(m => m.value && m.value.trim() !== '');
    if (activeMeasurements.length > 0) {
      messageText += `*📐 CORE MEASUREMENTS / پیمائش*\n`;
      activeMeasurements.forEach(m => {
        messageText += `• ${m.label}: *${m.value}*\n`;
      });
      messageText += `\n`;
    }

    // Add sub-options / hand measurements if they exist
    if (garment.subOptions) {
      const activeSubOptions = Object.entries(garment.subOptions).filter(([key, val]) => key !== 'Custom Design Notes' && key !== 'doctorNotes' && typeof val === 'string' && val.trim() !== '');
      if (activeSubOptions.length > 0) {
        messageText += `*✍️ CUSTOM DESIGN OPTIONS / اضافی تفصیلات*\n`;
        activeSubOptions.forEach(([key, val]) => {
          messageText += `• ${key}: *${val}*\n`;
        });
        messageText += `\n`;
      }
    }

    // 1. Doctor's Notes & Case History (🔴 RED COLOR GROUP)
    if (patient.notes) {
      messageText += `🔴 *🩺 DOCTOR'S NOTES & CASE HISTORY / ڈاکٹر کے نوٹس اور ہسٹری* (🔴 *RED COLOR GROUP*)\n`;
      messageText += `🔴 "${patient.notes}"\n\n`;
    }

    // 2. Garment Configuration Note
    if (garmentNotes) {
      messageText += `🔴 *📝 GARMENT CONFIGURATION NOTE / پیمائش کے نوٹ*\n`;
      messageText += `🔴 "${garmentNotes}"\n\n`;
    }

    // 3. Custom Design Notes
    const customDesignNotes = garment.subOptions?.['Custom Design Notes'];
    if (customDesignNotes) {
      messageText += `🔴 *✍️ CUSTOM DESIGN NOTES / اضافی ڈیزائن نوٹس*\n`;
      messageText += `🔴 "${customDesignNotes}"\n\n`;
    }

    messageText += `*Generated via Overplast Live Calibration Portal*`;

    // Try sharing via Web Share API with files if image is available, supported and allowed
    const photoUrl = photos && photos.length > 0 ? photos[photos.length - 1] : null;

    if (photoUrl) {
      // Download photo
      await downloadImageSecurely(photoUrl, `Patient_${(patient.name || 'Photo').replace(/\s+/g, '_')}_details.jpg`);

      // Try to copy summary text to clipboard for convenience
      try {
        await navigator.clipboard.writeText(messageText);
      } catch (cErr) {
        console.warn("Clipboard text write blocked:", cErr);
      }

      alert(
        "📱 WHATSAPP SHARING / واٹس ایپ شیئرنگ\n\n" +
        "✅ Patient assessment text has been copied to your clipboard!\n" +
        "✅ Patient photo has been downloaded to your device!\n\n" +
        "👉 We are opening WhatsApp. Simply select a contact, paste (Ctrl+V or Long-Press) the text summary, and attach the patient photo from your device gallery!\n\n" +
        "معلومات مینیو کاپی ہو چکی ہیں اور تصویر ڈاؤن لوڈ ہو گئی ہے۔ واٹس ایپ اوپن ہونے کے بعد معلومات پیسٹ کریں اور گیلری سے مریض کی تصویر اٹیچ کر لیں۔"
      );
    } else {
      // Try to copy summary text to clipboard
      try {
        await navigator.clipboard.writeText(messageText);
        alert(
          "📱 SUMMARY COPIED / معلومات کاپی ہو گئیں\n\n" +
          "✅ Patient assessment text has been copied to your clipboard!\n" +
          "👉 Open WhatsApp and paste (Ctrl+V) the text summary into your chat!\n\n" +
          "معلومات مینیو کاپی ہو چکی ہیں۔ واٹس ایپ میں جا کر پیسٹ کر کے سینڈ کر دیں۔"
        );
      } catch (cErr) {
        console.warn("Clipboard text write blocked:", cErr);
      }
    }

    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSharePhotoOnly = async () => {
    const photoUrl = photos && photos.length > 0 ? photos[photos.length - 1] : null;
    if (!photoUrl) {
      alert("No patient photo found to share.");
      return;
    }

    let isCopied = false;

    try {
      let blob: Blob;
      if (photoUrl.startsWith('data:')) {
        const arr = photoUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[arr.length - 1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: mime });
      } else {
        const response = await fetch(photoUrl, { referrerPolicy: 'no-referrer' });
        blob = await response.blob();
      }

      // Convert to png if it isn't png, as Clipboard API generally only allows 'image/png'
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (pngBlob) {
            blob = pngBlob;
          }
        }
      }

      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      isCopied = true;
    } catch (err) {
      console.error("Clipboard copy failed directly, trying canvas fallback:", err);
      // Fallback with Image canvas
      try {
        isCopied = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = photoUrl;
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || img.width;
              canvas.height = img.naturalHeight || img.height;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    try {
                      const item = new ClipboardItem({ [blob.type]: blob });
                      await navigator.clipboard.write([item]);
                      resolve(true);
                    } catch (clipErr) {
                      console.warn("Canvas Clipboard write failed:", clipErr);
                      resolve(false);
                    }
                  } else {
                    resolve(false);
                  }
                }, "image/png");
              } else {
                resolve(false);
              }
            } catch (canvasErr) {
              console.warn("Canvas failed:", canvasErr);
              resolve(false);
            }
          };
          img.onerror = () => resolve(false);
        });
      } catch (innerErr) {
        console.error("Canvas outer fallback failed:", innerErr);
      }
    }

    // Always attempt auto-download so they definitely have a file copy as well
    try {
      await downloadImageSecurely(photoUrl, `Patient_${(patient.name || 'Photo').replace(/\s+/g, '_')}_photo.jpg`);
    } catch (dErr) {
      console.warn("Auto-download failed:", dErr);
    }

    if (isCopied) {
      alert(
        "📋 IMAGE COPIED / تصویر کاپی ہوگئی\n\n" +
        "✅ Patient clinical photo has been successfully COPIED to your clipboard!\n" +
        "✅ Image has also been downloaded to your device as backup!\n\n" +
        "👉 Now, we are opening WhatsApp. Simply select a chat and paste (Ctrl+V or Long-Press -> Paste) to share the picture instantly!\n\n" +
        "تصویر کامیابی سے کاپی ہو گئی ہے۔ اب واٹس ایپ اوپن ہو رہا ہے، وہاں جا کر گیلری سے تصویر اٹیچ کر لیں یا براہ راست پیسٹ (Paste) کر کے بھیج دیں۔"
      );
    } else {
      alert(
        "📸 PHOTO READY / تصویر تیار ہے\n\n" +
        "✅ Patient clinical photo has been downloaded to your device!\n\n" +
        "👉 We are opening WhatsApp. Simply select a contact, click attach (Clip icon), and choose the downloaded picture from your device gallery!\n\n" +
        "مریض کی تصویر ڈاؤن لوڈ ہو گئی ہے۔ اب واٹس ایپ اوپن ہو رہا ہے، گیلری میں جا کر ڈاؤن لوڈ کی گئی تصویر کو اٹیچ کر کے بھیج دیں۔"
      );
    }

    const imageText = `📸 *PATIENT OPTICAL REPORT SUMMARY / رپورٹ خلاصہ*\n• Patient / مریض: *${patient.name || 'N/A'}*\n• File ID: *${patient.patientId || 'N/A'}*\n\n👉 *Please paste (Ctrl+V or Long Press and Paste) the copied patient photo into the chat, or select the downloaded photo from your device's gallery!*\n\n*Generated via Overplast Live Calibration Portal*`;
    const encodedText = encodeURIComponent(imageText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
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
        patient_id: patient.id || 'anonymous',
        patient_name: patient.name,
        hospital_name: patient.hospitalName || 'Health Institute',
        doctor_ref: patient.doctorRef || 'N/A',
        garment_type: garment.type,
        silicone_pasting: garment.siliconePasting,
        compression: garment.compression,
        measurements: measurements,
        notes: garmentNotes || '',
        sub_options: {
          ...(garment.subOptions || {}),
          doctorNotes: patient.notes || ''
        },
        age: patient.age ? Number(patient.age) : 0,
        gender: patient.gender || 'other',
        city: patient.city || '',
        photos: photos,
        photo_url: photos.length > 0 ? photos[photos.length - 1] : undefined
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

                    {/* Additional Garment Config: Color & Notes */}
                    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-lg space-y-6">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest text-blue-600 font-sans">
                          Additional Garment Options
                        </h4>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                          Specify custom apparel details & remarks
                        </p>
                      </div>

                      {/* Garment Color Selection */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-relaxed block font-sans">
                          GARMENT COLOR / لباس کا رنگ
                        </label>
                        <textarea
                          placeholder="Type custom color here (e.g., Beige Skin, Light Pink, Custom Black...)"
                          value={garment.subOptions?.['Color'] || ''}
                          onChange={(e) => setGarment(prev => ({
                            ...prev,
                            subOptions: {
                              ...prev.subOptions,
                              'Color': e.target.value
                            }
                          }))}
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-300 transition-all font-sans"
                        />
                      </div>

                      {/* Measurement Notes Input */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-relaxed block font-sans">
                            GARMENT CONFIGURATION NOTE / پیمائش کے نوٹ
                          </label>
                          <span className="text-[9px] text-slate-400 font-bold uppercase font-sans">
                            ({countWords(garmentNotes)}/500 words)
                          </span>
                        </div>
                        <textarea
                          placeholder="Write down any special measurements instructions, scar particulars, or physical condition details here..."
                          value={garmentNotes}
                          onChange={(e) => handleGarmentNotesChange(e.target.value)}
                          rows={4}
                          className="w-full text-sm font-semibold p-4 rounded-2xl border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50/50 text-slate-800 placeholder:text-slate-300 transition-all font-sans"
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
                        <option value="All Gloves/Glove With Sleeve">Gloves</option>
                        <option value="Belly Binder">Belly Binder</option>
                        <option value="All Trouser">All Trouser</option>
                        <option value="All Leg Sleeves">All Leg Sleeves</option>
                        <option value="All Socks">All Socks</option>
                        <option value="Body Shaper">Body Shaper</option>
                      </select>
                    </div>

                    {/* Glove Hand Selection - Right Hand / Left Hand Option */}
                    {garment.type === 'All Gloves/Glove With Sleeve' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-blue-600" />
                          Glove Hand Option (دستانہ ہاتھ کا انتخاب)
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { value: 'Right Hand Glove', label: 'Right Hand Glove', native: 'Right Hand (سیدھا ہاتھ)' },
                            { value: 'Left Hand Glove', label: 'Left Hand Glove', native: 'Left Hand (الٹا ہاتھ)' },
                            { value: 'Both Hand Glove', label: 'Both Hand Glove', native: 'Both Hands (دونوں ہاتھ)' }
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
                    {(GARMENT_FIELDS[garment.type] || (garment.type === 'All Gloves/Glove With Sleeve' && garment.subOptions?.['Hand Selection'] === 'Both Hand Glove')) && (() => {
                      const isBothHandGlove = garment.type === 'All Gloves/Glove With Sleeve' && garment.subOptions?.['Hand Selection'] === 'Both Hand Glove';
                      const activeGarmentFields = isBothHandGlove
                        ? [
                            { id: 'rh_palm', label: 'Right Hand Palm', placeholder: 'e.g., 20 cm' },
                            { id: 'lh_palm', label: 'Left Hand Palm', placeholder: 'e.g., 20 cm' },
                            { id: 'rh_wrist', label: 'Right Hand Wrist', placeholder: 'e.g., 16 cm' },
                            { id: 'lh_wrist', label: 'Left Hand Wrist', placeholder: 'e.g., 16 cm' },
                            { id: 'rh_thumb', label: 'Right Hand Thumb', placeholder: 'e.g., 5.5 cm' },
                            { id: 'lh_thumb', label: 'Left Hand Thumb', placeholder: 'e.g., 5.5 cm' },
                            { id: 'rh_index_finger', label: 'Right Hand Index finger', placeholder: 'e.g., 7.5 cm' },
                            { id: 'lh_index_finger', label: 'Left Hand Index finger', placeholder: 'e.g., 7.5 cm' },
                            { id: 'rh_middle_finger', label: 'Right Hand Middle finger', placeholder: 'e.g., 8 cm' },
                            { id: 'lh_middle_finger', label: 'Left Hand Middle finger', placeholder: 'e.g., 8 cm' },
                            { id: 'rh_ring_finger', label: 'Right Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
                            { id: 'lh_ring_finger', label: 'Left Hand Ring finger', placeholder: 'e.g., 7.5 cm' },
                            { id: 'rh_little_finger', label: 'Right Hand Little finger', placeholder: 'e.g., 6 cm' },
                            { id: 'lh_little_finger', label: 'Left Hand Little finger', placeholder: 'e.g., 6 cm' },
                            { id: 'rh_total_len_medal_to_scar', label: 'Right Hand Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' },
                            { id: 'lh_total_len_medal_to_scar', label: 'Left Hand Total length middle finger to end of scar', placeholder: 'e.g., 35 cm' }
                          ]
                        : (GARMENT_FIELDS[garment.type] || []);

                      return (
                        <div className="mt-8 space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 text-blue-600">
                              {garment.type === 'All Gloves/Glove With Sleeve' ? 'Gloves' : garment.type} Specifications
                            </h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                              Provide precise custom measurements/details for the following parameters
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeGarmentFields.map(opt => (
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
                      );
                    })()}

                    {/* Custom Design Notes Option */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                      <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Custom Design Notes (اضافی ڈیزائن نوٹس)
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Enter custom styling details, zipper preferences, extra support straps specifications... (تفصیلی ڈیزائن اور گارمنٹ کی ہدایات یہاں درج کریں)"
                        value={garment.subOptions?.['Custom Design Notes'] || ''}
                        onChange={(e) => setGarment(prev => ({
                          ...prev,
                          subOptions: {
                            ...(prev.subOptions || {}),
                            'Custom Design Notes': e.target.value
                          }
                        }))}
                        className="w-full px-5 py-4 bg-white border-2 border-slate-100/80 hover:border-slate-200 focus:border-blue-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-50/50 outline-none transition-all shadow-sm resize-none"
                      />
                    </div>

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

                  <div className="max-w-6xl mx-auto space-y-8">
                    {/* Centered Large Vector Illustration Panel */}
                    <div className="bg-white border-2 border-slate-100 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 md:p-12 shadow-xl flex flex-col items-center justify-center relative min-h-[440px] sm:min-h-[580px] md:min-h-[720px] animate-in zoom-in-95 duration-500">
                      
                      {/* Top responsive banner with Patient info, Hospital, File ID, Age, Gender, Date, Address */}
                      <div className="w-full border-b border-dashed border-slate-200 pb-5 mb-6 max-w-[950px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-blue-100">
                              <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">LIVE BLUEPRINT CALIBRATION</span>
                            </div>
                          </div>
                          
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Interactive Measurement Drawing Specifications
                          </div>
                        </div>

                        {/* Grid of details */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full">
                          {/* 1. Name */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">PATIENT / مریض</span>
                            <span className="text-xs font-black text-slate-900 block truncate" title={patient.name || 'N/A'}>{patient.name || 'N/A'}</span>
                          </div>

                          {/* 2. File ID */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">FILE ID / فائل آئی ڈی</span>
                            <span className="text-xs font-black text-slate-900 block truncate font-mono" title={patient.patientId || patient.id || 'N/A'}>{patient.patientId || patient.id || 'N/A'}</span>
                          </div>

                          {/* 4. Age */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">AGE / عمر</span>
                            <span className="text-xs font-black text-slate-900 block truncate">{patient.age ? `${patient.age} Yrs` : 'N/A'}</span>
                          </div>

                          {/* 5. Gender */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">GENDER / جنس</span>
                            <span className="text-xs font-black text-slate-900 block truncate capitalize">{patient.gender || 'N/A'}</span>
                          </div>

                          {/* 6. Date */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">DATE / تاریخ</span>
                            <span className="text-xs font-black text-slate-800 block truncate">{patient.date ? new Date(patient.date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                          </div>

                          {/* 6. Address */}
                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider leading-none mb-0.5">ADDRESS / پتہ</span>
                            <span className="text-xs font-black text-slate-800 block truncate" title={patient.address || 'N/A'}>{patient.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div id="measurement-drawing-container" className="w-full max-w-[950px] aspect-square flex items-center justify-center p-1 sm:p-4 md:p-6 transform hover:scale-101 transition-transform duration-350">
                        {renderMeasurementDrawingSvg()}
                      </div>

                      <div className="mt-4 sm:mt-6 text-center flex flex-col items-center">
                        <p className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wider">
                          Reactive Calibration Graph ({garment.type === 'All Gloves/Glove With Sleeve' ? 'Gloves' : garment.type})
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mt-1">
                          Calculated relative measurements mapping for production line
                        </p>

                        {/* Measurement Note Text Box */}
                        <div className="w-full max-w-[500px] mt-6 px-4 text-left">
                          <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-relaxed block font-sans mb-2">
                            Measurement Note / پیمائش کا نوٹ
                          </label>
                          <textarea
                            placeholder="Write down any special measurements notes or instructions for this drawing..."
                            value={garmentNotes}
                            onChange={(e) => handleGarmentNotesChange(e.target.value)}
                            rows={3}
                            className="w-full text-sm font-semibold p-3.5 rounded-2xl border-2 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none bg-slate-50/50 text-slate-800 placeholder:text-slate-300 transition-all font-sans shadow-sm"
                          />
                        </div>

                        {/* Download Drawing Action Button */}
                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={handleDownloadDrawing}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-100 hover:scale-102 active:scale-98 transition-all duration-250 font-black text-xs uppercase tracking-wider select-none focus:outline-none focus:ring-4 focus:ring-blue-100"
                          >
                            <Download className="w-4 h-4 text-white inline-block align-middle" />
                            <span>Download Drawing / نقشہ ڈاؤن لوڈ کریں</span>
                          </button>
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

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 p-8 bg-blue-50/60 rounded-[2.5rem] border border-blue-100/40 space-y-8 flex flex-col justify-between">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 border-b border-blue-100 pb-3">
                          <User className="w-4 h-4" /> Patient Demographics & Info
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Patient File ID</p>
                            <p className="text-sm font-black text-green-700 font-mono mt-0.5">{patient.patientId || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Patient Name</p>
                            <p className="text-sm font-black text-green-700 mt-0.5">{patient.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Age & Gender</p>
                            <p className="text-sm font-bold text-green-700 capitalize mt-0.5">
                              {patient.age > 0 ? `${patient.age} Years` : 'N/A'} / {patient.gender || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Contact Phone</p>
                            <p className="text-sm font-bold text-green-700 mt-0.5 font-mono">{patient.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-wider">City / Location</p>
                            <p className="text-sm font-bold text-blue-700 mt-0.5">{patient.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Registration Date</p>
                            <p className="text-sm font-bold text-green-700 mt-0.5 font-mono">{patient.date || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Assigned Institution / Hospital</p>
                            <p className="text-sm font-bold text-green-700 mt-0.5">{patient.hospitalName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-green-500 uppercase tracking-wider">Referring Doctor</p>
                            <p className="text-sm font-bold text-green-700 mt-0.5">{patient.doctorRef || 'N/A'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-wider">Home Address</p>
                            <p className="text-xs font-semibold text-blue-700 mt-0.5 leading-relaxed">{patient.address || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Patient Uploaded Clinical Image Display */}
                      {photos && photos.length > 0 && (
                        <div className="pt-6 border-t border-blue-100/60 space-y-3">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Uploaded Clinical Patient Photo</p>
                          <div className="relative group w-full max-w-sm rounded-[2rem] overflow-hidden border border-blue-200/60 bg-white p-2.5 shadow-sm transition-all hover:shadow-md">
                            <img 
                              src={photos[photos.length - 1]} 
                              alt="Clinical Measurement Snapshot" 
                              className="w-full h-44 object-cover rounded-[1.5rem]"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {isAdmin && (
                            <button
                              onClick={handleSharePhotoOnly}
                              className="w-full max-w-sm py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 border border-transparent shadow-md hover:scale-[1.02] cursor-pointer"
                            >
                              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                                <path d="M12.012 2c-5.506 0-9.988 4.475-9.988 9.977 0 1.764.46 3.42 1.258 4.876L2 22l5.3-1.383c1.4.764 2.99 1.192 4.697 1.192 5.508 0 9.99-4.476 9.99-9.982C22.012 6.477 17.525 2 12.012 2zm6.39 14.125c-.262.733-1.528 1.343-2.112 1.404-.567.06-1.12.23-3.626-.8-3.208-1.32-5.282-4.578-5.442-4.793-.16-.214-1.288-1.705-1.288-3.253 0-1.548.814-2.31 1.103-2.613.29-.304.633-.38.844-.38.21 0 .422.003.606.012.193.008.455-.074.71.554.264.65.903 2.192.98 2.348.08.156.133.338.028.544-.105.206-.16.333-.316.516-.156.182-.327.406-.467.545-.154.153-.314.32-.136.623.18.303.8 1.3 1.714 2.113.117.104.225.21.32.31.78.825 1.454 1.053 1.768 1.185.314.133.5.112.686-.098.187-.21.802-.93.1017-1.246.216-.317.433-.266.727-.156.294.11 1.86.877 2.177 1.033.317.156.527.23.605.367.078.136.078.79-.184 1.523z" />
                              </svg>
                              COPY IMAGE & SHARE / امیج کاپی کریں اور واٹس ایپ
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Compression and Specification verification */}
                    <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
                      <div className="p-8 bg-purple-50 rounded-[2.5rem] space-y-6">
                        <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 border-b border-purple-100 pb-3">
                          <FileText className="w-3 h-3" /> Clinical & Compression Specs
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[8px] font-black text-purple-300 uppercase">Garment Type</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{garment.type === 'All Gloves/Glove With Sleeve' ? 'Gloves' : garment.type}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-purple-300 uppercase">Silicone Option</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{garment.siliconePasting}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-purple-300 uppercase">Compression Force</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5">{garment.compression}</p>
                          </div>
                          {garment.subOptions && Object.entries(garment.subOptions).filter(([_, v]) => v).length > 0 && (
                            <div className="pt-2 border-t border-purple-100 space-y-2">
                              <p className="text-[8px] font-black text-purple-400 uppercase">Custom Sub-Options</p>
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

                      <div className="p-8 bg-emerald-50 rounded-[2.5rem] space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b border-emerald-100 pb-3">
                          <Activity className="w-3 h-3" /> Specification Matrix
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[8px] font-black text-emerald-300 uppercase">Anatomical Parameters</p>
                            <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                              {(() => {
                                const isBothHandGlove = garment.type === 'All Gloves/Glove With Sleeve' && garment.subOptions?.['Hand Selection'] === 'Both Hand Glove';
                                const totalExpected = isBothHandGlove ? 18 : (GARMENT_FIELDS[garment.type] || []).length;
                                return `${Object.values(garment.subOptions || {}).filter(Boolean).length} / ${totalExpected}`;
                              })()} Specified
                            </p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-emerald-300 uppercase">Status</p>
                            <p className="text-sm font-black text-emerald-600 mt-0.5">Calibration & Diagnostics Verified</p>
                          </div>
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

                    {isAdmin && (
                      <button 
                        onClick={handleWhatsAppShare}
                        className="btn-primary px-5 py-4 sm:px-10 sm:py-6 text-xs sm:text-base flex items-center justify-center gap-2 sm:gap-4 bg-emerald-600 hover:bg-emerald-700 shadow-2xl hover:scale-105 transition-transform w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 fill-current text-white" viewBox="0 0 24 24">
                          <path d="M12.012 2c-5.506 0-9.988 4.475-9.988 9.977 0 1.764.46 3.42 1.258 4.876L2 22l5.3-1.383c1.4.764 2.99 1.192 4.697 1.192 5.508 0 9.99-4.476 9.99-9.982C22.012 6.477 17.525 2 12.012 2zm6.39 14.125c-.262.733-1.528 1.343-2.112 1.404-.567.06-1.12.23-3.626-.8-3.208-1.32-5.282-4.578-5.442-4.793-.16-.214-1.288-1.705-1.288-3.253 0-1.548.814-2.31 1.103-2.613.29-.304.633-.38.844-.38.21 0 .422.003.606.012.193.008.455-.074.71.554.264.65.903 2.192.98 2.348.08.156.133.338.028.544-.105.206-.16.333-.316.516-.156.182-.327.406-.467.545-.154.153-.314.32-.136.623.18.303.8 1.3 1.714 2.113.117.104.225.21.32.31.78.825 1.454 1.053 1.768 1.185.314.133.5.112.686-.098.187-.21.802-.93.1017-1.246.216-.317.433-.266.727-.156.294.11 1.86.877 2.177 1.033.317.156.527.23.605.367.078.136.078.79-.184 1.523z" />
                        </svg>
                        SHARE ON WHATSAPP / واٹس ایپ
                      </button>
                    )}

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

                    {isAdmin && (
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
                    )}
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
          className="bg-white pdf-safe-zone p-8 flex flex-col justify-between"
          style={{ width: '794px', minHeight: '1123px', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-slate-900 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={logoImg} 
                    alt="OVERPLAST Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">OVERPLAST</h1>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1">Medical Compression</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">Measurement System</p>
                </div>
              </div>
              <div className="text-right max-w-[260px]">
                <h2 className="text-md font-black tracking-tight text-slate-900 uppercase">CLINICAL ASSESSMENT REPORT</h2>
                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider mt-1">Record ID</span>
                <span className="text-xs font-mono font-black text-slate-800 block break-all leading-none">{patient.patientId}</span>
              </div>
            </div>

            {/* Demographics Area */}
            <div className="grid grid-cols-2 gap-6 p-5 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PATIENT FULL NAME</span>
                  <span className="text-md font-extrabold text-slate-900">{patient.name || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Age / عمر</span>
                    <span className="text-xs font-bold text-slate-800">{patient.age ? `${patient.age} Yrs` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Gender / جنس</span>
                    <span className="text-xs font-bold text-slate-800 uppercase">{patient.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">City / شہر</span>
                    <span className="text-xs font-bold text-slate-800 uppercase">{patient.city || 'Karachi'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pl-6 border-l border-slate-200">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Doctor Reference / ریفرنس ڈاکٹر</span>
                  <span className="text-sm font-extrabold text-slate-800 block break-words leading-tight">{patient.doctorRef || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Created Date / تاریخ</span>
                  <span className="text-sm font-extrabold text-slate-800 block">
                    {new Date(patient.date).toLocaleDateString('ur-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Garment Configuration Specs */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Garment & Compression Configuration</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Unit</span>
                  <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{garment.type === 'All Gloves/Glove With Sleeve' ? 'Gloves' : (garment.type || 'N/A')}</span>
                </div>
                <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Compression</span>
                  <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{garment.compression || 'None'}</span>
                </div>
                <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Silicone Profile</span>
                  <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{garment.siliconePasting || 'None'}</span>
                </div>
                <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Color</span>
                  <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{garment.subOptions?.['Color'] || 'Standard'}</span>
                </div>
              </div>
            </div>

            {/* Blueprint Mapping, Custom Parameters & Clinical Upload section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Precision Sizing Blueprint & Calibration</h3>
              
              {photos.length > 0 ? (
                <div className="grid grid-cols-12 gap-5 items-stretch">
                  {/* Schematic Blueprint Drawing */}
                  <div className="col-span-5 rounded-3xl p-4 flex flex-col items-center justify-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Sizing Schematic Chart</span>
                    <div className="w-full flex flex-col items-center justify-center bg-white rounded-2xl p-3 shadow-sm border border-slate-100" style={{ minHeight: '180px' }}>
                      <div id="measurement-drawing-container-review-photo" className="w-[150px] h-[150px] flex items-center justify-center">
                        {renderMeasurementDrawingSvg()}
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadDrawing}
                        className="mt-2 text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Download className="w-3 h-3" />
                        Download Chart
                      </button>
                    </div>
                  </div>

                  {/* Calibration Parameters */}
                  <div className="col-span-4 space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Sizing Matrix</span>
                    <div className="border border-slate-100 rounded-3xl p-4 space-y-1.5" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', minHeight: '180px' }}>
                      {Object.entries(garment.subOptions || {})
                        .filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection')
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-xs pb-1 border-b border-dashed border-slate-200 last:border-none last:pb-0">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">{key}</span>
                            <span className="font-extrabold text-slate-900">
                              {new RegExp('^\\d+(\\.\\d+)?\\s*(cm|in)?$', 'i').test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : val}
                            </span>
                          </div>
                        ))}
                      {Object.entries(garment.subOptions || {}).filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No custom points registered.</p>
                      )}
                    </div>
                  </div>

                  {/* Clinical Upload Photo */}
                  <div className="col-span-3 rounded-3xl p-4 flex flex-col items-center justify-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Patient Photo / مریض کی تصویر</span>
                    <div className="w-full bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden" style={{ minHeight: '180px' }}>
                      <img 
                        src={photos[photos.length - 1]} 
                        alt="Patient Clinical upload" 
                        referrerPolicy="no-referrer"
                        className="max-h-[160px] w-auto object-contain rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-6 items-start">
                  {/* Blueprint Drawing */}
                  <div className="col-span-7 rounded-3xl p-5 flex flex-col items-center justify-center" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Sizing Schematic Chart</span>
                    <div className="w-full flex flex-col items-center justify-center bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <div id="measurement-drawing-container-review-no-photo" className="w-[200px] h-[200px] flex items-center justify-center">
                        {renderMeasurementDrawingSvg()}
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadDrawing}
                        className="mt-3 text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Sizing Chart / نقشہ ڈاؤن لوڈ کریں
                      </button>
                    </div>
                  </div>

                  {/* Sizing Specifications Table */}
                  <div className="col-span-5 space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Matrix Calibration Parameters</span>
                    <div className="border border-slate-100 rounded-3xl p-4 space-y-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      {Object.entries(garment.subOptions || {})
                        .filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection')
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-xs pb-1.5 border-b border-dashed border-slate-200 last:border-none last:pb-0">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">{key}</span>
                            <span className="font-extrabold text-slate-900">
                              {new RegExp('^\\d+(\\.\\d+)?\\s*(cm|in)?$', 'i').test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : val}
                            </span>
                          </div>
                        ))}
                      {Object.entries(garment.subOptions || {}).filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No custom points registered.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dr Notes Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Clinical & Configuration Notes / ضروری ہدایات</h3>
              
              {/* Patient's Doctor's Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Doctor's Notes & Case History / ڈاکٹر کے نوٹس</span>
                <p className="text-xs text-red-700 font-bold leading-relaxed p-3.5 rounded-xl whitespace-pre-wrap bg-red-50/50 border border-red-100 font-sans">
                  {patient.notes || "No Case History Notes registered."}
                </p>
              </div>

              {/* Garment Configuration Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Garment Configuration Note / پیمائش کے نوٹ</span>
                <p className="text-xs text-red-700 font-bold leading-relaxed p-3.5 rounded-xl whitespace-pre-wrap bg-red-50/50 border border-red-100 font-sans">
                  {garmentNotes || "No Garment Configuration Notes added."}
                </p>
              </div>

              {/* Custom Design Notes */}
              {garment.subOptions?.['Custom Design Notes'] && (
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider block">Custom Design Notes / اضافی ڈیزائن نوٹس</span>
                  <p className="text-xs text-red-700 font-bold leading-relaxed p-3.5 rounded-xl whitespace-pre-wrap bg-red-50/50 border border-red-100 font-sans">
                    {garment.subOptions['Custom Design Notes']}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest" style={{ borderTop: '1px solid #e2e8f0' }}>
            <span>SYSTEM VERIFIED CLINICAL MEMORANDUM / روکارڈ طی SIZING CALIBRATION PAGE 1 OF 1</span>
          </div>
        </div>
      </div>
    </div>
);
};

export default ClinicalAssessment;
