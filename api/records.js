import { createClient } from '@vercel/postgres';

export default async function handler(req, res) {
  const client = await createClient();
  await client.connect();
  
  try {
    // GET - Fetch all records
    if (req.method === 'GET') {
      const { rows } = await client.sql`
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
      `;
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
      await client.sql`
        INSERT INTO patients (folder_number, patient_name, first_visit)
        VALUES (${folderNumber}, ${patientName}, ${reviewDate})
        ON CONFLICT (folder_number) 
        DO UPDATE SET 
          patient_name = EXCLUDED.patient_name,
          first_visit = LEAST(patients.first_visit, EXCLUDED.first_visit)
      `;

      // Insert record
      const { rows } = await client.sql`
        INSERT INTO records 
          (patient_name, folder_number, review_date, hospital_name, 
           service_type, service_details, fee, notes)
        VALUES 
          (${patientName}, ${folderNumber}, ${reviewDate}, ${hospitalName},
           ${serviceType}, ${serviceDetails}, ${fee}, ${notes || ''})
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
      `;

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

      const { rows } = await client.sql`
        UPDATE records
        SET 
          patient_name = ${patientName},
          folder_number = ${folderNumber},
          review_date = ${reviewDate},
          hospital_name = ${hospitalName},
          service_type = ${serviceType},
          service_details = ${serviceDetails},
          fee = ${fee},
          notes = ${notes || ''}
        WHERE id = ${id}
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
      `;

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Record not found' });
      }

      return res.status(200).json({ success: true, record: rows[0] });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, error: 'ID required' });
      }

      await client.sql`DELETE FROM records WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Record deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Records API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    await client.end();
  }
}
