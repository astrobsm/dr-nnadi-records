import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  const client = await db.connect();
  
  try {
    // GET - Fetch all records
    if (req.method === 'GET') {
      const { rows } = await client.query(`
        SELECT 
          id,
          patient_name as "patientName",
          folder_number as "folderNumber",
          review_date as "reviewDate",
          hospital_name as "hospitalName",
          service_type as "serviceType",
          service_details as "serviceDetails",
          fee,
          notes,
          created_at as "createdAt"
        FROM records
        ORDER BY review_date DESC, created_at DESC
      `);
      client.release();
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

      // First, ensure patient exists or create it
      await client.query(`
        INSERT INTO patients (folder_number, patient_name, first_visit)
        VALUES ($1, $2, $3)
        ON CONFLICT (folder_number) 
        DO UPDATE SET 
          patient_name = EXCLUDED.patient_name,
          first_visit = LEAST(patients.first_visit, EXCLUDED.first_visit)
      `, [folderNumber, patientName, reviewDate]);

      // Insert record
      const { rows } = await client.query(`
        INSERT INTO records 
          (patient_name, folder_number, review_date, hospital_name, 
           service_type, service_details, fee, notes)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING 
          id,
          patient_name as "patientName",
          folder_number as "folderNumber",
          review_date as "reviewDate",
          hospital_name as "hospitalName",
          service_type as "serviceType",
          service_details as "serviceDetails",
          fee,
          notes,
          created_at as "createdAt"
      `, [patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes || '']);

      client.release();
      return res.status(201).json({ success: true, record: rows[0] });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const {
        id,
        patientName,
        folderNumber,
        reviewDate,
        hospitalName,
        serviceType,
        serviceDetails,
        fee,
        notes
      } = req.body;

      const { rows } = await client.query(`
        UPDATE records
        SET 
          patient_name = $1,
          folder_number = $2,
          review_date = $3,
          hospital_name = $4,
          service_type = $5,
          service_details = $6,
          fee = $7,
          notes = $8
        WHERE id = $9
        RETURNING 
          id,
          patient_name as "patientName",
          folder_number as "folderNumber",
          review_date as "reviewDate",
          hospital_name as "hospitalName",
          service_type as "serviceType",
          service_details as "serviceDetails",
          fee,
          notes,
          created_at as "createdAt"
      `, [patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes || '', id]);

      if (rows.length === 0) {
        client.release();
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      client.release();
      return res.status(200).json({ success: true, record: rows[0] });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        client.release();
        return res.status(400).json({ success: false, error: 'ID required' });
      }

      await client.query('DELETE FROM records WHERE id = $1', [id]);
      client.release();
      return res.status(200).json({ success: true, message: 'Record deleted' });
    }

    client.release();
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    client.release();
    console.error('Records API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
