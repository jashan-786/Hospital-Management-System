/*
# Seed medical records and prescription items
Creates sample medical records for existing patients with prescriptions.
*/

-- Seed medical records (one per patient, linked to a doctor)
INSERT INTO medical_records (patient_id, doctor_id, symptoms, diagnosis, notes, record_date)
SELECT p.id, d.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Fever, headache, body ache'
    WHEN 1 THEN 'Chest pain, shortness of breath'
    WHEN 2 THEN 'Abdominal pain, nausea'
    WHEN 3 THEN 'Joint pain, swelling'
    ELSE 'Cough, sore throat, fatigue'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Viral fever with dehydration'
    WHEN 1 THEN 'Hypertension with mild CAD'
    WHEN 2 THEN 'Acute gastritis'
    WHEN 3 THEN 'Osteoarthritis'
    ELSE 'Upper respiratory tract infection'
  END,
  'Patient advised rest and follow-up in 1 week. Prescribed symptomatic treatment.',
  p.created_at
FROM patients p
CROSS JOIN LATERAL (SELECT id FROM doctors WHERE doctors.department = p.status LIMIT 1) d
WHERE NOT EXISTS (SELECT 1 FROM medical_records mr WHERE mr.patient_id = p.id)
LIMIT 8;

-- Also insert some records with any doctor for patients not covered
INSERT INTO medical_records (patient_id, doctor_id, symptoms, diagnosis, notes, record_date)
SELECT p.id, (SELECT id FROM doctors ORDER BY random() LIMIT 1),
  'Routine checkup, mild hypertension',
  'Stage 1 hypertension',
  'Advised lifestyle modifications and medication.',
  p.created_at
FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM medical_records mr WHERE mr.patient_id = p.id)
LIMIT 4;

-- Seed prescription items for medical records
INSERT INTO prescription_items (medical_record_id, medicine_id, medicine_name, dosage, duration, quantity, instructions)
SELECT mr.id, m.id, m.name,
  CASE (random() * 3)::int
    WHEN 0 THEN '1 tablet twice daily'
    WHEN 1 THEN '1 tablet thrice daily'
    ELSE '1 tablet once daily'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN '5 days'
    WHEN 1 THEN '7 days'
    ELSE '10 days'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 1 ELSE 2
  END,
  'Take after meals'
FROM medical_records mr
CROSS JOIN LATERAL (SELECT id, name FROM medicines ORDER BY random() LIMIT 1) m
WHERE NOT EXISTS (SELECT 1 FROM prescription_items pi WHERE pi.medical_record_id = mr.id);
