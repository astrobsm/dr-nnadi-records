import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1
});

export default async function handler(req, res) {
  let client;
  try {
    client = await pool.connect();
    
    // Create patients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id BIGSERIAL PRIMARY KEY,
        folder_number TEXT UNIQUE NOT NULL,
        patient_name TEXT NOT NULL,
        first_visit DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create records table
    await client.query(`
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
      )
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_records_folder_number ON records(folder_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_records_review_date ON records(review_date DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_patients_folder_number ON patients(folder_number)`);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Supabase database initialized successfully!' 
    });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (client) client.release();
  }
}
