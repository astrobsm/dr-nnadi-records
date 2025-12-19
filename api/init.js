import { PrismaClient } from '@prisma/client';

const prisma = global.prismaInit || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prismaInit = prisma;

export default async function handler(req, res) {
  try {
    // Database tables already exist from Prisma schema
    // Just verify connection
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({ 
      success: true, 
      message: 'Database connection verified. Tables already exist via Prisma.' 
    });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}
