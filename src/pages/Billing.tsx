import { useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, Pencil, Trash2, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { Button, Field, Input, Select } from '../components/Form';
import { Card } from '../components/Card';
import type { Bill, Patient } from '../types';

const STATUSES = ['Pending', 'Paid', 'Overdue'];

const EMPTY: Omit<Bill, 'id' | 'created_at' | 'total_amount'> = {
  patient_name: '',
  bill_number: '',
  room_charges: 0,
  doctor_fees: 0,
  medicine_charges: 0,
  test_charges: 0,
  other_charges: 0,
  status: 'Pending',
  bill_date: new Date().toISOString().split('T')[0],
  payment_mode: 'Cash',
};

interface BillingProps {
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  linkedPatientId: string | null;
}

export default function Billing({ role, linkedPatientId }: BillingProps) {
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Pick<Patient, 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Bill | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let billQuery = supabase.from('bills').select('*').order('bill_date', { ascending: false });
    if (role === 'patient' && linkedPatientId) {
      const { data: pat } = await supabase.from('patients').select('name').eq('id', linkedPatientId).maybeSingle();
      if (pat) billQuery = billQuery.eq('patient_name', pat.name);
    }
    const [b, p] = await Promise.all([
      billQuery,
      supabase.from('patients').select('name').order('name'),
    ]);
    if (b.error) toast(b.error.message, 'error');
    else setBills(b.data ?? []);
    setPatients(p.data ?? []);
    setLoading(false);
  }, [toast, role, linkedPatientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stats = useMemo(() => {
    const total = bills.reduce((s, b) => s + (b.total_amount ?? 0), 0);
    const collected = bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + (b.total_amount ?? 0), 0);
    const pending = bills.filter((b) => b.status === 'Pending').reduce((s, b) => s + (b.total_amount ?? 0), 0);
    return { total, collected, pending, count: bills.length };
  }, [bills]);

  const filtered = bills.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      b.patient_name.toLowerCase().includes(q) ||
      b.bill_number.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, bill_number: `BILL-${new Date().getFullYear()}-${String(bills.length + 1).padStart(3, '0')}` });
    setModalOpen(true);
  };

  const openEdit = (b: Bill) => {
    setEditing(b);
    setForm({
      patient_name: b.patient_name,
      bill_number: b.bill_number,
      room_charges: b.room_charges,
      doctor_fees: b.doctor_fees,
      medicine_charges: b.medicine_charges,
      test_charges: b.test_charges,
      other_charges: b.other_charges,
      status: b.status,
      bill_date: b.bill_date,
      payment_mode: b.payment_mode ?? 'Cash',
    });
    setModalOpen(true);
  };

  const total = form.room_charges + form.doctor_fees + form.medicine_charges + form.test_charges + form.other_charges;

  const save = async () => {
    if (!form.patient_name.trim() || !form.bill_number.trim()) {
      toast('Patient and bill number are required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('bills').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Bill updated');
    } else {
      const { error } = await supabase.from('bills').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Bill created');
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('bills').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Bill deleted');
    setToDelete(null);
    fetchAll();
  };

  const formatDate = (d: string) =>
    new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const SUMMARY_CARDS = [
    { label: 'Total Billed', value: stats.total, icon: DollarSign, accent: 'bg-brand-50 text-brand-600' },
    { label: 'Collected', value: stats.collected, icon: CheckCircle, accent: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, accent: 'bg-amber-50 text-amber-600' },
    { label: 'Total Invoices', value: stats.count, icon: FileText, accent: 'bg-violet-50 text-violet-600', isCount: true },
  ];

  const CHARGE_FIELDS: { key: keyof typeof form; label: string }[] = [
    { key: 'room_charges', label: 'Room Charges' },
    { key: 'doctor_fees', label: 'Doctor Fees' },
    { key: 'medicine_charges', label: 'Medicine Charges' },
    { key: 'test_charges', label: 'Test Charges' },
    { key: 'other_charges', label: 'Other Charges' },
  ];

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Manage patient invoices and payments"
        actionLabel={role === 'patient' ? undefined : 'Create Bill'}
        onAction={role === 'patient' ? undefined : openAdd}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {SUMMARY_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 animate-slide-up" >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900">
                    {s.isCount ? s.value : `$${s.value.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or bill number..." />
        </div>
        <div className="sm:w-44">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No bills found" message="Create a bill to get started." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bill #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Room</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Medicine</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Tests</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand-600">{b.bill_number}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{b.patient_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(b.bill_date)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">${b.room_charges.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">${b.doctor_fees.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">${b.medicine_charges.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">${b.test_charges.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${(b.total_amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {role !== 'patient' && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setToDelete(b)} className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Bill' : 'Create New Bill'}
        subtitle={editing ? `Updating ${editing.bill_number}` : 'Generate an itemized invoice for a patient'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Bill' : 'Create Bill'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient" required>
            <Select value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Bill Number" required>
            <Input value={form.bill_number} onChange={(e) => setForm({ ...form, bill_number: e.target.value })} placeholder="BILL-2024-001" />
          </Field>
          <Field label="Bill Date">
            <Input type="date" value={form.bill_date} onChange={(e) => setForm({ ...form, bill_date: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Charges Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHARGE_FIELDS.map(({ key, label }) => (
              <Field key={key} label={label}>
                <Input
                  type="number"
                  min={0}
                  value={form[key] as number}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-700">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Total Amount</span>
          </div>
          <span className="text-2xl font-bold text-brand-700">${total.toLocaleString()}</span>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Bill"
        message={`Delete bill ${toDelete?.bill_number} for ${toDelete?.patient_name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
