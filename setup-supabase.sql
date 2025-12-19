-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  folder_number TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  first_visit DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create records table
CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  patient_name TEXT NOT NULL,
  folder_number TEXT NOT NULL,
  review_date DATE NOT NULL,
  hospital_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  service_details TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_records_folder_number ON records(folder_number);
CREATE INDEX IF NOT EXISTS idx_records_review_date ON records(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_patients_folder_number ON patients(folder_number);
