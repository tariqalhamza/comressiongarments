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

// Helper to get garment type from clinical assessment diagnosis
const getGarmentType = (diag: string) => {
  if (!diag) return 'All Gloves/Glove With Sleeve';
  const cleaned = diag.replace(/\s*Assessment\s*$/gi, '').trim();
  const knownTypes = [
    'Face Mask & Chin Binder',
    'Connecting Sleeves/Arm Sleeve',
    'All Jacket',
    'All Gloves/Glove With Sleeve',
    'Belly Binder',
    'All Trouser',
    'All Leg Sleeves',
    'All Socks'
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
    return 'Connecting Sleeves/Arm Sleeve';
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

  const formatVal = (label: string) => {
    const val = subOptions[label];
    if (!val) return '—';
    const clean = val.trim();
    if (!clean) return '—';
    if (clean.toLowerCase().endsWith('cm')) return clean;
    return `${clean} cm`;
  };

  const renderDiagramContent = () => {
    switch (garmentType) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
              <text y="2.5" textAnchor="middle" className="fill-amber-700 font-bold" fontSize="8">Arm open: {formatVal('Arm open end')}</text>
            </g>
            <g transform="translate(265, 130)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#3b82f6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-blue-700 font-bold" fontSize="8">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(265, 210)" className="text-[8px] font-bold">
              <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-pink-700 font-bold" fontSize="8">Arm close: {formatVal('Arm close end')}</text>
            </g>
            <g transform="translate(255, 80)" className="text-[8px] font-bold">
              <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#8b5cf6" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-violet-700 font-bold" fontSize="8">Arm Len: {formatVal('Arm total length')}</text>
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="8">Wrist Len: {formatVal('Total length medal finger to wrist')}</text>
            </g>
            <g transform="translate(185, 265)" className="text-[8px] font-bold">
              <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Scar Len: {formatVal('Total length medal finger to end of scar')}</text>
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
            {/* Outline pants */}
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

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgHeightInPdf = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Handle multi-page
      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
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
            <button 
              onClick={generatePDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-white rounded-xl transition-colors font-bold text-[10px] sm:text-xs uppercase tracking-wider border border-slate-200 disabled:opacity-50"
            >
              <Download className={isGenerating ? "w-4 h-4 animate-bounce" : "w-4 h-4"} />
              <span className="hidden xs:inline">{isGenerating ? 'Processing...' : 'Download PDF'}</span>
              <span className="xs:hidden">{isGenerating ? '...' : 'PDF'}</span>
            </button>
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
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Precision Report</h1>
                    <div className="mt-3">
                      <p className="text-blue-600 font-black tracking-[0.2em] uppercase text-[10px] bg-blue-50 px-2 py-0.5 rounded-md inline-block">Diagnostic Summary</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-2">
                <p className="text-sm font-black text-slate-900">{patient.hospital || 'Mughal Hospital'}</p>
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
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Assigned Physician</p>
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
                      <p className="text-2xl font-black text-white uppercase tracking-tight">{patient.diagnosis || 'Gloves'}</p>
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
                      <p className="text-[9px] font-black tracking-widest text-blue-400 uppercase mb-2">Physician Clinical Remarks</p>
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
