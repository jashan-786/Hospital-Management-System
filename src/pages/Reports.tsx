import { useEffect, useState } from 'react';
import {
  BarChart3,
  DollarSign,
  CalendarDays,
  Pill,
  AlertTriangle,
  TrendingUp,
  Stethoscope,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Bill = { total_amount: number; status: string; bill_date: string };
type Appointment = { doctor_name: string; status: string; appointment_date: string };
type Medicine = {
  name: string;
  stock_qty: number;
  reorder_level: number;
  expiry_date: string;
  batch_no: string;
};
type Doctor = { name: string; department: string };

const STATUS_COLORS: Record<string, string> = {
  Scheduled: 'bg-blue-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-rose-500',
  'No-show': 'bg-amber-500',
};

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

function StatBox({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-44 items-end gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="h-32 w-full animate-pulse rounded-md bg-slate-200" />
          <div className="h-3 w-8 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [financial, setFinancial] = useState({
    revenue: 0,
    pending: 0,
    totalBills: 0,
    avg: 0,
  });
  const [daily, setDaily] = useState<{ label: string; value: number }[]>([]);
  const [doctorPerf, setDoctorPerf] = useState<
    { name: string; department: string; count: number }[]
  >([]);
  const [apptStats, setApptStats] = useState({
    total: 0,
    byStatus: [] as { status: string; count: number }[],
    today: 0,
  });
  const [lowStock, setLowStock] = useState<Medicine[]>([]);
  const [expiring, setExpiring] = useState<Medicine[]>([]);

  useEffect(() => {
    async function load() {
      const [billsRes, apptsRes, medsRes, docsRes] = await Promise.all([
        supabase.from('bills').select('total_amount, status, bill_date, patient_name'),
        supabase.from('appointments').select('doctor_name, status, appointment_date'),
        supabase.from('medicines').select('name, stock_qty, reorder_level, expiry_date, batch_no'),
        supabase.from('doctors').select('name, department'),
      ]);

      const bills: Bill[] = billsRes.data ?? [];
      const appts: Appointment[] = apptsRes.data ?? [];
      const meds: Medicine[] = medsRes.data ?? [];
      const doctors: Doctor[] = docsRes.data ?? [];

      // Financial summary
      const paid = bills.filter((b) => b.status === 'Paid');
      const pending = bills.filter((b) => b.status === 'Pending');
      const revenue = paid.reduce((s, b) => s + Number(b.total_amount), 0);
      const pendingAmt = pending.reduce((s, b) => s + Number(b.total_amount), 0);
      const avg = bills.length ? revenue / bills.length : 0;
      setFinancial({
        revenue,
        pending: pendingAmt,
        totalBills: bills.length,
        avg,
      });

      // Last 7 days revenue
      const days: { label: string; value: number }[] = [];
      const todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayMid.getTime() - i * 86400000);
        const next = new Date(d.getTime() + 86400000);
        const value = bills
          .filter((b) => {
            const bd = new Date(b.bill_date).getTime();
            return b.status === 'Paid' && bd >= d.getTime() && bd < next.getTime();
          })
          .reduce((s, b) => s + Number(b.total_amount), 0);
        days.push({
          label: d.toLocaleDateString('en', { weekday: 'short' }),
          value,
        });
      }
      setDaily(days);

      // Doctor performance — appointment count per doctor
      const countByDoc: Record<string, number> = {};
      appts.forEach((a) => {
        countByDoc[a.doctor_name] = (countByDoc[a.doctor_name] ?? 0) + 1;
      });
      const perf = doctors
        .map((d) => ({
          name: d.name,
          department: d.department,
          count: countByDoc[d.name] ?? 0,
        }))
        .sort((a, b) => b.count - a.count);
      setDoctorPerf(perf);

      // Appointment statistics
      const statusMap: Record<string, number> = {};
      appts.forEach((a) => {
        statusMap[a.status] = (statusMap[a.status] ?? 0) + 1;
      });
      const order = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];
      const byStatus = order
        .filter((s) => statusMap[s])
        .map((s) => ({ status: s, count: statusMap[s] }));
      const todayStr = new Date().toISOString().slice(0, 10);
      const today = appts.filter(
        (a) => a.appointment_date?.slice(0, 10) === todayStr
      ).length;
      setApptStats({ total: appts.length, byStatus, today });

      // Pharmacy alerts
      setLowStock(meds.filter((m) => Number(m.stock_qty) <= Number(m.reorder_level)));
      const now = Date.now();
      setExpiring(
        meds
          .filter((m) => {
            const diff = new Date(m.expiry_date).getTime() - now;
            return diff <= SIX_MONTHS_MS && diff > -365 * 86400000;
          })
          .sort(
            (a, b) =>
              new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
          )
      );

      setLoading(false);
    }
    load();
  }, []);

  const fmtMoney = (n: number) =>
    '$' + n.toLocaleString('en', { maximumFractionDigits: 0 });
  const maxDaily = Math.max(...daily.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600">
          <BarChart3 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">
            Financial, clinical, and pharmacy insights at a glance
          </p>
        </div>
      </div>

      {/* Financial Summary — full width */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-800">Financial Summary</h2>
        </div>
        {loading ? (
          <CardSkeleton rows={1} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatBox
                icon={TrendingUp}
                label="Total Revenue"
                value={fmtMoney(financial.revenue)}
                tint="bg-emerald-500"
              />
              <StatBox
                icon={DollarSign}
                label="Pending Payments"
                value={fmtMoney(financial.pending)}
                tint="bg-amber-500"
              />
              <StatBox
                icon={Activity}
                label="Total Bills"
                value={financial.totalBills.toLocaleString()}
                tint="bg-brand-600"
              />
              <StatBox
                icon={DollarSign}
                label="Avg. Bill Amount"
                value={fmtMoney(financial.avg)}
                tint="bg-sky-500"
              />
            </div>

            {/* Bar chart */}
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-slate-600">
                Revenue — last 7 days
              </p>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <div className="flex h-44 items-end gap-3">
                  {daily.map((d, i) => {
                    const h = (d.value / maxDaily) * 140;
                    return (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <span className="text-[10px] font-semibold text-slate-500">
                          {d.value > 0 ? fmtMoney(d.value) : ''}
                        </span>
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-md bg-brand-600 transition-all"
                            style={{ height: `${Math.max(h, 4)}px` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Doctor Performance + Appointment Statistics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Doctor Performance */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-800">Doctor Performance</h2>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : doctorPerf.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No doctor data available
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Doctor</th>
                    <th className="px-4 py-2.5 font-semibold">Department</th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Appointments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorPerf.map((d) => (
                    <tr key={d.name} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{d.department}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                          {d.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appointment Statistics */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Appointment Statistics
            </h2>
          </div>
          {loading ? (
            <CardSkeleton />
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Total Appointments
                  </p>
                  <p className="text-2xl font-bold text-slate-800">
                    {apptStats.total}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">Today</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {apptStats.today}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {apptStats.byStatus.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">
                    No appointment data available
                  </p>
                ) : (
                  apptStats.byStatus.map((s) => {
                    const pct = apptStats.total
                      ? (s.count / apptStats.total) * 100
                      : 0;
                    const color =
                      STATUS_COLORS[s.status] ?? 'bg-slate-400';
                    return (
                      <div key={s.status}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {s.status}
                          </span>
                          <span className="text-slate-500">
                            {s.count} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${color} transition-all`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pharmacy Alerts */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-800">Pharmacy Alerts</h2>
        </div>
        {loading ? (
          <CardSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Low stock */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Low Stock ({lowStock.length})
                </h3>
              </div>
              {lowStock.length === 0 ? (
                <p className="rounded-lg bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-600">
                  All medicines are well stocked
                </p>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {m.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Batch {m.batch_no}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-600">
                          {m.stock_qty} left
                        </p>
                        <p className="text-xs text-slate-400">
                          reorder @ {m.reorder_level}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Expiring */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Expiring within 6 months ({expiring.length})
                </h3>
              </div>
              {expiring.length === 0 ? (
                <p className="rounded-lg bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-600">
                  No medicines expiring soon
                </p>
              ) : (
                <ul className="space-y-2">
                  {expiring.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {m.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Batch {m.batch_no}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-rose-600">
                          {new Date(m.expiry_date).toLocaleDateString('en', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-400">expiry date</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
