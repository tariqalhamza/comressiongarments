import { createClient } from '@supabase/supabase-js';
import { Patient } from '../types';

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

// Retrieve credentials from environment variables or custom localStorage overrides
const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('VITE_SUPABASE_URL');
  const localKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY');
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const url = localUrl || envUrl || '';
  const key = localKey || envKey || '';
  
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
export const promiseWithTimeout = async <T = any>(promise: any, ms: number = 5500): Promise<T> => {
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

const STORAGE_KEY = 'precision_patients_data';
const ORDERS_STORAGE_KEY = 'precision_orders_data';

const DEFAULT_MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    clinic_id: 'cl-001',
    full_name: 'Zubair Ahmed',
    age: 45,
    gender: 'male',
    height: 175,
    weight: 78,
    phone: '+92 300 1234567',
    email: 'zubair@example.com',
    address: 'Street 5, Area 2, Karachi',
    diagnosis: 'Chronic venous insufficiency',
    medical_condition: 'Stage 2 swelling in right leg.',
    doctor_name: 'Dr. Faisal',
    hospital: 'City Hospital',
    created_at: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: '2',
    clinic_id: 'cl-001',
    full_name: 'Sara Khan',
    age: 32,
    gender: 'female',
    height: 160,
    weight: 55,
    phone: '+92 321 7654321',
    email: 'sara@example.com',
    address: 'Apartment 4B, Sector F, Islamabad',
    diagnosis: 'Patient Registration',
    medical_condition: 'Left arm swelling.',
    doctor_name: 'Dr. Maria',
    hospital: 'Metro Medical',
    created_at: new Date(Date.now() - 1296000000).toISOString(),
  }
];

const DEFAULT_MOCK_ORDERS: any[] = [
  {
    id: 'ORD-7721A',
    patient_id: '1',
    patient_name: 'Zubair Ahmed',
    doctor_name: 'Dr. Faisal',
    garment_type: 'Leg Sleeve (CCL2)',
    status: 'In Production',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    config: { type: 'Lower Limb' }
  },
  {
    id: 'ORD-8812B',
    patient_id: '2',
    patient_name: 'Sara Khan',
    doctor_name: 'Dr. Maria',
    garment_type: 'Arm Sleeve (CCL1)',
    status: 'In Production',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    config: { type: 'Upper Limb' }
  }
];

const INITIALIZED_KEY = 'precision_data_initialized';

// Dynamic loaders for local storage lists
const getLocalStoragePatients = (): Patient[] => {
  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (initialized === 'cleared') return [];
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_PATIENTS));
    return DEFAULT_MOCK_PATIENTS;
  } catch (e) {
    return DEFAULT_MOCK_PATIENTS;
  }
};

const getLocalStorageOrders = (): any[] => {
  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (initialized === 'cleared') return [];
    
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_ORDERS));
    return DEFAULT_MOCK_ORDERS;
  } catch (e) {
    return DEFAULT_MOCK_ORDERS;
  }
};

const saveToLocal = (patients: Patient[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.error('Failed to save patients to localStorage', e);
  }
};

const saveOrdersToLocal = (orders: any[]) => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
};

const ASSESSMENTS_STORAGE_KEY = 'precision_assessments_data';

const getLocalStorageAssessments = (): any[] => {
  try {
    const saved = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveAssessmentsToLocal = (assessments: any[]) => {
  try {
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
  } catch (e) {
    console.error('Failed to save assessments to localStorage', e);
  }
};

export const clearDemoData = () => {
  try {
    localStorage.setItem(INITIALIZED_KEY, 'cleared');
    localStorage.setItem(STORAGE_KEY, '[]');
    localStorage.setItem(ORDERS_STORAGE_KEY, '[]');
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, '[]');
    return true;
  } catch (e) {
    console.error('Failed to clear demo data', e);
    return false;
  }
};

const isValidUUID = (str: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export let currentUserId: string | null = null;
export let currentUserEmail: string | null = null;
export let currentUserRole: string = 'therapist';

export const updateCurrentUserContext = (id: string | null, email: string | null, role: string) => {
  currentUserId = id;
  currentUserEmail = email;
  currentUserRole = role;
};

export const isCurrentUserAdmin = () => {
  if (currentUserRole === 'admin') return true;
  if (currentUserEmail) {
    const emailLower = currentUserEmail.toLowerCase().trim();
    if (['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com'].includes(emailLower)) {
      return true;
    }
  }
  return false;
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
    }
  }
} catch (e) {
  console.warn("Offline context pre-hydration on boot failed:", e);
}

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
          
          // In live mode, exclude mock/demo profiles with IDs '1' and '2' so they don't block deletion or clutter databases
          const localPatients = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
          const remotePatients = (data || []) as Patient[];
          const patientMap = new Map<string, Patient>();
          
          localPatients.forEach(p => {
            if (p && p.id) {
              patientMap.set(p.id, p);
            }
          });
          
          remotePatients.forEach(p => {
            if (p && p.id) {
              patientMap.set(p.id, p);
            }
          });
          
          const mergedList = Array.from(patientMap.values()).sort((a, b) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          });
          
          saveToLocal(mergedList);
          result = mergedList;
        } catch (err: any) {
          console.warn('Supabase Offline or Error. Falling back to LocalStorage:', err);
          isSupabaseOfflineState = true;
          lastSupabaseError = err;
          // Filter out mock patients in live fallback too
          result = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
        }
      }

      // Filter by ownership if current user is not Admin
      if (!isCurrentUserAdmin() && currentUserId) {
        result = result.filter(p => p.created_by === currentUserId);
      }
      return result;
    },
    async create(patient: Partial<Patient>) {
      const fullPatientPayload = {
        ...patient,
        created_by: currentUserId || undefined
      };

      // Generate a valid UUID so it satisfies UUID primary keys in Supabase while preserving identity
      const generatedId = generateUUID();
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
        // Keep the generated ID so local and remote are 100% in sync! This avoids duplicates.
        const cleanPayload = { id: generatedId, ...fullPatientPayload };
        
        if (cleanPayload.clinic_id && !isValidUUID(cleanPayload.clinic_id)) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('clinic_id')
                .eq('id', session.user.id)
                .single();
              
              if (profile?.clinic_id && isValidUUID(profile.clinic_id)) {
                cleanPayload.clinic_id = profile.clinic_id;
              } else {
                delete cleanPayload.clinic_id;
              }
            } else {
              delete cleanPayload.clinic_id;
            }
          } catch (e) {
            delete cleanPayload.clinic_id;
          }
        }

        let { data, error } = await supabase.from('patients').insert(cleanPayload).select().single();
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            isPatientsTableMissingState = true;
          }
          // Dynamic schema fallback: if the 'created_by' column does not exist, strip it and retry
          if (error.message?.includes('created_by') || error.code === '42703') {
            const retryPayload = { ...cleanPayload };
            delete (retryPayload as any).created_by;
            const retryResult = await supabase.from('patients').insert(retryPayload).select().single();
            if (retryResult.error) throw retryResult.error;
            data = retryResult.data;
            error = null;
          } else {
            throw error;
          }
        }
        isPatientsTableMissingState = false;
        
        const insertedPatient = data as Patient;
        const localList = getLocalStoragePatients().filter(p => p.id !== '1' && p.id !== '2');
        const filteredList = localList.filter(p => p.id !== generatedId && p.id !== insertedPatient.id);
        saveToLocal([insertedPatient, ...filteredList]);
        
        return insertedPatient;
      } catch (err: any) {
        console.warn('Could not save to Supabase. Fallback is already safely active in LocalStorage:', err);
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
        const cleanPayload = { ...updates };
        delete (cleanPayload as any).id;
        
        if (cleanPayload.clinic_id && !isValidUUID(cleanPayload.clinic_id)) {
          delete cleanPayload.clinic_id;
        }

        const { data, error } = await supabase.from('patients').update(cleanPayload).eq('id', id).select().single();
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            isPatientsTableMissingState = true;
          }
          throw error;
        }
        isPatientsTableMissingState = false;
        
        const updatedPatient = data as Patient;
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
      if (isDemo) {
        const list = getLocalStoragePatients();
        const found = list.find(p => p.id === id) || null;
        if (found && !isCurrentUserAdmin() && currentUserId && found.created_by !== currentUserId) {
          return null;
        }
        return found;
      }
      try {
        const { data, error } = await supabase.from('patients').select('*').eq('id', id).single();
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            isPatientsTableMissingState = true;
          }
          throw error;
        }
        isPatientsTableMissingState = false;
        const found = data as Patient;
        if (found && !isCurrentUserAdmin() && currentUserId && found.created_by !== currentUserId) {
          return null;
        }
        return found;
      } catch (err: any) {
        console.warn('Could not fetch from Supabase. Sourcing from LocalStorage:', err);
        const list = getLocalStoragePatients();
        const found = list.find(p => p.id === id) || null;
        if (found && !isCurrentUserAdmin() && currentUserId && found.created_by !== currentUserId) {
          return null;
        }
        return found;
      }
    },
    async delete(id: string) {
      try {
        const list = getLocalStoragePatients();
        saveToLocal(list.filter(p => p.id !== id));
      } catch (e) {
        console.warn("Failed immediate local patient delete:", e);
      }

      if (isDemo) {
        return true;
      }
      try {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            isPatientsTableMissingState = true;
          }
          throw error;
        }
        isPatientsTableMissingState = false;
        return true;
      } catch (err: any) {
        console.warn('Could not delete in Supabase. Already removed from LocalStorage backup:', err);
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

      if (!isCurrentUserAdmin() && currentUserId) {
        result = result.filter(o => o.created_by === currentUserId);
      }
      return result;
    },
    async getRecent() {
      let result: any[] = [];
      if (isDemo) {
        result = getLocalStorageOrders();
      } else {
        try {
          const { data, error } = await promiseWithTimeout(supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5));
          if (error) throw error;
          result = data || [];
        } catch (err) {
          isSupabaseOfflineState = true;
          const list = getLocalStorageOrders();
          result = list;
        }
      }

      if (!isCurrentUserAdmin() && currentUserId) {
        result = result.filter(o => o.created_by === currentUserId);
      }
      return result.slice(0, 5);
    },
    async getByPatient(patientId: string) {
      let result: any[] = [];
      if (isDemo) {
        result = getLocalStorageOrders();
      } else {
        try {
          const { data, error } = await supabase.from('orders').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
          if (error) throw error;
          result = data || [];
        } catch (err) {
          isSupabaseOfflineState = true;
          result = getLocalStorageOrders();
        }
      }

      result = result.filter(o => o.patient_id === patientId);

      if (!isCurrentUserAdmin() && currentUserId) {
        result = result.filter(o => o.created_by === currentUserId);
      }
      return result;
    },
    async create(order: any) {
      const fullOrderPayload = {
        ...order,
        created_by: currentUserId || undefined
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
      if (isDemo) {
        const list = getLocalStorageOrders();
        saveOrdersToLocal(list.filter(o => o.id !== id));
        return true;
      }
      try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        isSupabaseOfflineState = true;
        const list = getLocalStorageOrders();
        saveOrdersToLocal(list.filter(o => o.id !== id));
        return true;
      }
    }
  },
  assessments: {
    async getAll() {
      if (isDemo) {
        let result = getLocalStorageAssessments();
        if (!isCurrentUserAdmin() && currentUserId) {
          result = result.filter(a => a.created_by === currentUserId);
        }
        return result;
      }
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
        
        const remoteAssessments = data || [];
        
        // Merge with local storage assessments so no client work is lost
        const localAssessments = getLocalStorageAssessments();
        const assessmentMap = new Map<string, any>();
        
        localAssessments.forEach(a => {
          if (a && a.id) {
            assessmentMap.set(a.id, a);
          }
        });
        
        remoteAssessments.forEach(a => {
          if (a && a.id) {
            assessmentMap.set(a.id, a);
          }
        });
        
        const mergedList = Array.from(assessmentMap.values()).sort((a, b) => {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        
        saveAssessmentsToLocal(mergedList);
        
        let result = mergedList;
        if (!isCurrentUserAdmin() && currentUserId) {
          result = result.filter(a => a.created_by === currentUserId);
        }
        return result;
      } catch (err: any) {
        console.warn('Could not fetch assessments from Supabase. Sourcing from LocalStorage:', err);
        let result = getLocalStorageAssessments();
        if (!isCurrentUserAdmin() && currentUserId) {
          result = result.filter(a => a.created_by === currentUserId);
        }
        return result;
      }
    },
    async create(assessment: any) {
      const generatedId = assessment.id || 'asm-' + Math.random().toString(36).substr(2, 9);
      const fullAssessmentPayload = {
        ...assessment,
        id: generatedId,
        created_by: currentUserId || undefined,
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
        const { data, error } = await supabase.from('assessments').insert(fullAssessmentPayload).select().single();
        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            isAssessmentsTableMissingState = true;
          }
          throw error;
        }
        isAssessmentsTableMissingState = false;
        
        const insertedAssessment = data || fullAssessmentPayload;
        const localList = getLocalStorageAssessments();
        const filteredList = localList.filter(a => a.id !== generatedId && a.id !== insertedAssessment.id);
        saveAssessmentsToLocal([insertedAssessment, ...filteredList]);
        
        return insertedAssessment;
      } catch (err) {
        console.warn('Could not save to Supabase. Fallback is already safely active in LocalStorage:', err);
        return fullAssessmentPayload;
      }
    },
    async delete(id: string) {
      try {
        const list = getLocalStorageAssessments();
        saveAssessmentsToLocal(list.filter(a => a.id !== id));
      } catch (e) {
        console.warn("Failed immediate local assessment delete:", e);
      }

      if (isDemo) {
        return true;
      }
      try {
        const { error } = await supabase.from('assessments').delete().eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Could not delete from Supabase. Already removed from LocalStorage backup:', err);
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
