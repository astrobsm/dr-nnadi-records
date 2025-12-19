import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma Client with Accelerate
const prisma = new PrismaClient().$extends(withAccelerate());

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
      const patients = await prisma.patient.findMany({
        orderBy: { patientName: 'asc' },
        include: {
          _count: {
            select: { records: true }
          }
        }
      });

      return res.status(200).json({
        success: true,
        patients: patients.map(p => ({
          folderNumber: p.folderNumber,
          patientName: p.patientName,
          firstVisit: p.firstVisit.toISOString().split('T')[0],
          recordCount: p._count.records
        }))
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Prisma Patients API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
