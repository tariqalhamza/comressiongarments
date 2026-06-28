import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ClinicalAssessment from './pages/ClinicalAssessment';
import PatientList from './pages/PatientList';
import PatientProfile from './pages/PatientProfile';
import OrderList from './pages/OrderList';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import RegisteredAssessments from './pages/RegisteredAssessments';
import Registration from './pages/Registration';
import { useAuthStore } from './services/authStore';
import { Patient } from './types';
import { dbService } from './services/supabase';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('registration');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewingPatientProfile, setViewingPatientProfile] = useState<Patient | null>(null);
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const { user, profile, loading } = useAuthStore();
  const isSuperEmail = ['mehmood@gmail.com', 'detox16277@gmail.com'].includes(user?.email?.toLowerCase().trim() || '');
  const isAdmin = profile?.role === 'admin' || isSuperEmail;
  const [configSyncing, setConfigSyncing] = useState(true);

  useEffect(() => {
    const syncDbConfig = async () => {
      try {
        // 1. Check if URL contains connection sharing parameters (extremely useful for static deployments like Netlify/Vercel/GitHub Pages)
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get('supabase_url');
        const keyParam = params.get('supabase_key');
        
        if (urlParam && keyParam) {
          const cleanUrl = decodeURIComponent(urlParam).trim();
          const cleanKey = decodeURIComponent(keyParam).trim();
          
          if (cleanUrl && cleanKey) {
            localStorage.setItem('VITE_SUPABASE_URL', cleanUrl);
            localStorage.setItem('VITE_SUPABASE_ANON_KEY', cleanKey);
            localStorage.removeItem('supabase_force_demo');
            
            // Try to sync with server backend too if it is present
            try {
              await fetch('/api/save-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: cleanUrl, key: cleanKey })
              });
            } catch (backendErr) {
              console.warn("Backend save-config skipped on static deployment.", backendErr);
            }
            
            // Instantly reload to a clean URL without credentials visible in address bar
            window.location.replace(window.location.pathname);
            return;
          }
        }

        // 2. Fetch from backend if available (for fullstack container environments)
        const res = await fetch('/api/get-config');
        if (res.ok) {
          const data = await res.json();
          if (data.url && data.key) {
            const currentUrl = localStorage.getItem('VITE_SUPABASE_URL');
            const currentKey = localStorage.getItem('VITE_SUPABASE_ANON_KEY');
            
            if (currentUrl !== data.url || currentKey !== data.key) {
              localStorage.setItem('VITE_SUPABASE_URL', data.url);
              localStorage.setItem('VITE_SUPABASE_ANON_KEY', data.key);
              localStorage.removeItem('supabase_force_demo');
              window.location.reload();
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Error syncing Supabase config:', err);
      } finally {
        setConfigSyncing(false);
      }
    };
    syncDbConfig();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Auto adjust if screen transitions across the 1024px desktop threshold
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section !== 'registered-assessments') {
      setAssessmentFilter('');
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  if (configSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-500 tracking-wider uppercase animate-pulse">Checking Shared Database Connection...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handlePatientSelect = (patient: Patient) => {
    setViewingPatientProfile(patient);
    setActiveSection('patient-profile');
  };

  const handleStartAssessment = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveSection('assessment');
    setViewingPatientProfile(null);
  };

  const handleJumpToPatient = async (patientId: string) => {
    try {
      const patient = await dbService.patients.getById(patientId);
      if (patient) {
        setViewingPatientProfile(patient);
        setActiveSection('patient-profile');
      }
    } catch (err) {
      console.error('Failed to jump to patient:', err);
    }
  };

  const renderContent = () => {
    if (activeSection === 'patient-profile' && viewingPatientProfile) {
      return (
        <PatientProfile 
          patient={viewingPatientProfile} 
          onBack={() => setActiveSection('patients')}
          onStartAssessment={handleStartAssessment}
        />
      );
    }

    switch (activeSection) {
      case 'registration':
        return (
          <Registration 
            onStartAssessment={handleStartAssessment} 
            onPatientSelect={handlePatientSelect} 
            onViewSavedAssessment={(patientName) => {
              setAssessmentFilter(patientName);
              setActiveSection('registered-assessments');
            }}
          />
        );
      case 'dashboard':
        return <Dashboard />;
      case 'assessment':
        return <ClinicalAssessment patientData={selectedPatient} onComplete={() => {
          setSelectedPatient(null);
          setAssessmentFilter('');
          setActiveSection('registered-assessments');
        }} />;
      case 'registered-assessments':
        return <RegisteredAssessments initialSearchPatientName={assessmentFilter} />;
      case 'patients':
        return <PatientList onPatientSelect={handlePatientSelect} />;
      case 'orders':
        return (
          <OrderList 
            onPatientSelect={handleJumpToPatient} 
            onNewOrder={() => setActiveSection('assessment')}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return isAdmin ? <Settings /> : <ClinicalAssessment patientData={selectedPatient} onComplete={() => {
          setSelectedPatient(null);
          setActiveSection('registered-assessments');
        }} />;
      default:
        return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    if (activeSection === 'patient-profile') return 'Patient Clinical Profile';
    switch (activeSection) {
      case 'registration': return 'Patient Registration';
      case 'dashboard': return 'Clinical Overview';
      case 'assessment': return 'Precision Diagnostics';
      case 'registered-assessments': return 'Registered Assessments';
      case 'patients': return 'Patient Registry';
      case 'orders': return 'Production Queue';
      case 'analytics': return 'Data Insights';
      case 'settings': return 'System Preferences';
      default: return 'Medical Portal';
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden relative">
      {/* Mobile Sidebar overlay backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
        />
      )}

      <Sidebar 
        activeSection={activeSection} 
        onNavigate={handleNavigate} 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Navbar 
          title={getPageTitle()} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
        
        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
              &copy; 2026 OVERPLAST COMPRESSION GARMENT MEASUREMENT SYSTEM
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v4.2.0 Stable</span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
