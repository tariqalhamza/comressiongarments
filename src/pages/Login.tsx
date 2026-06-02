import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, Database } from 'lucide-react';
import { supabase, isDemo, supabaseUrl } from '../services/supabase';
import { useAuthStore } from '../services/authStore';
import logoImg from '../assets/images/overplast_brand_logo_teal_1779021512013.png';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore(state => state.setUser);

  const getProjectId = () => {
    const match = supabaseUrl ? supabaseUrl.match(/https?:\/\/([^.]+)/) : null;
    return match ? match[1] : 'avltksamccylkfgpfgea';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Dynamic bypass for demo/default clinic emails to prevent auth lockout on live project environments
    if (email.toLowerCase().trim() === 'demo@overplast.com' || isDemo) {
      localStorage.setItem('supabase_force_demo', 'true');
      const enteredEmail = email.toLowerCase().trim() || 'demo@overplast.com';
      const isSuperAdminEmail = ['mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com'].includes(enteredEmail);
      
      const storedProfiles = localStorage.getItem('demo_profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      const foundProfile = profiles.find((p: any) => p.email?.toLowerCase().trim() === enteredEmail);

      const resolvedRole = isSuperAdminEmail ? 'admin' : (foundProfile?.role || 'therapist');
      const resolvedName = foundProfile?.full_name || (isSuperAdminEmail ? 'Mehmood Admin' : 'Clinic Staff');
      const resolvedId = foundProfile?.id || (isSuperAdminEmail ? 'demo-user-123' : 'demo-user-' + Math.random().toString(36).substring(2, 11));

      const userObj = {
        id: resolvedId,
        email: enteredEmail,
        created_at: foundProfile?.created_at || new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: resolvedName },
        aud: 'authenticated',
        role: 'authenticated',
      };
      
      const profileObj = {
        id: resolvedId,
        full_name: resolvedName,
        role: resolvedRole,
        email: enteredEmail
      };

      localStorage.setItem('demo_user_logged_in', JSON.stringify({
        user: userObj,
        profile: profileObj
      }));

      setTimeout(() => {
        setUser(userObj as any, profileObj);
        setLoading(false);
      }, 600);
      return;
    }

    const authWithTimeout = async (promise: Promise<any>, timeoutMs: number = 7500): Promise<any> => {
      let timeoutId: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const timeoutErr = new Error('Connection timed out. Humne dekha ke response me delay hai. Yeh aam taur par tab hota hai jab free-tier Supabase project sleeping/paused ho (wake up command required).');
          (timeoutErr as any).code = 'TIMEOUT';
          reject(timeoutErr);
        }, timeoutMs);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
      });
    };

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await authWithTimeout(supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        }));

        if (signUpError) {
          setError(signUpError.message);
        } else if (data.user) {
          // Check if there are any existing profiles in the database
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          
          let assignedRole = 'therapist';
          const isSuperAdminEmail = ['mehmood@gmail.com', 'detox16277@gmail.com'].includes(email.toLowerCase().trim());
          
          if (isSuperAdminEmail) {
            assignedRole = 'admin';
          } else if (!countError && (count === 0 || count === null)) {
            assignedRole = 'admin';
          }

          // Create standard user (therapist) or admin (first user) account
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: assignedRole
          });
          if (profileError) console.error("Profile creation error:", profileError);
          
          if (data.session) {
             // Successfully signed in immediately (if confirm email is off)
             setLoading(false);
          } else {
             setError("Note: If you just changed the 'Confirm Email' setting, please DELETE your old user from the Supabase Dashboard and Register again with a fresh account.");
             setIsSignUp(false);
             setLoading(false);
          }
        }
      } else {
        const { error: loginError } = await authWithTimeout(supabase.auth.signInWithPassword({
          email,
          password,
        }));

        if (loginError) {
          if (loginError.message.includes("Email not confirmed")) {
            setError("Error: This user was created when 'Confirm Email' was ON. Please delete this user from the Supabase Dashboard > Auth > Users and Register again.");
          } else {
            setError(loginError.message);
          }
        }
      }
    } catch (err: any) {
      console.error('Authentication process failed:', err);
      setError(err?.message || 'Network error: Connection to Supabase database timed out.');
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {isSignUp ? 'Register Account' : 'Access Portal'}
            </h2>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Name"
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-xs font-bold text-red-600">{error}</p>
              </div>
            )}

            {error && (error.toLowerCase().includes('time') || error.toLowerCase().includes('delay') || error.toLowerCase().includes('sleep') || error.toLowerCase().includes('fetch')) && (
              <div className="p-5 bg-amber-500/10 border border-amber-505/20 rounded-3xl text-left space-y-3">
                <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Active Wake-up Diagnostics (Jagayein!)</h4>
                </div>
                <p className="text-[11px] font-semibold text-amber-800 leading-relaxed">
                  Bhai, Supabase free-tier project agar use na ho to auto-pause/sleep ho jata hai, jis se live login request timing out ho jati hai.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <a 
                    href={`https://supabase.com/dashboard/project/${getProjectId()}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white text-center py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4 animate-bounce" />
                    Wake Up Supabase Dashboard ↗
                  </a>
                  <p className="text-[9.5px] text-amber-600 font-semibold text-center leading-relaxed">
                    Open karke bas client dashboard par <strong className="text-amber-800">"Restore"</strong> par click karein. 1 minute me data live ho jayega!
                  </p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Register Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>


        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Precision Secure Medical Environment
        </p>
      </div>
    </div>
  );
};

export default Login;
