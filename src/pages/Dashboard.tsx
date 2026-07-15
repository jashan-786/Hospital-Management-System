import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient, Appointment, Bill, Medicine, MedicalRecord } from '../types';
import { useToast } from '../components/Toast';
import {
  HeartPulse, CalendarDays, DollarSign, Pill, Users, TrendingUp, AlertCircle,
  Stethoscope, FileText, Receipt, BedDouble,
} from 'lucide-react';

type View =
  | 'dashboard' | 'patients' | 'doctors' | 'appointments' | 'departments'
  | 'staff' | 'rooms' | 'billing' | 'medical-records' | 'pharmacy' | 'reports';

interface DashboardProps {
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  profileId: string;
  linkedDoctorId: string | null;
  linkedPatientId: string | null;
  onNavigate: (view: View) => void;
}

/* ---------- helpers ---------- */
const todayISO = () => new Date().toISOString().slice(0, 10);

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
        <FileText className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
function StatCard({ label, value, icon: Icon, tint }: {
  label: string; value: string | number; icon: React.ElementType; tint: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tint}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
function Card({ title, icon: Icon, action, onNav, children }: {
  title: string; icon: React.ElementType;
  action?: { label: string; view: View }; onNav: (v: View) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-brand-600" />
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {action && (
          <button onClick={() => onNav(action.view)} className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
            {action.label} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
function WelcomeBanner({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="animate-fade-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-lg sm:p-8">
      <HeartPulse className="absolute -right-4 -top-4 h-32 w-32 text-white/10" />
      <p className="text-sm font-medium text-white/70">{subtitle}</p>
      <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome back, {name}</h2>
      <p className="mt-2 max-w-md text-sm text-white/70">Here's what's happening across your hospital today.</p>
    </div>
  );
}
function DonutChart({ occupied, available }: { occupied: number; available: number }) {
  const total = occupied + available || 1;
  const r = 54, c = 2 * Math.PI * r;
  const occDash = (occupied / total) * c;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="#0d9488" strokeWidth="16"
          strokeDasharray={`${occDash} ${c - occDash}`} strokeDashoffset={c / 4}
          strokeLinecap="round" transform="rotate(-90 70 70)" className="transition-all duration-700" />
        <text x="70" y="66" textAnchor="middle" className="fill-slate-900 text-xl font-bold">{Math.round((occupied / total) * 100)}%</text>
        <text x="70" y="84" textAnchor="middle" className="fill-slate-400 text-[10px]">occupied</text>
      </svg>
      <div className="space-y-3">
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-brand-600" /><span className="text-sm text-slate-600">Occupied: <strong className="text-slate-900">{occupied}</strong></span></div>
        <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-200" /><span className="text-sm text-slate-600">Available: <strong className="text-slate-900">{available}</strong></span></div>
      </div>
    </div>
  );
}

/* ---------- rows ---------- */
function ApptRow({ a }: { a: Appointment }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><CalendarDays className="h-4 w-4" /></div>
        <div><p className="text-sm font-medium text-slate-800">{a.patient_name}</p>
          <p className="text-xs text-slate-400">{a.appointment_time} · {a.doctor_name}</p></div>
      </div>
      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">{a.status}</span>
    </div>
  );
}
function PatientRow({ p }: { p: Patient }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Users className="h-4 w-4" /></div>
      <div className="flex-1"><p className="text-sm font-medium text-slate-800">{p.name}</p>
        <p className="text-xs text-slate-400">{p.gender ?? '—'} · {p.phone ?? '—'}</p></div>
    </div>
  );
}
function BillRow({ b }: { b: Bill }) {
  const tint = b.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Receipt className="h-4 w-4" /></div>
        <div><p className="text-sm font-medium text-slate-800">${Number(b.total_amount).toLocaleString()}</p>
          <p className="text-xs text-slate-400">{b.patient_name} · {b.bill_date}</p></div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tint}`}>{b.status}</span>
    </div>
  );
}
function RecordRow({ r }: { r: MedicalRecord }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 py-3 last:border-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"><FileText className="h-4 w-4" /></div>
      <div className="flex-1"><p className="text-sm font-medium text-slate-800">{r.diagnosis ?? 'Untitled record'}</p>
        <p className="text-xs text-slate-400">{r.patient?.name ?? 'Unknown'} · {r.record_date}</p></div>
    </div>
  );
}
/* =========================================================== */
export default function Dashboard({ role, profileId, linkedDoctorId, linkedPatientId, onNavigate }: DashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState(
    role === 'admin' ? 'Admin' : role === 'receptionist' ? 'Reception' : role === 'doctor' ? 'Doctor' : 'Patient'
  );

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [occupied, setOccupied] = useState(0);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const recordSel = '*, patient:patients(name), doctor:doctors(name)';

        // Resolve display name per role
        if (role === 'doctor' && linkedDoctorId) {
          const { data: d } = await supabase.from('doctors').select('name').eq('id', linkedDoctorId).single();
          if (d?.name) setUserName(d.name);
        } else if (role === 'patient' && linkedPatientId) {
          const { data: p } = await supabase.from('patients').select('name').eq('id', linkedPatientId).single();
          if (p?.name) setUserName(p.name);
        } else if (role === 'admin') {
          const { data: s } = await supabase.from('staff').select('name').eq('id', profileId).single();
          if (s?.name) setUserName(s.name);
        }

        if (role === 'admin' || role === 'receptionist') {
          const [p, ap, m, rooms] = await Promise.all([
            supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(50),
            supabase.from('appointments').select('*'),
            supabase.from('medicines').select('*'),
            supabase.from('rooms').select('capacity, occupied'),
          ]);
          if (active) {
            setPatients(p.data ?? []);
            setAppointments(ap.data ?? []);
            setMedicines(m.data ?? []);
            const cap = (rooms.data ?? []).reduce((s, r) => s + (r.capacity ?? 0), 0);
            const occ = (rooms.data ?? []).reduce((s, r) => s + (r.occupied ?? 0), 0);
            setOccupied(occ); setAvailable(Math.max(0, cap - occ));
          }
        }
        if (role === 'admin') {
          const [bl, rc] = await Promise.all([
            supabase.from('bills').select('*'),
            supabase.from('medical_records').select(recordSel).order('record_date', { ascending: false }).limit(5),
          ]);
          if (active) { setBills(bl.data ?? []); setRecords(rc.data ?? []); }
        }
        if (role === 'doctor' && linkedDoctorId) {
          const [ap, rc] = await Promise.all([
            supabase.from('appointments').select('*'),
            supabase.from('medical_records').select(recordSel).eq('doctor_id', linkedDoctorId).order('record_date', { ascending: false }).limit(5),
          ]);
          if (active) { setAppointments(ap.data ?? []); setRecords(rc.data ?? []); }
        }
        if (role === 'patient' && linkedPatientId) {
          const [ap, rc, bl] = await Promise.all([
            supabase.from('appointments').select('*'),
            supabase.from('medical_records').select(recordSel).eq('patient_id', linkedPatientId),
            supabase.from('bills').select('*'),
          ]);
          if (active) { setAppointments(ap.data ?? []); setRecords(rc.data ?? []); setBills(bl.data ?? []); }
        }
      } catch {
        toast('Failed to load dashboard data', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [role, profileId, linkedDoctorId, linkedPatientId, toast]);

  /* ---------- derived ---------- */
  const today = todayISO();
  const todays = appointments.filter((a) => a.appointment_date === today);
  const paidRev = bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + Number(b.total_amount), 0);
  const pendRev = bills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + Number(b.total_amount), 0);
  const lowStock = medicines.filter((m) => Number(m.stock_qty) <= Number(m.reorder_level));
  const apptList = (rows: Appointment[]) => rows.length ? rows.slice(0, 6).map((a) => <ApptRow key={a.id} a={a} />) : <EmptyState message="No appointments." />;
  const recordList = (rows: MedicalRecord[]) => rows.length ? rows.slice(0, 5).map((r) => <RecordRow key={r.id} r={r} />) : <EmptyState message="No records found." />;
  const subtitle = role === 'admin' ? 'Administrator' : role === 'receptionist' ? 'Reception Desk' : role === 'doctor' ? 'Doctor' : 'Patient';

  /* ---------- ADMIN ---------- */
  if (role === 'admin') {
    return (
      <div className="animate-fade-in space-y-6">
        <WelcomeBanner name={userName} subtitle={subtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
            <>
              <StatCard label="Total Patients" value={patients.length} icon={Users} tint="bg-brand-50 text-brand-600" />
              <StatCard label="Today's Appointments" value={todays.length} icon={CalendarDays} tint="bg-blue-50 text-blue-600" />
              <StatCard label="Total Revenue" value={`$${paidRev.toLocaleString()}`} icon={DollarSign} tint="bg-emerald-50 text-emerald-600" />
              <StatCard label="Low Stock Medicines" value={lowStock.length} icon={Pill} tint="bg-amber-50 text-amber-600" />
            </>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Today's Appointments" icon={CalendarDays} onNav={onNavigate} action={{ label: 'View all', view: 'appointments' }}>
            {loading ? <SkeletonRows /> : apptList(todays)}
          </Card>
          <Card title="Room Occupancy" icon={BedDouble} onNav={onNavigate}>
            {loading ? <div className="flex h-40 items-center justify-center"><SkeletonRows rows={1} /></div>
              : <DonutChart occupied={occupied} available={available} />}
          </Card>
          <Card title="Financial Summary" icon={TrendingUp} onNav={onNavigate}>
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-medium text-emerald-700">Total Revenue</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">${paidRev.toLocaleString()}</p></div>
              <div className="rounded-xl bg-brand-50 p-4"><p className="text-xs font-medium text-brand-700">Paid</p>
                <p className="mt-1 text-2xl font-bold text-brand-900">${paidRev.toLocaleString()}</p></div>
              <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-medium text-amber-700">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-900">${pendRev.toLocaleString()}</p></div>
            </div>
          </Card>
        </div>
        <Card title="Recent Medical Records" icon={FileText} onNav={onNavigate} action={{ label: 'View all', view: 'medical-records' }}>
          {loading ? <SkeletonRows /> : recordList(records)}
        </Card>
      </div>
    );
  }

  /* ---------- DOCTOR ---------- */
  if (role === 'doctor') {
    const myToday = appointments.filter((a) => a.doctor_name === userName && a.appointment_date === today);
    const myPatients = new Set(records.map((r) => r.patient?.name).filter(Boolean));
    return (
      <div className="animate-fade-in space-y-6">
        <WelcomeBanner name={userName} subtitle={subtitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
            <>
              <StatCard label="My Appointments Today" value={myToday.length} icon={CalendarDays} tint="bg-brand-50 text-brand-600" />
              <StatCard label="My Total Records" value={records.length} icon={FileText} tint="bg-blue-50 text-blue-600" />
              <StatCard label="My Patients Seen" value={myPatients.size} icon={Stethoscope} tint="bg-emerald-50 text-emerald-600" />
            </>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="My Today's Appointments" icon={CalendarDays} onNav={onNavigate} action={{ label: 'View all', view: 'appointments' }}>
            {loading ? <SkeletonRows /> : apptList(myToday)}
          </Card>
          <Card title="My Recent Medical Records" icon={FileText} onNav={onNavigate} action={{ label: 'View all', view: 'medical-records' }}>
            {loading ? <SkeletonRows /> : recordList(records)}
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- RECEPTIONIST ---------- */
  if (role === 'receptionist') {
    return (
      <div className="animate-fade-in space-y-6">
        <WelcomeBanner name={userName} subtitle={subtitle} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:flex-1">
            {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
              <>
                <StatCard label="Total Patients" value={patients.length} icon={Users} tint="bg-brand-50 text-brand-600" />
                <StatCard label="Today's Appointments" value={todays.length} icon={CalendarDays} tint="bg-blue-50 text-blue-600" />
                <StatCard label="Low Stock Alerts" value={lowStock.length} icon={AlertCircle} tint="bg-amber-50 text-amber-600" />
              </>
            )}
          </div>
          <button onClick={() => onNavigate('patients')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-95">
            <Users className="h-4 w-4" /> Quick Registration
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Today's Appointments" icon={CalendarDays} onNav={onNavigate} action={{ label: 'View all', view: 'appointments' }}>
            {loading ? <SkeletonRows /> : apptList(todays)}
          </Card>
          <Card title="Recent Patients" icon={Users} onNav={onNavigate} action={{ label: 'View all', view: 'patients' }}>
            {loading ? <SkeletonRows /> : patients.length ? patients.slice(0, 5).map((p) => <PatientRow key={p.id} p={p} />)
              : <EmptyState message="No patients registered yet." />}
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- PATIENT ---------- */
  const myAppts = appointments.filter((a) => a.patient_name === userName);
  const upcoming = myAppts.filter((a) => a.appointment_date >= today);
  const myBills = bills.filter((b) => b.patient_name === userName);
  const outstanding = myBills.filter((b) => b.status !== 'Paid');
  return (
    <div className="animate-fade-in space-y-6">
      <WelcomeBanner name={userName} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard label="Upcoming Appointments" value={upcoming.length} icon={CalendarDays} tint="bg-brand-50 text-brand-600" />
            <StatCard label="Medical Records" value={records.length} icon={FileText} tint="bg-blue-50 text-blue-600" />
            <StatCard label="Outstanding Bills" value={outstanding.length} icon={Receipt} tint="bg-amber-50 text-amber-600" />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="My Appointments" icon={CalendarDays} onNav={onNavigate}>
          {loading ? <SkeletonRows /> : myAppts.length ? myAppts.slice(0, 6).map((a) => <ApptRow key={a.id} a={a} />) : <EmptyState message="No appointments scheduled." />}
        </Card>
        <Card title="My Medical Records" icon={FileText} onNav={onNavigate} action={{ label: 'View all', view: 'medical-records' }}>
          {loading ? <SkeletonRows /> : recordList(records)}
        </Card>
      </div>
      <Card title="My Bills" icon={Receipt} onNav={onNavigate} action={{ label: 'View all', view: 'billing' }}>
        {loading ? <SkeletonRows /> : myBills.length ? myBills.slice(0, 6).map((b) => <BillRow key={b.id} b={b} />) : <EmptyState message="No bills on file." />}
      </Card>
    </div>
  );
}
