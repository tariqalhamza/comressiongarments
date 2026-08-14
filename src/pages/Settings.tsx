import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  MapPin, 
  Globe, 
  Shield, 
  Bell, 
  Moon,
  Check,
  Building2,
  Mail,
  Phone,
  Database,
  Trash2,
  AlertTriangle,
  Info,
  Users,
  UserPlus,
  ShieldAlert,
  Cloud,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Server
} from 'lucide-react';
import { cn } from '../lib/utils';
import { isDemo, clearDemoData, supabase, supabaseUrl, supabaseAnonKey, promiseWithTimeout, saveClinicalProfilesToServer, syncClinicalProfilesFromServer, testSupabaseConnection, syncAllLocalPatientsToSupabase } from '../services/supabase';
import { useAuthStore } from '../services/authStore';
import { createClient } from '@supabase/supabase-js';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbCleared, setDbCleared] = useState(false);

  // Administrator Status checking
  const { profile: loggedInProfile, user: loggedInUser } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com'].includes(loggedInUser?.email?.toLowerCase().trim() || '');
  const isAdmin = loggedInProfile?.role === 'admin' || isSuperEmail;

  // User list and creation states
  const [profilesList, setProfilesList] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'therapist' | 'technician'>('therapist');

  const sanitizeProfileItem = (p: any) => {
    if (!p || typeof p !== 'object') return p;
    let email = (p.email || '').trim().toLowerCase();
    const { password, ...cleanProfile } = p;

    return {
      ...cleanProfile,
      email
    };
  };

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      // 1. Synchronize latest clinical profiles from backend
      const serverProfiles = await syncClinicalProfilesFromServer();

      let finalProfiles: any[] = [];

      if (isDemo) {
        finalProfiles = serverProfiles;
      } else {
        try {
          // Direct query to Supabase public.profiles (the canonical source of truth)
          const { data: dbData, error } = await promiseWithTimeout(
            supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false }),
            4500
          );
          if (error) throw error;
          
          const rows = dbData || [];
          const profileMap = new Map<string, any>();

          // First populate from serverProfiles (which contains auth users and email metadata)
          serverProfiles.forEach((sp: any) => {
            if (sp && sp.id) {
              profileMap.set(sp.id, sanitizeProfileItem(sp));
            }
          });

          // Match/merge DB records strictly by UUID (auth.users.id)
          rows.forEach((dbUser: any) => {
            if (dbUser && dbUser.id) {
              const sanitizedDb = sanitizeProfileItem(dbUser);
              const existing = profileMap.get(sanitizedDb.id) || {};

              profileMap.set(sanitizedDb.id, sanitizeProfileItem({
                ...existing,
                ...sanitizedDb,
                id: sanitizedDb.id,
                full_name: sanitizedDb.full_name || existing.full_name || 'Clinical User',
                role: sanitizedDb.role || existing.role || 'therapist',
                email: sanitizedDb.email || existing.email || ''
              }));
            }
          });

          finalProfiles = Array.from(profileMap.values());
        } catch (dbErr: any) {
          console.warn('Supabase profile retrieval timed out or failed. Sourcing from server-synced storage:', dbErr);
          finalProfiles = serverProfiles;
        }
      }

      // Deduplicate strictly by unique Account ID (UUID)
      const uniqueMap = new Map<string, any>();
      finalProfiles.forEach((p: any) => {
        if (p && p.id) {
          uniqueMap.set(p.id, sanitizeProfileItem(p));
        }
      });
      const uniqueProfiles = Array.from(uniqueMap.values());

      setProfilesList(uniqueProfiles);

      // Persist the clean, non-duplicate list to localStorage
      localStorage.setItem('demo_profiles', JSON.stringify(uniqueProfiles));
    } catch (err: any) {
      console.error('Error fetching clinical profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email?: string; role?: string } | null>(null);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [tempPasswordValue, setTempPasswordValue] = useState('');
  const [editingEmailUserId, setEditingEmailUserId] = useState<string | null>(null);
  const [tempEmailValue, setTempEmailValue] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | 'legacy'>('all');

  const getOrGenerateUserEmail = (usr: any) => {
    let email = (usr?.email || '').trim();
    if (email) {
      return email;
    }
    const fullNameLower = (usr?.full_name || '').toLowerCase().trim();
    if (usr?.role === 'admin' || fullNameLower.includes('mahmood') || fullNameLower.includes('mehmood')) {
      return 'mehmood@gmail.com';
    }
    
    const namePart = (usr?.full_name || 'user').trim().split(' ').pop() || 'user';
    const cleanName = namePart.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackEmail = `${cleanName || 'user'}@gmail.com`;
    return fallbackEmail;
  };

  const handleUpdateUserEmail = (userId: string, newEmail: string) => {
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) return;
    
    // 1. Update list UI state inline
    setProfilesList(prev => prev.map(p => {
      if (p.id === userId) {
        return { ...p, email: trimmedEmail };
      }
      return p;
    }));
    
    // 2. Sync to localStorage demo_profiles
    const stored = localStorage.getItem('demo_profiles');
    if (stored) {
      try {
        const currentProfiles = JSON.parse(stored);
        const updated = currentProfiles.map((p: any) => {
          if (p.id === userId) {
            return { ...p, email: trimmedEmail };
          }
          return p;
        });
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
        
        // Push updated profiles list to the server for multi-device sync
        saveClinicalProfilesToServer(updated).catch(e => console.error("Server profiles sync error on email update:", e));
      } catch (e) {
        console.error("Error updating user storage email:", e);
      }
    }

    // 3. Persist email update to Supabase database if connected live
    if (!isDemo) {
      supabase
        .from('profiles')
        .update({ email: trimmedEmail })
        .eq('id', userId)
        .then(
          ({ error }) => {
            if (error) {
              console.warn("Failed to persist email update in Supabase database:", error);
            } else {
              console.log("Successfully persisted updated email in Supabase database for user:", userId);
            }
          },
          (dbErr) => {
            console.warn("Error updating email in database:", dbErr);
          }
        );
    }
    
    setEditingEmailUserId(null);
  };

  const handleUpdateUserPassword = async (userId: string, newPassword: string) => {
    const passwordClean = newPassword.trim();
    if (!passwordClean) return;

    if (passwordClean.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const targetUser = profilesList.find(p => p.id === userId);
    const userEmail = targetUser?.email || getOrGenerateUserEmail(targetUser);
    
    // Call server-side Admin endpoint to update real Supabase Auth password via Admin API
    try {
      const resp = await fetch('/api/admin/update-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          password: passwordClean
        })
      });
      const data = await resp.json().catch(() => ({}));
      
      if (!resp.ok || !data.success) {
        const errorMsg = data.error || "Service Role Key is missing on the server. Unable to update password in Supabase Auth.";
        alert(`Failed to update password: ${errorMsg}`);
        return;
      }

      // If the logged in user is updating their own account password, sync auth session directly
      try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        if (currentUser && currentUser.id === userId) {
          await supabase.auth.updateUser({ password: passwordClean });
        }
      } catch (selfAuthErr) {
        console.warn("Self auth password sync notice:", selfAuthErr);
      }

      setEditingPasswordUserId(null);
      setTempPasswordValue('');
      alert("Password successfully updated in Supabase Auth.");
    } catch (e: any) {
      alert(`Server connection error: ${e?.message || "Failed to update password"}`);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'therapist' | 'technician') => {
    setUpdatingUserRole(userId);
    try {
      if (isDemo) {
        const stored = localStorage.getItem('demo_profiles');
        let currentProfiles = stored ? JSON.parse(stored) : [];
        const updated = currentProfiles.map((p: any) => {
          if (p.id === userId) {
            return { ...p, role: newRole };
          }
          return p;
        });
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
        setProfilesList(updated);
      } else {
        try {
          const { error } = await promiseWithTimeout(
            supabase
              .from('profiles')
              .update({ role: newRole })
              .eq('id', userId),
            4500
          );
          if (error) throw error;
          await loadProfiles();
        } catch (dbErr: any) {
          // Local update fallback if database represents a connection drop
          console.warn('Failed to update role in Supabase. Updating local fallback state:', dbErr);
          const stored = localStorage.getItem('demo_profiles');
          let currentProfiles = stored ? JSON.parse(stored) : [];
          const updated = currentProfiles.map((p: any) => {
            if (p.id === userId) return { ...p, role: newRole };
            return p;
          });
          localStorage.setItem('demo_profiles', JSON.stringify(updated));
          setProfilesList(updated);
        }
      }
    } catch (err: any) {
      alert("Error updating role: " + err.message);
    } finally {
      setUpdatingUserRole(null);
    }
  };

  const handleDeleteUserAccount = (userId: string, fullName: string) => {
    if (userId === loggedInProfile?.id || userId === '9905a6da-912f-4cf0-8dfc-cc108d224ed8' || userId === 'demo-user-123') {
      alert("You cannot delete the primary administrator account.");
      return;
    }
    const targetUser = profilesList.find(p => p.id === userId);
    if (targetUser && (targetUser.role === 'admin' || targetUser.email === 'mehmood@gmail.com' || targetUser.email === 'detox16277@gmail.com')) {
      alert("You cannot delete the primary administrator account.");
      return;
    }
    setDeleteError(null);
    setUserToDelete({
      id: userId,
      name: targetUser?.full_name || fullName,
      email: targetUser?.email || getOrGenerateUserEmail(targetUser),
      role: targetUser?.role || 'therapist'
    });
  };

  const executeDeleteUserAccount = async () => {
    if (!userToDelete) return;
    const { id: userId, email: userEmail } = userToDelete;

    setDeletingUserId(userId);
    setDeleteError(null);

    try {
      const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const adminToken = sessionRes.data.session?.access_token || '';

      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail,
          supabaseUrl,
          supabaseAnonKey,
          adminToken
        })
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || resData.error || resData.success !== true) {
        const errorMsg = resData.error || "Failed to delete user account on server.";
        setDeleteError(errorMsg);
        return;
      }

      // ONLY ON SUCCESS: Remove from localStorage demo_profiles
      const stored = localStorage.getItem('demo_profiles');
      if (stored) {
        try {
          const currentProfiles = JSON.parse(stored);
          const updatedProfilesList = currentProfiles.filter((p: any) => p && p.id !== userId);
          localStorage.setItem('demo_profiles', JSON.stringify(updatedProfilesList));
        } catch (e) {
          console.error("Local profile removal error:", e);
        }
      }

      // ONLY ON SUCCESS: Remove from UI list immediately strictly by UUID
      setProfilesList(prev => prev.filter((p: any) => p && p.id !== userId));

      // Close delete modal and clear errors
      setUserToDelete(null);
      setDeleteError(null);

      // Refresh to guarantee clean state across DB/Auth
      await loadProfiles();
    } catch (err: any) {
      console.error("Error in delete account pipeline:", err);
      setDeleteError(err.message || "An unexpected error occurred during account deletion.");
    } finally {
      setDeletingUserId(null);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadProfiles();
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateError(null);
    setCreateSuccess(null);

    const emailTrim = newUserEmail.trim().toLowerCase();
    const passwordTrim = newUserPassword.trim();
    const nameTrim = newUserFullName.trim();

    if (!emailTrim || !passwordTrim || !nameTrim) {
      setCreateError('Please fill in all fields (Full Name, Email, and Password).');
      setCreatingUser(false);
      return;
    }

    if (passwordTrim.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      setCreatingUser(false);
      return;
    }

    try {
      let createdUserObj: any = null;
      let isVerified = false;
      let serverResData: any = null;

      // Extract current active session token if available
      let adminToken = '';
      try {
        const sessionRes = await supabase.auth.getSession();
        adminToken = sessionRes.data.session?.access_token || '';
      } catch {}

      // 1. Try server-side Admin API to create Supabase Auth user & public.profiles
      try {
        const resp = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailTrim,
            password: passwordTrim,
            full_name: nameTrim,
            role: newUserRole,
            supabaseUrl: supabaseUrl,
            supabaseAnonKey: supabaseAnonKey,
            adminToken: adminToken,
            isDemo: isDemo
          })
        });

        const resData = await resp.json().catch(() => ({}));
        serverResData = resData;

        if (!resp.ok) {
          throw new Error(resData.error || `Server error (${resp.status}): Failed to create user`);
        }

        if (resData && resData.success && resData.user) {
          if (!resData.verified && !isDemo) {
            throw new Error(resData.error || 'User account was created, but public.profiles creation could not be verified.');
          }
          createdUserObj = resData.user;
          isVerified = true;
        }
      } catch (apiErr: any) {
        console.warn("Server admin create user endpoint notice:", apiErr);
        // If it was a deliberate error response from the server (e.g. auth error or profile verification error), rethrow it!
        if (apiErr.message && !apiErr.message.includes('Failed to fetch') && !apiErr.message.includes('NetworkError')) {
          throw apiErr;
        }
      }

      // 2. Client-side fallback ONLY if server API was completely unreachable (e.g. network offline)
      if (!createdUserObj) {
        if (!isDemo && supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
          let realUserId: string | null = null;
          try {
            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
              }
            });

            const { data: signUpData, error: signUpError } = await promiseWithTimeout(
              tempClient.auth.signUp({
                email: emailTrim,
                password: passwordTrim,
                options: {
                  data: { 
                    full_name: nameTrim,
                    name: nameTrim,
                    role: newUserRole
                  }
                }
              }),
              8000
            );

            if (signUpError) {
              throw new Error(`Supabase Auth creation failed: ${signUpError.message}`);
            }

            if (signUpData?.user?.id) {
              realUserId = signUpData.user.id;
            } else {
              throw new Error('Supabase Auth did not return a valid user ID.');
            }
          } catch (authErr: any) {
            throw new Error(authErr.message || 'Supabase Auth registration failed.');
          }

          // Insert into Supabase public.profiles
          let profileInsertErr: any = null;
          try {
            const { error: upsertErr } = await promiseWithTimeout(
              supabase.from('profiles').upsert({
                id: realUserId,
                full_name: nameTrim,
                role: newUserRole,
                clinic_id: null
              }, { onConflict: 'id' }),
              6000
            );
            if (upsertErr) profileInsertErr = upsertErr;
          } catch (profErr: any) {
            profileInsertErr = profErr;
          }

          // VERIFY row in public.profiles
          let verifiedRow: any = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            let { data: found } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', realUserId)
              .maybeSingle();

            if (!found) {
              const uuidQuery = await supabase
                .from('profiles')
                .select('*')
                .eq('uuid', realUserId)
                .maybeSingle();
              if (uuidQuery.data) found = uuidQuery.data;
            }

            if (found && (found.id === realUserId || found.uuid === realUserId)) {
              verifiedRow = found;
              break;
            }
            if (attempt < 3) await new Promise(r => setTimeout(r, 400));
          }

          if (!verifiedRow) {
            throw new Error(`User account was created in Supabase Auth (UUID: ${realUserId}), but profile creation in public.profiles failed or could not be verified. Supabase error: ${profileInsertErr?.message || 'Profile record not found in public.profiles table'}`);
          }

          const { password: _p, ...cleanVerifiedRow } = verifiedRow;
          createdUserObj = {
            id: realUserId,
            full_name: nameTrim,
            role: newUserRole,
            email: emailTrim,
            ...cleanVerifiedRow,
            created_at: verifiedRow.created_at || new Date().toISOString()
          };
          isVerified = true;
        } else {
          // Demo mode fallback ID
          const demoUserId = 'demo-user-' + Math.random().toString(36).substring(2, 11);
          createdUserObj = {
            id: demoUserId,
            full_name: nameTrim,
            role: newUserRole,
            email: emailTrim,
            created_at: new Date().toISOString()
          };
          isVerified = true;
        }
      }

      if (!createdUserObj || !isVerified) {
        throw new Error('User creation could not be verified in public.profiles.');
      }

      // 3. Update localStorage and local state
      const stored = localStorage.getItem('demo_profiles') || '[]';
      let currentProfiles = JSON.parse(stored);
      if (!Array.isArray(currentProfiles)) currentProfiles = [];
      const filtered = currentProfiles.filter((p: any) => p && p.id !== createdUserObj.id && (p.email || '').toLowerCase().trim() !== emailTrim);
      const updated = [createdUserObj, ...filtered];
      localStorage.setItem('demo_profiles', JSON.stringify(updated));
      setProfilesList(updated);

      // Push updated profiles to server
      saveClinicalProfilesToServer(updated).catch(e => console.warn("Profiles server sync error:", e));

      const successMsg = serverResData?.message || (createdUserObj.id 
        ? `User "${nameTrim}" (${emailTrim}) successfully verified in Supabase Auth & public.profiles! (ID: ${createdUserObj.id})`
        : `User "${nameTrim}" successfully registered!`);
      setCreateSuccess(successMsg);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('therapist');
      
      // Reload profiles from database/server
      await loadProfiles();
    } catch (err: any) {
      console.error("User creation error:", err);
      setCreateError(err.message || "Failed to create user account.");
    } finally {
      setCreatingUser(false);
    }
  };

  // Supabase Custom Config State
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Live Patient Sync States
  const [isSyncingAllPatients, setIsSyncingAllPatients] = useState(false);
  const [syncPatientsReport, setSyncPatientsReport] = useState<any>(null);
  const [liveSupabasePatients, setLiveSupabasePatients] = useState<any[]>([]);
  const [loadingLivePatients, setLoadingLivePatients] = useState(false);

  const handleTestConnection = async () => {
    setTestingDb(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Connection test encountered an error',
        steps: []
      });
    } finally {
      setTestingDb(false);
    }
  };

  const handleSyncAllPatientsNow = async () => {
    setIsSyncingAllPatients(true);
    setSyncPatientsReport(null);
    try {
      const report = await syncAllLocalPatientsToSupabase();
      setSyncPatientsReport(report);
      // Also refresh live table viewer
      await handleFetchLivePatients();
    } catch (e: any) {
      setSyncPatientsReport({
        total: 0,
        synced: 0,
        failed: 1,
        errors: [e.message || String(e)],
        patients: []
      });
    } finally {
      setIsSyncingAllPatients(false);
    }
  };

  const handleFetchLivePatients = async () => {
    if (isDemo) return;
    setLoadingLivePatients(true);
    try {
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        setLiveSupabasePatients(data);
      }
    } catch (e) {
      console.warn("Failed to query live Supabase patients table:", e);
    } finally {
      setLoadingLivePatients(false);
    }
  };

  const sqlQuickCode = `-- OVERPLAST LIVE DATABASE SCHEMA & RLS SETUP
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  doctor_name TEXT,
  hospital TEXT,
  diagnosis TEXT,
  medical_condition TEXT,
  height NUMERIC,
  weight NUMERIC,
  email TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  created_by_email TEXT,
  created_by_name TEXT,
  therapist_id TEXT,
  clinic_id TEXT
);
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- If table already exists, ensure all columns and RLS are open:
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS therapist_id TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_condition TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  garment_type TEXT,
  measurements JSONB,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  created_by_email TEXT,
  created_by_name TEXT
);
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  phone TEXT,
  gender TEXT,
  age INTEGER,
  garment_type TEXT,
  silicone_pasting TEXT,
  compression TEXT,
  measurements JSONB,
  sub_options JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  created_by_email TEXT,
  created_by_name TEXT,
  assessor_name TEXT,
  therapist_id TEXT
);
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'therapist',
  password TEXT,
  phone TEXT,
  license_number TEXT,
  specialty TEXT,
  department TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'therapist';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Automatic Trigger for New User Profile Creation in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
  user_email TEXT;
  user_role_input TEXT;
BEGIN
  user_email := LOWER(TRIM(COALESCE(NEW.email, '')));

  IF user_email IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    user_role_input := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
    IF user_role_input = 'admin' THEN
      assigned_role := 'therapist';
    ELSIF user_role_input IN ('therapist', 'technician', 'user') THEN
      assigned_role := user_role_input;
    ELSE
      assigned_role := 'therapist';
    END IF;
  END IF;

  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_full_name, assigned_role, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    role = CASE WHEN public.profiles.role IS NULL OR public.profiles.role = '' THEN EXCLUDED.role ELSE public.profiles.role END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Safe backfill for existing auth users missing profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') AS full_name,
  CASE 
    WHEN LOWER(TRIM(COALESCE(u.email, ''))) IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN 'admin'
    WHEN (u.raw_user_meta_data->>'role') IN ('therapist', 'technician', 'user') THEN (u.raw_user_meta_data->>'role')
    ELSE 'therapist'
  END AS role,
  COALESCE(u.created_at, NOW()) AS created_at,
  NOW() AS updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- RLS Policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles" ON public.profiles FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow individual update own profile" ON public.profiles;
CREATE POLICY "Allow individual update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Allow individual insert own profile" ON public.profiles;
CREATE POLICY "Allow individual insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlQuickCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleClearData = () => {
    clearDemoData();
    window.location.reload();
  };

  const handleSaveDb = async () => {
    setIsSavingDb(true);
    try {
      const url = supabaseUrlInput.trim();
      const key = supabaseAnonKeyInput.trim();
      
      if (url) {
        localStorage.setItem('VITE_SUPABASE_URL', url);
      } else {
        localStorage.removeItem('VITE_SUPABASE_URL');
      }
      
      if (key) {
        localStorage.setItem('VITE_SUPABASE_ANON_KEY', key);
      } else {
        localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
      }
      
      // Clear manual forced demo
      localStorage.removeItem('supabase_force_demo');
      
      // Save on server for cross-device synchronization
      try {
        await fetch('/api/save-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url, key })
        });
      } catch (srvErr) {
        console.warn("Failed to save credentials on the backend server, but stored in local browser.", srvErr);
      }
      
      setTimeout(() => {
        setIsSavingDb(false);
        try {
          alert("Supabase Live database credentials save ho chuki hain aur baqi tamom devices ke sath sync ho gai hain! Ab page reload hoga.");
        } catch (alertError) {
          console.warn("Standard alert was blocked by the browser sandbox.", alertError);
        }
        window.location.reload();
      }, 700);
    } catch (e) {
      console.error(e);
      setIsSavingDb(false);
      try {
        alert("Error saving credentials.");
      } catch (err) {
        console.warn("Alert blocked:", err);
      }
    }
  };

  // Administrator Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Mahmood Ahmed',
    email: 'mehmood@medical-clinic.com',
    phone: '300 1234567',
    license: 'ML-772211-M',
    specialty: 'System Administration',
    department: 'Hospital Management Wing',
    bio: 'Lead System Administrator with expertise in clinical operations and medical record security.',
    language: 'English (US)'
  });

  // Dynamic initialization of profile based on active session using robust multikey hierarchy
  React.useEffect(() => {
    if (loggedInProfile) {
      const email = useAuthStore.getState().user?.email || loggedInProfile.email || '';
      const uid = loggedInProfile.id || 'demo';
      
      // Load custom profile fields for fallback safety
      let savedCustom: any = {};
      const keys = [
        'profile_custom_fields_global',
        email ? `profile_custom_fields_${email.toLowerCase().trim()}` : '',
        uid ? `profile_custom_fields_${uid}` : ''
      ].filter(Boolean);
      
      for (const k of keys) {
        try {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === 'object') {
              savedCustom = { ...savedCustom, ...parsed };
            }
          }
        } catch (e) {
          console.error("Error reading custom profile fields:", e);
        }
      }

      let resolvedName = savedCustom.name || loggedInProfile.full_name || 'Mahmood Ahmed';
      const nameLower = (resolvedName || '').toLowerCase();
      if (!resolvedName || nameLower.includes('dr. mahmood') || nameLower.includes('dr. mehmood') || nameLower.includes('dr mahmood') || nameLower.includes('dr mehmood') || nameLower === 'mahmood' || nameLower === 'mehmood' || nameLower === 'mahmood admin' || nameLower === 'mehmood admin' || nameLower === 'clinic staff') {
        resolvedName = 'Mahmood Ahmed';
      }

      setAdminProfile(prev => ({
        ...prev,
        name: resolvedName,
        email: savedCustom.email || email || prev.email,
        phone: savedCustom.phone || loggedInProfile.phone || prev.phone || '300 1234567',
        license: savedCustom.license || loggedInProfile.license_number || prev.license || 'ML-772211-M',
        specialty: savedCustom.specialty || loggedInProfile.specialty || prev.specialty || 'Clinical Management',
        department: savedCustom.department || loggedInProfile.department || prev.department || 'Hospital Core Rehabilitation Unit',
        bio: savedCustom.bio || loggedInProfile.bio || prev.bio || 'Clinical expert on rehabilitations.',
        language: savedCustom.language || prev.language || 'English (US)'
      }));
    }
  }, [loggedInProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const userId = loggedInProfile?.id || 'demo';
      const userEmail = adminProfile.email || loggedInProfile?.email || useAuthStore.getState().user?.email || 'demo@overplast.com';
      
      const updatedCustom = {
        name: adminProfile.name,
        email: userEmail,
        phone: adminProfile.phone,
        specialty: adminProfile.specialty,
        bio: adminProfile.bio,
        language: adminProfile.language
      };
      
      // 1. Immediately write to Local Storage as the primary backup copy across all custom metadata keys
      const storageKeys = [
        `profile_custom_fields_${userId}`,
        `profile_custom_fields_${userEmail.toLowerCase().trim()}`,
        'profile_custom_fields_global'
      ];
      
      storageKeys.forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(updatedCustom));
        } catch (storageErr) {
          console.warn("Storage write failure for key:", key, storageErr);
        }
      });

      // 2. Synchronously update local authStore session state so the UI updates immediately and stays updated
      const currentSessionState = useAuthStore.getState();
      const nextProfileState = {
        ...(currentSessionState.profile || {}),
        id: userId,
        full_name: adminProfile.name,
        email: userEmail,
        ...updatedCustom
      };
      currentSessionState.setUser(currentSessionState.user, nextProfileState);

      // 3. Always write cache to demo_user_logged_in so that page refresh restores the state instantly
      const storedDemo = localStorage.getItem('demo_user_logged_in');
      if (storedDemo) {
        try {
          const parsed = JSON.parse(storedDemo);
          parsed.profile = nextProfileState;
          localStorage.setItem('demo_user_logged_in', JSON.stringify(parsed));
        } catch (e) {
          console.warn("Failed to write updated profile to fast cache:", e);
        }
      }

      // 4. Always sync in demo_profiles list to remain consistent everywhere
      const storedProfiles = localStorage.getItem('demo_profiles');
      if (storedProfiles) {
        try {
          const currentList = JSON.parse(storedProfiles);
          const newList = currentList.map((p: any) => {
            if (p.id === userId || p.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
              return {
                ...p,
                full_name: adminProfile.name,
                email: userEmail,
                phone: adminProfile.phone,
                specialty: adminProfile.specialty,
                bio: adminProfile.bio,
                language: adminProfile.language
              };
            }
            return p;
          });
          localStorage.setItem('demo_profiles', JSON.stringify(newList));
        } catch (e) {
          console.error("Failed to sync in demo_profiles:", e);
        }
      }

      if (!isDemo && loggedInProfile?.id) {
        // Live Mode: Perform background DB update without blocking the user (wrapped with 4-second timeout)
        try {
          const { error } = await promiseWithTimeout(
            supabase
              .from('profiles')
              .update({
                full_name: adminProfile.name,
              })
              .eq('id', loggedInProfile.id),
            4000
          );
          
          if (error) {
            console.warn("Supabase database rejected profile update (possibly missing update RLS policies). Local storage fallback holds values successfully.", error);
          }
        } catch (dbErr) {
          console.warn("Supabase connection issue or timeout during profile update. Saving in local offline storage fallback.", dbErr);
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error during profile save process:", err);
      try {
        alert("Error saving profile details: " + err.message);
      } catch (alertErr) {
        console.warn("Blocked notification popup:", alertErr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDemoData = () => {
    let shouldClear = false;
    try {
      shouldClear = window.confirm("Kya aap waqai saara local data aur default patients ko delete karna chahte hain? Is se purane test records bilkul saaf ho jayenge.");
    } catch (confirmError) {
      console.warn("Direct confirmation popup blocked, executing automatically", confirmError);
      shouldClear = true; // Fallback to executing to prevent locking the action
    }

    if (shouldClear) {
      const success = clearDemoData();
      if (success) {
        setDbCleared(true);
        try {
          alert("Demo cache successfully clear ho chuki hai! Tablhein saaf kar di gayi hain. Please page ko refresh karein.");
        } catch (alertError) {
          console.warn("Notification alert blocked.", alertError);
        }
        window.location.reload();
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Personal Profile', icon: User },
    ...(isAdmin ? [{ id: 'users', label: 'Manage Accounts', icon: Users }] : []),
  ];

  return (
    <div className="p-8 pb-32 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Sidebar */}
        <aside className="w-full md:w-64 space-y-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="medical-card p-8">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Administrator Profile</h3>
                {showSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-2">
                    <Check className="w-4 h-4" />
                    Changes Saved
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl relative group cursor-pointer overflow-hidden">
                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black">
                      {adminProfile.name.charAt(0)}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest underline">Change</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{adminProfile.name}</h4>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1 underline">Authorized Administrator</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                    <input 
                      value={adminProfile.name}
                      onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
                    <input 
                      value={adminProfile.email}
                      onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="flex gap-2">
                      <div className="w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-400">+92</div>
                      <input 
                        value={adminProfile.phone}
                        onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                        className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                    <input 
                      value={adminProfile.specialty}
                      onChange={(e) => setAdminProfile({...adminProfile, specialty: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Biography</label>
                    <textarea 
                      value={adminProfile.bio}
                      onChange={(e) => setAdminProfile({...adminProfile, bio: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none h-32 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Language Display</label>
                    <select 
                      value={adminProfile.language}
                      onChange={(e) => setAdminProfile({...adminProfile, language: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      <option>English (US)</option>
                      <option>Urdu (Pakistan)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administrator Joined</label>
                    <div className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-500">
                      January 12, 2024
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSaving ? 'Processing...' : 'Save Admin Profile'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6 animate-in fade-in duration-350">
              <div className="medical-card p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-slate-900 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Clinical Staff & User Accounts</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Register and manage staff access credentials</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Register New Account Form */}
                  <div className="w-full lg:w-[45%] space-y-6">
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                      <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs font-black text-slate-800 tracking-widest uppercase">
                          Register New User Account
                        </h4>
                      </div>

                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Full Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Dr. Sarah Khan"
                            value={newUserFullName}
                            onChange={(e) => setNewUserFullName(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Professional Email</label>
                          <input 
                            type="email"
                            required
                            placeholder="e.g. sarah@gmail.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Secure Password</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g., password123 (Min 6 characters)"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">User Role / System Access Privilege</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as any)}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                          >
                            <option value="therapist">Licensed Therapist (user)</option>
                            <option value="technician">Clinical Technician (user)</option>
                          </select>
                        </div>

                        {createError && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600">
                            {createError}
                          </div>
                        )}

                        {createSuccess && (
                          <div className="p-4 bg-emerald-55 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] font-bold text-emerald-700">
                            {createSuccess}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={creatingUser}
                          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 group transition-all"
                        >
                          {creatingUser ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          {creatingUser ? 'Registering...' : 'Create Account'}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Registered Profiles List container */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Registered Clinical Accounts ({profilesList.length})
                      </span>
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDomainFilter('all')}
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all ${
                            domainFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          All Accounts ({profilesList.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDomainFilter('legacy')}
                          className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-all ${
                            domainFilter === 'legacy'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-amber-700 hover:text-amber-900'
                          }`}
                        >
                          Safe Delete Review (@overplast.com) (
                          {
                            profilesList.filter((u: any) =>
                              (u.email || getOrGenerateUserEmail(u)).toLowerCase().trim().endsWith('@overplast.com')
                            ).length
                          }
                          )
                        </button>
                      </div>
                      <button 
                        onClick={loadProfiles} 
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Force Refresh
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm max-h-[500px] overflow-y-auto">
                      {loadingProfiles ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                          <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                          <p className="text-xs font-bold uppercase tracking-widest mt-2 text-slate-400">Loading clinicians index...</p>
                        </div>
                      ) : profilesList.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-xs font-bold">
                          No registered user records found in this database.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 text-left">
                          {profilesList
                            .filter((usr: any) => {
                              if (domainFilter === 'legacy') {
                                const email = (usr.email || getOrGenerateUserEmail(usr)).toLowerCase().trim();
                                return email.endsWith('@overplast.com');
                              }
                              return true;
                            })
                            .map((usr: any) => (
                            <div key={usr.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                                  {usr.full_name || 'Unnamed clinical staff'}
                                  {usr.id === loggedInProfile?.id && (
                                    <span className="bg-blue-50 text-blue-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-blue-100">Active Admin</span>
                                  )}
                                  {((usr.email && usr.email.toLowerCase().trim().endsWith('@overplast.com')) || (getOrGenerateUserEmail(usr).toLowerCase().trim().endsWith('@overplast.com'))) && (
                                    <span className="bg-amber-50 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200">Legacy/Alternate Domain</span>
                                  )}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold font-mono">
                                    <span className="text-slate-500 font-bold text-[10px]">Email:</span>
                                    {editingEmailUserId === usr.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="email"
                                          value={tempEmailValue}
                                          onChange={(e) => setTempEmailValue(e.target.value)}
                                          placeholder="e.g. user@gmail.com"
                                          className="bg-slate-50 border border-slate-300 px-1.5 py-0.5 rounded text-slate-800 text-[10px] w-48 outline-none focus:ring-1 focus:ring-blue-500/50"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleUpdateUserEmail(usr.id, tempEmailValue)}
                                          className="text-emerald-700 hover:text-emerald-800 font-black cursor-pointer px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingEmailUserId(null)}
                                          className="text-slate-500 hover:text-slate-600 font-black cursor-pointer px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span 
                                          className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 border border-slate-200/50 cursor-pointer select-all font-bold" 
                                          title="Click to copy"
                                        >
                                          {getOrGenerateUserEmail(usr)}
                                        </span>
                                        {((usr.email && usr.email.toLowerCase().trim().endsWith('@overplast.com')) || (getOrGenerateUserEmail(usr).toLowerCase().trim().endsWith('@overplast.com'))) && (
                                          <span className="bg-amber-100/80 text-amber-900 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-amber-300">
                                            Legacy/Alternate Domain
                                          </span>
                                        )}
                                        <button
                                          onClick={() => {
                                            setEditingEmailUserId(usr.id);
                                            setTempEmailValue(usr.email || getOrGenerateUserEmail(usr));
                                          }}
                                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-extrabold text-[8px] uppercase tracking-wider"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                                    {editingPasswordUserId === usr.id ? (
                                      <div className="flex items-center gap-1.5 mt-0.5 bg-slate-50 p-1.5 rounded border border-slate-200">
                                        <span className="text-slate-600 font-bold text-[10px]">New Password:</span>
                                        <input
                                          type="password"
                                          placeholder="Min 6 characters"
                                          value={tempPasswordValue}
                                          onChange={(e) => setTempPasswordValue(e.target.value)}
                                          className="bg-white border border-slate-300 px-2 py-0.5 rounded text-slate-800 text-[10px] w-36 outline-none focus:ring-1 focus:ring-blue-500"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleUpdateUserPassword(usr.id, tempPasswordValue)}
                                          className="text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingPasswordUserId(null);
                                            setTempPasswordValue('');
                                          }}
                                          className="text-slate-500 hover:text-slate-600 font-bold cursor-pointer px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingPasswordUserId(usr.id);
                                            setTempPasswordValue('');
                                          }}
                                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1"
                                        >
                                          <Lock className="w-3 h-3" /> Change Password
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    Joined: {usr.created_at ? new Date(usr.created_at).toLocaleDateString() : 'N/A'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60" title="Supabase User UUID">
                                    ID: {usr.id}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2.5 shrink-0">
                                {/* Role Assignment Dropdown selector */}
                                {usr.role === 'admin' || usr.email === 'mehmood@gmail.com' || usr.id === '9905a6da-912f-4cf0-8dfc-cc108d224ed8' || usr.id === loggedInProfile?.id ? (
                                  <span className={cn(
                                    "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                                    usr.role === 'admin' || usr.email === 'mehmood@gmail.com'
                                      ? "bg-purple-50 text-purple-700 border border-purple-100" 
                                      : usr.role === 'therapist'
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-blue-50 text-blue-700 border border-blue-100"
                                  )}>
                                    {usr.role === 'admin' || usr.email === 'mehmood@gmail.com' ? 'Administrator' : usr.role === 'therapist' ? 'Therapist (user)' : 'Technician (user)'}
                                  </span>
                                ) : (
                                  <select
                                    value={usr.role || 'therapist'}
                                    disabled={updatingUserRole === usr.id}
                                    onChange={(e) => handleUpdateUserRole(usr.id, e.target.value as any)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[9px] font-black text-slate-700 uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-100/50 cursor-pointer transition-all"
                                  >
                                    <option value="admin">Administrator</option>
                                    <option value="therapist">Therapist (user)</option>
                                    <option value="technician">Technician (user)</option>
                                  </select>
                                )}

                                {/* Delete Staff Profile Action */}
                                {usr.role !== 'admin' && usr.email !== 'mehmood@gmail.com' && usr.id !== '9905a6da-912f-4cf0-8dfc-cc108d224ed8' && usr.id !== loggedInProfile?.id && (
                                  <button
                                    onClick={() => handleDeleteUserAccount(usr.id, usr.full_name || 'Unnamed clinical staff')}
                                    disabled={deletingUserId === usr.id}
                                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 border border-slate-100 hover:border-rose-200 cursor-pointer flex items-center justify-center relative z-10"
                                    title="Delete clinical staff member profile"
                                  >
                                    {deletingUserId === usr.id ? (
                                      <div className="w-5 h-5 border-2 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-5 h-5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && isAdmin && (
            <div className="space-y-6">
              {/* Main Database & Cloud Sync Card */}
              <div className="medical-card p-8 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Database & Cloud Sync
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          !isDemo 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                          {!isDemo ? '● Live Supabase Connected' : '○ Local Demo Cache'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Supabase live cloud database se patients, assessments, aur accounts ko sync karein
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={testingDb}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-slate-200 cursor-pointer disabled:opacity-50"
                    >
                      {testingDb ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Server className="w-3.5 h-3.5" />
                      )}
                      {testingDb ? 'Testing Live...' : 'Test Connection'}
                    </button>
                  </div>
                </div>

                {/* Diagnostics Result Card */}
                {testResult && (
                  <div className={cn(
                    "mt-6 p-4 rounded-2xl border text-xs font-medium space-y-3 animate-in fade-in duration-300",
                    testResult.success 
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900" 
                      : "bg-rose-50/70 border-rose-200 text-rose-900"
                  )}>
                    <div className="flex items-center gap-2 font-black text-sm">
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </div>

                    {testResult.steps && testResult.steps.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                        {testResult.steps.map((st: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px]">
                            {st.success ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <strong className="font-bold">{st.name}:</strong> <span className="opacity-90">{st.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Supabase Connection Credentials Form */}
                <div className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Cloud className="w-4 h-4 text-blue-600" />
                        Supabase Project URL
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">e.g. https://your-project-id.supabase.co</span>
                    </label>
                    <input
                      type="url"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      placeholder="https://xxxxxxxxxxxx.supabase.co"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-amber-600" />
                        Supabase Anon Public API Key
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Project Settings ➔ API ➔ anon public</span>
                    </label>
                    <input
                      type="text"
                      value={supabaseAnonKeyInput}
                      onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                    <button
                      onClick={handleSaveDb}
                      disabled={isSavingDb}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isSavingDb ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {isSavingDb ? 'Connecting & Syncing...' : 'Save & Connect Database'}
                    </button>

                    <button
                      onClick={handleClearData}
                      className="px-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Local Demo Cache
                    </button>
                  </div>
                </div>
              </div>

              {/* Force Patient Sync & Live Supabase Rows Card */}
              <div className="medical-card p-6 sm:p-8 bg-white border border-slate-200/80 shadow-sm rounded-3xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Patient Data Sync & Live Table Verification
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Tamam local saved patients ko ek click me live Supabase cloud database me upload karein aur verification karein.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleFetchLivePatients}
                      disabled={loadingLivePatients || isDemo}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingLivePatients ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Database className="w-3.5 h-3.5" />
                      )}
                      Check Live Table
                    </button>

                    <button
                      onClick={handleSyncAllPatientsNow}
                      disabled={isSyncingAllPatients || isDemo}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSyncingAllPatients ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Cloud className="w-3.5 h-3.5" />
                      )}
                      {isSyncingAllPatients ? 'Syncing Patients...' : 'Sync All Patients to Cloud'}
                    </button>
                  </div>
                </div>

                {/* Patient Sync Report */}
                {syncPatientsReport && (
                  <div className={cn(
                    "p-4 rounded-2xl border text-xs font-medium space-y-2 animate-in fade-in duration-200",
                    syncPatientsReport.failed === 0 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  )}>
                    <div className="flex items-center gap-2 font-black text-sm">
                      {syncPatientsReport.failed === 0 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      )}
                      <span>
                        Sync Complete: {syncPatientsReport.synced} of {syncPatientsReport.total} patient(s) successfully uploaded to Supabase.
                      </span>
                    </div>

                    {syncPatientsReport.errors && syncPatientsReport.errors.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800">
                        <strong>Error details:</strong>
                        {syncPatientsReport.errors.map((err: string, i: number) => (
                          <div key={i} className="font-mono">{err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Live Patients in Supabase Table Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Live Supabase `patients` Table Data:</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {liveSupabasePatients.length} record(s) currently in Supabase
                    </span>
                  </div>

                  {liveSupabasePatients.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs text-slate-500">
                      Abhi tak live table me query nahi kiya gaya ya table khali hai. Upar "Check Live Table" ya "Sync All Patients to Cloud" par click karein.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                      {liveSupabasePatients.map((p: any, idx: number) => (
                        <div key={p.id || idx} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-2">
                              {p.full_name || 'Unnamed Patient'}
                              <span className="text-[10px] font-mono font-normal text-slate-400">({p.gender || 'N/A'}, {p.age ? `${p.age} yrs` : 'Age N/A'})</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 mt-0.5">
                              <span>Phone: {p.phone || 'N/A'}</span>
                              <span>Doctor: {p.doctor_name || 'N/A'}</span>
                              <span>ID: {p.id?.slice(0, 8)}...</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Live in Cloud
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Supabase SQL Helper Card */}
              <div className="medical-card p-6 bg-slate-900 text-white rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-black tracking-tight">Supabase SQL Editor Setup Script</h4>
                  </div>
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        Copy SQL Code
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Agar aap ke Supabase me tables create nahi hui hain ya Row Level Security (RLS) data block kar rahi hai, to upar diya gaya SQL code copy karein aur apne <strong>Supabase Dashboard ➔ SQL Editor ➔ New query</strong> me paste kar ke <strong>Run</strong> daba dein.
                </p>
                <pre className="bg-slate-950 p-4 rounded-2xl text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-48 border border-slate-800">
                  {sqlQuickCode}
                </pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Custom Confirmation Modal for safe deletion in sandbox iframe environments */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 transform scale-100 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Confirm Account Deletion
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              Are you sure you want to permanently delete this clinical staff account? This will remove access from Supabase Authentication and public profiles.
            </p>

            {/* Target Account Identity Card */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Name:</span>
                <span className="font-bold text-slate-800">{userToDelete.name}</span>
              </div>
              {userToDelete.email && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Email:</span>
                  <span className="font-mono font-bold text-slate-700">{userToDelete.email}</span>
                </div>
              )}
              {userToDelete.role && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Role:</span>
                  <span className="font-bold text-slate-700 capitalize">{userToDelete.role}</span>
                </div>
              )}
              <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Account ID (UUID):</span>
                <span className="font-mono text-[10px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 select-all break-all">
                  {userToDelete.id}
                </span>
              </div>
            </div>

            {/* Error Banner if deletion fails */}
            {deleteError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-700 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-red-800 uppercase text-[10px] tracking-wide">Deletion Failed</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{deleteError}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={!!deletingUserId}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
              >
                No, Keep It
              </button>
              <button
                type="button"
                disabled={!!deletingUserId}
                onClick={executeDeleteUserAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-100 border border-red-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingUserId === userToDelete.id ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
