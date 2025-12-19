import { createPool } from '@vercel/postgres';

// Create a connection pool with the Prisma Postgres URL
const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET all records with patients
    if (req.method === 'GET') {
      const { rows } = await pool.sql`
        SELECT 
          r.id,
          r.patient_name,
          r.folder_number,
          r.review_date,
          r.hospital_name,
          r.service_type,
          r.service_details,
          r.fee,
          r.notes,
          r.created_at
        FROM records r
        ORDER BY r.review_date DESC
      `;
      
      return res.status(200).json({
        success: true,
        records: rows.map(r => ({
          id: Number(r.id),
          patientName: r.patient_name,
          folderNumber: r.folder_number,
          reviewDate: r.review_date.toISOString().split('T')[0],
          hospitalName: r.hospital_name,
          serviceType: r.service_type,
          serviceDetails: r.service_details,
          fee: Number(r.fee),
          notes: r.notes || '',
          createdAt: r.created_at.toISOString()
        }))
      });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const { patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes, firstVisit } = req.body;

      // Upsert patient
      await pool.sql`
        INSERT INTO patients (folder_number, patient_name, first_visit)
        VALUES (${folderNumber}, ${patientName}, ${firstVisit || reviewDate})
        ON CONFLICT (folder_number) 
        DO UPDATE SET patient_name = ${patientName}
      `;

      // Create record
      const { rows } = await pool.sql`
        INSERT INTO records (
          patient_name, folder_number, review_date, hospital_name,
          service_type, service_details, fee, notes
        )
        VALUES (
          ${patientName}, ${folderNumber}, ${reviewDate}, ${hospitalName},
          ${serviceType}, ${serviceDetails}, ${fee}, ${notes || null}
        )
        RETURNING *
      `;

      const record = rows[0];
      return res.status(200).json({
        success: true,
        record: {
          id: Number(record.id),
          patientName: record.patient_name,
          folderNumber: record.folder_number,
          reviewDate: record.review_date.toISOString().split('T')[0],
          hospitalName: record.hospital_name,
          serviceType: record.service_type,
          serviceDetails: record.service_details,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: record.created_at.toISOString()
        }
      });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes } = req.body;

      const { rows } = await pool.sql`
        UPDATE records
        SET 
          patient_name = ${patientName},
          folder_number = ${folderNumber},
          review_date = ${reviewDate},
          hospital_name = ${hospitalName},
          service_type = ${serviceType},
          service_details = ${serviceDetails},
          fee = ${fee},
          notes = ${notes || null}
        WHERE id = ${id}
        RETURNING *
      `;

      const record = rows[0];
      return res.status(200).json({
        success: true,
        record: {
          id: Number(record.id),
          patientName: record.patient_name,
          folderNumber: record.folder_number,
          reviewDate: record.review_date.toISOString().split('T')[0],
          hospitalName: record.hospital_name,
          serviceType: record.service_type,
          serviceDetails: record.service_details,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: record.created_at.toISOString()
        }
      });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await pool.sql`
        DELETE FROM records WHERE id = ${id}
      `;

      return res.status(200).json({
        success: true,
        message: 'Record deleted'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
