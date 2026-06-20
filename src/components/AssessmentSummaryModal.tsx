import React, { useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { 
  X, 
  FileText, 
  Phone, 
  MapPin, 
  Activity, 
  Calendar, 
  Hospital, 
  Stethoscope, 
  SlidersHorizontal,
  Download,
  AlertCircle
} from 'lucide-react';
import { Patient } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';

interface RegisteredAssessment {
  id: string;
  patient_name: string;
  hospital_name: string;
  doctor_ref: string;
  garment_type: string;
  silicone_pasting: string;
  compression: string;
  measurements: any;
  notes: string;
  sub_options: any;
  photos?: string[];
  created_at: string;
  age?: number;
  gender?: string;
  city?: string;
}

interface AssessmentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  assessmentPayload: RegisteredAssessment | null;
  onStartAssessment?: () => void;
}

const AssessmentSummaryModal: React.FC<AssessmentSummaryModalProps> = ({
  isOpen,
  onClose,
  patient,
  assessmentPayload,
  onStartAssessment
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [activeBothHandView, setActiveBothHandView] = useState<'Right' | 'Left'>('Right');
  const [isGenerating, setIsGenerating] = useState(false);
  const handSelectionVal = assessmentPayload?.sub_options?.['Hand Selection'] || 'Right Hand Glove';
  const isBoth = assessmentPayload?.garment_type === 'All Gloves/Glove With Sleeve' && handSelectionVal === 'Both Hand Glove';

  const getClinicalPhoto = (): string | undefined => {
    if (!assessmentPayload) return undefined;
    if (assessmentPayload.photo_url) return assessmentPayload.photo_url;
    if (assessmentPayload.photos && assessmentPayload.photos.length > 0) {
      return assessmentPayload.photos[assessmentPayload.photos.length - 1];
    }
    if (patient.photo_url) return patient.photo_url;
    return undefined;
  };

  if (!isOpen) return null;

  const formatVal = (label: string) => {
    if (!assessmentPayload) return '—';
    let lookupLabel = label;
    if (isBoth) {
      lookupLabel = `${activeBothHandView} Hand ${label}`;
    }
    let key = Object.keys(assessmentPayload.sub_options || {}).find(
      k => k.toLowerCase() === lookupLabel.toLowerCase()
    ) || lookupLabel;
    
    let val = assessmentPayload.sub_options?.[key];
    
    // Fallback mappings for backwards compatibility
    if (!val) {
      let fallbackKey = '';
      if (label === 'Open End') fallbackKey = 'Arm pit';
      else if (label === 'Close End') fallbackKey = 'Wrist';
      else if (label === 'Arm pit') fallbackKey = 'Open End';
      else if (label === 'Wrist') fallbackKey = 'Close End';
      else if (label === 'Middle finger') fallbackKey = 'Medal finger';
      else if (label === 'Index finger') fallbackKey = 'Left finger';
      else if (label === 'Ring finger') fallbackKey = 'Right finger';
      else if (label === 'Little finger') fallbackKey = 'Small finger';
      else if (label === 'Total length middle finger to wrist') fallbackKey = 'Total length medal finger to wrist';
      else if (label === 'Total length middle finger to end of scar') fallbackKey = 'Total length medal finger to end of scar';
      else if (label === 'Diaphrom') fallbackKey = 'Diaphrarm';
      else if (label === 'West (Waist)' || label === 'West' || label === 'Waist') fallbackKey = 'Waist';
      else if (label === 'Open End') fallbackKey = 'Open end thigh';
      else if (label === 'Close End (Leg end)') fallbackKey = 'Close end thigh';
      else if (label === 'Length Diaphrom to West' || label === 'Length Diaphrom to Waist') fallbackKey = 'length diaphragm to waist';
      else if (label === 'Short Length' || label === 'Waist to Close End') fallbackKey = 'Waist to Close End';
      else if (label === 'Belly') fallbackKey = 'Diaphrarm';
      else if (label === 'Hips') fallbackKey = 'Hips';
      else if (label === 'Round (Crotch)' || label === 'Round') fallbackKey = 'Open end thigh';
      else if (label === 'Thigh I') fallbackKey = 'Close end thigh';
      else if (label === 'Thigh II') fallbackKey = 'Thigh II';
      else if (label === 'Knee') fallbackKey = 'Knee';
      else if (label === 'Calf') fallbackKey = 'Calf';
      else if (label === 'Bottom') fallbackKey = 'Ankle';
      else if (label === 'Crotch Depth') fallbackKey = 'length diaphragm to waist';
      else if (label === 'Inseam (Inside Length)' || label === 'Inseam') fallbackKey = 'Inseam';
      else if (label === 'Total Length') fallbackKey = 'Length waist to ankle';
      
      if (fallbackKey) {
        key = Object.keys(assessmentPayload.sub_options || {}).find(
          k => k.toLowerCase() === fallbackKey.toLowerCase()
        ) || fallbackKey;
        val = assessmentPayload.sub_options?.[key];
      }
    }

    if (!val) return '—';
    const clean = String(val).trim();
    if (!clean) return '—';
    if (clean.toLowerCase().endsWith('cm')) return clean;
    return `${clean} cm`;
  };

  const renderAssessmentDrawingSvg = (assessment: RegisteredAssessment) => {
    switch (assessment.garment_type) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[320px]" style={{ minHeight: '260px' }}>
            <defs>
              <marker id="asm-arrow-blue-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="asm-arrow-emerald-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="asm-arrow-amber-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="asm-arrow-rose-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
              </marker>
            </defs>

            <ellipse cx="150" cy="155" rx="72" ry="92" fill="#f0f7ff" stroke="#3b82f6" strokeWidth="2.5" />
            <ellipse cx="150" cy="160" rx="46" ry="62" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" />

            <line x1="134" y1="145" x2="142" y2="145" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <line x1="158" y1="145" x2="166" y2="145" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <path d="M150,152 L150,165 L146,165" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />

            <path d="M62,110 Q150,95 238,110 L236,124 Q150,111 64,124 Z" fill="#bfdbfe" fillOpacity="0.70" stroke="#2563eb" strokeWidth="2" />
            <path d="M98,140 Q150,252 202,140" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="4 4" />

            <line x1="150" y1="102" x2="150" y2="218" stroke="#10b981" strokeWidth="2.5" markerStart="url(#asm-arrow-emerald-rg)" markerEnd="url(#asm-arrow-emerald-rg)" />

            <path d="M125,245 Q150,255 175,245 L175,270 Q150,280 125,270 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="150" y1="242" x2="150" y2="273" stroke="#dc2626" strokeWidth="2.5" markerStart="url(#asm-arrow-rose-rg)" markerEnd="url(#asm-arrow-rose-rg)" />

            <g transform="translate(150, 60)" className="text-[10px] font-black">
              <rect x="-60" y="-8" width="120" height="16" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>

            <g transform="translate(50, 195)" className="text-[10px] font-black">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>

            <g transform="translate(250, 195)" className="text-[10px] font-black">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>

            <g transform="translate(150, 305)" className="text-[10px] font-black">
              <rect x="-55" y="-8" width="110" height="16" rx="4" fill="white" stroke="#dc2626" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-rose-700 font-bold" fontSize="9">Neck Len: {formatVal('Neck length')}</text>
            </g>
          </svg>
        );

      case 'Connecting Sleeves':
      case 'Connecting Sleeves/Arm Sleeve':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            <ellipse cx="150" cy="45" rx="16" ry="20" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 142,60 L 142,85 C 145,88 155,88 158,85 L 158,60 Z" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 130,85 C 95,90 70,105 60,115 L 75,280 L 225,280 L 240,115 C 230,105 205,90 170,85 Z" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />

            <path 
              d="M 120,90 Q 150,105 180,90 C 210,95 225,103 235,115 Q 252,187 252,260 L 238,258 Q 225,187 205,145 Q 150,132 95,145 Q 75,187 62,258 L 48,260 Q 48,187 65,115 C 75,103 90,95 120,90 Z" 
              fill="#eff6ff" 
              fillOpacity="0.85"
              stroke="#2563eb" 
              strokeWidth="2" 
            />

            <line x1="65" y1="115" x2="235" y2="115" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="65" cy="115" r="3.5" fill="#2563eb" />
            <circle cx="235" cy="115" r="3.5" fill="#2563eb" />

            <ellipse cx="79" cy="131" rx="15" ry="5" transform="rotate(-40, 79, 131)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            {/* 3. Open End loop on left sleeve (between Arm pit and Elbow) */}
            <ellipse cx="72.5" cy="156.5" rx="13" ry="4" transform="rotate(-40, 72.5, 156.5)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <ellipse cx="66" cy="182" rx="11" ry="4" transform="rotate(-40, 66, 182)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <ellipse cx="55" cy="259" rx="8" ry="3" transform="rotate(-40, 55, 259)" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <path d="M 65,115 Q 52,185 48,260" stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="3 3" fill="none" />

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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
            <polygon points="190,85 78,175 102,205 230,135" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
            <ellipse cx="210" cy="110" rx="26" ry="12" transform="rotate(56, 210, 110)" fill="#eff6ff" stroke="#10b981" strokeWidth="2" />
            <ellipse cx="149" cy="148" rx="20" ry="10" transform="rotate(56, 149, 148)" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
            <ellipse cx="90" cy="190" rx="16" ry="8" transform="rotate(56, 90, 190)" fill="#dbeafe" stroke="#ec4899" strokeWidth="2" />

            <line x1="175" y1="75" x2="55" y2="155" stroke="#7c3aed" strokeWidth="2" />
            <path d="M 163,77 L 175,75 L 173,87" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 67,153 L 55,155 L 57,143" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

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
          <svg viewBox="0 0 320 320" className="w-full h-full max-h-[320px]" style={{ minHeight: '260px' }}>
            <path d="M 134,80 Q 150,86 166,80 L 200,80 L 250,140 L 280,195 L 268,201 L 238,148 L 195,115 L 195,245 L 105,245 L 105,115 L 62,148 L 32,201 L 20,195 L 50,140 L 100,80 Z" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
            <ellipse cx="150" cy="79" rx="16" ry="5" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />

            <line x1="105" y1="125" x2="195" y2="125" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="158" x2="195" y2="158" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="191" x2="195" y2="191" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="105" y1="224" x2="195" y2="224" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 3" />

            <line x1="93" y1="80" x2="93" y2="245" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="2 2" />
            <path d="M 89,87 L 93,80 L 97,87" stroke="#4f46e5" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 89,238 L 93,245 L 97,238" stroke="#4f46e5" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            <line x1="100" y1="65" x2="200" y2="65" stroke="#7c3aed" strokeWidth="1.5" />
            <path d="M 107,61 L 100,65 L 107,69" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 193,61 L 200,65 L 193,69" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            <ellipse cx="102" cy="100" rx="14" ry="5.5" transform="rotate(-50, 102, 100)" fill="none" stroke="#2563eb" strokeWidth="1.5" />
            <ellipse cx="88" cy="115" rx="13" ry="5" transform="rotate(-50, 88, 115)" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
            <ellipse cx="56" cy="144" rx="12" ry="4.5" transform="rotate(-50, 56, 144)" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
            <ellipse cx="25" cy="198" rx="10" ry="4" transform="rotate(-50, 25, 198)" fill="#dbeafe" stroke="#ec4899" strokeWidth="1.5" />

            <line x1="210" y1="67" x2="293" y2="183" stroke="#8b5cf6" strokeWidth="1.5" />
            <path d="M 218,65 L 210,67 L 216,75" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 287,175 L 293,183 L 285,185" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" />

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

            <g transform="translate(265, 128)" className="text-[7.5px] font-bold">
              <rect x="-55" y="-5.5" width="110" height="11" rx="1.5" fill="white" stroke="#8b5cf6" strokeWidth="0.5" />
              <text y="2.2" textAnchor="middle" className="fill-violet-700 font-bold" fontSize="7.5">Arm Length: {formatVal('Arm total length')}</text>
            </g>
          </svg>
        );

      case 'All Gloves/Glove With Sleeve':
        {
          const handSelectionVal = assessment.sub_options?.['Hand Selection'] || 'Right Hand Glove';
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
                <div className="flex gap-2 mb-4 bg-slate-100 p-1.5 rounded-2xl no-print">
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
              <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]" style={{ minHeight: '300px' }}>
              <defs>
                <marker id="asm-glove-arrow-amber-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                </marker>
                <marker id="asm-glove-arrow-purple-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
                </marker>
              </defs>

              <g transform="translate(160, 18)">
                <rect x="-70" y="-10" width="140" height="20" rx="10" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" />
                <text y="3.5" textAnchor="middle" fill="#1e293b" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">
                  {handSelectionVal.toUpperCase()}
                </text>
              </g>

              <g transform={isLeftHand ? "translate(320, 0) scale(-1, 1)" : ""}>
                <path 
                  d="M 115,360 C 115,330 111,290 111,265 C 111,245 90,230 85,215 C 75,195 45,190 35,178 C 22,166 32,150 48,158 C 68,168 85,172 98,178 L 102,90 Q 112,70 122,90 L 125,152 Q 128,156 131,152 L 138,58 Q 148,38 158,58 L 159,152 Q 162,156 165,152 L 171,70 Q 181,50 191,70 L 191,155 Q 194,159 197,155 L 202,102 Q 210,88 218,102 C 221,142 216,245 199,275 C 197,300 195,330 195,360 Q 155,370 115,360 Z" 
                  fill="#f8fafc" 
                  stroke="#1e293b" 
                  strokeWidth="2.5" 
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                />
                
                <path d="M 100,215 Q 150,220 200,215" stroke="#2563eb" strokeWidth="2.5" fill="none" />
                <path d="M 112,285 Q 155,288 198,285" stroke="#10b981" strokeWidth="2.5" fill="none" />
                <path d="M 115,360 Q 155,363 195,360" stroke="#7c3aed" strokeWidth="2" fill="none" strokeDasharray="3 1" />

                <path d="M 137,100 Q 145,103 153,100" stroke="#4f46e5" strokeWidth="2.5" fill="none" />
                <path d="M 137,100 Q 145,97 153,100" stroke="#4f46e5" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

                <path d="M 104,120 Q 111,123 118,120" stroke="#0891b2" strokeWidth="2.5" fill="none" />
                <path d="M 104,120 Q 111,117 118,120" stroke="#0891b2" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

                <path d="M 169,110 Q 177,113 185,110" stroke="#059669" strokeWidth="2.5" fill="none" />
                <path d="M 169,110 Q 177,107 185,110" stroke="#059669" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

                <path d="M 199,132 Q 206,134 213,132" stroke="#db2777" strokeWidth="2.5" fill="none" />
                <path d="M 199,132 Q 206,130 213,132" stroke="#db2777" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />

                <path d="M 33,171 Q 43,165 52,154" stroke="#ea580c" strokeWidth="2.5" fill="none" />
                <path d="M 33,171 Q 41,176 52,154" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" opacity="0.6" />
              </g>

              <line x1="35" y1="48" x2="148" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="35" y1="275" x2="111" y2="275" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="35" y1="48" x2="35" y2="275" stroke="#d97706" strokeWidth="1.5" markerStart="url(#asm-glove-arrow-amber-reg)" markerEnd="url(#asm-glove-arrow-amber-reg)" />

              <line x1="180" y1="48" x2="285" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="195" y1="360" x2="285" y2="360" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="285" y1="48" x2="285" y2="360" stroke="#7c3aed" strokeWidth="1.5" markerStart="url(#asm-glove-arrow-purple-reg)" markerEnd="url(#asm-glove-arrow-purple-reg)" />

              <g transform="translate(155, 245)" className="text-[8px] font-bold">
                <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="8">Palm: {formatVal('Palm')}</text>
              </g>

              <g transform="translate(155, 312)" className="text-[8px] font-bold">
                <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Wrist: {formatVal('Wrist')}</text>
              </g>

              <g transform={`translate(${xThumb}, 195)`} className="text-[8px] font-bold">
                <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#ea580c" strokeWidth="1" />
                <text y="3" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Thumb: {formatVal('Thumb')}</text>
              </g>

              <g transform={`translate(${xLeftFinger}, 100)`} className="text-[8px] font-bold">
                <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#0891b2" strokeWidth="1" />
                <text y="3" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="8">Index: {formatVal('Index finger')}</text>
              </g>

              <g transform={`translate(${xMiddleFinger}, 62)`} className="text-[8px] font-bold">
                <rect x="-34" y="-7" width="68" height="14" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" className="fill-indigo-600 font-extrabold" fontSize="8">Middle: {formatVal('Middle finger')}</text>
              </g>

              <g transform={`translate(${xRightFinger}, 105)`} className="text-[8px] font-bold">
                <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#059669" strokeWidth="1" />
                <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Ring: {formatVal('Ring finger')}</text>
              </g>

              <g transform={`translate(${xSmallFinger}, 145)`} className="text-[8px] font-bold">
                <rect x="-32" y="-7" width="64" height="14" rx="3" fill="white" stroke="#db2777" strokeWidth="1" />
                <text y="3" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="8">Little: {formatVal('Little finger')}</text>
              </g>

              {/* 8. Total Length (Finger to Wrist) Badge - positioned at top of vertical line */}
              <g transform={`translate(${isLeftHand ? 285 : 35}, 30)`} className="text-[8px] font-bold">
                <rect x="-46" y="-12" width="92" height="24" rx="4" fill="white" stroke="#d97706" strokeWidth="1.5" />
                <text y="-2" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="6.5">Middle Finger to Wrist</text>
                <text y="8" textAnchor="middle" className="fill-amber-700 font-black" fontSize="7">{formatVal('Total length middle finger to wrist')}</text>
              </g>

              <g transform="translate(285, 204)" className="text-[8px] font-bold">
                <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
                <text y="-2" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="8">To Scar</text>
                <text y="8" textAnchor="middle" className="fill-purple-700 font-black" fontSize="7">{formatVal('Total length middle finger to end of scar')}</text>
              </g>
            </svg>
            </div>
          );
        }

      case 'Belly Binder':
        return (
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]" style={{ minHeight: '300px' }}>
            <defs>
              <marker id="asm-arrow-orange-bb-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
              </marker>
              <marker id="asm-arrow-rose-bb-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48" />
              </marker>
            </defs>

            <path 
              d="M 90,50 Q 160,53 230,50 C 238,90 244,130 248,170 C 252,210 253,235 251,250 L 236,325 Q 203,327 170,325 L 170,240 Q 160,238 150,240 L 150,325 Q 117,327 84,325 L 69,250 C 67,235 68,210 72,170 C 76,130 82,90 90,50 Z" 
              fill="#ebdcc9" 
              opacity="0.15"
            />

            <path 
              d="M 90,50 Q 160,53 230,50 C 238,90 244,130 248,170 C 252,210 253,235 251,250 L 236,325 Q 203,327 170,325 L 170,240 Q 160,238 150,240 L 150,325 Q 117,327 84,325 L 69,250 C 67,235 68,210 72,170 C 76,130 82,90 90,50 Z" 
              fill="#fdfaf6" 
              stroke="#b1967c" 
              strokeWidth="2.5" 
              strokeLinejoin="round" 
            />

            <path d="M 90,50 Q 160,53 230,50" stroke="#b1967c" strokeWidth="3" fill="none" />
            <path d="M 92,64 Q 160,67 228,64" stroke="#d5c3b2" strokeWidth="1.5" fill="none" />

            <ellipse cx="160" cy="235" rx="11" ry="14" fill="#0f172a" />

            <line x1="160" y1="64" x2="160" y2="221" stroke="#8c735d" strokeWidth="2.5" />
            <line x1="158.5" y1="64" x2="158.5" y2="221" stroke="#f6f2eb" strokeWidth="0.5" />
            
            <rect x="157.5" y="75" width="5" height="11" rx="1.5" fill="#fdfaf6" stroke="#5d4c3e" strokeWidth="1.2" />
            <circle cx="160" cy="83" r="1.5" fill="#5d4c3e" />

            <path d="M 84,325 Q 117,327 150,325" stroke="#b1967c" strokeWidth="2.5" fill="none" />
            <path d="M 170,325 Q 203,327 236,325" stroke="#b1967c" strokeWidth="2.5" fill="none" />

            <path d="M 91,56 Q 160,59 229,56" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 80,110 Q 160,114 240,110" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 73,175 Q 160,179 247,175" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 75,215 Q 160,219 245,215" stroke="#0891b2" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 71,260 Q 110,262 149,260" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            <path d="M 80,300 Q 115,302 149,300" stroke="#db2777" strokeWidth="2" strokeDasharray="3 2" fill="none" />

            <line x1="247" y1="175" x2="275" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="230" y1="50" x2="275" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="270" y1="50" x2="270" y2="175" stroke="#ea580c" strokeWidth="1.5" markerStart="url(#asm-arrow-orange-bb-reg)" markerEnd="url(#asm-arrow-orange-bb-reg)" />

            {/* Left Height: Waist to Close end thigh */}
            <line x1="73" y1="175" x2="45" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="80" y1="300" x2="45" y2="300" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="175" x2="50" y2="300" stroke="#e11d48" strokeWidth="1.5" markerStart="url(#asm-arrow-rose-bb-reg)" markerEnd="url(#asm-arrow-rose-bb-reg)" />

            <g transform="translate(160, 42)" className="text-[8px] font-bold">
              <rect x="-48" y="-7" width="96" height="14" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold" fontSize="8">Diaphrom: {formatVal('Diaphrom')}</text>
            </g>

            <g transform="translate(160, 110)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="8">Belly: {formatVal('Belly')}</text>
            </g>

            <g transform="translate(160, 175)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold" fontSize="8">Waist: {formatVal('Waist')}</text>
            </g>

            <g transform="translate(160, 215)" className="text-[8px] font-bold">
              <rect x="-42" y="-7" width="84" height="14" rx="4" fill="white" stroke="#0891b2" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="8">Hips: {formatVal('Hips')}</text>
            </g>

            <g transform="translate(110, 260)" className="text-[8px] font-bold">
              <rect x="-48" y="-7" width="96" height="14" rx="4" fill="white" stroke="#7c3aed" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-extrabold" fontSize="8">Open End: {formatVal('Open End')}</text>
            </g>

            <g transform="translate(110, 300)" className="text-[8px] font-bold">
              <rect x="-50" y="-7" width="100" height="14" rx="4" fill="white" stroke="#db2777" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="8">Close End: {formatVal('Close End (Leg end)')}</text>
            </g>

            <g transform="translate(280, 112)" className="text-[8px] font-bold">
              <rect x="-24" y="-12" width="48" height="24" rx="4" fill="white" stroke="#ea580c" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-orange-600 font-extrabold" fontSize="8">Dia-Waist</text>
              <text y="8" textAnchor="middle" className="fill-orange-700 font-black" fontSize="7">{formatVal('Length Diaphrom to Waist')}</text>
            </g>

            <g transform="translate(40, 237)" className="text-[8px] font-bold">
              <rect x="-26" y="-12" width="52" height="24" rx="4" fill="white" stroke="#e11d48" strokeWidth="1.5" />
              <text y="-2" textAnchor="middle" className="fill-rose-600 font-extrabold" fontSize="8">Wst-Close</text>
              <text y="8" textAnchor="middle" className="fill-rose-700 font-black" fontSize="7">{formatVal('Waist to Close End')}</text>
            </g>
          </svg>
        );

      case 'All Trouser':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px', overflow: 'visible' }} overflow="visible">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
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
          <svg viewBox="0 0 320 395" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
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
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 h-full text-slate-400 font-bold uppercase tracking-widest text-xs">
            No Drawing Visual Available
          </div>
        );
    }
  };

  // Helper to accurately convert modern CSS colors to RGB by matching nested parentheses
  const resolveModernColors = (css: string) => {
    if (!css) return css;
    let index = 0;
    let result = '';
    
    while (index < css.length) {
      const isColorMix = css.startsWith('color-mix(', index);
      const isOklch = css.startsWith('oklch(', index);
      const isOklab = css.startsWith('oklab(', index);
      
      if (isColorMix || isOklch || isOklab) {
        const startType = isColorMix ? 'color-mix(' : (isOklch ? 'oklch(' : 'oklab(');
        const startPos = index;
        index += startType.length;
        
        let parenCount = 1;
        let matchedParenIndex = -1;
        while (index < css.length) {
          if (css[index] === '(') {
            parenCount++;
          } else if (css[index] === ')') {
            parenCount--;
            if (parenCount === 0) {
              matchedParenIndex = index;
              break;
            }
          }
          index++;
        }
        
        if (matchedParenIndex !== -1) {
          const fullMatch = css.substring(startPos, matchedParenIndex + 1);
          let fallback = '#1e293b'; 
          if (fullMatch.includes('white') || fullMatch.includes('255, 255, 255') || fullMatch.includes('255 255 255')) {
            fallback = '#ffffff';
          } else if (fullMatch.includes('transparent')) {
            fallback = 'transparent';
          } else if (fullMatch.includes('slate-50') || fullMatch.includes('f8fafc')) {
            fallback = '#f8fafc';
          } else if (fullMatch.includes('slate-100') || fullMatch.includes('f1f5f9')) {
            fallback = '#f1f5f9';
          } else if (fullMatch.includes('slate-200') || fullMatch.includes('e2e8f0')) {
            fallback = '#e2e8f0';
          } else if (fullMatch.includes('blue-600')) {
            fallback = '#2563eb';
          } else if (fullMatch.includes('blue-500')) {
            fallback = '#3b82f6';
          }
          
          if (typeof document !== 'undefined') {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 1;
              canvas.height = 1;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = fullMatch;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
                if (r === 0 && g === 0 && b === 0 && a === 0 && !fullMatch.includes('transparent')) {
                  // Canvas color compiling failed/unsupported in this browser, use readable text fallback
                } else {
                  fallback = a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${(a/255).toFixed(2)})`;
                }
              }
            } catch (e) {}
          }
          
          result += fallback;
          index++; 
        } else {
          index = startPos;
          result += css[index];
          index++;
        }
      } else {
        result += css[index];
        index++;
      }
    }
    
    return result;
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current || isGenerating) return;
    setIsGenerating(true);
    
    const originalImageSrcsLocal = new Map<Element, string>();
    const originalInlineStyles = new Map<HTMLElement, string>();
    
    try {
      const reportElement = printAreaRef.current;
      
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

      // Wait for images to load
      const images = Array.from(reportElement.getElementsByTagName('img'));
      await Promise.all(images.map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Resolve and apply standard plain inline colors for elements with modern color specs to dodge html2canvas crashes
      const elementsToConvert = [reportElement, ...Array.from(reportElement.querySelectorAll('*'))] as HTMLElement[];
      elementsToConvert.forEach((el) => {
        if (!el.style) return;
        try {
          const comp = window.getComputedStyle(el);
          const stylesToApply: { [key: string]: string } = {};

          const colorProps = [
            'color', 
            'backgroundColor', 
            'borderColor', 
            'borderTopColor', 
            'borderRightColor', 
            'borderBottomColor', 
            'borderLeftColor', 
            'fill', 
            'stroke', 
            'outlineColor'
          ];
          
          colorProps.forEach((prop) => {
            const val = (comp as any)[prop];
            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix'))) {
              const resolved = resolveModernColors(val);
              stylesToApply[prop] = resolved;
            }
          });

          if (Object.keys(stylesToApply).length > 0) {
            originalInlineStyles.set(el, el.style.cssText);
            Object.keys(stylesToApply).forEach((prop) => {
              (el.style as any)[prop] = stylesToApply[prop];
            });
          }
        } catch (e) {
          console.warn("Inline modern color mapping failed for:", el, e);
        }
      });

      // Compile parent document stylesheets
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
            console.warn("Skipping stylesheet rules parsing:", sheetErr);
          }
        }
      } catch (globalStyleErr) {
        console.warn("Could not compile parent styles:", globalStyleErr);
      }

      const resolvedParentStyles = resolveModernColors(parentPageStyles);

      // Create PDF utilizing html2canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // EXTREME SANITIZATION for html2canvas
          const links = clonedDoc.getElementsByTagName('link');
          for (let i = links.length - 1; i >= 0; i--) {
            if (links[i].rel === 'stylesheet') {
              links[i].parentNode?.removeChild(links[i]);
            }
          }

          const cloneStyles = clonedDoc.getElementsByTagName('style');
          for (let i = cloneStyles.length - 1; i >= 0; i--) {
            cloneStyles[i].parentNode?.removeChild(cloneStyles[i]);
          }

          const mainStyleTag = clonedDoc.createElement('style');
          mainStyleTag.type = 'text/css';
          mainStyleTag.innerHTML = resolvedParentStyles;
          clonedDoc.head?.appendChild(mainStyleTag);

          // Resolve inline styles inside the cloned elements
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

          // Force custom target styling over container heights/overflow in the clone
          const cloneReportArea = clonedDoc.getElementById('printable-summary-target');
          if (cloneReportArea) {
            cloneReportArea.style.opacity = '1';
            cloneReportArea.style.visibility = 'visible';
            cloneReportArea.style.position = 'relative';
            cloneReportArea.style.display = 'block';
            cloneReportArea.style.width = '794px'; 
            cloneReportArea.style.padding = '40px';
            cloneReportArea.style.margin = '0 auto';
            cloneReportArea.style.backgroundColor = '#ffffff';
            cloneReportArea.style.height = 'auto';
            cloneReportArea.style.maxHeight = 'none';
            cloneReportArea.style.overflow = 'visible';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
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

      const patientName = patient.full_name ? patient.full_name.replace(/\s+/g, '_') : 'Patient';
      pdf.save(`Assessment_Summary_${patientName}.pdf`);
      
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      alert("PDF generation encountered an error. Please try again.");
    } finally {
      // Restore elements' inline styles beautifully
      originalInlineStyles.forEach((originalCss, el) => {
        if (el && el.style) {
          el.style.cssText = originalCss;
        }
      });
      
      originalImageSrcsLocal.forEach((origSrc, el) => {
        if (el instanceof HTMLImageElement) el.src = origSrc;
        else if (el instanceof SVGImageElement) el.setAttribute('href', origSrc);
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-4 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 sm:px-8 bg-slate-50/50">
          <div>
            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl uppercase tracking-widest">
              Live Clinical Calibration Verification Report
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 uppercase flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Assessment Summary ({patient.full_name})
            </h3>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            title="Close Summary / بند کریں"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 pdf-safe-zone bg-white">
          {assessmentPayload ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (Clinical Metrics & Photo): 7 cols */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visual Identity Profile Panel */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col sm:flex-row gap-6 items-center">
                  {/* Circular/Rounded Registered Client Picture */}
                  <div className="w-28 h-28 bg-slate-200/60 border-4 border-white shadow-md rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {patient.photo_url ? (
                      <img 
                        src={patient.photo_url} 
                        alt={patient.full_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                        <Activity className="w-8 h-8 text-slate-350" />
                        <span className="text-[8px] font-black uppercase text-center text-slate-400">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Demographic Metadata details */}
                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <h4 className="text-xl font-bold text-slate-900 leading-tight">
                      {patient.full_name}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-800 text-[9px] font-black uppercase rounded-lg">
                      {assessmentPayload.garment_type}
                    </span>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 text-[11px] text-slate-500 font-bold border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{patient.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Hospital className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{assessmentPayload.hospital_name || patient.hospital || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">Dr. {assessmentPayload.doctor_ref || patient.doctor_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-705">
                          {new Date(assessmentPayload.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Demographics mini cards for clear readout */}
                <div className="grid grid-cols-3 gap-3 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-50/50">
                  <div className="text-center p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-1 leading-none">Age / عمر</span>
                    <span className="font-extrabold text-blue-900 text-xs block">{assessmentPayload.age || patient.age} Yrs</span>
                  </div>
                  <div className="text-center p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-1 leading-none">Gender / جنس</span>
                    <span className="font-extrabold text-blue-900 text-xs block uppercase">{assessmentPayload.gender || patient.gender || 'N/A'}</span>
                  </div>
                  <div className="text-center p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-1 leading-none">City / شہر</span>
                    <span className="font-extrabold text-blue-900 text-xs block truncate uppercase">{assessmentPayload.city || patient.city || 'Karachi'}</span>
                  </div>
                </div>

                {/* Compression Fabric Specifications */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-150/40">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-450 uppercase block tracking-wider">Garment Config / لباس کی قسم</span>
                    <div className="text-slate-900 text-xs font-black uppercase">
                      {assessmentPayload.garment_type}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-450 uppercase block tracking-wider">Compression / پریشر</span>
                    <div className="text-slate-900 text-xs font-black">
                      {assessmentPayload.compression || 'None'}
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-slate-200/50 pt-2.5 mt-1">
                    <span className="text-[8px] font-black text-slate-450 uppercase block tracking-wider">Silicone Profile / سلیکون پسٹنگ</span>
                    <div className="text-slate-900 text-xs font-bold">
                      {assessmentPayload.silicone_pasting || 'None'}
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-slate-200/50 pt-2.5 mt-1">
                    <span className="text-[8px] font-black text-slate-450 uppercase block tracking-wider">Anatomical Condition / بیماری کی تفصیل</span>
                    <div className="text-slate-900 text-xs font-semibold">
                      {patient.medical_condition || 'General Burn & Scar / جلنے کے نشان'}
                    </div>
                  </div>
                </div>

                {/* Sub Options Specs Measurement Values Table */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Exact Clinical Points Values Grid
                  </h4>
                  <div className="bg-white border border-slate-100 rounded-2xl max-h-[190px] overflow-y-auto divide-y divide-slate-100">
                    {Object.entries(assessmentPayload.sub_options || {})
                      .filter(([_, val]) => val !== undefined && val !== '')
                      .map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50/60 transition-colors">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">{key}</span>
                          <span className="font-extrabold text-slate-900">
                            {/^\d+(\.\d+)?\s*(cm|in)?$/i.test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : (val as any)}
                          </span>
                        </div>
                      ))}
                    {Object.entries(assessmentPayload.sub_options || {}).filter(([_, val]) => val !== undefined && val !== '').length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400 italic">No exact parameters recorded yet.</div>
                    )}
                  </div>
                </div>

                {/* Notes remarks section */}
                {assessmentPayload.notes && (
                  <div className="space-y-1.5 p-4 rounded-2xl bg-amber-50/40 border border-amber-100/60">
                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1 font-mono">
                      <FileText className="w-3.5 h-3.5 text-amber-500" /> Dr Notes / ہسپتال کے ریمارکس
                    </span>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-bold font-mono whitespace-pre-wrap">
                      {assessmentPayload.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column (Dynamic Vector Drawings): 5 cols */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-[2.5rem] p-6 flex flex-col justify-between min-h-[460px]" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">
                      Calibrated Vector Template
                    </h4>
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-center min-h-[340px]">
                      {renderAssessmentDrawingSvg(assessmentPayload)}
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-wider mt-4">
                    Precision Custom-Styled Svg Diagram With Calculated Bounds
                  </p>
                </div>

                {getClinicalPhoto() && (
                  <div className="rounded-[2.5rem] p-6 flex flex-col justify-between" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">
                        Patient Clinical Photo / مریض کی تصویر
                      </h4>
                      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-150/40 flex items-center justify-center overflow-hidden" style={{ minHeight: '190px' }}>
                        <img 
                          src={getClinicalPhoto()} 
                          alt="Patient Clinical upload" 
                          referrerPolicy="no-referrer"
                          className="max-h-[170px] w-auto object-contain rounded-2xl shadow-sm border border-slate-100"
                        />
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-wider mt-3">
                      Standard Verified Clinical Image
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Warning/Empty workflow state */
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  No Saved Assessment Found / کوئی جائزہ معلومات نہیں ملی
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  There is currently no saved clinical assessment or customized garment calibration report created for <strong>"{patient.full_name}"</strong>. Please create an assessment first.
                </p>
              </div>
              {onStartAssessment && (
                <button
                  onClick={() => {
                    onClose();
                    onStartAssessment();
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-md shadow-blue-100 cursor-pointer"
                >
                  Start Assessment Now (نیا جائزہ شروع کریں)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 p-6 sm:px-8 bg-slate-50/40">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            Status: <span className="text-emerald-600 font-extrabold font-mono">Synchronized & Archived</span>
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {assessmentPayload && (
              <button
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className={cn(
                  "py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  isGenerating && "animate-pulse"
                )}
              >
                <Download className="w-3.5 h-3.5" /> 
                {isGenerating ? "GENERATING PDF..." : "DOWNLOAD PDF / پی ڈی ایف ڈاؤن لوڈ کریں"}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-white border border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer hover:bg-slate-50"
            >
              Close / بند کریں
            </button>
          </div>
        </div>

      </div>

      {/* Hidden high-fidelity printable report template container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div 
          ref={printAreaRef}
          id="printable-summary-target" 
          className="w-[794px] bg-white p-10 text-slate-800 flex flex-col justify-between"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {assessmentPayload && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b-4 border-slate-900 pb-6">
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
                  <span className="text-xs font-mono font-black text-slate-800 block break-all leading-none">{assessmentPayload.id}</span>
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PATIENT FULL NAME</span>
                    <span className="text-md font-extrabold text-slate-900">{patient.full_name || assessmentPayload.patient_name || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Age / عمر</span>
                      <span className="text-xs font-bold text-slate-800">{assessmentPayload.age || patient.age ? `${assessmentPayload.age || patient.age} Yrs` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Gender / جنس</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{assessmentPayload.gender || patient.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">City / شہر</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{assessmentPayload.city || patient.city || 'Karachi'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pl-6 border-l border-slate-200">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Doctor Reference / ریفرنس ڈاکٹر</span>
                    <span className="text-sm font-extrabold text-slate-850 block break-words leading-tight">{assessmentPayload.doctor_ref || patient.doctor_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Created Date / تاریخ</span>
                    <span className="text-sm font-extrabold text-slate-850 block">
                      {new Date(assessmentPayload.created_at).toLocaleDateString('ur-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Garment & Compression Configuration</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Unit</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{assessmentPayload.garment_type}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Compression</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1">{assessmentPayload.compression || 'None'}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Silicone Profile</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1">{assessmentPayload.silicone_pasting || 'None'}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Color</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{assessmentPayload.sub_options?.['Color'] || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Blueprint Drawing + Measurements Grid side-by-side */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Precision Sizing Blueprint & Calibration</h3>
                <div className="grid grid-cols-12 gap-6 items-start">
                  
                  {/* Drawing Area */}
                  <div className="col-span-7 rounded-3xl p-5 flex flex-col items-center justify-center min-h-[350px]" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Sizing Schematic Chart</span>
                    <div className="w-full flex justify-center bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      {renderAssessmentDrawingSvg(assessmentPayload)}
                    </div>
                  </div>

                  {/* Sizing Specifications Table */}
                  <div className="col-span-5 space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Matrix Calibration Parameters</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 space-y-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      {Object.entries(assessmentPayload.sub_options || {})
                        .filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection')
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-xs pb-1.5 border-b border-dashed border-slate-200 last:border-none last:pb-0">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">{key}</span>
                            <span className="font-extrabold text-slate-900">
                              {/^\d+(\.\d+)?\s*(cm|in)?$/i.test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : val}
                            </span>
                          </div>
                        ))}
                      {Object.entries(assessmentPayload.sub_options || {}).filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No custom points registered.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Notes & Uploaded Photo Section */}
              <div className="grid grid-cols-12 gap-6">
                {/* Notes Column */}
                <div className={getClinicalPhoto() ? "col-span-7 space-y-2" : "col-span-12 space-y-2"}>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Medical Condition & Remarks / ضروری ہدایات</h3>
                  <p className="text-xs text-slate-705 text-slate-700 font-bold leading-relaxed p-4 rounded-2xl whitespace-pre-wrap font-mono" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', minHeight: '130px' }}>
                    {assessmentPayload.notes || "No extra notes specified."}
                  </p>
                </div>

                {/* Photo Column */}
                {getClinicalPhoto() && (
                  <div className="col-span-5 space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">4. Patient Clinical Photo / مريض كی تصویر</h3>
                    <div className="rounded-2xl p-2 flex items-center justify-center bg-white" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', height: '130px' }}>
                      <img 
                        src={getClinicalPhoto()} 
                        alt="Patient Clinical upload" 
                        referrerPolicy="no-referrer"
                        className="max-h-[114px] max-w-full object-contain rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-5 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span>SYSTEM VERIFIED CLINICAL MEMORANDUM / روکارڈ طی SIZING CALIBRATION PAGE 1 OF 1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryModal;
