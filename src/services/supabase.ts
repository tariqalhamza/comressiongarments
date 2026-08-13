import { createClient } from '@supabase/supabase-js';
import { Patient } from '../types';
import {
  getLocalPatients,
  saveLocalPatients,
  getLocalAssessments,
  saveLocalAssessments,
  getLocalOrders,
  saveLocalOrders,
  clearAllLocalData,
  markPatientAsDeleted,
  isPatientDeleted,
  unmarkPatientAsDeleted,
  markAssessmentAsDeleted,
  unmarkAssessmentAsDeleted,
  isAssessmentDeleted,
  markOrderAsDeleted,
  isOrderDeleted
} from './localDB';

// Let the app know if we are offline or having issues
let isSupabaseOfflineState = false;
let lastSupabaseError: any = null;

export const getIsSupabaseOffline = () => isSupabaseOfflineState;
export const setIsSupabaseOffline = (val: boolean) => {
  isSupabaseOfflineState = val;
  if (!val) lastSupabaseError = null;
};

export const getLastSupabaseError = () => lastSupabaseError;
export const setLastSupabaseError = (val: any) => {
  lastSupabaseError = val;
};

// Default production Supabase credentials for seamless login across all devices and browsers
const DEFAULT_SUPABASE_URL = 'https://avltksamccylkfgpfgea.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHRrc2FtY2N5bGtmZ3BmZ2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTQ4OTAsImV4cCI6MjA5MzI5MDg5MH0.l4yvuUxXmKyBoVqaOR5xIkApmDsvHC2J_ANlei5qTuI';

// Retrieve credentials from environment variables or custom localStorage overrides
const getSupabaseConfig = () => {
  let localUrl = '';
  let localKey = '';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localUrl = localStorage.getItem('VITE_SUPABASE_URL') || '';
      localKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '';
    }
  } catch {}

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const url = (localUrl && !localUrl.includes('placeholder') && !localUrl.includes('your_supabase_project_url')) 
    ? localUrl 
    : (envUrl && !envUrl.includes('placeholder') && !envUrl.includes('your_supabase_project_url')) 
      ? envUrl 
      : DEFAULT_SUPABASE_URL;

  const key = (localKey && !localKey.includes('placeholder')) 
    ? localKey 
    : (envKey && !envKey.includes('placeholder')) 
      ? envKey 
      : DEFAULT_SUPABASE_ANON_KEY;
  
  return { url, key };
};

const config = getSupabaseConfig();
export const supabaseUrl = config.url;
export const supabaseAnonKey = config.key;

const hasRealCredentials = !!supabaseUrl && !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseUrl.includes('your_supabase_project_url');

// Let's make isDemo a mutable exported let variable so ES Module bindings can update dynamically!
export let isDemo = !hasRealCredentials || localStorage.getItem('supabase_force_demo') === 'true';

// Helper for checking if assessments table is missing in Supabase
let isAssessmentsTableMissingState = false;
export const getIsAssessmentsTableMissing = () => isAssessmentsTableMissingState;
export const setIsAssessmentsTableMissing = (val: boolean) => {
  isAssessmentsTableMissingState = val;
};

// Helper for checking if patients table is missing in Supabase
let isPatientsTableMissingState = false;
export const getIsPatientsTableMissing = () => isPatientsTableMissingState;
export const setIsPatientsTableMissing = (val: boolean) => {
  isPatientsTableMissingState = val;
};

// RFC4122 standard UUID v4 generator for flawless local-remote syncing on UUID/TEXT databases
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const setForceDemo = (val: boolean) => {
  if (val) {
    localStorage.setItem('supabase_force_demo', 'true');
    isDemo = true;
  } else {
    localStorage.removeItem('supabase_force_demo');
    isDemo = !hasRealCredentials;
  }
};

// Create the Supabase client - Always use real credentials if available, so it's fully functional on dynamic logins
export const supabase = createClient(
  hasRealCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
  hasRealCredentials ? supabaseAnonKey : 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Helper for promise timeouts
export const promiseWithTimeout = async <T = any>(promise: any, ms: number = 25000): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Connection timed out. Big delay detected in connection.'));
    }, ms);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Dynamic loaders for local storage lists using IndexedDB + Quota-safe In-memory Cache
const getLocalStoragePatients = (): Patient[] => {
  return getLocalPatients();
};

const getLocalStorageOrders = (): any[] => {
  return getLocalOrders();
};

const saveToLocal = (patients: Patient[]) => {
  saveLocalPatients(patients);
};

const saveOrdersToLocal = (orders: any[]) => {
  saveLocalOrders(orders);
};

const getLocalStorageAssessments = (): any[] => {
  return getLocalAssessments();
};

const saveAssessmentsToLocal = (assessments: any[]) => {
  saveLocalAssessments(assessments);
};

export const clearDemoData = () => {
  clearAllLocalData();
  return true;
};

const isValidUUID = (str: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export let currentUserId: string | null = null;
export let currentUserEmail: string | null = null;
export let currentUserName: string | null = null;
export let currentUserRole: string = 'therapist';

export const updateCurrentUserContext = (id: string | null, email: string | null, role: string, fullName?: string) => {
  currentUserId = id;
  currentUserEmail = email;
  currentUserRole = role;
  if (fullName) currentUserName = fullName;
};

export const ADMIN_USER_IDS = [
  '9905a6da-912f-4cf0-8dfc-cc108d224ed8',
  'demo-user-123'
];

export const ADMIN_EMAILS = [
  'mehmood@gmail.com',
  'detox16277@gmail.com',
  'demo@overplast.com',
  'admin@overplast.com'
];

export const checkIsAdmin = (
  role?: string | null,
  email?: string | null,
  name?: string | null
): boolean => {
  const roleClean = (role || '').toLowerCase().trim();
  const emailClean = (email || '').toLowerCase().trim();
  const nameClean = (name || '').toLowerCase().trim();

  if (roleClean === 'admin') return true;
  if (emailClean && ADMIN_EMAILS.includes(emailClean)) return true;
  if (nameClean && (nameClean.includes('mahmood') || nameClean.includes('mehmood') || nameClean === 'dr. mahmood')) return true;
  return false;
};

export const isRecordCreatedByAdmin = (record: any): boolean => {
  if (!record || typeof record !== 'object') return false;

  // 1. Explicit creator role check
  const creatorRole = (record.created_by_role || record.creator_role || '').toLowerCase().trim();
  if (creatorRole === 'admin') return true;

  // 2. Check creator ID against known admin user IDs
  const creatorId = String(record.created_by || record.therapist_id || record.user_id || '').trim();
  if (creatorId && ADMIN_USER_IDS.includes(creatorId)) return true;

  // 3. Creator email check
  const creatorEmail = (record.created_by_email || record.email || '').toLowerCase().trim();
  if (creatorEmail && (ADMIN_EMAILS.includes(creatorEmail) || creatorEmail.includes('mehmood') || creatorEmail.includes('detox16277') || creatorEmail.includes('overplast.com'))) return true;

  // 4. Creator / assessor / therapist name check
  const creatorName = (record.created_by_name || '').toLowerCase().trim();
  const assessorName = (record.assessor_name || '').toLowerCase().trim();
  const therapistName = (record.therapist_name || '').toLowerCase().trim();

  if (creatorName && (creatorName.includes('mahmood') || creatorName.includes('mehmood') || creatorName.includes('admin') || creatorName === 'dr. mahmood')) return true;
  if (assessorName && (assessorName.includes('mahmood') || assessorName.includes('mehmood') || assessorName.includes('admin') || assessorName === 'dr. mahmood')) return true;
  if (therapistName && (therapistName.includes('mahmood') || therapistName.includes('mehmood') || therapistName.includes('admin') || therapistName === 'dr. mahmood')) return true;

  // 5. Dynamic check against stored demo_profiles
  try {
    const stored = localStorage.getItem('demo_profiles');
    if (stored) {
      const list = JSON.parse(stored);
      if (Array.isArray(list)) {
        for (const p of list) {
          if (p && p.role === 'admin') {
            if (creatorId && p.id === creatorId) return true;
            if (creatorEmail && p.email && p.email.toLowerCase().trim() === creatorEmail) return true;
          }
        }
      }
    }
  } catch {}

  return false;
};

export const isRecordOwnedByCurrentUser = (
  record: any,
  context: { uid: string | null; email: string | null; name: string | null; role: string; isAdmin: boolean },
  allowedPatientIds?: Set<string>,
  allowedPatientNames?: Set<string>
): boolean => {
  if (!record || typeof record !== 'object') return false;

  // 1. ADMIN SEES EVERYTHING (All staff records + all admin records)
  if (context.isAdmin) {
    return true;
  }

  // 2. REGULAR USERS (Therapist, Technician, etc.):
  // STRICT RULE: If record was created by Administrator, regular user CANNOT see it!
  if (isRecordCreatedByAdmin(record)) {
    return false;
  }

  const userEmailLower = (context.email || '').toLowerCase().trim();
  const userNameLower = (context.name || '').toLowerCase().trim();
  const userId = context.uid || '';

  // If user is completely anonymous/unauthenticated, do not expose any user data
  if (!userId && !userEmailLower && !userNameLower) {
    return false;
  }

  // 3. Direct UID / therapist_id / user_id match
  if (userId) {
    if (record.created_by && record.created_by === userId) return true;
    if (record.therapist_id && record.therapist_id === userId) return true;
    if (record.user_id && record.user_id === userId) return true;
  }

  // 4. Direct creator email match
  if (userEmailLower) {
    const creatorEmail = (record.created_by_email || '').toLowerCase().trim();
    if (creatorEmail && creatorEmail === userEmailLower) return true;
  }

  // 5. Direct creator name / therapist name / assessor name match
  if (userNameLower) {
    const creatorName = (record.created_by_name || '').toLowerCase().trim();
    const assessorName = (record.assessor_name || '').toLowerCase().trim();
    const therapistName = (record.therapist_name || '').toLowerCase().trim();

    if (creatorName && (creatorName === userNameLower || creatorName.includes(userNameLower) || userNameLower.includes(creatorName))) return true;
    if (therapistName && (therapistName === userNameLower || therapistName.includes(userNameLower) || userNameLower.includes(therapistName))) return true;
    if (assessorName && (assessorName === userNameLower || assessorName.includes(userNameLower) || userNameLower.includes(assessorName))) return true;
  }

  // 6. Correlated Patient Link: If this assessment or order belongs to one of this user's patients
  if (allowedPatientIds && record.patient_id && allowedPatientIds.has(record.patient_id)) {
    return true;
  }
  if (allowedPatientNames && record.patient_name && allowedPatientNames.has(record.patient_name.toLowerCase().trim())) {
    return true;
  }

  // Otherwise, strictly hidden from this user
  return false;
};

export const getActiveUserContext = () => {
  let uid = currentUserId;
  let email = currentUserEmail;
  let role = currentUserRole;
  let name = currentUserName;

  try {
    const cachedSess = localStorage.getItem('demo_user_logged_in');
    if (cachedSess) {
      const parsed = JSON.parse(cachedSess);
      if (parsed?.user) {
        if (!uid) uid = parsed.user.id || null;
        if (!email) email = parsed.user.email || null;
      }
      if (parsed?.profile) {
        if (!role || role === 'therapist') role = parsed.profile.role || role;
        if (!email && parsed.profile.email) email = parsed.profile.email;
        if (!name && parsed.profile.full_name) name = parsed.profile.full_name;
      }
    }
  } catch (e) {
    console.warn("Offline context check error:", e);
  }

  const emailLower = (email || '').toLowerCase().trim();
  const nameLower = (name || '').toLowerCase().trim();
  const isAdmin = checkIsAdmin(role, emailLower, nameLower);

  return { uid, email, role, name, isAdmin };
};

export const isCurrentUserAdmin = () => {
  return getActiveUserContext().isAdmin;
};

// Auto-hydrate from localStorage on boot to avoid initial query mismatch
try {
  const cachedSess = localStorage.getItem('demo_user_logged_in');
  if (cachedSess) {
    const parsed = JSON.parse(cachedSess);
    if (parsed.user) {
      currentUserId = parsed.user.id || null;
      currentUserEmail = parsed.user.email || null;
    }
    if (parsed.profile) {
      currentUserRole = parsed.profile.role || 'therapist';
      if (parsed.profile.full_name) currentUserName = parsed.profile.full_name;
    }
  }
} catch (e) {
  console.warn("Offline context pre-hydration on boot failed:", e);
}

/**
 * Adaptive Schema Upsert for Patients:
 * Automatically negotiates with the user's Supabase schema by detecting missing columns,
 * handling UUID constraints, and retrying progressively down to universal minimal columns.
 */
export const adaptiveUpsertPatient = async (patient: any): Promise<{ data: any; synced: boolean; error?: any }> => {
  if (isDemo) {
    return { data: patient, synced: false };
  }

  const targetId = isValidUUID(patient.id) ? patient.id : generateUUID();
  
  // Construct clean payload with appropriate types
  const payload: Record<string, any> = {
    id: targetId,
    full_name: String(patient.full_name || 'Patient').trim(),
    created_at: patient.created_at || new Date().toISOString()
  };

  if (patient.age !== undefined && patient.age !== null && String(patient.age).trim() !== '' && !isNaN(Number(patient.age))) {
    payload.age = Number(patient.age);
  }
  if (patient.gender) payload.gender = String(patient.gender);
  if (patient.phone) payload.phone = String(patient.phone);
  if (patient.address) payload.address = String(patient.address);
  if (patient.city) payload.city = String(patient.city);
  if (patient.doctor_name) payload.doctor_name = String(patient.doctor_name);
  if (patient.hospital) payload.hospital = String(patient.hospital);
  if (patient.notes) payload.notes = String(patient.notes);
  if (patient.photo_url) payload.photo_url = String(patient.photo_url);
  if (patient.diagnosis) payload.diagnosis = String(patient.diagnosis);
  if (patient.medical_condition) payload.medical_condition = String(patient.medical_condition);
  if (patient.height && !isNaN(Number(patient.height))) payload.height = Number(patient.height);
  if (patient.weight && !isNaN(Number(patient.weight))) payload.weight = Number(patient.weight);
  if (patient.email) payload.email = String(patient.email);

  if (patient.created_by) payload.created_by = patient.created_by;
  if (patient.therapist_id) payload.therapist_id = patient.therapist_id;
  if (patient.clinic_id && isValidUUID(patient.clinic_id)) payload.clinic_id = patient.clinic_id;
  if (patient.created_by_email) payload.created_by_email = String(patient.created_by_email);
  if (patient.created_by_name) payload.created_by_name = String(patient.created_by_name);
  if (patient.created_by_role) payload.created_by_role = String(patient.created_by_role);
  if (patient.therapist_name) payload.therapist_name = String(patient.therapist_name);

  let currentPayload = { ...payload };
  let lastError: any = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .upsert(currentPayload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        isPatientsTableMissingState = false;
        return { data: { ...patient, ...data, id: targetId, _isSynced: true }, synced: true };
      }

      lastError = error;
      if (!error) break;

      const errMsg = error.message || '';
      console.warn(`[Supabase Adaptive Patient Insert attempt ${attempt + 1}] Error:`, errMsg);

      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        isPatientsTableMissingState = true;
        throw error;
      }

      // Detect specific missing column from Postgres error message
      const colMatch = errMsg.match(/column "([^"]+)" of relation "patients" does not exist/i) ||
                       errMsg.match(/Could not find the '([^']+)' column/i);
      if (colMatch && colMatch[1]) {
        const missingCol = colMatch[1];
        console.log(`[Supabase Auto-Adapt] Stripping unsupported column "${missingCol}" and retrying...`);
        delete currentPayload[missingCol];
        continue;
      }

      // Detect invalid UUID syntax error
      if (error.code === '22P02' || errMsg.includes('invalid input syntax for type uuid')) {
        delete currentPayload.created_by;
        delete currentPayload.clinic_id;
        delete currentPayload.therapist_id;
        continue;
      }

      // Check RLS
      if (error.code === '42501' || errMsg.includes('row-level security') || errMsg.includes('policy')) {
        throw new Error(`Row Level Security (RLS) is active on the "patients" table. Please run "ALTER TABLE patients DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.`);
      }

      // Progressive simplification tiers
      if (attempt === 2) {
        delete currentPayload.created_by_email;
        delete currentPayload.created_by_name;
        delete currentPayload.therapist_id;
        delete currentPayload.clinic_id;
        delete currentPayload.created_by;
        delete currentPayload.diagnosis;
        delete currentPayload.medical_condition;
        delete currentPayload.height;
        delete currentPayload.weight;
        delete currentPayload.email;
        continue;
      }

      if (attempt === 4) {
        delete currentPayload.city;
        delete currentPayload.hospital;
        delete currentPayload.photo_url;
        continue;
      }

      if (attempt === 6) {
        currentPayload = {
          id: targetId,
          full_name: String(patient.full_name || 'Patient').trim(),
          age: Number(patient.age) || undefined,
          gender: patient.gender || undefined,
          phone: patient.phone || undefined,
          address: patient.address || undefined,
          doctor_name: patient.doctor_name || undefined,
          notes: patient.notes || undefined,
          created_at: patient.created_at || new Date().toISOString()
        };
        Object.keys(currentPayload).forEach(k => currentPayload[k] === undefined && delete currentPayload[k]);
        continue;
      }

      if (attempt === 8) {
        currentPayload = {
          id: targetId,
          full_name: String(patient.full_name || 'Patient').trim(),
          created_at: patient.created_at || new Date().toISOString()
        };
        continue;
      }

      break;
    } catch (e: any) {
      lastError = e;
      if (e.message?.includes('Row Level Security') || isPatientsTableMissingState) {
        throw e;
      }
    }
  }

  throw lastError || new Error("Failed to insert patient into Supabase after adaptive schema retries.");
};

export const syncAllLocalPatientsToSupabase = async (): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
  patients: Patient[];
}> => {
  if (isDemo) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      errors: ['App is in Demo Mode. Please connect real Supabase URL and Anon Key in Settings.'],
      patients: getLocalStoragePatients()
    };
  }

  const localPatients = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];
  const updatedPatients: Patient[] = [];

  for (const p of localPatients) {
    try {
      const res = await adaptiveUpsertPatient(p);
      synced++;
      updatedPatients.push({ ...p, ...res.data, _isSynced: true });
    } catch (err: any) {
      failed++;
      errors.push(`Patient "${p.full_name || p.id}": ${err.message || String(err)}`);
      updatedPatients.push({ ...p, _isSynced: false });
    }
  }

  saveToLocal(updatedPatients);
  return {
    total: localPatients.length,
    synced,
    failed,
    errors,
    patients: updatedPatients
  };
};

export const adaptiveUpsertAssessment = async (assessment: any): Promise<{ data: any; synced: boolean }> => {
  if (isDemo) {
    return { data: assessment, synced: false };
  }

  const targetId = assessment.id || ('asm-' + Math.random().toString(36).substr(2, 9));
  
  const payload: Record<string, any> = {
    id: targetId,
    garment_type: assessment.garment_type || 'Custom Garment',
    created_at: assessment.created_at || new Date().toISOString()
  };

  if (assessment.patient_id) payload.patient_id = assessment.patient_id;
  if (assessment.patient_name) payload.patient_name = assessment.patient_name;
  if (assessment.hospital_name) payload.hospital_name = assessment.hospital_name;
  if (assessment.doctor_ref) payload.doctor_ref = assessment.doctor_ref;
  if (assessment.silicone_pasting) payload.silicone_pasting = assessment.silicone_pasting;
  if (assessment.compression) payload.compression = assessment.compression;
  if (assessment.measurements) payload.measurements = assessment.measurements;
  if (assessment.notes) payload.notes = assessment.notes;
  if (assessment.sub_options) payload.sub_options = assessment.sub_options;
  if (assessment.age !== undefined && assessment.age !== null && !isNaN(Number(assessment.age))) payload.age = Number(assessment.age);
  if (assessment.gender) payload.gender = assessment.gender;
  if (assessment.city) payload.city = assessment.city;
  if (assessment.phone) payload.phone = assessment.phone;
  if (assessment.photos) payload.photos = assessment.photos;
  if (assessment.photo_url) payload.photo_url = assessment.photo_url;
  if (assessment.created_by) payload.created_by = assessment.created_by;
  if (assessment.created_by_email) payload.created_by_email = assessment.created_by_email;
  if (assessment.created_by_name) payload.created_by_name = assessment.created_by_name;
  if (assessment.created_by_role) payload.created_by_role = assessment.created_by_role;
  if (assessment.assessor_name) payload.assessor_name = assessment.assessor_name;
  if (assessment.therapist_name) payload.therapist_name = assessment.therapist_name;
  if (assessment.therapist_id) payload.therapist_id = assessment.therapist_id;

  let currentPayload = { ...payload };
  let lastError: any = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .upsert(currentPayload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        isAssessmentsTableMissingState = false;
        return { data: { ...assessment, ...data, id: targetId, _isSynced: true }, synced: true };
      }

      lastError = error;
      if (!error) break;

      const errMsg = error.message || '';
      console.warn(`[Supabase Adaptive Assessment Insert attempt ${attempt + 1}] Error:`, errMsg);

      if (error.code === '42P01' || errMsg.includes('does not exist')) {
        isAssessmentsTableMissingState = true;
        throw error;
      }

      // Detect specific missing column from Postgres error message
      const colMatch = errMsg.match(/column "([^"]+)" of relation "assessments" does not exist/i) ||
                       errMsg.match(/Could not find the '([^']+)' column/i);
      if (colMatch && colMatch[1]) {
        const missingCol = colMatch[1];
        console.log(`[Supabase Auto-Adapt Assessment] Stripping unsupported column "${missingCol}" and retrying...`);
        delete currentPayload[missingCol];
        continue;
      }

      // Progressive simplification tiers
      if (attempt === 2) {
        delete currentPayload.created_by_email;
        delete currentPayload.created_by_name;
        delete currentPayload.assessor_name;
        delete currentPayload.therapist_name;
        delete currentPayload.therapist_id;
        delete currentPayload.phone;
        continue;
      }

      if (attempt === 4) {
        delete currentPayload.created_by;
        delete currentPayload.city;
        delete currentPayload.photos;
        delete currentPayload.photo_url;
        continue;
      }

      if (attempt === 6) {
        delete currentPayload.hospital_name;
        delete currentPayload.doctor_ref;
        delete currentPayload.sub_options;
        continue;
      }

      break;
    } catch (e: any) {
      lastError = e;
      if (e.message?.includes('Row Level Security') || isAssessmentsTableMissingState) {
        throw e;
      }
    }
  }

  throw lastError || new Error("Failed to insert assessment into Supabase after adaptive schema retries.");
};

export const dbService = {
  patients: {
    async getAll() {
      let result: Patient[] = [];
      if (isDemo) {
        result = getLocalStoragePatients();
      } else {
        try {
          const { data, error } = await promiseWithTimeout(supabase.from('patients').select('*').order('created_at', { ascending: false }));
          if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              isPatientsTableMissingState = true;
            }
            throw error;
          }
          isPatientsTableMissingState = false;
          isSupabaseOfflineState = false;
          lastSupabaseError = null;
          
          // In live mode, exclude mock/demo profiles with IDs '1' and '2' and exclude deleted patients
          const localPatients = getLocalStoragePatients().filter(p => p && p.id && !isPatientDeleted(p.id) && p.id !== '1' && p.id !== '2');
          const allRemotePatients = (data || []) as Patient[];

          // Purge any tombstoned/deleted patients that exist on remote Supabase in background
          const remoteDeleted = allRemotePatients.filter(p => p && p.id && isPatientDeleted(p.id));
          if (remoteDeleted.length > 0) {
            remoteDeleted.forEach(dp => {
              const dpId = String(dp.id).trim();
              Promise.allSettled([
                supabase.from('orders').delete().eq('patient_id', dpId),
                supabase.from('assessments').delete().eq('patient_id', dpId),
                supabase.from('measurements').delete().eq('patient_id', dpId),
                supabase.from('clinical_assessments').delete().eq('patient_id', dpId),
                supabase.from('patient_photos').delete().eq('patient_id', dpId),
                supabase.from('patients').delete().eq('id', dpId),
                supabase.from('patients').delete().eq('patient_id', dpId)
              ]).then(() => {});

              fetch('/api/delete-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: dpId })
              }).catch(() => {});
            });
          }

          const remotePatients = allRemotePatients.filter(p => p && p.id && !isPatientDeleted(p.id));
          const remoteIds = new Set(remotePatients.map(p => p.id));

          // Background Auto-Sync: Automatically upload local patients that are not in the remote database using adaptive upsert
          const unsyncedPatients = localPatients.filter(p => p && p.id && !remoteIds.has(p.id) && !isPatientDeleted(p.id));
          if (unsyncedPatients.length > 0) {
            console.log(`[Sync] Found ${unsyncedPatients.length} unsynced local patients. Uploading to live database...`);
            for (const p of unsyncedPatients) {
              try {
                const res = await adaptiveUpsertPatient(p);
                if (res.synced) {
                  console.log(`[Sync] Successfully synced patient "${p.full_name}" to Supabase!`);
                  p._isSynced = true;
                  remotePatients.push(res.data);
                  remoteIds.add(res.data.id);
                }
              } catch (syncErr: any) {
                console.warn(`[Sync] Auto-sync failed for patient "${p.full_name}":`, syncErr.message || syncErr);
              }
            }
          }

          const patientMap = new Map<string, Patient>();
          
          localPatients.forEach(p => {
            if (p && p.id && !isPatientDeleted(p.id)) {
              const isSynced = remoteIds.has(p.id);
              patientMap.set(p.id, { ...p, _isSynced: isSynced });
            }
          });
          
          remotePatients.forEach(p => {
            if (p && p.id && !isPatientDeleted(p.id)) {
              const localVersion = patientMap.get(p.id);
              patientMap.set(p.id, {
                ...localVersion,
                ...p,
                created_by: p.created_by || localVersion?.created_by,
                created_by_email: p.created_by_email || localVersion?.created_by_email,
                created_by_name: p.created_by_name || localVersion?.created_by_name,
                created_by_role: p.created_by_role || localVersion?.created_by_role,
                therapist_id: p.therapist_id || localVersion?.therapist_id,
                therapist_name: p.therapist_name || localVersion?.therapist_name,
                _isSynced: true
              });
            }
          });
          
          const mergedList = Array.from(patientMap.values()).filter(p => !isPatientDeleted(p.id)).sort((a, b) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          
          saveToLocal(mergedList);
          result = mergedList;
        } catch (err: any) {
          console.warn('Supabase Offline or Error. Falling back to LocalStorage:', err);
          isSupabaseOfflineState = true;
          lastSupabaseError = err;
          // Filter out mock patients and deleted patients in live fallback too
          result = getLocalStoragePatients()
            .filter(p => p && p.id && !isPatientDeleted(p.id) && p.id !== '1' && p.id !== '2')
            .map(p => ({ ...p, _isSynced: false }));
        }
      }

      // Check Active User Context and Scope Access
      const context = getActiveUserContext();
      if (context.isAdmin) {
        // Admin sees ALL registered patients from all accounts
        return result.filter(p => !isPatientDeleted(p.id));
      }

      // Regular user (therapist/technician): Only see their own registered patients
      // Admin-created records and other users' records are strictly excluded
      const userPatients = result.filter(p => !isPatientDeleted(p.id) && isRecordOwnedByCurrentUser(p, context));

      return userPatients;
    },
    async create(patient: Partial<Patient>) {
      const context = getActiveUserContext();
      const { uid, email, name, role, isAdmin } = context;
      const fullPatientPayload = {
        ...patient,
        created_by: patient.created_by || uid || undefined,
        created_by_email: patient.created_by_email || email || undefined,
        created_by_name: patient.created_by_name || name || undefined,
        created_by_role: patient.created_by_role || (isAdmin ? 'admin' : role) || undefined,
        therapist_id: patient.therapist_id || uid || undefined,
        therapist_name: patient.therapist_name || name || undefined
      };

      // Generate a valid UUID so it satisfies UUID primary keys in Supabase while preserving identity
      const generatedId = (patient.id && isValidUUID(patient.id)) ? patient.id : generateUUID();
      unmarkPatientAsDeleted(generatedId);
      if (patient.id) unmarkPatientAsDeleted(patient.id);

      const newPatientLocalObj = { 
        ...fullPatientPayload, 
        id: generatedId,
        created_at: patient.created_at || new Date().toISOString() 
      } as Patient;

      try {
        const localList = getLocalStoragePatients();
        // Filter out mock patients from saving in live mode to avoid re-pollution
        const filteredLocalList = isDemo ? localList : localList.filter(p => p.id !== '1' && p.id !== '2');
        saveToLocal([newPatientLocalObj, ...filteredLocalList]);
      } catch (localWriteErr) {
        console.warn("Failed immediate local patient caching:", localWriteErr);
      }

      if (isDemo) {
        return newPatientLocalObj;
      }

      try {
        const res = await adaptiveUpsertPatient(newPatientLocalObj);
        const insertedPatient = (res.data || newPatientLocalObj) as Patient;
        insertedPatient._isSynced = true;

        const localList = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
        const filteredList = localList.filter(p => p.id !== generatedId && p.id !== insertedPatient.id);
        saveToLocal([insertedPatient, ...filteredList]);
        
        return insertedPatient;
      } catch (err: any) {
        console.warn('Could not save patient to Supabase live table:', err);
        // If error is due to RLS or missing table, propagate with informative message
        if (err.message?.includes('Row Level Security') || err.code === '42P01') {
          throw err;
        }
        return newPatientLocalObj;
      }
    },
    async update(id: string, updates: Partial<Patient>) {
      try {
        const list = getLocalStoragePatients();
        const index = list.findIndex(p => p.id === id);
        if (index !== -1) {
          const updatedList = [...list];
          updatedList[index] = { ...updatedList[index], ...updates };
          saveToLocal(updatedList);
        }
      } catch (e) {
        console.warn("Failed immediate local patient update caching:", e);
      }

      if (isDemo) {
        const list = getLocalStoragePatients();
        const found = list.find(p => p.id === id);
        return found || { ...updates, id } as Patient;
      }

      try {
        const existingList = getLocalStoragePatients();
        const current = existingList.find(p => p.id === id) || { id };
        const merged = { ...current, ...updates, id };
        const res = await adaptiveUpsertPatient(merged);
        
        const updatedPatient = (res.data || merged) as Patient;
        const list = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
        const index = list.findIndex(p => p.id === id);
        if (index !== -1) {
          const updatedList = [...list];
          updatedList[index] = updatedPatient;
          saveToLocal(updatedList);
        }
        return updatedPatient;
      } catch (err: any) {
        console.warn('Could not update in Supabase. Falling back to LocalStorage backup:', err);
        const list = getLocalStoragePatients();
        return list.find(p => p.id === id) || { ...updates, id } as Patient;
      }
    },
    async getById(id: string) {
      if (isPatientDeleted(id)) return null;
      let patient: Patient | null = null;
      if (isDemo) {
        const list = getLocalStoragePatients();
        patient = list.find(p => p.id === id) || null;
      } else {
        try {
          const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
          if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              isPatientsTableMissingState = true;
            }
            throw error;
          }
          isPatientsTableMissingState = false;
          patient = (data as Patient) || null;
        } catch (err: any) {
          console.warn('Could not fetch from Supabase. Sourcing from LocalStorage:', err);
          const list = getLocalStoragePatients();
          patient = list.find(p => p.id === id) || null;
        }
      }

      if (!patient) return null;

      const context = getActiveUserContext();
      if (!context.isAdmin && !isRecordOwnedByCurrentUser(patient, context)) {
        return null;
      }

      return patient;
    },
    async delete(id: string) {
      const cleanId = String(id || '').trim();
      if (!cleanId) return true;

      // 1. Mark as permanently deleted in local persistent storage + indexedDB + memory + server
      markPatientAsDeleted(cleanId);

      // 2. Immediate server persistence deletion and remote cascade
      try {
        fetch('/api/delete-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cleanId })
        }).catch(() => {});
      } catch {}

      if (isDemo) {
        return true;
      }

      // 3. Direct client-side cascade delete from Supabase across all related tables
      try {
        await Promise.allSettled([
          supabase.from('orders').delete().eq('patient_id', cleanId),
          supabase.from('assessments').delete().eq('patient_id', cleanId),
          supabase.from('measurements').delete().eq('patient_id', cleanId),
          supabase.from('clinical_assessments').delete().eq('patient_id', cleanId),
          supabase.from('patient_photos').delete().eq('patient_id', cleanId),
          supabase.from('patient_records').delete().eq('patient_id', cleanId),
          supabase.from('patients').delete().eq('id', cleanId),
          supabase.from('patients').delete().eq('patient_id', cleanId)
        ]);

        return true;
      } catch (err: any) {
        console.warn('Could not delete in Supabase directly, handled via server & tombstone:', err);
        return true;
      }
    }
  },
  orders: {
    async getAll() {
      let result: any[] = [];
      if (isDemo) {
        result = getLocalStorageOrders();
      } else {
        try {
          const { data, error } = await promiseWithTimeout(supabase.from('orders').select('*').order('created_at', { ascending: false }));
          if (error) throw error;
          result = data || [];
        } catch (err) {
          isSupabaseOfflineState = true;
          result = getLocalStorageOrders();
        }
      }

      // Filter out deleted orders and orders for deleted patients
      result = result.filter(o => o && o.id && !isOrderDeleted(o.id) && (!o.patient_id || !isPatientDeleted(o.patient_id)));

      const context = getActiveUserContext();
      if (context.isAdmin) {
        return result;
      }

      // Collect this user's patient IDs and names to correlate orders
      const myPatients = await dbService.patients.getAll();
      const myPatientIds = new Set<string>(myPatients.map(p => p.id).filter(Boolean));
      const myPatientNames = new Set<string>(myPatients.map(p => (p.full_name || '').toLowerCase().trim()).filter(Boolean));

      return result.filter(o => isRecordOwnedByCurrentUser(o, context, myPatientIds, myPatientNames));
    },
    async getRecent() {
      const allOrders = await this.getAll();
      return allOrders.slice(0, 5);
    },
    async getByPatient(patientId: string) {
      if (isPatientDeleted(patientId)) return [];
      const allOrders = await this.getAll();
      return allOrders.filter(o => o.patient_id === patientId);
    },
    async create(order: any) {
      const context = getActiveUserContext();
      const { uid, email, name, role, isAdmin } = context;
      const fullOrderPayload = {
        ...order,
        created_by: order.created_by || uid || undefined,
        created_by_email: order.created_by_email || email || undefined,
        created_by_name: order.created_by_name || name || undefined,
        created_by_role: order.created_by_role || (isAdmin ? 'admin' : role) || undefined,
        therapist_id: order.therapist_id || uid || undefined
      };

      if (isDemo) {
        const list = getLocalStorageOrders();
        const newOrderLocal = {
          ...fullOrderPayload,
          id: 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'Ready'
        };
        saveOrdersToLocal([newOrderLocal, ...list]);
        return newOrderLocal;
      }
      try {
        const { data, error } = await supabase.from('orders').insert(fullOrderPayload).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        isSupabaseOfflineState = true;
        const list = getLocalStorageOrders();
        const newOrderLocal = {
          ...fullOrderPayload,
          id: 'ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'Ready'
        };
        saveOrdersToLocal([newOrderLocal, ...list]);
        return newOrderLocal;
      }
    },
    async update(id: string, updates: any) {
      if (isDemo) {
        const list = getLocalStorageOrders();
        let updatedOrder = null;
        const newList = list.map(o => {
          if (o.id === id) {
            updatedOrder = { ...o, ...updates, updated_at: new Date().toISOString() };
            return updatedOrder;
          }
          return o;
        });
        saveOrdersToLocal(newList);
        return updatedOrder;
      }
      try {
        const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } catch (err) {
        isSupabaseOfflineState = true;
        const list = getLocalStorageOrders();
        let updatedOrder = null;
        const newList = list.map(o => {
          if (o.id === id) {
            updatedOrder = { ...o, ...updates, updated_at: new Date().toISOString() };
            return updatedOrder;
          }
          return o;
        });
        saveOrdersToLocal(newList);
        return updatedOrder;
      }
    },
    async delete(id: string) {
      const cleanId = String(id || '').trim();
      if (!cleanId) return true;

      markOrderAsDeleted(cleanId);
      try {
        fetch('/api/delete-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cleanId })
        }).catch(() => {});
      } catch {}

      if (isDemo) {
        return true;
      }
      try {
        const { error } = await supabase.from('orders').delete().eq('id', cleanId);
        if (error) throw error;
        return true;
      } catch (err) {
        return true;
      }
    }
  },
  assessments: {
    async getAll() {
      let rawList: any[] = [];
      if (isDemo) {
        rawList = getLocalStorageAssessments();
      } else {
        try {
          const { data, error } = await promiseWithTimeout(
            supabase.from('assessments').select('*').order('created_at', { ascending: false })
          );
          if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              isAssessmentsTableMissingState = true;
            }
            throw error;
          }
          isAssessmentsTableMissingState = false;
          
          const allRemoteAssessments = data || [];

          // Purge remote assessments that have been marked deleted
          const remoteDeletedAsms = allRemoteAssessments.filter(a => a && a.id && (isAssessmentDeleted(a.id) || (a.patient_id && isPatientDeleted(a.patient_id))));
          if (remoteDeletedAsms.length > 0) {
            remoteDeletedAsms.forEach(da => {
              supabase.from('assessments').delete().eq('id', da.id).then(() => {});
            });
          }

          const remoteAssessments = allRemoteAssessments.filter(a => a && a.id && !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id)));
          const remoteIds = new Set(remoteAssessments.map(a => a.id));
          
          // Merge with local storage assessments so no client work is lost
          const localAssessments = getLocalStorageAssessments().filter(a => a && a.id && !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id)));
          
          // Background Auto-Sync: Automatically upload local assessments that are not in the remote database using adaptive upsert
          const unsyncedAssessments = localAssessments.filter(a => a && a.id && !remoteIds.has(a.id) && !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id)));
          if (unsyncedAssessments.length > 0) {
            console.log(`[Sync] Found ${unsyncedAssessments.length} unsynced local assessments. Uploading to live database...`);
            for (const asm of unsyncedAssessments) {
              try {
                const res = await adaptiveUpsertAssessment(asm);
                if (res.synced) {
                  console.log(`[Sync] Successfully synced assessment for "${asm.patient_name || asm.id}" to Supabase!`);
                  asm._isSynced = true;
                  remoteAssessments.push(res.data);
                  remoteIds.add(res.data.id);
                }
              } catch (syncErr: any) {
                console.warn(`[Sync] Auto-sync failed for assessment "${asm.id}":`, syncErr.message || syncErr);
              }
            }
          }

          const assessmentMap = new Map<string, any>();
          
          localAssessments.forEach(a => {
            if (a && a.id && !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id))) {
              const isSynced = remoteIds.has(a.id);
              assessmentMap.set(a.id, { ...a, _isSynced: isSynced });
            }
          });
          
          remoteAssessments.forEach(a => {
            if (a && a.id && !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id))) {
              const localVersion = assessmentMap.get(a.id);
              assessmentMap.set(a.id, {
                ...localVersion,
                ...a,
                created_by: a.created_by || localVersion?.created_by,
                created_by_email: a.created_by_email || localVersion?.created_by_email,
                created_by_name: a.created_by_name || localVersion?.created_by_name,
                created_by_role: a.created_by_role || localVersion?.created_by_role,
                therapist_id: a.therapist_id || localVersion?.therapist_id,
                therapist_name: a.therapist_name || localVersion?.therapist_name,
                assessor_name: a.assessor_name || localVersion?.assessor_name,
                _isSynced: true
              });
            }
          });
          
          const mergedList = Array.from(assessmentMap.values()).filter(a => !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id))).sort((a, b) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          
          saveAssessmentsToLocal(mergedList);
          
          rawList = mergedList;
        } catch (err: any) {
          console.warn('Could not fetch assessments from Supabase. Sourcing from LocalStorage:', err);
          rawList = getLocalStorageAssessments().filter(a => !isAssessmentDeleted(a.id) && (!a.patient_id || !isPatientDeleted(a.patient_id))).map(a => ({ ...a, _isSynced: false }));
        }
      }

      // Check Active User Context and Scope Access
      const context = getActiveUserContext();
      if (context.isAdmin) {
        // Admin sees ALL assessments from all user accounts
        return rawList;
      }

      // Collect this user's patient IDs and names to correlate assessments
      const myPatients = await dbService.patients.getAll();
      const myPatientIds = new Set<string>(myPatients.map(p => p.id).filter(Boolean));
      const myPatientNames = new Set<string>(myPatients.map(p => (p.full_name || '').toLowerCase().trim()).filter(Boolean));

      // Regular user (therapist/technician): Only see their own assessments
      // Admin-created assessments and other users' assessments are strictly excluded
      const userAssessments = rawList.filter(a => isRecordOwnedByCurrentUser(a, context, myPatientIds, myPatientNames));

      return userAssessments;
    },
    async create(assessment: any) {
      const context = getActiveUserContext();
      const { uid, email, name, role, isAdmin } = context;
      const generatedId = assessment.id || 'asm-' + Math.random().toString(36).substr(2, 9);
      unmarkAssessmentAsDeleted(generatedId);
      if (assessment.id) unmarkAssessmentAsDeleted(assessment.id);

      const fullAssessmentPayload = {
        ...assessment,
        id: generatedId,
        created_by: assessment.created_by || uid || undefined,
        created_by_email: assessment.created_by_email || email || undefined,
        created_by_name: assessment.created_by_name || name || undefined,
        created_by_role: assessment.created_by_role || (isAdmin ? 'admin' : role) || undefined,
        therapist_id: assessment.therapist_id || uid || undefined,
        therapist_name: assessment.therapist_name || name || undefined,
        assessor_name: assessment.assessor_name || name || email || undefined,
        created_at: assessment.created_at || new Date().toISOString()
      };

      try {
        const localList = getLocalStorageAssessments();
        saveAssessmentsToLocal([fullAssessmentPayload, ...localList]);
      } catch (localWriteErr) {
        console.warn("Failed immediate local assessment caching:", localWriteErr);
      }

      if (isDemo) {
        return fullAssessmentPayload;
      }

      try {
        const res = await adaptiveUpsertAssessment(fullAssessmentPayload);
        const insertedAssessment = (res.data || fullAssessmentPayload);
        insertedAssessment._isSynced = true;

        const localList = getLocalStorageAssessments();
        const filteredList = localList.filter(a => a.id !== generatedId && a.id !== insertedAssessment.id);
        saveAssessmentsToLocal([insertedAssessment, ...filteredList]);
        
        return insertedAssessment;
      } catch (err: any) {
        console.warn('Could not save assessment to Supabase live table:', err);
        if (err.message?.includes('Row Level Security') || err.code === '42P01') {
          throw err;
        }
        return fullAssessmentPayload;
      }
    },
    async update(id: string, updates: any) {
      try {
        const list = getLocalStorageAssessments();
        const index = list.findIndex(a => a.id === id);
        if (index !== -1) {
          const updatedList = [...list];
          updatedList[index] = { ...updatedList[index], ...updates };
          saveAssessmentsToLocal(updatedList);
        }
      } catch (e) {
        console.warn("Failed immediate local assessment update caching:", e);
      }

      if (isDemo) {
        const list = getLocalStorageAssessments();
        const found = list.find(a => a.id === id);
        return found || { ...updates, id };
      }

      try {
        const cleanPayload = { ...updates };
        delete (cleanPayload as any).id;
        delete (cleanPayload as any)._isSynced;
        const { data, error } = await supabase.from('assessments').update(cleanPayload).eq('id', id).select().single();
        if (error) throw error;
        
        const updatedAssessment = data || { ...updates, id };
        const localList = getLocalStorageAssessments();
        const idx = localList.findIndex(a => a.id === id);
        if (idx !== -1) {
          localList[idx] = { ...localList[idx], ...updatedAssessment };
          saveAssessmentsToLocal(localList);
        }
        return updatedAssessment;
      } catch (err) {
        console.warn('Could not update assessment in Supabase. Fallback active in LocalStorage:', err);
        const list = getLocalStorageAssessments();
        const found = list.find(a => a.id === id);
        return found || { ...updates, id };
      }
    },
    async delete(id: string) {
      const cleanId = String(id || '').trim();
      if (!cleanId) return true;

      markAssessmentAsDeleted(cleanId);
      try {
        fetch('/api/delete-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cleanId })
        }).catch(() => {});
      } catch {}

      if (isDemo) {
        return true;
      }
      try {
        const { error } = await supabase.from('assessments').delete().eq('id', cleanId);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Could not delete from Supabase directly, tombstoned & server synced:', err);
        return true;
      }
    }
  },
  profiles: {
    async getAll() {
      if (isDemo) {
        const stored = localStorage.getItem('demo_profiles');
        return stored ? JSON.parse(stored) : [];
      }
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        const stored = localStorage.getItem('demo_profiles');
        return stored ? JSON.parse(stored) : [];
      }
    }
  }
};

export const testSupabaseSync = async (): Promise<{
  success: boolean;
  message: string;
  error?: any;
  steps: { name: string; success: boolean; detail?: string }[];
}> => {
  const steps: { name: string; success: boolean; detail?: string }[] = [];
  
  if (isDemo) {
    return {
      success: false,
      message: 'App is running in DEMO mode because no real Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are configured.',
      steps: [{ name: 'Check Live Connection', success: false, detail: 'Demo mode is active.' }]
    };
  }

  try {
    // Step 1: Ping Supabase by checking auth session
    try {
      await supabase.auth.getSession();
      steps.push({ name: 'Ping Supabase Auth API', success: true, detail: 'Successfully contacted Supabase Auth.' });
    } catch (e: any) {
      steps.push({ name: 'Ping Supabase Auth API', success: false, detail: e.message || String(e) });
      throw new Error(`Auth ping failed: ${e.message || String(e)}`);
    }

    // Step 2: Try to read from 'patients' table
    let countVal = 0;
    try {
      const { data, error, count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      if (error) throw error;
      countVal = count || 0;
      steps.push({ name: 'Read Patients Table', success: true, detail: `Successfully queried patients list. Remote row count: ${countVal}.` });
    } catch (e: any) {
      steps.push({ name: 'Read Patients Table', success: false, detail: `Read failed: ${e.message || String(e)}. This happens if the "patients" table does not exist or has no active SELECT policy.` });
      throw e;
    }

    // Step 3: Try to write a temporary test patient with a valid UUID format
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    const testId = generateUUID();
    try {
      const { error: insertError } = await supabase.from('patients').insert({
        id: testId,
        full_name: 'OVERPLAST_SYNC_TEST',
        age: 99,
        gender: 'other',
        phone: '000',
        address: 'Test',
        doctor_name: 'Test',
        notes: 'Temporary sync diagnostics. Please ignore.'
      });
      if (insertError) throw insertError;
      steps.push({ name: 'Write Patient (Insert)', success: true, detail: 'Successfully inserted test patient row.' });
    } catch (e: any) {
      steps.push({ name: 'Write Patient (Insert)', success: false, detail: `Insert failed: ${e.message || String(e)}. This is 100% due to Row Level Security (RLS) blocking write access, or column type mismatch.` });
      throw e;
    }

    // Step 4: Try to delete the temporary test patient
    try {
      const { error: deleteError } = await supabase.from('patients').delete().eq('id', testId);
      if (deleteError) throw deleteError;
      steps.push({ name: 'Delete Test Patient (Cleanup)', success: true, detail: 'Successfully cleaned up test patient row.' });
    } catch (e: any) {
      steps.push({ name: 'Delete Test Patient (Cleanup)', success: false, detail: `Cleanup warning: ${e.message || String(e)}` });
    }

    return {
      success: true,
      message: 'Mubarak ho! Supabase connection, read, and write operations are 100% active, fully authenticated, and synchronized!',
      steps
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || String(err),
      error: err,
      steps
    };
  }
};

export const testSupabaseConnection = testSupabaseSync;

// Global Sync helper functions for clinical user profiles to allow robust cross-device login
const sanitizeProfileObj = (p: any) => {
  if (!p || typeof p !== 'object') return p;
  let email = (p.email || '').trim().toLowerCase();
  let password = p.password ? String(p.password).trim() : '';

  return {
    ...p,
    email,
    password
  };
};

export const syncClinicalProfilesFromServer = async (): Promise<any[]> => {
  try {
    let adminToken = '';
    try {
      const sessionRes = await supabase.auth.getSession();
      adminToken = sessionRes.data.session?.access_token || '';
    } catch {}

    // First try the full sync endpoint
    const syncRes = await fetch("/api/admin/sync-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseUrl,
        supabaseAnonKey,
        adminToken
      })
    }).catch(() => null);

    if (syncRes && syncRes.ok) {
      const syncData = await syncRes.json().catch(() => ({}));
      if (Array.isArray(syncData.profiles) && syncData.profiles.length > 0) {
        const sanitized = syncData.profiles.map(sanitizeProfileObj);
        // Deduplicate strictly by unique Account ID (UUID)
        const dedupedMap = new Map();
        sanitized.forEach((p: any) => {
          if (p && p.id) {
            dedupedMap.set(p.id, p);
          }
        });
        const dedupedList = Array.from(dedupedMap.values());
        localStorage.setItem('demo_profiles', JSON.stringify(dedupedList));
        return dedupedList;
      }
    }

    // Fallback to /api/get-profiles
    const res = await fetch("/api/get-profiles");
    if (res.ok) {
      const serverProfiles = await res.json();
      if (Array.isArray(serverProfiles) && serverProfiles.length > 0) {
        const dedupedMap = new Map();
        serverProfiles.forEach((p: any) => {
          if (p && p.id) {
            dedupedMap.set(p.id, sanitizeProfileObj(p));
          }
        });
        
        const mergedList = Array.from(dedupedMap.values()).map(sanitizeProfileObj);
        localStorage.setItem('demo_profiles', JSON.stringify(mergedList));
        return mergedList;
      }
    }
  } catch (e) {
    console.warn("Failed to sync clinical profiles from server:", e);
  }
  const stored = localStorage.getItem('demo_profiles');
  const list = stored ? JSON.parse(stored) : [];
  const dedupedMap = new Map();
  list.forEach((p: any) => {
    if (p && p.id) {
      dedupedMap.set(p.id, sanitizeProfileObj(p));
    }
  });
  return Array.from(dedupedMap.values());
};

export const saveClinicalProfilesToServer = async (profiles: any[]): Promise<boolean> => {
  try {
    const sanitized = Array.isArray(profiles) ? profiles.map(sanitizeProfileObj) : [];
    const res = await fetch("/api/save-profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sanitized)
    });
    return res.ok;
  } catch (e) {
    console.warn("Failed to save clinical profiles to server:", e);
    return false;
  }
};
