/*
# Hospital Management System v2 — Add Auth, Medical Records, Pharmacy, Bill Items

## Purpose
Restructures the HMS to match the MCA project report requirements:
- Role-based login (Admin, Doctor, Receptionist, Patient)
- Medical records (EMR) with prescriptions
- Pharmacy / medicine inventory with batch/expiry tracking
- Bill items for itemized billing

## New Tables
### profiles — auth role extension (admin/doctor/receptionist/patient)
### medical_records — patient encounter: symptoms, diagnosis, notes
### prescription_items — line items per medical record
### medicines — pharmacy inventory with batch/expiry/reorder
### bill_items — itemized billing line items

## Modified Tables
- patients: add patient_code column
- bills: add payment_mode column

## Security
- All new tables: anon+authenticated CRUD (single-tenant hospital app)
*/

-- ============================================================
-- 1. profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'doctor', 'receptionist', 'patient')),
  linked_doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  linked_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. medical_records table
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  symptoms text,
  diagnosis text,
  notes text,
  record_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_medical_records" ON medical_records;
CREATE POLICY "anon_select_medical_records" ON medical_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medical_records" ON medical_records;
CREATE POLICY "anon_insert_medical_records" ON medical_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medical_records" ON medical_records;
CREATE POLICY "anon_update_medical_records" ON medical_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medical_records" ON medical_records;
CREATE POLICY "anon_delete_medical_records" ON medical_records FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. medicines table
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  category text,
  manufacturer text,
  batch_no text,
  expiry_date date,
  stock_qty integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 10,
  price_per_unit numeric(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'strip',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_medicines" ON medicines;
CREATE POLICY "anon_select_medicines" ON medicines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_medicines" ON medicines;
CREATE POLICY "anon_insert_medicines" ON medicines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_medicines" ON medicines;
CREATE POLICY "anon_update_medicines" ON medicines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_medicines" ON medicines;
CREATE POLICY "anon_delete_medicines" ON medicines FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. prescription_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name text NOT NULL,
  dosage text,
  duration text,
  quantity integer NOT NULL DEFAULT 1,
  instructions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_prescription_items" ON prescription_items;
CREATE POLICY "anon_select_prescription_items" ON prescription_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_prescription_items" ON prescription_items;
CREATE POLICY "anon_insert_prescription_items" ON prescription_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_prescription_items" ON prescription_items;
CREATE POLICY "anon_update_prescription_items" ON prescription_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_prescription_items" ON prescription_items;
CREATE POLICY "anon_delete_prescription_items" ON prescription_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. bill_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'consultation',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bill_items" ON bill_items;
CREATE POLICY "anon_select_bill_items" ON bill_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bill_items" ON bill_items;
CREATE POLICY "anon_insert_bill_items" ON bill_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bill_items" ON bill_items;
CREATE POLICY "anon_update_bill_items" ON bill_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bill_items" ON bill_items;
CREATE POLICY "anon_delete_bill_items" ON bill_items FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. Add columns to existing tables
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'patient_code') THEN
    ALTER TABLE patients ADD COLUMN patient_code text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'payment_mode') THEN
    ALTER TABLE bills ADD COLUMN payment_mode text DEFAULT 'Cash';
  END IF;
END $$;

-- Generate patient_code for existing patients using a CTE subquery
UPDATE patients SET patient_code = sub.code
FROM (
  SELECT id, 'P' || lpad((ROW_NUMBER() OVER (ORDER BY created_at))::text, 4, '0') AS code
  FROM patients
) sub
WHERE patients.id = sub.id AND patients.patient_code IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_record_id ON prescription_items(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
