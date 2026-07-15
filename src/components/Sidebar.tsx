import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Building2,
  UserCog,
  BedDouble,
  Receipt,
  Activity,
  HeartPulse,
  Menu,
  X,
  FileText,
  Pill,
  BarChart3,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '../types';
import { roleLabel } from '../hooks/useAuth';

export type View =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'appointments'
  | 'departments'
  | 'staff'
  | 'rooms'
  | 'billing'
  | 'medical-records'
  | 'pharmacy'
  | 'reports';

interface NavItem {
  id: View;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin', 'receptionist', 'patient'] },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { id: 'medical-records', label: 'Medical Records', icon: FileText, roles: ['admin', 'doctor', 'patient'] },
  { id: 'departments', label: 'Departments', icon: Building2, roles: ['admin', 'receptionist', 'patient'] },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, roles: ['admin', 'doctor', 'receptionist'] },
  { id: 'staff', label: 'Staff', icon: UserCog, roles: ['admin'] },
  { id: 'rooms', label: 'Rooms & Admissions', icon: BedDouble, roles: ['admin', 'receptionist'] },
  { id: 'billing', label: 'Billing', icon: Receipt, roles: ['admin', 'receptionist', 'patient'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
];

interface SidebarProps {
  active: View;
  onNavigate: (v: View) => void;
  role: UserRole;
  userName: string;
  onSignOut: () => void;
}

export default function Sidebar({ active, onNavigate, role, userName, onSignOut }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((item) => item.roles.includes(role));
  const handleNav = (v: View) => {
    onNavigate(v);
    setMobileOpen(false);
  };

  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-md border border-slate-200 text-slate-700"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72 bg-brand-900 text-white flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-900/40">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MediCore</h1>
              <p className="text-xs text-brand-200">Hospital Management</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-brand-200 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-300">
            Menu
          </p>
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200 group
                      ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-brand-100 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <Icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${isActive ? 'text-brand-300' : ''}`} />
                    <span>{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-300" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User panel */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-brand-200">{roleLabel(role)}</p>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-brand-200 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-2">
            <span className="flex w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-[11px] text-brand-200">System Online</p>
          </div>
        </div>
      </aside>
    </>
  );
}
