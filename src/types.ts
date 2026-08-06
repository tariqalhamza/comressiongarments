export type UserRole = 'admin' | 'therapist' | 'technician';

export interface Profile {
  id: string;
  clinic_id: string;
  full_name: string;
  role: UserRole;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  created_by?: string;
  created_by_email?: string;
  created_by_name?: string;
  therapist_id?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  diagnosis?: string;
  medical_condition?: string;
  doctor_name: string;
  hospital: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
  measurements?: any;
  _isSynced?: boolean;
}

export interface MeasurementPoint {
  id: string;
  label: string;
  value: number; // in cm
  unit: 'cm' | 'inch';
}

export interface BodyMeasurement {
  id: string;
  patient_id: string;
  therapist_id: string;
  measurement_date: string;
  body_area: 'Upper Limb' | 'Lower Limb' | 'Torso';
  side: 'left' | 'right' | 'both';
  points: MeasurementPoint[];
  notes?: string;
}

export interface GarmentConfig {
  type: string;
  compression_class: string;
  fabric: string;
  color: string;
  options: {
    open_toe: boolean;
    zipper: boolean;
    silicone_band: boolean;
  };
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface Order {
  id: string;
  patient_id: string;
  measurement_id: string;
  garment_type: string;
  status: 'Measurement Taken' | 'Approved' | 'In Production' | 'Quality Check' | 'Delivered';
  config: GarmentConfig;
  created_at: string;
  updated_at: string;
  created_by?: string;
}
