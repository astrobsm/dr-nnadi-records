import { sql } from '@vercel/postgres';
import { createResponse } from './db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return createResponse({ success: true }, 200);
  }

  try {
    // GET - Fetch all records
    if (req.method === 'GET') {
      const { rows } = await sql`
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
      return createResponse({ success: true, records: rows });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        patientName,
        folderNumber,
        reviewDate,
        hospitalName,
        serviceType,
        serviceDetails,
        fee,
        notes
      } = body;

      // First, ensure patient exists or create it
      await sql`
        INSERT INTO patients (folder_number, patient_name, first_visit)
        VALUES (${folderNumber}, ${patientName}, ${reviewDate})
        ON CONFLICT (folder_number) 
        DO UPDATE SET 
          patient_name = EXCLUDED.patient_name,
          first_visit = LEAST(patients.first_visit, EXCLUDED.first_visit)
      `;

      // Insert record
      const { rows } = await sql`
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

      return createResponse({ success: true, record: rows[0] }, 201);
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const body = await req.json();
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
      } = body;

      const { rows } = await sql`
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
        return createResponse({ success: false, error: 'Record not found' }, 404);
      }

      return createResponse({ success: true, record: rows[0] });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return createResponse({ success: false, error: 'ID required' }, 400);
      }

      await sql`DELETE FROM records WHERE id = ${id}`;
      return createResponse({ success: true, message: 'Record deleted' });
    }

    return createResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Records API error:', error);
    return createResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
}
