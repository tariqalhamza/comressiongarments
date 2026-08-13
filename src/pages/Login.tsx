import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { supabase, isDemo, supabaseUrl, setForceDemo, syncClinicalProfilesFromServer, saveClinicalProfilesToServer, updateCurrentUserContext } from '../services/supabase';
import { useAuthStore } from '../services/authStore';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const setUser = useAuthStore(state => state.setUser);

  // Sync clinical staff accounts from server on startup so login works instantly on any device
  useEffect(() => {
    syncClinicalProfilesFromServer().catch(err => {
      console.warn("Startup clinical profiles sync failed gracefully:", err);
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const rawEmail = (email || '').trim();
    const rawPassword = password || '';

    if (!rawEmail || !rawPassword) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    let targetEmail = rawEmail.toLowerCase();
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail}@gmail.com`;
    }

    try {
      // Ensure clean state before authenticating
      setForceDemo(false);
      localStorage.removeItem('supabase_force_demo');
      localStorage.removeItem('demo_user_logged_in');

      // Live Supabase Authentication is the sole authority
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: rawPassword,
      });

      if (loginError) {
        console.warn("Supabase Auth sign-in rejected:", loginError.message);
        const msg = loginError.message.toLowerCase();
        if (loginError.status === 429 || msg.includes("rate limit")) {
          setError("Too many login attempts. Please wait a moment and try again.");
        } else if (msg.includes("email not confirmed")) {
          setError("This account requires email confirmation or administrator activation.");
        } else if (msg.includes("invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials.");
        } else {
          setError(loginError.message || "Authentication failed. Please check your credentials.");
        }
        setLoading(false);
        return;
      }

      if (authData?.user) {
        const authUser = authData.user;
        const finalEmail = (authUser.email || targetEmail).toLowerCase().trim();
        let userProfile: any = null;

        try {
          const { data: prof, error: profErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (!profErr && prof) {
            userProfile = prof;
          }
        } catch (pe) {
          console.warn("Could not fetch profile row:", pe);
        }

        const isSuperAdminEmail = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'mahmood@gmail.com'].includes(finalEmail);
        const resolvedRole = isSuperAdminEmail ? 'admin' : (userProfile?.role || authUser.user_metadata?.role || 'therapist');
        const resolvedName = userProfile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || (isSuperAdminEmail ? 'Mahmood Ahmed' : (finalEmail.split('@')[0].charAt(0).toUpperCase() + finalEmail.split('@')[0].slice(1)));

        const profileObj = {
          id: authUser.id,
          full_name: resolvedName,
          role: resolvedRole,
          email: finalEmail,
        };

        const userObj = {
          id: authUser.id,
          email: finalEmail,
          created_at: authUser.created_at,
          app_metadata: authUser.app_metadata || {},
          user_metadata: { full_name: resolvedName, role: resolvedRole },
          aud: 'authenticated',
          role: 'authenticated',
        };

        localStorage.setItem('demo_user_logged_in', JSON.stringify({
          user: userObj,
          profile: profileObj
        }));

        setUser(userObj as any, profileObj);
      }
    } catch (err: any) {
      console.error('Authentication process failed:', err);
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 mb-4 flex items-center justify-center">
            <img 
              src={logoImg} 
              alt="OVERPLAST Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">OVERPLAST</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 text-center max-w-[280px]">Medical Compression Measurement System</p>
        </div>

        <div className="medical-card p-8 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Access Clinical Portal
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sign in with your administrator-provided credentials
              </p>
            </div>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <p className="text-xs font-bold text-emerald-700 leading-relaxed">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Precision Secure Medical Environment • Admin Managed Accounts
        </p>
      </div>
    </div>
  );
};

export default Login;

