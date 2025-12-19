import { PrismaClient } from '@prisma/client';

const prisma = global.prismaPatients || new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') global.prismaPatients = prisma;

export default async function handler(req, res) {
  try {
    // GET - Fetch all patients
    if (req.method === 'GET') {
      const patients = await prisma.patient.findMany({
        orderBy: { patientName: 'asc' },
      });
      
      // Convert to object format for compatibility
      const patientsObj = {};
      patients.forEach(patient => {
        patientsObj[patient.folderNumber] = {
          folderNumber: patient.folderNumber,
          patientName: patient.patientName,
          firstVisit: patient.firstVisit.toISOString().split('T')[0],
          createdAt: patient.createdAt.toISOString()
        };
      });
      
      return res.status(200).json({ success: true, patients: patientsObj });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Patients API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
