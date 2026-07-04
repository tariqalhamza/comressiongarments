import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  X, 
  Download, 
  Printer, 
  User, 
  Calendar, 
  Stethoscope, 
  Hospital, 
  Activity,
  FileText,
  ClipboardCheck,
  Camera
} from 'lucide-react';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';
import { useAuthStore } from '../services/authStore';

// Helper to get garment type from clinical assessment diagnosis
const getGarmentType = (diag: string) => {
  if (!diag) return 'All Gloves/Glove With Sleeve';
  let cleaned = diag.replace(/\s*Assessment\s*$/gi, '').trim();
  if (cleaned === 'Connecting Sleeves/Arm Sleeve') {
    cleaned = 'Connecting Sleeves';
  }
  const knownTypes = [
    'Face Mask & Chin Binder',
    'Connecting Sleeves',
    'Arm sleeve Right Hand',
    'Arm sleeve Left Hand',
    'All Jacket',
    'All Gloves/Glove With Sleeve',
    'Belly Binder',
    'All Trouser',
    'All Leg Sleeves',
    'All Socks',
    'Body Shaper'
  ];
  if (knownTypes.includes(cleaned)) {
    return cleaned;
  }
  
  // Fallback for mock/older patient diagnosis data
  const d = diag.toLowerCase();
  if (d.includes('face') || d.includes('mask') || d.includes('chin')) {
    return 'Face Mask & Chin Binder';
  }
  if (d.includes('arm') || d.includes('sleeve')) {
    return 'Connecting Sleeves';
  }
  if (d.includes('jacket') || d.includes('vest') || d.includes('chest')) {
    return 'All Jacket';
  }
  if (d.includes('trouser') || d.includes('leg') || d.includes('thigh') || d.includes('calf') || d.includes('insufficiency')) {
    return 'All Trouser';
  }
  if (d.includes('sock')) {
    return 'All Socks';
  }
  if (d.includes('belly') || d.includes('binder')) {
    return 'Belly Binder';
  }
  return 'All Gloves/Glove With Sleeve';
};

// Reusable SmartDiagram for the report view - updated to draw the custom measurement illustrations with CM values
const SmartDiagram: React.FC<{ 
  patient: any,
  subOptions: Record<string, string>,
  imageUrl?: string
}> = ({ patient, subOptions, imageUrl }) => {
  const garmentType = getGarmentType(patient.diagnosis || '');
  const [activeBothHandView, setActiveBothHandView] = useState<'Right' | 'Left'>('Right');
  const handSelectionVal = subOptions?.['Hand Selection'] || 'Right Hand Glove';
  const isBoth = garmentType === 'All Gloves/Glove With Sleeve' && handSelectionVal === 'Both Hand Glove';

  const formatVal = (label: string) => {
    let lookupLabel = label;
    if (isBoth) {
      lookupLabel = `${activeBothHandView} Hand ${label}`;
    }
    let val = subOptions[lookupLabel];

    // Fallback mappings for backwards compatibility
    if (!val) {
      if (label === 'Open End' || label === 'Open end') val = subOptions['Open End'] || subOptions['Open end'] || subOptions['Arm pit'] || subOptions['arm_pit'];
      else if (label === 'Close End' || label === 'Close end') val = subOptions['Close End'] || subOptions['Close end'] || subOptions['Wrist'] || subOptions['wrist'];
      else if (label === 'Arm pit' || label === 'Arm Pit') val = subOptions['Arm pit'] || subOptions['Arm Pit'] || subOptions['Open End'] || subOptions['Open end'];
      else if (label === 'Wrist') val = subOptions['Wrist'] || subOptions['Close End'] || subOptions['Close end'];
      else if (label === 'Middle finger') val = subOptions['Medal finger'];
      else if (label === 'Index finger') val = subOptions['Left finger'];
      else if (label === 'Ring finger') val = subOptions['Right finger'];
      else if (label === 'Little finger') val = subOptions['Small finger'];
      else if (label === 'Total length middle finger to wrist') val = subOptions['Total length medal finger to wrist'];
      else if (label === 'Total length middle finger to end of scar') val = subOptions['Total length medal finger to end of scar'];
      // Belly Binder mappings
      else if (label === 'Diaphrom') val = subOptions['Diaphrarm'];
      else if (label === 'West (Waist)' || label === 'West' || label === 'Waist') val = subOptions['Waist'] || subOptions['West (Waist)'] || subOptions['West'] || subOptions['waist'];
      else if (label === 'Open End') val = subOptions['Open end thigh'];
      else if (label === 'Close End (Leg end)') val = subOptions['Close end thigh'];
      else if (label === 'Length Diaphrom to West' || label === 'Length Diaphrom to Waist') val = subOptions['Length Diaphrom to Waist'] || subOptions['Length Diaphrom to West'] || subOptions['length diaphragm to waist'];
      else if (label === 'Short Length' || label === 'Waist to Close End') val = subOptions['Waist to Close End'] || subOptions['Short Length'] || subOptions['Length waist to close end'];
      // All Trouser backwards compatibility fallbacks
      else if (label === 'Belly') val = subOptions['Diaphrarm'];
      else if (label === 'Hips') val = subOptions['Hips'];
      else if (label === 'Round (Crotch)' || label === 'Round') val = subOptions['Open end thigh'];
      else if (label === 'Thigh I') val = subOptions['Close end thigh'];
      else if (label === 'Thigh II') val = subOptions['Thigh II'];
      else if (label === 'Knee') val = subOptions['Knee'];
      else if (label === 'Calf') val = subOptions['Calf'];
      else if (label === 'Bottom') val = subOptions['Ankle'];
      else if (label === 'Crotch Depth') val = subOptions['length diaphragm to waist'];
      else if (label === 'Inseam (Inside Length)' || label === 'Inseam') val = subOptions['Inseam'];
      else if (label === 'Total Length') val = subOptions['Length waist to ankle'];
    }

    if (!val) return '—';
    const clean = val.toString().trim();
    if (!clean) return '—';
    if (clean.toLowerCase().endsWith('cm')) return clean;
    return `${clean} cm`;
  };

  const renderDiagramContent = () => {
    switch (garmentType) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[320px]">
            <defs>
              <marker id="arrow-blue-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-emerald-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-rose-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
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
            <line x1="150" y1="102" x2="150" y2="218" stroke="#10b981" strokeWidth="2.5" markerStart="url(#arrow-emerald-rep)" markerEnd="url(#arrow-emerald-rep)" />

            {/* Neck area at the bottom */}
            <path d="M125,245 Q150,255 175,245 L175,270 Q150,280 125,270 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="150" y1="242" x2="150" y2="273" stroke="#dc2626" strokeWidth="2.5" markerStart="url(#arrow-rose-rep)" markerEnd="url(#arrow-rose-rep)" />

            {/* Dimension value text tags matching the color guidelines */}
            {/* 1. Around Head (Forehead Strap) */}
            <g transform="translate(150, 60)">
              <rect x="-60" y="-8" width="120" height="16" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-700 font-extrabold text-[10px]" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>

            {/* 2. Around Chin */}
            <g transform="translate(50, 195)">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-700 font-extrabold text-[10px]" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>

            {/* 3. Around Neck */}
            <g transform="translate(250, 195)">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-700 font-extrabold text-[10px]" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>

            {/* 4. Neck Length */}
            <g transform="translate(150, 305)">
              <rect x="-55" y="-8" width="110" height="16" rx="4" fill="white" stroke="#dc2626" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-rose-700 font-extrabold text-[10px]" fontSize="9">Neck Len: {formatVal('Neck length')}</text>
            </g>
          </svg>
        );

      case 'Connecting Sleeves':
      case 'Connecting Sleeves/Arm Sleeve':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
            {/* Torso Back View Background */}
            <ellipse cx="150" cy="45" rx="16" ry="20" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 142,60 L 142,85 C 145,88 155,88 158,85 L 158,60 Z" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
            <path d="M 130,85 C 95,90 70,105 60,115 L 75,280 L 225,280 L 240,115 C 230,105 205,90 170,85 Z" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1" />

            {/* Bolero garment outline (collar scoop, sleeves, back connector band) */}
            <path 
              d="M 120,90 Q 150,105 180,90 C 210,95 225,103 235,115 Q 252,187 252,260 L 238,258 Q 225,187 205,145 Q 150,132 95,145 Q 75,187 62,258 L 48,260 Q 48,187 65,115 C 75,103 90,95 120,90 Z" 
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
            <g transform="translate(150, 60)">
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold text-[9px]" fontSize="9">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(150, 290)">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-extrabold text-[9px]" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(132, 122)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold text-[9px]" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(127, 153.5)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold text-[9px]" fontSize="9">Open End: {formatVal('Open End')}</text>
            </g>
            <g transform="translate(122, 185)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold text-[9px]" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(102, 265)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-extrabold text-[9px]" fontSize="9">Close End: {formatVal('Close End')}</text>
            </g>
          </svg>
        );

      case 'Arm sleeve Right Hand':
      case 'Arm sleeve Left Hand':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
            <g transform="translate(100, 95)">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-extrabold text-[9px]" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(245, 100)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold text-[9px]" fontSize="9">Open End: {formatVal('Open End')}</text>
            </g>
            <g transform="translate(185, 175)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold text-[9px]" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(75, 235)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" stroke-width="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-extrabold text-[9px]" fontSize="9">Close End: {formatVal('Close End')}</text>
            </g>
          </svg>
        );

      case 'All Jacket':
        return (
          <svg viewBox="0 0 320 320" className="w-full h-full max-h-[320px]">
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
        {
          const handSelectionVal = subOptions?.['Hand Selection'] || 'Right Hand Glove';
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
              <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]">
              <defs>
                <marker id="arrow-blue-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                </marker>
                <marker id="arrow-emerald-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrow-amber-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                </marker>
                <marker id="arrow-purple-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
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
              </g>

              {/* vertical side measurement rulers */}
              {/* Height Line 2: Finger-to-scar-end (Right Margin) */}
              <line x1="180" y1="48" x2="285" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="195" y1="360" x2="285" y2="360" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="285" y1="48" x2="285" y2="360" stroke="#7c3aed" strokeWidth="1.5" markerStart="url(#arrow-purple-rep)" markerEnd="url(#arrow-purple-rep)" />

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

              {/* 9. Total Length (Finger to Scar) Right Margin Badge */}
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
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]">
            <defs>
              <marker id="arrow-orange-bb-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
              </marker>
              <marker id="arrow-rose-bb-rep" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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

            {/* Crotch opening gap */}
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

            {/* Internal Circumference Measurement Guides */}
            {/* 1. Diaphragm line */}
            <path d="M 91,56 Q 160,59 229,56" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 2. Belly line */}
            <path d="M 80,110 Q 160,114 240,110" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 3. Waist line */}
            <path d="M 73,175 Q 160,179 247,175" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* Hips line */}
            <path d="M 75,215 Q 160,219 245,215" stroke="#0891b2" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 4. Open end thigh */}
            <path d="M 71,260 Q 110,262 149,260" stroke="#7c3aed" strokeWidth="2" strokeDasharray="3 2" fill="none" />
            
            {/* 5. Close end thigh */}
            <path d="M 80,300 Q 115,302 149,300" stroke="#db2777" strokeWidth="2" strokeDasharray="3 2" fill="none" />

            {/* Vertical Height Measurement Rulers */}
            {/* Right Height: Diaphragm to Waist */}
            <line x1="247" y1="175" x2="275" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="230" y1="50" x2="275" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="270" y1="50" x2="270" y2="175" stroke="#ea580c" strokeWidth="1.5" markerStart="url(#arrow-orange-bb-rep)" markerEnd="url(#arrow-orange-bb-rep)" />

            {/* Left Height: Waist to Close end thigh */}
            <line x1="73" y1="175" x2="45" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="80" y1="300" x2="45" y2="300" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="175" x2="50" y2="300" stroke="#e11d48" strokeWidth="1.5" markerStart="url(#arrow-rose-bb-rep)" markerEnd="url(#arrow-rose-bb-rep)" />

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
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[300px]" style={{ overflow: 'visible' }} overflow="visible">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-bold" fontSize="8">Feet Len: {formatVal('Feet length')}</text>
            </g>
            <g transform="translate(80, 100)" className="text-[8px] font-bold">
              <rect x="-60" y="-7" width="120" height="13" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Heel to End: {formatVal('Length heel to close end')}</text>
            </g>
          </svg>
        );

      case 'Body Shaper':
        return (
          <svg viewBox="0 0 320 395" className="w-full h-full max-h-[300px]">
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

  return (
    <div className="relative w-full aspect-square bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center p-6 overflow-hidden group">
      <div className="w-[260px] h-[260px] flex items-center justify-center relative z-10 transition-transform duration-700 group-hover:scale-105">
        {renderDiagramContent()}
      </div>

      <div className="absolute top-6 right-6">
        <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-100">
          <Activity className="w-3 h-3" />
          Blueprint Calibration
        </div>
      </div>
    </div>
  );
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, patient }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, profile: loggedInProfile } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com'].includes(user?.email?.toLowerCase().trim() || loggedInProfile?.email?.toLowerCase().trim() || '');
  const isAdmin = loggedInProfile?.role === 'admin' || isSuperEmail;

  const displayMeasurements = React.useMemo(() => {
    if (patient.measurements && Array.isArray(patient.measurements)) {
      return patient.measurements;
    }
    
    // Fallback Mock data based on diagnosis
    const diag = (patient.diagnosis || '').toLowerCase();
    if (diag.includes('leg')) {
      return [
        { label: 'Ankle', value: '22.4', x: 200, y: 450 },
        { label: 'Calf', value: '34.8', x: 200, y: 300 },
        { label: 'Thigh', value: '52.1', x: 200, y: 150 },
      ];
    } else if (diag.includes('arm') || diag.includes('sleeve')) {
      return [
        { id: 'wrist', label: 'Wrist', value: '15.5', x: 200, y: 400 },
        { id: 'mid-arm', label: 'Mid Arm', value: '24.2', x: 200, y: 250 },
        { id: 'axilla', label: 'Axilla', value: '32.1', x: 200, y: 100 },
      ];
    } else if (diag.includes('mask') || diag.includes('face')) {
      return [
        { id: 'brow', label: 'Brow', value: '54.0', x: 200, y: 100 },
        { id: 'chin', label: 'Chin to Ear', value: '18.2', x: 140, y: 300 },
        { id: 'neck', label: 'Neck', value: '32.5', x: 200, y: 420 },
      ];
    } else if (diag.includes('vest') || diag.includes('chest')) {
      return [
        { id: 'neck', label: 'Neck', value: '38.0', x: 200, y: 80 },
        { id: 'chest', label: 'Chest', value: '98.5', x: 200, y: 200 },
        { id: 'waist', label: 'Waist', value: '86.2', x: 200, y: 380 },
      ];
    }
    
    // Default: Gloves
    return [
      { label: 'Palm', value: '18.5', x: 200, y: 320 },
      { label: 'Wrist', value: '15.2', x: 200, y: 400 },
      { label: 'Forearm', value: '22.8', x: 200, y: 460 },
    ];
  }, [patient]);

  const subOptions = React.useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(displayMeasurements)) {
      displayMeasurements.forEach(m => {
        if (m && m.label) {
          map[m.label] = m.value !== undefined && m.value !== null ? String(m.value) : '';
        }
      });
    }
    return map;
  }, [displayMeasurements]);

  // Normalize garment type for diagram content selection
  const rawDiag = (patient && patient.diagnosis || '').toLowerCase();
  let normalizedGarment = 'Gloves';
  if (rawDiag.includes('face') || rawDiag.includes('mask')) normalizedGarment = 'Face Mask';
  else if (rawDiag.includes('leg')) normalizedGarment = 'Leg Garment';
  else if (rawDiag.includes('sleeve') || rawDiag.includes('arm')) normalizedGarment = 'Arm Sleeve';
  else if (rawDiag.includes('vest') || rawDiag.includes('chest')) normalizedGarment = 'Vest';

  const garmentType = normalizedGarment;
  
  // Helper to accurately convert modern CSS colors to RGB using the browser's engine
  const resolveModernColors = (css: string) => {
    if (!css || (!css.includes('oklch') && !css.includes('color-mix') && !css.includes('oklab'))) return css;
    
    if (typeof document === 'undefined') return css;
    
    // Create a canvas once to use for color conversion
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

  if (!isOpen) return null;

  const handleManualPrint = () => {
    // Try native print first as it might work if user has direct access
    try {
      // Create a hidden iframe for printing to avoid popup blockers and UI issues
      let printFrame = document.getElementById('print-iframe') as HTMLIFrameElement;
      if (printFrame) {
        document.body.removeChild(printFrame);
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'print-iframe';
      // Set sandbox attributes to allow modals if possible
      printFrame.setAttribute('sandbox', 'allow-modals allow-scripts allow-same-origin allow-popups');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const reportHtml = reportRef.current?.outerHTML || '';
      
      // Clean styles - extract all style and link tags
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
              body { font-family: 'Inter', sans-serif; }
            </style>
            ${styles}
            <style>
              @media print {
                body { margin: 0; padding: 10mm; background: white !important; }
                #printable-report-modal { 
                  position: static !important; 
                  opacity: 1 !important; 
                  visibility: visible !important;
                  display: block !important;
                  width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                }
                .no-print { display: none !important; }
              }
              body { padding: 20px; background: white; }
              #printable-report-modal { opacity: 1 !important; visibility: visible !important; position: static !important; display: block !important; }
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
      // If everything fails, generate PDF as a fallback
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

      // Wait for images to be ready
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
            console.warn("Skipping cross-origin or blockaded stylesheet rules parsing in ReportModal:", sheetErr);
          }
        }
      } catch (globalStyleErr) {
        console.warn("Could not compile parent styles synchronously in ReportModal:", globalStyleErr);
      }

      // Pre-resolve color-space rules (oklch, color-mix) in our gathered styles using our optimized processor
      const resolvedParentStyles = resolveModernColors(parentPageStyles);

      // Give extra time for any late rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2, 
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        backgroundColor: '#ffffff',
        logging: true,
        onclone: (clonedDoc) => {
          // EXTREME SANITIZATION: html2canvas fails on any oklch in any stylesheet
          // 1. Remove all external link stylesheets which might contain incompatible CSS
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

          // 4. Force convert all inline styles on all elements
          const allElements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i] as HTMLElement;
            if (el.style) {
              const styleProps = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke', 'outlineColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
              styleProps.forEach(prop => {
                const styleVal = (el.style as any)[prop];
                if (styleVal && (styleVal.includes('oklch') || styleVal.includes('color-mix') || styleVal.includes('oklab'))) {
                  (el.style as any)[prop] = resolveModernColors(styleVal);
                }
              });
            }
          }

          const el = clonedDoc.getElementById('printable-report-modal');
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
      pdf.save(`Precision_Report_${patientName}.pdf`);
      
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      // More descriptive error for oklch if it still happens
      if (err?.message?.includes('oklch')) {
        alert("The report contains modern CSS colors (oklch) that are currently incompatible with the PDF generator. We are attempting a fallback...");
      } else {
        alert("PDF generation encountered an error. Opening print window instead.");
      }
      handleManualPrint();
    } finally {
      // Restore original sources
      originalImageSrcsLocal.forEach((src: string, el: Element) => {
        if (el instanceof HTMLImageElement) el.src = src;
        else if (el instanceof SVGImageElement) el.setAttribute('href', src);
      });

      // POST-PROCESS: Restore original styles
      originalStyles.forEach((originalCss, tag) => {
        tag.innerHTML = originalCss;
      });
      setIsGenerating(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 md:p-10 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-full rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Clinical Assessment Report</h3>
              <p className="text-xs text-slate-500 font-medium">Record ID: RAPT-{(patient?.id || '0000').slice(0,6)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 justify-end">
            {isAdmin && (
              <button 
                onClick={generatePDF}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-white rounded-xl transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-wider border border-slate-200 disabled:opacity-50"
              >
                <Download className={isGenerating ? "w-4 h-4 animate-bounce" : "w-4 h-4"} />
                <span className="hidden xs:inline">{isGenerating ? 'Processing...' : 'Download PDF'}</span>
                <span className="xs:hidden">{isGenerating ? '...' : 'PDF'}</span>
              </button>
            )}
            <button 
              onClick={handleManualPrint}
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden xs:inline">Print Report</span>
              <span className="xs:hidden">Print</span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-1 sm:mx-2" />
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content (The Report) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-white">
          <div 
            ref={reportRef}
            id="printable-report-modal"
            className="max-w-4xl mx-auto space-y-12 bg-white"
          >
            {/* Report Branding */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white rounded-2xl p-1 shadow-md border border-slate-100">
                  <img 
                    src={logoImg} 
                    alt="OVERPLAST Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight">OVERPLAST</h1>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">Medical Compression</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">Measurement System</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="text-sm font-black text-slate-900">Dr. {patient.doctor || 'Medical Officer'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(patient.created_at).toLocaleDateString()}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  <ClipboardCheck className="w-3 h-3" />
                  Verified Assessment
                </div>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <User className="w-3 h-3" /> Patient Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Full Identity</p>
                        <p className="font-black text-slate-900 text-sm truncate">{patient.full_name}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">City</p>
                        <p className="font-black text-slate-900 text-sm">{patient.city || 'Karachi'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Age</p>
                        <p className="font-bold text-slate-900">{patient.age ? `${patient.age} years` : 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Gender</p>
                        <p className="font-bold text-slate-900 capitalize">{patient.gender || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Contact</p>
                        <p className="font-bold text-slate-900">{patient.phone}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Assigned Surgeon</p>
                        <p className="font-bold text-slate-900">{patient.doctor_name}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Clinic Domicile</p>
                      <p className="font-bold text-slate-700 text-xs leading-relaxed">{patient.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <Hospital className="w-3 h-3" /> Clinical Prescription
                  </h3>
                  <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-100 space-y-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Prescribed Garment</p>
                      <p className="text-2xl font-black text-white uppercase tracking-tight">{(patient.diagnosis || 'Gloves').replace(/All Gloves\/Glove With Sleeve/gi, 'Gloves')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <p className="text-[8px] font-black text-white/70 uppercase">Modality</p>
                        <p className="text-xs font-black text-white">{patient.medical_condition || 'Standard'}</p>
                      </div>
                      <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <p className="text-[8px] font-black text-white/70 uppercase">Material</p>
                        <p className="text-xs font-black text-white">Silicon Coated</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurements Section */}
            <div className="space-y-8 pt-8">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Activity className="w-3 h-3" /> Anatomical Measurements Mapping
              </h3>
              <div className="grid grid-cols-2 gap-16 items-center">
                <SmartDiagram 
                  patient={patient} 
                  subOptions={subOptions} 
                  imageUrl={patient.photo_url}
                />
                <div className="space-y-6">
                  <table className="w-full">
                    <thead className="border-b-2 border-slate-100">
                      <tr>
                        <th className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Anatomical Point</th>
                        <th className="text-right py-4 text-[10px] font-black text-blue-600 uppercase tracking-widest">Circumfernce (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {displayMeasurements.map((m: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm font-black text-slate-900">{m.label}</td>
                          <td className="py-4 text-right">
                            <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg font-black text-slate-900 text-sm">
                              {m.value} cm
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {patient.notes && (
                    <div className="p-6 bg-slate-950 text-white rounded-3xl border border-slate-900 shadow-xl">
                      <p className="text-[9px] font-black tracking-widest text-blue-400 uppercase mb-2">Dr Clinical Remarks</p>
                      <p className="text-xs leading-relaxed font-bold whitespace-pre-wrap break-words italic">
                        "{patient.notes}"
                      </p>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 border-dashed animate-pulse-subtle">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Calibration Systems Protocol</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      All measurements captured using custom anatomical mapping technology. Pressure distribution vectors calibrated for prescribed compression requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Clinical Imagery Section (Requested) */}
            {patient.photo_url && (
              <div className="space-y-6 pt-10 border-t border-slate-50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Camera className="w-3 h-3" /> Clinical Reference Imagery
                </h3>
                <div className="bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100 inline-block max-w-md mx-auto">
                  <img 
                    src={patient.photo_url} 
                    alt="Clinical Assessment" 
                    crossOrigin="anonymous"
                    className="w-full h-auto rounded-3xl shadow-sm border border-white"
                  />
                  <div className="mt-3 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Uploaded Reference File</p>
                  </div>
                </div>
              </div>
            )}

            {/* Report Footer */}
            <div className="pt-20 border-t border-slate-100 flex justify-between items-end">
              <div className="space-y-2">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Verified By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black italic">
                    {patient.doctor_name 
                      ? patient.doctor_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                      : 'AS'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{patient.doctor_name || 'Dr. Ahmed Shah'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Consultant Physio</p>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-4">
                <div className="w-48 h-px bg-slate-900 ml-auto" />
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
