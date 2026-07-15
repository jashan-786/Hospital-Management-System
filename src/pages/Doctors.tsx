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
import type { Doctor } from '../types';

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Emergency', 'Oncology', 'Dermatology', 'General Medicine',
];

const EMPTY: Omit<Doctor, 'id' | 'created_at'> = {
  name: '',
  specialization: '',
  department: 'Cardiology',
  email: '',
  phone: '',
  qualification: '',
  experience_years: 0,
  consultation_fee: 0,
  availability: 'Available',
  gender: 'Male',
};

export default function Doctors() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('doctors').select('*').order('name');
    if (error) toast(error.message, 'error');
    else setDoctors(data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = doctors
    .filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch =
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        (d.email ?? '').toLowerCase().includes(q);
      const matchesDept = !deptFilter || d.department === deptFilter;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (d: Doctor) => { setEditing(d); setForm({ ...d }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim() || !form.specialization.trim()) {
      toast('Name and specialization are required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('doctors').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Doctor updated successfully');
    } else {
      const { error } = await supabase.from('doctors').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Doctor added successfully');
    }
    setSaving(false);
    setModalOpen(false);
    fetchDoctors();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('doctors').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Doctor record removed');
    setToDelete(null);
    fetchDoctors();
  };

  const columns: Column<Doctor>[] = [
    {
      key: 'name',
      label: 'Doctor',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white ${d.gender === 'Female' ? 'bg-pink-400' : 'bg-brand-500'}`}>
            {d.name.replace('Dr. ', '').split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="font-medium text-slate-900">{d.name}</p>
            <p className="text-xs text-slate-500">{d.specialization}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'qualification', label: 'Qualification', render: (d) => d.qualification ?? '—' },
    {
      key: 'experience_years',
      label: 'Experience',
      sortable: true,
      render: (d) => `${d.experience_years} yrs`,
    },
    {
      key: 'consultation_fee',
      label: 'Fee',
      sortable: true,
      render: (d) => <span className="font-medium text-slate-700">${d.consultation_fee}</span>,
    },
    { key: 'phone', label: 'Contact', render: (d) => d.phone ?? '—' },
    {
      key: 'availability',
      label: 'Availability',
      sortable: true,
      render: (d) => <StatusBadge status={d.availability} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle={`${doctors.length} medical professionals`}
        actionLabel="Add Doctor"
        onAction={openAdd}
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, specialization..." />
        </div>
        <div className="sm:w-52">
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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
          emptyState={<EmptyState title="No doctors found" message="Add a doctor to get started." />}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Doctor' : 'Add New Doctor'}
        subtitle={editing ? `Updating ${editing.name}` : 'Enter doctor credentials and specialty'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Doctor' : 'Add Doctor'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" />
          </Field>
          <Field label="Specialization" required>
            <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiologist" />
          </Field>
          <Field label="Department">
            <Select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
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
            <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@hospital.com" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-0100" />
          </Field>
          <Field label="Qualification">
            <Input value={form.qualification ?? ''} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="MD, FACP" />
          </Field>
          <Field label="Experience (years)">
            <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} />
          </Field>
          <Field label="Consultation Fee ($)">
            <Input type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })} />
          </Field>
          <Field label="Availability">
            <Select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
              <option value="Available">Available</option>
              <option value="In Surgery">In Surgery</option>
              <option value="On Call">On Call</option>
              <option value="Off Duty">Off Duty</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Doctor"
        message={`Remove ${toDelete?.name} from the system? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
