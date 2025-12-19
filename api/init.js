import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const connectionString = (process.env.POSTGRES_PRISMA_URL || process.env.PRISMA_DATABASE_URL || '').replace(/^[`'"]|[`'"]$/g, '');

const prisma = global.prismaInit || new PrismaClient({
  datasourceUrl: connectionString
}).$extends(withAccelerate());

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
