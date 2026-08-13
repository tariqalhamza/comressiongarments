import { create } from 'zustand';
import { supabase, isDemo, promiseWithTimeout, updateCurrentUserContext } from './supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  setUser: (user: User | null, profile?: any | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (uid: string) => Promise<void>;
}

export const normalizeAdminFullName = (name?: string | null, email?: string | null, role?: string | null): string => {
  const mailLower = (email || '').toLowerCase().trim();
  const isSuper = ['mehmood@gmail.com', 'detox16277@gmail.com', 'mahmood@gmail.com', 'demo@overplast.com'].includes(mailLower);
  const nameStr = (name || '').trim();

  if (isSuper || role === 'admin') {
    if (!nameStr || nameStr.toLowerCase().includes('medical staff') || nameStr.toLowerCase().includes('clinic staff')) {
      return 'Mahmood Ahmed';
    }
    return nameStr;
  }
  
  if (nameStr) {
    return nameStr;
  }
  
  if (email) {
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  
  return 'Therapist';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user, profile = null) => {
    let cleanProfile = profile;
    if (cleanProfile) {
      const email = user?.email || cleanProfile.email || '';
      const role = cleanProfile.role || 'therapist';
      const cleanName = normalizeAdminFullName(cleanProfile.full_name || (user as any)?.user_metadata?.full_name, email, role);
      cleanProfile = {
        ...cleanProfile,
        full_name: cleanName
      };
    }
    
    const finalName = cleanProfile?.full_name || (user as any)?.user_metadata?.full_name;
    const finalRole = cleanProfile?.role || 'therapist';
    const finalEmail = user?.email || cleanProfile?.email || null;

    updateCurrentUserContext(
      user?.id || null,
      finalEmail,
      finalRole,
      finalName ? normalizeAdminFullName(finalName, finalEmail, finalRole) : undefined
    );
    set({ user, profile: cleanProfile, loading: false });
    if (user && cleanProfile) {
      try {
        localStorage.setItem('demo_user_logged_in', JSON.stringify({ user, profile: cleanProfile }));
      } catch (cacheErr) {
        console.warn("Could not cache user session locally:", cacheErr);
      }
    }
  },
  signOut: async () => {
    try {
      localStorage.removeItem('supabase_force_demo');
      localStorage.removeItem('demo_user_logged_in');
      localStorage.removeItem('profile_custom_fields_global');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Sign out call failed on local cache clean:', e);
    }
    
    try {
      if (!isDemo) {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
        ]);
      }
    } catch (e) {
      console.warn('Sign out call to Supabase timed out or failed, clearing local state anyway.', e);
    }
    set({ user: null, profile: null });
    window.location.reload();
  },
  fetchProfile: async (uid: string) => {
    const user = get().user;
    const email = user?.email || '';
    const isSuperAdmin = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(email.toLowerCase().trim());

    if (isDemo) {
      const storedProfiles = localStorage.getItem('demo_profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      const dbProfile = profiles.find((p: any) => p.id === uid || p.email?.toLowerCase().trim() === email.toLowerCase().trim());
      
      const rawRole = isSuperAdmin ? 'admin' : (dbProfile?.role || 'therapist');
      const rawName = normalizeAdminFullName(
        dbProfile?.full_name || user?.user_metadata?.full_name,
        email,
        rawRole
      );

      const finalProfile = {
        ...(dbProfile || {
          id: uid,
          full_name: rawName,
          role: rawRole,
          email: email
        }),
        full_name: rawName,
        role: rawRole
      };
      
      updateCurrentUserContext(uid, finalProfile.email || email, finalProfile.role, finalProfile.full_name);
      set({ profile: finalProfile });
      return;
    }
    
    // Live Supabase Mode - Query public.profiles matching exact user ID (auth.users.id)
    try {
      const { data, error } = await promiseWithTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle(),
        4000
      );

      if (!error && data) {
        const finalRole = isSuperAdmin ? 'admin' : (data?.role || 'therapist');
        const finalName = normalizeAdminFullName(
          data.full_name || (user as any)?.user_metadata?.full_name,
          email,
          finalRole
        );
        const finalProfile = { 
          ...data, 
          role: finalRole,
          full_name: finalName,
          email: email
        };
        updateCurrentUserContext(uid, finalProfile.email || email, finalProfile.role, finalProfile.full_name);
        set({ profile: finalProfile });
      } else {
        const finalRole = isSuperAdmin ? 'admin' : 'therapist';
        const finalName = normalizeAdminFullName(
          (user as any)?.user_metadata?.full_name,
          email,
          finalRole
        );
        const fallbackProfile = {
          id: uid,
          full_name: finalName,
          role: finalRole,
          email: email
        };
        
        promiseWithTimeout(
          supabase
            .from('profiles')
            .upsert({
              id: uid,
              full_name: fallbackProfile.full_name,
              role: finalRole
            }),
          3000
        ).catch(e => console.warn("Background profiles insertion:", e));
          
        updateCurrentUserContext(uid, email, finalRole, fallbackProfile.full_name);
        set({ profile: fallbackProfile });
      }
    } catch (err) {
      console.warn("Supabase profile fetch error:", err);
      const finalRole = isSuperAdmin ? 'admin' : 'therapist';
      const finalName = normalizeAdminFullName(
        (user as any)?.user_metadata?.full_name,
        email,
        finalRole
      );
      const fallbackProfile = {
        id: uid,
        full_name: finalName,
        role: finalRole,
        email: email
      };
      updateCurrentUserContext(uid, email, finalRole, fallbackProfile.full_name);
      set({ profile: fallbackProfile });
    }
  }
}));

// Unified, robust initialization flow that supports both Offline/Demo and Live sessions
const initializeAuth = () => {
  const store = useAuthStore.getState();
  
  // 1. Immediately check if there is an existing session in localStorage
  const storedDemo = localStorage.getItem('demo_user_logged_in');
  if (storedDemo) {
    try {
      const parsed = JSON.parse(storedDemo);
      const email = parsed.user?.email || parsed.profile?.email || '';
      const isSuper = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(email.toLowerCase().trim());
      const role = isSuper ? 'admin' : (parsed.profile?.role || 'therapist');
      const cleanName = normalizeAdminFullName(
        parsed.profile?.full_name || (parsed.user as any)?.user_metadata?.full_name,
        email,
        role
      );

      const mergedProfile = {
        ...parsed.profile,
        role,
        full_name: cleanName
      };

      const cleanUser = parsed.user ? {
        ...parsed.user,
        user_metadata: {
          ...(parsed.user.user_metadata || {}),
          full_name: cleanName
        }
      } : null;

      store.setUser(cleanUser, mergedProfile);
    } catch (e) {
      console.error('Failed to parse safety session:', e);
      store.setUser(null);
    }
  } else {
    store.setUser(null);
  }

  // 2. Always listen to live Supabase Auth State changes in the background
  try {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const storeState = useAuthStore.getState();
      if (session?.user) {
        let cachedProfile: any = null;
        const storedNow = localStorage.getItem('demo_user_logged_in');
        if (storedNow) {
          try {
            const parsed = JSON.parse(storedNow);
            if (parsed.user?.id === session.user.id) {
              cachedProfile = parsed.profile;
            }
          } catch {}
        }
        
        storeState.setUser(session.user, cachedProfile);
        await storeState.fetchProfile(session.user.id);
      } else {
        storeState.setUser(null);
      }
    });
  } catch (err) {
    console.warn("Supabase auth listener initialization bypassed:", err);
  }

  // 3. Fallback timeout to clear stuck loading state
  setTimeout(() => {
    const storeState = useAuthStore.getState();
    if (storeState.loading) {
      const storedNow = localStorage.getItem('demo_user_logged_in');
      if (storedNow) {
        try {
          const parsed = JSON.parse(storedNow);
          if (parsed && parsed.user) {
            storeState.setUser(parsed.user, parsed.profile);
            return;
          }
        } catch {}
      }
      storeState.setUser(null);
    }
  }, 2300);
};

initializeAuth();

// Keep current database user context synchronized on any auth state changes
if (typeof useAuthStore.subscribe === 'function') {
  useAuthStore.subscribe((state) => {
    updateCurrentUserContext(
      state.user?.id || null,
      state.user?.email || null,
      state.profile?.role || 'therapist',
      state.profile?.full_name || undefined
    );
  });
}

