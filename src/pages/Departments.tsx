import { useCallback, useEffect, useState } from 'react';
import { Building2, MapPin, Phone, Stethoscope, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { Button, Field, Input, Textarea } from '../components/Form';
import type { Department, Doctor } from '../types';

const EMPTY: Omit<Department, 'id' | 'created_at'> = {
  name: '',
  description: '',
  head_doctor: '',
  location: '',
  contact_ext: '',
};

export default function Departments() {
  const { toast } = useToast();
  const [depts, setDepts] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Pick<Doctor, 'name' | 'department'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Department | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [d, doc] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('doctors').select('name, department'),
    ]);
    if (d.error) toast(d.error.message, 'error');
    else setDepts(d.data ?? []);
    setDoctors(doc.data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getDoctorCount = (deptName: string) =>
    doctors.filter((d) => d.department === deptName).length;

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setForm({ ...d }); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) {
      toast('Department name is required', 'error');
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('departments').update(form).eq('id', editing.id);
      if (error) toast(error.message, 'error');
      else toast('Department updated');
    } else {
      const { error } = await supabase.from('departments').insert(form);
      if (error) toast(error.message, 'error');
      else toast('Department created');
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('departments').delete().eq('id', toDelete.id);
    if (error) toast(error.message, 'error');
    else toast('Department removed');
    setToDelete(null);
    fetchAll();
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Departments" subtitle="Hospital departments and specialties" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200/70 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle={`${depts.length} hospital departments`}
        actionLabel="Add Department"
        onAction={openAdd}
      />

      {depts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
          <EmptyState title="No departments" message="Create a department to organize doctors and services." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map((d, idx) => (
            <div
              key={d.id}
              className="group relative bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-all animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(d)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(d)}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{d.name}</h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                {d.description ?? 'No description available'}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                {d.head_doctor && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Stethoscope className="w-4 h-4 text-slate-400" />
                    <span>{d.head_doctor}</span>
                  </div>
                )}
                {d.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{d.location}</span>
                  </div>
                )}
                {d.contact_ext && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>Ext. {d.contact_ext}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Doctors</span>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold text-brand-700 bg-brand-50">
                  {getDoctorCount(d.name)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add New Department'}
        subtitle={editing ? `Updating ${editing.name}` : 'Create a new hospital department'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Department Name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cardiology" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Heart and cardiovascular care..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Head Doctor">
              <Input value={form.head_doctor ?? ''} onChange={(e) => setForm({ ...form, head_doctor: e.target.value })} placeholder="Dr. Jane Smith" />
            </Field>
            <Field label="Contact Extension">
              <Input value={form.contact_ext ?? ''} onChange={(e) => setForm({ ...form, contact_ext: e.target.value })} placeholder="201" />
            </Field>
          </div>
          <Field label="Location">
            <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Block A, Floor 2" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Department"
        message={`Remove ${toDelete?.name} from the system? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
