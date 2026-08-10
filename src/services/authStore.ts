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
  const nameLower = nameStr.toLowerCase();

  const isOldAdminName = !nameStr ||
                         nameLower.includes('dr. mahmood') || 
                         nameLower.includes('dr. mehmood') || 
                         nameLower.includes('dr mahmood') || 
                         nameLower.includes('dr mehmood') || 
                         nameLower === 'mahmood admin' || 
                         nameLower === 'mehmood admin' || 
                         nameLower === 'mahmood' || 
                         nameLower === 'mehmood' ||
                         nameLower === 'medical staff' ||
                         nameLower === 'clinic staff';

  if (isSuper || role === 'admin') {
    if (isOldAdminName) {
      return 'Mahmood Ahmed';
    }
    return nameStr;
  }
  if (isOldAdminName && (nameLower.includes('mahmood') || nameLower.includes('mehmood'))) {
    return 'Mahmood Ahmed';
  }
  return nameStr || (email ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)) : 'Clinic Staff');
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
    // Keep local safety session cache updated whenever setUser is called
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
    } catch (e) {
      console.warn('Sign out call failed on local cache clean:', e);
    }
    
    try {
      if (!isDemo) {
        // Use a race to prevent hanging if network is dead
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) => setTimeout(() => reject('timeout'), 2000))
        ]);
      }
    } catch (e) {
      console.warn('Sign out call to Supabase timed out or failed, clearing local state anyway.', e);
    }
    set({ user: null, profile: null });
    // Reload the page to ensure fresh, clean state and clean redirect to Login
    window.location.reload();
  },
  fetchProfile: async (uid: string) => {
    const user = get().user;
    const email = user?.email || '';
    const isSuperAdmin = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(email.toLowerCase().trim());

    // Helper to load custom backup profile fields from localStorage robustly (by uid, email, and global)
    const getSavedCustomFields = (id: string, mail: string) => {
      let saved: any = {};
      const keys = [
        'profile_custom_fields_global',
        mail ? `profile_custom_fields_${mail.toLowerCase().trim()}` : '',
        id ? `profile_custom_fields_${id}` : ''
      ].filter(Boolean);
      
      for (const k of keys) {
        try {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === 'object') {
              saved = { ...saved, ...parsed };
            }
          }
        } catch (e) {
          console.warn("Error parsing key from storage", k, e);
        }
      }
      return saved;
    };

    const savedCustom = getSavedCustomFields(uid, email);

    if (isDemo) {
      const storedDemo = localStorage.getItem('demo_user_logged_in');
      let currentProfile: any = null;
      if (storedDemo) {
        try {
          const parsed = JSON.parse(storedDemo);
          currentProfile = parsed.profile;
        } catch {}
      }
      
      // Look up inside demo_profiles to get the latest/correct role and name matching email or id
      const storedProfiles = localStorage.getItem('demo_profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      const dbProfile = profiles.find((p: any) => p.id === uid || p.email?.toLowerCase().trim() === email.toLowerCase().trim());
      
      const rawRole = isSuperAdmin ? 'admin' : (dbProfile?.role || currentProfile?.role || 'therapist');
      const rawName = normalizeAdminFullName(
        savedCustom.name || dbProfile?.full_name || currentProfile?.full_name,
        email,
        rawRole
      );

      const finalProfile = {
        ...(dbProfile || currentProfile || {
          id: uid,
          full_name: rawName,
          role: rawRole,
          email: email
        }),
        ...savedCustom,
        full_name: rawName,
        role: rawRole
      };
      
      updateCurrentUserContext(uid, finalProfile.email || email, finalProfile.role, finalProfile.full_name);
      set({ profile: finalProfile });
      return;
    }
    
    // Live Supabase Mode - query with a strict 4.0 second timeout to prevent hanging UI
    try {
      const { data, error } = await promiseWithTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single(),
        4000
      );

      if (!error && data) {
        const finalRole = isSuperAdmin ? 'admin' : (data?.role || 'therapist');
        const finalName = normalizeAdminFullName(
          savedCustom.name || data.full_name,
          email,
          finalRole
        );
        const finalProfile = { 
          ...data, 
          ...savedCustom,
          role: finalRole,
          full_name: finalName
        };
        if (isSuperAdmin && data.role !== 'admin') {
          finalProfile.role = 'admin';
          // Correct role in Database asynchronously
          promiseWithTimeout(
            supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', uid),
            3000
          ).catch(e => console.warn("Failed async admin promotion:", e));
        }
        updateCurrentUserContext(uid, finalProfile.email || email, finalProfile.role, finalProfile.full_name);
        set({ profile: finalProfile });
      } else {
        throw new Error(error?.message || 'Profile not returned from Supabase');
      }
    } catch (err) {
      console.warn("Supabase profile fetch timed out/failed. Falling back to robust local offline storage profile.", err);
      
      const finalRole = isSuperAdmin ? 'admin' : 'therapist';
      const finalName = normalizeAdminFullName(
        savedCustom.name || user?.user_metadata?.full_name,
        email,
        finalRole
      );
      const fallbackProfile = {
        id: uid,
        full_name: finalName,
        role: finalRole,
        email: email,
        ...savedCustom
      };
      
      // Attempt to salvage and insert profile in Supabase table asynchronously & silently
      promiseWithTimeout(
        supabase
          .from('profiles')
          .insert({
            id: uid,
            full_name: fallbackProfile.full_name,
            role: finalRole
          }),
        3000
      ).catch(e => console.warn("Background profiles insertion failed/timedout:", e));
        
      updateCurrentUserContext(uid, (fallbackProfile as any).email || email, finalRole, fallbackProfile.full_name);
      set({ profile: fallbackProfile });
    }
  }
}));

// Unified, robust initialization flow that supports both Offline/Demo and Live sessions
const initializeAuth = () => {
  const store = useAuthStore.getState();
  
  // 1. Immediately hydrate the active session from localStorage (fast/offline fallback path)
  const storedDemo = localStorage.getItem('demo_user_logged_in');
  if (storedDemo) {
    try {
      const parsed = JSON.parse(storedDemo);
      const email = parsed.user?.email || '';
      const uid = parsed.user?.id || 'demo';
      
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
            const parsedItem = JSON.parse(item);
            if (parsedItem && typeof parsedItem === 'object') {
              savedCustom = { ...savedCustom, ...parsedItem };
            }
          }
        } catch {}
      }

      const isSuper = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(email.toLowerCase().trim());
      const role = isSuper ? 'admin' : (parsed.profile?.role || 'therapist');
      const cleanName = normalizeAdminFullName(
        savedCustom.name || parsed.profile?.full_name || (parsed.user as any)?.user_metadata?.full_name,
        email,
        role
      );

      const mergedProfile = {
        ...parsed.profile,
        ...savedCustom,
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

      try {
        localStorage.setItem('demo_user_logged_in', JSON.stringify({ user: cleanUser, profile: mergedProfile }));
      } catch {}

      store.setUser(cleanUser, mergedProfile);
    } catch (e) {
      console.error('Failed to parse safety session:', e);
      store.setUser(null);
    }
  } else {
    store.setUser(null);
  }

  // 2. Always listen to live Supabase Auth State changes in the background (if Supabase client is active)
  try {
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const storeState = useAuthStore.getState();
      if (session?.user) {
        // Find cache to bypass load flickering
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
        // If there is a cached local/synced session, preserve it rather than logging out!
        const storedNow = localStorage.getItem('demo_user_logged_in');
        if (storedNow) {
          try {
            const parsed = JSON.parse(storedNow);
            if (parsed && parsed.user) {
              console.log("Preserving cached clinical synced profile session:", parsed.user.email);
              storeState.setUser(parsed.user, parsed.profile);
              return;
            }
          } catch (e) {
            console.warn("Failed to restore cached session:", e);
          }
        }
        // Only log out if no local/synced session is active either
        storeState.setUser(null);
      }
    });
  } catch (err) {
    console.warn("Supabase auth listener initialization bypassed (expected in strict offline contexts):", err);
  }

  // 3. Safety fallback: If standard Supabase Auth takes more than 2.3 seconds, force-load to prevent infinite login spinal wait
  setTimeout(() => {
    const storeState = useAuthStore.getState();
    if (storeState.loading) {
      console.warn("Supabase Auth listener took too long to fire. Safely loading portal in Offline/Demo framework.");
      const storedNow = localStorage.getItem('demo_user_logged_in');
      if (storedNow) {
        try {
          const parsed = JSON.parse(storedNow);
          const email = parsed.user?.email || '';
          const uid = parsed.user?.id || 'demo';
          
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
                const parsedItem = JSON.parse(item);
                if (parsedItem && typeof parsedItem === 'object') {
                  savedCustom = { ...savedCustom, ...parsedItem };
                }
              }
            } catch {}
          }

          const isSuper = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(email.toLowerCase().trim());
          const role = isSuper ? 'admin' : (parsed.profile?.role || 'therapist');
          const cleanName = normalizeAdminFullName(
            savedCustom.name || parsed.profile?.full_name || (parsed.user as any)?.user_metadata?.full_name,
            email,
            role
          );

          const mergedProfile = {
            ...parsed.profile,
            ...savedCustom,
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

          try {
            localStorage.setItem('demo_user_logged_in', JSON.stringify({ user: cleanUser, profile: mergedProfile }));
          } catch {}

          storeState.setUser(cleanUser, mergedProfile);
          return;
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

