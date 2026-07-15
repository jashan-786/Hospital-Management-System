interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, string> = {
  // General
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  // Availability
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'in surgery': 'bg-rose-50 text-rose-700 ring-rose-600/20',
  'on call': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  // Appointment
  scheduled: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  // Room
  'partially occupied': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  occupied: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  // Admission
  admitted: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  discharged: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  // Bill
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const classes = STATUS_MAP[key] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}
