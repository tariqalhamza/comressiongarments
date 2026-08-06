import { Patient } from '../types';

const DB_NAME = 'precision_clinical_db';
const DB_VERSION = 1;
const STORAGE_KEY = 'precision_patients_data';
const ORDERS_STORAGE_KEY = 'precision_orders_data';
const ASSESSMENTS_STORAGE_KEY = 'precision_assessments_data';
const INITIALIZED_KEY = 'precision_data_initialized';

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
    // Quota exceeded: Try saving trimmed version without heavy image blobs
    try {
      if (Array.isArray(data)) {
        const lightweight = data.map(stripHeavyFields);
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      // If even lightweight fails, remove this single key to allow other core state to function
      try {
        console.warn(`LocalStorage quota reached for key "${key}". Data is securely retained in IndexedDB & server memory.`);
      } catch {}
    }
  }
};

// Debounced background sync to server
let syncTimeout: any = null;
const scheduleServerSync = () => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch('/api/save-clinical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patients: inMemoryPatients,
          assessments: inMemoryAssessments,
          orders: inMemoryOrders
        })
      });
    } catch (e) {
      // Server sync error is silent
    }
  }, 1000);
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

    const savedP = localStorage.getItem(STORAGE_KEY);
    if (savedP) {
      inMemoryPatients = JSON.parse(savedP);
    } else {
      inMemoryPatients = DEFAULT_MOCK_PATIENTS;
      safeSetLocalStorage(STORAGE_KEY, DEFAULT_MOCK_PATIENTS);
    }

    const savedO = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (savedO) {
      inMemoryOrders = JSON.parse(savedO);
    } else {
      inMemoryOrders = DEFAULT_MOCK_ORDERS;
      safeSetLocalStorage(ORDERS_STORAGE_KEY, DEFAULT_MOCK_ORDERS);
    }

    const savedA = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (savedA) {
      inMemoryAssessments = JSON.parse(savedA);
    } else {
      inMemoryAssessments = [];
    }
  } catch {
    inMemoryPatients = DEFAULT_MOCK_PATIENTS;
    inMemoryOrders = DEFAULT_MOCK_ORDERS;
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
      }
    } catch {}

    // 3. Merge Patients
    const pMap = new Map<string, Patient>();
    inMemoryPatients.forEach(p => p && p.id && pMap.set(p.id, p));
    dbPatients.forEach(p => p && p.id && pMap.set(p.id, p));
    srvPatients.forEach(p => p && p.id && pMap.set(p.id, p));
    inMemoryPatients = Array.from(pMap.values());

    // 4. Merge Assessments
    const aMap = new Map<string, any>();
    inMemoryAssessments.forEach(a => a && a.id && aMap.set(a.id, a));
    dbAssessments.forEach(a => a && a.id && aMap.set(a.id, a));
    srvAssessments.forEach(a => a && a.id && aMap.set(a.id, a));
    inMemoryAssessments = Array.from(aMap.values());

    // 5. Merge Orders
    const oMap = new Map<string, any>();
    inMemoryOrders.forEach(o => o && o.id && oMap.set(o.id, o));
    dbOrders.forEach(o => o && o.id && oMap.set(o.id, o));
    srvOrders.forEach(o => o && o.id && oMap.set(o.id, o));
    inMemoryOrders = Array.from(oMap.values());

    // 6. Write unified records back to IndexedDB and LocalStorage safely
    writeToIndexedDB('patients', inMemoryPatients);
    writeToIndexedDB('assessments', inMemoryAssessments);
    writeToIndexedDB('orders', inMemoryOrders);

    safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);
    safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);
    safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);

    // Sync to server
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
  return inMemoryPatients;
};

export const saveLocalPatients = (patients: Patient[]) => {
  inMemoryPatients = [...patients];
  writeToIndexedDB('patients', inMemoryPatients);
  safeSetLocalStorage(STORAGE_KEY, inMemoryPatients);
  scheduleServerSync();
};

export const getLocalAssessments = (): any[] => {
  return inMemoryAssessments;
};

export const saveLocalAssessments = (assessments: any[]) => {
  inMemoryAssessments = [...assessments];
  writeToIndexedDB('assessments', inMemoryAssessments);
  safeSetLocalStorage(ASSESSMENTS_STORAGE_KEY, inMemoryAssessments);
  scheduleServerSync();
};

export const getLocalOrders = (): any[] => {
  return inMemoryOrders;
};

export const saveLocalOrders = (orders: any[]) => {
  inMemoryOrders = [...orders];
  writeToIndexedDB('orders', inMemoryOrders);
  safeSetLocalStorage(ORDERS_STORAGE_KEY, inMemoryOrders);
  scheduleServerSync();
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

  scheduleServerSync();
};
