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

// Determine if we should run in local/demo mode
export const isDemo = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your_supabase_project_url') ||
  localStorage.getItem('supabase_force_demo') === 'true';

export const setForceDemo = (val: boolean) => {
  if (val) {
    localStorage.setItem('supabase_force_demo', 'true');
  } else {
    localStorage.removeItem('supabase_force_demo');
  }
};

// Create the Supabase client
export const supabase = createClient(
  isDemo ? 'https://placeholder.supabase.co' : supabaseUrl,
  isDemo ? 'placeholder' : supabaseAnonKey,
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
          if (error) throw error;
          isSupabaseOfflineState = false;
          lastSupabaseError = null;
          
          const localPatients = getLocalStoragePatients();
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
          console.warn('Supabase Offline. Falling back to LocalStorage:', err);
          isSupabaseOfflineState = true;
          lastSupabaseError = err;
          result = getLocalStoragePatients();
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

      const generatedId = 'pat-' + Math.random().toString(36).substr(2, 9);
      const newPatientLocalObj = { 
        ...fullPatientPayload, 
        id: generatedId,
        created_at: patient.created_at || new Date().toISOString() 
      } as Patient;

      try {
        const localList = getLocalStoragePatients();
        saveToLocal([newPatientLocalObj, ...localList]);
      } catch (localWriteErr) {
        console.warn("Failed immediate local patient caching:", localWriteErr);
      }

      if (isDemo) {
        return newPatientLocalObj;
      }

      try {
        const cleanPayload = { ...fullPatientPayload };
        delete (cleanPayload as any).id;
        
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

        const { data, error } = await supabase.from('patients').insert(cleanPayload).select().single();
        if (error) throw error;
        
        const insertedPatient = data as Patient;
        const localList = getLocalStoragePatients();
        const filteredList = localList.filter(p => p.id !== generatedId && p.id !== insertedPatient.id);
        saveToLocal([insertedPatient, ...filteredList]);
        
        return insertedPatient;
      } catch (err) {
        console.warn('Could not save to Supabase. Fallback is already safely active in LocalStorage:', err);
        isSupabaseOfflineState = true;
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
        if (error) throw error;
        
        const updatedPatient = data as Patient;
        const list = getLocalStoragePatients();
        const index = list.findIndex(p => p.id === id);
        if (index !== -1) {
          const updatedList = [...list];
          updatedList[index] = updatedPatient;
          saveToLocal(updatedList);
        }
        return updatedPatient;
      } catch (err) {
        console.warn('Could not update in Supabase. Falling back to LocalStorage backup:', err);
        isSupabaseOfflineState = true;
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
        if (error) throw error;
        const found = data as Patient;
        if (found && !isCurrentUserAdmin() && currentUserId && found.created_by !== currentUserId) {
          return null;
        }
        return found;
      } catch (err) {
        console.warn('Could not fetch from Supabase. Sourcing from LocalStorage:', err);
        isSupabaseOfflineState = true;
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
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Could not delete in Supabase. Already removed from LocalStorage backup:', err);
        isSupabaseOfflineState = true;
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
      let result = getLocalStorageAssessments();
      if (!isCurrentUserAdmin() && currentUserId) {
        result = result.filter(a => a.created_by === currentUserId);
      }
      return result;
    },
    async create(assessment: any) {
      const list = getLocalStorageAssessments();
      const newAssessment = {
        ...assessment,
        created_by: currentUserId || undefined,
        id: 'asm-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      saveAssessmentsToLocal([newAssessment, ...list]);
      return newAssessment;
    },
    async delete(id: string) {
      const list = getLocalStorageAssessments();
      saveAssessmentsToLocal(list.filter(a => a.id !== id));
      return true;
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
