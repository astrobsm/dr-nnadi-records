import { sql } from '@vercel/postgres';
import { createResponse } from './db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return createResponse({ success: true }, 200);
  }

  try {
    // GET - Fetch all patients
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          folder_number as "folderNumber",
          patient_name as "patientName",
          first_visit as "firstVisit",
          created_at as "createdAt"
        FROM patients
        ORDER BY patient_name ASC
      `;
      
      // Convert to object format for compatibility
      const patients = {};
      rows.forEach(patient => {
        patients[patient.folderNumber] = patient;
      });
      
      return createResponse({ success: true, patients });
    }

    return createResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Patients API error:', error);
    return createResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
}
