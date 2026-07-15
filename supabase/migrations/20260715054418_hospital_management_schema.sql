/*
# Hospital Management System — Schema & Seed Data

## Overview
Creates a complete schema for an Online Hospital Management System (single-tenant, no auth).
This is a demo/admin tool with intentionally shared data, so all tables use anon+authenticated
policies (no ownership scoping).

## New Tables
1. `departments` — hospital departments (Cardiology, Neurology, etc.)
2. `doctors` — doctors with specialty, contact, availability
3. `patients` — registered patients with demographics
4. `appointments` — patient-doctor appointments with status
5. `staff` — hospital staff (nurses, technicians, admin) with roles
6. `rooms` — hospital rooms with type, status, capacity
7. `admissions` — patient admissions/discharges linked to rooms
8. `bills` — patient billing records with itemized charges and status

## Security
- RLS enabled on all tables.
- Policies allow anon+authenticated full CRUD (intentionally shared demo data).
*/

-- ===== DEPARTMENTS =====
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  head_doctor text,
  location text,
  contact_ext text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE TO anon, authenticated USING (true);

-- ===== DOCTORS =====
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  department text NOT NULL,
  email text,
  phone text,
  qualification text,
  experience_years int DEFAULT 0,
  consultation_fee numeric(10,2) DEFAULT 0,
  availability text DEFAULT 'Available',
  gender text DEFAULT 'Male',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE TO anon, authenticated USING (true);

-- ===== PATIENTS =====
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age int,
  gender text,
  blood_group text,
  phone text,
  email text,
  address text,
  emergency_contact text,
  medical_history text,
  allergies text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE TO anon, authenticated USING (true);

-- ===== APPOINTMENTS =====
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  doctor_name text NOT NULL,
  department text,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  reason text,
  status text DEFAULT 'Scheduled',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE TO anon, authenticated USING (true);

-- ===== STAFF =====
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  department text,
  email text,
  phone text,
  shift text DEFAULT 'Morning',
  gender text DEFAULT 'Male',
  salary numeric(10,2) DEFAULT 0,
  hire_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- ===== ROOMS =====
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  room_type text NOT NULL,
  capacity int DEFAULT 1,
  occupied int DEFAULT 0,
  status text DEFAULT 'Available',
  floor int DEFAULT 1,
  daily_rate numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE TO anon, authenticated USING (true);

-- ===== ADMISSIONS =====
CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  doctor_name text,
  room_number text,
  admission_date date NOT NULL DEFAULT CURRENT_DATE,
  discharge_date date,
  reason text,
  status text DEFAULT 'Admitted',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_admissions" ON admissions;
CREATE POLICY "anon_select_admissions" ON admissions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_admissions" ON admissions;
CREATE POLICY "anon_insert_admissions" ON admissions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_admissions" ON admissions;
CREATE POLICY "anon_update_admissions" ON admissions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_admissions" ON admissions;
CREATE POLICY "anon_delete_admissions" ON admissions FOR DELETE TO anon, authenticated USING (true);

-- ===== BILLS =====
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  bill_number text NOT NULL,
  room_charges numeric(10,2) DEFAULT 0,
  doctor_fees numeric(10,2) DEFAULT 0,
  medicine_charges numeric(10,2) DEFAULT 0,
  test_charges numeric(10,2) DEFAULT 0,
  other_charges numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) GENERATED ALWAYS AS (room_charges + doctor_fees + medicine_charges + test_charges + other_charges) STORED,
  status text DEFAULT 'Pending',
  bill_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bills" ON bills;
CREATE POLICY "anon_select_bills" ON bills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bills" ON bills;
CREATE POLICY "anon_insert_bills" ON bills FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bills" ON bills;
CREATE POLICY "anon_update_bills" ON bills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bills" ON bills;
CREATE POLICY "anon_delete_bills" ON bills FOR DELETE TO anon, authenticated USING (true);

-- ===== SEED DATA =====
INSERT INTO departments (name, description, head_doctor, location, contact_ext) VALUES
('Cardiology', 'Heart and cardiovascular system care', 'Dr. Robert Chen', 'Block A, Floor 2', '201'),
('Neurology', 'Brain and nervous system treatment', 'Dr. Sarah Mitchell', 'Block B, Floor 3', '202'),
('Orthopedics', 'Bone, joint and musculoskeletal care', 'Dr. James Wilson', 'Block A, Floor 1', '203'),
('Pediatrics', 'Medical care for infants and children', 'Dr. Emily Davis', 'Block C, Floor 1', '204'),
('Emergency', '24/7 emergency and trauma care', 'Dr. Michael Brown', 'Block D, Ground Floor', '205'),
('Oncology', 'Cancer diagnosis and treatment', 'Dr. Lisa Anderson', 'Block B, Floor 4', '206'),
('Dermatology', 'Skin, hair and nail conditions', 'Dr. Kevin Lee', 'Block C, Floor 2', '207'),
('General Medicine', 'Primary care and general health', 'Dr. Patricia Garcia', 'Block A, Floor 3', '208')
ON CONFLICT DO NOTHING;

INSERT INTO doctors (name, specialization, department, email, phone, qualification, experience_years, consultation_fee, availability, gender) VALUES
('Dr. Robert Chen', 'Interventional Cardiologist', 'Cardiology', 'r.chen@hospital.com', '555-0101', 'MD, FACC', 18, 350, 'Available', 'Male'),
('Dr. Sarah Mitchell', 'Neurologist', 'Neurology', 's.mitchell@hospital.com', '555-0102', 'MD, PhD', 15, 320, 'Available', 'Female'),
('Dr. James Wilson', 'Orthopedic Surgeon', 'Orthopedics', 'j.wilson@hospital.com', '555-0103', 'MD, MS Ortho', 20, 400, 'In Surgery', 'Male'),
('Dr. Emily Davis', 'Pediatrician', 'Pediatrics', 'e.davis@hospital.com', '555-0104', 'MD, FAAP', 12, 250, 'Available', 'Female'),
('Dr. Michael Brown', 'Emergency Physician', 'Emergency', 'm.brown@hospital.com', '555-0105', 'MD, FACEP', 10, 300, 'On Call', 'Male'),
('Dr. Lisa Anderson', 'Oncologist', 'Oncology', 'l.anderson@hospital.com', '555-0106', 'MD, FACP', 22, 450, 'Available', 'Female'),
('Dr. Kevin Lee', 'Dermatologist', 'Dermatology', 'k.lee@hospital.com', '555-0107', 'MD, FAAD', 8, 200, 'Available', 'Male'),
('Dr. Patricia Garcia', 'General Physician', 'General Medicine', 'p.garcia@hospital.com', '555-0108', 'MD, FACP', 14, 180, 'Available', 'Female'),
('Dr. David Kim', 'Cardiac Surgeon', 'Cardiology', 'd.kim@hospital.com', '555-0109', 'MD, FACS', 16, 500, 'In Surgery', 'Male'),
('Dr. Anna Martinez', 'Pediatric Neurologist', 'Pediatrics', 'a.martinez@hospital.com', '555-0110', 'MD, PhD', 9, 280, 'Available', 'Female')
ON CONFLICT DO NOTHING;

INSERT INTO patients (name, age, gender, blood_group, phone, email, address, emergency_contact, medical_history, allergies, status) VALUES
('John Thompson', 54, 'Male', 'O+', '555-1001', 'john.t@email.com', '123 Oak Street, Springfield', '555-1002 - Mary Thompson', 'Hypertension, previous heart surgery', 'Penicillin', 'Active'),
('Sarah Johnson', 32, 'Female', 'A+', '555-1003', 'sarah.j@email.com', '456 Elm Avenue, Riverdale', '555-1004 - Tom Johnson', 'Asthma', 'None', 'Active'),
('Michael Rodriguez', 67, 'Male', 'B+', '555-1005', 'mike.r@email.com', '789 Pine Road, Westfield', '555-1006 - Elena Rodriguez', 'Diabetes Type 2, Arthritis', 'Aspirin', 'Active'),
('Emily White', 8, 'Female', 'O-', '555-1007', 'parent@email.com', '321 Maple Lane, Greenfield', '555-1008 - David White', 'Recurrent ear infections', 'None', 'Active'),
('Robert Harris', 45, 'Male', 'AB+', '555-1009', 'r.harris@email.com', '654 Cedar Blvd, Lakeside', '555-1010 - Susan Harris', 'Sleep apnea', 'Sulfa drugs', 'Active'),
('Jessica Martinez', 28, 'Female', 'A-', '555-1011', 'j.martinez@email.com', '987 Birch Street, Hilltown', '555-1012 - Carlos Martinez', 'Migraine', 'Latex', 'Active'),
('William Clark', 71, 'Male', 'O+', '555-1013', 'w.clark@email.com', '147 Spruce Ave, Fairfield', '555-1014 - Nancy Clark', 'Chronic kidney disease', 'None', 'Active'),
('Olivia Taylor', 3, 'Female', 'A+', '555-1015', 'parent@email.com', '258 Willow Way, Brookside', '555-1016 - Mark Taylor', 'Premature birth, regular checkups', 'None', 'Active'),
('Daniel Lee', 39, 'Male', 'B-', '555-1017', 'd.lee@email.com', '369 Aspen Court, Meadowbrook', '555-1018 - Amy Lee', 'Sports injury - ACL tear', 'None', 'Active'),
('Sophia Garcia', 56, 'Female', 'AB-', '555-1019', 's.garcia@email.com', '741 Poplar Drive, Eastview', '555-1020 - Jose Garcia', 'Breast cancer survivor', 'Codeine', 'Active'),
('Thomas Anderson', 60, 'Male', 'O+', '555-1021', 't.anderson@email.com', '852 Walnut Street, Sunnyvale', '555-1022 - Linda Anderson', 'COPD, former smoker', 'None', 'Active'),
('Ava Robinson', 15, 'Female', 'A+', '555-1023', 'ava.r@email.com', '963 Chestnut Lane, Valleybrook', '555-1024 - Greg Robinson', 'Scoliosis', 'None', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO appointments (patient_name, doctor_name, department, appointment_date, appointment_time, reason, status) VALUES
('John Thompson', 'Dr. Robert Chen', 'Cardiology', CURRENT_DATE, '09:00', 'Follow-up post surgery', 'Scheduled'),
('Sarah Johnson', 'Dr. Patricia Garcia', 'General Medicine', CURRENT_DATE, '10:30', 'Annual checkup', 'Scheduled'),
('Michael Rodriguez', 'Dr. Lisa Anderson', 'Oncology', CURRENT_DATE, '11:00', 'Chemotherapy session', 'Completed'),
('Emily White', 'Dr. Emily Davis', 'Pediatrics', CURRENT_DATE, '14:00', 'Ear infection check', 'Scheduled'),
('Robert Harris', 'Dr. Sarah Mitchell', 'Neurology', CURRENT_DATE + 1, '09:30', 'Sleep study consultation', 'Scheduled'),
('Jessica Martinez', 'Dr. Sarah Mitchell', 'Neurology', CURRENT_DATE + 1, '11:00', 'Migraine management', 'Scheduled'),
('William Clark', 'Dr. Patricia Garcia', 'General Medicine', CURRENT_DATE + 1, '13:00', 'Kidney function review', 'Scheduled'),
('Olivia Taylor', 'Dr. Emily Davis', 'Pediatrics', CURRENT_DATE + 2, '10:00', 'Developmental checkup', 'Scheduled'),
('Daniel Lee', 'Dr. James Wilson', 'Orthopedics', CURRENT_DATE + 2, '15:30', 'ACL surgery consultation', 'Scheduled'),
('Sophia Garcia', 'Dr. Lisa Anderson', 'Oncology', CURRENT_DATE, '16:00', 'Post-treatment follow-up', 'Completed'),
('Thomas Anderson', 'Dr. Robert Chen', 'Cardiology', CURRENT_DATE + 3, '09:00', 'COPD and heart check', 'Scheduled'),
('Ava Robinson', 'Dr. James Wilson', 'Orthopedics', CURRENT_DATE + 3, '14:00', 'Scoliosis evaluation', 'Cancelled')
ON CONFLICT DO NOTHING;

INSERT INTO staff (name, role, department, email, phone, shift, gender, salary, hire_date, status) VALUES
('Nancy Parker', 'Head Nurse', 'Emergency', 'n.parker@hospital.com', '555-2001', 'Morning', 'Female', 72000, '2018-03-15', 'Active'),
('Mark Turner', 'Nurse', 'Cardiology', 'm.turner@hospital.com', '555-2002', 'Morning', 'Male', 58000, '2020-07-01', 'Active'),
('Linda Martinez', 'Nurse', 'Pediatrics', 'l.martinez@hospital.com', '555-2003', 'Evening', 'Female', 56000, '2019-11-20', 'Active'),
('James Cooper', 'Lab Technician', 'General Medicine', 'j.cooper@hospital.com', '555-2004', 'Morning', 'Male', 48000, '2021-02-10', 'Active'),
('Patricia Hill', 'Receptionist', 'General Medicine', 'p.hill@hospital.com', '555-2005', 'Morning', 'Female', 38000, '2022-01-05', 'Active'),
('Steven Lee', 'X-Ray Technician', 'Radiology', 's.lee@hospital.com', '555-2006', 'Evening', 'Male', 52000, '2020-09-15', 'Active'),
('Karen White', 'Head Nurse', 'ICU', 'k.white@hospital.com', '555-2007', 'Night', 'Female', 75000, '2017-06-01', 'Active'),
('Donald Harris', 'Pharmacist', 'Pharmacy', 'd.harris@hospital.com', '555-2008', 'Morning', 'Male', 85000, '2016-04-12', 'Active'),
('Betty Clark', 'Ward Boy', 'General Medicine', 'b.clark@hospital.com', '555-2009', 'Night', 'Female', 32000, '2023-01-10', 'Active'),
('Ronald Adams', 'Security', 'Administration', 'r.adams@hospital.com', '555-2010', 'Night', 'Male', 36000, '2021-08-20', 'Active'),
('Maria Santos', 'Nurse', 'Neurology', 'm.santos@hospital.com', '555-2011', 'Evening', 'Female', 54000, '2022-03-15', 'Active'),
('George King', 'Accountant', 'Administration', 'g.king@hospital.com', '555-2012', 'Morning', 'Male', 62000, '2019-05-01', 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_number, room_type, capacity, occupied, status, floor, daily_rate) VALUES
('A-101', 'General Ward', 4, 3, 'Partially Occupied', 1, 200),
('A-102', 'General Ward', 4, 4, 'Occupied', 1, 200),
('A-103', 'General Ward', 4, 0, 'Available', 1, 200),
('B-201', 'Private Room', 1, 1, 'Occupied', 2, 500),
('B-202', 'Private Room', 1, 0, 'Available', 2, 500),
('B-203', 'Private Room', 1, 1, 'Occupied', 2, 500),
('C-301', 'ICU', 1, 1, 'Occupied', 3, 1200),
('C-302', 'ICU', 1, 0, 'Available', 3, 1200),
('C-303', 'ICU', 1, 1, 'Occupied', 3, 1200),
('D-401', 'Deluxe Suite', 1, 0, 'Available', 4, 2500),
('D-402', 'Deluxe Suite', 1, 1, 'Occupied', 4, 2500),
('E-501', 'Pediatric Ward', 4, 2, 'Partially Occupied', 5, 300),
('E-502', 'Pediatric Ward', 4, 0, 'Available', 5, 300),
('F-601', 'Emergency Bay', 6, 4, 'Partially Occupied', 0, 350)
ON CONFLICT DO NOTHING;

INSERT INTO admissions (patient_name, doctor_name, room_number, admission_date, discharge_date, reason, status) VALUES
('John Thompson', 'Dr. Robert Chen', 'B-201', CURRENT_DATE - 2, NULL, 'Post-surgery recovery', 'Admitted'),
('Michael Rodriguez', 'Dr. Lisa Anderson', 'C-301', CURRENT_DATE - 5, NULL, 'Chemotherapy treatment', 'Admitted'),
('William Clark', 'Dr. Patricia Garcia', 'C-303', CURRENT_DATE - 1, NULL, 'Kidney failure management', 'Admitted'),
('Sophia Garcia', 'Dr. Lisa Anderson', 'D-402', CURRENT_DATE - 3, CURRENT_DATE, 'Post-treatment observation', 'Discharged'),
('Thomas Anderson', 'Dr. Robert Chen', 'B-203', CURRENT_DATE - 1, NULL, 'COPD exacerbation', 'Admitted'),
('Robert Harris', 'Dr. Sarah Mitchell', 'A-101', CURRENT_DATE - 4, CURRENT_DATE, 'Sleep study', 'Discharged'),
('Emily White', 'Dr. Emily Davis', 'E-501', CURRENT_DATE, NULL, 'Ear infection treatment', 'Admitted'),
('Daniel Lee', 'Dr. James Wilson', 'A-102', CURRENT_DATE - 1, NULL, 'Pre-surgery preparation', 'Admitted')
ON CONFLICT DO NOTHING;

INSERT INTO bills (patient_name, bill_number, room_charges, doctor_fees, medicine_charges, test_charges, other_charges, status, bill_date) VALUES
('John Thompson', 'BILL-2024-001', 1000, 700, 250, 450, 100, 'Paid', CURRENT_DATE - 2),
('Sarah Johnson', 'BILL-2024-002', 0, 180, 45, 120, 0, 'Paid', CURRENT_DATE - 1),
('Michael Rodriguez', 'BILL-2024-003', 6000, 1350, 800, 900, 250, 'Pending', CURRENT_DATE),
('Emily White', 'BILL-2024-004', 300, 250, 80, 150, 30, 'Pending', CURRENT_DATE),
('Robert Harris', 'BILL-2024-005', 800, 640, 200, 350, 75, 'Paid', CURRENT_DATE - 1),
('Sophia Garcia', 'BILL-2024-006', 7500, 1350, 1200, 1500, 400, 'Pending', CURRENT_DATE),
('Thomas Anderson', 'BILL-2024-007', 500, 180, 150, 280, 50, 'Pending', CURRENT_DATE),
('William Clark', 'BILL-2024-008', 1200, 180, 300, 600, 100, 'Pending', CURRENT_DATE)
ON CONFLICT DO NOTHING;