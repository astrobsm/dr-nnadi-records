import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDB() {
  try {
    // Create patients table
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        folder_number VARCHAR(100) PRIMARY KEY,
        patient_name VARCHAR(255) NOT NULL,
        first_visit DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create records table
    await sql`
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_date ON records(review_date DESC)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_records_folder ON records(folder_number)
    `;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Helper function to handle CORS
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Helper function to create response
export function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
