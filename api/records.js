import pg from 'pg';
const { Pool } = pg;

// Create a connection pool with Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1 // Limit pool size for serverless
});

export default async function handler(req, res) {
  let client;
  try {
    client = await pool.connect();
    
    // GET - Fetch all records
    if (req.method === 'GET') {
      const result = await client.query(`
        SELECT * FROM records 
        ORDER BY review_date DESC, created_at DESC
        LIMIT 100
      `);
      
      const rows = result.rows.map(r => ({
        id: Number(r.id),
        patientName: r.patient_name,
        folderNumber: r.folder_number,
        reviewDate: new Date(r.review_date).toISOString().split('T')[0],
        hospitalName: r.hospital_name,
        serviceType: r.service_type,
        serviceDetails: r.service_details,
        fee: Number(r.fee),
        notes: r.notes || '',
        createdAt: new Date(r.created_at).toISOString()
      }));
      
      return res.status(200).json({ success: true, records: rows });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const {
        patientName,
        folderNumber,
        reviewDate,
        hospitalName,
        serviceType,
        serviceDetails,
        fee,
        notes
      } = req.body;

      // First, upsert patient
      await client.query(`
        INSERT INTO patients (folder_number, patient_name, first_visit)
        VALUES ($1, $2, $3)
        ON CONFLICT (folder_number) 
        DO UPDATE SET patient_name = EXCLUDED.patient_name
      `, [folderNumber, patientName, reviewDate]);

      // Then insert record
      const result = await client.query(`
        INSERT INTO records (
          patient_name, folder_number, review_date, 
          hospital_name, service_type, service_details, 
          fee, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes || null]);

      const record = result.rows[0];
      return res.status(200).json({ 
        success: true, 
        record: {
          id: Number(record.id),
          patientName: record.patient_name,
          folderNumber: record.folder_number,
          reviewDate: new Date(record.review_date).toISOString().split('T')[0],
          hospitalName: record.hospital_name,
          serviceType: record.service_type,
          serviceDetails: record.service_details,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: new Date(record.created_at).toISOString()
        }
      });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      
      const result = await client.query(`
        UPDATE records 
        SET patient_name = $1, folder_number = $2, review_date = $3,
            hospital_name = $4, service_type = $5, service_details = $6,
            fee = $7, notes = $8
        WHERE id = $9
        RETURNING *
      `, [
        data.patientName, data.folderNumber, data.reviewDate,
        data.hospitalName, data.serviceType, data.serviceDetails,
        parseFloat(data.fee), data.notes || null, id
      ]);

      const record = result.rows[0];
      return res.status(200).json({ 
        success: true, 
        record: {
          id: Number(record.id),
          patientName: record.patient_name,
          folderNumber: record.folder_number,
          reviewDate: new Date(record.review_date).toISOString().split('T')[0],
          hospitalName: record.hospital_name,
          serviceType: record.service_type,
          serviceDetails: record.service_details,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: new Date(record.created_at).toISOString()
        }
      });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query('DELETE FROM records WHERE id = $1', [id]);
      return res.status(200).json({ success: true, message: 'Record deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Records API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack 
    });
  } finally {
    if (client) client.release();
  }
}
