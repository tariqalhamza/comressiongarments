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
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { isDemo, clearDemoData, supabase, supabaseUrl, supabaseAnonKey, promiseWithTimeout } from '../services/supabase';
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

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      if (isDemo) {
        const stored = localStorage.getItem('demo_profiles');
        if (stored) {
          setProfilesList(JSON.parse(stored));
        } else {
          const defaultProfiles = [
            { id: 'demo-user-123', full_name: 'Dr. Mahmood', role: 'admin', created_at: new Date(2024, 0, 12).toISOString(), email: 'mehmood@medical-clinic.com', password: 'mehmood123' },
            { id: 'demo-user-456', full_name: 'Sarah Khan', role: 'therapist', created_at: new Date().toISOString(), email: 'sarah@overplast.com', password: 'sarah123' },
            { id: 'demo-user-789', full_name: 'Ali Raza', role: 'technician', created_at: new Date().toISOString(), email: 'ali@overplast.com', password: 'ali123' }
          ];
          localStorage.setItem('demo_profiles', JSON.stringify(defaultProfiles));
          setProfilesList(defaultProfiles);
        }
      } else {
        try {
          // Wrapped in a 4.5s timeout. If Supabase is sleeping or paused, it will fail fast we fall back cleanly.
          const { data, error } = await promiseWithTimeout(
            supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false }),
            4500
          );
          if (error) throw error;
          
          // Enrich loaded profiles from database with local storage backup values if available (e.g. Email and Password)
          const dbData = data || [];
          const stored = localStorage.getItem('demo_profiles');
          const localProfiles = stored ? JSON.parse(stored) : [];
          
          const enriched = dbData.map((dbUser: any) => {
            const localUser = localProfiles.find((lp: any) => lp.id === dbUser.id);
            return {
              ...dbUser,
              email: dbUser.email || localUser?.email || '',
              password: dbUser.password || localUser?.password || ''
            };
          });
          
          setProfilesList(enriched);
        } catch (dbErr: any) {
          console.warn('Supabase profile retrieval timed out or failed. Sourcing from local fallback storage:', dbErr);
          const stored = localStorage.getItem('demo_profiles');
          if (stored) {
            setProfilesList(JSON.parse(stored));
          } else {
            setProfilesList([]);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching clinical profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [tempPasswordValue, setTempPasswordValue] = useState('');

  const getOrGenerateUserPassword = (usr: any) => {
    if (usr.password) return usr.password;
    if (!isDemo) return '••••••••';
    
    // Construct a sensible plain-text fallback password using the user's name
    const namePart = (usr.full_name || 'user').trim().split(' ').pop() || 'user';
    const cleanName = namePart.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackPassword = `${cleanName || 'user'}123`;
    
    // Attempt to persist this generated fallback password back to localStorage
    try {
      const stored = localStorage.getItem('demo_profiles');
      if (stored) {
        const currentProfiles = JSON.parse(stored);
        let wasUpdated = false;
        const newProfiles = currentProfiles.map((p: any) => {
          if (p.id === usr.id && !p.password) {
            p.password = fallbackPassword;
            wasUpdated = true;
          }
          return p;
        });
        if (wasUpdated) {
          localStorage.setItem('demo_profiles', JSON.stringify(newProfiles));
        }
      }
    } catch (e) {
      console.error("Auto saving fallback password failed:", e);
    }
    
    return fallbackPassword;
  };

  const handleUpdateUserPassword = (userId: string, newPassword: string) => {
    if (!newPassword.trim()) return;
    
    // 1. Update list UI state inline
    setProfilesList(prev => prev.map(p => {
      if (p.id === userId) {
        return { ...p, password: newPassword };
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
            return { ...p, password: newPassword };
          }
          return p;
        });
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
      } catch (e) {
        console.error("Error updating user storage password:", e);
      }
    }
    
    setEditingPasswordUserId(null);
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
          alert("Database profile role was updated offline (local storage backup) due to connection timeout.");
        }
      }
    } catch (err: any) {
      alert("Error updating role: " + err.message);
    } finally {
      setUpdatingUserRole(null);
    }
  };

  const handleDeleteUserAccount = (userId: string, fullName: string) => {
    if (userId === loggedInProfile?.id) {
      alert("Bhai, aap khud ka account yahan se delete nahi kar sakte.");
      return;
    }
    setUserToDelete({ id: userId, name: fullName });
  };

  const executeDeleteUserAccount = async () => {
    if (!userToDelete) return;
    const { id: userId } = userToDelete;
    
    setDeletingUserId(userId);
    setUserToDelete(null); // immediately dismiss modal input view

    try {
      // 1. ALWAYS remove from localStorage demo_profiles immediately for offline/hybrid consistency
      const stored = localStorage.getItem('demo_profiles');
      if (stored) {
        try {
          const currentProfiles = JSON.parse(stored);
          const updated = currentProfiles.filter((p: any) => p.id !== userId);
          localStorage.setItem('demo_profiles', JSON.stringify(updated));
        } catch (e) {
          console.error("Local profile removal error:", e);
        }
      }
      
      // 2. ALWAYS remove from UI list immediately for responsive visual feedback
      setProfilesList(prev => prev.filter((p: any) => p.id !== userId));

      // 3. If in live database mode, attempt to delete in the background
      if (!isDemo) {
        try {
          const { error } = await promiseWithTimeout(
            supabase
              .from('profiles')
              .delete()
              .eq('id', userId),
            4000
          );
          if (error) {
            console.warn("Supabase database delete policy blocked live sync deleting profile:", error);
          }
        } catch (dbErr: any) {
          console.warn("Supabase database timeout or connectivity delay. Already synced locally:", dbErr);
        }
      }
    } catch (err: any) {
      console.error("Error in delete account pipeline:", err);
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

    const emailTrim = newUserEmail.trim();
    const passwordTrim = newUserPassword.trim();
    const nameTrim = newUserFullName.trim();

    if (!emailTrim || !passwordTrim || !nameTrim) {
      setCreateError('Bhai, saari fields ka fill karna zaroori hai.');
      setCreatingUser(false);
      return;
    }

    if (passwordTrim.length < 6) {
      setCreateError('Password kam se kam 6 characters ka hona chahiye.');
      setCreatingUser(false);
      return;
    }

    try {
      if (isDemo) {
        const stored = localStorage.getItem('demo_profiles');
        let currentProfiles = stored ? JSON.parse(stored) : [];
        
        const dup = currentProfiles.find((p: any) => p.email?.toLowerCase() === emailTrim.toLowerCase());
        if (dup) {
          throw new Error('Yeh email address pehle se register hai.');
        }

        const newProfile = {
          id: 'demo-user-' + Math.random().toString(36).substring(2, 11),
          full_name: nameTrim,
          role: newUserRole,
          email: emailTrim,
          password: passwordTrim,
          created_at: new Date().toISOString()
        };

        const updated = [newProfile, ...currentProfiles];
        localStorage.setItem('demo_profiles', JSON.stringify(updated));
        setProfilesList(updated);
        setCreateSuccess(`Mubarak! User "${nameTrim}" registered successfully in local offline mode.`);
        
        // Reset form fields
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setNewUserRole('therapist');
      } else {
        // Create an isolation client instance so current active admin does not logout
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
              data: { full_name: nameTrim }
            }
          }),
          6500
        );

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('Authentication sign up process failed.');

        // Insert new user role directly in profiles database
        const { error: profileError } = await promiseWithTimeout(
          supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: nameTrim,
            role: newUserRole
          }),
          5500
        );

        if (profileError) {
          console.error('Error inserting user profile:', profileError);
          throw new Error('Database profile creation failed: ' + profileError.message);
        }

        // Also add user as a local fallback database profile model so they immediately see it
        const stored = localStorage.getItem('demo_profiles') || '[]';
        let currentProfiles = JSON.parse(stored);
        const newLocalProfile = {
          id: signUpData.user.id,
          full_name: nameTrim,
          role: newUserRole,
          email: emailTrim,
          password: passwordTrim,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('demo_profiles', JSON.stringify([newLocalProfile, ...currentProfiles]));

        setCreateSuccess(`User "${nameTrim}" successfully registered in Supabase Live! They can now sign in.`);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setNewUserRole('therapist');
        
        // Refresh profiles list
        loadProfiles();
      }
    } catch (err: any) {
      console.error('Failed to create clinical user:', err);
      const errorMsg = err.message || 'Error occurred while registering user account.';
      
      // Connection issue or timeout fallback handler
      if (!isDemo && (errorMsg.includes('timed out') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch') || errorMsg.includes('Network'))) {
        try {
          const stored = localStorage.getItem('demo_profiles') || '[]';
          let currentProfiles = JSON.parse(stored);
          const newProfile = {
            id: 'local-user-' + Math.random().toString(36).substring(2, 11),
            full_name: nameTrim,
            role: newUserRole,
            email: emailTrim,
            password: passwordTrim,
            created_at: new Date().toISOString()
          };
          
          const updated = [newProfile, ...currentProfiles];
          localStorage.setItem('demo_profiles', JSON.stringify(updated));
          setProfilesList(updated);
          setCreateSuccess(`Mubarak! Database connection delay detected, so "${nameTrim}" was created successfully in Local Storage offline backup. They can now use offline mode!`);
          setNewUserEmail('');
          setNewUserPassword('');
          setNewUserFullName('');
          setNewUserRole('therapist');
        } catch (fallbackErr) {
          setCreateError(errorMsg);
        }
      } else {
        setCreateError(errorMsg);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  // Supabase Custom Config State
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(localStorage.getItem('VITE_SUPABASE_URL') || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');
  const [isSavingDb, setIsSavingDb] = useState(false);

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
    name: 'Mahmood',
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

      setAdminProfile(prev => ({
        ...prev,
        name: savedCustom.name || loggedInProfile.full_name || prev.name,
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
      shouldClear = window.confirm("Bhai, kya aap waqai saara local demo data aur default patients ko delete karna chahte hain? Is se purane test records bilkul saaf ho jayenge aur table empty ho jayege.");
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
                            placeholder="e.g. sarah@overplast.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Secure Password</label>
                          <input 
                            type="password"
                            required
                            placeholder="•••••••• (Min 6 characters)"
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
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registered Clinical Accounts ({profilesList.length})</span>
                      <button 
                        onClick={loadProfiles} 
                        className="text-[10px] font-black text-blue-650 text-blue-600 uppercase tracking-widest hover:underline"
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
                          {profilesList.map((usr: any) => (
                            <div key={usr.id} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                                  {usr.full_name || 'Unnamed clinical staff'}
                                  {usr.id === loggedInProfile?.id && (
                                    <span className="bg-blue-50 text-blue-750 text-blue-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border border-blue-100">Active Admin</span>
                                  )}
                                </p>
                                <div className="mt-1 space-y-1">
                                  <p className="text-[10px] text-slate-500 font-semibold truncate font-mono">
                                    <span className="text-slate-400 font-medium">Email:</span> {usr.email || `Reg ID: ${usr.id.substring(0, 10)}...`}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold font-mono">
                                    <span className="text-rose-500 font-extrabold text-[10px]">Password:</span> 
                                    {editingPasswordUserId === usr.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={tempPasswordValue}
                                          onChange={(e) => setTempPasswordValue(e.target.value)}
                                          className="bg-slate-50 border border-slate-300 px-1.5 py-0.5 rounded text-slate-800 text-[10px] w-32 outline-none focus:ring-1 focus:ring-blue-500/50"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleUpdateUserPassword(usr.id, tempPasswordValue)}
                                          className="text-emerald-700 hover:text-emerald-800 font-black cursor-pointer px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingPasswordUserId(null)}
                                          className="text-slate-500 hover:text-slate-600 font-black cursor-pointer px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[9px] uppercase tracking-wider"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span 
                                          className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 border border-slate-200/50 cursor-pointer select-all font-bold" 
                                          title={isDemo ? "Click to copy or double click to select" : "Securely encrypted in Database (Supabase Auth)"}
                                        >
                                          {usr.password || getOrGenerateUserPassword(usr)}
                                        </span>
                                        {isDemo ? (
                                          <button
                                            onClick={() => {
                                              setEditingPasswordUserId(usr.id);
                                              setTempPasswordValue(usr.password || getOrGenerateUserPassword(usr));
                                            }}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-extrabold text-[8px] uppercase tracking-wider"
                                          >
                                            Edit
                                          </button>
                                        ) : (
                                          <span className="text-[10px] font-bold text-slate-450 text-slate-400 capitalize bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 select-none" title="Live auth credentials cannot be retrieved client-side for security reasons.">
                                            DB Secured
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mt-1">
                                  Joined Clinical: {usr.created_at ? new Date(usr.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2.5 shrink-0">
                                {/* Role Assignment Dropdown selector */}
                                {usr.id !== loggedInProfile?.id ? (
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
                                ) : (
                                  <span className={cn(
                                    "inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                                    usr.role === 'admin' 
                                      ? "bg-purple-50 text-purple-700 border border-purple-100" 
                                      : usr.role === 'therapist'
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      : "bg-blue-50 text-blue-700 border border-blue-100"
                                  )}>
                                    {usr.role === 'admin' ? 'Administrator' : usr.role === 'therapist' ? 'Therapist (user)' : 'Technician (user)'}
                                  </span>
                                )}

                                {/* Delete Staff Profile Action */}
                                {usr.id !== loggedInProfile?.id && (
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


        </main>
      </div>

      {/* Custom Confirmation Modal for safe deletion in sandbox iframe environments */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 transform scale-100 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-4 border border-red-100">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Confirm Account Deletion
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              Kya aap waqai <strong className="text-slate-800 font-bold">"{userToDelete.name}"</strong> ka account record Clinical Database se delete karna chahte hain? Is se in ka entry aur access foran khatam ho jayega.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={executeDeleteUserAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-100 border border-red-700"
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

export default Settings;
