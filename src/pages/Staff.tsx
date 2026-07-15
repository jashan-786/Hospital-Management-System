import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { Button, Field, Input, Select } from '../components/Form';
import type { Staff } from '../types';

const ROLES = [
  'Head Nurse', 'Nurse', 'Lab Technician', 'X-Ray Technician',
  'Receptionist', 'Pharmacist', 'Ward Boy', 'Security',
  'Accountant', 'Janitor', 'Driver',
];

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Emergency', 'Oncology', 'Dermatology', 'General Medicine',
  'ICU', 'Radiology', 'Pharmacy', 'Administration',
];

const SHIFTS = ['Morning', 'Evening', 'Night'];

const EMPTY: Omit<Staff, 'id' | 'created_at'> = {
  name: '',
  role: 'Nurse',
  department: 'General Medicine',
  email: '',
  phone: '',
  shift: 'Morning',
  gender: 'Male',
  salary: 0,
  hire_date: new Date().toISOString().split('T')[0],
  status: 'Active',
};

export default function Staff() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Staff | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('staff').select('*').order('name');
    if (error) toast(error.message, 'error');
    else setStaff(data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = staff
    .filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q);
      const matchesRole = !roleFilter || s.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s: Staff) => { setEditing(s); setForm({ ...s }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      toast('Name and role are required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('staff').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Staff updated');
    } else {
      const { error } = await supabase.from('staff').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Staff added');
    }
    setSaving(false);
    setModalOpen(false);
    fetchStaff();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('staff').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Staff removed');
    setToDelete(null);
    fetchStaff();
  };

  const columns: Column<Staff>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white ${s.gender === 'Female' ? 'bg-pink-400' : 'bg-slate-500'}`}>
            {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="font-medium text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-500">{s.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', sortable: true, render: (s) => <span className="font-medium text-slate-700">{s.role}</span> },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'shift',
      label: 'Shift',
      sortable: true,
      render: (s) => {
        const colors: Record<string, string> = {
          Morning: 'bg-amber-50 text-amber-700',
          Evening: 'bg-brand-50 text-brand-700',
          Night: 'bg-violet-50 text-violet-700',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors[s.shift] ?? 'bg-slate-100 text-slate-600'}`}>
            {s.shift}
          </span>
        );
      },
    },
    { key: 'phone', label: 'Phone', render: (s) => s.phone ?? '—' },
    {
      key: 'salary',
      label: 'Salary',
      sortable: true,
      render: (s) => <span className="font-medium text-slate-700">${s.salary.toLocaleString()}/yr</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle={`${staff.length} hospital staff members`}
        actionLabel="Add Staff"
        onAction={openAdd}
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, role, email..." />
        </div>
        <div className="sm:w-48">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onEdit={openEdit}
          onDelete={setToDelete}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyState={<EmptyState title="No staff found" message="Add staff members to get started." />}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Staff Member' : 'Add Staff Member'}
        subtitle={editing ? `Updating ${editing.name}` : 'Enter staff details'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@hospital.com" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-0100" />
          </Field>
          <Field label="Shift">
            <Select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Salary (annual $)">
            <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
          </Field>
          <Field label="Hire Date">
            <Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Staff Member"
        message={`Remove ${toDelete?.name} from the system? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
