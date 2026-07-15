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
import { Button, Field, Input, Select, Textarea } from '../components/Form';
import type { Patient } from '../types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY: Omit<Patient, 'id' | 'created_at'> = {
  name: '',
  patient_code: null,
  age: null,
  gender: 'Male',
  blood_group: '',
  phone: '',
  email: '',
  address: '',
  emergency_contact: '',
  medical_history: '',
  allergies: '',
  status: 'Active',
};

export default function Patients() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (error) {
      toast(error.message, 'error');
    } else {
      setPatients(data ?? []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = patients
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? '').toLowerCase().includes(q) ||
        (p.blood_group ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setForm({ ...p });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast('Patient name is required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('patients').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Patient updated successfully');
    } else {
      const { error } = await supabase.from('patients').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Patient registered successfully');
    }
    setSaving(false);
    if (!editing || !form.name) {
      // success path handled by toast
    }
    setModalOpen(false);
    fetchPatients();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('patients').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Patient record deleted');
    setToDelete(null);
    fetchPatients();
  };

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      label: 'Patient',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white ${p.gender === 'Female' ? 'bg-pink-400' : 'bg-brand-500'}`}>
            {p.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="font-medium text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-500">{p.email ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'patient_code',
      label: 'Patient ID',
      sortable: true,
      render: (p) => p.patient_code ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-brand-700 bg-brand-50 font-mono">{p.patient_code}</span>
      ) : '—',
    },
    { key: 'age', label: 'Age', sortable: true, render: (p) => p.age ?? '—' },
    { key: 'gender', label: 'Gender', sortable: true },
    {
      key: 'blood_group',
      label: 'Blood',
      render: (p) =>
        p.blood_group ? (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-bold text-rose-600 bg-rose-50">
            {p.blood_group}
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'phone', label: 'Phone', render: (p) => p.phone ?? '—' },
    { key: 'medical_history', label: 'Medical History', render: (p) => (
      <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">{p.medical_history ?? 'None recorded'}</span>
    ) },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered patients`}
        actionLabel="Register Patient"
        onAction={openAdd}
      />

      <div className="mb-4 max-w-md">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, blood group..." />
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
          emptyState={<EmptyState title="No patients found" message="Register a new patient to get started." />}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Patient' : 'Register New Patient'}
        subtitle={editing ? `Updating ${editing.name}` : 'Enter patient demographic and medical details'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Patient' : 'Register Patient'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </Field>
          <Field label="Age">
            <Input type="number" value={form.age ?? ''} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })} placeholder="45" />
          </Field>
          <Field label="Gender">
            <Select value={form.gender ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Blood Group">
            <Select value={form.blood_group ?? ''} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-0100" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@email.com" />
          </Field>
          <Field label="Emergency Contact" className="sm:col-span-2">
            <Input value={form.emergency_contact ?? ''} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="555-0101 - Jane Doe" />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" />
          </Field>
          <Field label="Medical History" className="sm:col-span-2">
            <Textarea rows={2} value={form.medical_history ?? ''} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} placeholder="Hypertension, diabetes..." />
          </Field>
          <Field label="Allergies" className="sm:col-span-2">
            <Textarea rows={2} value={form.allergies ?? ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Penicillin, latex..." />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Discharged">Discharged</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Patient"
        message={`Are you sure you want to delete ${toDelete?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
