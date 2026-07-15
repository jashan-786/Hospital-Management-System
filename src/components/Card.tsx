interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  accent: 'brand' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
}

const ACCENT_MAP = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100' },
};

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent }: StatCardProps) {
  const c = ACCENT_MAP[accent];
  return (
    <Card className="p-5 hover:shadow-md transition-shadow animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ring-8 ${c.bg} ${c.text} ${c.ring}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </Card>
  );
}
