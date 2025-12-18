import { sql } from '@vercel/postgres';
import { createResponse } from './db.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return createResponse({ success: true }, 200);
  }

  try {
    // GET - Export all data
    if (req.method === 'GET') {
      const recordsResult = await sql`
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
        ORDER BY review_date DESC
      `;

      const patientsResult = await sql`
        SELECT 
          folder_number as "folderNumber",
          patient_name as "patientName",
          first_visit as "firstVisit"
        FROM patients
      `;

      const patients = {};
      patientsResult.rows.forEach(patient => {
        patients[patient.folderNumber] = patient;
      });

      return createResponse({
        success: true,
        data: {
          records: recordsResult.rows,
          patients: patients,
          exportDate: new Date().toISOString(),
          appVersion: '2.0'
        }
      });
    }

    // POST - Import/restore data
    if (req.method === 'POST') {
      const body = await req.json();
      const { records, patients, merge } = body;

      if (merge) {
        // Merge mode - add without removing existing data
        let recordsAdded = 0;
        let patientsAdded = 0;

        // Import patients
        for (const folderNumber in patients) {
          const patient = patients[folderNumber];
          try {
            await sql`
              INSERT INTO patients (folder_number, patient_name, first_visit)
              VALUES (${folderNumber}, ${patient.patientName}, ${patient.firstVisit})
              ON CONFLICT (folder_number) DO NOTHING
            `;
            patientsAdded++;
          } catch (err) {
            console.error('Error importing patient:', err);
          }
        }

        // Import records
        for (const record of records) {
          try {
            const { rows } = await sql`
              SELECT id FROM records WHERE id = ${record.id}
            `;
            
            if (rows.length === 0) {
              await sql`
                INSERT INTO records 
                  (id, patient_name, folder_number, review_date, hospital_name,
                   service_type, service_details, fee, notes, created_at)
                VALUES 
                  (${record.id}, ${record.patientName}, ${record.folderNumber}, 
                   ${record.reviewDate}, ${record.hospitalName}, ${record.serviceType},
                   ${record.serviceDetails}, ${record.fee}, ${record.notes || ''}, 
                   ${record.createdAt})
              `;
              recordsAdded++;
            }
          } catch (err) {
            console.error('Error importing record:', err);
          }
        }

        return createResponse({
          success: true,
          message: `Merged successfully: ${recordsAdded} records, ${patientsAdded} patients added`
        });
      } else {
        // Replace mode - clear and import
        await sql`TRUNCATE TABLE records RESTART IDENTITY CASCADE`;
        await sql`TRUNCATE TABLE patients RESTART IDENTITY CASCADE`;

        // Import patients
        for (const folderNumber in patients) {
          const patient = patients[folderNumber];
          await sql`
            INSERT INTO patients (folder_number, patient_name, first_visit)
            VALUES (${folderNumber}, ${patient.patientName}, ${patient.firstVisit})
          `;
        }

        // Import records
        for (const record of records) {
          await sql`
            INSERT INTO records 
              (patient_name, folder_number, review_date, hospital_name,
               service_type, service_details, fee, notes)
            VALUES 
              (${record.patientName}, ${record.folderNumber}, ${record.reviewDate},
               ${record.hospitalName}, ${record.serviceType}, ${record.serviceDetails},
               ${record.fee}, ${record.notes || ''})
          `;
        }

        return createResponse({
          success: true,
          message: `Restored successfully: ${records.length} records, ${Object.keys(patients).length} patients`
        });
      }
    }

    return createResponse({ success: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Backup API error:', error);
    return createResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
}
