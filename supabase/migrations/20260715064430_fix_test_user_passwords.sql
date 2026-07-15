/*
# Fix test user password hashes
Re-hash passwords with bcrypt cost factor 10 (Supabase GoTrue standard).
confirmed_at is a generated column (mirrors email_confirmed_at) so we skip it.
*/

UPDATE auth.users 
SET encrypted_password = crypt('Test@1234', gen_salt('bf', 10)),
    updated_at = now(),
    email_confirmed_at = now()
WHERE email IN ('admin@medicare.test', 'doctor@medicare.test', 'reception@medicare.test', 'patient@medicare.test');

SELECT email, left(encrypted_password, 7) as hash_prefix FROM auth.users WHERE email LIKE '%@medicare.test';
