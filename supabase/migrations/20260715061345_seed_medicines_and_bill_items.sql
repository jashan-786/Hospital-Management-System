/*
# Add unique constraint on patient_code and seed new tables
1. Make patient_code unique
2. Seed medicines (20 common medicines with batch/expiry)
3. Seed bill_items for existing bills
*/

-- Unique constraint on patient_code
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_patient_code_key') THEN
    ALTER TABLE patients ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);
  END IF;
END $$;

-- Seed medicines
INSERT INTO medicines (name, generic_name, category, manufacturer, batch_no, expiry_date, stock_qty, reorder_level, price_per_unit, unit) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Analgesic', 'Cipla', 'PCM2024A', '2027-06-30', 250, 50, 2.50, 'strip'),
('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', 'Sun Pharma', 'AMX2024B', '2026-12-31', 180, 40, 15.00, 'strip'),
('Omeprazole 20mg', 'Omeprazole', 'Antacid', 'Dr. Reddy''s', 'OMP2024C', '2027-03-15', 120, 30, 8.00, 'strip'),
('Aspirin 75mg', 'Acetylsalicylic Acid', 'Cardiovascular', 'Bayer', 'ASP2024D', '2027-08-20', 200, 50, 3.50, 'strip'),
('Metformin 500mg', 'Metformin', 'Antidiabetic', 'Glenmark', 'MTF2024E', '2026-10-10', 90, 25, 5.00, 'strip'),
('Atorvastatin 10mg', 'Atorvastatin', 'Cardiovascular', 'Pfizer', 'ATV2024F', '2027-01-05', 60, 20, 12.00, 'strip'),
('Azithromycin 500mg', 'Azithromycin', 'Antibiotic', 'Hetero', 'AZT2024G', '2026-09-30', 45, 30, 25.00, 'strip'),
('Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 'Cipla', 'CTZ2024H', '2027-04-18', 300, 60, 2.00, 'strip'),
('Pantoprazole 40mg', 'Pantoprazole', 'Antacid', 'Alkem', 'PTP2024I', '2026-11-25', 8, 30, 10.00, 'strip'),
('Ibuprofen 400mg', 'Ibuprofen', 'Analgesic', 'Abbott', 'IBU2024J', '2027-07-12', 150, 40, 4.00, 'strip'),
('Salbutamol Inhaler', 'Salbutamol', 'Respiratory', 'Cipla', 'SBL2024K', '2026-08-15', 35, 15, 180.00, 'unit'),
('Insulin Glargine', 'Insulin Glargine', 'Antidiabetic', 'Sanofi', 'INS2024L', '2026-06-20', 22, 10, 450.00, 'unit'),
('Ranitidine 150mg', 'Ranitidine', 'Antacid', 'Zydus', 'RNT2024M', '2027-02-28', 110, 35, 3.50, 'strip'),
('Losartan 50mg', 'Losartan', 'Cardiovascular', 'Torrent', 'LST2024N', '2027-05-10', 75, 25, 7.00, 'strip'),
('Levothyroxine 50mcg', 'Levothyroxine', 'Thyroid', 'Abbott', 'LTN2024O', '2026-12-15', 40, 20, 9.00, 'strip'),
('Vitamin D3 60K', 'Cholecalciferol', 'Supplement', 'Mankind', 'VTD2024P', '2028-01-31', 500, 100, 1.50, 'strip'),
('Cefixime 200mg', 'Cefixime', 'Antibiotic', 'MacLeod', 'CFX2024Q', '2026-07-08', 5, 25, 18.00, 'strip'),
('Diclofenac 50mg', 'Diclofenac', 'Analgesic', 'Novartis', 'DCF2024R', '2027-09-22', 130, 40, 3.00, 'strip'),
('Montelukast 10mg', 'Montelukast', 'Respiratory', 'Sun Pharma', 'MTK2024S', '2026-10-05', 55, 20, 11.00, 'strip'),
('Povidone Iodine 5%', 'Povidone Iodine', 'Antiseptic', 'Win Medicare', 'PVI2024T', '2028-03-12', 80, 20, 45.00, 'unit')
ON CONFLICT DO NOTHING;

-- Seed bill_items for existing bills (2-3 items each)
INSERT INTO bill_items (bill_id, description, quantity, unit_price, amount, category)
SELECT b.id, 'Consultation Fee', 1, b.doctor_fees, b.doctor_fees, 'consultation'
FROM bills b WHERE b.doctor_fees > 0
ON CONFLICT DO NOTHING;

INSERT INTO bill_items (bill_id, description, quantity, unit_price, amount, category)
SELECT b.id, 'Room Charges', 1, b.room_charges, b.room_charges, 'room'
FROM bills b WHERE b.room_charges > 0
ON CONFLICT DO NOTHING;

INSERT INTO bill_items (bill_id, description, quantity, unit_price, amount, category)
SELECT b.id, 'Medicine Charges', 1, b.medicine_charges, b.medicine_charges, 'pharmacy'
FROM bills b WHERE b.medicine_charges > 0
ON CONFLICT DO NOTHING;

INSERT INTO bill_items (bill_id, description, quantity, unit_price, amount, category)
SELECT b.id, 'Lab Test Charges', 1, b.test_charges, b.test_charges, 'lab'
FROM bills b WHERE b.test_charges > 0
ON CONFLICT DO NOTHING;
