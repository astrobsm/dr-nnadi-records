import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const result = await sql(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL)`SELECT NOW() as current_time`;
    
    return res.status(200).json({ 
      success: true, 
      message: 'Database connected',
      time: result.rows[0].current_time
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}
