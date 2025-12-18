import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  const client = await db.connect();
  
  try {
    // GET - Fetch all patients
    if (req.method === 'GET') {
      const { rows } = await client.query(`
        SELECT 
          folder_number as "folderNumber",
          patient_name as "patientName",
          first_visit as "firstVisit",
          created_at as "createdAt"
        FROM patients
        ORDER BY patient_name ASC
      `);
      
      // Convert to object format for compatibility
      const patients = {};
      rows.forEach(patient => {
        patients[patient.folderNumber] = patient;
      });
      
      client.release();
      return res.status(200).json({ success: true, patients });
    }

    client.release();
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    client.release();
    console.error('Patients API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
