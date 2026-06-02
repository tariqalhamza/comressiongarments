import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Trash2, 
  Calendar, 
  User, 
  Search, 
  Stethoscope, 
  Activity, 
  Download, 
  Printer, 
  Eye, 
  ChevronRight,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { dbService } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

const RegisteredAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<RegisteredAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState<RegisteredAssessment | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<RegisteredAssessment | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await dbService.assessments.getAll();
      setAssessments(data || []);
    } catch (err) {
      console.error('Failed to load registered assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    try {
      await dbService.assessments.delete(assessmentToDelete.id);
      setAssessments(prev => prev.filter(a => a.id !== assessmentToDelete.id));
      if (selectedAssessment?.id === assessmentToDelete.id) {
        setSelectedAssessment(null);
      }
      setAssessmentToDelete(null);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
    }
  };

  const getSvgStringForAssessment = (assessment: RegisteredAssessment) => {
    const formatVal = (label: string) => {
      const key = Object.keys(assessment.sub_options || {}).find(
        k => k.toLowerCase() === label.toLowerCase()
      ) || label;
      
      const val = assessment.sub_options?.[key];
      if (!val) return '—';
      const clean = String(val).trim();
      if (!clean) return '—';
      if (clean.toLowerCase().endsWith('cm')) return clean;
      return `${clean} cm`;
    };

    const garment = assessment.garment_type;
    
    if (garment === 'Face Mask & Chin Binder') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M100,240 Q70,160 130,80 Q190,40 240,110 Q260,150 250,210 Q230,260 170,260 Q130,260 100,240 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <path d="M110,230 Q140,240 170,230 Q190,200 190,170 Q160,161 140,170 Q110,180 110,230 Z" fill="#bfdbfe" fill-opacity="0.4" />
        <path d="M130,85 Q190,65 235,115" stroke="#2563eb" stroke-width="2.5" stroke-dasharray="4,4" fill="none" />
        <circle cx="180" cy="72" r="5" fill="#2563eb" />
        <path d="M245,150 Q160,245 125,215" stroke="#10b981" stroke-width="2.5" stroke-dasharray="4,4" fill="none" />
        <path d="M125,255 Q165,275 220,245" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="4,4" fill="none" />
        <path d="M165,225 L165,275" stroke="#dc2626" stroke-width="2.5" fill="none" />
        
        <g transform="translate(180, 50)">
          <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#2563eb" stroke-width="1" />
          <text y="3" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="9" font-weight="bold">Head: ${formatVal('Around head')}</text>
        </g>
        <g transform="translate(225, 205)">
          <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#10b981" stroke-width="1" />
          <text y="3" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="9" font-weight="bold">Chin: ${formatVal('Around chin')}</text>
        </g>
        <g transform="translate(165, 290)">
          <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#f59e0b" stroke-width="1" />
          <text y="3" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="9" font-weight="bold">Neck: ${formatVal('Around neck')}</text>
        </g>
        <g transform="translate(240, 245)">
          <rect x="-60" y="-8" width="120" height="15" rx="4" fill="white" stroke="#dc2626" stroke-width="1" />
          <text y="3" text-anchor="middle" fill="#dc2626" font-family="sans-serif" font-size="8" font-weight="bold">Neck Len: ${formatVal('Neck length')}</text>
        </g>
      </svg>`;
    }
    
    if (garment === 'Connecting Sleeves/Arm Sleeve') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M50,80 C70,75 130,100 170,120 C220,145 260,180 270,220 C250,230 230,210 200,190 C150,160 90,135 60,140 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <path d="M55,77 L62,143" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <path d="M100,100 L110,147" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <path d="M175,123 L185,160" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <path d="M245,165 L255,195" stroke="#ec4899" stroke-width="2" stroke-dasharray="3,3"/>
        <path d="M58,110 Q150,130 250,180" stroke="#7c3aed" stroke-width="2.5" fill="none" />
        
        <g transform="translate(60, 45)">
          <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="9" font-weight="bold">Shoulder: ${formatVal('Shoulder')}</text>
        </g>
        <g transform="translate(105, 75)">
          <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="9" font-weight="bold">Arm pit: ${formatVal('Arm pit')}</text>
        </g>
        <g transform="translate(175, 95)">
          <rect x="-50" y="-7" width="100" height="14" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="9" font-weight="bold">Elbow: ${formatVal('Elbow')}</text>
        </g>
        <g transform="translate(255, 140)">
          <rect x="-50" y="-7" width="100" height="14" rx="3" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="9" font-weight="bold">Wrist: ${formatVal('Wrist')}</text>
        </g>
        <g transform="translate(160, 225)">
          <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="9" font-weight="bold">Total Arm: ${formatVal('Total arm length')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Jacket') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M80,60 L220,60 L240,110 L280,180 L250,195 L220,140 L215,250 L85,250 L80,140 L50,195 L20,180 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <line x1="85" y1="110" x2="215" y2="110" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="85" y1="200" x2="215" y2="200" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="220" y1="60" x2="280" y2="180" stroke="#f59e0b" stroke-width="2" />
        <line x1="150" y1="60" x2="150" y2="250" stroke="#ec4899" stroke-width="2" />
        
        <g transform="translate(150, 20)">
          <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Neck: ${formatVal('Neck around')}</text>
        </g>
        <g transform="translate(150, 40)">
          <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#dc2626" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#dc2626" font-family="sans-serif" font-size="8" font-weight="bold">Neck Len: ${formatVal('Neck length')}</text>
        </g>
        <g transform="translate(55, 50)">
          <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Shoulder: ${formatVal('Shoulder')}</text>
        </g>
        <g transform="translate(55, 140)">
          <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Arm Pit: ${formatVal('Arm pit')}</text>
        </g>
        <g transform="translate(30, 210)">
          <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Arm Open: ${formatVal('Arm open end')}</text>
        </g>
        <g transform="translate(265, 130)">
          <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#3b82f6" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#3b82f6" font-family="sans-serif" font-size="8" font-weight="bold">Elbow: ${formatVal('Elbow')}</text>
        </g>
        <g transform="translate(265, 210)">
          <rect x="-45" y="-6.5" width="90" height="13" rx="2" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="8" font-weight="bold">Arm Close: ${formatVal('Arm close end')}</text>
        </g>
        <g transform="translate(255, 80)">
          <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#8b5cf6" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#8b5cf6" font-family="sans-serif" font-size="8" font-weight="bold">Arm Length: ${formatVal('Arm total length')}</text>
        </g>
        <g transform="translate(150, 105)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Chest: ${formatVal('Chest')}</text>
        </g>
        <g transform="translate(150, 137)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Diapharm: ${formatVal('Diapharm')}</text>
        </g>
        <g transform="translate(150, 170)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Belly: ${formatVal('Belly')}</text>
        </g>
        <g transform="translate(150, 202)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#e11d48" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-size="8" font-weight="bold">Waist: ${formatVal('Waist')}</text>
        </g>
        <g transform="translate(150, 235)">
          <rect x="-55" y="-6.2" width="110" height="13" rx="2" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="8" font-weight="bold">Total Len: ${formatVal('Total length')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Gloves/Glove With Sleeve') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M120,280 L120,220 C110,210 90,190 90,150 L90,90 C90,80 110,80 110,95 L110,140 L130,140 L130,70 C130,60 150,60 150,75 L150,130 L170,130 L170,60 C170,50 190,50 190,65 L190,130 L210,130 L210,80 C210,70 230,70 230,85 L230,135 L250,150 L250,280 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <line x1="90" y1="165" x2="250" y2="165" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="120" y1="210" x2="250" y2="210" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="185" y1="210" x2="185" y2="280" stroke="#f59e0b" stroke-width="2" />
        <line x1="90" y1="140" x2="250" y2="140" stroke="#ec4899" stroke-width="2" stroke-dasharray="3,3" />
        
        <g transform="translate(170, 155)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Palm: ${formatVal('Palm')}</text>
        </g>
        <g transform="translate(185, 195)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Wrist: ${formatVal('Wrist')}</text>
        </g>
        <g transform="translate(185, 230)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Finger to Wrist: ${formatVal('Total length medal finger to wrist')}</text>
        </g>
        <g transform="translate(185, 265)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Finger to End: ${formatVal('Total length medal finger to end of scar')}</text>
        </g>
        <g transform="translate(150, 45)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#4f46e5" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#4f46e5" font-family="sans-serif" font-size="8" font-weight="bold">Medal: ${formatVal('Medal finger')}</text>
        </g>
        <g transform="translate(110, 65)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#0891b2" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="8" font-weight="bold">Left: ${formatVal('Left finger')}</text>
        </g>
        <g transform="translate(210, 75)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#059669" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#059669" font-family="sans-serif" font-size="8" font-weight="bold">Right: ${formatVal('Right finger')}</text>
        </g>
        <g transform="translate(245, 110)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Small: ${formatVal('Small finger')}</text>
        </g>
        <g transform="translate(85, 115)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#ea580c" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ea580c" font-family="sans-serif" font-size="8" font-weight="bold">Thumb: ${formatVal('Thumb')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'Belly Binder') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M80,50 L220,50 L200,240 L100,240 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <path d="M85,100 L215,100 L205,190 L95,190 Z" fill="#bfdbfe" fill-opacity="0.5" stroke="#60a5fa" stroke-width="1.5" />
        <line x1="85" y1="100" x2="215" y2="100" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="95" y1="190" x2="205" y2="190" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="230" y1="100" x2="230" y2="190" stroke="#f59e0b" stroke-width="2" />
        
        <g transform="translate(150, 75)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Diaphrarm: ${formatVal('Diaphrarm')}</text>
        </g>
        <g transform="translate(150, 115)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Belly: ${formatVal('Belly')}</text>
        </g>
        <g transform="translate(150, 155)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Waist: ${formatVal('Waist')}</text>
        </g>
        <g transform="translate(150, 195)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Open Thigh: ${formatVal('Open end thigh')}</text>
        </g>
        <g transform="translate(150, 230)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Close Thigh: ${formatVal('Close end thigh')}</text>
        </g>
        <g transform="translate(150, 265)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#0891b2" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="8" font-weight="bold">Knee: ${formatVal('Knee')}</text>
        </g>
        <g transform="translate(250, 115)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#ea580c" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ea580c" font-family="sans-serif" font-size="8" font-weight="bold">Dia to Waist: ${formatVal('length diaphragm to waist')}</text>
        </g>
        <g transform="translate(250, 195)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#e11d48" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-size="8" font-weight="bold">Waist to Close: ${formatVal('Length waist to close end')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Trouser') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M100,40 L200,40 L210,100 L230,260 L180,260 L150,110 L120,260 L70,260 L90,100 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <line x1="100" y1="40" x2="200" y2="40" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="90" y1="85" x2="210" y2="85" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="85" y1="125" x2="145" y2="125" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="150" y1="110" x2="120" y2="260" stroke="#ec4899" stroke-width="2" />
        <line x1="70" y1="250" x2="120" y2="250" stroke="#7c3aed" stroke-width="2" stroke-dasharray="3,3"/>
        
        <g transform="translate(150, 25)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Diaphrarm: ${formatVal('Diaphrarm')}</text>
        </g>
        <g transform="translate(150, 60)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Belly: ${formatVal('Belly')}</text>
        </g>
        <g transform="translate(150, 95)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Waist: ${formatVal('Waist')}</text>
        </g>
        <g transform="translate(100, 135)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Open Thigh: ${formatVal('Open end thigh')}</text>
        </g>
        <g transform="translate(100, 175)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Close Thigh: ${formatVal('Close end thigh')}</text>
        </g>
        <g transform="translate(100, 215)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#0891b2" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="8" font-weight="bold">Knee: ${formatVal('Knee')}</text>
        </g>
        <g transform="translate(100, 255)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#e11d48" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-size="8" font-weight="bold">Ankle: ${formatVal('Ankle')}</text>
        </g>
        <g transform="translate(235, 60)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#ea580c" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ea580c" font-family="sans-serif" font-size="8" font-weight="bold">Dia to Waist: ${formatVal('length diaphragm to waist')}</text>
        </g>
        <g transform="translate(235, 175)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Waist to Ankle: ${formatVal('Length waist to ankle')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Leg Sleeves') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M100,50 L200,50 L180,240 L120,240 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <line x1="100" y1="50" x2="200" y2="50" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="110" y1="140" x2="190" y2="140" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="120" y1="240" x2="180" y2="240" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="220" y1="50" x2="220" y2="240" stroke="#ec4899" stroke-width="2" />
        
        <g transform="translate(150, 35)">
          <rect x="-50" y="-7" width="100" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Open End: ${formatVal('Open end')}</text>
        </g>
        <g transform="translate(150, 125)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Knee: ${formatVal('Knee')}</text>
        </g>
        <g transform="translate(150, 215)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Close End: ${formatVal('Close end')}</text>
        </g>
        <g transform="translate(235, 125)">
          <rect x="-50" y="-7" width="100" height="13" rx="3" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="8" font-weight="bold">Total Len: ${formatVal('Total length')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Socks') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <path d="M120,40 L190,40 L190,160 L260,210 L230,250 L110,160 Z" fill="#eff6ff" stroke="#93c5fd" stroke-width="2" />
        <line x1="120" y1="160" x2="190" y2="160" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="110" y1="160" x2="230" y2="250" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
        <line x1="120" y1="40" x2="110" y2="160" stroke="#f59e0b" stroke-width="2" />
        
        <g transform="translate(155, 30)">
          <rect x="-60" y="-7" width="120" height="13" rx="3" fill="white" stroke="#da70d6" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#da70d6" font-family="sans-serif" font-size="8" font-weight="bold">Open End: ${formatVal('Above ankle open end')}</text>
        </g>
        <g transform="translate(155, 75)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#ff4500" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ff4500" font-family="sans-serif" font-size="8" font-weight="bold">Close End: ${formatVal('Close end')}</text>
        </g>
        <g transform="translate(155, 145)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Ankle: ${formatVal('Ankle')}</text>
        </g>
        <g transform="translate(185, 205)">
          <rect x="-40" y="-7" width="80" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Feet: ${formatVal('Feet')}</text>
        </g>
        <g transform="translate(230, 245)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Feet Length: ${formatVal('Feet length')}</text>
        </g>
        <g transform="translate(80, 100)">
          <rect x="-60" y="-7" width="120" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Heel to End: ${formatVal('Length heel to close end')}</text>
        </g>
      </svg>`;
    }

    return '';
  };

  const generateSvgPng = (assessment: RegisteredAssessment): Promise<string> => {
    const svgStr = getSvgStringForAssessment(assessment);
    if (!svgStr) return Promise.resolve('');
    
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 600, 600);
          ctx.drawImage(img, 0, 0, 600, 600);
          const pngData = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(pngData);
        } else {
          URL.revokeObjectURL(url);
          resolve('');
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    });
  };

  const handleDownloadPDF = async (assessment: RegisteredAssessment) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CLINICAL ASSESSMENT MEMORANDUM", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: ${assessment.id}`, 20, 32);
    doc.text(`Created Date: ${new Date(assessment.created_at).toLocaleString()}`, 20, 37);

    doc.setDrawColor(220, 224, 230);
    doc.line(20, 42, 190, 42);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. CLINICAL METADATA", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Patient Full Name: ${assessment.patient_name || 'N/A'}`, 25, 58);
    doc.text(`Hospital Unit: ${assessment.hospital_name || 'N/A'}`, 25, 64);
    doc.text(`Referencing Physician: ${assessment.doctor_ref || 'N/A'}`, 25, 70);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. COMPRESSION SPECIFICATIONS", 20, 82);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Garment Core Unit: ${assessment.garment_type}`, 25, 90);
    doc.text(`Compression Profile: ${assessment.compression}`, 25, 96);
    doc.text(`Silicone Integration: ${assessment.silicone_pasting}`, 25, 102);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. CLINICAL NOTES", 20, 114);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitNotes = doc.splitTextToSize(assessment.notes || "No extra medical notes entered.", 160);
    doc.text(splitNotes, 25, 122);

    // Dynamic Svg Drawing inclusion (with measurements loaded)
    const offset = 150;
    
    // Draw visual diagram on the right side if available
    const drawingPng = await generateSvgPng(assessment);
    if (drawingPng) {
      // Box frame for visual representation
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setFillColor(250, 250, 250); // slate-50
      doc.roundedRect(115, offset, 75, 82, 3, 3, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500 text
      doc.text("GARMENT VISUAL LAYOUT / بصری خاکہ", 119, offset + 6);
      
      doc.addImage(drawingPng, 'PNG', 117, offset + 10, 71, 68);
      
      // Reset color state for subsequent text
      doc.setTextColor(0, 0, 0); 
    }

    // Anatomical values on the left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("4. SPECIFICATION CALIBRATION MATRIX", 20, offset);

    let currentY = offset + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const subOptionsList = Object.entries(assessment.sub_options || {})
      .filter(([_, value]) => value !== undefined && value !== '');

    if (subOptionsList.length > 0) {
      subOptionsList.forEach(([key, value]) => {
        if (currentY < 270) {
          doc.text(`• ${key.toUpperCase()}: ${value} cm`, 25, currentY);
          currentY += 6;
        }
      });
    } else {
      doc.text("No specific anatomical points registered details.", 25, currentY);
    }

    doc.save(`Assessment_${assessment.patient_name.replace(/\s+/g, '_')}_Report.pdf`);
  };

  const filtered = assessments.filter(a => 
    a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.garment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderAssessmentDrawingSvg = (assessment: RegisteredAssessment) => {
    const formatVal = (label: string) => {
      const key = Object.keys(assessment.sub_options || {}).find(
        k => k.toLowerCase() === label.toLowerCase()
      ) || label;
      
      const val = assessment.sub_options?.[key];
      if (!val) return '—';
      const clean = String(val).trim();
      if (!clean) return '—';
      if (clean.toLowerCase().endsWith('cm')) return clean;
      return `${clean} cm`;
    };

    switch (assessment.garment_type) {
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
            <g transform="translate(180, 50)" className="text-[10px] font-black">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#2563eb" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>
            <g transform="translate(225, 205)" className="text-[10px] font-black">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#10b981" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>
            <g transform="translate(165, 290)" className="text-[10px] font-black">
              <rect x="-55" y="-8" width="110" height="15" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>
            <g transform="translate(240, 245)" className="text-[10px] font-black">
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
              <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#10b981" strokeWidth="0.5" />
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
              <text y="2.5" textAnchor="middle" className="fill-purple-600 font-bold" fontSize="8">Finger to End: {formatVal('Total length medal finger to end of scar')}</text>
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
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 h-full text-slate-400 font-bold uppercase tracking-widest text-xs">
            No Drawing Visual Available
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 select-none">
      
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search assessments by patient name, organization..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>
        
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100/50 px-4 py-3 rounded-2xl border border-slate-50/20">
          Total Base Records: <span className="text-slate-900 font-extrabold">{filtered.length} Assessments</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Clinical Memo Base...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 medical-card border-dashed border-2 flex flex-col items-center text-center opacity-70">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
            <ClipboardCheck className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Registered Assessments Yet</h3>
          <p className="text-xs text-slate-500 font-semibold max-w-sm mt-2">
            Clinical Assessment section me jakar report complete hone per standard "Save Assessment" select karein taaki wo is database me save ho saken.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List of Assessments (col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Assessments Stream</h4>
            
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
              {filtered.map((assessment) => {
                const isActive = selectedAssessment?.id === assessment.id;
                const dateString = new Date(assessment.created_at).toLocaleDateString('ur-PK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div 
                    key={assessment.id}
                    onClick={() => setSelectedAssessment(assessment)}
                    className={`medical-card p-6 cursor-pointer transition-all border ${
                      isActive 
                        ? "border-blue-500 bg-blue-50/20 shadow-blue-50/50 scale-[1.01]" 
                        : "border-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Accent visual */}
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg">
                        {assessment.patient_name ? assessment.patient_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-extrabold text-slate-900 truncate">
                            {assessment.patient_name}
                          </h3>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" /> {dateString}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{assessment.hospital_name || 'Generic Clinic'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                            {assessment.garment_type}
                          </span>
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                            {assessment.compression}
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className={`w-4 h-4 transition-transform text-slate-400 ${isActive ? 'rotate-180 text-blue-500' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assessment Detailed Preview Widget (col-span-5) */}
          <div className="lg:col-span-5">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 ml-1">Calibration Memorandum</h4>
            
            <AnimatePresence mode="wait">
              {selectedAssessment ? (
                <motion.div 
                  key={selectedAssessment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl space-y-6 sticky top-8"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div>
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl uppercase tracking-widest">Live Record Verified</span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2">{selectedAssessment.patient_name}</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">{selectedAssessment.hospital_name}</p>
                    </div>
                    
                    <button 
                      onClick={() => setAssessmentToDelete(selectedAssessment)}
                      className="p-3 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-2xl transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Patient Demographics */}
                  <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3.5 rounded-3xl border border-blue-50">
                    <div className="text-center p-2 bg-white rounded-2xl shadow-sm border border-slate-50/60">
                      <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">Age / عمر</span>
                      <span className="font-extrabold text-blue-900 text-xs block">{selectedAssessment.age ? `${selectedAssessment.age} Yrs` : 'N/A'}</span>
                    </div>
                    <div className="text-center p-2 bg-white rounded-2xl shadow-sm border border-slate-50/60">
                      <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">Gender / جنس</span>
                      <span className="font-extrabold text-blue-900 text-xs block uppercase">{selectedAssessment.gender || 'N/A'}</span>
                    </div>
                    <div className="text-center p-2 bg-white rounded-2xl shadow-sm border border-slate-50/60">
                      <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest leading-none mb-1">City / شہر</span>
                      <span className="font-extrabold text-blue-900 text-xs block truncate uppercase">{selectedAssessment.city || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Specification List */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Unit</span>
                      <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{selectedAssessment.garment_type}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Compression</span>
                      <span className="font-extrabold text-slate-850 text-xs block mt-1">{selectedAssessment.compression}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Silicone Profile</span>
                      <span className="font-extrabold text-slate-800 text-xs block mt-1">{selectedAssessment.silicone_pasting}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Doctor Reference</span>
                      <span className="font-extrabold text-slate-800 text-xs block mt-1">{selectedAssessment.doctor_ref || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Anatomical calibration details */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50/50 p-2 rounded-xl">
                      <Activity className="w-3.5 h-3.5 text-blue-500" /> Anatomical Specifications Matrix
                    </h4>

                    {/* Live Diagram Schematic Drawing */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col items-center justify-center relative">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Live Garment Template / بصری خاکہ</div>
                      <div className="w-full h-full max-h-[310px] flex justify-center bg-white rounded-xl p-3 shadow-inner border border-slate-100">
                        {renderAssessmentDrawingSvg(selectedAssessment)}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50/20 border border-slate-100 p-4 rounded-2xl max-h-[160px] overflow-y-auto space-y-2">
                      {Object.entries(selectedAssessment.sub_options || {})
                        .filter(([_, val]) => val !== undefined && val !== '')
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-xs pb-1.5 border-b border-dashed border-slate-100 last:border-none last:pb-0">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{key}</span>
                            <span className="font-extrabold text-slate-900">{val} cm</span>
                          </div>
                        ))}
                      {Object.entries(selectedAssessment.sub_options || {}).filter(([_, val]) => val !== undefined && val !== '').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No specific measurements recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Notes snippet */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Medical Condition & Remarks</span>
                    <p className="text-xs text-slate-650 font-bold leading-relaxed bg-slate-50/40 border border-slate-100/50 p-4 rounded-2xl max-h-[100px] overflow-y-auto whitespace-pre-wrap font-mono">
                      {selectedAssessment.notes || "No standard notes recorded details."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button 
                      onClick={() => handleDownloadPDF(selectedAssessment)}
                      className="py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent shadow-lg shadow-slate-100 hover:scale-[1.02]"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Document
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadPDF(selectedAssessment)} // Re-using PDF for consistent standard download output
                      className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:scale-[1.02]"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Copy
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-slate-50/40 rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center h-[500px]">
                  <FileText className="w-12 h-12 text-slate-300 mb-4 stroke-[1.5]" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                    Select an assessment card from the list to view clinical specifications.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {assessmentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-6 mx-auto text-red-500">
              <BadgeAlert className="w-8 h-8 animate-bounce" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight text-center mb-2 uppercase">
              Delete Assessment Record
            </h3>
            <p className="text-xs text-slate-500 text-center mb-8 font-black uppercase tracking-wider">
              Bhai, are you sure you want to delete this completed assessment for <span className="font-extrabold text-red-500">{assessmentToDelete.patient_name}</span>? Is operation ko reverse nahi kia ja sakta.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setAssessmentToDelete(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors"
              >
                No, Keep it
              </button>
              <button 
                onClick={handleDeleteAssessment}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredAssessments;
