/*
# Create test users for all roles
Creates auth.users entries and matching profiles for testing the role-based login system.
All passwords are: Test@1234 (hashed via crypt)
Roles: admin, doctor, receptionist, patient
*/

-- Insert test users into auth.users
-- Using the same password hash format Supabase uses (bcrypt)
-- Password for all: Test@1234

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role, raw_app_meta_data, raw_user_meta_data)
SELECT
  gen_random_uuid(),
  email,
  crypt('Test@1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  jsonb_build_object('role', role_val),
  jsonb_build_object('full_name', full_name_val)
FROM (VALUES
  ('admin@medicare.test', 'admin', 'System Administrator'),
  ('doctor@medicare.test', 'doctor', 'Dr. Sarah Chen'),
  ('reception@medicare.test', 'receptionist', 'Reception Desk'),
  ('patient@medicare.test', 'patient', 'John Doe')
) AS t(email, role_val, full_name_val)
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = t.email);

-- Create profiles for these users
INSERT INTO profiles (user_id, full_name, email, role, linked_doctor_id)
SELECT
  au.id,
  au.raw_user_meta_data->>'full_name',
  au.email,
  au.raw_app_meta_data->>'role',
  d.id
FROM auth.users au
LEFT JOIN doctors d ON d.name = 'Dr. Sarah Chen'
WHERE au.email = 'doctor@medicare.test'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = au.id);

INSERT INTO profiles (user_id, full_name, email, role)
SELECT au.id, au.raw_user_meta_data->>'full_name', au.email, au.raw_app_meta_data->>'role'
FROM auth.users au
WHERE au.email IN ('admin@medicare.test', 'reception@medicare.test', 'patient@medicare.test')
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = au.id);
