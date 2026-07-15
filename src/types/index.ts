export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'patient';

export interface Profile {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  linked_doctor_id: string | null;
  linked_patient_id: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_doctor: string | null;
  location: string | null;
  contact_ext: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
  availability: string;
  gender: string;
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  patient_code: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  medical_history: string | null;
  allergies: string | null;
  status: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  department: string | null;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  shift: string;
  gender: string;
  salary: number;
  hire_date: string;
  status: string;
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  occupied: number;
  status: string;
  floor: number;
  daily_rate: number;
  created_at: string;
}

export interface Admission {
  id: string;
  patient_name: string;
  doctor_name: string | null;
  room_number: string | null;
  admission_date: string;
  discharge_date: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Bill {
  id: string;
  patient_name: string;
  bill_number: string;
  room_charges: number;
  doctor_fees: number;
  medicine_charges: number;
  test_charges: number;
  other_charges: number;
  total_amount: number;
  status: string;
  bill_date: string;
  payment_mode: string | null;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  category: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  notes: string | null;
  record_date: string;
  created_at: string;
  patient?: Pick<Patient, 'name' | 'patient_code'>;
  doctor?: Pick<Doctor, 'name' | 'specialization'>;
}

export interface PrescriptionItem {
  id: string;
  medical_record_id: string;
  medicine_id: string | null;
  medicine_name: string;
  dosage: string | null;
  duration: string | null;
  quantity: number;
  instructions: string | null;
  created_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  category: string | null;
  manufacturer: string | null;
  batch_no: string | null;
  expiry_date: string | null;
  stock_qty: number;
  reorder_level: number;
  price_per_unit: number;
  unit: string;
  created_at: string;
}
