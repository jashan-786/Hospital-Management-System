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
import type { Appointment, Doctor, Patient } from '../types';

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Emergency', 'Oncology', 'Dermatology', 'General Medicine',
];

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];

const EMPTY: Omit<Appointment, 'id' | 'created_at'> = {
  patient_name: '',
  doctor_name: '',
  department: 'Cardiology',
  appointment_date: new Date().toISOString().split('T')[0],
  appointment_time: '09:00',
  reason: '',
  status: 'Scheduled',
};

interface AppointmentsProps {
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  linkedDoctorId: string | null;
  linkedPatientId: string | null;
}

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

export default function Appointments({ role, linkedDoctorId, linkedPatientId }: AppointmentsProps) {
  const { toast } = useToast();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Pick<Doctor, 'name' | 'department'>[]>([]);
  const [patients, setPatients] = useState<Pick<Patient, 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('appointment_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let apptQuery = supabase.from('appointments').select('*').order('appointment_date', { ascending: false });
    if (role === 'doctor' && linkedDoctorId) {
      const { data: doc } = await supabase.from('doctors').select('name').eq('id', linkedDoctorId).maybeSingle();
      if (doc) apptQuery = apptQuery.eq('doctor_name', doc.name);
    }
    if (role === 'patient' && linkedPatientId) {
      const { data: pat } = await supabase.from('patients').select('name').eq('id', linkedPatientId).maybeSingle();
      if (pat) apptQuery = apptQuery.eq('patient_name', pat.name);
    }
    const [a, d, p] = await Promise.all([
      apptQuery,
      supabase.from('doctors').select('name, department').order('name'),
      supabase.from('patients').select('name').order('name'),
    ]);
    if (a.error) toast(a.error.message, 'error');
    else setAppts(a.data ?? []);
    setDoctors(d.data ?? []);
    setPatients(p.data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = appts
    .filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.patient_name.toLowerCase().includes(q) ||
        a.doctor_name.toLowerCase().includes(q) ||
        (a.reason ?? '').toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setForm({ ...a }); setModalOpen(true); };

  const onDoctorChange = (name: string) => {
    const doc = doctors.find((d) => d.name === name);
    setForm((f) => ({ ...f, doctor_name: name, department: doc?.department ?? f.department }));
  };

  const save = async () => {
    if (!form.patient_name.trim() || !form.doctor_name.trim()) {
      toast('Patient and doctor are required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('appointments').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Appointment updated');
    } else {
      const { error } = await supabase.from('appointments').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Appointment scheduled');
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('appointments').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Appointment deleted');
    setToDelete(null);
    fetchAll();
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const columns: Column<Appointment>[] = [
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
      render: (a) => <span className="font-medium text-slate-900">{a.patient_name}</span>,
    },
    { key: 'doctor_name', label: 'Doctor', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    {
      key: 'appointment_date',
      label: 'Date',
      sortable: true,
      render: (a) => formatDate(a.appointment_date),
    },
    {
      key: 'appointment_time',
      label: 'Time',
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1 text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          {a.appointment_time}
        </span>
      ),
    },
    { key: 'reason', label: 'Reason', render: (a) => <span className="text-xs text-slate-600 line-clamp-1 max-w-[180px]">{a.reason ?? '—'}</span> },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${appts.length} total appointments`}
        actionLabel={role === 'patient' ? undefined : 'Schedule Appointment'}
        onAction={role === 'patient' ? undefined : openAdd}
      />

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by patient, doctor, reason..." />
        </div>
        <div className="sm:w-44">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onEdit={role === 'patient' ? undefined : openEdit}
          onDelete={role === 'patient' ? undefined : setToDelete}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          emptyState={<EmptyState title="No appointments found" message="Schedule a new appointment to get started." />}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Appointment' : 'Schedule New Appointment'}
        subtitle={editing ? `Updating appointment for ${editing.patient_name}` : 'Book a patient with a doctor'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Schedule'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient" required className="sm:col-span-2">
            <Select value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Doctor" required>
            <Select value={form.doctor_name} onChange={(e) => onDoctorChange(e.target.value)}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.name} value={d.name}>{d.name} — {d.department}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
          </Field>
          <Field label="Time" required>
            <Select value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })}>
              {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Reason for Visit" className="sm:col-span-2">
            <Textarea rows={3} value={form.reason ?? ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Annual checkup, follow-up..." />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Appointment"
        message={`Delete the appointment for ${toDelete?.patient_name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
