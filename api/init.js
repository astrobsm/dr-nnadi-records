import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const query = sql(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);
  try {
    // Create patients table
    await query`
      CREATE TABLE IF NOT EXISTS patients (
        folder_number VARCHAR(100) PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        first_visit DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create records table
    await query`
      CREATE TABLE IF NOT EXISTS records (
        id BIGSERIAL PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        folder_number VARCHAR(100) NOT NULL,
        review_date DATE NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        service_details TEXT NOT NULL,
        fee DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_number) REFERENCES patients(folder_number) ON DELETE CASCADE
      )
    `;

    // Create indexes for better performance
    await query`
      CREATE INDEX IF NOT EXISTS idx_records_date ON records(review_date DESC)
    `;
    
    await query`
      CREATE INDEX IF NOT EXISTS idx_records_folder ON records(folder_number)
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}
