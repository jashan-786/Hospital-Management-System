import { useState } from 'react';
import { Bell, Search, Calendar } from 'lucide-react';
import Sidebar, { type View } from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Departments from './pages/Departments';
import Staff from './pages/Staff';
import Rooms from './pages/Rooms';
import Billing from './pages/Billing';
import MedicalRecords from './pages/MedicalRecords';
import Pharmacy from './pages/Pharmacy';
import Reports from './pages/Reports';

const VIEW_TITLES: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Hospital operations overview' },
  patients: { title: 'Patients', subtitle: 'Patient registration and records' },
  doctors: { title: 'Doctors', subtitle: 'Medical staff directory' },
  appointments: { title: 'Appointments', subtitle: 'Schedule and bookings' },
  'medical-records': { title: 'Medical Records', subtitle: 'Electronic medical records & prescriptions' },
  departments: { title: 'Departments', subtitle: 'Hospital departments' },
  pharmacy: { title: 'Pharmacy', subtitle: 'Medicine inventory management' },
  staff: { title: 'Staff', subtitle: 'Staff management' },
  rooms: { title: 'Rooms & Admissions', subtitle: 'Room and bed management' },
  billing: { title: 'Billing', subtitle: 'Financial management' },
  reports: { title: 'Reports', subtitle: 'Analytics and insights' },
};

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading MediCore...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return <Login />;
  }

  const meta = VIEW_TITLES[view];
  const role = profile.role;
  const userName = profile.full_name;
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        active={view}
        onNavigate={setView}
        role={role}
        userName={userName}
        onSignOut={signOut}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
            <div className="flex-1 min-w-0 pl-12 lg:pl-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">{meta.title}</h2>
              <p className="text-xs text-slate-500 truncate">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900">{userName}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6 max-w-[1600px] mx-auto">
          <div key={view} className="animate-fade-in">
            {view === 'dashboard' && <Dashboard role={role} profileId={profile.id} linkedDoctorId={profile.linked_doctor_id} linkedPatientId={profile.linked_patient_id} onNavigate={setView} />}
            {view === 'patients' && <Patients />}
            {view === 'doctors' && <Doctors />}
            {view === 'appointments' && <Appointments role={role} linkedDoctorId={profile.linked_doctor_id} linkedPatientId={profile.linked_patient_id} />}
            {view === 'medical-records' && <MedicalRecords role={role} linkedDoctorId={profile.linked_doctor_id} linkedPatientId={profile.linked_patient_id} />}
            {view === 'departments' && <Departments />}
            {view === 'pharmacy' && <Pharmacy />}
            {view === 'staff' && <Staff />}
            {view === 'rooms' && <Rooms />}
            {view === 'billing' && <Billing role={role} linkedPatientId={profile.linked_patient_id} />}
            {view === 'reports' && <Reports />}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
