import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET all patients
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          p.folder_number,
          p.patient_name,
          p.first_visit,
          COUNT(r.id) as record_count
        FROM patients p
        LEFT JOIN records r ON p.folder_number = r.folder_number
        GROUP BY p.folder_number, p.patient_name, p.first_visit
        ORDER BY p.patient_name ASC
      `;

      return res.status(200).json({
        success: true,
        patients: rows.map(p => ({
          folderNumber: p.folder_number,
          patientName: p.patient_name,
          firstVisit: p.first_visit.toISOString().split('T')[0],
          recordCount: Number(p.record_count)
        }))
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
