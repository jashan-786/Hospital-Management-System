import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pill, AlertTriangle, XCircle, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Medicine } from '../types';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { Field, Input, Select, Button } from '../components/Form';
import DataTable, { type Column } from '../components/DataTable';

const CATEGORIES = [
  'Analgesic', 'Antibiotic', 'Antacid', 'Cardiovascular', 'Antidiabetic',
  'Antihistamine', 'Respiratory', 'Thyroid', 'Supplement', 'Antiseptic', 'Other',
];

const UNITS = ['strip', 'unit', 'bottle', 'box', 'tube'];

const CATEGORY_BADGE: Record<string, string> = {
  Analgesic: 'bg-rose-50 text-rose-700',
  Antibiotic: 'bg-violet-50 text-violet-700',
  Antacid: 'bg-amber-50 text-amber-700',
  Cardiovascular: 'bg-red-50 text-red-700',
  Antidiabetic: 'bg-sky-50 text-sky-700',
  Antihistamine: 'bg-teal-50 text-teal-700',
  Respiratory: 'bg-indigo-50 text-indigo-700',
  Thyroid: 'bg-fuchsia-50 text-fuchsia-700',
  Supplement: 'bg-emerald-50 text-emerald-700',
  Antiseptic: 'bg-cyan-50 text-cyan-700',
  Other: 'bg-slate-100 text-slate-600',
};

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

type MedicineForm = Omit<Medicine, 'id' | 'created_at'>;

const EMPTY_FORM: MedicineForm = {
  name: '',
  generic_name: '',
  category: 'Analgesic',
  manufacturer: '',
  batch_no: '',
  expiry_date: new Date().toISOString().split('T')[0],
  stock_qty: 0,
  reorder_level: 0,
  price_per_unit: 0,
  unit: 'strip',
};

export default function Pharmacy() {
  const { toast } = useToast();
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<MedicineForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Medicine | null>(null);

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('medicines').select('*').order('name');
    if (error) toast(error.message, 'error');
    else setMeds(data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const stats = useMemo(() => {
    const now = Date.now();
    let lowStock = 0;
    let outOfStock = 0;
    let expiringSoon = 0;
    for (const m of meds) {
      if (m.stock_qty === 0) outOfStock++;
      if (m.stock_qty > 0 && m.stock_qty <= m.reorder_level) lowStock++;
      if (m.expiry_date) {
        const t = new Date(m.expiry_date).getTime() - now;
        if (t >= 0 && t <= SIX_MONTHS_MS) expiringSoon++;
      }
    }
    return { total: meds.length, lowStock, outOfStock, expiringSoon };
  }, [meds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return meds.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.generic_name ?? '').toLowerCase().includes(q) ||
        (m.manufacturer ?? '').toLowerCase().includes(q) ||
        (m.batch_no ?? '').toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || m.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [meds, search, categoryFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (m: Medicine) => {
    setEditing(m);
    const { id: _id, created_at: _c, ...rest } = m;
    void _id;
    void _c;
    setForm({ ...rest });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast('Medicine name is required', 'error');
      return;
    }
    if (form.stock_qty < 0 || form.reorder_level < 0 || form.price_per_unit < 0) {
      toast('Numeric values cannot be negative', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      generic_name: form.generic_name || null,
      category: form.category || null,
      manufacturer: form.manufacturer || null,
      batch_no: form.batch_no || null,
      expiry_date: form.expiry_date || null,
    };
    if (editing) {
      const { error } = await supabase.from('medicines').update(payload).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Medicine updated');
    } else {
      const { error } = await supabase.from('medicines').insert(payload);
      if (error) toast(error.message, 'error');
      else toast('Medicine added');
    }
    setSaving(false);
    setModalOpen(false);
    fetchMeds();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('medicines').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Medicine removed');
    setToDelete(null);
    fetchMeds();
  };

  const expiryState = (dateStr: string | null) => {
    if (!dateStr) return { text: '—', className: 'text-slate-400' };
    const t = new Date(dateStr).getTime() - Date.now();
    if (t < 0) return { text: new Date(dateStr).toLocaleDateString(), className: 'text-rose-600 font-medium' };
    if (t <= SIX_MONTHS_MS) return { text: new Date(dateStr).toLocaleDateString(), className: 'text-orange-600 font-medium' };
    return { text: new Date(dateStr).toLocaleDateString(), className: 'text-slate-600' };
  };

  const columns: Column<Medicine>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (m) => (
        <div>
          <p className="font-medium text-slate-900">{m.name}</p>
          {m.generic_name && <p className="text-xs text-slate-500">{m.generic_name}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (m) => {
        const cat = m.category ?? 'Other';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${CATEGORY_BADGE[cat] ?? CATEGORY_BADGE.Other}`}>
            {cat}
          </span>
        );
      },
    },
    { key: 'batch_no', label: 'Batch No', render: (m) => m.batch_no ?? '—' },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      sortable: true,
      render: (m) => {
        const e = expiryState(m.expiry_date);
        return <span className={e.className}>{e.text}</span>;
      },
    },
    {
      key: 'stock_qty',
      label: 'Stock',
      sortable: true,
      render: (m) => {
        const low = m.stock_qty <= m.reorder_level;
        const out = m.stock_qty === 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className={out ? 'text-rose-600 font-medium' : low ? 'text-amber-600 font-medium' : 'text-slate-700'}>
              {m.stock_qty} {m.unit}
            </span>
            {out ? (
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            ) : low ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'price_per_unit',
      label: 'Price/Unit',
      sortable: true,
      render: (m) => (
        <span className="font-medium text-slate-700">
          ${Number(m.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const lowStockIds = useMemo(
    () => new Set(meds.filter((m) => m.stock_qty <= m.reorder_level).map((m) => m.id)),
    [meds],
  );

  const cards = [
    { label: 'Total Medicines', value: stats.total, icon: Pill, iconBg: 'bg-brand-50 text-brand-600' },
    { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, iconBg: 'bg-amber-50 text-amber-600' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: XCircle, iconBg: 'bg-rose-50 text-rose-600' },
    { label: 'Expiring Soon', value: stats.expiringSoon, icon: CalendarClock, iconBg: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        subtitle={`${meds.length} medicines in inventory`}
        actionLabel="Add Medicine"
        onAction={openAdd}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${c.iconBg}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, generic name, manufacturer..." />
        </div>
        <div className="sm:w-48">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onEdit={openEdit}
          onDelete={setToDelete}
          emptyState={<EmptyState title="No medicines found" message="Add medicines to start tracking your inventory." />}
          rowClassName={(row) => (lowStockIds.has(row.id) ? 'bg-amber-50/40' : undefined)}
        />
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Medicine' : 'Add New Medicine'}
        subtitle={editing ? `Updating ${editing.name}` : 'Enter medicine details'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Medicine'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Medicine Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Paracetamol 500mg" />
          </Field>
          <Field label="Generic Name">
            <Input value={form.generic_name ?? ''} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} placeholder="Acetaminophen" />
          </Field>
          <Field label="Category">
            <Select value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Manufacturer">
            <Input value={form.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="Cipla Ltd." />
          </Field>
          <Field label="Batch No.">
            <Input value={form.batch_no ?? ''} onChange={(e) => setForm({ ...form, batch_no: e.target.value })} placeholder="BN-2024-001" />
          </Field>
          <Field label="Expiry Date">
            <Input type="date" value={form.expiry_date ?? ''} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </Field>
          <Field label="Stock Quantity">
            <Input type="number" min={0} value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })} />
          </Field>
          <Field label="Reorder Level">
            <Input type="number" min={0} value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} />
          </Field>
          <Field label="Price per Unit ($)">
            <Input type="number" min={0} step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })} />
          </Field>
          <Field label="Unit">
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Medicine"
        message={`Remove ${toDelete?.name} from the inventory? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
