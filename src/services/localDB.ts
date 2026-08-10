import { Patient } from '../types';

const DB_NAME = 'precision_clinical_db';
const DB_VERSION = 1;
const STORAGE_KEY = 'precision_patients_data';
const ORDERS_STORAGE_KEY = 'precision_orders_data';
const ASSESSMENTS_STORAGE_KEY = 'precision_assessments_data';
const INITIALIZED_KEY = 'precision_data_initialized';
const DELETED_PATIENTS_KEY = 'precision_deleted_patients_ids';
const DELETED_ASSESSMENTS_KEY = 'precision_deleted_assessments_ids';
const DELETED_ORDERS_KEY = 'precision_deleted_orders_ids';

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

// Persistent Tombstone / Deleted IDs retrieval
export const getDeletedPatientIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_PATIENTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(x => String(x).trim()).filter(Boolean));
      }
    }
  } catch {}
  return new Set();
};

export const isPatientDeleted = (id: string): boolean => {
  if (!id) return false;
  const strId = String(id).trim();
  const set = getDeletedPatientIds();
  return set.has(strId) || set.has(id);
};

export const getDeletedAssessmentIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_ASSESSMENTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(x => String(x).trim()).filter(Boolean));
      }
    }
  } catch {}
  return new Set();
};

export const isAssessmentDeleted = (id: string): boolean => {
  if (!id) return false;
  const strId = String(id).trim();
  const set = getDeletedAssessmentIds();
  return set.has(strId) || set.has(id);
};

export const getDeletedOrderIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(x => String(x).trim()).filter(Boolean));
      }
    }
  } catch {}
  return new Set();
};

export const isOrderDeleted = (id: string): boolean => {
  if (!id) return false;
  const strId = String(id).trim();
  const set = getDeletedOrderIds();
  return set.has(strId) || set.has(id);
};

// In-memory runtime cache for instant synchronous access
let inMemoryPatients: Patient[] = [];
let inMemoryAssessments: any[] = [];
let inMemoryOrders: any[] = [];
let isInitialized = false;

// Helper: Open native IndexedDB
const openIndexedDB = (): Promise<IDBDatabase | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('assessments')) {
          db.createObjectStore('assessments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

// Helper: Read all items from an IndexedDB store
const readFromIndexedDB = async <T>(storeName: string): Promise<T[]> => {
  const db = await openIndexedDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

// Helper: Save items in bulk to IndexedDB store
const writeToIndexedDB = async <T extends { id: string }>(storeName: string, items: T[]): Promise<boolean> => {
  const db = await openIndexedDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach(item => {
        if (item && item.id) {
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
};

// Helper to strip massive base64 strings if localStorage quota is tight
const stripHeavyFields = (item: any): any => {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };
  if (typeof copy.photo_url === 'string' && copy.photo_url.length > 5000) {
    copy.photo_url = '';
  }
  if (typeof copy.imageUrl === 'string' && copy.imageUrl.length > 5000) {
    copy.imageUrl = '';
  }
  if (copy.sub_options && typeof copy.sub_options === 'object') {
    const cleanSub: any = {};
    for (const [k, v] of Object.entries(copy.sub_options)) {
      if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 5000) {
        cleanSub[k] = '';
      } else {
        cleanSub[k] = v;
      }
    }
    copy.sub_options = cleanSub;
  }
  return copy;
};

// Quota-safe localStorage write
const safeSetLocalStorage = (key: string, data: any) => {
  try {
    const raw = JSON.stringify(data);
    localStorage.setItem(key, raw);
  } catch (err: any) {
    try {
      if (Array.isArray(data)) {
        const lightweight = data.map(stripHeavyFields);
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      try {
        console.warn(`LocalStorage quota reached for key "${key}". Data is securely retained in IndexedDB & server memory.`);
      } catch {}
    }
  }
};

// Debounced background sync to server
let syncTimeout: any = null;
const scheduleServerSync = (immediate: boolean = false) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  const performSync = async () => {
    try {
      const delPatients = getDeletedPatientIds();
      const delAssessments = getDeletedAssessmentIds();
      const delOrders = getDeletedOrderIds();

      const cleanPatients = inMemoryPatients.filter(p => p && p.id && !delPatients.has(p.id));
      const cleanAssessments = inMemoryAssessments.filter(a => a && a.id && !delAssessments.has(a.id));
      const cleanOrders = inMemoryOrders.filter(o => o && o.id && !delOrders.has(o.id));

      await fetch('/api/save-clinical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: cleanPatients,
          assessments: cleanAssessments,
          orders: cleanOrders
        })
      });
    } catch (e) {
      // Server sync error is silent
    }
  };

  if (immediate) {
    performSync();
  } else {
    syncTimeout = setTimeout(performSync, 500);
  }
};

// Initial Synchronous Boot from LocalStorage
const hydrateFromLocalStorage = () => {
  try {
    const initVal = localStorage.getItem(INITIALIZED_KEY);
    if (initVal === 'cleared') {
      inMemoryPatients = [];
      inMemoryOrders = [];
      inMemoryAssessments = [];
      return;
    }

    const delPatients = getDeletedPatientIds();
    const delAssessments = getDeletedAssessmentIds();
    const delOrders = getDeletedOrderIds();

    const savedP = localStorage.getItem(STORAGE_KEY);
    if (savedP) {
      const parsed: Patient[] = JSON.parse(savedP);
      inMemoryPatients = Array.isArray(parsed) ? parsed.filter(p => p && p.id && !delPatients.has(p.id)) : [];
    } else {
      inMemoryPatients = DEFAULT_MOCK_PATIENTS.filter(p => !delPatients.has(p.id));
      safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);
    }

    const savedO = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedO) {
      const parsed: any[] = JSON.parse(savedO);
      inMemoryOrders = Array.isArray(parsed) ? parsed.filter(o => o && o.id && !delOrders.has(o.id)) : [];
    } else {
      inMemoryOrders = DEFAULT_MOCK_ORDERS.filter(o => !delOrders.has(o.id));
      safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);
    }

    const savedA = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (savedA) {
      const parsed: any[] = JSON.parse(savedA);
      inMemoryAssessments = Array.isArray(parsed) ? parsed.filter(a => a && a.id && !delAssessments.has(a.id)) : [];
    } else {
      inMemoryAssessments = [];
    }
  } catch {
    inMemoryPatients = [];
    inMemoryOrders = [];
    inMemoryAssessments = [];
  }
};

// Run synchronous hydration immediately on script load
hydrateFromLocalStorage();

// Async initialization: merges with IndexedDB and Server Data
export const initLocalDB = async () => {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const delPatients = getDeletedPatientIds();
    const delAssessments = getDeletedAssessmentIds();
    const delOrders = getDeletedOrderIds();

    // 1. Fetch from IndexedDB
    const [dbPatients, dbAssessments, dbOrders] = await Promise.all([
      readFromIndexedDB<Patient>('patients'),
      readFromIndexedDB<any>('assessments'),
      readFromIndexedDB<any>('orders')
    ]);

    // 2. Fetch from Server
    let srvPatients: Patient[] = [];
    let srvAssessments: any[] = [];
    let srvOrders: any[] = [];
    try {
      const res = await fetch('/api/get-clinical-data');
      if (res.ok) {
        const srvData = await res.json();
        if (Array.isArray(srvData.patients)) srvPatients = srvData.patients;
        if (Array.isArray(srvData.assessments)) srvAssessments = srvData.assessments;
        if (Array.isArray(srvData.orders)) srvOrders = srvData.orders;

        // Ingest and persist deleted IDs from server across all devices
        if (Array.isArray(srvData.deleted_patient_ids)) {
          srvData.deleted_patient_ids.forEach((id: any) => {
            if (id) delPatients.add(String(id).trim());
          });
          try {
            localStorage.setItem(DELETED_PATIENTS_KEY, JSON.stringify(Array.from(delPatients)));
          } catch {}
        }

        if (Array.isArray(srvData.deleted_assessment_ids)) {
          srvData.deleted_assessment_ids.forEach((id: any) => {
            if (id) delAssessments.add(String(id).trim());
          });
          try {
            localStorage.setItem(DELETED_ASSESSMENTS_KEY, JSON.stringify(Array.from(delAssessments)));
          } catch {}
        }

        if (Array.isArray(srvData.deleted_order_ids)) {
          srvData.deleted_order_ids.forEach((id: any) => {
            if (id) delOrders.add(String(id).trim());
          });
          try {
            localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(delOrders)));
          } catch {}
        }
      }
    } catch {}

    // 3. Merge Patients (STRICTLY filter out any tombstoned / deleted patients)
    const pMap = new Map<string, Patient>();
    inMemoryPatients.forEach(p => p && p.id && !delPatients.has(String(p.id).trim()) && pMap.set(String(p.id).trim(), p));
    dbPatients.forEach(p => p && p.id && !delPatients.has(String(p.id).trim()) && pMap.set(String(p.id).trim(), p));
    srvPatients.forEach(p => p && p.id && !delPatients.has(String(p.id).trim()) && pMap.set(String(p.id).trim(), p));
    inMemoryPatients = Array.from(pMap.values());

    // 4. Merge Assessments (STRICTLY filter out any deleted assessments or assessments belonging to deleted patients)
    const aMap = new Map<string, any>();
    inMemoryAssessments.forEach(a => a && a.id && !delAssessments.has(String(a.id).trim()) && (!a.patient_id || !delPatients.has(String(a.patient_id).trim())) && aMap.set(String(a.id).trim(), a));
    dbAssessments.forEach(a => a && a.id && !delAssessments.has(String(a.id).trim()) && (!a.patient_id || !delPatients.has(String(a.patient_id).trim())) && aMap.set(String(a.id).trim(), a));
    srvAssessments.forEach(a => a && a.id && !delAssessments.has(String(a.id).trim()) && (!a.patient_id || !delPatients.has(String(a.patient_id).trim())) && aMap.set(String(a.id).trim(), a));
    inMemoryAssessments = Array.from(aMap.values());

    // 5. Merge Orders (STRICTLY filter out any deleted orders or orders belonging to deleted patients)
    const oMap = new Map<string, any>();
    inMemoryOrders.forEach(o => o && o.id && !delOrders.has(String(o.id).trim()) && (!o.patient_id || !delPatients.has(String(o.patient_id).trim())) && oMap.set(String(o.id).trim(), o));
    dbOrders.forEach(o => o && o.id && !delOrders.has(String(o.id).trim()) && (!o.patient_id || !delPatients.has(String(o.patient_id).trim())) && oMap.set(String(o.id).trim(), o));
    srvOrders.forEach(o => o && o.id && !delOrders.has(String(o.id).trim()) && (!o.patient_id || !delPatients.has(String(o.patient_id).trim())) && oMap.set(String(o.id).trim(), o));
    inMemoryOrders = Array.from(oMap.values());

    // 6. Write unified clean records back to IndexedDB and LocalStorage safely
    writeToIndexedDB('patients', inMemoryPatients);
    writeToIndexedDB('assessments', inMemoryAssessments);
    writeToIndexedDB('orders', inMemoryOrders);

    safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);
    safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);
    safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);

    // Sync clean state to server
    scheduleServerSync();
  } catch (e) {
    console.warn("LocalDB asynchronous init completed with fallback:", e);
  }
};

// Start initialization
if (typeof window !== 'undefined') {
  initLocalDB();
}

// Export synchronous getters & safe setters
export const getLocalPatients = (): Patient[] => {
  const del = getDeletedPatientIds();
  return inMemoryPatients.filter(p => p && p.id && !del.has(String(p.id).trim()));
};

export const saveLocalPatients = (patients: Patient[]) => {
  const del = getDeletedPatientIds();
  inMemoryPatients = patients.filter(p => p && p.id && !del.has(String(p.id).trim()));
  writeToIndexedDB('patients', inMemoryPatients);
  safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);
  scheduleServerSync();
};

export const markPatientAsDeleted = (id: string) => {
  if (!id) return;
  const targetId = String(id).trim();
  const set = getDeletedPatientIds();
  set.add(targetId);
  try {
    localStorage.setItem(DELETED_PATIENTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}

  inMemoryPatients = inMemoryPatients.filter(p => p && String(p.id).trim() !== targetId);
  writeToIndexedDB('patients', inMemoryPatients);
  safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);

  // Also purge associated assessments & orders
  inMemoryAssessments = inMemoryAssessments.filter(a => a && String(a.patient_id).trim() !== targetId);
  writeToIndexedDB('assessments', inMemoryAssessments);
  safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);

  inMemoryOrders = inMemoryOrders.filter(o => o && String(o.patient_id).trim() !== targetId);
  writeToIndexedDB('orders', inMemoryOrders);
  safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);

  // Immediate server-side delete
  try {
    fetch('/api/delete-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetId })
    }).catch(() => {});
  } catch {}

  scheduleServerSync(true);
};

export const unmarkPatientAsDeleted = (id: string) => {
  if (!id) return;
  const set = getDeletedPatientIds();
  if (set.has(id)) {
    set.delete(id);
    try {
      localStorage.setItem(DELETED_PATIENTS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
};

export const getLocalAssessments = (): any[] => {
  const delA = getDeletedAssessmentIds();
  const delP = getDeletedPatientIds();
  return inMemoryAssessments.filter(a => a && a.id && !delA.has(a.id) && (!a.patient_id || !delP.has(a.patient_id)));
};

export const saveLocalAssessments = (assessments: any[]) => {
  const delA = getDeletedAssessmentIds();
  const delP = getDeletedPatientIds();
  inMemoryAssessments = assessments.filter(a => a && a.id && !delA.has(a.id) && (!a.patient_id || !delP.has(a.patient_id)));
  writeToIndexedDB('assessments', inMemoryAssessments);
  safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);
  scheduleServerSync();
};

export const markAssessmentAsDeleted = (id: string) => {
  if (!id) return;
  const set = getDeletedAssessmentIds();
  set.add(id);
  try {
    localStorage.setItem(DELETED_ASSESSMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}

  inMemoryAssessments = inMemoryAssessments.filter(a => a && a.id !== id);
  writeToIndexedDB('assessments', inMemoryAssessments);
  safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);

  try {
    fetch('/api/delete-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});
  } catch {}

  scheduleServerSync(true);
};

export const unmarkAssessmentAsDeleted = (id: string) => {
  if (!id) return;
  const set = getDeletedAssessmentIds();
  if (set.has(id)) {
    set.delete(id);
    try {
      localStorage.setItem(DELETED_ASSESSMENTS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
};

export const getLocalOrders = (): any[] => {
  const delO = getDeletedOrderIds();
  const delP = getDeletedPatientIds();
  return inMemoryOrders.filter(o => o && o.id && !delO.has(o.id) && (!o.patient_id || !delP.has(o.patient_id)));
};

export const saveLocalOrders = (orders: any[]) => {
  const delO = getDeletedOrderIds();
  const delP = getDeletedPatientIds();
  inMemoryOrders = orders.filter(o => o && o.id && !delO.has(o.id) && (!o.patient_id || !delP.has(o.patient_id)));
  writeToIndexedDB('orders', inMemoryOrders);
  safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);
  scheduleServerSync();
};

export const markOrderAsDeleted = (id: string) => {
  if (!id) return;
  const set = getDeletedOrderIds();
  set.add(id);
  try {
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(set)));
  } catch {}

  inMemoryOrders = inMemoryOrders.filter(o => o && o.id !== id);
  writeToIndexedDB('orders', inMemoryOrders);
  safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);

  try {
    fetch('/api/delete-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});
  } catch {}

  scheduleServerSync(true);
};

export const clearAllLocalData = () => {
  inMemoryPatients = [];
  inMemoryAssessments = [];
  inMemoryOrders = [];

  try {
    localStorage.setItem(INITIALIZED_KEY, 'cleared');
    safeSetLocalStorage(STORAGE_KEY, []);
    safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, []);
    safeSetLocalStorage(ORDERS_STORAGE_KEY, []);
  } catch {}

  writeToIndexedDB('patients', []);
  writeToIndexedDB('assessments', []);
  writeToIndexedDB('orders', []);

  scheduleServerSync(true);
};

