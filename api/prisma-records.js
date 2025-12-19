import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma Client with Accelerate for edge runtime
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
    // GET all records with patients
    if (req.method === 'GET') {
      const records = await prisma.record.findMany({
        orderBy: { reviewDate: 'desc' },
        include: {
          patient: true
        }
      });
      
      return res.status(200).json({
        success: true,
        records: records.map(r => ({
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
        }))
      });
    }

    // POST - Create new record
    if (req.method === 'POST') {
      const { patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes, firstVisit } = req.body;

      // Upsert patient (create or update)
      await prisma.patient.upsert({
        where: { folderNumber },
        update: { patientName },
        create: {
          folderNumber,
          patientName,
          firstVisit: firstVisit ? new Date(firstVisit) : new Date(reviewDate)
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
      const { id, patientName, folderNumber, reviewDate, hospitalName, serviceType, serviceDetails, fee, notes } = req.body;

      const record = await prisma.record.update({
        where: { id: BigInt(id) },
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

    // DELETE - Delete record
    if (req.method === 'DELETE') {
      const { id } = req.query;

      await prisma.record.delete({
        where: { id: BigInt(id) }
      });

      return res.status(200).json({
        success: true,
        message: 'Record deleted'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Prisma API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
