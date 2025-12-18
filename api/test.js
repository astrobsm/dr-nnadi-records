import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
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
