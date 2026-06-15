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
  Eye, 
  ChevronRight,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { dbService } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from '../lib/utils';
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
  photo_url?: string;
  created_at: string;
  age?: number;
  gender?: string;
  city?: string;
}

interface RegisteredAssessmentsProps {
  initialSearchPatientName?: string;
}

const RegisteredAssessments: React.FC<RegisteredAssessmentsProps> = ({ initialSearchPatientName = '' }) => {
  const [assessments, setAssessments] = useState<RegisteredAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchPatientName);
  const [selectedAssessment, setSelectedAssessment] = useState<RegisteredAssessment | null>(null);
  const [activeBothHandView, setActiveBothHandView] = useState<'Right' | 'Left'>('Right');
  const [assessmentToDelete, setAssessmentToDelete] = useState<RegisteredAssessment | null>(null);
  const [patientPhotos, setPatientPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAssessments();
  }, [initialSearchPatientName]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const data = await dbService.assessments.getAll();
      setAssessments(data || []);
      
      // Load patients to resolve any missing photos automatically
      try {
        const patientsData = await dbService.patients.getAll();
        if (patientsData && patientsData.length > 0) {
          const photoMap: Record<string, string> = {};
          patientsData.forEach(p => {
            if (p.photo_url) {
              photoMap[p.full_name?.toLowerCase().trim()] = p.photo_url;
              if (p.id) {
                photoMap[p.id] = p.photo_url;
              }
            }
          });
          setPatientPhotos(photoMap);
        }
      } catch (pErr) {
        console.warn('Could not load patient list for photo map:', pErr);
      }

      if (initialSearchPatientName) {
        const matched = data?.find(a => 
          a.patient_name.toLowerCase().trim() === initialSearchPatientName.toLowerCase().trim()
        );
        if (matched) {
          setSelectedAssessment(matched);
        } else {
          const partMatched = data?.find(a => 
            a.patient_name.toLowerCase().includes(initialSearchPatientName.toLowerCase())
          );
          if (partMatched) {
            setSelectedAssessment(partMatched);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load registered assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentPhoto = (assessment: RegisteredAssessment | null): string | undefined => {
    if (!assessment) return undefined;
    if (assessment.photo_url) return assessment.photo_url;
    if (assessment.photos && assessment.photos.length > 0) {
      return assessment.photos[assessment.photos.length - 1];
    }
    const nameKey = assessment.patient_name?.toLowerCase().trim();
    if (nameKey && patientPhotos[nameKey]) {
      return patientPhotos[nameKey];
    }
    const idKey = (assessment as any).patient_id;
    if (idKey && patientPhotos[idKey]) {
      return patientPhotos[idKey];
    }
    return undefined;
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
      let key = Object.keys(assessment.sub_options || {}).find(
        k => k.toLowerCase() === label.toLowerCase()
      ) || label;
      
      let val = assessment.sub_options?.[key];
      
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
        // Belly Binder mappings
        else if (label === 'Diaphrom') fallbackKey = 'Diaphrarm';
        else if (label === 'West (Waist)' || label === 'West' || label === 'Waist') fallbackKey = 'Waist';
        else if (label === 'Open End') fallbackKey = 'Open end thigh';
        else if (label === 'Close End (Leg end)') fallbackKey = 'Close end thigh';
        else if (label === 'Length Diaphrom to West' || label === 'Length Diaphrom to Waist') fallbackKey = 'length diaphragm to waist';
        else if (label === 'Short Length' || label === 'Waist to Close End') fallbackKey = 'Waist to Close End';
        // All Trouser backwards compatibility fallbacks
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
          key = Object.keys(assessment.sub_options || {}).find(
            k => k.toLowerCase() === fallbackKey.toLowerCase()
          ) || fallbackKey;
          val = assessment.sub_options?.[key];
        }
      }

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
    
    if (garment === 'Connecting Sleeves/Arm Sleeve' || garment === 'Connecting Sleeves') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Torso Back View Background -->
        <ellipse cx="150" cy="45" rx="16" ry="20" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1" />
        <path d="M 142,60 L 142,85 C 145,88 155,88 158,85 L 158,60 Z" fill="#f4f4f5" stroke="#e4e4e7" stroke-width="1" />
        <path d="M 130,85 C 95,90 70,105 60,115 L 75,280 L 225,280 L 240,115 C 230,105 205,90 170,85 Z" fill="#fafafa" stroke="#e4e4e7" stroke-width="1" />

        <!-- Bolero garment outline (collar scoop, sleeves, back connector band) -->
        <path 
          d="M 120,90 Q 150,105 180,90 C 210,95 225,103 235,115 Q 252,187 252,260 L 238,258 Q 225,187 205,145 Q 150,132 95,145 Q 75,187 62,258 L 48,260 Q 48,187 65,115 C 75,103 90,95 120,90 Z" 
          fill="#eff6ff" 
          fill-opacity="0.85"
          stroke="#2563eb" 
          stroke-width="2" 
        />

        <!-- Measurement lines -->
        <!-- 1. Shoulder indicator -->
        <line x1="65" y1="115" x2="235" y2="115" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="65" cy="115" r="3.5" fill="#2563eb" />
        <circle cx="235" cy="115" r="3.5" fill="#2563eb" />

        <!-- 2. Arm Pit loop on left sleeve -->
        <ellipse cx="79" cy="131" rx="15" ry="5" transform="rotate(-40, 79, 131)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="2,2" fill="none" />

        <!-- 3. Elbow loop on left sleeve -->
        <ellipse cx="66" cy="182" rx="11" ry="4" transform="rotate(-40, 66, 182)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2" fill="none" />

        <!-- 4. Wrist loop on left sleeve -->
        <ellipse cx="55" cy="259" rx="8" ry="3" transform="rotate(-40, 55, 259)" stroke="#ec4899" stroke-width="1.5" stroke-dasharray="2,2" fill="none" />

        <!-- 5. Total arm length path along left sleeve-edge -->
        <path d="M 65,115 Q 52,185 48,260" stroke="#7c3aed" stroke-width="2.2" stroke-dasharray="3,3" fill="none" />

        <!-- Labels overlay -->
        <g transform="translate(150, 65)">
          <rect x="-55" y="-7" width="110" height="14" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="9" font-weight="bold">Shoulder: ${formatVal('Shoulder')}</text>
        </g>
        <g transform="translate(150, 155)">
          <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="9" font-weight="bold">Total Arm: ${formatVal('Total arm length')}</text>
        </g>
        <g transform="translate(132, 122)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="9" font-weight="bold">Arm pit: ${formatVal('Arm pit')}</text>
        </g>
        <g transform="translate(122, 185)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="9" font-weight="bold">Elbow: ${formatVal('Elbow')}</text>
        </g>
        <g transform="translate(112, 255)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="9" font-weight="bold">Wrist: ${formatVal('Wrist')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'Arm sleeve Right Hand' || garment === 'Arm sleeve Left Hand') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
        <!-- Cylinder sleeve body -->
        <polygon points="190,85 78,175 102,205 230,135" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />

        <!-- Upper arm opening (Arm pit) -->
        <ellipse cx="210" cy="110" rx="26" ry="12" transform="rotate(56, 210, 110)" fill="#eff6ff" stroke="#10b981" stroke-width="2" />

        <!-- Elbow loop -->
        <ellipse cx="149" cy="148" rx="20" ry="10" transform="rotate(56, 149, 148)" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3" />

        <!-- Wrist opening (Wrist loop) -->
        <ellipse cx="90" cy="190" rx="16" ry="8" transform="rotate(56, 90, 190)" fill="#dbeafe" stroke="#ec4899" stroke-width="2" />

        <!-- Total length parallel arrow indicator -->
        <line x1="175" y1="75" x2="55" y2="155" stroke="#7c3aed" stroke-width="2" />
        
        <!-- Arrowhead top-right -->
        <path d="M 163,77 L 175,75 L 173,87" stroke="#7c3aed" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        
        <!-- Arrowhead bottom-left -->
        <path d="M 67,153 L 55,155 L 57,143" stroke="#7c3aed" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Labels overlay -->
        <g transform="translate(100, 95)">
          <rect x="-65" y="-7" width="130" height="14" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="9" font-weight="bold">Total Arm: ${formatVal('Total arm length')}</text>
        </g>
        <g transform="translate(245, 100)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="9" font-weight="bold">Open End: ${formatVal('Open End')}</text>
        </g>
        <g transform="translate(185, 175)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="9" font-weight="bold">Elbow: ${formatVal('Elbow')}</text>
        </g>
        <g transform="translate(75, 235)">
          <rect x="-42" y="-7" width="84" height="14" rx="3" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="3" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="9" font-weight="bold">Close End: ${formatVal('Close End')}</text>
        </g>
      </svg>`;
    }

    if (garment === 'All Jacket') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="300" height="300">
        <path d="M 134,80 Q 150,86 166,80 L 200,80 L 250,140 L 280,195 L 268,201 L 238,148 L 195,115 L 195,245 L 105,245 L 105,115 L 62,148 L 32,201 L 20,195 L 50,140 L 100,80 Z" fill="#eff6ff" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" />
        
        <ellipse cx="150" cy="79" rx="16" ry="5" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
        
        <line x1="105" y1="125" x2="195" y2="125" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" />
        <line x1="105" y1="158" x2="195" y2="158" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
        <line x1="105" y1="191" x2="195" y2="191" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3,3" />
        <line x1="105" y1="224" x2="195" y2="224" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,3" />
        
        <line x1="93" y1="80" x2="93" y2="245" stroke="#4f46e5" stroke-width="1.5" stroke-dasharray="2,2" />
        <path d="M 89,87 L 93,80 L 97,87" stroke="#4f46e5" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M 89,238 L 93,245 L 97,238" stroke="#4f46e5" stroke-width="1.5" fill="none" stroke-linecap="round" />
        
        <line x1="100" y1="65" x2="200" y2="65" stroke="#7c3aed" stroke-width="1.5" />
        <path d="M 107,61 L 100,65 L 107,69" stroke="#7c3aed" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M 193,61 L 200,65 L 193,69" stroke="#7c3aed" stroke-width="1.5" fill="none" stroke-linecap="round" />
        
        <ellipse cx="102" cy="100" rx="14" ry="5.5" transform="rotate(-50, 102, 100)" fill="none" stroke="#2563eb" stroke-width="1.5" />
        <ellipse cx="88" cy="115" rx="13" ry="5" transform="rotate(-50, 88, 115)" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="2,2" />
        <ellipse cx="56" cy="144" rx="12" ry="4.5" transform="rotate(-50, 56, 144)" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2" />
        <ellipse cx="25" cy="198" rx="10" ry="4" transform="rotate(-50, 25, 198)" fill="#dbeafe" stroke="#ec4899" stroke-width="1.5" />
        
        <line x1="210" y1="67" x2="293" y2="183" stroke="#8b5cf6" stroke-width="1.5" />
        <path d="M 218,65 L 210,67 L 216,75" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-linecap="round" />
        <path d="M 287,175 L 293,183 L 285,185" stroke="#8b5cf6" stroke-width="1.5" fill="none" stroke-linecap="round" />
        
        <g transform="translate(150, 22)">
          <rect x="-60" y="-6.5" width="120" height="13" rx="2" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Neck Around: ${formatVal('Neck around')}</text>
        </g>
        <g transform="translate(150, 39)">
          <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#dc2626" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#dc2626" font-family="sans-serif" font-size="8" font-weight="bold">Neck Len: ${formatVal('Neck length')}</text>
        </g>
        <g transform="translate(150, 56)">
          <rect x="-55" y="-6.5" width="110" height="13" rx="2" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Shoulder: ${formatVal('Shoulder')}</text>
        </g>
        
        <g transform="translate(150, 125)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Chest: ${formatVal('Chest')}</text>
        </g>
        <g transform="translate(150, 158)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Diapharm: ${formatVal('Diapharm')}</text>
        </g>
        <g transform="translate(150, 191)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#3b82f6" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#3b82f6" font-family="sans-serif" font-size="8" font-weight="bold">Belly: ${formatVal('Belly')}</text>
        </g>
        <g transform="translate(150, 224)">
          <rect x="-45" y="-6.2" width="90" height="13" rx="2" fill="white" stroke="#e11d48" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#e11d48" font-family="sans-serif" font-size="8" font-weight="bold">Waist: ${formatVal('Waist')}</text>
        </g>
        <g transform="translate(150, 262)">
          <rect x="-55" y="-6.2" width="110" height="13" rx="2" fill="white" stroke="#4f46e5" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#4f46e5" font-family="sans-serif" font-size="8" font-weight="bold">Total Length: ${formatVal('Total length')}</text>
        </g>
        
        <g transform="translate(38, 93)">
          <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.2" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="7.5" font-weight="bold">Arm Pit: ${formatVal('Arm pit')}</text>
        </g>
        <g transform="translate(32, 114)">
          <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#06b6d4" stroke-width="0.5" />
          <text y="2.2" text-anchor="middle" fill="#06b6d4" font-family="sans-serif" font-size="7.5" font-weight="bold">Arm Open: ${formatVal('Arm open end')}</text>
        </g>
        <g transform="translate(30, 142)">
          <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#d97706" stroke-width="0.5" />
          <text y="2.2" text-anchor="middle" fill="#d97706" font-family="sans-serif" font-size="7.5" font-weight="bold">Elbow: ${formatVal('Elbow')}</text>
        </g>
        <g transform="translate(42, 230)">
          <rect x="-35" y="-5.5" width="70" height="11" rx="1.5" fill="white" stroke="#ec4899" stroke-width="0.5" />
          <text y="2.2" text-anchor="middle" fill="#ec4899" font-family="sans-serif" font-size="7.5" font-weight="bold">Wrist: ${formatVal('Arm close end')}</text>
        </g>
        
        <g transform="translate(265, 128)">
          <rect x="-55" y="-5.5" width="110" height="11" rx="1.5" fill="white" stroke="#8b5cf6" stroke-width="0.5" />
          <text y="2.2" text-anchor="middle" fill="#8b5cf6" font-family="sans-serif" font-size="7.5" font-weight="bold">Arm Length: ${formatVal('Arm total length')}</text>
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
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Finger to Wrist: ${formatVal('Total length middle finger to wrist')}</text>
        </g>
        <g transform="translate(185, 265)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Finger to End: ${formatVal('Total length middle finger to end of scar')}</text>
        </g>
        <g transform="translate(150, 45)">
          <rect x="-34" y="-7" width="68" height="13" rx="3" fill="white" stroke="#4f46e5" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#4f46e5" font-family="sans-serif" font-size="8" font-weight="bold">Middle: ${formatVal('Middle finger')}</text>
        </g>
        <g transform="translate(110, 65)">
          <rect x="-32" y="-7" width="64" height="13" rx="3" fill="white" stroke="#0891b2" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="8" font-weight="bold">Index: ${formatVal('Index finger')}</text>
        </g>
        <g transform="translate(210, 75)">
          <rect x="-32" y="-7" width="64" height="13" rx="3" fill="white" stroke="#059669" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#059669" font-family="sans-serif" font-size="8" font-weight="bold">Ring: ${formatVal('Ring finger')}</text>
        </g>
        <g transform="translate(245, 110)">
          <rect x="-32" y="-7" width="64" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Little: ${formatVal('Little finger')}</text>
        </g>
        <g transform="translate(85, 115)">
          <rect x="-32" y="-7" width="64" height="13" rx="3" fill="white" stroke="#ea580c" stroke-width="0.5" />
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
        
        <g transform="translate(150, 70)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#2563eb" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#2563eb" font-family="sans-serif" font-size="8" font-weight="bold">Diaphrom: ${formatVal('Diaphrom')}</text>
        </g>
        <g transform="translate(150, 101)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#f59e0b" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#f59e0b" font-family="sans-serif" font-size="8" font-weight="bold">Belly: ${formatVal('Belly')}</text>
        </g>
        <g transform="translate(150, 132)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#10b981" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#10b981" font-family="sans-serif" font-size="8" font-weight="bold">Waist: ${formatVal('Waist')}</text>
        </g>
        <g transform="translate(150, 163)">
          <rect x="-45" y="-7" width="90" height="13" rx="3" fill="white" stroke="#0891b2" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#0891b2" font-family="sans-serif" font-size="8" font-weight="bold">Hips: ${formatVal('Hips')}</text>
        </g>
        <g transform="translate(150, 194)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#7c3aed" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" font-size="8" font-weight="bold">Open End: ${formatVal('Open End')}</text>
        </g>
        <g transform="translate(150, 225)">
          <rect x="-55" y="-7" width="110" height="13" rx="3" fill="white" stroke="#db2777" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#db2777" font-family="sans-serif" font-size="8" font-weight="bold">Close End: ${formatVal('Close End (Leg end)')}</text>
        </g>
        <g transform="translate(250, 115)">
          <rect x="-65" y="-7" width="130" height="13" rx="3" fill="white" stroke="#ea580c" stroke-width="0.5" />
          <text y="2.5" text-anchor="middle" fill="#ea580c" font-family="sans-serif" font-size="8" font-weight="bold">Dia-Waist: ${formatVal('Length Diaphrom to Waist')}</text>
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
                  // Canvas color compiling failed/unsupported in this browser
                } else {
                  fallback = a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${(a/255).toFixed(2)})`;
                }
              }
            } catch (e) {}
          }
          result += fallback;
          index = matchedParenIndex + 1;
          continue;
        }
      }
      result += css[index];
      index++;
    }
    return result;
  };

  const handleDownloadPDF = async (assessment: RegisteredAssessment) => {
    const reportElement = document.getElementById('registered-assessment-printable');
    if (!reportElement) {
      console.error("Printable target element not found.");
      return;
    }

    const originalInlineStyles = new Map<HTMLElement, string>();

    try {
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

      // Compile parent document stylesheets to support Tailwind styles in cloned/canvas view
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
            console.warn("Skipping stylesheet parsing:", sheetErr);
          }
        }
      } catch (globalStyleErr) {
        console.warn("Could not compile parent styles synchronously:", globalStyleErr);
      }

      // Pre-resolve color-space rules (oklch, color-mix) in our gathered styles using our optimized processor
      const resolvedParentStyles = resolveModernColors(parentPageStyles);

      // Give browser brief layout breath
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(reportElement, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // EXTREME SANITIZATION for html2canvas
          // 1. Remove standard link tags to prevent cross-origin stylesheet parsing and styling latency
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

          // 3. Inject pre-processed pristine compiled style sheet
          const consolidatedStyle = clonedDoc.createElement('style');
          consolidatedStyle.innerHTML = resolvedParentStyles;
          clonedDoc.head.appendChild(consolidatedStyle);

          // 4. Force colors to compile in style elements inside clone to prevent rendering omissions
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
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
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 5; // 5mm margin to keep it breathing but strictly inside 1 page
      const pageWidth = 210 - (margin * 2);
      const pageHeight = 297 - (margin * 2);
      
      let finalWidth = pageWidth;
      let finalHeight = (canvas.height * pageWidth) / canvas.width;
      
      if (finalHeight > pageHeight) {
        finalHeight = pageHeight;
        finalWidth = (canvas.width * pageHeight) / canvas.height;
      }
      
      const xOffset = margin + (pageWidth - finalWidth) / 2;
      const yOffset = margin + (pageHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      const filename = `Assessment_${assessment.patient_name.trim().replace(/\s+/g, '_')}_Specifications.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      // Restore original inline styles
      originalInlineStyles.forEach((originalStyle, el) => {
        try {
          el.style.cssText = originalStyle;
        } catch (err) {}
      });
    }
  };

  const filtered = assessments.filter(a => 
    a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.garment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderAssessmentDrawingSvg = (assessment: RegisteredAssessment) => {
    const handSelectionVal = assessment.sub_options?.['Hand Selection'] || 'Right Hand Glove';
    const isBoth = assessment.garment_type === 'All Gloves/Glove With Sleeve' && handSelectionVal === 'Both Hand Glove';

    const formatVal = (label: string) => {
      let lookupLabel = label;
      if (isBoth) {
        lookupLabel = `${activeBothHandView} Hand ${label}`;
      }
      let key = Object.keys(assessment.sub_options || {}).find(
        k => k.toLowerCase() === lookupLabel.toLowerCase()
      ) || lookupLabel;
      
      let val = assessment.sub_options?.[key];
      
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
        // Belly Binder mappings
        else if (label === 'Diaphrom') fallbackKey = 'Diaphrarm';
        else if (label === 'West (Waist)' || label === 'West' || label === 'Waist') fallbackKey = 'Waist';
        else if (label === 'Open End') fallbackKey = 'Open end thigh';
        else if (label === 'Close End (Leg end)') fallbackKey = 'Close end thigh';
        else if (label === 'Length Diaphrom to West' || label === 'Length Diaphrom to Waist') fallbackKey = 'length diaphragm to waist';
        else if (label === 'Short Length' || label === 'Waist to Close End') fallbackKey = 'Waist to Close End';
        // All Trouser backwards compatibility fallbacks
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
          key = Object.keys(assessment.sub_options || {}).find(
            k => k.toLowerCase() === fallbackKey.toLowerCase()
          ) || fallbackKey;
          val = assessment.sub_options?.[key];
        }
      }

      if (!val) return '—';
      const clean = String(val).trim();
      if (!clean) return '—';
      if (clean.toLowerCase().endsWith('cm')) return clean;
      return `${clean} cm`;
    };

    switch (assessment.garment_type) {
      case 'Face Mask & Chin Binder':
        return (
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[320px]" style={{ minHeight: '260px' }}>
            <defs>
              <marker id="arrow-blue-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-emerald-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker id="arrow-amber-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <marker id="arrow-rose-rg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
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
            <line x1="150" y1="102" x2="150" y2="218" stroke="#10b981" strokeWidth="2.5" markerStart="url(#arrow-emerald-rg)" markerEnd="url(#arrow-emerald-rg)" />

            {/* Neck area at the bottom */}
            <path d="M125,245 Q150,255 175,245 L175,270 Q150,280 125,270 Z" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="150" y1="242" x2="150" y2="273" stroke="#dc2626" strokeWidth="2.5" markerStart="url(#arrow-rose-rg)" markerEnd="url(#arrow-rose-rg)" />

            {/* Dimension value text tags matching the color guidelines */}
            {/* 1. Around Head (Forehead Strap) */}
            <g transform="translate(150, 60)" className="text-[10px] font-black">
              <rect x="-60" y="-8" width="120" height="16" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-blue-600 font-bold" fontSize="9">Head: {formatVal('Around head')}</text>
            </g>

            {/* 2. Around Chin */}
            <g transform="translate(50, 195)" className="text-[10px] font-black">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-emerald-600 font-bold" fontSize="9">Chin: {formatVal('Around chin')}</text>
            </g>

            {/* 3. Around Neck */}
            <g transform="translate(250, 195)" className="text-[10px] font-black">
              <rect x="-50" y="-8" width="100" height="16" rx="4" fill="white" stroke="#f59e0b" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" className="fill-amber-600 font-bold" fontSize="9">Neck: {formatVal('Around neck')}</text>
            </g>

            {/* 4. Neck Length */}
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
                <marker id="arrow-blue-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
                </marker>
                <marker id="arrow-emerald-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
                <marker id="arrow-amber-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706" />
                </marker>
                <marker id="arrow-purple-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
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
              <line x1="35" y1="48" x2="35" y2="275" stroke="#d97706" strokeWidth="1.5" markerStart="url(#arrow-amber-reg)" markerEnd="url(#arrow-amber-reg)" />

              {/* Height Line 2: Finger-to-scar-end (Right Margin) */}
              <line x1="180" y1="48" x2="285" y2="48" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="195" y1="360" x2="285" y2="360" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="285" y1="48" x2="285" y2="360" stroke="#7c3aed" strokeWidth="1.5" markerStart="url(#arrow-purple-reg)" markerEnd="url(#arrow-purple-reg)" />

              {/* Readable Badges Overlay (Outside Flipped Group) */}
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
            </div>
          );
        }

      case 'Belly Binder':
        return (
          <svg viewBox="0 0 320 380" className="w-full h-full max-h-[380px]" style={{ minHeight: '300px' }}>
            <defs>
              <marker id="arrow-orange-bb-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
              </marker>
              <marker id="arrow-rose-bb-reg" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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
            <line x1="270" y1="50" x2="270" y2="175" stroke="#ea580c" strokeWidth="1.5" markerStart="url(#arrow-orange-bb-reg)" markerEnd="url(#arrow-orange-bb-reg)" />

            {/* Left Height: Waist to Close end thigh */}
            <line x1="73" y1="175" x2="45" y2="175" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="80" y1="300" x2="45" y2="300" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="50" y1="175" x2="50" y2="300" stroke="#e11d48" strokeWidth="1.5" markerStart="url(#arrow-rose-bb-reg)" markerEnd="url(#arrow-rose-bb-reg)" />

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
          <svg viewBox="0 0 300 320" className="w-full h-full max-h-[300px]" style={{ minHeight: '260px' }}>
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
            <line x1="140" y1="20" x2="140" y2="70" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M 137,25 L 140,20 L 143,25" stroke="#4f46e5" strokeWidth="1.5" fill="none" />
            <path d="M 137,65 L 140,70 L 143,65" stroke="#4f46e5" strokeWidth="1.5" fill="none" />

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

            <g transform="translate(26, 155)" className="text-[7px] font-bold">
              <rect x="-35" y="-14" width="70" height="24" rx="4" fill="white" stroke="#06b6d4" strokeWidth="1.2" />
              <text y="-4" textAnchor="middle" className="fill-cyan-600 font-extrabold" fontSize="7">Wst-Ankle</text>
              <text y="6" textAnchor="middle" className="fill-cyan-700 font-black" fontSize="7">{formatVal('Length waist to ankle')}</text>
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

            <g transform="translate(185, 62)" className="text-[7px] font-bold">
              <rect x="-38" y="-6" width="76" height="12" rx="3" fill="white" stroke="#4f46e5" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-indigo-700 font-black" fontSize="6.5">Dia-Waist: {formatVal('length diaphragm to waist')}</text>
            </g>

            {/* Circumference Badges on the Left Side pointing to guiding ellipses */}
            {/* Open end thigh */}
            <g transform="translate(42, 125)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#f59e0b" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-amber-600 font-extrabold" fontSize="6.5">Op Thigh: {formatVal('Open end thigh')}</text>
            </g>

            {/* Close end thigh */}
            <g transform="translate(42, 170)" className="text-[7px] font-bold">
              <rect x="-32" y="-6" width="64" height="12" rx="3" fill="white" stroke="#ec4899" strokeWidth="1" />
              <text y="2.5" textAnchor="middle" className="fill-pink-600 font-extrabold" fontSize="6.5">Cl Thigh: {formatVal('Close end thigh')}</text>
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
                            <span className="font-extrabold text-slate-900">
                              {/^\d+(\.\d+)?\s*(cm|in)?$/i.test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : val}
                            </span>
                          </div>
                        ))}
                      {Object.entries(selectedAssessment.sub_options || {}).filter(([_, val]) => val !== undefined && val !== '').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No specific measurements recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Patient Clinical Photo */}
                  {getAssessmentPhoto(selectedAssessment) && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Patient Uploaded Photo / مريض كی تصویر</span>
                      <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100 flex items-center justify-center overflow-hidden">
                        <img 
                          src={getAssessmentPhoto(selectedAssessment)} 
                          alt="Patient Clinical upload" 
                          referrerPolicy="no-referrer"
                          className="max-h-[160px] w-auto object-contain rounded-xl shadow-sm border border-slate-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes snippet */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Medical Condition & Remarks</span>
                    <p className="text-xs text-slate-650 font-bold leading-relaxed bg-slate-50/40 border border-slate-100/50 p-4 rounded-2xl max-h-[100px] overflow-y-auto whitespace-pre-wrap font-mono">
                      {selectedAssessment.notes || "No standard notes recorded details."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button 
                      onClick={() => handleDownloadPDF(selectedAssessment)}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent shadow-lg shadow-slate-100 hover:scale-[1.02]"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Document
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

      {/* Hidden high-fidelity printable report template container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div 
          id="registered-assessment-printable" 
          className="w-[794px] bg-white p-10 text-slate-800 flex flex-col justify-between"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {selectedAssessment && (
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
                  <span className="text-xs font-mono font-black text-slate-800 block break-all leading-none">{selectedAssessment.id}</span>
                </div>
              </div>

              {/* Demographics */}
              <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">PATIENT FULL NAME</span>
                    <span className="text-md font-extrabold text-slate-900">{selectedAssessment.patient_name || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Age / عمر</span>
                      <span className="text-xs font-bold text-slate-800">{selectedAssessment.age ? `${selectedAssessment.age} Yrs` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Gender / جنس</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{selectedAssessment.gender || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">City / شہر</span>
                      <span className="text-xs font-bold text-slate-800 uppercase">{selectedAssessment.city || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 pl-6 border-l border-slate-200">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">HOSPITAL OR CLINICAL UNIT</span>
                    <span className="text-xs font-extrabold text-slate-900 block break-words leading-tight">{selectedAssessment.hospital_name || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Doctor Reference</span>
                      <span className="text-xs font-bold text-slate-800 block break-words leading-tight">{selectedAssessment.doctor_ref || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Created Date</span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {new Date(selectedAssessment.created_at).toLocaleDateString('ur-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Garment & Compression Configuration</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Unit</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{selectedAssessment.garment_type}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Compression</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1">{selectedAssessment.compression}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Silicone Profile</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1">{selectedAssessment.silicone_pasting}</span>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Garment Color</span>
                    <span className="font-extrabold text-slate-800 text-xs block mt-1 uppercase">{selectedAssessment.sub_options?.['Color'] || 'Standard'}</span>
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
                      {renderAssessmentDrawingSvg(selectedAssessment)}
                    </div>
                  </div>

                  {/* Sizing Specifications Table */}
                  <div className="col-span-5 space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">Matrix Calibration Parameters</span>
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 space-y-2" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      {Object.entries(selectedAssessment.sub_options || {})
                        .filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection')
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-xs pb-1.5 border-b border-dashed border-slate-200 last:border-none last:pb-0">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">{key}</span>
                            <span className="font-extrabold text-slate-900">
                              {/^\d+(\.\d+)?\s*(cm|in)?$/i.test(String(val).trim()) && !String(val).toLowerCase().includes('cm') ? `${val} cm` : val}
                            </span>
                          </div>
                        ))}
                      {Object.entries(selectedAssessment.sub_options || {}).filter(([key, val]) => val !== undefined && val !== '' && key.toLowerCase() !== 'color' && key.toLowerCase() !== 'hand selection').length === 0 && (
                        <p className="text-xs text-slate-400 italic">No custom points registered.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Notes & Uploaded Photo Section */}
              <div className="grid grid-cols-12 gap-6">
                {/* Notes Column */}
                <div className={getAssessmentPhoto(selectedAssessment) ? "col-span-7 space-y-2" : "col-span-12 space-y-2"}>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Medical Condition & Remarks / ضروری ہدایات</h3>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed p-4 rounded-2xl whitespace-pre-wrap font-mono" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', minHeight: '130px' }}>
                    {selectedAssessment.notes || "No extra notes specified."}
                  </p>
                </div>

                {/* Photo Column */}
                {getAssessmentPhoto(selectedAssessment) && (
                  <div className="col-span-5 space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">4. Patient Clinical Photo / مريض كی تصویر</h3>
                    <div className="rounded-2xl p-2 flex items-center justify-center bg-white" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', height: '130px' }}>
                      <img 
                        src={getAssessmentPhoto(selectedAssessment)} 
                        alt="Patient Clinical upload" 
                        referrerPolicy="no-referrer"
                        className="max-h-[114px] max-w-full object-contain rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-5 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span>SYSTEM VERIFIED CLINICAL MEMORANDUM / طبی ریکارڈ</span>
                <span>Sizing Calibration Page 1 of 1</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisteredAssessments;
