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

  const formatVal = (label: string) => {
    let val = subOptions[label];

    // Fallback mappings for backwards compatibility
    if (!val) {
      if (label === 'Middle finger') val = subOptions['Medal finger'];
      else if (label === 'Index finger') val = subOptions['Left finger'];
      else if (label === 'Ring finger') val = subOptions['Right finger'];
      else if (label === 'Little finger') val = subOptions['Small finger'];
      else if (label === 'Total length middle finger to wrist') val = subOptions['Total length medal finger to wrist'];
      else if (label === 'Total length middle finger to end of scar') val = subOptions['Total length medal finger to end of scar'];
      // Belly Binder mappings
      else if (label === 'Diaphrom') val = subOptions['Diaphrarm'];
      else if (label === 'West (Waist)' || label === 'West') val = subOptions['Waist'];
      else if (label === 'Open End') val = subOptions['Open end thigh'];
      else if (label === 'Close End (Leg end)') val = subOptions['Close end thigh'];
      else if (label === 'Length Diaphrom to West') val = subOptions['length diaphragm to waist'];
      else if (label === 'Short Length') val = subOptions['Length waist to close end'];
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

            {/* 3. Elbow loop on left sleeve */}
            <ellipse cx="66" cy="182" rx="11" ry="4" transform="rotate(-40, 66, 182)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 4. Wrist loop on left sleeve */}
            <ellipse cx="55" cy="259" rx="8" ry="3" transform="rotate(-40, 55, 259)" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />

            {/* 5. Total arm length path along left sleeve-edge */}
            <path d="M 65,115 Q 52,185 48,260" stroke="#7c3aed" strokeWidth="2.2" strokeDasharray="3 3" fill="none" />

            {/* Labels overlay */}
            <g transform="translate(150, 65)">
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-extrabold text-[9px]" fontSize="9">Shoulder: {formatVal('Shoulder')}</text>
            </g>
            <g transform="translate(150, 155)">
              <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-purple-600 font-extrabold text-[9px]" fontSize="9">Total Arm: {formatVal('Total arm length')}</text>
            </g>
            <g transform="translate(132, 122)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold text-[9px]" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(122, 185)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold text-[9px]" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(112, 255)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-extrabold text-[9px]" fontSize="9">Wrist: {formatVal('Wrist')}</text>
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
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-extrabold text-[9px]" fontSize="9">Arm pit: {formatVal('Arm pit')}</text>
            </g>
            <g transform="translate(185, 175)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-extrabold text-[9px]" fontSize="9">Elbow: {formatVal('Elbow')}</text>
            </g>
            <g transform="translate(75, 235)">
              <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" strokeWidth="0.5" />
              <text y="3" textAnchor="middle" className="fill-rose-500 font-extrabold text-[9px]" fontSize="9">Wrist: {formatVal('Wrist')}</text>
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
          const isLeftHand = handSelectionVal === 'Left Hand Glove';
          const xThumb = isLeftHand ? 277 : 43;
          const xLeftFinger = isLeftHand ? 209 : 111;
          const xMiddleFinger = isLeftHand ? 172 : 148;
          const xRightFinger = isLeftHand ? 139 : 181;
          const xSmallFinger = isLeftHand ? 110 : 210;

          return (
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
              <line x1="35" y1="48" x2="35" y2="275" stroke="#d97706" strokeWidth="1.5" markerStart="url(#arrow-amber-rep)" markerEnd="url(#arrow-amber-rep)" />

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
          <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
            {/* Outline pants */}
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
