import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = global.prisma || new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL || process.env.PRISMA_DATABASE_URL
}).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default async function handler(req, res) {
  try {
    // GET - Fetch all records
    if (req.method === 'GET') {
      const records = await prisma.record.findMany({
        orderBy: [{ reviewDate: 'desc' }, { createdAt: 'desc' }],
      });
      
      const rows = records.map(r => ({
        id: Number(r.id),
        patientName: r.patientName,
        folderNumber: r.folderNumber,
        reviewDate: r.reviewDate.toISOString().split('T')[0],
        hospitalName: r.hospitalName,
        serviceType: r.serviceType,
        serviceDetails: r.serviceDetails,
        fee: Number(r.fee),
        notes: r.notes || '',
        createdAt: r.createdAt.toISOString()
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

      // Upsert patient
      await prisma.patient.upsert({
        where: { folderNumber },
        update: { patientName },
        create: {
          folderNumber,
          patientName,
          firstVisit: new Date(reviewDate)
        }
      });

      // Create record
      const record = await prisma.record.create({
        data: {
          patientName,
          folderNumber,
          reviewDate: new Date(reviewDate),
          hospitalName,
          serviceType,
          serviceDetails,
          fee: parseFloat(fee),
          notes: notes || null
        }
      });

      return res.status(200).json({ 
        success: true, 
        record: {
          id: Number(record.id),
          patientName: record.patientName,
          folderNumber: record.folderNumber,
          reviewDate: record.reviewDate.toISOString().split('T')[0],
          hospitalName: record.hospitalName,
          serviceType: record.serviceType,
          serviceDetails: record.serviceDetails,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: record.createdAt.toISOString()
        }
      });
    }

    // PUT - Update record
    if (req.method === 'PUT') {
      const { id, ...data } = req.body;
      
      const record = await prisma.record.update({
        where: { id: BigInt(id) },
        data: {
          ...data,
          reviewDate: new Date(data.reviewDate),
          fee: parseFloat(data.fee),
          notes: data.notes || null
        }
      });

      return res.status(200).json({ 
        success: true, 
        record: {
          id: Number(record.id),
          patientName: record.patientName,
          folderNumber: record.folderNumber,
          reviewDate: record.reviewDate.toISOString().split('T')[0],
          hospitalName: record.hospitalName,
          serviceType: record.serviceType,
          serviceDetails: record.serviceDetails,
          fee: Number(record.fee),
          notes: record.notes || '',
          createdAt: record.createdAt.toISOString()
        }
      });
    }

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await prisma.record.delete({
        where: { id: BigInt(id) }
      });

      return res.status(200).json({ success: true, message: 'Record deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Records API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
