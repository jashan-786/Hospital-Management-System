import { useCallback, useEffect, useState } from 'react';
import { FileText, Plus, Search, Pill, Activity, Stethoscope, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MedicalRecord, PrescriptionItem, Patient, Medicine } from '../types';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Field, Input, Textarea, Select, Button } from '../components/Form';
import StatusBadge from '../components/StatusBadge';
import DataTable, { type Column } from '../components/DataTable';

interface MedicalRecordsProps {
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  linkedDoctorId: string | null;
  linkedPatientId: string | null;
}

interface RxFormItem {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  duration: string;
  quantity: string;
  instructions: string;
}

const emptyRx = (): RxFormItem => ({
  medicine_id: '',
  medicine_name: '',
  dosage: '',
  duration: '',
  quantity: '1',
  instructions: '',
});

const EMPTY_FORM = { patient_id: '', symptoms: '', diagnosis: '', notes: '' };

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const SectionLabel = ({ icon: Icon, children }: { icon: typeof Activity; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
    <Icon className="w-4 h-4" /> {children}
  </div>
);

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <FileText className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">No medical records found</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

export default function MedicalRecords({ role, linkedDoctorId, linkedPatientId }: MedicalRecordsProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Detail modal state
  const [detail, setDetail] = useState<MedicalRecord | null>(null);
  const [detailRx, setDetailRx] = useState<PrescriptionItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [rxItems, setRxItems] = useState<RxFormItem[]>([emptyRx()]);
  const [patients, setPatients] = useState<Pick<Patient, 'id' | 'name' | 'patient_code'>[]>([]);
  const [medicines, setMedicines] = useState<Pick<Medicine, 'id' | 'name' | 'stock_qty'>[]>([]);

  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';

  /* Data fetching */

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('medical_records')
      .select('*, patient:patients(name, patient_code), doctor:doctors(name, specialization)')
      .order('record_date', { ascending: false });

    if (isPatient) {
      if (!linkedPatientId) {
        setRecords([]);
        setLoading(false);
        return;
      }
      query = query.eq('patient_id', linkedPatientId);
    } else if (isDoctor && !showAll) {
      if (!linkedDoctorId) {
        setRecords([]);
        setLoading(false);
        return;
      }
      query = query.eq('doctor_id', linkedDoctorId);
    }

    const { data, error } = await query;
    if (error) toast(error.message, 'error');
    else setRecords(data ?? []);
    setLoading(false);
  }, [isPatient, isDoctor, linkedPatientId, linkedDoctorId, showAll, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const openDetail = async (record: MedicalRecord) => {
    setDetail(record);
    setDetailRx([]);
    setDetailLoading(true);
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('medical_record_id', record.id);
    if (error) toast(error.message, 'error');
    else setDetailRx(data ?? []);
    setDetailLoading(false);
  };

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    setRxItems([emptyRx()]);
    setCreateOpen(true);
    const [p, m] = await Promise.all([
      supabase.from('patients').select('id, name, patient_code').order('name'),
      supabase.from('medicines').select('id, name, stock_qty').order('name'),
    ]);
    if (p.error) toast(p.error.message, 'error');
    else setPatients(p.data ?? []);
    if (m.error) toast(m.error.message, 'error');
    else setMedicines(m.data ?? []);
  };

  /* Prescription helpers */

  const updateRx = (i: number, patch: Partial<RxFormItem>) =>
    setRxItems((items) => items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const onMedicineChange = (i: number, medicineId: string) => {
    const med = medicines.find((m) => m.id === medicineId);
    updateRx(i, { medicine_id: medicineId, medicine_name: med?.name ?? '' });
  };

  /* Save record */

  const saveRecord = async () => {
    if (!form.patient_id) {
      toast('Please select a patient', 'error');
      return;
    }
    if (!form.symptoms.trim() || !form.diagnosis.trim()) {
      toast('Symptoms and diagnosis are required', 'error');
      return;
    }
    setSaving(true);

    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: form.patient_id,
        doctor_id: linkedDoctorId,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        notes: form.notes || null,
        record_date: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (error) {
      toast(error.message, 'error');
      setSaving(false);
      return;
    }

    const validRx = rxItems.filter((r) => r.medicine_name.trim());
    if (validRx.length > 0) {
      const { error: rxError } = await supabase.from('prescription_items').insert(
        validRx.map((r) => ({
          medical_record_id: data.id,
          medicine_id: r.medicine_id || null,
          medicine_name: r.medicine_name,
          dosage: r.dosage || null,
          duration: r.duration || null,
          quantity: Number(r.quantity) || 1,
          instructions: r.instructions || null,
        })),
      );
      if (rxError) toast(rxError.message, 'error');
    }

    toast('Medical record created successfully');
    setSaving(false);
    setCreateOpen(false);
    fetchRecords();
  };

  /* Derived data */

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.patient?.name ?? '').toLowerCase().includes(q) ||
      (r.diagnosis ?? '').toLowerCase().includes(q)
    );
  });

  const columns: Column<MedicalRecord>[] = [
    {
      key: 'patient',
      label: 'Patient Name',
      render: (r) => (
        <button onClick={() => openDetail(r)} className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-brand-600 transition-colors text-left">
          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
          {r.patient?.name ?? '—'}
        </button>
      ),
    },
    { key: 'patient_code', label: 'Patient Code', render: (r) => <span className="text-xs font-mono text-slate-500">{r.patient?.patient_code ?? '—'}</span> },
    { key: 'doctor', label: 'Doctor', render: (r) => r.doctor?.name ?? '—' },
    { key: 'symptoms', label: 'Symptoms', render: (r) => <span className="text-xs text-slate-600 line-clamp-1 max-w-[160px]">{r.symptoms ?? '—'}</span> },
    { key: 'diagnosis', label: 'Diagnosis', render: (r) => <span className="text-xs text-slate-600 line-clamp-1 max-w-[160px]">{r.diagnosis ?? '—'}</span> },
    { key: 'record_date', label: 'Date', render: (r) => fmtDate(r.record_date) },
    { key: 'status', label: 'Status', render: () => <StatusBadge status="Completed" /> },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600"><FileText className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Records</h1>
            <p className="mt-0.5 text-sm text-slate-500">{records.length} electronic health records</p>
          </div>
        </div>
        {isDoctor && (<Button onClick={openCreate}><Plus className="w-4 h-4" />New Record</Button>)}
      </div>

      {/* Search + doctor filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by patient name or diagnosis..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-slate-400" />
        </div>
        {isDoctor && (
          <label className="inline-flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Show all records
          </label>
        )}
      </div>

      {/* Records table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyState={<EmptyState message={isPatient ? 'You have no medical records yet.' : 'Create a new record to get started.'} />}
        />
      </div>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Medical Record Details"
        subtitle={detail ? `Recorded on ${fmtDate(detail.record_date)}` : ''}
        size="lg"
        footer={<Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>}
      >
        {detail && (
          <div className="space-y-6">
            {/* Patient & Doctor info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <SectionLabel icon={Activity}>Patient</SectionLabel>
                <p className="text-sm font-semibold text-slate-900">{detail.patient?.name ?? '—'}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{detail.patient?.patient_code ?? 'No code'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <SectionLabel icon={Stethoscope}>Doctor</SectionLabel>
                <p className="text-sm font-semibold text-slate-900">{detail.doctor?.name ?? '—'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{detail.doctor?.specialization ?? 'General'}</p>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <SectionLabel icon={Activity}>Symptoms</SectionLabel>
              <p className="text-sm text-slate-700 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                {detail.symptoms ?? '—'}
              </p>
            </div>

            {/* Diagnosis */}
            <div>
              <SectionLabel icon={Stethoscope}>Diagnosis</SectionLabel>
              <p className="text-sm text-slate-700 bg-brand-50/50 border border-brand-100 rounded-lg p-3">
                {detail.diagnosis ?? '—'}
              </p>
            </div>

            {/* Notes */}
            {detail.notes && (
              <div>
                <SectionLabel icon={FileText}>Notes</SectionLabel>
                <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-3">{detail.notes}</p>
              </div>
            )}

            {/* Prescriptions */}
            <div>
              <SectionLabel icon={Pill}>Prescriptions</SectionLabel>
              {detailLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : detailRx.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No prescriptions recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {detailRx.map((rx, i) => (
                    <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">{i + 1}</span>
                          <span className="text-sm font-semibold text-slate-900">{rx.medicine_name}</span>
                        </div>
                        <span className="text-xs text-slate-400">Qty: {rx.quantity}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                        {rx.dosage && <div><span className="text-slate-400">Dosage:</span> {rx.dosage}</div>}
                        {rx.duration && <div><span className="text-slate-400">Duration:</span> {rx.duration}</div>}
                        {rx.instructions && (
                          <div className="col-span-2 sm:col-span-3"><span className="text-slate-400">Instructions:</span> {rx.instructions}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Medical Record"
        subtitle="Create a record with prescription"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={saveRecord} disabled={saving}>
              {saving ? 'Saving...' : 'Save Record'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Record form */}
          <div className="grid grid-cols-1 gap-4">
            <Field label="Patient" required>
              <Select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} {p.patient_code ? `(${p.patient_code})` : ''}</option>
                ))}
              </Select>
            </Field>
            <Field label="Symptoms" required>
              <Textarea rows={2} value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="Chief complaints and symptoms..." />
            </Field>
            <Field label="Diagnosis" required>
              <Input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Primary diagnosis..." />
            </Field>
            <Field label="Notes">
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional clinical notes..." />
            </Field>
          </div>

          {/* Prescription items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Pill className="w-4 h-4 text-brand-600" />
                Prescription Items
              </div>
              <Button variant="secondary" size="sm" onClick={() => setRxItems([...rxItems, emptyRx()])}>
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {rxItems.map((rx, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Item {i + 1}</span>
                    {rxItems.length > 1 && (
                      <button onClick={() => setRxItems(rxItems.filter((_, idx) => idx !== i))} className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" aria-label="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Medicine" className="sm:col-span-2">
                      <Select value={rx.medicine_id} onChange={(e) => onMedicineChange(i, e.target.value)}>
                        <option value="">Select medicine</option>
                        {medicines.map((m) => <option key={m.id} value={m.id}>{m.name} (Stock: {m.stock_qty})</option>)}
                      </Select>
                    </Field>
                    <Field label="Dosage"><Input value={rx.dosage} onChange={(e) => updateRx(i, { dosage: e.target.value })} placeholder="500mg twice daily" /></Field>
                    <Field label="Duration"><Input value={rx.duration} onChange={(e) => updateRx(i, { duration: e.target.value })} placeholder="7 days" /></Field>
                    <Field label="Quantity"><Input type="number" value={rx.quantity} onChange={(e) => updateRx(i, { quantity: e.target.value })} placeholder="14" /></Field>
                    <Field label="Instructions"><Input value={rx.instructions} onChange={(e) => updateRx(i, { instructions: e.target.value })} placeholder="After meals" /></Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
