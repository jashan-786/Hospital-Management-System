import { useCallback, useEffect, useState } from 'react';
import { BedDouble, ArrowRightCircle, Pencil, Trash2, DoorOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { Button, Field, Input, Select, Textarea } from '../components/Form';
import type { Room, Admission, Patient, Doctor } from '../types';

const ROOM_TYPES = ['General Ward', 'Private Room', 'ICU', 'Deluxe Suite', 'Pediatric Ward', 'Emergency Bay'];
const TABS = ['rooms', 'admissions'] as const;
type Tab = (typeof TABS)[number];

const EMPTY_ROOM: Omit<Room, 'id' | 'created_at'> = {
  room_number: '',
  room_type: 'General Ward',
  capacity: 1,
  occupied: 0,
  status: 'Available',
  floor: 1,
  daily_rate: 0,
};

const EMPTY_ADM: Omit<Admission, 'id' | 'created_at'> = {
  patient_name: '',
  doctor_name: '',
  room_number: '',
  admission_date: new Date().toISOString().split('T')[0],
  discharge_date: null,
  reason: '',
  status: 'Admitted',
};

export default function Rooms() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Pick<Patient, 'name'>[]>([]);
  const [doctors, setDoctors] = useState<Pick<Doctor, 'name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'room' | 'admission'>('room');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingAdm, setEditingAdm] = useState<Admission | null>(null);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [admForm, setAdmForm] = useState(EMPTY_ADM);
  const [saving, setSaving] = useState(false);
  const [toDeleteRoom, setToDeleteRoom] = useState<Room | null>(null);
  const [toDeleteAdm, setToDeleteAdm] = useState<Admission | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [r, a, p, d] = await Promise.all([
      supabase.from('rooms').select('*').order('room_number'),
      supabase.from('admissions').select('*').order('admission_date', { ascending: false }),
      supabase.from('patients').select('name').order('name'),
      supabase.from('doctors').select('name').order('name'),
    ]);
    if (r.error) toast(r.error.message, 'error');
    else setRooms(r.data ?? []);
    setAdmissions(a.data ?? []);
    setPatients(p.data ?? []);
    setDoctors(d.data ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Room handlers
  const openAddRoom = () => { setEditingRoom(null); setEditingAdm(null); setRoomForm(EMPTY_ROOM); setModalMode('room'); setModalOpen(true); };
  const openEditRoom = (r: Room) => { setEditingRoom(r); setEditingAdm(null); setRoomForm({ ...r }); setModalMode('room'); setModalOpen(true); };

  const saveRoom = async () => {
    if (!roomForm.room_number.trim()) {
      toast('Room number is required', 'error');
      return;
    }
    const occupied = roomForm.occupied;
    const capacity = roomForm.capacity;
    const status = occupied >= capacity ? 'Occupied' : occupied > 0 ? 'Partially Occupied' : 'Available';
    const payload = { ...roomForm, status };
    setSaving(true);
    if (editingRoom) {
      const { error } = await supabase.from('rooms').update(payload).eq('id', editingRoom.id);
      if (error) toast(error.message, 'error');
      else toast('Room updated');
    } else {
      const { error } = await supabase.from('rooms').insert(payload);
      if (error) toast(error.message, 'error');
      else toast('Room added');
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  };

  const confirmDeleteRoom = async () => {
    if (!toDeleteRoom) return;
    const { error } = await supabase.from('rooms').delete().eq('id', toDeleteRoom.id);
    if (error) toast(error.message, 'error');
    else toast('Room deleted');
    setToDeleteRoom(null);
    fetchAll();
  };

  // Admission handlers
  const openAddAdm = () => { setEditingAdm(null); setEditingRoom(null); setAdmForm(EMPTY_ADM); setModalMode('admission'); setModalOpen(true); };
  const openEditAdm = (a: Admission) => { setEditingAdm(a); setEditingRoom(null); setAdmForm({ ...a }); setModalMode('admission'); setModalOpen(true); };

  const saveAdmission = async () => {
    if (!admForm.patient_name.trim()) {
      toast('Patient is required', 'error');
      return;
    }
    setSaving(true);
    if (editingAdm) {
      const { error } = await supabase.from('admissions').update(admForm).eq('id', editingAdm.id);
      if (error) toast(error.message, 'error');
      else toast('Admission updated');
    } else {
      const { error } = await supabase.from('admissions').insert(admForm);
      if (error) toast(error.message, 'error');
      else toast('Patient admitted');
    }
    setSaving(false);
    setModalOpen(false);
    fetchAll();
  };

  const confirmDeleteAdm = async () => {
    if (!toDeleteAdm) return;
    const { error } = await supabase.from('admissions').delete().eq('id', toDeleteAdm.id);
    if (error) toast(error.message, 'error');
    else toast('Admission record deleted');
    setToDeleteAdm(null);
    fetchAll();
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isRoomModal = modalOpen && modalMode === 'room';
  const isAdmModal = modalOpen && modalMode === 'admission';

  return (
    <div>
      <PageHeader
        title="Rooms & Admissions"
        subtitle="Manage hospital rooms and patient admissions"
        actionLabel={tab === 'rooms' ? 'Add Room' : 'New Admission'}
        onAction={tab === 'rooms' ? openAddRoom : openAddAdm}
      />

      {/* Tabs */}
      <div className="mb-5 inline-flex p-1 bg-slate-100 rounded-lg">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
              tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : tab === 'rooms' ? (
        rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <EmptyState title="No rooms" message="Add a room to manage bed capacity." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((r, idx) => {
              const pct = Math.round((r.occupied / r.capacity) * 100);
              const isFull = r.occupied >= r.capacity;
              return (
                <div
                  key={r.id}
                  className="group relative bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-all animate-slide-up"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${
                      isFull ? 'bg-rose-50 text-rose-600' : r.occupied > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditRoom(r)} className="p-1.5 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setToDeleteRoom(r)} className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{r.room_number}</h3>
                    <span className="text-xs text-slate-400">Floor {r.floor}</span>
                  </div>
                  <p className="text-sm text-slate-500">{r.room_type}</p>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>Occupancy</span>
                      <span className="font-medium text-slate-700">{r.occupied}/{r.capacity}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-400' : r.occupied > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">${r.daily_rate}/day</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Admissions tab */
        admissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm">
            <EmptyState title="No admissions" message="Admit a patient to create a record." />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Room</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Admitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Discharged</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightCircle className="w-4 h-4 text-brand-400" />
                        <span className="font-medium text-slate-900">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.doctor_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-brand-700 bg-brand-50">
                        <DoorOpen className="w-3 h-3" /> {a.room_number ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(a.admission_date)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(a.discharge_date)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 line-clamp-1 max-w-[160px]">{a.reason ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditAdm(a)} className="p-1.5 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setToDeleteAdm(a)} className="p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Room Modal */}
      <Modal
        open={isRoomModal}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        subtitle={editingRoom ? `Updating ${editingRoom.room_number}` : 'Create a new hospital room'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveRoom} disabled={saving}>{saving ? 'Saving...' : editingRoom ? 'Update' : 'Add Room'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Room Number" required>
            <Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} placeholder="A-101" />
          </Field>
          <Field label="Room Type">
            <Select value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}>
              {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Capacity">
            <Input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
          </Field>
          <Field label="Occupied">
            <Input type="number" min={0} value={roomForm.occupied} onChange={(e) => setRoomForm({ ...roomForm, occupied: Number(e.target.value) })} />
          </Field>
          <Field label="Floor">
            <Input type="number" value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })} />
          </Field>
          <Field label="Daily Rate ($)">
            <Input type="number" value={roomForm.daily_rate} onChange={(e) => setRoomForm({ ...roomForm, daily_rate: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>

      {/* Admission Modal */}
      <Modal
        open={isAdmModal}
        onClose={() => setModalOpen(false)}
        title={editingAdm ? 'Edit Admission' : 'New Admission'}
        subtitle={editingAdm ? `Updating record for ${editingAdm.patient_name}` : 'Admit a patient to a room'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAdmission} disabled={saving}>{saving ? 'Saving...' : editingAdm ? 'Update' : 'Admit Patient'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient" required className="sm:col-span-2">
            <Select value={admForm.patient_name} onChange={(e) => setAdmForm({ ...admForm, patient_name: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Doctor">
            <Select value={admForm.doctor_name ?? ''} onChange={(e) => setAdmForm({ ...admForm, doctor_name: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Room">
            <Select value={admForm.room_number ?? ''} onChange={(e) => setAdmForm({ ...admForm, room_number: e.target.value })}>
              <option value="">Select room</option>
              {rooms.map((r) => <option key={r.id} value={r.room_number}>{r.room_number} — {r.room_type}</option>)}
            </Select>
          </Field>
          <Field label="Admission Date" required>
            <Input type="date" value={admForm.admission_date} onChange={(e) => setAdmForm({ ...admForm, admission_date: e.target.value })} />
          </Field>
          <Field label="Discharge Date">
            <Input type="date" value={admForm.discharge_date ?? ''} onChange={(e) => setAdmForm({ ...admForm, discharge_date: e.target.value || null })} />
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <Select value={admForm.status} onChange={(e) => setAdmForm({ ...admForm, status: e.target.value })}>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
            </Select>
          </Field>
          <Field label="Reason for Admission" className="sm:col-span-2">
            <Textarea rows={3} value={admForm.reason ?? ''} onChange={(e) => setAdmForm({ ...admForm, reason: e.target.value })} placeholder="Post-surgery recovery..." />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDeleteRoom}
        title="Delete Room"
        message={`Remove room ${toDeleteRoom?.room_number}? This action cannot be undone.`}
        onConfirm={confirmDeleteRoom}
        onCancel={() => setToDeleteRoom(null)}
      />
      <ConfirmDialog
        open={!!toDeleteAdm}
        title="Delete Admission"
        message={`Delete the admission record for ${toDeleteAdm?.patient_name}? This action cannot be undone.`}
        onConfirm={confirmDeleteAdm}
        onCancel={() => setToDeleteAdm(null)}
      />
    </div>
  );
}
